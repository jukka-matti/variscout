---
title: 'Capability Gap Trend Chart'
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

# Capability Gap Trend Chart

## Problem

A drifting Cpk could come from widening variation (Cp loss) or from the mean drifting off-target (centering loss). Process owners need to see the centering-loss component — Δ(Cp − Cpk) — over snapshots, so a centering trend is visible separately from spread.

## Capability claim

`CapabilityGapTrendChartBase` in `packages/charts/src/CapabilityGapTrendChart.tsx` wraps `IChartBase` with capability-specific defaults — `specs={{ target: 0 }}` and y-axis label `Δ(Cp-Cpk)` — to plot the per-snapshot Cp−Cpk gap as its own time series. Target line at zero represents perfect centering. Top-right slot of the production-line-glance 2×2 dashboard.

## Intent diagram

TBD — Mermaid wireframe (time-series line + zero target line + per-snapshot points + I-Chart-style control limits) to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/CapabilityGapTrendChart.test.tsx` for current verification.

## Out of scope / non-goals

TBD. Underlying Cp/Cpk computation lives in `@variscout/core/capability`; this chart consumes the pre-computed gap series.

## Links

- **Code**: `packages/charts/src/CapabilityGapTrendChart.tsx`, `packages/ui/src/components/ProductionLineGlanceDashboard/`
- **Tests**: `packages/charts/src/__tests__/CapabilityGapTrendChart.test.tsx`
- **Related**: `docs/03-features/analysis/i-chart.md`, `docs/03-features/analysis/capability.md`, `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
