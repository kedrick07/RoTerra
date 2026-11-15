# RoTerra

**Explainable crop-rotation decision support, built on NASA Earth observations and USDA field data.**

RoTerra helps a Sacramento Valley rice grower compare crop-rotation strategies against their own priorities — water, income, soil health, pest pressure, and equipment — where every score traces back to its evidence: the exact dataset, resolution, and assumptions behind it.

> Built for the NASA Space Apps Challenge 2026 — [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/)

## Live Demo

- App: `<deploy URL — fill after deploy>`
- Demo deck: `<public demo link — fill after upload>`

## The Problem

Rice growers in California's Sacramento Valley face drought cycles, groundwater restrictions, and soil-health pressure. NASA Earth observations and USDA field data exist for exactly these decisions — but they're fragmented across portals, and none of them answers the farmer's actual question: "given my field and my priorities, which rotation should I consider, and why?"

## What It Does

1. **Understand Risk** — 20-year climate trends (rainfall, temperature, humidity) plus NDVI since 2014 for the demo landscape, each labeled with source, resolution, and confidence.
2. **Compare Rotations** — four strategies (continuous rice baseline + three alternatives), scored by a rule-based weighted matrix against farmer priorities set with sliders.
3. **Reveal Tradeoffs** — every score expands into a per-dimension breakdown and the underlying data.
4. **Make Uncertainty Visible** — an evidence drawer shows provenance, limitations, and known information gaps for every indicator. Where a dataset has no coverage, the app says so instead of guessing.

Observed trends don't decorate the tool — they adjust the scoring weights, so a drying climate visibly changes which rotations rank. Trends that are not statistically significant are labeled as such.

## Screenshots

| Map + field | Trends | Rotation comparison | Evidence drawer |
|---|---|---|---|
| `<add>` | `<add>` | `<add>` | `<add>` |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (JavaScript), Tailwind CSS, daisyUI |
| Maps | Leaflet (react-leaflet) |
| Charts | Recharts |
| Hero visual | three.js (@react-three/fiber), lazy-loaded |
| Data prep | Python 3 scripts |
| Data layer | Static JSON (no backend, no database) |
| Scoring | Rule-based weighted matrix — explainable by design, no ML |
| Tests | Node built-in test runner |
| Hosting | Static site hosting |

## Run Locally

```bash
npm install
npm run dev        # dev server
npm run build      # static build in dist/
npm test           # scoring engine and data tests
npm run lint
```

Data is pre-fetched into `public/data/` by the Python scripts in `scripts/` (see `docs/ARCHITECTURE.md`); the app itself makes no network calls except map tiles.

## Data Sources

**NASA** (required for the challenge):
- [NASA POWER](https://power.larc.nasa.gov/docs/) — daily precipitation (PRECTOTCORR), temperature (T2M) and relative humidity (RH2M), 2005–2024, ~50 km gridded product
- [Landsat 8/9 Collection 2 Level-2](https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2) — NDVI vegetation index (30 m), 2014–2025, accessed through Microsoft Planetary Computer
- **[optional]** [GPM IMERG](https://gpm.nasa.gov/data) — rainfall reliability and extremes, ~10 km grid. Not yet integrated.
- **[optional]** [SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) — surface soil moisture (coarse, ~9 km, labeled as such). Not yet integrated.
- **[optional]** [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) — land-surface temperature / evapotranspiration, where cloud-free coverage exists. Not yet integrated.

**Other open data:**
- [USDA NASS Cropland Data Layer (CropScape)](https://nassgeodata.gmu.edu/CropScape/) — crop history of the demo landscape (30 m), 2014–2025
- [USDA NRCS SSURGO (Soil Data Access)](https://sdmdataaccess.nrcs.usda.gov/) — field-scale soil properties and constraints
- [OpenET](https://etdata.org/) — monthly evapotranspiration (30 m), 2015–2025
- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) — STAC access to Landsat
- **[optional]** [PRISM Climate Data](https://prism.oregonstate.edu/) — climate normals, cross-check for POWER. Not yet integrated.
- Libraries: React, Vite, Leaflet, Recharts, Tailwind CSS, daisyUI, three.js (all open source)

Every integrated indicator's source, resolution, retrieval date, confidence and limitations are in `public/data/evidence.json` and shown in the app's evidence drawer. Items marked **[optional]** are planned and are not used in any score until they appear there.

## Super Intelligence (SI) Use Disclosure

SI tools (AI coding assistants) were used for code scaffolding and guidance, documentation drafting, and copyediting. All scoring rules, data choices, and design decisions were made by the team. No SI-generated imagery is used without a watermark; no SI-generated content contains NASA branding. The scoring engine is deliberately rule-based and human-specified.

## Adaptation Path: Malaysian Paddy (Phase 2)

The framework is data-source agnostic: NASA POWER and Landsat both cover Malaysia, and GPM IMERG and SMAP would too if integrated. A Malaysian paddy pilot (e.g., Sekinchan, Selangor) requires only swapping the demo site, local soil data, and crop traits — the scoring engine and UI carry over. RoTerra is designed to be that adaptation.

## Team

Team RoTerra — NASA Space Apps Challenge 2026, Kuala Lumpur local event.