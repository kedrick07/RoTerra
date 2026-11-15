import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

try:
    from scipy import stats
except ImportError:
    sys.exit("scipy is required for trend significance: pip install scipy")

RAW = Path("data/raw/power_daily_raw.json")
PROC = Path("data/processed")
OUT = PROC / "trends.json"
PARAMS = ["PRECTOTCORR", "T2M", "RH2M"]


def load_power(path):
    raw = json.load(open(path))
    if isinstance(raw, dict) and "properties" in raw:
        par = raw["properties"]["parameter"]
        df = pd.DataFrame({p: pd.Series(par[p]) for p in PARAMS if p in par})
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")
        shape = "POWER API response"
    elif isinstance(raw, list):
        df = pd.DataFrame(raw)
        dcol = next(c for c in df.columns if c.lower() in ("date", "time", "datetime"))
        df.index = pd.to_datetime(
            df[dcol].astype(str).str.replace("-", ""), format="%Y%m%d"
        )
        shape = "list of records"
    elif isinstance(raw, dict) and all(isinstance(v, dict) for v in raw.values()):
        first = next(iter(raw.values()))
        if any(p in first for p in PARAMS):
            df = pd.DataFrame(raw).T
            shape = "date-keyed rows"
        else:
            df = pd.DataFrame({p: pd.Series(raw[p]) for p in PARAMS if p in raw})
            shape = "param-keyed series"
        df.index = pd.to_datetime(
            df.index.astype(str).str.replace("-", ""), format="%Y%m%d"
        )
    else:
        raise ValueError("Unrecognised power_daily_raw.json structure")
    print("POWER shape:", shape, "| rows:", len(df), "| columns:", list(df.columns))
    df = df[[p for p in PARAMS if p in df.columns]].astype(float)
    return df.replace(-999.0, np.nan).sort_index()


def trend(years, values, per=10):
    x = np.array(list(years), dtype=float)
    y = np.array(list(values), dtype=float)
    ok = ~np.isnan(y)
    x, y = x[ok], y[ok]
    if len(x) < 5:
        return {"slope_per_decade": None, "p_value": None,
                "direction": "insufficient data", "n_years": int(len(x)), "note": None}
    res = stats.linregress(x, y)
    p = float(res.pvalue)
    if p < 0.05:
        direction, note = ("increasing" if res.slope > 0 else "decreasing"), "p < 0.05"
    elif p < 0.1:
        direction, note = ("increasing" if res.slope > 0 else "decreasing"), "weak evidence (0.05 <= p < 0.1)"
    else:
        direction, note = "no clear trend", "p >= 0.1"
    return {
        "slope_per_decade": round(float(res.slope) * per, 3),
        "p_value": round(p, 3),
        "direction": direction,
        "n_years": int(len(x)),
        "note": note,
    }


def series_records(years, values, nd=1):
    return [
        {"year": int(y), "value": None if pd.isna(v) else round(float(v), nd)}
        for y, v in zip(years, values)
    ]


power = load_power(RAW)
yrs = sorted(power.index.year.unique())
full_years = [y for y in yrs if power[power.index.year == y].shape[0] >= 360]
power = power[power.index.year.isin(full_years)]
print("Full years used:", full_years[0], "-", full_years[-1], f"({len(full_years)} yrs)")

g = power.groupby(power.index.year)
rain_annual = g["PRECTOTCORR"].sum()
temp_mean = g["T2M"].mean()
rh_mean = g["RH2M"].mean()
grow = power[(power.index.month >= 5) & (power.index.month <= 10)]
gg = grow.groupby(grow.index.year)
rain_grow = gg["PRECTOTCORR"].sum()
temp_grow = gg["T2M"].mean()

oet = json.load(open(PROC / "openet.json")) if (PROC / "openet.json").exists() else None
cdl = (
    json.load(open(PROC / "cdl_polygon_history.json"))
    if (PROC / "cdl_polygon_history.json").exists()
    else None
)
ndvi = json.load(open(PROC / "ndvi.json")) if (PROC / "ndvi.json").exists() else None

fallow_years = set()
if oet:
    fallow_years |= {int(y) for y in oet.get("low_et_years", [])}
if cdl:
    fallow_years |= {int(y) for y, v in cdl.items() if v["fallow_share_pct"] > 50}
print("Years excluded from crop-affected trends:", sorted(fallow_years))

indicators = []


def add(id_, label, unit, ser, evidence, nd=1, note=None, exclude=(), no_trend=False):
    ser = ser.dropna()
    entry = {
        "id": id_,
        "label": label,
        "unit": unit,
        "series": series_records(ser.index, ser.values, nd),
        "mean": round(float(ser.mean()), nd),
        "evidence_id": evidence,
        "note": note,
    }
    if no_trend:
        entry["trend"] = {"slope_per_decade": None, "p_value": None,
                          "direction": "not assessed", "n_years": int(len(ser)),
                          "note": "management/fallow signal, not a climate trend"}
    elif exclude:
        sub = ser[~ser.index.isin(list(exclude))]
        entry["trend"] = trend(sub.index, sub.values)
        entry["trend_all_years"] = trend(ser.index, ser.values)
        entry["trend_excluded_years"] = sorted(int(e) for e in exclude)
    else:
        entry["trend"] = trend(ser.index, ser.values)
    indicators.append(entry)


add("rain_annual", "Annual rainfall", "mm/yr", rain_annual, "power_precip", 0,
    "NASA POWER PRECTOTCORR (gridded), calendar-year sum")
add("rain_may_oct", "Growing-season rainfall (May-Oct)", "mm", rain_grow,
    "power_precip", 0, "Rice growing season; irrigation covers most demand")
add("temp_mean", "Mean air temperature", "deg C", temp_mean, "power_temp", 2,
    "NASA POWER T2M (gridded model product), annual mean")
add("temp_may_oct", "Growing-season mean temperature (May-Oct)", "deg C",
    temp_grow, "power_temp", 2)
add("rh_mean", "Mean relative humidity", "%", rh_mean, "power_rh", 1,
    "NASA POWER RH2M, annual mean")

extras = {}
if ndvi:
    nd = ndvi["years"]
    pk = pd.Series(
        {int(y): nd[y]["peak_ndvi"] for y in sorted(nd) if nd[y]["peak_ndvi"] is not None},
        dtype=float,
    )
    add("ndvi_peak", "Peak NDVI (May-Sep, Landsat 8/9)", "index", pk,
        "landsat_ndvi", 3,
        "Mean over site bbox per clear scene; peak of scenes per year. "
        "Trend excludes fallow-affected years " + str(sorted(fallow_years)),
        exclude=fallow_years)
    extras["ndvi"] = "included"
else:
    extras["ndvi"] = "missing"

if oet:
    s_all = pd.Series(
        {int(y): v["may_oct_et_mm"] for y, v in oet["years"].items()}, dtype=float
    )
    add("et_may_oct", "Growing-season evapotranspiration (May-Oct)", "mm", s_all,
        "openet", 0,
        "Single 30 m pixel. Trend excludes fallow-affected years "
        + str(sorted(fallow_years)),
        exclude=fallow_years)
    extras["openet"] = "included"
else:
    extras["openet"] = "missing"

if cdl:
    fs = pd.Series({int(y): v["fallow_share_pct"] for y, v in cdl.items()}, dtype=float)
    add("fallow_share", "Fallow/idle cropland share", "% of site", fs, "cdl", 1,
        "USDA CDL, pixel counts inside the site polygon", no_trend=True)
    extras["cdl"] = "included"
else:
    extras["cdl"] = "missing"

for name in ["imerg", "prism"]:
    extras[name] = (
        "file present, not merged (format unknown)"
        if (PROC / f"{name}.json").exists()
        else "missing"
    )

rank = rain_annual.rank().astype(int)
driest = int(rain_annual.idxmin())
wettest = int(rain_annual.idxmax())
r22 = int(rank.get(2022, 0)) if 2022 in rank.index else None
r = next(i for i in indicators if i["id"] == "rain_annual")
t = next(i for i in indicators if i["id"] == "temp_mean")

summary = [
    f"Annual rainfall: {r['trend']['direction']} "
    f"({r['trend']['slope_per_decade']} mm per decade, p={r['trend']['p_value']}); "
    f"driest year {driest}, wettest {wettest}.",
    f"Mean temperature: {t['trend']['direction']} "
    f"({t['trend']['slope_per_decade']} deg C per decade, p={t['trend']['p_value']}).",
]
if r22:
    summary.append(
        f"2022 was rank {r22} of {len(rain_annual)} for annual rainfall (1 = driest); "
        "fallowing in 2022 is shown by CDL, NDVI and OpenET, not by POWER rainfall alone."
    )

out = {
    "site_id": json.load(open("public/data/site.json"))["site_id"],
    "period": [int(full_years[0]), int(full_years[-1])],
    "indicators": indicators,
    "summary": summary,
    "driest_year": driest,
    "wettest_year": wettest,
    "fallow_affected_years": sorted(fallow_years),
    "other_sources": extras,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(out, open(OUT, "w"), indent=2)

print(pd.DataFrame({
    "rain_mm": rain_annual.round(0),
    "rain_rank_driest=1": rank,
    "rain_May_Oct": rain_grow.round(0),
    "T2M": temp_mean.round(2),
}))
for i in indicators:
    print(i["id"], i["trend"])
for s in summary:
    print(s)
print("Extras:", extras)