# RoTerra — Live Build Checklist

*Status as of 2026-11-15 (Phase 1 audit fixes). Work top to bottom. Tell your AI agent: "read docs/TASKS.md and build the next unchecked item."*

## Phase 0 — Setup

- [x] Scaffold React + Vite app (npm, JavaScript/JSX), now at the repo root
- [x] Dependencies installed (react-leaflet, leaflet, recharts, plus Tailwind CSS, daisyUI, three.js — see `docs/DECISIONS.md`)
- [x] Design styling in `src/index.css` (Tailwind-based; replaces the planned `src/styles/` tokens)
- [x] Demo field chosen in Colusa County via CropScape; coordinates in `public/data/site.json`
- [x] NASA POWER parameter names verified (PRECTOTCORR, T2M, RH2M)

## Phase 1 — Data pipeline

- [x] `fetch_power.py` → rainfall, temperature, humidity series → `data/processed/`
- [x] `fetch_ndvi.py` → Landsat NDVI seasonal series (via Planetary Computer)
- [x] CDL crop history for the field (manual CropScape export) → baseline practice
- [x] `fetch_ssurgo.py` → soil components + constraints
- [x] `fetch_openet.py` → evapotranspiration
- [x] `crops.json` traits + `rotations.json` (4 strategies) with "needs local review" flags
- [x] Validation inside `publish_data.py` → publish all files to `public/data/`
- [ ] [optional] `fetch_imerg.py` → rainfall reliability / extremes (needs Earthdata account)
- [ ] [optional] `fetch_prism.py` → climate cross-check
- [ ] [optional] SMAP soil moisture fetch
- [ ] [optional] ECOSTRESS fetch (drop if no cloud-free coverage)

## Phase 2 — Core features

- [x] Map panel with field marker and AOI
- [x] Trends panel: rainfall / temperature / NDVI charts with source + uncertainty labels
- [x] Scoring engine in `src/lib/scoring.js` (rule-based, weighted, trend-adjusted), 35 tests passing
- [x] Rotation comparison cards with rating bands
- [x] Priority sliders wired to rescoring
- [x] Expandable per-dimension score breakdowns
- [x] Evidence drawer (source, resolution, confidence, gaps)

## Phase 3 — MVP cut line

- [ ] Scenario slider UI: rainfall −10% / −20% (engine already supports it; UI missing)
- [ ] Surface all indicators in the Explorer (only 3 of 9 are charted)
- [ ] Decide the data loader: wire `src/lib/data.js` into the app or delete it and log the decision

## Phase 4 — UI polish

- [ ] Map: CartoDB Positron tiles and a green field marker per `docs/DESIGN.md`
- [ ] Evidence drawer: ESC to close, focus trap, reachable from every breakdown segment
- [ ] Mobile-responsiveness sanity check (judges may open on a phone)
- [ ] Screenshots for README (map, trends, comparison, evidence drawer)

## Phase 5 — Demo prep

- [ ] Deploy to static hosting; test the public link logged-out and on a phone
- [ ] 7-slide deck (title, problem, solution, demo x3, adaptability)
- [ ] Upload demo to a public link (YouTube unlisted or GitHub-hosted PDF)
- [ ] README final pass: demo link, screenshots, data sources with URLs, SI disclosure
- [ ] Merge `dev` into `main`; `main` is the submission branch

## Phase 6 — Submission (target ~9:00 PM, before 11:59 PM)

- [ ] Fill form: name, summary (50–200 words), demo link, project link, details
- [ ] SI-use selections and README acknowledgment
- [ ] NASA Data field: every NASA resource with full URL
- [ ] Other Data field: every other resource (USDA, OpenET, Planetary Computer, libraries)
- [ ] Terms + originality confirmations → submit

## Audit fixes (2026-11-15)

- [x] Removed fabricated forecast placeholders (futures fan, "Chronos-2" table) and `placeholder.js`
- [x] Corrected Home copy ("hundreds of climate futures")
- [x] README sources match the pipeline; unintegrated datasets flagged [optional]
- [x] `ABOUT_PROJECT.md` rewritten for the Colusa Basin
- [x] Lint clean; page title and fonts fixed
- [x] Frontend moved from `RoterraWeb/` to the repo root