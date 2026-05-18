---
title: 'Chart Source Bar'
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

# Chart Source Bar

## Problem

Exported and on-screen charts need a compact, consistent badge that attributes the chart to VariScout and surfaces the sample size (n) — without leaking app chrome into the visx render tree or per-chart hardcoded styles.

## Capability claim

`ChartSourceBar` (`packages/charts/src/ChartSourceBar.tsx`) is a props-only visx `<Group>` that renders a floating pill-shaped badge anchored bottom-right of the chart with branding text + `n=...` sample count, using `chromeColors` tokens from the shared chart theme so it adapts across light/dark themes and PWA/Azure hosts without per-chart wiring.

## Intent diagram

TBD — Mermaid wireframe to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/ChartSourceBar.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/charts/src/ChartSourceBar.tsx`, `packages/charts/src/colors.ts` (`chromeColors`)
- **Tests**: `packages/charts/src/__tests__/ChartSourceBar.test.tsx`
- **Related**: `docs/03-features/ui/chart-theme.md`, `packages/charts/CLAUDE.md`
