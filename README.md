# batpod-printcalc

**Repo:** https://github.com/PrateekPatelBluvium9878/batpod-printcalc

A job-costing calculator for 3D print shops. Standalone — no backend, no database, no accounts; everything runs in the browser. Built alongside the Batpod Labs shop but useful to any small print business.

It exists to make one argument: **most print pricing counts filament and stops.** Filament is rarely the biggest line on a small part. Your own time usually is, and the printer wearing out is the cost nobody counts at all.

If you are an AI assistant working in this repo, read `CLAUDE.md` first.

## Stack

| Piece | What | Why |
|---|---|---|
| [Vite 6](https://vite.dev/) + React 19 | App | Static bundle; nothing to run in production |
| `src/calc.js` pure functions | The maths | Testable without a browser; liftable into an API later |
| Plain `node:assert` tests | Tests | 21 checks against hand-worked numbers, no framework |
| Plain CSS | Styling | One file |
| Vercel **or** GitHub Pages | Hosting | Both free; it is a static site |

## Running it

```bash
npm install
npm run dev      # http://localhost:5174  (5173 belongs to the admin)
npm test         # the costing checks
npm run build    # dist/
```

From the workspace root: `npm run printcalc`.

## What it works out

Per unit: filament, electricity, machine wear, your hands-on time, a failure allowance scaled by how fussy the material is. Per job: setup time, packaging, postage. Then a suggested price, the real margin, and three numbers that matter more than margin does:

- **Profit per print-hour** — the right way to compare two jobs when the printer is your constraint. A ₹249 keychain usually beats a ₹1,499 desk model on this, which is counter-intuitive until you see it.
- **Profit per hour of *your* time** — the right way to compare when *you* are the constraint, which is more often true.
- **Break-even units** — how many you must sell before the printer has paid for itself on this product.

## Two things it gets right that most calculators don't

**Margin is a share of the selling price, not a markup on cost.** A 60% markup leaves a 37.5% margin. The calculator targets the margin and solves for the price.

**Platform fees go in the same denominator.** Dividing by the margin and the fee separately quietly loses several points of margin — you end up paying part of the fee yourself. Solving `price − cost − price×fee = margin×price` holds the margin at exactly the target. There is a test for this, because it was wrong the first time.

## Where the data comes from

**Printers** (`src/data/printers.js`) are hand-entered from manufacturer specs. No free public API publishes printer specifications, and no manufacturer publishes throughput (grams per hour), which is the useful number — so those are conservative real-world figures. For an exhaustive list, the slicer projects publish machine profiles as JSON: OrcaSlicer's `resources/profiles/<vendor>/machine/*.json` covers most consumer printers.

**Filaments** (`src/data/filaments.js`) are Indian street prices, which drift. For a real catalogue, the [Open Filament Database](https://api.openfilamentdatabase.org/) publishes free JSON with no key (~2,000 filaments, rebuilt daily; JSON, CSV, SQLite, OrcaSlicer bundles). [SpoolmanDB](https://github.com/Donkie/SpoolmanDB) is a second option. Both carry densities and diameters reliably; prices are regional, so check those against what you pay.

Every preset is editable in the UI. They are a starting point, not a claim about your machine.

## The image upload

Preview only. Nothing is uploaded and nothing is read from the pixels — it is there so you can see what you are quoting. It is also the hook for mesh parsing later: parse an STL, and the weight and print time fill themselves in instead of being typed.

## Structure

```
index.html
src/main.jsx           mounts App
src/App.jsx            the one screen
src/calc.js            all the maths — pure functions, no React
src/calc.test.js       checks against hand-worked numbers
src/data/printers.js   printer presets (bed, watts, g/h, price, expected life)
src/data/filaments.js  filament presets (₹/kg, density, fail multiplier)
src/styles.css
vite.config.js         port 5174; reads VITE_BASE for sub-path hosting
vercel.json            SPA rewrite
.github/workflows/pages.yml   GitHub Pages deploy
```

## Deploying

### Vercel

Vite is detected: build `npm run build`, output `dist`. No environment variables.

### GitHub Pages (free, no Vercel)

`.github/workflows/pages.yml` builds on push to `main` and publishes to `https://prateekpatelbluvium9878.github.io/batpod-printcalc/`. Once: repo → Settings → Pages → Source: **GitHub Actions**. That is all — there is no API to point at.

## Customising

- **Default assumptions** (labour rate, electricity tariff, margin target, fail rates): `DEFAULT_SETTINGS` in `src/calc.js`.
- **Add a printer or filament:** append to the arrays in `src/data/`; the fields are commented at the top of each file.
- **Currency:** `rupees()` in `calc.js` is the only formatter.
- **A new output number:** compute it in `costJob()` so it is covered by `calc.test.js`, then render it in `App.jsx`.

## References used while building this

- Vite static deploy — https://vite.dev/guide/static-deploy.html
- Open Filament Database — https://api.openfilamentdatabase.org/
- SpoolmanDB — https://github.com/Donkie/SpoolmanDB
- OrcaSlicer machine profiles — https://github.com/SoftFever/OrcaSlicer/tree/main/resources/profiles
- Bambu Lab A1 specs — https://bambulab.com/en/a1
- Margin vs markup — https://www.investopedia.com/ask/answers/102714/whats-difference-between-profit-margin-and-markup.asp
