---
tier: living
purpose: build
title: 'ER-9 Frame to Explore contract implementation sub-plan'
audience: agent
status: active
date: 2026-06-11
layer: spec
topic: [explore, frame, process, time, factor-strip, stages, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
implements:
  - docs/02-journeys/flows/process-to-explore.md
  - docs/03-features/workflows/analysis-flow.md
---

# ER-9 — Frame to Explore Contract Implementation Plan

## Goal

Make the Frame → Explore handoff truthful and symmetric: Frame asks what might affect the outcome, Explore ranks the same candidate factors from the data, time-derived auto-X columns do not duplicate existing columns, process step mappings become visible as Stage lens affordances, and process goals feed the Report intent path without weakening spec semantics.

## Checklist

- [x] Add regression tests for time-derived auto-X deduplication in `augmentWithTimeColumns`, including a user-provided weekday column suppressing the derived day-of-week column while preserving created-column mutation and `newColumns`.
- [x] Add detection tests proving default factor seeds are ranked by data suitability before keyword bonuses, and that the three-seed cap does not make the keyword-biased list the analytical candidate universe.
- [x] Implement factor-seed scoring in `packages/core/src/parser/detection.ts` without changing transform-before-stats behavior or downstream candidate availability.
- [x] Implement equivalent-column detection in `packages/core/src/time.ts` for generated year/month/week/day/hour/interval columns, skipping only derived columns already represented by an existing column.
- [x] Add shared step-to-factor decoration helpers from `ProcessMap` metadata, then thread decorations into `useFactorStripModel` and both app dashboards.
- [x] Render compact step badges in `FactorStripBase` and test the badge without changing selection behavior.
- [x] Add Stage lens auto-bind availability from canonical step mappings: when a mapped step column exists, pass it to ProcessHealthBar as an available stage option while leaving `stageColumn` unselected.
- [x] Update Frame and Explore i18n copy: Frame keeps “What might be affecting it?” with an explicit bridge line; Explore says “What does explain it?” with the matching bridge line. Run `pnpm check:i18n`.
- [x] Re-ground the goal/spec path and make a minimal code/test change only if `AnalysisBrief.target` or process goal does not already feed the Issue/Project goal used by Report’s “What we aimed for”.
- [x] Update the Process → Explore journey doc with ER-DOC notes. Avoid `docs/DATA-FLOW.md` churn unless the dedup change changes persisted shapes.
- [ ] Verify with PWA tests, Azure tests, `pnpm check:i18n`, `bash scripts/pr-ready-check.sh`, and a browser gate covering paste → Process → Explore with no duplicate time Xs, no new auto-selection, and visible step badges.
