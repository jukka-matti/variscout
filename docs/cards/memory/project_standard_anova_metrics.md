---
title: 'Standard ANOVA Metrics'
description: 'ADR-062 removed custom Category Total SS % metric, standardized ANOVA as compact table, renamed Contribution % → η²'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_standard_anova_metrics.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-062 (Apr 3 2026): Removed the custom "Category Total SS %" metric and standardized ANOVA presentation.

**Why:** R²adj (Factor Intelligence, ADR-052) now handles factor ranking. Question-Driven EDA (ADR-053) carries investigation. The custom metric was redundant, non-standard (can't cross-check with Minitab), and confused analysts with two "contribution" concepts.

**How to apply:**

Clean metric roles (no overlap):
- **R²adj** (Best Subsets) = factor ranking → Factor Intelligence panel
- **η²** (standard ANOVA) = effect size reference → compact ANOVA table in focused boxplot footer
- **Boxplot visual + StdDev** = category comparison → chart + group stats table

What was removed:
- `calculateCategoryTotalSS`, `calculateDrillVariation`, `calculateFactorVariations` from core
- `useVariationTracking` hook (deleted entirely)
- `VariationBar` component (cumulative scope indicator)
- "Contribution %" label everywhere → renamed to "η²"
- Filter chip percentages → now show `n=X` (sample count)

What stayed unchanged:
- η² calculation (was always standard SS_Between/SS_Total)
- Question auto-validation thresholds (≥15% η² = answered, <5% = ruled-out)
- Factor Intelligence (R²adj Best Subsets, Main Effects, Interactions)
- `findBestSubgroup`, `computeHubEvidence`, projection functions

165 files changed, +1,693 / -4,402 lines. 29 docs rewritten.
