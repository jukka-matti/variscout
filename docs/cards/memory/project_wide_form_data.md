---
title: 'Wide-Form Data Support'
description: 'Stack Columns feature (ADR-050), adaptive chart limits (ADR-051), Analyst Alex persona, Finland arrivals sample dataset'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_wide_form_data.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Wide-form data support shipped 2026-03-29.

**Stack Columns (ADR-050):** `stackColumns()` in `@variscout/core/parser/stack.ts`. Integrated into ColumnMapping with smart detection heuristic (5+ numeric columns, range-similarity clustering). Both PWA and Azure data flow hooks apply stack on confirm. `StackConfig` in `AnalysisState` for persistence.

**Chart Many Categories (ADR-051):** Pareto: Top 20 + "Others" bar (`PARETO_MAX_CATEGORIES = 20`, `useParetoChartData`). Label rotation -45° + truncation at 12 chars for 10+ categories on both Pareto and Boxplot. `othersKey` prop on ParetoChartBase for muted "Others" styling.

**Adaptive Boxplot Limits:** `selectBoxplotCategories()` in `core/stats/boxplot.ts` — specs-aware priority (smaller-is-better → highest median, larger-is-better → lowest median, nominal → farthest from target, no specs → highest IQR). Width-driven max via `getMaxBoxplotCategories()`. `useBoxplotCategoryLimit` hook. BoxplotBase `visibleCategories` prop + overflow indicator. BoxplotDisplayToggle: categories section with auto/manual modes, search, checkboxes.

**I-Chart Factor Tooltips:** `IChartDataPoint.factorValues` populated in `useIChartData` (optional `factors` param). Tooltip shows factor values alongside point value.

**Create Factor Auto-switch:** `useCreateFactorModal` gains `onFactorCreated` callback → both apps wire `setBoxplotFactor(name)` + `setParetoFactor(name)`.

**Analyst Alex persona:** `docs/02-journeys/personas/analyst-alex.md` — Data analyst beyond quality/manufacturing. "Variation analysis for any domain" positioning.

**Finland arrivals sample:** `packages/data/src/samples/finland-arrivals.ts` — 15 countries × 30 years, wide-form, demonstrates stack feature.

**Why:** User testing with Finland arrivals dataset revealed VariScout couldn't answer "which countries have the highest amount?" with wide-form data. Minitab benchmarking informed the Stack Columns approach.
**How to apply:** When working on parser, ColumnMapping, or chart components, these features are the reference for handling many-category datasets.
