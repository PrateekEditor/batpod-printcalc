/**
 * Filament presets — Indian street prices per kg, which is what actually
 * decides your margin and is never what the spool page says.
 *
 * For a real catalogue, the Open Filament Database publishes free JSON with no
 * API key (api.openfilamentdatabase.org) covering a couple of thousand
 * filaments. It carries densities and diameters reliably; prices are regional,
 * so those still want checking against what you actually pay.
 *
 *  density      g/cm³, for converting a model's volume to weight
 *  pricePerKg   ₹ — change this to what YOU pay, it is the biggest lever here
 *  difficulty   multiplier on the failure rate; TPU fails more than PLA
 *  nozzleTemp   for reference when you are setting a job up
 */
export const FILAMENTS = [
  { id: 'pla', label: 'PLA', density: 1.24, pricePerKg: 1200, difficulty: 1.0, nozzleTemp: 215 },
  { id: 'pla-plus', label: 'PLA+ / PLA Pro', density: 1.24, pricePerKg: 1500, difficulty: 1.0, nozzleTemp: 220 },
  { id: 'pla-silk', label: 'PLA Silk', density: 1.24, pricePerKg: 1900, difficulty: 1.1, nozzleTemp: 225 },
  { id: 'pla-matte', label: 'PLA Matte', density: 1.27, pricePerKg: 1700, difficulty: 1.05, nozzleTemp: 220 },
  { id: 'petg', label: 'PETG', density: 1.27, pricePerKg: 1500, difficulty: 1.15, nozzleTemp: 240 },
  { id: 'abs', label: 'ABS', density: 1.04, pricePerKg: 1400, difficulty: 1.35, nozzleTemp: 250 },
  { id: 'asa', label: 'ASA', density: 1.07, pricePerKg: 2200, difficulty: 1.35, nozzleTemp: 255 },
  { id: 'tpu-95a', label: 'TPU 95A (flexible)', density: 1.21, pricePerKg: 2600, difficulty: 1.6, nozzleTemp: 230 },
  { id: 'pla-cf', label: 'PLA Carbon Fibre', density: 1.3, pricePerKg: 3200, difficulty: 1.25, nozzleTemp: 230 },
  { id: 'petg-cf', label: 'PETG Carbon Fibre', density: 1.3, pricePerKg: 3600, difficulty: 1.3, nozzleTemp: 250 },
  { id: 'pa-cf', label: 'Nylon CF', density: 1.18, pricePerKg: 5200, difficulty: 1.7, nozzleTemp: 280 },
];

export const filamentById = (id) => FILAMENTS.find((f) => f.id === id) || FILAMENTS[0];
