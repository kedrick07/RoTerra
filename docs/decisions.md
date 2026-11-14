# RoTerra — Decision Log

*Short entries, newest at the bottom. Record anything that changes a contract, a formula, or a team-wide assumption.*

---

## 2026-11-14 — Scoring engine v1 (Aizad)

**Files:** `src/lib/scoringConfig.js`, `src/lib/scoring.js`, `src/lib/data.js`, `tests/`

All tunable numbers live in `src/lib/scoringConfig.js`. Every value below is an **illustrative assumption chosen by the team**, not a measured result, and needs local agronomic review.

### How a score is calculated

1. **Crop traits use a 0–10 scale** (in `crops.json`). Each trait becomes a 0–100 dimension score.
   `water_need` is inverted: a high water need gives a low water score.
2. **Trait → dimension mapping:** `water_need` → water, `income` → income, `soil_health` → soil, `pest_break` → pest, `equipment_fit` → equipment.
3. **Multi-crop rotations:** a rotation's dimension score is the plain average over the crops in its `sequence`, which assumes each crop takes an equal share of the cycle.
   *Known simplification:* pest break is really a property of the sequence, not of one crop. Averaging is an approximation and should be listed in `info_gaps`.
4. **Sliders** (0–100 each) are clamped to 0–100, multiplied by any trend multiplier, then normalised so the weights sum to 1.
   If every slider is 0, all priorities count equally, and the output says so.
5. **Total score** = Σ (weight × dimension score), on a 0–100 scale, rounded to 1 decimal.
   Each dimension reports `{ score, weight, contribution }`. Rounded contributions may differ from the rounded total by ±0.1.
6. **Rating bands** are applied to the rounded total:
   75 or more → `strong-fit`; 60 or more → `promising`; 45 or more → `needs-review`; anything lower → `not-advised`.
7. **Ordering:** highest score first; ties are broken by rotation `id`, so the output is deterministic.

### How the NASA trends change the weights

- **Trend change** = average of the last 5 years vs the first 5 years of the series (needs at least 10 valid years).
- **Rules** (only the strongest matching rule per indicator applies):
  - Rainfall fell 20% or more → water weight ×1.5
  - Rainfall fell 10% or more → water weight ×1.25
  - NDVI fell 5% or more → soil weight ×1.25
- Multipliers scale the farmer's slider. If the farmer sets water to 0, the trend cannot raise it, because the farmer's priority stays in control.
- Every check is written into `adjustments` as a plain sentence: the change applied, a change below the threshold, or missing data. Nothing is dropped silently.
- **Assumes indicator ids** `rainfall` and `ndvi` in `trends.json`. Kedrick to confirm.
- Temperature is not used in scoring yet (no agreed rule).

### Contract change: scenario argument

The role file proposed `applyScenario(results, { rainfallDelta })`. Results don't carry the original inputs, so this can't recompute anything.

**Decision:** the scenario is an optional 5th argument:

```js
scoreRotations(rotations, crops, trends, weights, scenario = null)
// scenario: { rainfallDelta: -0.10 | -0.20 }
```

The first four arguments are unchanged, so the UI import is unchanged. The scenario scales the most recent 5-year rainfall average by `1 + rainfallDelta` before the rules run. It is labelled in `adjustments` as "a what-if input, not an observation".

### Output additions (additive, non-breaking)

Each result also has `name` and `rank`. Each adjustment also carries `type` (`trend` | `missing-data` | `scenario` | `priorities`) and, where relevant, `indicatorId`, `dimension`, `multiplier` and `changePct`.

### Tests

Tests use Node's built-in runner (`node --test`), so no new dependency is needed. Fixtures in `tests/fixtures/` are synthetic and labelled `TEST FIXTURE`.

---

## AI assistance log

For the README / submission SI-use disclosure.

| Date | What | AI role | Human role |
|---|---|---|---|
| 2026-11-14 | Scoring engine, data loader, tests, this log | Claude (Anthropic) drafted code, fixtures and tests from the team's PRD, ARCHITECTURE and role file, and proposed default constants | Aizad: review and approve the formula, constants and contract change *(pending — update this cell once reviewed)* |
