import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
const Square = ({ cx, cy }) => <rect x={cx - 3} y={cy - 3} width={6} height={6} fill="#000" />;

export default function TrendChart({ title, trend, k, onWhy, height = 140, bare = false }) {
  return (
    <div className={bare ? "" : "glass"}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={trend.data}>
          <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#000" interval={4} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="#000" width={42} />
          <Tooltip />
          <Line dataKey="value" stroke="#000" strokeWidth={2} dot={<Square />} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="note mt-1">{trend.source} · {trend.unit} ·{" "}
        <button className="underline" onClick={() => onWhy(k)}>Why?</button></p>
    </div>
  );
}
