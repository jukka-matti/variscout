---
title: 'Step Error Pareto'
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

# Step Error Pareto

## Problem

In process-flow mode, improvement teams need to know which steps in a process contribute the most errors — a step-level vital-few ranking — so investigation effort lands on the highest-leverage stations first.

## Capability claim

`StepErrorPareto` in `packages/charts/src/StepErrorPareto.tsx` wraps `ParetoChartBase` with one bar per process step sorted descending by `errorCount`, applying `PARETO_MAX_CATEGORIES = 20` with an "Others" aggregation tail (ADR-051 many-categories styling). Bottom-right slot of the production-line-glance 2×2 dashboard; a `labelToNodeId` map links bars back to canonical node IDs for drill-down.

## Intent diagram

TBD — Mermaid wireframe (descending bars + cumulative line + Others-tail bar + click-to-node-id behaviour) to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/StepErrorPareto.test.tsx` for current verification.

## Out of scope / non-goals

TBD. Step-level error aggregation lives in `packages/core/src/stats/stepErrorAggregation.ts`; this chart consumes the pre-aggregated step list.

## Links

- **Code**: `packages/charts/src/StepErrorPareto.tsx`, `packages/core/src/stats/stepErrorAggregation.ts`
- **Tests**: `packages/charts/src/__tests__/StepErrorPareto.test.tsx`
- **Related**: `docs/03-features/analysis/pareto.md`, `docs/03-features/analysis/defect-analysis.md`, `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
