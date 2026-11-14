import { lazy, Suspense, Component } from "react";
const Globe = lazy(() => import("../components/Globe"));

// If WebGL or the texture fails, show the plain CSS globe instead of crashing the page.
class GlobeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="globe" aria-label="Globe" /> : this.props.children; }
}

const steps = [
  ["Trends", "20 years of NASA rain, heat and NDVI for your plot"],
  ["Priorities", "Tell us what matters: water, income, soil, pest, equipment"],
  ["Compare", "Four rotations scored across hundreds of futures"],
  ["Evidence", "Every score traces to a source and its limits"],
];
export default function Home({ go }) {
  return (
    <>
      <section className="flex flex-col lg:flex-row items-center justify-between gap-8 py-8 lg:min-h-[600px]">
        <div className="lg:-translate-y-12">
          <h1 className="font-display text-7xl sm:text-8xl tracking-tighter leading-none">RoTerra</h1>
          <p className="text-white text-xl leading-normal max-w-[40ch] mt-3">
            See beyond today’s forecast.
            Compare crop rotations across hundreds of climate futures.
            Every score explained by NASA data.
          </p>
          <button className="btn btn-ink mt-5 h-12" onClick={() => go("Explorer")}>Launch the Explorer</button>
        </div>
        <GlobeBoundary>
          <Suspense fallback={<div className="globe" aria-label="Loading globe" />}>
            <Globe />
          </Suspense>
        </GlobeBoundary>
      </section>
      <div className="glass mb-5"><h4>The problem</h4>
        <p>Malaysian paddy smallholders are planting into a shifting climate: rainfall is less predictable, and last decade’s “best” rotation may not hold. Single-year recommendations hide that risk.</p></div>
      <div className="glass"><h4>How it works</h4>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(([t, s], i) => (
            <div key={t}><b className="font-display text-2xl block">{t}{i < 3 && <span className="hidden md:inline"> →</span>}</b><span>{s}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}