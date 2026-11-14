# RoTerra — Architecture (Data & API Map)

*Static-site architecture: Python scripts prepare data during the hackathon → reviewed JSON in `public/data/` → React app reads it. No backend.*

## Data Flow

```
NASA POWER / GPM IMERG / Landsat / SMAP / ECOSTRESS   USDA CDL / SSURGO / PRISM / OpenET
        │ (fetched by Python scripts during build)          │
        ▼                                                     ▼
  scripts/*.py  ──►  data/raw/  ──►  data/processed/  ──►  public/data/*.json  ──►  React app
                     (gitignored)   (gitignored)         (committed)          (reads at runtime)
```

## Static JSON Contracts (`public/data/`)

Exact shapes the frontend depends on — keep `scripts/` output and `src/` reads in sync with this.

**`site.json`** — the demo field
```json
{
  "site_id": "sac-rice-01",
  "name": "Sacramento Valley rice field",
  "region": "Colusa County, California",
  "lat": 0, "lon": 0, "bbox": [0,0,0,0], "area_ha": 0,
  "current_practice": "continuous rice",
  "crop_history_source": "USDA CDL"
}
```

**`trends.json`** — time-series indicators (one per indicator)
```json
{ "indicators": [{
  "id": "rainfall", "label": "Rainfall", "unit": "mm/yr",
  "source": "NASA POWER (PRECTOTCORR)", "resolution": "point",
  "period": "2005-2024", "confidence": "high",
  "values": [{"year": 2005, "value": 0}],
  "trend_summary": "text"
}]}
```

**`soil.json`** — SSURGO field-scale soil
```json
{ "source": "USDA NRCS SSURGO",
  "components": [{"name": "", "texture": "", "drainage_class": "",
                  "organic_matter_pct": 0, "available_water_capacity": ""}],
  "constraints": [{"id": "", "label": "", "severity": "notes"}] }
```

**`crops.json`** — crop traits (illustrative, flagged)
```json
{ "crops": [{
  "crop_id": "rice", "name": "Rice",
  "traits": {"water_need": 0, "income": 0, "soil_health": 0,
             "pest_break": 0, "equipment_fit": 0},
  "notes": "", "needs_local_review": true
}]}
```

**`rotations.json`** — the 4 strategies
```json
{ "rotations": [{
  "id": "baseline", "name": "Continuous rice (current practice)",
  "sequence": ["rice"],
  "rationale": "", "benefits": [], "risks": [], "info_gaps": []
}]}
```

**`evidence.json`** — provenance registry (backs the evidence drawer)
```json
{ "evidence": [{
  "id": "", "source": "", "url": "", "resolution": "",
  "coverage": "", "retrieved": "2026-11-14", "confidence": "high|medium|low",
  "limitations": ""
}]}
```

## Scoring Engine (client-side, `src/lib/scoring.js`)

- Inputs: `rotations.json` + `crops.json` traits + `trends.json` derived weights + slider values (water, income, soil, pest, equipment; 0–100 each).
- Output per rotation: total weighted score + per-dimension breakdown + rating band (Strong fit / Promising / Needs review / Not advised now).
- Rule-based only: weighted matrix, thresholds, and NASA-trend adjustments (e.g., a −20% rainfall trend raises the water dimension's weight). No ML.
- Trend-derived weight adjustments are computed once from `trends.json` and shown to the user.

## Frontend Map (`src/`)

| Route/section | Component tree | Data read |
|---|---|---|
| Map + field | `src/features/risk/MapPanel` (Leaflet) | `site.json` |
| Understand Risk | `src/features/risk/TrendsPanel` (Recharts) | `trends.json` |
| Compare Rotations | `src/features/rotations/*` (cards, sliders, breakdowns) | `rotations.json`, `crops.json`, sliders |
| Evidence drawer | `src/features/evidence/*` | `evidence.json`, `soil.json` |
| Shared | `src/components/`, `src/lib/scoring.js`, `src/lib/data.js` | all |

## Third-Party Integrations (build-time only, via Python)

| Source | Script | Notes |
|---|---|---|
| NASA POWER | `scripts/fetch_power.py` | REST API, no key. Params: PRECTOTCORR, T2M, RH2M |
| GPM IMERG | `scripts/fetch_imerg.py` | GES DISC; free Earthdata account |
| Landsat NDVI | `scripts/fetch_ndvi.py` | AppEEARS or Planetary Computer STAC |
| USDA CDL | `scripts/fetch_cdl.py` | CropScape export (may be manual download) |
| SSURGO | `scripts/fetch_ssurgo.py` | NRCS Soil Data Access |
| PRISM | `scripts/fetch_prism.py` | Climate normals, cross-check for POWER |
| OpenET | `scripts/fetch_openet.py` | Field-scale ET; skip indicator if field not covered |
| SMAP / ECOSTRESS | optional Tier-2 scripts | Only if a scene/coverage check passes |

Pipeline tail: `scripts/validate_json.py` → reviewed copy to `public/data/`.

## Hosting

GitHub Pages (or Vercel) from `main`; optional GoDaddy/Porkbun free domain pointed at it. The site must work as a fully static build (`npm run build` → `dist/`).
