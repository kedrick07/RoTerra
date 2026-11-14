import json
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SITE_PATH = ROOT / "public" / "data" / "site.json"
RAW_PATH = ROOT / "data" / "raw" / "power_daily_raw.json"

URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMS = "PRECTOTCORR,T2M,RH2M"
MISSING = -999  # POWER fill value (check the printout below)

with open(SITE_PATH, encoding="utf-8") as f:
    site = json.load(f)

LAT, LON = site["lat"], site["lon"]
START = f'{site["analysis_years"]["start"]}0101'
END = f'{site["analysis_years"]["end"]}1231'


def fetch():
    r = requests.get(URL, params={
        "parameters": PARAMS, "community": "AG",
        "latitude": LAT, "longitude": LON,
        "start": START, "end": END, "format": "JSON",
    }, timeout=60)
    r.raise_for_status()
    return r.json()


def main():
    data = fetch()

    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(RAW_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f)

    series = data["properties"]["parameter"]
    print("request:", LAT, LON, START, END)
    for name in PARAMS.split(","):
        values = list(series[name].values())
        missing = sum(1 for v in values if v == MISSING)
        print(name, "days:", len(values),
              "min:", min(values), "max:", max(values),
              "missing:", missing)
    first_key = next(iter(series["PRECTOTCORR"]))
    print("first date key:", first_key)


if __name__ == "__main__":
    main()