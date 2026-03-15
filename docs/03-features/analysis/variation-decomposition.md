# Variation Decomposition

Why VariScout uses different metrics for different questions, and how they relate to one-way ANOVA.

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

### Category-level decomposition

The identity also works at the category level. For any category _j_:

**Category_SS_j = SS_Between_j + SS_Within_j**

where:

- SS_Between_j = n_j × (x̄_j − x̄)² — group mean vs grand mean
- SS_Within_j = Σ_i (x_ij − x̄_j)² — spread within the group

Key identity: **Σ_j Category_SS_j = SS_Total**

The total variation is fully partitioned across categories — every observation's deviation from the grand mean is accounted for by exactly one category. This means category percentages always sum to 100%.

With unbalanced data (unequal category sizes), larger categories contribute proportionally more to Total SS. This reflects their actual impact on the data but may overstate their importance per-observation.

---

## Three Metrics, Three Questions

VariScout uses three different variation metrics, each answering a distinct question:

| Metric              | Formula                  | Question it answers                                | Where used in VariScout                                             |
| ------------------- | ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| η² (eta-squared)    | SS_Between / SS_Total    | "How much variation does this **factor** explain?" | ANOVA panel, Mindmap node circles, suggestion ranking (green pulse) |
| Category Total SS % | Category_SS_j / SS_Total | "How much does each **category** contribute?"      | Mindmap popover rows, contribution labels on Boxplot, filter chips  |

### Why η² for factor ranking

η² measures only between-group variation (mean differences). This is the right metric for ranking **factors** because it is not distorted by the number of categories in a factor.

A 5-category factor with diverse means (e.g. Step 1-5 with different cycle times) correctly ranks higher than a 2-category factor with similar means (e.g. Shift with Morning/Afternoon), because η² captures the total between-group effect regardless of how it is distributed across categories.

> **Note on bias:** η² is a positively biased estimator — it tends to overstate the true population effect size, especially with small samples or many groups. VariScout uses η² (not the unbiased ω²) because it is the standard metric taught in Six Sigma training and because the drill-down use case involves relative ranking, not absolute estimation.

Max-category Total SS is biased by category count: with 2 categories, each gets roughly 50% of variation; with 5 categories, each gets roughly 20%. A 2-category factor always looks "bigger" by this metric even when its η² is lower. That is why VariScout uses η² for the Mindmap suggestion ranking (the green pulse that highlights which factor to drill next).

### Why Total SS (not between-group) for category contribution

Between-group SS only captures **mean shift**: n_j × (x̄_j − x̄)². A category whose mean equals the grand mean shows 0% — even if it has enormous spread. This is misleading: a category with high within-group variation is a real contributor to overall variation, regardless of where its mean sits.

Total SS contribution = (SS_Between_j + SS_Within_j) / SS_Total. This captures **both** mean shift **and** spread. Categories always sum to 100%.

The worked example below demonstrates why this matters.

---

## Worked Example: Bottleneck Data

The [Bottleneck case study](../../04-cases/bottleneck/index.md) has 150 cycle time measurements across 5 process steps (30 observations each). Grand mean = 36.24 seconds, SS_Total = 7,039.

### Step-level decomposition

| Step       | n   | Mean  | SD  | SS_Between | SS_Within | Category SS | Total SS % |
| ---------- | --- | ----- | --- | ---------- | --------- | ----------- | ---------- |
| Step 1     | 30  | 32.5  | 2.0 | 412        | 116       | 528         | **7.5%**   |
| **Step 2** | 30  | 39.4  | 8.9 | 306        | 2,393     | 2,699       | **38.3%**  |
| Step 3     | 30  | 45.1  | 1.5 | 2,355      | 71        | 2,426       | **34.5%**  |
| Step 4     | 30  | 33.7  | 1.9 | 194        | 104       | 298         | **4.2%**   |
| Step 5     | 30  | 30.4  | 1.6 | 1,012      | 77        | 1,089       | **15.5%**  |
| **Total**  | 150 | 36.24 |     | **4,278**  | **2,761** | **7,039**   | **100%**   |

η² for the Step factor = 4,278 / 7,039 = **0.61** (61% of variation explained by step differences).

### The key comparison: Step 2 vs Step 3

| Metric                       | Step 2            | Step 3            | Which looks bigger? |
| ---------------------------- | ----------------- | ----------------- | ------------------- |
| SS_Between (mean shift only) | 306 (4.3%)        | 2,355 (33.5%)     | Step 3              |
| SS_Within (spread only)      | 2,393 (34.0%)     | 71 (1.0%)         | Step 2              |
| **Category Total SS**        | **2,699 (38.3%)** | **2,426 (34.5%)** | **Step 2**          |

If VariScout used **between-group SS** for the category popover, Step 2 would show just 4.3% contribution — it would look irrelevant. But Step 2 has the highest variance (SD = 8.9 vs the next highest at 2.0), and its inconsistency is what creates the production bottleneck.

**Total SS contribution** correctly shows Step 2 at 38.3% — the single largest contributor to overall variation. This matches the case study finding: Step 2's unpredictability, not Step 3's consistently high mean, is the real problem.

### What 38.3% means in practice

If you could eliminate Step 2's excess variation (bring its SD from 8.9 down to the average of other steps, ~1.8), you would remove approximately 34% of the total cycle time variation. Whether this translates to meaningful yield improvement depends on the specification limits — use the What-If Simulator to project the specific Cpk and yield change.

This matches the case study outcome: management was about to invest €50k upgrading Step 3 (highest mean). The variation analysis revealed Step 2 (highest spread) was the real bottleneck. The actual fix was €5k in training and standardized work instructions — a 10× better allocation of resources.

---

## How This Maps to the VariScout UI

### ANOVA panel (Boxplot view)

Shows F-statistic, p-value, and η². These are factor-level metrics that answer "does this factor matter?" η² = 0.61 for Step means 61% of all cycle time variation is explained by which step you measure.

F-test and p-value assume approximately normal data with similar spread across groups. η² and Total SS % are descriptive and do not require these assumptions.

### Mindmap suggestion ranking

The green pulse highlights the factor with the highest η² among unexplored factors. This guides the analyst to drill the most impactful factor next.

### Mindmap node circles

Each available node displays **η²** for that factor — the same metric shown in the ANOVA panel. This answers "how much variation does this factor explain?" at a glance. The node number matches the ANOVA panel number, ensuring cross-view consistency. Drilled (active) nodes show no percentage — they display the filtered value label instead. The category-level detail (Total SS %) is available in the popover.

### Category popover and contribution labels

Each row shows **Category Total SS %** for every category within the selected factor. These always sum to 100%. The analyst sees exactly how variation is distributed across categories — capturing both mean differences and spread.

### Drill-down filter chips

When the analyst filters (e.g. clicks Step 2), the contribution percentage on the filter chip shows how much of the **original** total variation that filter captures. This keeps the analyst anchored to the original problem throughout the drill-down.

The cumulative percentage represents the fraction of the original total variation captured by your current filter combination. "45% in focus" means your current drill path accounts for 45% of all the variation in the dataset — the remaining 55% comes from data outside your filter selection.

### Hypothesis tree (investigation panel)

Each factor sub-header shows the individual **η²** for that factor. Category headers (e.g. "Equipment", "People") do **not** show an aggregated variation percentage — η² values from separate one-way ANOVAs are not additive when factors are correlated, so summing them could exceed 100% and mislead.

**Design principle:** Only show variation numbers that are individually defensible. Never aggregate across factors unless using a multi-factor model that accounts for correlation.

### A note on controllability

Identifying a variation source is necessary but not sufficient for improvement. Before committing resources, assess whether the source is controllable (can be changed with training, procedure, settings) or structural (requires equipment, material, or design changes). The What-If Simulator helps quantify the potential impact of changes; domain expertise determines feasibility.

---

## For the Quality Professional

If you've completed Six Sigma Green Belt training, you've seen one-way ANOVA in the Analyze phase. VariScout uses the same F-test, p-value, and η² — plus one extension at the category level. Here is how VariScout's metrics map to standard terminology:

| Standard ANOVA term     | VariScout equivalent           | Notes                                                                                                                                         |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SS_Between / SS_Total   | η² in ANOVA panel              | Identical to standard η²                                                                                                                      |
| MS_Between / MS_Within  | F-statistic in ANOVA panel     | Standard F-test                                                                                                                               |
| SS for a specific group | Category Total SS %            | VariScout adds within-group SS to give full picture                                                                                           |
| Effect size (η²)        | Suggestion ranking             | Used to guide drill-down order                                                                                                                |
| Multi-Vari study        | Mindmap progressive drill-down | VariScout automates the Multi-Vari decomposition: the analyst drills factors one at a time, and the tool quantifies each level's contribution |

VariScout extends textbook ANOVA at the **category level**. Textbook ANOVA focuses on the F-test and η² (both factor-level metrics). VariScout extends the decomposition to individual categories by including within-group variation, because the drill-down workflow needs to answer "which category should I investigate?" — a question that between-group SS alone cannot answer reliably.

**Confounding:** One-factor-at-a-time analysis does not account for confounding between factors. If Operator and Shift are correlated (certain operators only work nights), drilling by Shift may capture variation actually caused by Operator. Phase 2 will re-introduce the Mindmap interaction mode and Advanced Regression model to detect and untangle these effects (see [Phase 2 Regression Roadmap](../../05-technical/implementation/phase2-regression-roadmap.md)).

---

## Limitations and Assumptions

The variation decomposition system is a practical tool for process investigation. Understanding its limitations helps the analyst know when to trust the drill-down and when to move to more rigorous methods.

### Path dependency

The drill-down examines one factor at a time. Different drill orders can produce different intermediate percentages — for example, drilling Shift → Operator may show different local scope fractions than Operator → Shift — but they converge on similar cumulative scope. For statistically rigorous joint analysis, the Regression panel planned for Phase 2 will provide correct multi-factor estimates (see [Phase 2 Regression Roadmap](../../05-technical/implementation/phase2-regression-roadmap.md)). See [Progressive Stratification](../../01-vision/progressive-stratification.md) Part 2 for a detailed treatment of this tension.

### Confounding and correlated factors

Real process data is rarely orthogonal. When factors are correlated (operator × shift, material × supplier), one-factor ANOVA misattributes variation. The drill-down can lead to incorrect factor prioritization. Phase 2 will re-introduce the Mindmap interaction mode as an early signal and the Advanced Regression model for the correct joint estimate (see [Phase 2 Regression Roadmap](../../05-technical/implementation/phase2-regression-roadmap.md)).

### Cumulative scope approximation

The cumulative scope percentage (the "in focus" number on drill-down chips) is the multiplicative product of local scope fractions through the drill path. This is an intuitive "funnel" metaphor, not a statistically grounded quantity. It treats each drill level's local scope as independent, which fails when factors are correlated. The regression model planned for Phase 2 will provide the correct joint estimate of explained variation.

### When to transition beyond drill-down

Use the drill-down for initial investigation (3–5 minutes). If you suspect interactions, have confounded factors, or need a formal model for projection, use the What-If Simulator to test scenarios with direct adjustments. Advanced Regression (planned for Phase 2) will provide formal multi-factor modelling and an automated handoff from the Mindmap — see [Phase 2 Regression Roadmap](../../05-technical/implementation/phase2-regression-roadmap.md).

---

## Presenting Results

When presenting variation findings to stakeholders, translate statistical metrics to business terms:

- Instead of "Step 2 contributes 38.3% of Total SS," say "Step 2's inconsistency accounts for the largest share of cycle time variation."
- Instead of "η² = 0.61 for Process Step," say "Which step the product is at explains 61% of the variation we see."
- Use the What-If Simulator to generate specific before/after projections: "Reducing Step 2's spread from 8.9 to 2.0 seconds would improve overall process capability from Cpk X to Cpk Y."

The chart copy and export features (clipboard, PNG, SVG) produce presentation-ready visuals that can be pasted directly into tollgate reviews and improvement reports.

---

## References

- NIST/SEMATECH e-Handbook of Statistical Methods, Section 7.4.3.2 — One-Way ANOVA
- Montgomery, D.C. _Introduction to Statistical Quality Control_ (8th ed.), Chapter 13
- VariScout implementation: `packages/core/src/stats/anova.ts` (ANOVA), `packages/core/src/variation/contributions.ts` (category decomposition)

---

## Cross-references

| Topic                                                 | Document                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| UX rationale for drill-down                           | [Progressive Stratification](../../01-vision/progressive-stratification.md) |
| Investigation workflow (Mindmap, Regression, What-If) | [Investigation to Action](../workflows/investigation-to-action.md)          |
| Boxplot ANOVA display                                 | [Boxplot](boxplot.md)                                                       |
| Category contribution labels                          | [Boxplot](boxplot.md)                                                       |
| Regression and interaction analysis                   | [Regression](regression.md)                                                 |
| Glossary: η², Total SS Contribution                   | `packages/core/src/glossary/terms.ts`                                       |
