# batpod-printcalc

A job costing calculator for 3D print shops. Standalone — no backend, no database, no accounts. Everything runs in the browser.

It exists to make one argument: **most print pricing counts filament and stops.** Filament is rarely the biggest line on a small part. Your own time usually is, and the printer wearing out is the cost nobody counts at all.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 21 costing checks, no framework
```

## What it works out

Per unit: filament, electricity, machine wear, your hands-on time, a failure allowance scaled by how fussy the material is. Per job: setup time, packaging, postage. Then a suggested price, the real margin, and three numbers that matter more than margin does:

- **Profit per print-hour** — the right way to compare two jobs when the printer is your constraint. A ₹249 keychain usually beats a ₹1,499 desk model on this, which is counter-intuitive until you see it.
- **Profit per hour of *your* time** — the right way to compare when *you* are the constraint, which is more often true.
- **Break-even units** — how many you must sell before the printer has paid for itself on this product.

## Two things it gets right that most calculators don't

**Margin is a share of the selling price, not a markup on cost.** A 60% markup leaves a 37.5% margin. The calculator targets the margin and solves for the price.

**Platform fees go in the same denominator.** Dividing by the margin and the fee separately quietly loses several points of margin — you end up paying part of the fee yourself. Solving `price − cost − price×fee = margin×price` holds the margin at exactly the target. There's a test for this, because it was wrong the first time.

## Where the data comes from

**Printers** are hand-entered from manufacturer specs. There is no free public API for printer specifications. The throughput figures (grams per hour) are the useful ones and no manufacturer publishes them, so those are conservative real-world numbers. If the list ever needs to be exhaustive, the slicer projects publish machine profiles as JSON — OrcaSlicer's `resources/profiles/<vendor>/machine/*.json` on GitHub covers most consumer printers.

**Filaments** are Indian street prices, which drift. For a real catalogue, the [Open Filament Database](https://api.openfilamentdatabase.org/) publishes free JSON with no API key — around 2,000 filaments from 174 brands, rebuilt daily, available as JSON, CSV, SQLite and OrcaSlicer bundles. [SpoolmanDB](https://github.com/Donkie/SpoolmanDB) is a second option. Both carry densities and diameters reliably; prices are regional, so those still want checking against what you actually pay.

Every preset is editable in the UI. They're a starting point, not a claim about your machine.

## The image upload

Preview only. Nothing is uploaded and nothing is read from the pixels — it's there so you can see what you're quoting. It is also the hook for mesh parsing later: parse an STL, and the weight and print time fill themselves in instead of being typed.

## Deploying

Vercel detects Vite. Build `npm run build`, output `dist`. No environment variables, nothing to configure — it's a static site.

## Structure

```
src/calc.js            All the maths. Pure functions, no React.
src/calc.test.js       21 checks against hand-worked numbers.
src/data/printers.js   Printer presets.
src/data/filaments.js  Filament presets.
src/App.jsx            The one screen.
```

All the logic lives in `calc.js` precisely so it can be tested without a browser, and so it could be lifted into an API later without touching the UI.
