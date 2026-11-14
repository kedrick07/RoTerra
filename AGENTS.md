# RoTerra — Project Rules

*Rulebook for AI agents (and humans) working in this repo. Read this before writing any code.*

## Current phase

- **Active build** (NASA Space Apps 2026, Nov 14–15). Submission closes Sunday Nov 15, 11:59 PM local.
- Build the unchecked items in `TASKS.md` in order. Do not invent extra features — the MVP list in `PRD.md` is strict.
- Repo: `kedrick07/RoTerra` (public, branch `main`).

## Architecture (fixed)

- Frontend: **React + Vite (JavaScript/JSX)**. Maps: **Leaflet** (via `react-leaflet`). Charts: **Recharts**.
- Data preparation: **Python 3 scripts** run during the hackathon → static JSON in `public/data/`.
- **No backend, no database, no authentication, no ML model.**
- Styling: plain CSS with design tokens in `src/styles/` (see `DESIGN.md`). **Do not install Tailwind, UI kits, or component libraries.**
- Package manager: **npm**. Do not introduce yarn/pnpm.
- Do not add any dependency without explaining the need. Allowed additions are limited to: `react-leaflet`, `leaflet`, `recharts`. Anything else — ask first.
- Keep the app working offline after data fetch: the app only ever reads `public/data/*.json`.

## Directory boundaries

- `src/components/`: reusable UI primitives.
- `src/features/risk/`: map + environmental trends view.
- `src/features/rotations/`: strategy comparison + priority sliders + scoring display.
- `src/features/evidence/`: provenance, confidence, information gaps.
- `src/lib/`: shared utilities and the rule-based scoring engine.
- `scripts/`: Python data retrieval and transformation.
- `data/raw/`, `data/processed/`: local pipeline inputs/outputs; **not committed** (gitignored).
- `public/data/`: reviewed, app-ready JSON; committed.
- `docs/`: team planning notes (architecture decisions, data-source notes).
- `tests/`: automated tests added during development.

## Implementation conventions

- Small functions, small components. One component per file.
- Scoring logic lives in `src/lib/` — never hardcode formulas inside UI components.
- Validate every JSON file before publishing it to `public/data/` (script or manual check).
- Show explicit loading, missing-data, and error states; never silently drop an indicator.
- Avoid unrelated refactoring and premature abstractions.
- Follow `DESIGN.md` tokens; do not invent ad-hoc colors or fonts.

## Scientific integrity

- Explainable, rule-based scoring only — no ML in the MVP.
- Every indicator records: source, units, dates, spatial resolution, limitations.
- Label illustrative values and mock data clearly as such.
- Never present missing or fabricated values as observations.
- Distinguish observations vs assumptions vs scenario inputs.
- Crop suitability values are illustrative and flagged as "needs local agronomic review".
- If a data source has no coverage for the field (e.g., ECOSTRESS cloud gap), drop the indicator and say so — do not fake it.

## Demo site context

- Field: Sacramento Valley rice, California (Colusa/Sutter County; exact field chosen via CropScape).
- Baseline practice = whatever USDA CDL crop history actually shows.
- English only. No Malaysia/BM content in the app; the Malaysian adaptation is a README paragraph only.

## Collaboration and AI assistance

- Explain proposed changes before large edits.
- Make small, reviewable changes; never claim tests passed unless run.
- Never commit credentials, tokens, or private information.
- Do not force-push or rewrite history on `main`.
- Record significant architecture changes in `docs/decisions.md`.
