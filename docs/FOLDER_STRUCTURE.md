# RoTerra — Folder Structure

*What every folder is for, so nothing out-of-context gets added. If a file doesn't clearly belong in one of these, it probably shouldn't exist.*

```
RoTerra/
├── PRD.md              ← product scope (this weekend's strict MVP list)
├── AGENTS.md           ← rules for AI agents and contributors
├── ARCHITECTURE.md     ← data contracts, pipeline, frontend map
├── TASKS.md            ← live build checklist (work top to bottom)
├── README.md           ← judges' entry point (pitch, demo link, sources)
├── DESIGN.md           ← design tokens, typography, chart rules
├── FOLDER_STRUCTURE.md ← this file
├── ABOUT_PROJECT.md    ← longer-form project description
│
├── src/                ← the React app (all app code lives here)
│   ├── components/     ← reusable UI primitives (Button, Card, Badge…)
│   │                      rule: if it doesn't know about data, it goes here
│   ├── features/       ← feature modules, one folder per product area
│   │   ├── risk/       ← map panel + environmental trends view
│   │   ├── rotations/  ← comparison cards, sliders, score breakdowns
│   │   └── evidence/   ← evidence drawer (source, confidence, gaps)
│   ├── lib/            ← scoring engine + data loading utilities
│   │                      rule: no JSX in here; pure logic only
│   └── styles/         ← design tokens + global CSS (per DESIGN.md)
│
├── scripts/            ← Python data pipeline (fetch + transform + validate)
│   │                      runs during the hackathon, not at runtime
│
├── data/               ← pipeline working area — NOT committed
│   ├── raw/            ← original downloads (POWER CSVs, CDL exports…)
│   └── processed/      ← cleaned intermediate outputs
│   │                      (gitignored; only public/data/ ships)
│
├── public/data/        ← app-ready JSON the frontend reads at runtime
│   │                      site.json, trends.json, soil.json, crops.json,
│   │                      rotations.json, evidence.json
│   │                      this is the ONLY data the app uses
│
├── docs/               ← team planning notes (decisions, data-source notes)
│   │                      not part of the app; internal documentation
│
├── tests/              ← automated tests (scoring engine especially)
│
├── .editorconfig       ← editor consistency
└── .gitignore          ← node_modules, dist, .env, data/raw, data/processed
```

## Rules of Thumb

- **App code → `src/`.** Anything the browser runs lives under `src/` or `public/`.
- **Data the app reads → `public/data/` only.** The app never touches `data/raw/` or `data/processed/`.
- **Big downloads stay out of git.** `data/raw/` and `data/processed/` are gitignored for a reason — commit the small, reviewed JSON in `public/data/`, not the source CSVs.
- **Pure logic → `src/lib/`.** If the scoring code ever imports a React component, it's in the wrong place.
- **Reusable UI → `src/components/`; feature-specific UI → `src/features/<area>/`.** When a `features/` component is used by two features, promote it to `components/`.
- **No extra top-level folders.** No `assets/` at root (use `src/` or `public/`), no `misc/`, no `scratch/` — scratch work belongs in the Project workspace, not this repo.
- **Docs are markdown at root or in `docs/`.** No `.docx`, no PDFs in the repo except the demo deck if you choose to host it here.
