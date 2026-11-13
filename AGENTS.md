# RoTerra — Project Rules

## Current phase

- Preparation only until the agreed event development window.
- Do not implement project logic, scaffold the app, or fetch real plot data
  during preparation.
- Do not assume that keeping work local makes it exempt from event rules.
- Confirm the development window and organiser requirements before coding.

## Architecture

- Frontend: React + Vite.
- Maps: Leaflet.
- Charts: Recharts.
- Data preparation: Python scripts.
- The frontend reads static JSON from public/data/.
- No backend, database, authentication, or ML model for the MVP.
- Do not introduce frameworks or dependencies without explaining the need.

## Directory boundaries

- src/components/: reusable UI.
- src/features/risk/: map and environmental conditions.
- src/features/rotations/: strategy comparison and priority controls.
- src/features/evidence/: provenance, confidence, and information gaps.
- src/lib/: shared utilities and scoring logic.
- scripts/: data retrieval and transformation.
- data/raw/: original local inputs; not committed.
- data/processed/: intermediate local outputs; not committed.
- public/data/: reviewed, app-ready JSON; intended to be committed.
- docs/: architecture, sources, team responsibilities, and decisions.
- tests/: automated tests added during development.

## Implementation conventions

- Prefer small functions and straightforward components.
- Keep scoring calculations separate from presentation.
- Do not hardcode scoring formulas inside UI components.
- Validate data before publishing it to public/data/.
- Show loading, missing-data, and error states explicitly.
- Avoid unrelated refactoring and premature abstractions.

## Scientific integrity

- Use explainable, rule-based scoring.
- Record sources, units, dates, spatial resolution, and limitations.
- Label illustrative values and mock data clearly.
- Never present missing or fabricated values as observations.
- Distinguish observations, assumptions, and scenario inputs.
- Recommendations support farmer judgment; they do not replace it.
- Flag crop suitability assumptions as requiring local agronomic review.

## Collaboration and AI assistance

- Explain proposed changes before large edits.
- Make small changes that the developer can review and understand.
- Never claim tests passed unless they were actually run.
- Never commit credentials, tokens, or private information.
- Do not push, delete files, or change Git history without approval.
- Record important architecture changes in docs/decisions.md.
