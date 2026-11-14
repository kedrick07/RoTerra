import { useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { rotations, criteria, fan, validation } from "../data/placeholder";
const COLORS = ["#2f7fc1", "#d9a521", "#7a5a35", "#c0462f", "#5d8a3f"];

export default function Comparison({ priorities, onWhy }) {
  const ranked = useMemo(() => {
    const tw = criteria.reduce((a, c) => a + priorities[c], 0) || 1;
    return rotations.map((r) => ({ ...r, total: Math.round(criteria.reduce((a, c) => a + r.scores[c] * priorities[c], 0) / tw) }));
  }, [priorities]);
  const best = Math.max(...ranked.map((r) => r.total));
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ranked.map((r) => (
          <div key={r.id} className="glass" style={r.total === best ? { outline: "3px solid #111" } : {}}>
            <h3>Rotation {r.id}</h3>
            <p className="text-center text-sm">{r.name}</p>
            <p className="text-center font-display text-5xl my-1">{r.total}</p>
            <p className="note text-center">rule-based score / 100, weighted by your priorities</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <div className="glass">
          <h4>Score breakdown</h4>
          {ranked.map((r) => (
            <div key={r.id} className="my-3"><b>{r.id}</b>
              <div className="flex h-4 rounded overflow-hidden bg-black/10 cursor-pointer" onClick={() => onWhy("scores")}>
                {criteria.map((c, i) => <span key={c} style={{ width: `${r.scores[c] / 5}%`, background: COLORS[i] }} title={`${c}: ${r.scores[c]}`} />)}
              </div>
            </div>
          ))}
          <p>{criteria.map((c, i) => <span key={c} className="pill capitalize" style={{ borderColor: COLORS[i] }}>{c}</span>)}</p>
          <p className="note">Click a bar for the rule, weight and source.</p>
        </div>
        <div className="glass">
          <h4>Rank stability across futures</h4>
          {[...rotations].sort((a, b) => b.stability - a.stability).map((r) => (
            <div key={r.id} className="grid grid-cols-[30px_1fr_50px] items-center gap-3 my-3">
              <b>{r.id}</b>
              <div className="h-4 rounded bg-black/15"><div className="h-full rounded bg-black" style={{ width: `${r.stability}%` }} /></div>
              <span>{r.stability}%</span>
            </div>
          ))}
          <p className="note">“Rotation B ranks first in 71% of futures” (placeholder)</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mt-6">
        <div className="glass">
          <h4>Futures fan (precomputed JSON)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={fan}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#000" />
              <YAxis tick={{ fontSize: 11 }} stroke="#000" width={32} />
              <Area dataKey="b90" stroke="none" fill="rgba(0,0,0,.12)" isAnimationActive={false} />
              <Area dataKey="b50" stroke="none" fill="rgba(0,0,0,.2)" isAnimationActive={false} />
              <Line dataKey="median" stroke="#000" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="note">Bands show 50% and 90% of futures</p>
        </div>
        <div className="glass">
          <h4>Forecast validation (held-out years)</h4>
          <table className="wire"><thead><tr><th>Model</th><th>MAE</th><th>RMSE</th></tr></thead>
            <tbody>{validation.map((v) => <tr key={v.model}><td>{v.model}</td><td>{v.mae}</td><td>{v.rmse}</td></tr>)}</tbody></table>
          <p className="note mt-2">If Chronos-2 doesn’t win, say so.</p>
        </div>
      </div>
    </>
  );
}
