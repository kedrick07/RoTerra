# PRD — RoTerra (NASA Space Apps 2026, Field Shift)

*One page. If a feature isn't on the MVP list below, it does not get built this weekend.*

## Problem

Sacramento Valley rice growers make rotation decisions under rising uncertainty — drought cycles, groundwater restrictions, water allocation cuts, and soil health pressure. NASA Earth observations and USDA field data exist for exactly these decisions, but they're fragmented across portals, and none of them answer the farmer's actual question: "given my field and my priorities, which rotation should I consider, and why?"

## Target User

A California rice grower (small-to-midsize operation) deciding what to plant after rice — and, secondarily, extension officers and anyone who needs to see the reasoning, not just a verdict. The tool supports judgment; it never replaces it.

## Core User Flow

1. Open the app → map shows the demo field (Sacramento Valley, CA) with plot context.
2. **Understand Risk** → 20-year trends (rainfall, temperature, NDVI) with source, resolution, and uncertainty labels.
3. **Compare Rotations** → 4 strategies (continuous rice baseline + 3 alternatives) scored against farmer priorities via sliders: water, income, soil, pest, equipment.
4. **Reveal Tradeoffs** → every score expands to a per-dimension breakdown and the underlying data.
5. **See Uncertainty** → evidence drawer: source, resolution, confidence, and known information gaps per indicator.

## Strict MVP Feature List

- [x] Leaflet map with demo field location and plot context
- [x] Trends view: 20-yr rainfall / temperature / NDVI from NASA POWER + IMERG + Landsat
- [x] Rotation comparison: 4 strategies, rule-based weighted scoring
- [x] Farmer-priority sliders that visibly change rankings
- [x] Expandable per-dimension score breakdowns
- [x] Evidence drawer (source, resolution, confidence, gaps)
- [ ] Scenario slider (rainfall −10/−20% → rankings change) — **MVP cut line: build Sunday only if on schedule**

## Out of Scope (this weekend)

- No backend, database, authentication, accounts, or ML model
- No Bahasa Malaysia / multi-language UI
- No live data fetching in the app (Python prep → static JSON)
- No user-saved scenarios, no PDF export, no mobile app

## Success Criteria

A judge or farmer can, in under 3 minutes: see what's changing at the field, compare 4 rotations against priorities they control, and click any score to see the exact data and assumptions behind it.
