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

## 2026-11-14 — Placeholder data in public/data/ (Aizad, agreed while waiting on real data)

*Superseded on 2026-11-14 by the real data merge, and on 2026-11-15 the last placeholder code was removed (see below). Kept for history.*

Real data isn't ready yet (Kedrick's pipeline is delayed) and Nia needs something to build the UI against. So all six files in `public/data/` now hold **placeholder** content that matches the ARCHITECTURE schemas.

- Every file has `"placeholder": true` and a `placeholder_note`, and every source string starts with "PLACEHOLDER". The UI should show a visible "placeholder data" badge whenever `placeholder` is true.
- The values are synthetic or illustrative, **not observations**, and must not be presented as NASA or USDA data.
- The example strategies are: continuous rice, rice → safflower, rice → sunflower and rice → fallow. Kedrick replaces them with the team's agreed four.
- **Kedrick:** pull `dev` first, then overwrite these files with the real data and drop the `placeholder` fields. `tests/publicData.test.js` checks that whatever is in `public/data/` still loads and scores.

---

## 2026-11-14 — Real data review: two decisions (Aizad)

After merging Kedrick's real data (`dev`, merge `f9fe7e6`), the full test suite passed with `public/data/` on the merged branch. Kedrick's handoff raised two questions.

### 1. Rainfall rule on a non-significant trend

- **Finding:** annual rainfall averaged about 28% less in 2020–2024 than in 2005–2009, which triggers the 1.5× water rule. But the 20-year linear trend is **not statistically significant** (p = 0.187, `trend_significant: false`).
- **Decision:** keep applying the rule, and **say so in the reason text**: *"The 20-year trend is not statistically significant (p = 0.19), so this may reflect recent dry years rather than a long-term shift."*
- **Why:** the rule compares the last 5 years with the first 5. That is a real observed difference, and it matters for water planning even if it isn't a long-term trend. Hiding the boost would remove the main way NASA data shapes the ranking; hiding the caveat would overstate the evidence. Saying both is the honest option.
- **Switch:** `REQUIRE_SIGNIFICANT_TREND` in `scoringConfig.js`. Set it to `true` to apply rules only to significant trends; the reason text then explains why nothing changed. (Aizad did not pick an option explicitly; this default was chosen and can be changed with that one line.)
- Each trend adjustment now also carries `significant` (true / false / null) and `pValue`.

### 2. Baseline shown as "Not advised now"

- **Finding:** with all sliders at 50 and the real data, continuous rice scores **42.7** (engine output, matching Kedrick's estimate of about 43), below the 45 threshold.
- **Decision:** keep the score and band unchanged, and add **`isBaseline: true`** to the current-practice rotation (id from `BASELINE_ROTATION_ID`). The UI should label it "Your current practice", as a reference point next to its score.
- **Why not change the thresholds:** moving 45 to 40 only to get a nicer label would be tuning the rules to the answer. The low score is driven by the chosen priorities and the rainfall boost; with income set as the top priority, continuous rice ranks first.
- **For Nia:** show "Your current practice" for the result with `isBaseline: true`.

---

## 2026-11-15 — Removed fabricated forecast content (Kedrick)

**Files removed/changed:** `placeholder.js` (deleted), `src/pages/Comparison.jsx`, `src/pages/Home.jsx`

- Deleted `placeholder.js`: it held synthetic trends, Malaysian paddy rotations, a synthetic "futures fan" and a "Chronos-2" validation table. No Chronos-2 model was ever used.
- Removed the two placeholder panels (futures fan, forecast validation) from the Comparison page.
- Rewrote the Home copy that claimed "hundreds of climate futures": the engine is rule-based and runs no futures simulation.
- **Reason:** scientific integrity. Nothing synthetic may be shown as a model result. A real, honestly labelled projection (with real backtest error) may come back later as a stretch feature; until then the UI shows only observed data and rule-based scores.

---

## 2026-11-15 — Frontend moved to repo root; stack changes accepted (Kedrick)

- The app had been scaffolded in a subfolder (`RoterraWeb/`) by mistake. It now lives at the repo root, and the scoring engine (`src/lib/`) and `tests/` sit beside it. The cross-package `../../../` imports and the Vite `server.fs.allow` workaround were removed.
- `npm test` is `node --test tests/*.test.js` (35 tests). `npm run lint` is clean.
- **Accepted deviations from the original rules:** Tailwind CSS 4 and daisyUI 5 for styling, and three.js (@react-three/fiber, drei) for the lazy-loaded hero globe. The globe is a decorative exception (~935 kB lazy chunk).
- ESLint: `no-unused-vars` is set with `ignoreRestSiblings: true`, because the engine and one test deliberately drop a field with object rest destructuring.
- Root markdown docs moved into `docs/` (`AGENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `FOLDER_STRUCTURE.md`, `PRD.md`, `TASKS.md`, `ABOUT_PROJECT.md`); empty doc stubs were removed.

---

## 2026-11-15 — README data sources; additional datasets (Kedrick)

- The README had listed IMERG, SMAP, ECOSTRESS and PRISM, but the pipeline only fetched five sources: NASA POWER, Landsat (via Planetary Computer), OpenET, USDA CDL and USDA SSURGO.
- **Decision:** the README lists only what is in `public/data/evidence.json`. IMERG, SMAP, ECOSTRESS and PRISM are marked **[optional]** until each one is fetched, shown as a visible indicator, and changes a score. Any that are not integrated in time are removed from the README before submission.

---

## 2026-11-15 — Demo site is the Colusa Basin; Malaysia is an adaptation path only (Kedrick)

- `docs/ABOUT_PROJECT.md` described a Sekinchan demo. It now describes the Colusa Basin, California, with Malaysian paddy as a planned adaptation (README paragraph and deck slide only), matching the 2026-11-14 pivot.

---

## AI assistance log

For the README / submission SI-use disclosure.

| Date | What | AI role | Human role |
|---|---|---|---|
| 2026-11-14 | Scoring engine, data loader, tests, this log | Claude (Anthropic) drafted code, fixtures and tests from the team's PRD, ARCHITECTURE and role file, and proposed default constants | Aizad: review and approve the formula, constants and contract change *(pending — update this cell once reviewed)* |
| 2026-11-14 | Placeholder `public/data/*.json` and a data smoke test | Claude drafted the placeholder files and the test at Aizad's request | Aizad: review *(pending)* |
| 2026-11-14 | Significance caveat, `isBaseline` flag, 3 tests | Claude implemented the decisions and verified them against the real data | Aizad chose the baseline option; the rainfall option was the default (pending his review) |
| 2026-11-15 | Repository audit, Phase 1 fixes (integrity cleanup, README, docs, lint), step-by-step guidance | An AI assistant audited the repo, proposed fixes and drafted README/doc text and code changes | Kedrick applied, tested and committed every change, and reviewed the text before keeping it |