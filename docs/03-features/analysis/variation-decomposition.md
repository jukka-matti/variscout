---
title: Variation Decomposition
audience: [analyst, engineer]
category: analysis
status: stable
related: [eta-squared, r-squared-adj, anova, factor-intelligence]
---

# Variation Decomposition

How VariScout uses standard ANOVA metrics for factor ranking and investigation guidance.

---

## The ANOVA Identity

One-way ANOVA decomposes total variation into two additive sources:

**SS_Total = SS_Between + SS_Within**

| Term       | Formula            | Meaning                                                      |
| ---------- | ------------------ | ------------------------------------------------------------ |
| SS_Total   | Σ(x_ij − x̄)²       | Total variation in the data (all deviations from grand mean) |
| SS_Between | Σ n_j × (x̄_j − x̄)² | Variation explained by group membership (mean differences)   |
| SS_Within  | ΣΣ (x_ij − x̄_j)²   | Variation within each group (spread around group means)      |

This identity always holds exactly. The cross term vanishes because the sum of deviations within any group is zero: Σ(x_ij − x̄_j) = 0.

---

## Two Metrics, Two Questions

VariScout uses two standard statistical metrics at different levels of the investigation:

| Metric                     | Formula                 | Question it answers                                     | Where used in VariScout                    |
| -------------------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------ |
| R²adj (adjusted R-squared) | 1 − (1−R²)(n−1)/(n−p−1) | "Which combination of factors best explains variation?" | Factor Intelligence ranking (Best Subsets) |
| η² (eta-squared)           | SS_Between / SS_Total   | "How much variation does this factor explain?"          | ANOVA panel, investigation factor ranking  |

### Why R²adj for factor ranking

Factor Intelligence uses Best Subsets regression to evaluate all factor combinations simultaneously. R²adj penalizes model complexity — adding a weak factor reduces R²adj even if R² increases slightly. This gives the analyst an honest ranking of which factors (and combinations) matter most, without the path dependency of one-factor-at-a-time exploration.

### Why η² for individual factor assessment

η² measures the proportion of total variation explained by between-group differences for a single factor. It is the standard ANOVA effect size metric taught in Six Sigma training. When the analyst drills into a specific factor, η² tells them how much that factor matters in isolation.

> **Note on bias:** η² is a positively biased estimator — it tends to overstate the true population effect size, especially with small samples or many groups. VariScout uses η² (not the unbiased ω²) because it is the standard metric taught in Six Sigma training and because the drill-down use case involves relative ranking, not absolute estimation.

### Category-level insight: the boxplot and StdDev

While η² and R²adj answer factor-level questions ("does this factor matter?"), the analyst also needs category-level insight ("which category should I investigate?"). VariScout answers this through the **boxplot visual** and the **StdDev column** in the ANOVA stats table:

- The boxplot shows the distribution shape, median, spread, and outliers for each category — the analyst's eye does the comparison
- The StdDev column in the stats table quantifies within-group spread numerically
- Categories with unusually high StdDev are the ones contributing excess within-group variation

This approach uses standard statistics rather than a custom per-category metric. The boxplot is the natural visual tool for comparing distributions, and StdDev is a universally understood measure of spread.

---

## Worked Example: Bottleneck Data

The [Bottleneck case study](../../04-cases/bottleneck/index.md) has 150 cycle time measurements across 5 process steps (30 observations each). Grand mean = 36.24 seconds, SS_Total = 7,039.

### Factor-level analysis

η² for the Step factor = 4,278 / 7,039 = **0.61** (61% of variation explained by step differences). This is the key number: the Step factor is the dominant driver of cycle time variation.

### Category-level insight from the boxplot

| Step       | n   | Mean | StdDev  |
| ---------- | --- | ---- | ------- |
| Step 1     | 30  | 32.5 | 2.0     |
| **Step 2** | 30  | 39.4 | **8.9** |
| Step 3     | 30  | 45.1 | 1.5     |
| Step 4     | 30  | 33.7 | 1.9     |
| Step 5     | 30  | 30.4 | 1.6     |

The boxplot immediately reveals two things:

1. **Step 3 has the highest mean** (45.1s) — it is consistently slow
2. **Step 2 has by far the highest spread** (StdDev = 8.9 vs ~2.0 for others) — it is unpredictable

### The key comparison: Step 2 vs Step 3

| What the analyst sees | Step 2                  | Step 3                    |
| --------------------- | ----------------------- | ------------------------- |
| Mean                  | 39.4 (moderate)         | 45.1 (highest)            |
| StdDev                | **8.9** (4x others)     | 1.5 (low)                 |
| Boxplot appearance    | Wide box, long whiskers | Tight box, short whiskers |

Step 3's high mean is visible immediately. But Step 2's enormous spread — visible as a wide box with long whiskers in the boxplot — reveals the real bottleneck: unpredictability. A step with StdDev of 8.9 when all others are around 2.0 is the dominant source of within-group variation.

### What this means in practice

If you could eliminate Step 2's excess variation (bring its StdDev from 8.9 down to the average of other steps, ~1.8), you would remove approximately 34% of the total cycle time variation. Whether this translates to meaningful yield improvement depends on the specification limits — use the What-If Simulator to project the specific Cpk and yield change.

This matches the case study outcome: management was about to invest EUR50k upgrading Step 3 (highest mean). The variation analysis revealed Step 2 (highest spread) was the real bottleneck. The actual fix was EUR5k in training and standardized work instructions — a 10x better allocation of resources.

---

## How This Maps to the VariScout UI

### ANOVA panel (Boxplot view)

Shows F-statistic, p-value, and η². These are factor-level metrics that answer "does this factor matter?" η² = 0.61 for Step means 61% of all cycle time variation is explained by which step you measure.

F-test and p-value assume approximately normal data with similar spread across groups. η² is descriptive and does not require these assumptions.

### Factor Intelligence ranking

Factor Intelligence uses Best Subsets regression to rank all factor combinations by R²adj. This evaluates factors simultaneously rather than one at a time, avoiding path dependency. The analyst sees which individual factors and which combinations explain the most variation, guiding investigation priority.

### Boxplot stats table

Each category row shows n, Mean, and StdDev. The analyst compares StdDev values across categories to identify which ones have excess spread. Categories with unusually high StdDev relative to others are prime investigation targets — they contribute disproportionate within-group variation.

### Drill-down filter chips

When the analyst filters (e.g. clicks Step 2), the filter chip shows `Step = Step 2 (n=30)` — the factor, selected value, and sample count. All charts update to show the filtered subset. The analyst reads the updated η² for remaining factors to decide where to drill next.

### Investigation panel

Each factor shows its **η²** from one-way ANOVA. Questions are automatically validated against η² thresholds. The investigation sidebar highlights the factor with the highest η² among unexplored factors, guiding the analyst to drill the most impactful factor next.

**Design principle:** Only show variation numbers that are individually defensible. Never aggregate across factors unless using a multi-factor model that accounts for correlation.

### A note on controllability

Identifying a variation source is necessary but not sufficient for improvement. Before committing resources, assess whether the source is controllable (can be changed with training, procedure, settings) or structural (requires equipment, material, or design changes). The What-If Simulator helps quantify the potential impact of changes; domain expertise determines feasibility.

---

## For the Quality Professional

If you've completed Six Sigma Green Belt training, you've seen one-way ANOVA in the Analyze phase. VariScout uses the same F-test, p-value, and η² — standard metrics without custom extensions. Here is how VariScout's metrics map to standard terminology:

| Standard ANOVA term    | VariScout equivalent                     | Notes                                                                         |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| SS_Between / SS_Total  | η² in ANOVA panel                        | Identical to standard η²                                                      |
| MS_Between / MS_Within | F-statistic in ANOVA panel               | Standard F-test                                                               |
| Effect size (η²)       | Factor ranking in investigation          | Used to guide drill-down order                                                |
| Best Subsets R²adj     | Factor Intelligence ranking              | Evaluates all factor combinations simultaneously                              |
| Multi-Vari study       | Progressive drill-down with filter chips | Analyst drills factors one at a time; boxplot + StdDev reveal category spread |

**Confounding:** One-factor-at-a-time analysis does not account for confounding between factors. If Operator and Shift are correlated (certain operators only work nights), drilling by Shift may capture variation actually caused by Operator. Factor Intelligence (Best Subsets R²adj) partially mitigates this by evaluating combinations, but for statistically rigorous joint analysis with interaction terms, Advanced Regression is planned for a future phase (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)).

---

## Limitations and Assumptions

The variation decomposition system is a practical tool for process investigation. Understanding its limitations helps the analyst know when to trust the drill-down and when to move to more rigorous methods.

### Path dependency

The drill-down examines one factor at a time. Different drill orders can produce different intermediate results. Factor Intelligence (R²adj ranking) mitigates this by evaluating all factor combinations simultaneously, but the sequential drill-down interaction remains one-factor-at-a-time by design. See [Progressive Stratification](../../01-vision/progressive-stratification.md) Part 2 for a detailed treatment of this tension.

### Confounding and correlated factors

Real process data is rarely orthogonal. When factors are correlated (operator x shift, material x supplier), one-factor ANOVA misattributes variation. The drill-down can lead to incorrect factor prioritization. Factor Intelligence helps by ranking combinations, but for statistically rigorous joint analysis, Advanced Regression is planned for a future phase (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)).

### When to transition beyond drill-down

Use the drill-down for initial investigation (3-5 minutes). If you suspect interactions, have confounded factors, or need a formal model for projection, use the What-If Simulator to test scenarios with direct adjustments. Advanced Regression is planned for a future phase (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)).

---

## Presenting Results

When presenting variation findings to stakeholders, translate statistical metrics to business terms:

- Instead of "η² = 0.61 for Process Step," say "Which step the product is at explains 61% of the variation we see."
- Instead of "Step 2 has StdDev of 8.9," say "Step 2's inconsistency is 4x worse than any other step — it's the bottleneck."
- Use the What-If Simulator to generate specific before/after projections: "Reducing Step 2's spread from 8.9 to 2.0 seconds would improve overall process capability from Cpk X to Cpk Y."

The chart copy and export features (clipboard, PNG, SVG) produce presentation-ready visuals that can be pasted directly into tollgate reviews and improvement reports.

---

## References

- NIST/SEMATECH e-Handbook of Statistical Methods, Section 7.4.3.2 — One-Way ANOVA
- Montgomery, D.C. _Introduction to Statistical Quality Control_ (8th ed.), Chapter 13
- VariScout implementation: `packages/core/src/stats/anova.ts` (ANOVA), `packages/core/src/variation/` (factor intelligence)

---

## Cross-references

| Topic                                      | Document                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| UX rationale for drill-down                | [Progressive Stratification](../../01-vision/progressive-stratification.md) |
| Investigation workflow (Findings, What-If) | [Investigation to Action](../workflows/investigation-to-action.md)          |
| Boxplot ANOVA display                      | [Boxplot](boxplot.md)                                                       |
| Factor Intelligence                        | [Factor Intelligence](../analysis/factor-intelligence.md)                   |
| Regression and interaction analysis        | [Regression (Phase 2, deferred)](../../archive/regression.md)               |
| Glossary: η², R²adj                        | `packages/core/src/glossary/terms.ts`                                       |
