import json
from pathlib import Path

import numpy as np
import planetary_computer as pc
import rasterio
from pystac_client import Client
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds

site = json.load(open("public/data/site.json"))
bbox = site["bbox"]
YEARS = range(2014, 2026)
MONTHS = (5, 9)

catalog = Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=pc.sign_inplace,
)


def read_band(href, bounds_wgs84):
    with rasterio.open(href) as src:
        b = transform_bounds("EPSG:4326", src.crs, *bounds_wgs84)
        win = from_bounds(*b, transform=src.transform)
        return src.read(1, window=win, boundless=True, fill_value=0)


def scene_ndvi(item):
    plat = item.properties.get("platform", "")
    red_key, nir_key = "red", "nir08"
    red = read_band(item.assets[red_key].href, bbox).astype("float32")
    nir = read_band(item.assets[nir_key].href, bbox).astype("float32")
    qa = read_band(item.assets["qa_pixel"].href, bbox).astype("uint16")

    h = min(red.shape[0], nir.shape[0], qa.shape[0])
    w = min(red.shape[1], nir.shape[1], qa.shape[1])
    red, nir, qa = red[:h, :w], nir[:h, :w], qa[:h, :w]

    bad = ((qa >> 1) & 1) | ((qa >> 2) & 1) | ((qa >> 3) & 1) | ((qa >> 4) & 1)
    valid = (red > 0) & (nir > 0) & (bad == 0)
    if valid.sum() < 200:
        return None

    red = red * 0.0000275 - 0.2
    nir = nir * 0.0000275 - 0.2
    ndvi = (nir - red) / (nir + red + 1e-9)
    ndvi = ndvi[valid]
    ndvi = ndvi[(ndvi > -0.2) & (ndvi < 1.0)]
    if ndvi.size < 200:
        return None
    return float(ndvi.mean()), int(ndvi.size), plat


out = {}
for y in YEARS:
    search = catalog.search(
        collections=["landsat-c2-l2"],
        bbox=bbox,
        datetime=f"{y}-{MONTHS[0]:02d}-01/{y}-{MONTHS[1]:02d}-30",
        query={
            "eo:cloud_cover": {"lt": 40},
            "platform": {"in": ["landsat-8", "landsat-9"]},
        },
    )
    items = list(search.items())
    print(y, len(items), "scenes")
    scenes = []
    for it in items:
        try:
            r = scene_ndvi(it)
        except Exception as ex:
            print("  skip", it.id, type(ex).__name__, str(ex)[:80])
            continue
        if r:
            scenes.append(
                {"date": it.datetime.date().isoformat(), "mean_ndvi": round(r[0], 3), "n_pixels": r[1]}
            )
    scenes.sort(key=lambda s: s["date"])
    out[str(y)] = {
        "scenes": scenes,
        "n_scenes": len(scenes),
        "peak_ndvi": max((s["mean_ndvi"] for s in scenes), default=None),
        "season_mean_ndvi": round(float(np.mean([s["mean_ndvi"] for s in scenes])), 3)
        if scenes
        else None,
    }
    print("  peak", out[str(y)]["peak_ndvi"], "mean", out[str(y)]["season_mean_ndvi"])
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    json.dump(
        {
            "source": "Landsat 8/9 Collection 2 Level-2 via Microsoft Planetary Computer",
            "method": "Mean NDVI over site bbox per clear scene, May-Sep, cloud cover <40%, QA-masked",
            "years": out,
        },
        open("data/processed/ndvi.json", "w"),
        indent=2,
    )
print("Saved data/processed/ndvi.json")