import glob
import json
import math
import re
import shutil
from collections import Counter
from pathlib import Path

import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import transform_geom

SITE = Path("public/data/site.json")
CDL_DIR = Path("data/raw/cdl/cdl_clip")
ACRE_M2 = 4046.856
PIXEL_M2 = 900.0

NAMES = {1: "Corn", 3: "Rice", 5: "Soybeans", 6: "Sunflower", 24: "Winter Wheat",
         33: "Safflower", 36: "Alfalfa", 61: "Fallow/Idle Cropland",
         75: "Almonds", 111: "Open Water", 121: "Developed/Open Space",
         122: "Developed/Low Intensity", 195: "Herbaceous Wetlands"}

try:
    from dbfread import DBF
except ImportError:
    DBF = None


def vat_names(tif):
    p = Path(tif + ".vat.dbf")
    if DBF is None or not p.exists():
        return {}
    out = {}
    for rec in DBF(str(p), encoding="latin-1"):
        k = {a.lower(): b for a, b in rec.items()}
        cls = k.get("class_name") or k.get("classname") or k.get("class")
        if k.get("value") is not None and cls:
            out[int(k["value"])] = str(cls)
    return out


def parse_corner(c):
    if isinstance(c, dict):
        lon = c.get("lon", c.get("lng", c.get("longitude")))
        lat = c.get("lat", c.get("latitude"))
        return float(lon), float(lat)
    a, b = float(c[0]), float(c[1])
    return (a, b) if abs(a) > abs(b) else (b, a)


site = json.load(open(SITE))
print("Existing current_practice:", repr(site.get("current_practice")))
print("County:", repr(site.get("county")), "| state:", repr(site.get("state")))
print("corners raw:", site["corners"])
print("corners_order:", site.get("corners_order"))

raw_corners = site["corners"]
items = list(raw_corners.values()) if isinstance(raw_corners, dict) else list(raw_corners)
pts = [parse_corner(c) for c in items]

cx = sum(p[0] for p in pts) / len(pts)
cy = sum(p[1] for p in pts) / len(pts)
pts.sort(key=lambda p: math.atan2(p[1] - cy, p[0] - cx))
ring = pts + [pts[0]]
poly = {"type": "Polygon", "coordinates": [[list(p) for p in ring]]}
print("Polygon (lon, lat):", ring)

Path("data/raw").mkdir(parents=True, exist_ok=True)
shutil.copy(SITE, "data/raw/site.json.bak")

hist = {}
for tif in sorted(glob.glob(str(CDL_DIR / "CDL_*_clip_*.tif"))):
    year = int(re.search(r"CDL_(\d{4})_", tif).group(1))
    with rasterio.open(tif) as src:
        arr = src.read(1)
        geom = transform_geom("EPSG:4326", src.crs, poly)
        inside = geometry_mask([geom], out_shape=arr.shape,
                               transform=src.transform, invert=True)
    vals = arr[inside & (arr != 0)]
    total = int(vals.size)
    counts = Counter(vals.tolist())
    names = vat_names(tif)
    nm = lambda c: names.get(c) or NAMES.get(c) or f"CDL code {c}"
    rice = counts.get(3, 0)
    fallow = counts.get(61, 0)
    dom_code, dom_n = counts.most_common(1)[0]
    hist[year] = {
        "rice_acres": round(rice * PIXEL_M2 / ACRE_M2, 1),
        "total_acres": round(total * PIXEL_M2 / ACRE_M2, 1),
        "fallow_acres": round(fallow * PIXEL_M2 / ACRE_M2, 1),
        "dominant_class": nm(dom_code),
        "rice_share_pct": round(100 * rice / total, 2),
        "fallow_share_pct": round(100 * fallow / total, 2),
        "pixels": total,
    }

for slot in site["crop_history"]:
    y = slot["year"]
    if y in hist:
        h = hist[y]
        slot["rice_acres"] = h["rice_acres"]
        slot["total_acres"] = h["total_acres"]
        slot["fallow_acres"] = h["fallow_acres"]
        slot["dominant_class"] = h["dominant_class"]

rice_dom = [y for y, h in hist.items() if h["dominant_class"] == "Rice"]
non_rice = sorted(y for y in hist if y not in rice_dom)
practice = (
    f"Continuous rice: rice was the dominant CDL class in {len(rice_dom)} of "
    f"{len(hist)} years ({min(hist)}-{max(hist)})"
    + (f"; non-rice dominant in {', '.join(map(str, non_rice))}" if non_rice else "")
)
site["current_practice"] = practice

json.dump(site, open(SITE, "w"), indent=2)
Path("data/processed").mkdir(parents=True, exist_ok=True)
json.dump(hist, open("data/processed/cdl_polygon_history.json", "w"), indent=2)

print(f"{'year':<6}{'pixels':>8}{'rice_ac':>10}{'total_ac':>10}{'fallow_ac':>10}  rice%  fallow%  dominant")
for y in sorted(hist):
    h = hist[y]
    print(f"{y:<6}{h['pixels']:>8}{h['rice_acres']:>10}{h['total_acres']:>10}"
          f"{h['fallow_acres']:>10}  {h['rice_share_pct']:>5}  {h['fallow_share_pct']:>6}  {h['dominant_class']}")
print("Expected 2025 rice_acres ~3634.4, total ~3648.2")
print("current_practice ->", site["current_practice"])