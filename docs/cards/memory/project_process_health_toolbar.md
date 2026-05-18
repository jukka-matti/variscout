---
title: 'Process Health & Projection Toolbar'
description: 'Dashboard chrome redesign — unified toolbar with stats, variation, projection engine, benchmark findings, and What-If integration across SCOUT→IMPROVE journey'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_process_health_toolbar.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Process Health & Projection Toolbar — 4-phase redesign unifying process health info into a single adaptive toolbar row.

**Why:** Process health information was fragmented across 6 locations (I-Chart header, stats panel, filter breadcrumb, insight chips, NarrativeBar, What-If simulator). The analyst had to mentally assemble the picture from scattered pieces.

**How to apply:** This is the primary dashboard UX initiative. All 4 phases build on each other sequentially.

## Status (2026-03-29)

- **Phase 1 (layout)**: Merged. ProcessHealthBar + VerificationCard + 2-row grid.
- **Phase 2 (projection)**: Committed. Drill projection, centering opportunity, spec suggestion. Visually verified.
- **Phase 3 (benchmark + scope)**: Committed. FindingRole, BenchmarkStats, scope toggle, computeBenchmarkProjection.
- **Phase 4 (journey thread)**: Committed. Journey-phase-aware projection priority (resolved > improvement > cumulative > benchmark > drill).
- **Process Intelligence Panel**: Committed → further simplified Apr 6 2026. Now 4 tabs (Stats|Questions|Journal|Docs) via PITabConfig API. Store-aware tab content components. Data/What-If in overflow menu. See `project_pi_panel_redesign.md` for current architecture.
- **PWA Zustand migration**: 5 stores created (panels, findings, investigation, improvement, projection). projectionStore bridges Dashboard↔sidebar data flow. useAppPanels rewired as Zustand shim.
- **5-status findings**: PWA findings now support all 5 statuses (was limited to 3).
- **Phase 6 partial**: 5-status findings enabled, orchestration hooks wired, Performance Mode detection enabled.
- **Capability mode coherence (2026-03-30)**: Dot plot fallback (<7 values) for standard + performance boxplot. Capability I-Chart: purple Cp series + centering gap lines. Capability boxplot: Cpk Y-axis + target reference line. ProcessHealthBar: subgroup target %. Spec lines/contribution bars hidden. Performance Mode detection enabled in PWA.
- **Multi-series probability plot (2026-03-30)**: Brush selection + Anderson-Darling test. Factor grouping creates per-category series. Phase B of probability plot roadmap delivered.
- **Factor Intelligence + Findings bridge (PR #42)**: ANOVA eta-squared ranking bridges to Findings. Generates initial questions from factor ranking.
- **UI polish done**: VERIFICATION header removed, Prob Plot default tab, insight chips hidden under boxplot/pareto, centering card reframed.

## Key Design Decisions

- Toolbar shows adaptive stats based on context (no specs → Mean/σ/n; specs set → Cpk/Pass; drilling → projection)
- VariationBar always visible (not hidden until drill-down)
- Filter chips inline in toolbar row (not separate breadcrumb)
- Cpk target editable inline in toolbar
- Histogram + Probability Plot as tabbed VerificationCard in grid row 2 (not separate cards)
- Stats sidebar becomes "deep dive" (detailed stats, data table, specs editor, What-If sliders)
- Benchmark = best-of-best subset pinned as Finding with `role: 'benchmark'`
- Findings define improvement scope — cumulative "if fixed" projection

## Key Files

- Spec: `docs/superpowers/specs/2026-03-28-process-health-projection-toolbar-design.md`
- Plan (Phase 1): `docs/superpowers/plans/2026-03-28-process-health-projection-toolbar.md`
- Worktree: merged to main (`.worktrees/process-health-bar` can be cleaned up)
- ProcessHealthBar: `packages/ui/src/components/ProcessHealthBar/`
- VerificationCard: `packages/ui/src/components/VerificationCard/`
- Projection core: `packages/core/src/variation/projection.ts` (4 pure functions)
- Projection types: `ProcessProjection`, `CenteringOpportunity`, `SpecSuggestion` in `variation/types.ts`
- Projection hook: `packages/hooks/src/useProcessProjection.ts`
- Projection tests: `packages/core/src/__tests__/projection.test.ts` (15 tests)
