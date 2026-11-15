import { useEffect, useState } from "react";
import TrendChart from "./TrendChart";
import trendsData from "../../../public/data/trends.json";

const SLIDES = ["rainfall", "temperature", "ndvi"]; // indicator ids, in display order
const BY_ID = Object.fromEntries(trendsData.indicators.map((ind) => [ind.id, ind]));
const INTERVAL = 5000;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TrendCarousel({ onWhy }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearInterval(id);
  }, [paused, n]);

  const ind = BY_ID[SLIDES[i]];
  return (
    <div className="glass" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div key={SLIDES[i]} className="slide-in">
        {ind
          ? <TrendChart bare title={ind.label} trend={ind} k={ind.id} onWhy={onWhy} height={250} />
          : <p role="alert">No data for “{SLIDES[i]}”: this indicator was dropped.</p>}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <button className="btn btn-circle btn-sm" aria-label="Previous chart" onClick={() => setI((i - 1 + n) % n)}>‹</button>
        <div className="flex gap-2 items-center">
          {SLIDES.map((id, idx) => (
            <button key={id} aria-label={`Show ${BY_ID[id]?.label ?? id}`} onClick={() => setI(idx)}
              className="rounded-full bg-black transition-all"
              style={{ width: idx === i ? 18 : 12, height: idx === i ? 18 : 12, opacity: idx === i ? 1 : 0.6 }} />
          ))}
        </div>
        <button className="btn btn-circle btn-sm" aria-label="Next chart" onClick={() => setI((i + 1) % n)}>›</button>
      </div>
    </div>
  );
}