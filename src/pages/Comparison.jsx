import { useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import rotationsData from "../../../public/data/rotations.json";
import cropsData from "../../../public/data/crops.json";
import trendsData from "../../../public/data/trends.json";
import { scoreRotations } from "../../../src/lib/scoring.js";
import { DIMENSIONS, DIMENSION_LABELS, BANDS } from "../../../src/lib/scoringConfig.js";
import { fan, validation } from "../data/placeholder"; // still placeholder, see notes

// Segment colours for the breakdown bar (same order as DIMENSIONS)
const COLORS = ["#2f7fc1", "#d9a521", "#7a5a35", "#c0462f", "#5d8a3f"];
// TODO: swap these for the rating-band colours in DESIGN.md (I haven't seen that file)
const BAND_STYLE = {
  "strong-fit":   { background: "rgba(62,124,58,0.12)",  color: "#3E7C3A" },
  promising:      { background: "#FFFFFF",               color: "#3E7C3A" },
  "needs-review": { background: "rgba(199,127,46,0.12)", color: "#C77F2E" },
  "not-advised":  { background: "rgba(181,83,60,0.12)",  color: "#B5533C" },
};

export default function Comparison({ priorities, onWhy }) {
  const { results, error } = useMemo(() => {
    try {
      return { results: scoreRotations(rotationsData, cropsData, trendsData, priorities), error: null };
    } catch (e) {
      return { results: [], error: e.message }; // shown below, never silent
    }
  }, [priorities]);

  if (error) {
    return <div role="alert" className="glass"><h4>Couldn’t score the rotations</h4><p>{error}</p></div>;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {results.map((r) => {
          const band = BANDS.find((b) => b.id === r.band);
          return (
            <div key={r.rotationId} className="glass" style={r.rank === 1 ? { outline: "3px solid #111" } : {}}>
              <h3>{r.name}</h3>
              {r.isBaseline && <p className="text-center"><span className="pill">Your current practice</span></p>}
              <p className="text-center font-display text-5xl my-1">{r.totalScore}</p>
              <p className="text-center">
                <span className="pill" style={{ borderColor: BAND_STYLE[r.band], borderColor: BAND_STYLE[r.band].color }}>
                  {band?.label ?? r.band}
                </span>
              </p>
              <p className="note text-center mt-1">Rank {r.rank} · score / 100, weighted by your priorities</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="glass">
          <h4>Score breakdown</h4>
          {results.map((r) => (
            <div key={r.rotationId} className="my-3">
              <b>{r.name}</b>
              <div className="flex h-4 rounded overflow-hidden bg-black/10 cursor-pointer" onClick={() => onWhy("scores")}>
                {DIMENSIONS.map((c, i) => (
                  <span key={c} style={{ width: `${r.dimensions[c].contribution}%`, background: COLORS[i] }}
                    title={`${DIMENSION_LABELS[c]}: ${r.dimensions[c].contribution}`} />
                ))}
              </div>
            </div>
          ))}
          <p>{DIMENSIONS.map((c, i) => <span key={c} className="pill" style={{ borderColor: COLORS[i] }}>{DIMENSION_LABELS[c]}</span>)}</p>
          <p className="note">Segments add up to the total score.</p>
        </div>

        <div className="glass">
          <h4>Why these scores</h4>
          {results.map((r) => (
            <details key={r.rotationId} className="my-2">
              <summary className="cursor-pointer font-semibold">{r.name}</summary>
              {r.adjustments.length === 0
                ? <p className="note mt-1">No adjustments applied.</p>
                : <ul className="list-disc pl-5 mt-1">
                    {r.adjustments.map((a, i) => <li key={i}>{a.reason} <span className="note">({a.effect})</span></li>)}
                  </ul>}
            </details>
          ))}
        </div>
      </div>

      {/* Placeholder panels, to discuss with the team (not in the PRD MVP list) */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mt-6">
        <div className="glass">
          <h4>Futures fan (placeholder data)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={fan}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#000" />
              <YAxis tick={{ fontSize: 11 }} stroke="#000" width={32} />
              <Area dataKey="b90" stroke="none" fill="rgba(0,0,0,.12)" isAnimationActive={false} />
              <Area dataKey="b50" stroke="none" fill="rgba(0,0,0,.2)" isAnimationActive={false} />
              <Line dataKey="median" stroke="#000" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="note">Placeholder, not real data.</p>
        </div>
        <div className="glass">
          <h4>Forecast validation (placeholder)</h4>
          <table className="wire"><thead><tr><th>Model</th><th>MAE</th><th>RMSE</th></tr></thead>
            <tbody>{validation.map((v) => <tr key={v.model}><td>{v.model}</td><td>{v.mae}</td><td>{v.rmse}</td></tr>)}</tbody></table>
        </div>
      </div>
    </>
  );
}