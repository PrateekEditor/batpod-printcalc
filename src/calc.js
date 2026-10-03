/**
 * Job costing.
 *
 * Pure functions. Everything the UI shows comes from here, which is what makes
 * it testable and what stops two parts of the screen disagreeing.
 *
 * The thing this calculator exists to argue: most print-shop pricing ignores
 * labour, and labour is usually the largest single cost on a small part. A
 * ₹14 keychain with ₹30 of your attention in it is not a 90% margin job.
 */

const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const rupees = (n) => Math.round(n);

export const DEFAULT_SETTINGS = {
  electricityPerUnit: 9, // ₹ per kWh
  labourPerHour: 250, // what your time is worth
  failRate: 8, // %
  packagingPerOrder: 10, // ₹
  shippingPerOrder: 55, // ₹, if you absorb it
  platformFeePercent: 2, // payment gateway or marketplace cut
  targetMarginPercent: 60, // what you want to clear
  printerHoursPerDay: 12,
  machineLifeHours: 5000, // before you expect to replace or rebuild it
};

/**
 * @param {Object} job
 * @param {number} job.grams          filament per unit
 * @param {number} job.printHours     per unit
 * @param {number} job.handsOnMinutes per unit — removing supports, sanding, packing
 * @param {number} job.setupMinutes   once per job, not per unit
 * @param {number} job.quantity
 * @param {number} [job.sellPrice]    your price per unit, if you have one in mind
 * @param {Object} printer
 * @param {Object} filament
 * @param {Object} settings
 */
export function costJob(job, printer, filament, settings = DEFAULT_SETTINGS) {
  const qty = Math.max(1, parseInt(job.quantity, 10) || 1);
  const grams = Math.max(0, Number(job.grams) || 0);
  const printHours = Math.max(0, Number(job.printHours) || 0);
  const handsOnMinutes = Math.max(0, Number(job.handsOnMinutes) || 0);
  const setupMinutes = Math.max(0, Number(job.setupMinutes) || 0);

  // --- per unit ------------------------------------------------------------
  const materialPerUnit = grams * (filament.pricePerKg / 1000);
  const powerPerUnit = (printer.avgWatts / 1000) * printHours * settings.electricityPerUnit;

  // Machines wear out. Spreading the purchase across its working life is the
  // cost most hobby calculators leave out, and it is why a ₹1.5 lakh printer
  // needs more than a ₹25k one from the same job.
  const depreciationPerUnit = printHours * (printer.priceInr / settings.machineLifeHours);

  const labourPerUnit = (handsOnMinutes / 60) * settings.labourPerHour;

  // Failures scale with the material and the machine time already spent, and
  // fussy filaments fail more.
  const effectiveFailRate = (settings.failRate / 100) * (filament.difficulty || 1);
  const scrapPerUnit = (materialPerUnit + powerPerUnit) * effectiveFailRate;

  const unitCostBeforeJobCosts = materialPerUnit + powerPerUnit + depreciationPerUnit + labourPerUnit + scrapPerUnit;

  // --- per job -------------------------------------------------------------
  const setupCost = (setupMinutes / 60) * settings.labourPerHour;
  const perJobCosts = setupCost + settings.packagingPerOrder + settings.shippingPerOrder;

  const totalCost = unitCostBeforeJobCosts * qty + perJobCosts;
  const unitCost = totalCost / qty;

  // --- pricing -------------------------------------------------------------
  // Price so that margin is a share of the SELLING price, not a markup on cost.
  // Getting this backwards is the most common pricing mistake: a 60% markup
  // leaves a 37.5% margin, not 60%.
  //
  // The platform fee is also a share of the selling price, so it belongs in the
  // same denominator. Solving `price - cost - price*fee = margin*price` gives
  // price = cost / (1 - fee - margin), which holds the margin at exactly the
  // target whatever the fee is. Dividing by the two rates separately quietly
  // loses a few points of margin — the fee ends up partly paid by you.
  const feeRate = Math.min(0.9, Math.max(0, settings.platformFeePercent / 100));
  const maxMargin = Math.max(0, 0.95 - feeRate);
  const m = Math.min(maxMargin, Math.max(0, settings.targetMarginPercent / 100));
  const suggestedUnitPrice = unitCost / (1 - feeRate - m);

  const actualPrice = Number(job.sellPrice) > 0 ? Number(job.sellPrice) : suggestedUnitPrice;
  const feePerUnit = actualPrice * feeRate;
  const profitPerUnit = actualPrice - unitCost - feePerUnit;
  const marginPercent = actualPrice > 0 ? (profitPerUnit / actualPrice) * 100 : 0;

  const totalRevenue = actualPrice * qty;
  const totalProfit = profitPerUnit * qty;
  const totalPrintHours = printHours * qty;
  const totalHandsOnHours = (handsOnMinutes * qty + setupMinutes) / 60;

  // --- what it means -------------------------------------------------------
  const profitPerPrintHour = totalPrintHours > 0 ? totalProfit / totalPrintHours : 0;
  const profitPerHandsOnHour = totalHandsOnHours > 0 ? totalProfit / totalHandsOnHours : 0;

  // How many you must sell before the printer has paid for itself on this product.
  const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(printer.priceInr / profitPerUnit) : null;

  // Capacity ceiling: the printer is rarely the limit, but it is worth knowing.
  const monthlyPrintHours = settings.printerHoursPerDay * 30;
  const maxUnitsPerMonth = printHours > 0 ? Math.floor(monthlyPrintHours / printHours) : null;
  const ceilingMonthlyProfit = maxUnitsPerMonth !== null ? maxUnitsPerMonth * profitPerUnit : null;

  const breakdown = [
    { key: 'material', label: 'Filament', perUnit: round(materialPerUnit), total: round(materialPerUnit * qty), detail: `${grams} g of ${filament.label}` },
    { key: 'labour', label: 'Your time', perUnit: round(labourPerUnit), total: round(labourPerUnit * qty + setupCost), detail: `${handsOnMinutes} min each${setupMinutes ? ` + ${setupMinutes} min setup` : ''}` },
    { key: 'depreciation', label: 'Machine wear', perUnit: round(depreciationPerUnit), total: round(depreciationPerUnit * qty), detail: `${printHours} h of a ${settings.machineLifeHours} h life` },
    { key: 'scrap', label: 'Failed prints', perUnit: round(scrapPerUnit), total: round(scrapPerUnit * qty), detail: `${Math.round(effectiveFailRate * 100)}% allowance` },
    { key: 'power', label: 'Electricity', perUnit: round(powerPerUnit), total: round(powerPerUnit * qty), detail: `${printer.avgWatts} W for ${printHours} h` },
    { key: 'fulfilment', label: 'Packing and post', perUnit: round(perJobCosts / qty), total: round(perJobCosts), detail: 'Per order, not per unit' },
  ].sort((a, b) => b.total - a.total);

  const warnings = [];
  if (marginPercent < 30 && actualPrice > 0) {
    warnings.push('Under 30% margin leaves nothing for a discount, a reprint or a bad month.');
  }
  if (labourPerUnit > materialPerUnit * 2 && grams > 0) {
    warnings.push('Your time costs more than double the filament on this job. That is normal for small parts and it is why pricing on material alone loses money.');
  }
  if (printHours > 12) {
    warnings.push('Over 12 hours means this occupies the printer for a whole day. Check the profit per print-hour below, not just the margin.');
  }
  if (qty >= 10 && setupMinutes === 0) {
    warnings.push('No setup time on a batch of ten? Plate layout and the first-layer watch are real minutes — add them.');
  }

  return {
    quantity: qty,
    unitCost: rupees(unitCost),
    totalCost: rupees(totalCost),
    suggestedUnitPrice: rupees(suggestedUnitPrice),
    actualPrice: rupees(actualPrice),
    usingSuggestedPrice: !(Number(job.sellPrice) > 0),
    feePerUnit: rupees(feePerUnit),
    profitPerUnit: rupees(profitPerUnit),
    marginPercent: round(marginPercent),
    totalRevenue: rupees(totalRevenue),
    totalProfit: rupees(totalProfit),
    totalPrintHours: round(totalPrintHours),
    totalHandsOnHours: round(totalHandsOnHours),
    profitPerPrintHour: rupees(profitPerPrintHour),
    profitPerHandsOnHour: rupees(profitPerHandsOnHour),
    breakEvenUnits,
    maxUnitsPerMonth,
    ceilingMonthlyProfit: ceilingMonthlyProfit === null ? null : rupees(ceilingMonthlyProfit),
    breakdown,
    warnings,
  };
}

/** Does the part fit on the plate? Simple bounding-box check with a 5 mm margin. */
export function fitsOnPlate(dims, printer) {
  if (!dims || !dims.length) return { fits: true, unknown: true };
  const part = [...dims].map(Number).sort((a, b) => b - a);
  const plate = [...printer.buildVolume].sort((a, b) => b - a);
  const fits = part.every((d, i) => d + 5 <= plate[i]);
  return { fits, unknown: false, part, plate };
}

/** Grams from a model's volume, when someone knows the volume but not the weight. */
export function gramsFromVolume(volumeCm3, filament, infillPercent = 25, solidity = 0.6) {
  const effective = Number(volumeCm3) * solidity * (0.9 + (infillPercent / 100) * 0.6);
  return round(effective * filament.density);
}

export { round, rupees };
