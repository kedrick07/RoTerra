// RoTerra rule-based scoring engine.
// Pure functions only: no React, no fetch, no Date, no randomness.
// Same inputs always give the same output.
//
// Contract used by the UI:
//   scoreRotations(rotations, crops, trends, weights, scenario = null)
//   -> [{ rotationId, name, isBaseline, rank, totalScore, band,
//         dimensions: { water: { score, weight, contribution }, ... },
//         adjustments: [{ reason, effect, ... }] }]
// `weights` are the five slider values (0-100). Every constant lives in
// scoringConfig.js.

import {
  BANDS,
  BASELINE_ROTATION_ID,
  REQUIRE_SIGNIFICANT_TREND,
  DIMENSIONS,
  DIMENSION_LABELS,
  INVERTED_TRAITS,
  SCORE_DECIMALS,
  SLIDER_MAX,
  SLIDER_MIN,
  TRAIT_FOR_DIMENSION,
  TRAIT_SCALE_MAX,
  TREND_RULES,
  TREND_WINDOW_YEARS,
} from './scoringConfig.js';

// ---------- small helpers ----------

export function roundScore(value, decimals = SCORE_DECIMALS) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Accept either the raw JSON file ({ crops: [...] }) or the array itself.
function unwrap(input, key) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input[key])) return input[key];
  throw new TypeError(`Expected an array or an object with a "${key}" array.`);
}

function mean(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function formatMultiplier(m) {
  return `${m}×`;
}

// ---------- bands ----------

export function bandForScore(totalScore) {
  const band = BANDS.find((b) => totalScore >= b.min);
  return band.id;
}

// ---------- traits -> dimension scores ----------

// Turns one crop trait (0..10) into a 0..100 score where higher is better.
export function traitToScore(traitName, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Trait "${traitName}" must be a number, got ${JSON.stringify(value)}.`);
  }
  if (value < 0 || value > TRAIT_SCALE_MAX) {
    throw new RangeError(`Trait "${traitName}" must be between 0 and ${TRAIT_SCALE_MAX}, got ${value}.`);
  }
  const fraction = value / TRAIT_SCALE_MAX;
  const better = INVERTED_TRAITS.includes(traitName) ? 1 - fraction : fraction;
  return better * 100;
}

// A rotation's score on one dimension = average over the crops in its sequence.
export function rotationDimensionScores(rotation, cropsById) {
  if (!Array.isArray(rotation.sequence) || rotation.sequence.length === 0) {
    throw new Error(`Rotation "${rotation.id}" has an empty crop sequence.`);
  }
  const scores = {};
  for (const dimension of DIMENSIONS) {
    const traitName = TRAIT_FOR_DIMENSION[dimension];
    const perCrop = rotation.sequence.map((cropId) => {
      const crop = cropsById.get(cropId);
      if (!crop) {
        throw new Error(`Rotation "${rotation.id}" uses crop "${cropId}", which is not in crops.json.`);
      }
      return traitToScore(traitName, crop.traits?.[traitName]);
    });
    scores[dimension] = mean(perCrop);
  }
  return scores;
}

// ---------- NASA trends -> weight multipliers ----------

// Percent change between the average of the first and last N years.
// Returns null when there are not enough valid values.
export function trendChange(indicator, windowYears = TREND_WINDOW_YEARS, recentFactor = 1) {
  const valid = (indicator.values || [])
    .filter((v) => typeof v.value === 'number' && Number.isFinite(v.value))
    .slice()
    .sort((a, b) => a.year - b.year);
  if (valid.length < windowYears * 2) return null;

  const first = valid.slice(0, windowYears);
  const last = valid.slice(-windowYears);
  const firstMean = mean(first.map((v) => v.value));
  const lastMean = mean(last.map((v) => v.value)) * recentFactor;
  if (firstMean === 0) return null;

  return {
    changePct: ((lastMean - firstMean) / Math.abs(firstMean)) * 100,
    firstPeriod: `${first[0].year}–${first[first.length - 1].year}`,
    lastPeriod: `${last[0].year}–${last[last.length - 1].year}`,
  };
}

// Reads the significance fields Kedrick's pipeline adds to each indicator.
// significant: true | false | null (null = not reported).
export function trendSignificance(indicator) {
  const significant = typeof indicator.trend_significant === 'boolean' ? indicator.trend_significant : null;
  const pValue = typeof indicator.trend?.p_value === 'number' ? indicator.trend.p_value : null;
  const years = indicator.trend?.n_years;
  const span = typeof years === 'number' ? `${years}-year` : 'long-term';
  const pText = pValue === null ? '' : ` (p = ${pValue.toFixed(2)})`;
  return {
    significant,
    pValue,
    sentence: `The ${span} trend is not statistically significant${pText},`,
  };
}

function ruleMatches(rule, changePct) {
  if (rule.direction === 'decrease') return changePct <= -rule.thresholdPct;
  if (rule.direction === 'increase') return changePct >= rule.thresholdPct;
  return false;
}

// Groups TREND_RULES by indicator + dimension, keeping config order.
function ruleGroups() {
  const groups = new Map();
  for (const rule of TREND_RULES) {
    const key = `${rule.indicatorId}|${rule.dimension}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rule);
  }
  return [...groups.values()];
}

// Reads trends.json and returns one multiplier per dimension plus a plain
// explanation of every check. Scenario inputs are labelled as such.
export function computeTrendAdjustments(trends, scenario = null) {
  const indicators = trends ? unwrap(trends, 'indicators') : [];
  const multipliers = Object.fromEntries(DIMENSIONS.map((d) => [d, 1]));
  const adjustments = [];

  const rainfallDelta = scenario?.rainfallDelta ?? 0;
  if (typeof rainfallDelta !== 'number' || !Number.isFinite(rainfallDelta) || rainfallDelta <= -1) {
    throw new RangeError(`scenario.rainfallDelta must be a number above -1, got ${rainfallDelta}.`);
  }
  if (rainfallDelta !== 0) {
    const pct = Math.round(Math.abs(rainfallDelta) * 100);
    adjustments.push({
      type: 'scenario',
      indicatorId: 'rainfall',
      reason: `Scenario: rainfall set ${pct}% ${rainfallDelta < 0 ? 'lower' : 'higher'} than the recent average. This is a what-if input, not an observation.`,
      effect: 'Scenario input',
    });
  }

  for (const rules of ruleGroups()) {
    const { indicatorId, dimension } = rules[0];
    const dimLabel = DIMENSION_LABELS[dimension].toLowerCase();
    const indicator = indicators.find((i) => i.id === indicatorId);

    if (!indicator) {
      adjustments.push({
        type: 'missing-data',
        indicatorId,
        dimension,
        multiplier: 1,
        reason: `No ${indicatorId} trend data was available, so the ${dimLabel} priority was not adjusted.`,
        effect: 'No change',
      });
      continue;
    }

    const recentFactor = indicatorId === 'rainfall' ? 1 + rainfallDelta : 1;
    const change = trendChange(indicator, TREND_WINDOW_YEARS, recentFactor);
    const label = indicator.label || indicatorId;

    if (!change) {
      adjustments.push({
        type: 'missing-data',
        indicatorId,
        dimension,
        multiplier: 1,
        reason: `${label} has fewer than ${TREND_WINDOW_YEARS * 2} years of usable data, so the ${dimLabel} priority was not adjusted.`,
        effect: 'No change',
      });
      continue;
    }

    const shownPct = Math.round(Math.abs(change.changePct));
    const verb = change.changePct < 0 ? 'fell' : 'rose';
    const basis = `${change.lastPeriod} average vs ${change.firstPeriod} average${indicator.source ? `; source: ${indicator.source}` : ''}`;
    const matched = rules.find((rule) => ruleMatches(rule, change.changePct));
    const significance = trendSignificance(indicator);
    const { sentence: _sentence, ...significanceFields } = significance;

    if (matched && REQUIRE_SIGNIFICANT_TREND && significance.significant === false) {
      adjustments.push({
        type: 'trend',
        indicatorId,
        dimension,
        multiplier: 1,
        changePct: roundScore(change.changePct),
        ...significanceFields,
        reason: `${label} ${verb} ${shownPct}% (${basis}). ${significance.sentence} so the ${dimLabel} priority was not adjusted.`,
        effect: 'No change',
      });
    } else if (matched) {
      multipliers[dimension] *= matched.multiplier;
      const caveat = significance.significant === false
        ? ` ${significance.sentence} so this may reflect recent ${verb === 'fell' ? 'dry' : 'wet'} years rather than a long-term shift.`
        : '';
      adjustments.push({
        type: 'trend',
        indicatorId,
        dimension,
        multiplier: matched.multiplier,
        changePct: roundScore(change.changePct),
        ...significanceFields,
        reason: `${label} ${verb} ${shownPct}% (${basis}).${caveat} Your ${dimLabel} priority counts ${formatMultiplier(matched.multiplier)} as much.`,
        effect: `${DIMENSION_LABELS[dimension]} weight ${formatMultiplier(matched.multiplier)}`,
      });
    } else {
      adjustments.push({
        type: 'trend',
        indicatorId,
        dimension,
        multiplier: 1,
        changePct: roundScore(change.changePct),
        reason: `${label} ${verb} ${shownPct}% (${basis}). That is below the threshold for changing the ${dimLabel} priority.`,
        effect: 'No change',
      });
    }
  }

  return { multipliers, adjustments };
}

// ---------- sliders -> normalized weights ----------

// Sliders (0-100 each) x trend multipliers, then scaled so weights sum to 1.
// If every slider is 0, all priorities are treated as equal.
export function normalizeWeights(sliders, multipliers = {}) {
  if (!sliders || typeof sliders !== 'object') {
    throw new TypeError('Slider values must be an object like { water: 50, income: 50, ... }.');
  }
  const notes = [];
  const clamped = {};
  for (const d of DIMENSIONS) {
    const v = sliders[d];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new TypeError(`Slider "${d}" must be a number, got ${JSON.stringify(v)}.`);
    }
    clamped[d] = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, v));
  }

  const allZero = DIMENSIONS.every((d) => clamped[d] === 0);
  if (allZero) {
    notes.push({
      type: 'priorities',
      reason: 'All priorities are set to 0, so they are treated as equal.',
      effect: 'Equal weights',
    });
  }

  const raw = {};
  for (const d of DIMENSIONS) {
    const base = allZero ? 1 : clamped[d];
    raw[d] = base * (multipliers[d] ?? 1);
  }
  const total = DIMENSIONS.reduce((sum, d) => sum + raw[d], 0);
  const weights = Object.fromEntries(DIMENSIONS.map((d) => [d, raw[d] / total]));
  return { weights, notes };
}

// ---------- main entry point ----------

export function scoreRotations(rotations, crops, trends, weights, scenario = null) {
  const rotationList = unwrap(rotations, 'rotations');
  const cropList = unwrap(crops, 'crops');
  const cropsById = new Map(cropList.map((c) => [c.crop_id, c]));

  const { multipliers, adjustments: trendAdjustments } = computeTrendAdjustments(trends, scenario);
  const { weights: normalized, notes } = normalizeWeights(weights, multipliers);
  const adjustments = [...trendAdjustments, ...notes];

  const results = rotationList.map((rotation) => {
    const scores = rotationDimensionScores(rotation, cropsById);
    const dimensions = {};
    let total = 0;
    for (const d of DIMENSIONS) {
      const contribution = normalized[d] * scores[d];
      total += contribution;
      dimensions[d] = {
        score: roundScore(scores[d]),
        weight: roundScore(normalized[d], 4),
        contribution: roundScore(contribution),
      };
    }
    const totalScore = roundScore(total);
    return {
      rotationId: rotation.id,
      name: rotation.name,
      isBaseline: rotation.id === BASELINE_ROTATION_ID,
      totalScore,
      band: bandForScore(totalScore),
      dimensions,
      adjustments,
    };
  });

  // Highest score first; ties broken by id so the order never changes.
  results.sort((a, b) => b.totalScore - a.totalScore || (a.rotationId < b.rotationId ? -1 : a.rotationId > b.rotationId ? 1 : 0));
  return results.map((r, i) => ({ ...r, rank: i + 1 }));
}
