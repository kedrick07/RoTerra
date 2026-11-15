import json
import sys
from collections import defaultdict
from pathlib import Path

PROC = Path("data/processed")
DST = Path("public/data")
DST.mkdir(parents=True, exist_ok=True)

META = {
    "rain_annual": ("rainfall", "NASA POWER (PRECTOTCORR)",
                    "gridded model product, about 50 km", "medium"),
    "rain_may_oct": ("rainfall_growing_season", "NASA POWER (PRECTOTCORR)",
                     "gridded model product, about 50 km", "medium"),
    "temp_mean": ("temperature", "NASA POWER (T2M)",
                  "gridded model product, about 50 km", "medium"),
    "temp_may_oct": ("temperature_growing_season", "NASA POWER (T2M)",
                     "gridded model product, about 50 km", "medium"),
    "rh_mean": ("humidity", "NASA POWER (RH2M)",
                "gridded model product, about 50 km", "medium"),
    "ndvi_peak": ("ndvi", "Landsat 8/9 Collection 2 L2 (Planetary Computer)",
                  "30 m, mean over site bbox", "high"),
    "et_may_oct": ("et_growing_season", "OpenET Ensemble (gridMET reference ET)",
                   "30 m, single pixel at site centre", "medium"),
    "fallow_share": ("fallow_share", "USDA NASS Cropland Data Layer",
                     "30 m, pixel counts inside site polygon", "high"),
}
NULL_FALLOW = {"ndvi_peak", "et_may_oct"}
NO_TREND = {"no clear trend", "not assessed", "insufficient data"}


def summarize(ind, label, unit, years):
    tr = ind["trend"]
    period = f"{years[0]}-{years[-1]}"
    if ind["id"] == "fallow_share":
        peak = max(ind["series"], key=lambda r: r["value"])
        return (f"Management signal, not a climate trend: fallow share peaked at "
                f"{peak['value']}% in {peak['year']}.")
    if tr["direction"] in NO_TREND:
        txt = f"No statistically clear trend over {period} (p={tr['p_value']})."
    else:
        txt = (f"{label} is {tr['direction']}: {tr['slope_per_decade']} {unit} per decade "
               f"over {period} (p={tr['p_value']}).")
    if ind.get("trend_excluded_years"):
        txt += (f" Fallow-affected years {ind['trend_excluded_years']} are left blank in "
                f"'values' so they do not read as a trend; the full series is in "
                f"'values_all_years'.")
    return txt


def build_trends():
    src = json.load(open(PROC / "trends.json"))
    fallow_years = set(src["fallow_affected_years"])
    out = []
    for ind in src["indicators"]:
        new_id, source, res, conf = META[ind["id"]]
        all_vals = [{"year": r["year"], "value": r["value"]} for r in ind["series"]]
        if ind["id"] in NULL_FALLOW:
            vals = [{"year": v["year"],
                     "value": None if v["year"] in fallow_years else v["value"]}
                    for v in all_vals]
        else:
            vals = list(all_vals)
        years = [v["year"] for v in vals]
        nums = [v["value"] for v in vals if v["value"] is not None]
        mean = round(sum(nums) / len(nums), 3) if nums else None
        tr = ind["trend"]
        item = {
            "id": new_id,
            "label": ind["label"],
            "unit": ind["unit"],
            "source": source,
            "resolution": res,
            "period": f"{years[0]}-{years[-1]}",
            "confidence": conf,
            "values": vals,
            "trend_summary": summarize(ind, ind["label"], ind["unit"], years),
            "evidence_id": ind["evidence_id"],
            "mean": mean,
            "trend": tr,
            "trend_significant": tr["direction"] not in NO_TREND,
            "trend_pct_per_decade": (
                round(100 * tr["slope_per_decade"] / mean, 1)
                if tr.get("slope_per_decade") is not None and mean else None
            ),
            "note": ind.get("note"),
        }
        if ind["id"] in NULL_FALLOW:
            item["values_all_years"] = all_vals
        for k in ("trend_all_years", "trend_excluded_years", "low_et_years"):
            if k in ind:
                item[k] = ind[k]
        out.append(item)
    return {
        "site_id": src["site_id"],
        "period": f"{src['period'][0]}-{src['period'][1]}",
        "indicators": out,
        "summary": src["summary"],
        "fallow_affected_years": src["fallow_affected_years"],
        "other_sources": src["other_sources"],
    }


def texture(sand, silt, clay):
    if None in (sand, silt, clay):
        return None
    if silt + 1.5 * clay < 15:
        return "sand"
    if silt + 1.5 * clay >= 15 and silt + 2 * clay < 30:
        return "loamy sand"
    if (7 <= clay < 20 and sand > 52 and silt + 2 * clay >= 30) or \
       (clay < 7 and silt < 50 and silt + 2 * clay >= 30):
        return "sandy loam"
    if 7 <= clay < 27 and 28 <= silt < 50 and sand <= 52:
        return "loam"
    if (silt >= 50 and 12 <= clay < 27) or (50 <= silt < 80 and clay < 12):
        return "silt loam"
    if silt >= 80 and clay < 12:
        return "silt"
    if 20 <= clay < 35 and silt < 28 and sand > 45:
        return "sandy clay loam"
    if 27 <= clay < 40 and 20 < sand <= 45:
        return "clay loam"
    if 27 <= clay < 40 and sand <= 20:
        return "silty clay loam"
    if clay >= 35 and sand > 45:
        return "sandy clay"
    if clay >= 40 and silt >= 40:
        return "silty clay"
    if clay >= 40 and sand <= 45 and silt < 40:
        return "clay"
    return "unclassified"


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def build_soil():
    soil = json.load(open(PROC / "soil.json"))
    rows = json.load(open(PROC / "ssurgo.json"))
    seen, uniq = set(), []
    for r in rows:
        k = (r["mukey"], r["compname"], r["comppct_r"], r["drainagecl"])
        if k not in seen:
            seen.add(k)
            uniq.append(r)

    agg = defaultdict(lambda: {"w": 0.0, "sums": defaultdict(float),
                               "wts": defaultdict(float), "drain": None, "hyd": None})
    for r in uniq:
        a = agg[r["compname"]]
        w = num(r["comppct_r"]) or 0
        a["w"] += w
        a["drain"], a["hyd"] = r["drainagecl"], r["hydgrp"]
        for f in ("sandtotal_r", "silttotal_r", "claytotal_r", "om_r"):
            v = num(r[f])
            if v is not None and w:
                a["sums"][f] += v * w
                a["wts"][f] += w

    total = sum(a["w"] for a in agg.values()) or 1
    comps = []
    for name, a in sorted(agg.items(), key=lambda kv: -kv[1]["w"]):
        m = {f: (a["sums"][f] / a["wts"][f] if a["wts"][f] else None) for f in a["sums"]}
        sand, silt, clay = m.get("sandtotal_r"), m.get("silttotal_r"), m.get("claytotal_r")
        om = m.get("om_r")
        comps.append({
            "name": name,
            "texture": texture(sand, silt, clay),
            "drainage_class": a["drain"],
            "organic_matter_pct": round(om, 1) if om is not None else None,
            "available_water_capacity": None,
            "share_pct": round(100 * a["w"] / total, 1),
            "hydrologic_group": a["hyd"],
            "clay_pct": round(clay, 1) if clay is not None else None,
            "sand_pct": round(sand, 1) if sand is not None else None,
            "silt_pct": round(silt, 1) if silt is not None else None,
        })

    wt = soil["weighted_topsoil"]
    constraints = []
    dom = comps[0] if comps else None
    if dom and dom["drainage_class"] and "poorly" in dom["drainage_class"].lower():
        constraints.append({
            "id": "poor_drainage",
            "label": "Poorly drained soils: suit flooded rice, limit upland rotation crops",
            "severity": "high",
            "basis": f"Dominant component {dom['name']} ({dom['share_pct']}%): {dom['drainage_class']}",
        })
    if wt.get("clay_pct") and wt["clay_pct"] >= 40:
        constraints.append({
            "id": "heavy_clay",
            "label": "Heavy clay topsoil: slow to work, can crack when dry",
            "severity": "moderate",
            "basis": f"Weighted topsoil clay {wt['clay_pct']}%",
        })
    if wt.get("ksat_um_per_s") is not None and wt["ksat_um_per_s"] < 1:
        constraints.append({
            "id": "slow_permeability",
            "label": "Very slow water movement through the soil",
            "severity": "moderate",
            "basis": f"Weighted saturated conductivity {wt['ksat_um_per_s']} um/s",
        })
    for c in constraints:
        c["needs_local_review"] = True

    return {
        "source": "USDA NRCS SSURGO",
        "retrieval": "Soil Data Access, map units intersecting the site bbox",
        "components": comps,
        "constraints": constraints,
        "weighted_topsoil": wt,
        "limitations": soil["limitations"] + [
            "available_water_capacity not retrieved (null)",
            "Texture computed from top-horizon sand/silt/clay with the standard USDA triangle rules",
            "Constraints are rule-derived from SSURGO values and need local review",
        ],
    }


def check(name, data, kind):
    problems = []
    if kind == "trends":
        need = {"id", "label", "unit", "source", "resolution", "period",
                "confidence", "values", "trend_summary"}
        for i in data["indicators"]:
            miss = need - set(i)
            if miss:
                problems.append(f"{i.get('id')}: missing {sorted(miss)}")
        ids = {i["id"] for i in data["indicators"]}
        for needed in ("rainfall", "ndvi"):
            if needed not in ids:
                problems.append(f"engine rule indicator '{needed}' missing")
    if kind == "soil":
        need = {"name", "texture", "drainage_class", "organic_matter_pct",
                "available_water_capacity"}
        for c in data["components"]:
            miss = need - set(c)
            if miss:
                problems.append(f"{c.get('name')}: missing {sorted(miss)}")
        if "constraints" not in data:
            problems.append("missing constraints")
    if problems:
        print(f"CONTRACT PROBLEMS in {name}:", *problems, sep="\n  ")
        sys.exit(1)


trends = build_trends()
check("trends.json", trends, "trends")
json.dump(trends, open(DST / "trends.json", "w"), indent=2)
print("wrote", DST / "trends.json", "| indicators:", [i["id"] for i in trends["indicators"]])

soil = build_soil()
check("soil.json", soil, "soil")
json.dump(soil, open(DST / "soil.json", "w"), indent=2)
print("wrote", DST / "soil.json")
for c in soil["components"]:
    print(" ", c["name"], c["share_pct"], c["texture"], c["drainage_class"], c["organic_matter_pct"])
print("constraints:", [c["id"] for c in soil["constraints"]])

for name in ["site.json", "crops.json", "rotations.json", "evidence.json"]:
    p = DST / name
    print(("ok      " if p.exists() else "MISSING "), p)