/**
 * Printer presets.
 *
 * Hand-entered from manufacturer specs. There is no free public API for
 * printer specifications, so this list is maintained by hand — but the slicer
 * projects publish machine profiles as JSON (OrcaSlicer's
 * `resources/profiles/<vendor>/machine/*.json` on GitHub covers most of these),
 * which is where to pull from if the list ever needs to be exhaustive.
 *
 *  buildVolume   mm, used to warn when a part will not fit
 *  avgWatts      average draw during a print, not the peak on the label
 *  throughput    grams per hour at 0.2 mm — the single most useful number here,
 *                and the one manufacturers never publish; these come from
 *                real-world prints and are deliberately conservative
 *  priceInr      typical street price in India, for the payback figure
 */
export const PRINTERS = [
  {
    id: 'bambu-a1-mini',
    label: 'Bambu Lab A1 mini',
    vendor: 'Bambu Lab',
    buildVolume: [180, 180, 180],
    avgWatts: 95,
    throughput: 14,
    priceInr: 25000,
    multiColour: 'AMS lite (4)',
  },
  {
    id: 'bambu-a1',
    label: 'Bambu Lab A1',
    vendor: 'Bambu Lab',
    buildVolume: [256, 256, 256],
    avgWatts: 110,
    throughput: 16,
    priceInr: 30900,
    multiColour: 'AMS lite (4)',
  },
  {
    id: 'bambu-p1s',
    label: 'Bambu Lab P1S',
    vendor: 'Bambu Lab',
    buildVolume: [256, 256, 256],
    avgWatts: 130,
    throughput: 18,
    priceInr: 52000,
    multiColour: 'AMS (4, expandable)',
  },
  {
    id: 'bambu-x1c',
    label: 'Bambu Lab X1 Carbon',
    vendor: 'Bambu Lab',
    buildVolume: [256, 256, 256],
    avgWatts: 140,
    throughput: 19,
    priceInr: 105000,
    multiColour: 'AMS (4, expandable)',
  },
  {
    id: 'bambu-h2d',
    label: 'Bambu Lab H2D',
    vendor: 'Bambu Lab',
    buildVolume: [350, 320, 325],
    avgWatts: 180,
    throughput: 24,
    priceInr: 155000,
    multiColour: 'Dual nozzle + AMS',
  },
  {
    id: 'prusa-mk4s',
    label: 'Prusa MK4S',
    vendor: 'Prusa',
    buildVolume: [250, 210, 220],
    avgWatts: 120,
    throughput: 13,
    priceInr: 95000,
    multiColour: 'MMU3 (5)',
  },
  {
    id: 'prusa-core-one',
    label: 'Prusa CORE One',
    vendor: 'Prusa',
    buildVolume: [250, 220, 270],
    avgWatts: 140,
    throughput: 16,
    priceInr: 120000,
    multiColour: 'MMU3 (5)',
  },
  {
    id: 'creality-k1c',
    label: 'Creality K1C',
    vendor: 'Creality',
    buildVolume: [220, 220, 250],
    avgWatts: 150,
    throughput: 17,
    priceInr: 45000,
    multiColour: 'None',
  },
  {
    id: 'creality-ender3v3',
    label: 'Creality Ender 3 V3',
    vendor: 'Creality',
    buildVolume: [220, 220, 250],
    avgWatts: 110,
    throughput: 11,
    priceInr: 22000,
    multiColour: 'None',
  },
  {
    id: 'elegoo-neptune4pro',
    label: 'Elegoo Neptune 4 Pro',
    vendor: 'Elegoo',
    buildVolume: [225, 225, 265],
    avgWatts: 115,
    throughput: 12,
    priceInr: 24000,
    multiColour: 'None',
  },
  {
    id: 'custom',
    label: 'Something else — I will type the numbers',
    vendor: '',
    buildVolume: [250, 250, 250],
    avgWatts: 120,
    throughput: 14,
    priceInr: 40000,
    multiColour: 'Unknown',
  },
];

export const printerById = (id) => PRINTERS.find((p) => p.id === id) || PRINTERS[0];
