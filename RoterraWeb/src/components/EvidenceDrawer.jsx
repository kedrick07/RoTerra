import trendsData from "../../../public/data/trends.json";
import evidenceData from "../../../public/data/evidence.json";

// Explanations of the method itself (not data), for the "priorities" and "scores" buttons
const METHOD = {
  priorities: {
    title: "Priority weights",
    source: "Your slider values",
    limitations: "Weights change the ranking. They are not agronomic advice.",
  },
  scores: {
    title: "How scores are calculated",
    source: "Rule-based scoring engine (src/lib/scoring.js). Full formula in docs/decisions.md.",
    limitations: "Crop trait values are illustrative and need local agronomic review.",
  },
};

// k is a trend indicator id (e.g. "rainfall"), an evidence id (e.g. "ssurgo"), or a METHOD key
function lookup(k) {
  if (METHOD[k]) return METHOD[k];
  const ind = trendsData.indicators.find((i) => i.id === k);
  const ev = evidenceData.evidence.find((e) => e.id === (ind?.evidence_id ?? k));
  if (!ev) return null;
  return { title: ind?.label ?? ev.source, trendSummary: ind?.trend_summary, ...ev };
}

const Row = ({ label, value }) =>
  value ? <><h4 className="font-semibold">{label}</h4><p className="mb-3">{value}</p></> : null;

export default function EvidenceDrawer({ k, close }) {
  if (!k) return null;
  const e = lookup(k);
  return (
    <aside role="dialog" aria-label="Evidence" className="fixed right-0 top-0 h-full w-full max-w-sm z-[1000] p-6 shadow-2xl overflow-y-auto"
      style={{ background: "rgba(245,246,232,.96)", backdropFilter: "blur(8px)" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{e?.title ?? "Evidence"}</h2>
        <button className="btn btn-sm btn-circle" onClick={close} aria-label="Close">✕</button>
      </div>
      {!e ? (
        <p role="alert">No evidence record found for “{k}”.</p>
      ) : (
        <>
          <Row label="What the data shows" value={e.trendSummary} />
          <Row label="Source" value={e.url ? <a className="underline" href={e.url} target="_blank" rel="noreferrer">{e.source}</a> : e.source} />
          <Row label="Resolution" value={e.resolution} />
          <Row label="Coverage" value={e.coverage} />
          <Row label="Retrieved" value={e.retrieved} />
          <Row label="Confidence" value={e.confidence} />
          <Row label="Limitations" value={e.limitations} />
        </>
      )}
    </aside>
  );
}
