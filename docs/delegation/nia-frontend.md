# Role File — Nia: Frontend & Wireframes

*Hand this file plus `AGENTS.md`, `ARCHITECTURE.md`, `PRD.md`, and `DESIGN.md` to your AI assistant. You own everything the user sees; you start first and block nobody.*

## Your Lane

**Branch:** `frontend/nia` · **You own:** `src/features/`, `src/components/`, `src/styles/`, `public/` (non-data), `index.html`, `vite.config.js`, plus the root wireframes

You design and build the entire interface: the map, the trends, the rotation comparison with sliders, and the evidence drawer — driven by fixture data until Kedrick's real data lands.

## Work Sequence

1. **Wireframes first (Sat morning, ~1–2 hrs)** — sketch the four modules before any code: (a) map + field panel, (b) trends view with source/uncertainty labels, (c) rotation comparison cards with sliders and expandable breakdowns, (d) evidence drawer. Figma, Excalidraw, or paper photos in the team chat — these unblock Aizad's engine design, so post them early.
2. **Scaffold the app** — React + Vite (JavaScript), npm, then install exactly: `react-leaflet`, `leaflet`, `recharts`. Nothing else without team approval (AGENTS.md rule). Set up `src/styles/tokens.css` from `DESIGN.md` first — every component reads colors from CSS variables.
3. **Fixtures immediately** — create `public/data/*.json` fixture files matching the `ARCHITECTURE.md` schemas exactly, with `"fixture": true` and clearly fake but plausible values (e.g., rainfall around 450 mm/yr for Sacramento Valley). These unblock you AND Aizad. The UI must handle missing values and low-confidence states gracefully — the fixtures should include one deliberately missing indicator so you build the "no coverage" state.
4. **Build the screens** (order matters — risk first):
   - Map panel (Leaflet, CartoDB Positron tiles, field marker + AOI)
   - Trends panel (Recharts, one chart per indicator, source + resolution + confidence caption under each)
   - Rotation comparison: cards with rating bands, priority sliders (water, income, soil, pest, equipment), expandable per-dimension breakdowns wired to `src/lib/scoring.js`
   - Evidence drawer: provenance, limitations, gaps per indicator
5. **States everywhere** — loading skeletons, empty states, error states. Never silently drop an indicator.
6. **Polish (Sun)** — pass the `DESIGN.md` checklist, mobile sanity check, then screenshots for the README (map, trends, comparison, evidence drawer) — judges see these first.

## Integration Contract

- Aizad's engine: import `scoreRotations` from `src/lib/scoring.js` exactly as specified in `ARCHITECTURE.md` — render its output, never recompute scores in components.
- Kedrick's real data: same filenames, same schemas — his files replace your fixtures and the app just works. If a value is missing in real data, your empty state shows (that's a feature: uncertainty made visible).
- Scenario slider (rainfall −10/−20%): MVP cut line, Sunday only if everything else is done.

## Your Deliverable (definition of done)

A deployed, polished UI (all four modules, all states handled) that reads `public/data/*.json` and renders every score with its expandable evidence. Plus README screenshots.

## Rules of Thumb

- Follow `DESIGN.md` tokens strictly — no ad-hoc hex values, no new fonts, no dark mode.
- Small components, one per file, reusable primitives in `src/components/`.
- Don't touch `src/lib/` (Aizad's), `scripts/` (Kedrick's), or the JSON schemas — request changes via `docs/decisions.md`.
- If your AI suggests a UI library or a feature outside `PRD.md`'s MVP list, say no.
