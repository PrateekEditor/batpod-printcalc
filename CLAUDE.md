# CLAUDE.md — batpod-printcalc

For AI assistants working in this repo.

## Picture

A single-screen Vite + React 19 app with all logic in `src/calc.js` (pure functions) and presets in `src/data/`. No API, no storage, no routing. Part of the Batpod Labs workspace but independent of the other three repos.

## Commands

```bash
npm install
npm run dev      # :5174 (pinned; the admin owns 5173)
npm test         # node src/calc.test.js
npm run build
```

Owner's terminals: 1 server, 2 shop, 3 admin, 4 other. **No `# comments` on command lines.** Builds fail in the owner's Linux bridge VM (macOS rollup binary); verify in a Linux scratch copy or on his Mac.

## Rules

- **Maths goes in `calc.js`, never in `App.jsx`.** Every number on screen comes from `costJob()`; the UI only formats.
- **Every change to `calc.js` gets a check in `calc.test.js`** with a hand-worked expected value, not a snapshot. The margin-and-fee case (`price − cost − price×fee = margin×price`) is the one that was wrong once; keep its test.
- Margin means share of selling price. Markup means share of cost. Do not mix the words.
- Rupees via `rupees()`; round only at display time.
- Presets are data, not code: add rows to `src/data/*.js`, with the units in the field comments.
- `vite.config.js` reads `VITE_BASE` for GitHub Pages (`/batpod-printcalc/`); Vercel uses `/`.

## Possible next steps the owner has mentioned

- STL parsing in the browser to fill weight and time from a mesh (the image upload is the placeholder for it).
- Pulling filament presets from the Open Filament Database instead of hand entry.
- Sharing `calc.js` with `batpod-server/src/pricing/costing.js`, which models the same costs for the shop's margins.

## Git

Author `Prateek Patel <prateekpatel9878@gmail.com>`. Assistants commit, owner pushes.
