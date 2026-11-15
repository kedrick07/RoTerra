# RoTerra — Live Build Checklist

*Work top to bottom. Tell your AI agent: "read TASKS.md and build the next unchecked item."*

## Phase 0 — Setup (Saturday morning)

- [ ] Scaffold React + Vite app in `src/` (npm, JavaScript/JSX)
- [ ] Install only: `react-leaflet`, `leaflet`, `recharts`
- [ ] Design tokens stylesheet from `DESIGN.md` in `src/styles/`
- [ ] Choose demo field in Colusa/Sutter County via CropScape; record coords in `site.json`
- [ ] Verify NASA POWER parameter names against live API (PRECTOTCORR, T2M, RH2M)

## Phase 1 — Data pipeline (Saturday)

- [ ] `fetch_power.py` → 20-yr rainfall + temperature series → `data/processed/`
- [ ] `fetch_imerg.py` → rainfall reliability / extreme-rain stats
- [ ] `fetch_ndvi.py` → Landsat NDVI seasonal series
- [ ] CDL crop history for the field (manual CropScape export OK) → baseline practice
- [ ] `fetch_ssurgo.py` → soil components + constraints
- [ ] `fetch_prism.py` / `fetch_openet.py` → cross-checks (drop if uncovered)
- [ ] Draft `crops.json` traits + `rotations.json` (4 strategies) with "needs local review" flags
- [ ] `validate_json.py` → publish all files to `public/data/`

## Phase 2 — Core features (Saturday evening)

- [ ] Map panel with field marker + plot context
- [ ] Trends panel: rainfall / temperature / NDVI charts with source + uncertainty labels
- [ ] Scoring engine in `src/lib/scoring.js` (rule-based, weighted, trend-adjusted)
- [ ] Rotation comparison cards with rating bands
- [ ] Priority sliders (water, income, soil, pest, equipment) wired to rescoring
- [ ] Expandable per-dimension score breakdowns
- [ ] Evidence drawer (source, resolution, confidence, gaps)

## Phase 3 — MVP cut line (Sunday, only if Phase 2 done)

- [ ] Scenario slider: rainfall −10% / −20% → weights shift, rankings change visibly

## Phase 4 — UI polish (Sunday)

- [ ] Pass `DESIGN.md` review: tokens, spacing, chart colors, empty/error states
- [ ] Mobile-responsiveness sanity check (judges may open on a phone)
- [ ] Screenshots for README (map, trends, comparison, evidence drawer)

## Phase 5 — Demo prep (Sunday afternoon)

- [ ] Deploy to GitHub Pages / Vercel; test the public link logged-out
- [ ] 7-slide deck per `docs/` plan (title, problem, solution, demo x3, adaptability)
- [ ] Upload demo to public link (YouTube unlisted or GitHub-hosted PDF)
- [ ] README final pass: demo link, screenshots, data sources with URLs, SI disclosure

## Phase 6 — Submission (Sunday evening, before 11 PM)

- [ ] Fill form: name, summary (50–200 words), demo link, project link, details
- [ ] SI-use selections (code + text) and README acknowledgment
- [ ] NASA Data field: every NASA resource with full URL
- [ ] Other Data field: every other resource (Copernicus, USDA, libraries)
- [ ] Terms + originality confirmations → submit
