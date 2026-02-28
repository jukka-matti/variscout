# Minitab Competitive Benchmark

> Based on public documentation, published feature sets, and market positioning knowledge. Unlike the [EDAScout Benchmark](edascout-benchmark.md), this assessment does not include direct codebase analysis.

---

## Product Profile

| Dimension           | Minitab                                                          | VariScout                                               |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **Platform**        | Desktop application (Windows, macOS)                             | Browser-based (PWA, Azure, Excel Add-in)                |
| **Pricing**         | ~$1,700/year single user, ~$700/year academic                    | From €99/month (Azure) or free (PWA)                    |
| **Distribution**    | Direct sales, site licenses, academic programs                   | Azure Marketplace, AppSource, public URL                |
| **Target audience** | Statisticians, quality engineers, Black Belts                    | Quality practitioners, Green Belts, learners            |
| **Market position** | Industry standard for statistical analysis (30+ years)           | Lightweight variation analysis alternative              |
| **Analysis model**  | Menu-driven: select analysis type, configure dialog, view output | Four Lenses: 4 coordinated charts with linked filtering |
| **Navigation**      | 200+ analysis types across deeply nested menus                   | Progressive stratification drill-down                   |

---

## Core Capabilities

Minitab's feature set is the result of 30+ years of accumulation. The capabilities relevant to VariScout's analytical space include:

### SPC and Control Charts

Minitab offers a comprehensive suite of control charts: I-MR, Xbar-R, Xbar-S, P, NP, C, U, EWMA, CUSUM, and more. Each chart type is a separate menu selection with a multi-step configuration dialog. Control limits are calculated automatically but customization requires navigating options dialogs. The breadth is unmatched; the interaction cost per chart is high.

### Capability Analysis

Full capability study suite: Cp, Cpk, Pp, Ppk, Cpm, with distribution fitting (normal, Weibull, lognormal, etc.). Process capability sixpack combines multiple views in a single output. The analysis assumes the user has already identified the relevant subgroup and measurement — Minitab doesn't guide the user toward the right measurement to analyze.

### ANOVA and Factor Analysis

General Linear Model, one-way ANOVA, two-way ANOVA, balanced/unbalanced designs, nested designs. Interaction plots are available as post-hoc visualization of fitted models. The user must specify the model terms manually — Minitab does not automatically surface which factors matter or rank them by contribution.

### Regression

Simple, multiple, stepwise, best subsets, binary/ordinal/nominal logistic, Poisson. Comprehensive model diagnostics. Stepwise selection automates variable selection but requires the user to set up the analysis and interpret diagnostic plots.

### DOE (Design of Experiments)

Full factorial, fractional factorial, response surface, mixture, Taguchi. Response Optimizer finds optimal factor settings from designed experiments. This is Minitab's deepest differentiator — a capability set that VariScout does not and will not replicate, as it requires controlled experimental data rather than observational process data.

### Multi-Vari Charts

Purpose-built chart type for visualizing factor interactions. Shows measurement variation across multiple factors simultaneously. Accessed as a separate analysis (Quality Tools > Multi-Vari Chart), not integrated into an investigation workflow.

### Minitab Assistant

Guided analysis selection introduced in recent versions. Uses a decision-tree approach: the user answers questions about their data and objective, and the Assistant recommends the appropriate statistical test. This is hypothesis-driven guidance (confirming a suspected cause) rather than exploration guidance (finding which factor matters). The Assistant directs the user to the right menu item; it doesn't guide them through an iterative investigation.

---

## Analysis and Investigation Workflow

Minitab's workflow is fundamentally **menu-dialog-output**:

1. The analyst has a hypothesis or question ("Is Machine C different from Machine A?")
2. They navigate to the correct menu (Stat > ANOVA > One-Way)
3. They configure the dialog (select response column, factor column, options)
4. They read the output (session window text + graphs)
5. They decide what to do next based on their own statistical knowledge

Each analysis is a discrete, self-contained step. There is no linked filtering between outputs — running a one-way ANOVA on Machine does not automatically update the capability analysis or control chart. The analyst must manually re-run each analysis with new subsets. There is no concept of a "drill-down path" where one finding leads to the next through connected interactions.

The Session Window accumulates text output chronologically. Finding results from earlier analyses requires scrolling. There is no navigation structure that connects related analyses into an investigation narrative.

For variation investigation specifically, a Minitab user would:

1. Run descriptive statistics to get an overview
2. Run one-way ANOVA for each factor separately
3. Examine eta-squared or SS values to rank factor importance (manually)
4. Create subsets and re-run analyses for factor combinations (manually)
5. Build a multi-vari chart to visualize interactions (separate analysis)
6. Run capability analysis on the relevant subgroup (separate analysis)

This requires 6+ separate analysis steps, each initiated from menus. VariScout's progressive stratification accomplishes the same investigation through clicking boxplot bars, with all four charts updating simultaneously.

---

## How Minitab Addresses Our 6 Tensions

| Tension                  | Minitab's Approach                                                                                                                                                                                                                     | Assessment                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Hierarchy Assumption** | Multi-vari charts can visualize interactions, but they're a separate analysis that the user must know to run. Interaction terms must be specified manually in GLM.                                                                     | Not addressed in the workflow; available as a separate tool for experts.                  |
| **Discoverability**      | All 200+ analyses are listed in menus. The Assistant helps navigate. But the volume of options is itself a discoverability problem — finding the right analysis in nested menus is a known training challenge.                         | Partially addressed through Assistant; worsened by menu depth.                            |
| **Factor Ordering**      | ANOVA output includes SS and p-values that implicitly rank factors by contribution. But the ranking is in a text table, not a visual navigation element. The analyst must read the table and manually decide what to investigate next. | Information available but not actionable — no integration with navigation.                |
| **When to Stop**         | No stopping guidance. The analyst decides based on statistical significance thresholds and domain knowledge. Minitab reports results; it doesn't suggest when the investigation is complete.                                           | Not addressed.                                                                            |
| **Mobile Screen Budget** | Not applicable. Minitab is desktop software designed for large screens. No mobile or responsive interface.                                                                                                                             | Not applicable.                                                                           |
| **Path Dependency**      | Each analysis is independent. There is no drill-down path, so there is no path dependency. But this independence means the analyst must manually manage the investigation sequence, which is the problem path dependency addresses.    | Avoided by not having a drill-down model, at the cost of manual investigation management. |

---

## Feature Comparison

| Capability                           | Minitab                                     | VariScout                                |
| ------------------------------------ | ------------------------------------------- | ---------------------------------------- |
| Control charts (I-MR)                | Yes, plus 20+ chart types                   | Yes (I-Chart)                            |
| Capability analysis (Cp/Cpk)         | Full suite with distribution fitting        | Normal-based with spec limit input       |
| Boxplot                              | Yes, as standalone analysis                 | Yes, integrated with filtering           |
| Pareto chart                         | Yes, as standalone analysis                 | Yes, integrated with filtering           |
| ANOVA                                | GLM, one-way, multi-way, nested             | One-way with eta-squared ranking         |
| Regression                           | Full suite (simple through logistic)        | Simple and multiple regression           |
| Gage R&R                             | Full MSA suite (crossed, nested, expanded)  | Not available                            |
| DOE                                  | Full factorial, response surface, mixture   | Not available (different problem domain) |
| Linked filtering across charts       | No                                          | Yes (core differentiator)                |
| Progressive drill-down               | No                                          | Yes (core differentiator)                |
| Variation contribution (eta-squared) | Available in ANOVA output (as SS%)          | Visual, interactive, cumulative tracking |
| Multi-measure performance analysis   | No unified view                             | Performance Mode (Azure)                 |
| Offline/browser-based                | No (desktop installation required)          | Yes (PWA, offline-first)                 |
| Learning curve                       | Steep (training courses typically 3–5 days) | Minimal (guided by design)               |
| Price for classroom use              | $700/year academic per seat                 | Free (PWA)                               |

---

## Strategic Implications for VariScout

### Where We Differentiate

- **Exploration UX**: VariScout's linked filtering and progressive stratification provide a fundamentally different investigation experience. Minitab requires the analyst to manage the investigation manually through sequential menu selections.
- **Price and deployment**: Free browser-based tool vs. $1,700/year desktop software. For training contexts, this is the primary decision factor.
- **Learning curve**: Minitab's depth creates a steep learning curve. Quality programs spend 3–5 days teaching the software. VariScout's design goal is zero software training.
- **Methodology integration**: VariScout embeds the investigation methodology (progressive stratification) into the interaction design. Minitab provides tools; the analyst supplies the methodology.

### What We Can Learn

- **Multi-vari chart concept**: Minitab's multi-vari chart is a well-understood visualization for factor interactions. The interaction heatmap pattern draws on similar concepts but integrates them into the drill-down workflow.
- **Capability sixpack layout**: Combining multiple capability views in a single output is effective for comprehensive assessment. VariScout's Four Lenses approach extends this concept.
- **Assistant decision trees**: The idea of guided analysis selection has value, though VariScout's version (factor suggestion) operates within an EDA workflow rather than as a test-selection wizard.

### What to Avoid Adopting

- **Menu-driven architecture**: Minitab's menu depth is a known usability problem. VariScout should never evolve toward a menu-heavy interface.
- **Disconnected analyses**: Each Minitab analysis being independent is the opposite of VariScout's linked-filtering model. Adding features that break the connection between charts would undermine the core differentiator.
- **Feature accumulation**: Minitab's 200+ analysis types serve different audiences. VariScout should remain focused on the variation investigation workflow rather than becoming a general-purpose statistical package.
