import { evidence } from "../data/placeholder";
export default function EvidenceDrawer({ k, close }) {
  if (!k) return null;
  const e = evidence[k];
  return (
    <aside role="dialog" aria-label="Evidence" className="fixed right-0 top-0 h-full w-full max-w-sm z-[1000] p-6 shadow-2xl"
      style={{ background: "rgba(245,246,232,.96)", backdropFilter: "blur(8px)" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{e.title}</h2>
        <button className="btn btn-sm btn-circle" onClick={close} aria-label="Close">✕</button>
      </div>
      <h4 className="font-semibold">Source</h4><p className="mb-3">{e.source}</p>
      <h4 className="font-semibold">Limitation</h4><p className="mb-3">{e.limit}</p>
      <p className="note">Placeholder evidence. Real rules, weights and sources will load from JSON.</p>
    </aside>
  );
}
