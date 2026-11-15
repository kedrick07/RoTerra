# RoTerra — Project Rules

*Rulebook for AI agents (and humans) working in this repo. Read this before writing any code.*

## Current phase

- **Active build** (NASA Space Apps 2026, Nov 14–15). Submission closes Sunday Nov 15, 11:59 PM local.
- Build the unchecked items in `docs/TASKS.md` in order. Do not invent extra features — the MVP list in `docs/PRD.md` is strict.
- Repo: `kedrick07/RoTerra` (public). Work happens on `dev` and feature branches; `main` is the submission branch and must match `dev` before submission.

## Architecture (fixed)

- Frontend: **React + Vite (JavaScript/JSX)** at the repo root. Maps: **Leaflet** (via `react-leaflet`). Charts: **Recharts**.
- Styling: **Tailwind CSS 4 + daisyUI 5** with design tokens in `src/index.css` (see `docs/DESIGN.md`). Do not add other UI kits or component libraries.
- Hero visual: a lazy-loaded **three.js** globe (`@react-three/fiber`, `drei`). This is an accepted exception, kept behind an error boundary. Do not add other 3D or animation libraries.
- Data preparation: **Python 3 scripts** → static JSON in `public/data/`.
- **No backend, no database, no authentication.** The scoring engine is rule-based. Any statistical projection (stretch feature only) must be trained offline in `scripts/`, shipped as static JSON with real backtest error, and labelled "projection, not an observation".
- Package manager: **npm**. Do not introduce yarn/pnpm.
- Do not add any dependency without explaining the need. Anything beyond the current `package.json` — ask first.
- Keep the app working offline after data fetch: the app only reads `public/data/*.json` (plus map tiles).

## Directory boundaries

- `src/App.jsx`, `src/main.jsx`, `src/index.css`: app shell and styles.
- `src/components/`: reusable UI (Nav, EvidenceDrawer, TrendCarousel, TrendChart, Globe).
- `src/pages/`: Home, Explorer, Comparison, Methodology.
- `src/lib/`: the rule-based scoring engine (`scoring.js`, `scoringConfig.js`) and the data loader (`data.js`). Shared utilities go here.
- `scripts/`: Python data retrieval and transformation.
- `data/raw/`: local pipeline inputs; **not committed**.
- `data/processed/`: small pipeline intermediates; **committed for provenance**.
- `public/data/`: reviewed, app-ready JSON; committed.
- `docs/`: planning notes, architecture, decisions, design, PRD, tasks.
- `tests/`: automated tests (`npm test`).

## Implementation conventions

- Small functions, small components. One component per file. A component file exports components only (lint rule).
- Scoring logic lives in `src/lib/` — never hardcode formulas inside UI components.
- Validate every JSON file before publishing it to `public/data/` (`scripts/publish_data.py`).
- Show explicit loading, missing-data, and error states; never silently drop an indicator.
- Avoid unrelated refactoring and premature abstractions.
- Follow `docs/DESIGN.md`; do not invent ad-hoc colors or fonts. Use system fonts, no webfont downloads.
- `npm run lint` and `npm test` must pass before a commit is pushed.

## Scientific integrity

- Explainable, rule-based scoring only. No synthetic or fabricated data in the UI.
- Every indicator records: source, units, dates, spatial resolution, limitations.
- Label illustrative values clearly as such.
- Never present missing or fabricated values as observations.
- Distinguish observations vs assumptions vs scenario inputs.
- Crop suitability values are illustrative and flagged as "needs local agronomic review".
- If a data source has no coverage for the field (e.g., ECOSTRESS cloud gap), drop the indicator and say so — do not fake it.
- The README and submission may only list datasets that appear in `public/data/evidence.json`.

## Demo site context

- Field: Colusa Basin rice landscape, Colusa County, California (~15 km², drawn in CropScape).
- Baseline practice = whatever USDA CDL crop history actually shows.
- English only. No Malaysia/BM content in the app; the Malaysian adaptation is a README paragraph and one deck slide only.

## Collaboration and AI assistance

- Explain proposed changes before large edits.
- Make small, reviewable changes; never claim tests passed unless run.
- Never commit credentials, tokens, or private information (`.env` is gitignored).
- Do not force-push or rewrite history on `main`.
- Record significant architecture changes in `docs/DECISIONS.md` and AI assistance in its AI log.