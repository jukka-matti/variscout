---
title: 'Hooks Layer Overview'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Hooks Layer Overview

## Problem

Charts, canvas surfaces, investigation primitives, CoScout, and the Evidence Map all need to derive view-ready data from shared stores + the stats engine without each surface re-implementing reactive store reads, memoization, filter resolution, or per-domain composition rules — and downward dependency flow (core → hooks → ui → apps) must stay enforced.

## Capability claim

`@variscout/hooks` is the shared React hook layer that bridges `@variscout/stores` and `@variscout/core` to the UI: ~78 hook exports covering data pipeline (`useFilteredData`, `useDataIngestion`, `useDataRouter`, `useDrillPath`), chart data (`useIChartData`, `useBoxplotData`, `useParetoChartData`, `useCapabilityIChartData`, `useChartCopy`, `useChartInsights`), canvas interactions (`useCanvasFilters`, `useCanvasViewportInput`, `useCanvasKeyboard`, `useCanvasHypothesisDrawing`), investigation primitives (`useHypotheses`, `useQuestionGeneration`, `useFindings`, `useHubComputations`), AI (`useAICoScout`, `useAIContext`, `useCoScoutProps`), Evidence Map (`useEvidenceMapData`, `useDefectEvidenceMap`), and pop-out coordination (`usePopoutChannel`). Hooks consume stores via selectors but never define stores themselves and never import `@variscout/ui` or `@variscout/charts`.

## Intent diagram

No user-facing surface — infrastructure layer. See `packages/hooks/CLAUDE.md` for the scope-boundary contract and per-hook tests in `packages/hooks/src/__tests__/` for shapes.

## Acceptance signals

TBD — see related tests at `packages/hooks/src/__tests__/` (one test file per hook) for current verification.

## Out of scope / non-goals

TBD. New domain stores belong in `packages/stores/` (3-layer model), not here; new app-local UI state belongs in feature stores under `apps/*/src/features/`.

## Links

- **Code**: `packages/hooks/src/` (~78 `use*` hook exports per `packages/hooks/src/index.ts`)
- **Tests**: `packages/hooks/src/__tests__/`
- **Related**: `docs/07-decisions/adr-041-zustand-feature-stores.md`, `docs/07-decisions/adr-045-modular-architecture.md`, `packages/hooks/CLAUDE.md`
