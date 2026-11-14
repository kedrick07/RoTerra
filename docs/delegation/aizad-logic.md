# Role File — Aizad: Rule-Based Scoring Engine

*Hand this file plus `AGENTS.md`, `ARCHITECTURE.md`, and `PRD.md` to your AI assistant. You own the brain of the app; you need neither real data nor finished UI to build it.*

## Your Lane

**Branch:** `logic/aizad` · **You own:** `src/lib/`, `tests/`, `docs/decisions.md`

You build the rule-based scoring engine: the explainable weighted matrix that turns crop traits, environmental trends, and farmer priorities into rotation rankings — with a visible per-dimension breakdown for every score.

## Work Sequence

1. **Start from the wireframes** (they land ~1–2 hours into Saturday — check Nia's wireframe images in the team chat or `docs/`). You don't need her code, just to know which result shapes the UI will display: total score, per-dimension breakdown, rating band, and the "why" behind each adjustment.
2. **Fixtures before logic** — create small fixture JSON files in `tests/fixtures/` matching the `ARCHITECTURE.md` schemas exactly (`crops.json`, `rotations.json`, `trends.json` shapes). Your engine runs against these until Kedrick's real data replaces them.
3. **Build the engine** in `src/lib/scoring.js` (pure functions, no React imports, no fetches — data arrives as arguments):

```js
// The contract between you and Nia's UI:
scoreRotations(rotations, crops, trends, weights)
// returns: [{
//   rotationId, totalScore, band,            // "strong-fit" | "promising" | "needs-review" | "not-advised"
//   dimensions: { water: {score, weight, contribution}, income: {...}, ... },
//   adjustments: [{reason, effect}]          // every trend-driven change, explained
// }]
```

4. **Slider semantics** — weights: water, income, soil, pest, equipment, each 0–100 (normalized inside the engine). Same inputs must always give the same output (deterministic, explainable).
5. **Trend-driven weight adjustment** — the NASA data doesn't decorate, it decides: e.g., a −20% rainfall trend raises the water dimension's effective weight; the `adjustments` array records every such change with a human-readable reason string. These reason strings appear in the UI — write them plainly.
6. **Scenario mode** (MVP cut line — Sunday only): `applyScenario(results, {rainfallDelta: -0.10 | -0.20})` recomputes with adjusted trend inputs. Same explainability rules.
7. **Tests** in `tests/` — at minimum: normalization edge cases (all sliders at 0, all at 100), determinism, rating-band thresholds, and one full golden-path test with fixtures. AGENTS.md rule: never claim tests passed unless you ran them.

## Your Deliverable (definition of done)

`src/lib/scoring.js` + data-loading helpers in `src/lib/data.js`, passing tests, documented constants (weights, thresholds, bands) in one place so tuning is a one-file change. Nia imports your function signature as-is; the signature is the contract — any change goes through `docs/decisions.md`.

## Rules of Thumb

- No ML, no probabilistic outputs, no hidden coefficients — every number in the output traces to a trait value, a slider, or a trend adjustment.
- If a rule feels arbitrary, write the assumption down in the rotation's `info_gaps` or `notes` — honesty is the product.
- Keep scoring and presentation strictly separated: you never import from `src/features/` or `src/components/`.
