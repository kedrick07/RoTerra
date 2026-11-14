import json
from pathlib import Path

import numpy as np
import pandas as pd

raw = json.load(open("data/processed/openet_raw_combined.json"))
ok = raw["ok"]

rows = []
for y, recs in ok.items():
    for r in recs:
        rows.append({"date": pd.to_datetime(r["time"]), "et_mm": float(r["et"])})
df = pd.DataFrame(rows).sort_values("date").set_index("date")

years = {}
for y, g in df.groupby(df.index.year):
    season = g[(g.index.month >= 5) & (g.index.month <= 10)]
    peak = g["et_mm"].idxmax()
    years[str(y)] = {
        "n_months": int(len(g)),
        "annual_et_mm": round(float(g["et_mm"].sum()), 0),
        "may_oct_et_mm": round(float(season["et_mm"].sum()), 0),
        "peak_month": int(peak.month),
        "peak_month_et_mm": float(g["et_mm"].max()),
        "monthly_et_mm": [float(v) for v in g["et_mm"].tolist()],
    }

annual = pd.Series({y: v["annual_et_mm"] for y, v in years.items()})
season = pd.Series({y: v["may_oct_et_mm"] for y, v in years.items()})

median_season = float(season.median())
low_years = [y for y, v in season.items() if v < 0.6 * median_season]
for y in years:
    years[y]["low_et_flag"] = y in low_years
    years[y]["low_et_note"] = (
        "May-Oct ET below 60% of the multi-year median; likely fallow or "
        "non-rice cover, verify against CDL and NDVI"
        if y in low_years
        else None
    )


def slope(series):
    x = np.array([int(y) for y in series.index], dtype=float)
    return round(float(np.polyfit(x, series.values, 1)[0]), 1) if len(series) > 2 else None


keep = [y for y in season.index if y not in low_years]
normal_climatology = (
    df[df.index.year.astype(str).isin(keep)]
    .groupby(df[df.index.year.astype(str).isin(keep)].index.month)["et_mm"]
    .mean()
    .round(1)
    .to_dict()
)

out = {
    "source": "OpenET Ensemble monthly ET, point at site centre (30 m pixel)",
    "reference_et": "gridMET",
    "units": "mm per month",
    "coverage_years": sorted(years),
    "not_available": ["2014"],
    "untested": ["2015"],
    "limitations": [
        "Single 30 m pixel at the site centre, not a field-wide average",
        "Ensemble collection not available for 2014 (HTTP 406); 2015 untested",
        "API returned intermittent 408 errors; retried successfully",
        "Years flagged low_et_flag are likely fallow or non-rice; verify with CDL/NDVI",
        "Trend over 10 years is weak evidence",
    ],
    "low_et_years": low_years,
    "mean_monthly_et_mm_excluding_low_years": normal_climatology,
    "mean_annual_et_mm_excluding_low_years": round(float(annual[keep].mean()), 0),
    "mean_may_oct_et_mm_excluding_low_years": round(float(season[keep].mean()), 0),
    "trend_annual_mm_per_year_all_years": slope(annual),
    "trend_may_oct_mm_per_year_all_years": slope(season),
    "trend_annual_mm_per_year_excluding_low_years": slope(annual[keep]),
    "trend_may_oct_mm_per_year_excluding_low_years": slope(season[keep]),
    "years": years,
}

Path("data/processed").mkdir(parents=True, exist_ok=True)
json.dump(out, open("data/processed/openet.json", "w"), indent=2)

print(pd.DataFrame({
    "annual": annual,
    "may_oct": season,
    "peak_month": {y: v["peak_month"] for y, v in years.items()},
    "low_flag": {y: v["low_et_flag"] for y, v in years.items()},
}))
print("Low-ET years:", low_years)
print("Trend May-Oct all years:", out["trend_may_oct_mm_per_year_all_years"],
      "| excluding low years:", out["trend_may_oct_mm_per_year_excluding_low_years"])