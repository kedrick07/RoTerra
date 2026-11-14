# RoTerra — Task Delegation (Team of 3, Working in Parallel)

*How Kedrick, Aizad, and Nia build simultaneously with separate AI assistants on separate branches — and still merge cleanly. Read this once, then your role file.*

## The Core Idea

Three people, three AI assistants, three branches. Parallel work only succeeds if **nobody needs to wait for anybody**. We achieve that with two mechanisms:

1. **Folder ownership** — each role owns disjoint folders, so branches never conflict.
2. **Interface contracts** — `ARCHITECTURE.md` defines the exact JSON schemas and the scoring function signature. Everyone builds against the contract with their own fixture (mock) data; real data drops in later with zero code changes.

**The JSON schemas in `ARCHITECTURE.md` are the contract between all three roles. Do not change them unilaterally — a schema change is a team decision recorded in `docs/decisions.md`.**

## Branches & Ownership

| Person | Branch (convention) | Owns (only these paths) |
|---|---|---|
| Kedrick | `data/kedrick` | `scripts/`, `public/data/`, `docs/data-sources.md` |
| Aizad | `logic/aizad` | `src/lib/`, `tests/`, `docs/decisions.md` |
| Nia | `frontend/nia` | `src/features/`, `src/components/`, `src/styles/`, `public/` (non-data), `index.html`, `vite.config.js` |

If your local branch names differ, substitute — the ownership boundaries are what matter. **Nobody edits another role's folders.** If you need a change elsewhere (e.g., Nia needs a new field in a schema), request it: log it in `docs/decisions.md` or ping the team chat; the owner makes the change on their branch.

## What Each Person Hands Their AI Assistant

Every teammate uploads to their own AI (Copilot/Claude/etc.):

1. **Your role file** — `docs/delegation/kedrick-data.md`, `aizad-logic.md`, or `nia-frontend.md`
2. **`AGENTS.md`** — repo rules (stack, constraints, integrity)
3. **`ARCHITECTURE.md`** — the data contracts and scoring spec
4. **`PRD.md`** — what we're building and the strict MVP

Plus role-specific: Nia also gets `DESIGN.md`; Aizad also gets the scoring section of `ARCHITECTURE.md`; Kedrick also gets `TASKS.md` Phase 1.

Your AI should be told: *"You are assisting on this repo. Read the attached docs, stay inside my owned paths, and follow AGENTS.md."*

## Parallel Workflows (who starts what, when)

```
Saturday morning ──────────────────────────────────────────────────────
Kedrick:  verify POWER params ──► write fetch scripts ──► pull real data
Nia:      wireframes (Figma/paper) ──► scaffold Vite app ──► UI with FIXTURE data
Aizad:    (starts after wireframes exist, ~1-2h later)
          scoring engine vs FIXTURE data ──► trend-weight logic ──► tests

The dependency: Aizad's scoring UI display needs Nia's wireframes (what components exist),
NOT her finished code and NOT real data. Kedrick's data lands last and replaces fixtures.
```

**Fixtures are the bridge.** Nia (or anyone) creates `public/data/*.json` fixture files that match the `ARCHITECTURE.md` schemas exactly and are clearly marked `"fixture": true`. Aizad runs his engine against the same fixtures. When Kedrick's real data arrives, it replaces the fixtures file-for-file — no code changes anywhere.

## Sync Checkpoints (merge to `main`)

Kedrick owns merges (he holds the repo owner account). Merge points:

1. **Sat ~2 PM** — Nia's scaffold + fixtures merged; Aizad branches from this
2. **Sat ~8 PM** — Core integration: real data in, engine wired to UI
3. **Sun ~11 AM** — Scenario slider (if cut line passed) + polish
4. **Sun ~6 PM** — Feature freeze; README, deploy, demo prep only

At each checkpoint: pull `main`, resolve nothing (folders are disjoint), open a PR or merge directly, and re-run the app before continuing.

## Ground Rules

- Small commits, push often — branches should never be more than a few hours of unmerged work.
- Anything blocked → post in team chat immediately; never silently work around the contract.
- The MVP list in `PRD.md` is strict. If your AI suggests a feature not on it, say no.
- Merge conflicts should be impossible by design; if you get one, you touched someone else's folder.
