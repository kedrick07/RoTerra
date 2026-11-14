import json
from pathlib import Path

PROC = Path("data/processed")
DST = Path("public/data")
DST.mkdir(parents=True, exist_ok=True)
RETRIEVED = "2026-11-14"

oet = json.load(open(PROC / "openet.json"))
cdl = json.load(open(PROC / "cdl_polygon_history.json"))
soil = json.load(open(DST / "soil.json"))

et_normal = round(oet["mean_may_oct_et_mm_excluding_low_years"])
low = oet["low_et_years"]
et_low = round(sum(oet["years"][y]["may_oct_et_mm"] for y in low) / len(low))
fallow_peak_year = max(cdl, key=lambda y: cdl[y]["fallow_share_pct"])
fallow_peak = cdl[fallow_peak_year]["fallow_share_pct"]
dom = soil["components"][0]
rice_years = sum(1 for y in cdl if cdl[y]["dominant_class"] == "Rice")

REVIEW = "Crop trait scores are illustrative (0-10) and need local agronomic review"
SOIL_RISK = (f"{dom['name']} soils ({dom['share_pct']}% of the site) are "
             f"{dom['drainage_class'].lower()} {dom['texture']}, which can waterlog "
             f"non-rice crops (SSURGO)")

crops = {
    "scale_note": "Traits are on a 0-10 scale; higher water_need is worse for the farmer.",
    "crops": [
        {"crop_id": "rice", "name": "Rice",
         "traits": {"water_need": 9, "income": 8, "soil_health": 3, "pest_break": 1, "equipment_fit": 10},
         "notes": "Flooded crop with high water use; existing equipment fits.",
         "needs_local_review": True},
        {"crop_id": "wheat", "name": "Winter wheat",
         "traits": {"water_need": 4, "income": 4, "soil_health": 6, "pest_break": 7, "equipment_fit": 8},
         "notes": "Small grain; adds residue and a different crop family. Needs good winter drainage.",
         "needs_local_review": True},
        {"crop_id": "soybean", "name": "Soybean or dry bean",
         "traits": {"water_need": 6, "income": 6, "soil_health": 7, "pest_break": 7, "equipment_fit": 6},
         "notes": "Legume that fixes nitrogen. Needs summer irrigation and drained soil.",
         "needs_local_review": True},
        {"crop_id": "safflower", "name": "Safflower",
         "traits": {"water_need": 3, "income": 5, "soil_health": 6, "pest_break": 8, "equipment_fit": 6},
         "notes": "Deep-rooted, drought-tolerant oilseed.",
         "needs_local_review": True},
        {"crop_id": "sunflower", "name": "Sunflower",
         "traits": {"water_need": 4, "income": 6, "soil_health": 5, "pest_break": 7, "equipment_fit": 5},
         "notes": "Summer oilseed; not in the default rotations (swap in if wanted).",
         "needs_local_review": True},
        {"crop_id": "fallow", "name": "Fallow (idle season)",
         "traits": {"water_need": 0, "income": 1, "soil_health": 5, "pest_break": 6, "equipment_fit": 10},
         "notes": "Field left unplanted; income may come from water transfers (not modelled).",
         "needs_local_review": True},
    ],
}

rotations = {
    "rotations": [
        {"id": "baseline", "name": "Continuous rice (current practice)",
         "sequence": ["rice"],
         "rationale": (f"Rice was the dominant crop in {rice_years} of {len(cdl)} years "
                       f"(USDA CDL, 2014-2025), so this is the comparison point."),
         "benefits": ["Uses existing equipment and know-how",
                      "Heavy, poorly drained clay suits flooded rice",
                      "Established market"],
         "risks": [f"High water use: about {et_normal} mm May-Oct evapotranspiration in rice years "
                   f"(OpenET, single-pixel estimate)",
                   "No break in rice pest and weed cycles",
                   f"The site was {fallow_peak}% fallow in {fallow_peak_year} (CDL); "
                   f"the cause is not in our data"],
         "info_gaps": [REVIEW, "No farm-level cost or price data",
                       "Why the site was fallow in 2022 is not measured"],
         "evidence_ids": ["cdl", "openet", "ssurgo"], "needs_local_review": True},
        {"id": "rice-wheat", "name": "Rice then winter wheat",
         "sequence": ["rice", "wheat"],
         "rationale": "A winter small grain in the off year needs less irrigation water than rice "
                      "and adds a different crop family.",
         "benefits": ["Lower irrigation need in the wheat year", "Breaks rice weed and pest cycles",
                      "Common drill equipment"],
         "risks": [SOIL_RISK, "Lower income than rice"],
         "info_gaps": [REVIEW, "Crop scores are averaged across the sequence (simplification)"],
         "evidence_ids": ["ssurgo", "openet"], "needs_local_review": True},
        {"id": "rice-soybean", "name": "Rice then soybean or dry bean",
         "sequence": ["rice", "soybean"],
         "rationale": "A legume in the off year can fix nitrogen and give a different income stream.",
         "benefits": ["Nitrogen fixation", "Breaks rice pest cycles", "Alternative income"],
         "risks": [SOIL_RISK, "Needs summer irrigation and different equipment",
                   "Market contracts needed"],
         "info_gaps": [REVIEW, "Crop scores are averaged across the sequence (simplification)"],
         "evidence_ids": ["ssurgo", "openet"], "needs_local_review": True},
        {"id": "rice-safflower", "name": "Rice then safflower",
         "sequence": ["rice", "safflower"],
         "rationale": "A low-water, deep-rooted oilseed in the off year reduces water use "
                      "and breaks rice pest cycles.",
         "benefits": ["Much lower water need in the safflower year", "Breaks rice pest cycles"],
         "risks": [SOIL_RISK, "Lower income than rice"],
         "info_gaps": [REVIEW, "Crop scores are averaged across the sequence (simplification)"],
         "evidence_ids": ["ssurgo", "openet"], "needs_local_review": True},
    ]
}

evidence = {
    "evidence": [
        {"id": "power_precip", "source": "NASA POWER daily, PRECTOTCORR (AG community)",
         "url": "https://power.larc.nasa.gov/docs/", "resolution": "gridded model product, about 50 km",
         "coverage": "2005-2024 daily, point at site centre", "retrieved": RETRIEVED,
         "confidence": "medium",
         "limitations": "Gridded product, not a rain gauge; calendar-year sums; "
                        "high year-to-year variability, no statistically clear trend."},
        {"id": "power_temp", "source": "NASA POWER daily, T2M (AG community)",
         "url": "https://power.larc.nasa.gov/docs/", "resolution": "gridded model product, about 50 km",
         "coverage": "2005-2024 daily, point at site centre", "retrieved": RETRIEVED,
         "confidence": "medium",
         "limitations": "Model-based; part of the warming signal may reflect the data source."},
        {"id": "power_rh", "source": "NASA POWER daily, RH2M (AG community)",
         "url": "https://power.larc.nasa.gov/docs/", "resolution": "gridded model product, about 50 km",
         "coverage": "2005-2024 daily, point at site centre", "retrieved": RETRIEVED,
         "confidence": "medium", "limitations": "Model-based humidity, annual mean."},
        {"id": "landsat_ndvi", "source": "Landsat 8/9 Collection 2 Level-2 via Microsoft Planetary Computer",
         "url": "https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2",
         "resolution": "30 m, mean over the site bounding box",
         "coverage": "2014-2025, May-Sep scenes with cloud cover under 40%", "retrieved": RETRIEVED,
         "confidence": "high",
         "limitations": "Peak of per-scene means; cloud-masked with QA bands; one 2022 scene "
                        "skipped (HTTP 403). 2021-2022 values reflect fallow land, not climate."},
        {"id": "openet", "source": "OpenET Ensemble monthly evapotranspiration (gridMET reference ET)",
         "url": "https://etdata.org/", "resolution": "30 m, single pixel at the site centre",
         "coverage": "2015-2025 (no collection for 2014)", "retrieved": RETRIEVED,
         "confidence": "medium",
         "limitations": "Single pixel, not a field average; API returned intermittent errors "
                        "(retried); 2021-2022 are low because the site was largely fallow."},
        {"id": "cdl", "source": "USDA NASS Cropland Data Layer",
         "url": "https://nassgeodata.gmu.edu/CropScape/", "resolution": "30 m, pixel counts inside the site polygon",
         "coverage": "2014-2025", "retrieved": RETRIEVED, "confidence": "high",
         "limitations": "Classified satellite product with its own accuracy limits; "
                        "site is a landscape of about 15 km2, not a single farm field."},
        {"id": "ssurgo", "source": "USDA NRCS SSURGO via Soil Data Access",
         "url": "https://sdmdataaccess.nrcs.usda.gov/", "resolution": "map-unit polygons (field scale)",
         "coverage": "Map units intersecting the site bounding box", "retrieved": RETRIEVED,
         "confidence": "medium",
         "limitations": "Top horizon only; component shares are normalised percentages, not area "
                        "fractions; available water capacity not retrieved; constraints are rule-derived."},
    ]
}

for name, obj in [("crops.json", crops), ("rotations.json", rotations), ("evidence.json", evidence)]:
    json.dump(obj, open(DST / name, "w"), indent=2)
    print("wrote", DST / name)
print("rotations:", [r["id"] for r in rotations["rotations"]])
print("OpenET normal May-Oct:", et_normal, "mm | low years:", low, et_low, "mm")