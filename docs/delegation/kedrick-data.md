# Role File — Kedrick: Data Pipeline

*Hand this file plus `AGENTS.md`, `ARCHITECTURE.md`, `PRD.md`, and `TASKS.md` to your AI assistant. You own the data; the other two build against your contract until your real data lands.*

## Your Lane

**Branch:** `data/kedrick` · **You own:** `scripts/`, `public/data/`, `docs/data-sources.md`

You produce the app's data: NASA Earth observations + USDA field data, processed into the reviewed JSON files the app reads. You also own the `main` branch merges (repo owner).

**Important scope note:** the MVP is **rule-based, explainable, no ML** — that's a deliberate project decision (it's the differentiation pitch). Your "modeling" work this weekend is the **data pipeline and the derived indicators** (trends, anomaly stats, weight adjustments data). If your AI proposes training a model, redirect it: ML is a post-hackathon enhancement, at most a README "future work" bullet.

## Work Sequence

1. **Verify contracts first** — read `ARCHITECTURE.md` JSON schemas before writing any script. Your output files are the contract; Nia and Aizad's code already depends on their shapes.
2. **Pick the demo field** — Sacramento Valley rice, Colusa or Sutter County, via [CropScape](https://nassgeodata.gmu.edu/CropScape/). Record the field's coordinates and ~10-year crop history; the history defines the baseline rotation. Write `public/data/site.json`.
3. **Verify NASA POWER parameters** against the live API (candidate names: `PRECTOTCORR`, `T2M`, `RH2M`) before coding the fetcher. Then `scripts/fetch_power.py` → 20-yr rainfall + temperature series.
4. **Remaining fetchers** (in priority order):
   - `fetch_imerg.py` — GPM IMERG rainfall reliability/extremes (GES DISC; free Earthdata account)
   - `fetch_ndvi.py` — Landsat NDVI seasonal series (AppEEARS or Planetary Computer STAC)
   - CDL crop history (manual CropScape export is fine) → feeds `site.json` baseline
   - `fetch_ssurgo.py` — soil components + constraints (NRCS Soil Data Access)
   - `fetch_prism.py`, `fetch_openet.py` — cross-checks; **drop the indicator if the field is uncovered — never fake coverage**
5. **Author the content files** — `crops.json` (rice, wheat, soybean/bean, safflower traits; every entry flagged `needs_local_review: true`) and `rotations.json` (4 strategies: baseline + 3 alternatives, with rationale/benefits/risks/info gaps).
6. **Validate + publish** — `scripts/validate_json.py` checks every file against the schemas; only validated files go to `public/data/`.
7. **Write `evidence.json`** — every source with URL, resolution, coverage, retrieved date, confidence, limitations. This is the backbone of the evidence drawer.

## Your Deliverable (definition of done)

All six files in `public/data/`, schema-valid, real data (no fixtures left): `site.json`, `trends.json`, `soil.json`, `crops.json`, `rotations.json`, `evidence.json`. Plus `docs/data-sources.md` documenting every fetch: what, from where, parameters, known limitations.

## Rules of Thumb

- Fetch wide date ranges (20 yr) — the trends view is the product.
- Every indicator carries source, unit, resolution, period, confidence. If you're unsure of a value's provenance, it doesn't ship.
- Keep raw downloads in `data/raw/` (gitignored); only reviewed JSON is committed.
- Coordinate through the merge checkpoints in `docs/delegation/README.md` — your data replaces the fixtures file-for-file at Sat ~8 PM.
