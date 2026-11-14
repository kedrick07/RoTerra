// PLACEHOLDER DATA — replace with fetch('/data/*.json') once the real files arrive.
const years = Array.from({ length: 20 }, (_, i) => 2005 + i);
export const trends = {
  rainfall: { unit: "mm/yr", source: "NASA GPM IMERG (placeholder)",
    data: years.map((y, i) => ({ year: y, value: Math.round(2400 + i * 18 + Math.sin(i * 1.3) * 260) })) },
  temperature: { unit: "°C", source: "NASA POWER (placeholder)",
    data: years.map((y, i) => ({ year: y, value: +(26.4 + i * 0.04 + Math.sin(i) * 0.25).toFixed(2) })) },
  ndvi: { unit: "index", source: "NASA MODIS NDVI (placeholder)",
    data: years.map((y, i) => ({ year: y, value: +(0.62 - i * 0.003 + Math.sin(i * 0.9) * 0.05).toFixed(3) })) },
};
export const criteria = ["water", "income", "soil", "pest", "equipment"];
export const rotations = [
  { id: "A", name: "Paddy → Paddy → Fallow", scores: { water: 62, income: 40, soil: 70, pest: 55, equipment: 80 }, stability: 8 },
  { id: "B", name: "Paddy → Legume → Paddy", scores: { water: 78, income: 66, soil: 82, pest: 60, equipment: 70 }, stability: 71 },
  { id: "C", name: "Paddy → Maize → Paddy", scores: { water: 58, income: 72, soil: 52, pest: 64, equipment: 55 }, stability: 18 },
  { id: "D", name: "Paddy → Veg → Fallow", scores: { water: 50, income: 80, soil: 60, pest: 48, equipment: 40 }, stability: 3 },
];
export const fan = Array.from({ length: 12 }, (_, i) => {
  const m = 60 + (i > 3 ? (i - 3) * 0.6 : i * 1.5), s = i > 3 ? (i - 3) * 3 : 0;
  return { year: 2021 + i, median: +m.toFixed(1), b50: [Math.round(m - s), Math.round(m + s)], b90: [Math.round(m - s * 2), Math.round(m + s * 2)] };
});
export const validation = [
  { model: "Chronos-2", mae: "—", rmse: "—" },
  { model: "Linear-trend baseline", mae: "—", rmse: "—" },
];
export const claims = [
  ["Rainfall has shifted over 20 years", "NASA precipitation record", "Satellite grid, not plot gauge"],
  ["Greenness (NDVI) tracks crop vigour", "NASA NDVI", "Cloud gaps; not yield"],
  ["Rotation B suits wetter-variable years", "Crop-trait rules", "Needs local agronomist review"],
];
export const evidence = {
  rainfall: { title: "Rainfall trend", source: "NASA precipitation record (placeholder)", limit: "Satellite grid cell, not a plot rain gauge." },
  temperature: { title: "Temperature trend", source: "NASA POWER (placeholder)", limit: "Daily means; no heat-stress thresholds modelled." },
  ndvi: { title: "NDVI trend", source: "NASA MODIS (placeholder)", limit: "Cloud gaps in the wet season; greenness is not yield." },
  priorities: { title: "Priority weights", source: "Your slider values", limit: "Weights change ranking; they are not agronomic advice." },
  scores: { title: "Rule-based scores", source: "Crop-trait rules (placeholder)", limit: "Needs local agronomist review." },
};
