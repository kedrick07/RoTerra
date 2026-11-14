import trendsData from "../../../public/data/trends.json";
import evidenceData from "../../../public/data/evidence.json";

const claims = trendsData.indicators
  .filter((i) => ["rainfall", "temperature", "humidity", "ndvi"].includes(i.id))
  .map((i) => {
    const ev = evidenceData.evidence.find((e) => e.id === i.evidence_id);
    return [i.trend_summary, ev?.source ?? i.source, ev?.limitations ?? ""];
  });

export default function Methodology() {
  return (
    <>
      <div className="glass overflow-x-auto"><h4>Claim → source → limitation</h4>
        <table className="wire"><thead><tr><th>Claim</th><th>Source</th><th>Limitation</th></tr></thead>
          <tbody>{claims.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table>
        <p className="note mt-2">Crop-trait values need local agronomic review.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] mt-6">
        <div className="glass"><h4>Data sources</h4>
          {[["Tier 1", "Core NASA datasets driving scores"], ["Tier 2", "Supporting / contextual datasets"], ["Tier 3", "Reference only, not scored"]]
            .map(([t, d]) => <p key={t} className="my-2"><span className="pill">{t}</span>{d}</p>)}
        </div>
        <div className="glass"><h4>Honest limits</h4>
          <ul className="list-disc pl-5 leading-8">
            <li>Crop traits need local review.</li>
            <li>One demo site; not a recommendation for your farm.</li>
          </ul></div>
      </div>
    </>
  );
}