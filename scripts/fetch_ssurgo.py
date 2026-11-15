import json
from pathlib import Path
import requests

site = json.load(open("public/data/site.json"))
w, s, e, n = site["bbox"]
wkt = f"POLYGON(({w} {s},{e} {s},{e} {n},{w} {n},{w} {s}))"
URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest"


def query(sql):
    r = requests.post(
        URL,
        data={"query": sql, "format": "JSON+COLUMNNAME"},
        timeout=120,
    )
    if not r.ok:
        print("STATUS:", r.status_code)
        print("BODY:", r.text[:800])
        r.raise_for_status()
    table = r.json().get("Table", [])
    if not table:
        return []
    header, body = table[0], table[1:]
    return [dict(zip(header, row)) for row in body]


sql = f"""
SELECT mu.mukey, mu.muname, c.compname, c.comppct_r, c.drainagecl, c.hydgrp,
       ch.hzdept_r, ch.hzdepb_r, ch.sandtotal_r, ch.silttotal_r, ch.claytotal_r,
       ch.om_r, ch.ph1to1h2o_r, ch.ksat_r
FROM mapunit mu
JOIN component c ON c.mukey = mu.mukey
LEFT JOIN chorizon ch ON ch.cokey = c.cokey AND ch.hzdept_r = 0
WHERE mu.mukey IN (
    SELECT DISTINCT mukey
    FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('{wkt}')
)
ORDER BY c.comppct_r DESC
"""

rows = query(sql)
print(len(rows), "rows")
for r in rows[:8]:
    print(
        r["compname"], r["comppct_r"], r["drainagecl"],
        r["hydgrp"], r["claytotal_r"], r["om_r"],
    )

Path("data/processed").mkdir(parents=True, exist_ok=True)
json.dump(rows, open("data/processed/ssurgo.json", "w"), indent=2)
print("Saved data/processed/ssurgo.json")