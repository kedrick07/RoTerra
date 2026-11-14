// Run with: node --test
// Uses Node's built-in test runner (no extra dependencies).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  bandForScore,
  computeTrendAdjustments,
  normalizeWeights,
  scoreRotations,
  traitToScore,
} from '../src/lib/scoring.js';
import { DIMENSIONS } from '../src/lib/scoringConfig.js';

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

const crops = fixture('crops');
const rotations = fixture('rotations');
const trends = fixture('trends');

const sliders = (value) => Object.fromEntries(DIMENSIONS.map((d) => [d, value]));
const sumWeights = (w) => DIMENSIONS.reduce((s, d) => s + w[d], 0);

// A flat rainfall series (no trend) for tests that should not be trend-adjusted.
const flatRainfall = {
  indicators: [{
    id: 'rainfall',
    label: 'Rainfall',
    values: Array.from({ length: 20 }, (_, i) => ({ year: 2005 + i, value: 500 })),
  }],
};

// ---------- normalization edge cases ----------

test('all sliders at 0 are treated as equal weights', () => {
  const { weights, notes } = normalizeWeights(sliders(0));
  for (const d of DIMENSIONS) assert.equal(weights[d], 0.2);
  assert.equal(notes.length, 1);
  assert.match(notes[0].reason, /treated as equal/);
});

test('all sliders at 100 give equal weights that sum to 1', () => {
  const { weights, notes } = normalizeWeights(sliders(100));
  for (const d of DIMENSIONS) assert.equal(weights[d], 0.2);
  assert.ok(Math.abs(sumWeights(weights) - 1) < 1e-12);
  assert.equal(notes.length, 0);
});

test('one slider at 100 and the rest at 0 puts all weight on that dimension', () => {
  const { weights } = normalizeWeights({ ...sliders(0), income: 100 });
  assert.equal(weights.income, 1);
  assert.equal(weights.water, 0);
});

test('out-of-range sliders are clamped to 0-100', () => {
  const { weights } = normalizeWeights({ ...sliders(100), water: 250, soil: -40 });
  // water clamps to 100, soil to 0 -> 4 dimensions share the weight
  assert.equal(weights.water, 0.25);
  assert.equal(weights.soil, 0);
});

test('a missing or non-number slider is rejected with a clear error', () => {
  const { pest, ...missingPest } = sliders(50);
  assert.throws(() => normalizeWeights(missingPest), /Slider "pest"/);
  assert.throws(() => normalizeWeights({ ...sliders(50), water: 'high' }), /Slider "water"/);
});

test('trend multipliers raise a dimension weight before normalizing', () => {
  const { weights } = normalizeWeights(sliders(50), { water: 1.5 });
  // raw: water 75, others 50 each -> total 275
  assert.ok(Math.abs(weights.water - 75 / 275) < 1e-12);
  assert.ok(Math.abs(sumWeights(weights) - 1) < 1e-12);
});

// ---------- traits ----------

test('water_need is inverted: high need gives a low water score', () => {
  assert.ok(Math.abs(traitToScore('water_need', 9) - 10) < 1e-9);
  assert.equal(traitToScore('income', 7), 70);
});

test('traits outside 0-10 are rejected', () => {
  assert.throws(() => traitToScore('income', 11), RangeError);
  assert.throws(() => traitToScore('income', undefined), TypeError);
});

// ---------- rating bands ----------

test('rating-band thresholds', () => {
  assert.equal(bandForScore(100), 'strong-fit');
  assert.equal(bandForScore(75), 'strong-fit');
  assert.equal(bandForScore(74.9), 'promising');
  assert.equal(bandForScore(60), 'promising');
  assert.equal(bandForScore(59.9), 'needs-review');
  assert.equal(bandForScore(45), 'needs-review');
  assert.equal(bandForScore(44.9), 'not-advised');
  assert.equal(bandForScore(0), 'not-advised');
});

// ---------- trend adjustments ----------

test('a 22% rainfall decline raises water weight 1.5x and explains why', () => {
  const { multipliers, adjustments } = computeTrendAdjustments(trends);
  assert.equal(multipliers.water, 1.5);
  const rain = adjustments.find((a) => a.indicatorId === 'rainfall' && a.type === 'trend');
  assert.equal(rain.changePct, -22);
  assert.match(rain.reason, /Rainfall fell 22% \(2020–2024 average vs 2005–2009 average/);
  assert.equal(rain.effect, 'Water weight 1.5×');
});

test('an NDVI decline of about 6% raises soil weight 1.25x', () => {
  const { multipliers } = computeTrendAdjustments(trends);
  assert.equal(multipliers.soil, 1.25);
});

test('only the strongest rainfall rule applies (1.5x, not 1.5 x 1.25)', () => {
  const { multipliers } = computeTrendAdjustments(trends);
  assert.equal(multipliers.water, 1.5);
});

test('missing trend data is reported, not silently ignored', () => {
  const { multipliers, adjustments } = computeTrendAdjustments({ indicators: [] });
  assert.equal(multipliers.water, 1);
  const rain = adjustments.find((a) => a.indicatorId === 'rainfall');
  assert.equal(rain.type, 'missing-data');
  assert.match(rain.reason, /No rainfall trend data/);
});

test('a short series (under 10 years) gives no adjustment and says so', () => {
  const short = { indicators: [{ id: 'rainfall', label: 'Rainfall', values: [{ year: 2020, value: 1 }] }] };
  const { multipliers, adjustments } = computeTrendAdjustments(short);
  assert.equal(multipliers.water, 1);
  assert.match(adjustments[0].reason, /fewer than 10 years/);
});

// ---------- determinism ----------

test('same inputs always give identical output', () => {
  const a = scoreRotations(rotations, crops, trends, sliders(50));
  const b = scoreRotations(rotations, crops, trends, sliders(50));
  assert.deepEqual(a, b);
});

test('ties are ordered by rotation id', () => {
  const twins = { rotations: [
    { id: 'b-rice', name: 'B', sequence: ['rice'] },
    { id: 'a-rice', name: 'A', sequence: ['rice'] },
  ] };
  const results = scoreRotations(twins, crops, flatRainfall, sliders(50));
  assert.deepEqual(results.map((r) => r.rotationId), ['a-rice', 'b-rice']);
});

// ---------- golden path with fixtures ----------
// Hand calculation (sliders all 50; rainfall -22% -> water x1.5; NDVI -6% -> soil x1.25):
//   raw weights: water 75, income 50, soil 62.5, pest 50, equipment 50 (total 287.5)
//   baseline (rice): water 10, income 70, soil 30, pest 10, equipment 100
//   total = (75*10 + 50*70 + 62.5*30 + 50*10 + 50*100) / 287.5 = 11625 / 287.5 = 40.43 -> 40.4
//   rice-safflower: water 40, income 60, soil 45, pest 45, equipment 80
//   total = (3000 + 3000 + 2812.5 + 2250 + 4000) / 287.5 = 15062.5 / 287.5 = 52.39 -> 52.4

test('golden path: fixture data, all sliders at 50', () => {
  const results = scoreRotations(rotations, crops, trends, sliders(50));

  assert.deepEqual(
    results.map((r) => [r.rank, r.rotationId, r.totalScore, r.band]),
    [
      [1, 'rice-safflower', 52.4, 'needs-review'],
      [2, 'rice-wheat', 50.2, 'needs-review'],
      [3, 'rice-sunflower', 49.1, 'needs-review'],
      [4, 'baseline', 40.4, 'not-advised'],
    ],
  );

  const baseline = results.find((r) => r.rotationId === 'baseline');
  assert.deepEqual(baseline.dimensions.water, { score: 10, weight: 0.2609, contribution: 2.6 });
  assert.deepEqual(baseline.dimensions.equipment, { score: 100, weight: 0.1739, contribution: 17.4 });

  // Every result explains the trend-driven changes.
  assert.ok(baseline.adjustments.some((a) => a.effect === 'Water weight 1.5×'));
  assert.ok(baseline.adjustments.some((a) => a.effect === 'Soil health weight 1.25×'));
});

test('raising the water slider moves low-water rotations further ahead of rice', () => {
  const balanced = scoreRotations(rotations, crops, trends, sliders(50));
  const waterFirst = scoreRotations(rotations, crops, trends, { ...sliders(20), water: 100 });
  const gap = (rs) =>
    rs.find((r) => r.rotationId === 'rice-safflower').totalScore -
    rs.find((r) => r.rotationId === 'baseline').totalScore;
  assert.ok(gap(waterFirst) > gap(balanced));
});

test('scoreRotations also accepts plain arrays', () => {
  const fromArrays = scoreRotations(rotations.rotations, crops.crops, trends, sliders(50));
  const fromFiles = scoreRotations(rotations, crops, trends, sliders(50));
  assert.deepEqual(fromArrays, fromFiles);
});

test('a rotation that names an unknown crop gives a clear error', () => {
  const bad = { rotations: [{ id: 'x', sequence: ['rice', 'kale'] }] };
  assert.throws(() => scoreRotations(bad, crops, trends, sliders(50)), /uses crop "kale"/);
});

// ---------- scenario (Sunday cut-line feature) ----------

test('scenario: rainfall -20% on a flat series triggers the 1.5x water rule', () => {
  const { multipliers, adjustments } = computeTrendAdjustments(flatRainfall, { rainfallDelta: -0.2 });
  assert.equal(multipliers.water, 1.5);
  assert.ok(adjustments.some((a) => a.type === 'scenario' && /what-if input/.test(a.reason)));
});

test('scenario: no scenario on a flat series means no water change', () => {
  const { multipliers } = computeTrendAdjustments(flatRainfall);
  assert.equal(multipliers.water, 1);
});

// ---------- decisions from real-data review (2026-11-14) ----------

const droppingRain = (extra) => ({
  indicators: [{
    id: 'rainfall',
    label: 'Annual rainfall',
    values: Array.from({ length: 20 }, (_, i) => ({ year: 2005 + i, value: i < 10 ? 800 : 580 })),
    ...extra,
  }],
});

test('a non-significant trend still adjusts, but the reason says it is not significant', () => {
  const { multipliers, adjustments } = computeTrendAdjustments(
    droppingRain({ trend_significant: false, trend: { p_value: 0.187, n_years: 20 } }),
  );
  assert.equal(multipliers.water, 1.5);
  const rain = adjustments[0];
  assert.equal(rain.significant, false);
  assert.equal(rain.pValue, 0.187);
  assert.match(rain.reason, /20-year trend is not statistically significant \(p = 0\.19\)/);
  assert.match(rain.reason, /recent dry years/);
  assert.equal(rain.sentence, undefined);
});

test('a significant trend has no caveat in the reason', () => {
  const { adjustments } = computeTrendAdjustments(
    droppingRain({ trend_significant: true, trend: { p_value: 0.01, n_years: 20 } }),
  );
  assert.equal(adjustments[0].significant, true);
  assert.doesNotMatch(adjustments[0].reason, /not statistically significant/);
});

test('only the baseline rotation is flagged isBaseline', () => {
  const results = scoreRotations(rotations, crops, trends, sliders(50));
  assert.deepEqual(results.filter((r) => r.isBaseline).map((r) => r.rotationId), ['baseline']);
});
