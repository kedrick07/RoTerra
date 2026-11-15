import json, os, sys, time
from pathlib import Path
import requests
from dotenv import load_dotenv

load_dotenv()
KEY = os.getenv("OPENET_API_KEY")
if not KEY:
    sys.exit("OPENET_API_KEY missing in .env")

site = json.load(open("public/data/site.json"))
lon, lat = site["lon"], site["lat"]
URL = "https://openet-api.org/raster/timeseries/point"
HDR = {
    "Authorization": KEY,
    "accept": "application/json",
    "Content-Type": "application/json",
}
YEARS = range(2015, 2026)
RETRIES = 4
WAIT = 20

raw = Path("data/raw/openet")
raw.mkdir(parents=True, exist_ok=True)
Path("data/processed").mkdir(parents=True, exist_ok=True)

results, failed = {}, {}

extra = Path("data/processed/openet_2014_2015.json")
if extra.exists():
    ex = json.load(open(extra))
    if "2015_Ensemble" in ex:
        (raw / "ET_2015.json").write_text(json.dumps(ex["2015_Ensemble"]))


def call(y):
    args = {
        "date_range": [f"{y}-01-01", f"{y}-12-31"],
        "interval": "monthly",
        "geometry": [lon, lat],
        "model": "Ensemble",
        "variable": "ET",
        "reference_et": "gridMET",
        "units": "mm",
        "file_format": "JSON",
    }
    return requests.post(URL, headers=HDR, json=args, timeout=120)


for y in YEARS:
    cache = raw / f"ET_{y}.json"
    if cache.exists():
        results[str(y)] = json.load(open(cache))
        print(y, "cached")
        continue
    for attempt in range(1, RETRIES + 1):
        r = call(y)
        if r.ok:
            results[str(y)] = r.json()
            cache.write_text(json.dumps(results[str(y)]))
            print(y, "OK", str(results[str(y)])[:100])
            break
        print(y, f"attempt {attempt} -> {r.status_code}", r.text[:100].replace("\n", " "))
        if r.status_code != 408:
            failed[str(y)] = r.text[:200]
            break
        time.sleep(WAIT * attempt)
    else:
        failed[str(y)] = r.text[:200]
    time.sleep(1)

json.dump({"ok": results, "failed": failed},
          open("data/processed/openet_raw_combined.json", "w"))
print("OK years:", sorted(results), "| Failed:", sorted(failed))