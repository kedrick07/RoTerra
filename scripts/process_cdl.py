import glob
import json
import re
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio

CDL_DIR = Path("data/raw/cdl/cdl_clip")

NAMES = {
    1: "Corn", 3: "Rice", 4: "Sorghum", 5: "Soybeans", 6: "Sunflower",
    12: "Sweet Corn", 13: "Pop or Orn Corn", 21: "Barley", 22: "Durum Wheat",
    23: "Spring Wheat", 24: "Winter Wheat", 27: "Rye", 28: "Oats",
    33: "Safflower", 36: "Alfalfa", 37: "Other Hay/Non Alfalfa",
    41: "Sugarbeets", 42: "Dry Beans", 43: "Potatoes", 54: "Tomatoes",
    58: "Clover/Wildflowers", 59: "Sod/Grass Seed", 61: "Fallow/Idle Cropland",
    69: "Grapes", 75: "Almonds", 76: "Walnuts", 111: "Open Water",
    121: "Developed/Open Space", 122: "Developed/Low Intensity",
    123: "Developed/Med Intensity", 124: "Developed/High Intensity",
    131: "Barren", 141: "Deciduous Forest", 152: "Shrubland",
    176: "Grassland/Pasture", 190: "Woody Wetlands", 195: "Herbaceous Wetlands",
    204: "Pistachios", 205: "Triticale",
}

try:
    from dbfread import DBF
    HAVE_DBF = True
except ImportError:
    HAVE_DBF = False


def vat_names(tif):
    if not HAVE_DBF:
        return {}
    dbf = Path(str(tif) + ".vat.dbf")
    if not dbf.exists():
        return {}
    out = {}
    for rec in DBF(str(dbf), encoding="latin-1"):
        keys = {k.lower(): v for k, v in rec.items()}
        val = keys.get("value")
        cls = keys.get("class_name") or keys.get("classname") or keys.get("class")
        if val is not None and cls:
            out[int(val)] = str(cls)
    return out


history = {}
for tif in sorted(glob.glob(str(CDL_DIR / "CDL_*_clip_*.tif"))):
    year = re.search(r"CDL_(\d{4})_", tif).group(1)
    with rasterio.open(tif) as src:
        arr = src.read(1)
        px_ha = abs(src.res[0] * src.res[1]) / 10000.0
    arr = arr[arr != 0]
    total = int(arr.size)
    counts = Counter(arr.tolist())
    vnames = vat_names(tif)

    classes = []
    for code, n in counts.most_common():
        classes.append({
            "code": int(code),
            "name": vnames.get(code) or NAMES.get(code) or f"CDL code {code}",
            "pixels": int(n),
            "area_ha": round(n * px_ha, 1),
            "share_pct": round(100 * n / total, 2),
        })
    top = classes[0]
    history[year] = {
        "total_pixels": total,
        "total_ha": round(total * px_ha, 1),
        "dominant_code": top["code"],
        "dominant_name": top["name"],
        "dominant_share_pct": top["share_pct"],
        "classes": classes,
    }

out = {
    "source": "USDA NASS Cropland Data Layer (CDL), 30 m, clipped to site",
    "method": "Count of non-zero pixels per class inside the clipped raster",
    "limitations": [
        "CDL is a classified satellite product with its own accuracy limits",
        "Class shares are pixel counts, not field-verified practice",
    ],
    "years": history,
}
Path("data/processed").mkdir(parents=True, exist_ok=True)
json.dump(out, open("data/processed/cdl_history.json", "w"), indent=2)

print(f"{'year':<6}{'pixels':>8}{'ha':>9}  dominant (share)   | next 2")
for y in sorted(history):
    h = history[y]
    nxt = ", ".join(f"{c['name']} {c['share_pct']}%" for c in h["classes"][1:3])
    print(f"{y:<6}{h['total_pixels']:>8}{h['total_ha']:>9}  "
          f"{h['dominant_name']} ({h['dominant_share_pct']}%)   | {nxt}")
print("dbf names used:", HAVE_DBF)