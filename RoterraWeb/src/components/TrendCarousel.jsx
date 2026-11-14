import { useEffect, useState } from "react";
import TrendChart from "./TrendChart";
import { trends } from "../data/placeholder";

const SLIDES = [
  { key: "rainfall", title: "Rainfall" },
  { key: "temperature", title: "Temperature" },
  { key: "ndvi", title: "NDVI" },
];
const INTERVAL = 5000; // ms between automatic slides

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

  const s = SLIDES[i];
  return (
    <div className="glass" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div key={s.key} className="slide-in">
        <TrendChart bare title={s.title} trend={trends[s.key]} k={s.key} onWhy={onWhy} height={250} />
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <button className="btn btn-circle btn-sm" aria-label="Previous chart" onClick={() => setI((i - 1 + n) % n)}>‹</button>
        <div className="flex gap-2 items-center">
          {SLIDES.map((d, idx) => (
            <button key={d.key} aria-label={`Show ${d.title}`} onClick={() => setI(idx)}
              className="rounded-full bg-black transition-all"
              style={{ width: idx === i ? 18 : 12, height: idx === i ? 18 : 12, opacity: idx === i ? 1 : 0.6 }} />
          ))}
        </div>
        <button className="btn btn-circle btn-sm" aria-label="Next chart" onClick={() => setI((i + 1) % n)}>›</button>
      </div>
    </div>
  );
}