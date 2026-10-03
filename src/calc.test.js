/**
 * Costing tests. Plain node, no framework: `npm test`.
 *
 * ESM, so this file is run directly by node and imports the same module the UI does.
 */
import assert from 'node:assert';
import { costJob, DEFAULT_SETTINGS, fitsOnPlate, gramsFromVolume } from './calc.js';
import { printerById } from './data/printers.js';
import { filamentById } from './data/filaments.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

const a1 = printerById('bambu-a1');
const pla = filamentById('pla');
const tpu = filamentById('tpu-95a');

const keychain = { grams: 12, printHours: 0.6, handsOnMinutes: 7, setupMinutes: 5, quantity: 1 };

console.log('\nJob costing');

test('a basic job produces sane numbers', () => {
  const r = costJob(keychain, a1, pla, DEFAULT_SETTINGS);
  assert.ok(r.unitCost > 0);
  assert.ok(r.suggestedUnitPrice > r.unitCost, 'the suggested price must beat cost');
  assert.strictEqual(r.breakdown.length, 6);
});

test('margin is a share of price, not a markup on cost', () => {
  // The classic mistake. At a 60% target the price must be cost/0.4, not cost*1.6.
  const noFees = { ...DEFAULT_SETTINGS, platformFeePercent: 0, targetMarginPercent: 60 };
  const r = costJob(keychain, a1, pla, noFees);
  assert.ok(Math.abs(r.marginPercent - 60) < 1.5, `expected ~60% margin, got ${r.marginPercent}`);
  assert.ok(r.suggestedUnitPrice > r.unitCost * 2, 'a 60% margin is a 2.5x markup, not 1.6x');
});

test('platform fees come out of your margin, not the customer', () => {
  const free = costJob(keychain, a1, pla, { ...DEFAULT_SETTINGS, platformFeePercent: 0 });
  const fee = costJob(keychain, a1, pla, { ...DEFAULT_SETTINGS, platformFeePercent: 10 });
  assert.ok(fee.suggestedUnitPrice > free.suggestedUnitPrice, 'price should rise to absorb the fee');
  assert.ok(Math.abs(fee.marginPercent - free.marginPercent) < 2, 'margin should be preserved, not eaten');
});

test('setting your own price overrides the suggestion', () => {
  const r = costJob({ ...keychain, sellPrice: 249 }, a1, pla, DEFAULT_SETTINGS);
  assert.strictEqual(r.actualPrice, 249);
  assert.strictEqual(r.usingSuggestedPrice, false);
});

test('an underpriced job reports a low margin and warns', () => {
  const r = costJob({ ...keychain, sellPrice: 60 }, a1, pla, DEFAULT_SETTINGS);
  assert.ok(r.marginPercent < 30);
  assert.ok(r.warnings.some((w) => w.includes('30%')));
});

test('selling below cost gives a negative margin rather than nonsense', () => {
  const r = costJob({ ...keychain, sellPrice: 10 }, a1, pla, DEFAULT_SETTINGS);
  assert.ok(r.profitPerUnit < 0);
  assert.ok(r.marginPercent < 0);
  assert.strictEqual(r.breakEvenUnits, null, 'you never break even selling at a loss');
});

test('labour dominates small parts, and it says so', () => {
  const r = costJob(keychain, a1, pla, DEFAULT_SETTINGS);
  const labour = r.breakdown.find((b) => b.key === 'labour');
  const material = r.breakdown.find((b) => b.key === 'material');
  assert.ok(labour.perUnit > material.perUnit, 'seven minutes of attention beats 12g of PLA');
  assert.ok(r.warnings.some((w) => w.toLowerCase().includes('your time')));
});

test('quantity spreads the per-job costs', () => {
  const one = costJob({ ...keychain, quantity: 1 }, a1, pla, DEFAULT_SETTINGS).unitCost;
  const twenty = costJob({ ...keychain, quantity: 20 }, a1, pla, DEFAULT_SETTINGS).unitCost;
  assert.ok(twenty < one, `unit cost should fall with quantity (${twenty} vs ${one})`);
});

test('an expensive printer costs more per job through depreciation', () => {
  const cheap = costJob(keychain, printerById('creality-ender3v3'), pla, DEFAULT_SETTINGS).unitCost;
  const dear = costJob(keychain, printerById('bambu-h2d'), pla, DEFAULT_SETTINGS).unitCost;
  assert.ok(dear > cheap, 'a 1.55 lakh machine has to earn its keep');
});

test('fussy filament raises the failure allowance', () => {
  const withPla = costJob(keychain, a1, pla, DEFAULT_SETTINGS);
  const withTpu = costJob(keychain, a1, tpu, DEFAULT_SETTINGS);
  const scrapPla = withPla.breakdown.find((b) => b.key === 'scrap').perUnit;
  const scrapTpu = withTpu.breakdown.find((b) => b.key === 'scrap').perUnit;
  assert.ok(scrapTpu > scrapPla);
});

test('profit per print-hour is what you compare jobs on', () => {
  const quick = costJob({ grams: 12, printHours: 0.6, handsOnMinutes: 7, setupMinutes: 5, quantity: 1, sellPrice: 249 }, a1, pla, DEFAULT_SETTINGS);
  const slow = costJob({ grams: 150, printHours: 9, handsOnMinutes: 48, setupMinutes: 10, quantity: 1, sellPrice: 1499 }, a1, pla, DEFAULT_SETTINGS);
  assert.ok(quick.profitPerPrintHour > slow.profitPerPrintHour, 'the cheap keychain earns more per machine hour than the big model');
  assert.ok(slow.totalProfit > quick.totalProfit, 'even though the big model makes more per sale');
});

test('break-even counts how many you must sell to pay for the printer', () => {
  const r = costJob({ ...keychain, sellPrice: 249 }, a1, pla, DEFAULT_SETTINGS);
  assert.ok(r.breakEvenUnits > 0);
  assert.ok(Math.abs(r.breakEvenUnits - Math.ceil(a1.priceInr / r.profitPerUnit)) <= 1);
});

test('capacity ceiling is reported', () => {
  const r = costJob({ ...keychain, sellPrice: 249 }, a1, pla, DEFAULT_SETTINGS);
  assert.ok(r.maxUnitsPerMonth > 0);
  assert.ok(r.ceilingMonthlyProfit > 0);
});

test('zero quantity is treated as one rather than dividing by zero', () => {
  const r = costJob({ ...keychain, quantity: 0 }, a1, pla, DEFAULT_SETTINGS);
  assert.strictEqual(r.quantity, 1);
  assert.ok(Number.isFinite(r.unitCost));
});

test('an empty job does not produce NaN anywhere', () => {
  const r = costJob({}, a1, pla, DEFAULT_SETTINGS);
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `${k} is not a finite number`);
  }
});

console.log('\nPlate fit');

test('a part that fits is accepted', () => {
  assert.strictEqual(fitsOnPlate([100, 80, 50], a1).fits, true);
});

test('a part that is too tall is rejected', () => {
  assert.strictEqual(fitsOnPlate([100, 80, 400], a1).fits, false);
});

test('a part that fits only when rotated is accepted', () => {
  // 240 long fits the 256 plate on any axis
  assert.strictEqual(fitsOnPlate([40, 240, 40], printerById('bambu-a1')).fits, true);
});

test('the A1 mini rejects what the A1 accepts', () => {
  assert.strictEqual(fitsOnPlate([200, 200, 100], printerById('bambu-a1')).fits, true);
  assert.strictEqual(fitsOnPlate([200, 200, 100], printerById('bambu-a1-mini')).fits, false);
});

console.log('\nVolume to weight');

test('volume converts to a believable weight', () => {
  const g = gramsFromVolume(45, pla, 25);
  assert.ok(g > 15 && g < 50, `45 cm³ of PLA at 25% infill should be tens of grams, got ${g}`);
});

test('more infill means more grams', () => {
  assert.ok(gramsFromVolume(45, pla, 60) > gramsFromVolume(45, pla, 15));
});

console.log(`\n${passed} checks passed\n`);
