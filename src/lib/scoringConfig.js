// RoTerra scoring constants — the ONLY place to tune the engine.
// Every number here is an illustrative, human-chosen assumption, not a
// measured value. Changes should be logged in docs/decisions.md.

// The five farmer-priority dimensions, in display order.
export const DIMENSIONS = ['water', 'income', 'soil', 'pest', 'equipment'];

export const DIMENSION_LABELS = {
  water: 'Water',
  income: 'Income',
  soil: 'Soil health',
  pest: 'Pest break',
  equipment: 'Equipment fit',
};

// Which crop trait (crops.json -> traits) feeds each dimension.
export const TRAIT_FOR_DIMENSION = {
  water: 'water_need',
  income: 'income',
  soil: 'soil_health',
  pest: 'pest_break',
  equipment: 'equipment_fit',
};

// Traits where a HIGH value is BAD for the farmer (so the score is flipped).
// High water_need -> low water score.
export const INVERTED_TRAITS = ['water_need'];

// Crop traits are on a 0..TRAIT_SCALE_MAX scale. Dimension scores are 0..100.
export const TRAIT_SCALE_MAX = 10;

// Slider range coming from the UI.
export const SLIDER_MIN = 0;
export const SLIDER_MAX = 100;

// Rating bands, checked top to bottom against the rounded total score (0..100).
export const BANDS = [
  { id: 'strong-fit', label: 'Strong fit', min: 75 },
  { id: 'promising', label: 'Promising', min: 60 },
  { id: 'needs-review', label: 'Needs review', min: 45 },
  { id: 'not-advised', label: 'Not advised now', min: -Infinity },
];

// Trend change = average of the last N years vs the first N years of a series.
export const TREND_WINDOW_YEARS = 5;

// Trend -> weight rules. For each indicator + dimension pair, only the
// STRONGEST matching rule applies (list stronger rules first).
// thresholdPct is a size of change, e.g. 20 means "a change of 20% or more".
export const TREND_RULES = [
  { indicatorId: 'rainfall', direction: 'decrease', thresholdPct: 20, dimension: 'water', multiplier: 1.5 },
  { indicatorId: 'rainfall', direction: 'decrease', thresholdPct: 10, dimension: 'water', multiplier: 1.25 },
  { indicatorId: 'ndvi', direction: 'decrease', thresholdPct: 5, dimension: 'soil', multiplier: 1.25 },
];

// Decimal places used when rounding scores for output.
export const SCORE_DECIMALS = 1;
