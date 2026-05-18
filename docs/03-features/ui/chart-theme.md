---
title: 'Chart Theme System'
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

# Chart Theme System

## Problem

Every chart variant (I-Chart, Boxplot, Pareto, Capability, Yamazumi, Evidence Map) needs consistent semantic colors for pass/fail/spec/control lines, chrome (grids, axes, labels), and theme-aware (light/dark) rendering — without hardcoded hex strings drifting across files or violating the light-colors invariant.

## Capability claim

`packages/charts/src/colors.ts` exports `chartColors` (semantic data palette — pass/fail/spec/control/regression-fit), `chromeColors` (backgrounds, grids, axis labels) and `operatorColors`, with all values keyed to Tailwind tokens; `useChartTheme()` (`packages/charts/src/useChartTheme.ts`) returns `{ isDark, chrome, colors, fontScale, locale, formatStat, t }` so charts never read `data-theme` directly and never hardcode hex colors (enforced by `packages/charts/CLAUDE.md` hard rule).

## Intent diagram

TBD — Mermaid flowchart to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/colors.test.ts` and `packages/charts/src/__tests__/useChartTheme.test.ts` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/charts/src/colors.ts`, `packages/charts/src/useChartTheme.ts`
- **Tests**: `packages/charts/src/__tests__/colors.test.ts`, `packages/charts/src/__tests__/useChartTheme.test.ts`
- **Related**: `packages/charts/CLAUDE.md`, `docs/06-design-system/charts/chart-sizing-guide.md`
