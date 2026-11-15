// Run with: node --test
// Checks that whatever is in public/data/ (placeholder now, real data later)
// passes the loader's shape checks and runs through the scoring engine.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { DATA_FILES, validateDataFile } from '../src/lib/data.js';
import { scoreRotations } from '../src/lib/scoring.js';

const load = (name) =>
  JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), 'utf8'));

const balanced = { water: 50, income: 50, soil: 50, pest: 50, equipment: 50 };

test('every public/data file exists and passes shape checks', () => {
  for (const name of DATA_FILES) {
    assert.deepEqual(validateDataFile(name, load(name)), [], `${name}.json has problems`);
  }
});

test('public/data runs through the scoring engine', () => {
  const results = scoreRotations(load('rotations'), load('crops'), load('trends'), balanced);
  assert.equal(results.length, load('rotations').rotations.length);
  for (const r of results) {
    assert.ok(r.totalScore >= 0 && r.totalScore <= 100, `${r.rotationId} score out of range`);
  }
});

test('changing priorities can change the ranking', () => {
  const top = (sliders) =>
    scoreRotations(load('rotations'), load('crops'), load('trends'), sliders)[0].rotationId;
  const waterFirst = top({ ...balanced, water: 100, income: 20 });
  const incomeFirst = top({ water: 10, income: 100, soil: 20, pest: 20, equipment: 50 });
  assert.notEqual(waterFirst, incomeFirst);
});
