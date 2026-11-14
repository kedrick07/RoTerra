import json
from collections import defaultdict
from pathlib import Path

rows = json.load(open("data/processed/ssurgo.json"))

seen, uniq = set(), []
for r in rows:
    key = (r["mukey"], r["compname"], r["comppct_r"], r["drainagecl"])
    if key in seen:
        continue
    seen.add(key)
    uniq.append(r)


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def weighted(field):
    pairs = [(num(r[field]), num(r["comppct_r"])) for r in uniq]
    pairs = [(v, w) for v, w in pairs if v is not None and w]
    if not pairs:
        return None
    return round(sum(v * w for v, w in pairs) / sum(w for _, w in pairs), 1)


by_name = defaultdict(lambda: {"pct": 0.0, "drainage": None, "hydgrp": None})
for r in uniq:
    d = by_name[r["compname"]]
    d["pct"] += num(r["comppct_r"]) or 0
    d["drainage"] = r["drainagecl"]
    d["hydgrp"] = r["hydgrp"]

total = sum(v["pct"] for v in by_name.values()) or 1

components = [
    {
        "name": k,
        "share_pct": round(100 * v["pct"] / total, 1),
        "drainage_class": v["drainage"],
        "hydrologic_group": v["hydgrp"],
    }
    for k, v in sorted(by_name.items(), key=lambda kv: -kv[1]["pct"])
]

soil = {
    "source": "USDA NRCS SSURGO via Soil Data Access",
    "method": (
        "Map units intersecting site bbox; top horizon; "
        "component-percent weighted; shares normalised across map units"
    ),
    "limitations": [
        "Shares are normalised component percentages across intersecting map units, "
        "not measured area fractions of the site",
        "Top horizon only (0 cm upper depth)",
        "Missing values (e.g. hydrologic group) left as null",
    ],
    "weighted_topsoil": {
        "clay_pct": weighted("claytotal_r"),
        "sand_pct": weighted("sandtotal_r"),
        "silt_pct": weighted("silttotal_r"),
        "organic_matter_pct": weighted("om_r"),
        "ph": weighted("ph1to1h2o_r"),
        "ksat_um_per_s": weighted("ksat_r"),
    },
    "components": components,
}

Path("data/processed").mkdir(parents=True, exist_ok=True)
json.dump(soil, open("data/processed/soil.json", "w"), indent=2)
print(json.dumps(soil, indent=2))