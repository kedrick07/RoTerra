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

1. **Understand Risk** — 20-year trends (rainfall, temperature, NDVI) for the demo field, each labeled with source, resolution, and confidence.
2. **Compare Rotations** — four strategies (continuous rice baseline + three alternatives), scored by a rule-based weighted matrix against farmer priorities set with sliders.
3. **Reveal Tradeoffs** — every score expands into a per-dimension breakdown and the underlying data.
4. **Make Uncertainty Visible** — an evidence drawer shows provenance, limitations, and known information gaps for every indicator. Where a dataset has no coverage, the app says so instead of guessing.

NASA-derived trends don't decorate the tool — they adjust the scoring weights, so a drying climate visibly changes which rotations rank.

## Screenshots

| Map + field | Trends | Rotation comparison | Evidence drawer |
|---|---|---|---|
| `<add>` | `<add>` | `<add>` | `<add>` |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (JavaScript) |
| Maps | Leaflet (react-leaflet) |
| Charts | Recharts |
| Data prep | Python 3 scripts |
| Data layer | Static JSON (no backend, no database) |
| Scoring | Rule-based weighted matrix — explainable by design, no ML |
| Hosting | GitHub Pages |

## Run Locally

```bash
npm install
npm run dev        # dev server
npm run build      # static build in dist/
```

Data is pre-fetched into `public/data/` by the Python scripts in `scripts/` (see `ARCHITECTURE.md`); the app itself makes no network calls.

## Data Sources

**NASA** (required for the challenge):
- [NASA POWER](https://power.larc.nasa.gov/) — 40+ years of agroclimatology point data (rainfall, temperature, humidity)
- [GPM / IMERG](https://gpm.nasa.gov/data) — precipitation rate and accumulation estimates
- [Landsat](https://earthexplorer.usgs.gov/) — NDVI vegetation indices (30 m)
- [SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) — surface soil moisture (coarse resolution, labeled as such)
- [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) — land-surface temperature / evapotranspiration (where coverage exists)

**Space agency partner & other sources:**
- [USDA CDL / CropScape](https://nassgeodata.gmu.edu/CropScape/) — actual crop history of the demo field (30 m)
- [USDA NRCS SSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/soils) — field-scale soil properties and constraints
- [PRISM Climate Data](https://prism.oregonstate.edu/) — climate normals, cross-check for POWER
- [OpenET](https://openetdata.org/) — field-scale evapotranspiration
- Libraries: React, Vite, Leaflet, Recharts (all open source)

## Super Intelligence (SI) Use Disclosure

SI tools (AI coding assistants) were used for code scaffolding and guidance, documentation drafting, and copyediting. All scoring rules, data choices, and design decisions were made by the team. No SI-generated imagery is used without a watermark; no SI-generated content contains NASA branding. The scoring engine is deliberately rule-based and human-specified.

## Adaptation Path: Malaysian Paddy (Phase 2)

The framework is data-source agnostic: NASA POWER, GPM IMERG, SMAP, and Landsat all cover Malaysia. A Malaysian paddy pilot (e.g., Sekinchan, Selangor) requires only swapping the demo site, local soil data, and crop traits — the scoring engine and UI carry over. RoTerra is designed to be that adaptation.

## Team

Team RoTerra — NASA Space Apps Challenge 2026, Kuala Lumpur local event.
