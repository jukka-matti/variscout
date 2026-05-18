---
title: 'Filter Bar'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: ui
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Filter Bar

## Problem

Canvas surfaces need to display the currently active scope filters (time window, scope filter, Pareto group-by) as composable chips with clear affordances, plus the resulting sample count — so users can see at a glance how their view is narrowed and clear individual filters without losing other state.

## Capability claim

`CanvasFilterChips` (`packages/ui/src/components/CanvasFilterChips/index.tsx`) renders the three composable canvas filter state chips per spec §10 — purple = time window, blue = scope filter, amber = Pareto group-by — rendering only chips with active state and `null` when all three are inactive (cumulative window, no scope, no group-by); `ProcessHealthBar` surfaces the resulting `n=X` sample count adjacent to the chips for evidence-based drilling.

## Intent diagram

TBD — Mermaid wireframe to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/ui/src/components/CanvasFilterChips/__tests__/CanvasFilterChips.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/ui/src/components/CanvasFilterChips/index.tsx`, `packages/ui/src/components/FilterContextBar/FilterContextBar.tsx`, `packages/ui/src/components/FilterChipDropdown/FilterChipDropdown.tsx`, `packages/ui/src/components/FilterBreadcrumb/FilterBreadcrumb.tsx`
- **Tests**: `packages/ui/src/components/CanvasFilterChips/__tests__/CanvasFilterChips.test.tsx`
- **Related**: `docs/03-features/ui/health-bar.md`, `docs/03-features/analysis/timeline-window-investigations.md`
