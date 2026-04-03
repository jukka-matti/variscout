---
title: 'ADR-062: Standard ANOVA Metrics & Category Total SS Removal'
audience: [developer, architect]
category: architecture
status: stable
related:
  [anova, factor-intelligence, question-driven-investigation, variation-decomposition, eta-squared]
---

# ADR-062: Standard ANOVA Metrics & Category Total SS Removal

**Status:** Accepted
**Date:** 2026-04-03
**Decision Makers:** Development team
**Tags:** anova, variation, metrics, factor-intelligence, question-driven-eda

## Context

VariScout introduced a custom "Category Total SS %" metric that combined between-group and within-group SS per category, summing to 100% across all categories. The intent was to guide drill-down decisions by showing which factor levels drove the most total variation.

This worked when it was first introduced, but several forces made it obsolete:

1. **Factor Intelligence (ADR-052) supersedes it for factor ranking.** R²adj from Best Subsets already tells the analyst which factors and combinations explain the most variance — it is statistically rigorous and directly comparable to Minitab's Best Subsets output.

2. **Two "contribution" concepts created confusion.** η² was labeled "Contribution %" in the ANOVA panel, and Category Total SS % was another contribution number in the filter chips and VariationBar. Users, especially Minitab-trained Six Sigma analysts, could not reconcile the two figures.

3. **The custom metric could not be cross-checked against industry tools.** Category Total SS % is a VariScout invention. Analysts who verify results in Minitab or JMP found no matching output. This eroded trust in the analysis.

4. **The boxplot visual and StdDev column already communicate within-group spread.** The information value of Category Total SS % within a category is redundant with what a boxplot IQR or a StdDev column conveys visually and numerically.

5. **The VariationBar cumulative scope indicator became vestigial.** It was designed to show how much of total SS was accounted for as the analyst drilled into categories. With questions and findings carrying the investigation forward, this progress metaphor was no longer needed.

6. **Question auto-validation used η², not Category Total SS %.** The investigation thresholds (≥15% η² = answered, <5% = ruled-out) were already grounded in standard effect-size conventions, not the custom metric.

## Decision

### 1. Remove Category Total SS % entirely

Remove the calculation, associated types (`scopeFraction`, `cumulativeScope`), UI display in filter chips, ANOVA panel, and VariationBar. The `useVariationTracking` hook that maintained cumulative scope state is also removed.

### 2. Standardize ANOVA presentation as a compact table

Replace the narrative ANOVA card with a compact table in the format used by Minitab and JMP:

| Source | DF  | SS         | F   | P   | η²  |
| ------ | --- | ---------- | --- | --- | --- |
| Factor | k−1 | SS_between | —   | —   | —   |
| Error  | N−k | SS_within  | —   | —   | —   |
| Total  | N−1 | SS_total   | —   | —   | —   |

η² (eta-squared) appears as an additional column for the factor row. This output is immediately recognizable to anyone trained on standard statistical software.

### 3. Clean metric roles

Each metric now has a single, unambiguous job:

| Metric               | Role                                                                                  | Where displayed                                |
| -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| R²adj (Best Subsets) | Factor ranking — which factors and combinations explain the most variance             | Factor Intelligence panel, question generation |
| η² (ANOVA)           | Effect size reference — how strong is the factor's effect relative to total variation | ANOVA compact table                            |
| Boxplot visual       | Category comparison — distribution shape, spread, outliers, overlaps                  | Dashboard Boxplot chart                        |

### 4. Filter chips show sample count, not percentage

Filter chips change from `Factor = Value (12%)` to `Factor = Value (n=42)`. Sample count is more useful for assessing subgroup credibility than a contribution percentage that required understanding the custom metric.

### 5. Remove VariationBar

The VariationBar component and its cumulative scope indicator are removed from the dashboard. Investigation progress is tracked through the question checklist and SuspectedCause hubs (ADR-053), not through a variation decomposition progress bar.

### 6. Rename "Contribution %" to "η²" everywhere

Audit and update all occurrences of "Contribution %" in:

- UI labels and tooltips
- AI prompts and CoScout methodology coaching text
- i18n message catalogs (all 5 locales)
- Glossary definitions
- Documentation

## Consequences

### Positive

- Minitab-trained Six Sigma analysts recognize the ANOVA output immediately — no learning curve, no trust deficit
- Single clear metric per question: R²adj for factor ranking, η² for effect size reference
- Approximately 2,500 lines of custom metric code removed (calculation engine, scope tracking hook, VariationBar component, filter chip percentage logic)
- No more confusion between two distinct "contribution" concepts
- Cross-validation against Minitab/JMP is straightforward — the numbers match

### Negative

- Filter chips lose the percentage indicator; analysts who relied on it for quick drill-down decisions must now use the Factor Intelligence panel for factor ranking
- Documentation requires significant rewrite — approximately 29 files contain references to Category Total SS %, VariationBar, or "Contribution %"

### Neutral

- Question auto-validation thresholds are unchanged: ≥15% η² = answered, <5% = ruled-out. These thresholds were already η²-based, so no behavioural change for question progression
- The ANOVA statistical engine in `@variscout/core` is retained — only the custom metric derivation and its display layer are removed

## Implementation

Delivered in `feature/standard-anova-metrics` branch. Phase 3 (documentation rewrite, 29 files) is in progress at time of ADR creation.

| Component                                        | File                                                   | Status      |
| ------------------------------------------------ | ------------------------------------------------------ | ----------- |
| Category Total SS % calculation removal          | `packages/core/src/stats/`                             | Complete    |
| `scopeFraction` / `cumulativeScope` type removal | `packages/core/src/types.ts`                           | Complete    |
| `useVariationTracking` hook removal              | `packages/hooks/src/`                                  | Complete    |
| VariationBar component removal                   | `packages/ui/src/components/VariationBar/`             | Complete    |
| ANOVA compact table component                    | `packages/ui/src/components/AnovaResults/`             | Complete    |
| Filter chip sample count (`n=X`)                 | `packages/ui/src/components/FilterChipDropdown/`       | Complete    |
| η² label audit (UI + i18n + prompts)             | packages/core/src/ai/prompts/, packages/core/src/i18n/ | Complete    |
| Glossary update                                  | `packages/core/src/glossary/`                          | Complete    |
| Documentation rewrite (29 files)                 | `docs/`                                                | In progress |

## Related

- [ADR-047: Analysis Mode Strategy Pattern](adr-047-analysis-mode-strategy.md)
- [ADR-052: Factor Intelligence](adr-052-factor-intelligence.md)
- [ADR-053: Question-Driven Investigation](adr-053-question-driven-investigation.md)
- [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md)
