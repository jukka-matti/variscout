---
title: 'ScatterFit / Regression Visualization'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: ui
serves:
  - docs/02-journeys/index.md
  - docs/02-journeys/flows/factor-intelligence.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# ScatterFit / Regression Visualization

## Problem

When a factor is continuous (temperature, pressure, speed), the user needs to see the raw data points alongside the fitted line — to judge whether the relationship looks linear or curved, where the optimum sits, and how tight the prediction band is around the fit.

## Capability claim

`ScatterFitBase` in `packages/charts/src/ScatterFit.tsx` renders visx `Circle` scatter points plus a `LinePath` for the fitted line (linear or quadratic) with optional prediction-band shading and an optimum marker; consumed by `FactorPreviewOverlay` (`packages/ui/src/components/FactorPreviewOverlay/FactorPreviewOverlay.tsx`) to preview continuous-factor relationships, with `isSignificant` styling reflecting GLM/best-subsets p-value.

## Intent diagram

TBD — Mermaid wireframe (scatter dots + fit curve + prediction band + optimum marker + x/y axis labels) to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. Visual rendering currently exercised via `FactorPreviewOverlay` consumer tests.

## Out of scope / non-goals

TBD. Fit computation lives in `@variscout/core/stats` (OLS / quadratic via best-subsets), not this component.

## Links

- **Code**: `packages/charts/src/ScatterFit.tsx`, `packages/ui/src/components/FactorPreviewOverlay/FactorPreviewOverlay.tsx`
- **Tests**: covered via `FactorPreviewOverlay` consumer tests; no dedicated `ScatterFit.test.tsx` yet.
- **Related**: `docs/03-features/analysis/regression-methodology.md`, `docs/03-features/analysis/anova.md`
