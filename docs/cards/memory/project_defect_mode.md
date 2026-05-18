---
title: 'Defect Analysis Mode'
description: '6th analysis mode — transforms defect data into rates via mode transform, then uses existing Four Lenses'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 181030aa-ec62-499c-829f-41b3f434d7f4
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_defect_mode.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Defect analysis mode added Apr 16, 2026. Follows strategy pattern (ADR-047).

**Design principle**: Turn defect data into rates, then use existing Four Lenses. No new chart types. No Poisson/binomial engine. Aggregation transform (`computeDefectRates()`) is the key — same pattern as yamazumi's `computeYamazumiData()`.

**Why:** Re-aggregation after filter = different calculation from standard mode (not just row subset). All charts consume transformed working dataset.

**How to apply:** When working on defect mode features, read the design spec first: `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`. Key files: `packages/core/src/defect/`, `packages/hooks/src/useDefectTransform.ts`, `packages/hooks/src/useDefectSummary.ts`.

All three phases delivered (Apr 16, 2026):
- Phase 1: Core types, detection, transform, modal, summary, CoScout coaching, PWA integration
- Phase 2: Pareto factor switching, trend direction, cost/duration POVs, boxplot auto-suggest
- Phase 3: Question templates, report KPI grid, Azure full integration

Evidence Map integration delivered: three-view model (All Defects, Per-Type, Cross-Type).
- `useDefectEvidenceMap` hook with lazy cache + progressive cross-type matrix
- `DefectTypeSelector` pill tabs, `CrossTypeEvidenceMap` SVG, `InsufficientDataState`
- Wired into Azure (InvestigationMapView) and PWA (MobileDashboard)
- Design spec: `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`

Documentation fully updated: feature parity matrix, specs index, feature doc (`docs/03-features/analysis/defect-analysis.md`), navigation patterns, CoScout prompt architecture. All pushed to main Apr 16, 2026.
