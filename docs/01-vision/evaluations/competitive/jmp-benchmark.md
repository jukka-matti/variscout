---
title: 'JMP Competitive Benchmark'
---

# JMP Competitive Benchmark

> Based on public documentation, published feature sets, and market positioning knowledge. Unlike the [EDAScout Benchmark](edascout-benchmark.md), this assessment does not include direct codebase analysis.

---

## Product Profile

| Dimension           | JMP                                                             | VariScout                                               |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Platform**        | Desktop application (macOS, Windows)                            | Browser-based (PWA, Azure, Excel Add-in)                |
| **Pricing**         | $1,785+/year (Pro: $14,900+/year)                               | From €99/month (Azure) or free (PWA)                    |
| **Distribution**    | SAS direct sales, academic licenses                             | Azure Marketplace, AppSource, public URL                |
| **Target audience** | Scientists, engineers, advanced analysts                        | Quality practitioners, Green Belts, learners            |
| **Market position** | Premium visual analytics + statistics (SAS product)             | Lightweight variation analysis tool                     |
| **Analysis model**  | Platform-based: Graph Builder, Fit Model, specialized platforms | Four Lenses: 4 coordinated charts with linked filtering |
| **Navigation**      | Launch platforms from menu, each opens in own window            | Progressive stratification drill-down                   |
| **Parent company**  | SAS Institute                                                   | Independent                                             |

---

## Core Capabilities

JMP has the strongest EDA heritage of any traditional statistical package. Its Graph Builder and interactive visualization tools set it apart from Minitab's menu-dialog-output model. The capabilities relevant to VariScout include:

### Graph Builder

JMP's signature feature. A drag-and-drop chart construction interface where the user drags variables onto X, Y, Group, Wrap, and Overlay drop zones. The chart type adjusts automatically based on variable types (continuous → scatterplot, categorical → bar chart). Multiple variables can be layered to create complex visualizations interactively.

Graph Builder is genuinely exploratory — the analyst experiments with variable combinations and the visualization updates in real time. This is the closest any major statistical tool comes to supporting open-ended visual investigation. However, it's chart-centric (building one chart at a time), not investigation-centric (guiding through a multi-chart workflow).

### Fit Model Platform

JMP's general modeling environment. The analyst specifies response variables, model effects (main effects, interactions, nested terms), and the platform fits the model and produces diagnostics. Interaction terms must be explicitly added — JMP doesn't automatically scan for interactions, but the Effect Summary table ranks terms by significance.

### Prediction Profiler

An interactive visualization of a fitted model's factor effects. Each factor gets a slider; moving the slider shows the predicted response change. The Profiler is powerful for understanding factor effects once a model is fitted, but it requires model specification first — the analyst must already know which factors to include.

The Interaction Profiler extension shows two-factor interaction surfaces. Again, the model must be fitted first, and the interactions must be included in the model specification.

### Scatterplot Matrix and Correlation

Pairwise scatterplots and correlation coefficients across multiple variables. Useful for identifying relationships but separate from the modeling workflow — the analyst must navigate to a different platform to act on the patterns observed.

### Column Contributions

In fitted models, JMP's Effect Summary panel shows variable importance ranked by LogWorth (-log10 of p-value) or sum of squares contribution. This is conceptually similar to VariScout's eta-squared ranking but lives inside the modeling platform rather than being integrated into the navigation workflow.

### Distribution Platform

Histograms, quantile plots, and goodness-of-fit tests. Each variable gets its own panel. Capability indices (Cpk, Ppk) are available through the Process Capability platform, which is separate from the Distribution platform.

### Control Chart Builder

Interactive control chart construction with drag-and-drop. Supports I-MR, Xbar-R, P, NP, C, U. The builder allows phased control limits. Unlike Minitab's menu-dialog approach, JMP's control chart builder is interactive — the analyst can exclude points and update limits in real time.

---

## Analysis and Investigation Workflow

JMP's workflow is **platform-centric**:

1. The analyst opens a platform (Graph Builder, Fit Model, Distribution, etc.)
2. They drag variables and configure the analysis interactively
3. They read the output within the platform window
4. They open another platform for a different perspective
5. Each platform operates independently (no linked filtering between platforms)

JMP's approach is more interactive than Minitab's menu-dialog model but still analysis-type-centric rather than investigation-centric. The analyst decides which platform to open and which variables to examine. There is no workflow that guides the analyst from "I see variation" to "here's what's causing it" through connected interactions.

For variation investigation, a JMP user would:

1. Open Graph Builder to explore distributions and relationships visually
2. Open Fit Model to fit an ANOVA or regression and examine the Effect Summary
3. Read the Effect Summary to identify important factors and interactions
4. Open the Prediction Profiler to understand factor effects interactively
5. Open the Control Chart Builder for the relevant measurement
6. Open Process Capability for Cpk assessment

Each step requires opening a new platform. The platforms don't share filter state — filtering in Graph Builder doesn't update the Fit Model output. The analyst must mentally track which findings connect across platforms.

---

## How JMP Addresses Our 6 Tensions

| Tension                  | JMP's Approach                                                                                                                                                                                                                                                                   | Assessment                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Hierarchy Assumption** | Fit Model supports interaction terms. The Interaction Profiler visualizes two-factor interactions. But interaction terms must be explicitly added to the model — JMP doesn't automatically detect or highlight them during exploration.                                          | Partially addressed through modeling, not through exploration workflow.                        |
| **Discoverability**      | Graph Builder makes visual exploration highly accessible. The drag-and-drop interface invites experimentation. But moving from Graph Builder to statistical modeling requires a platform switch — the exploratory and confirmatory workflows are disconnected.                   | Partially addressed for visual patterns; not addressed for statistical investigation workflow. |
| **Factor Ordering**      | Effect Summary in Fit Model ranks terms by significance (LogWorth). Graph Builder surfaces visual patterns that the analyst interprets to prioritize factors. But neither provides navigation guidance — the ranking is information, not an actionable "drill here next" prompt. | Information available in modeling platform; not integrated into visual exploration.            |
| **When to Stop**         | No stopping guidance. Model fit statistics (R-squared, lack of fit) indicate model adequacy but don't translate to investigation completeness.                                                                                                                                   | Not addressed.                                                                                 |
| **Mobile Screen Budget** | Not applicable. JMP is desktop software with no mobile interface. JMP Live (web publishing) is view-only.                                                                                                                                                                        | Not applicable.                                                                                |
| **Path Dependency**      | No drill-down path exists, so no path dependency. Platforms are independent windows. The analyst's investigation sequence is entirely self-directed.                                                                                                                             | Avoided by not having a drill-down model.                                                      |

---

## Feature Comparison

| Capability                      | JMP                                              | VariScout                                  |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| Interactive chart building      | Graph Builder (drag-and-drop)                    | Pre-configured Four Lenses                 |
| Control charts                  | Control Chart Builder (interactive)              | I-Chart with linked filtering              |
| Capability analysis             | Process Capability platform                      | Integrated capability lens                 |
| Boxplot                         | Graph Builder element                            | Integrated with drill-down filtering       |
| Pareto chart                    | Quality and Process > Pareto                     | Integrated with drill-down filtering       |
| ANOVA / factor ranking          | Fit Model with Effect Summary                    | One-way with eta-squared visual ranking    |
| Interaction detection           | Fit Model (explicit interaction terms)           | Planned: interaction heatmap               |
| Regression                      | Fit Model, Fit Y by X                            | Simple and multiple regression             |
| Gage R&R                        | MSA platform (Variability / Attribute charts)    | Not available                              |
| Prediction Profiler             | Yes (interactive model profiling)                | Not available (different approach)         |
| DOE                             | Full suite (custom design, definitive screening) | Not available (different problem domain)   |
| Linked filtering across charts  | No (each platform is independent)                | Yes (core differentiator)                  |
| Progressive drill-down          | No                                               | Yes (core differentiator)                  |
| Variation contribution tracking | Effect Summary (LogWorth, SS%)                   | Cumulative eta-squared in variation funnel |
| Browser-based                   | No (JMP Live is view-only publishing)            | Yes (PWA, offline-first)                   |
| Price for classroom use         | Academic licensing (discounted)                  | Free (PWA)                                 |

---

## Strategic Implications for VariScout

### Where We Differentiate

- **Investigation workflow**: JMP provides excellent tools for building individual analyses. VariScout provides an investigation workflow where one finding leads to the next through connected interactions. The analyst doesn't need to decide which platform to open next — the drill-down guides the investigation.
- **No model required**: JMP's strongest features (Prediction Profiler, Effect Summary) require fitting a model first. VariScout's progressive stratification works directly on the data without requiring the analyst to specify model terms.
- **Price and deployment**: JMP starts at $1,785/year for desktop software. VariScout's PWA is free for training; the Azure app starts at €99/month for teams.
- **Learning curve**: JMP's power comes with complexity. Graph Builder is intuitive, but moving to Fit Model and interpreting diagnostics requires statistical training. VariScout targets analysts who need answers without formal statistics education.

### What We Can Learn

- **Graph Builder interaction model**: The drag-and-drop exploration approach is effective for open-ended analysis. VariScout's factor suggestion pattern draws on similar exploratory philosophy, using statistical ranking rather than drag-and-drop.
- **Effect Summary ranking**: JMP's LogWorth ranking in fitted models is a proven way to communicate factor importance. VariScout's eta-squared ranking in the boxplot serves the same purpose with less statistical overhead.
- **Interactive profiling**: The Prediction Profiler's "slide and see" interaction for understanding factor effects is a strong UX pattern. If VariScout adds interactive "what-if" exploration, this is the benchmark.

### What to Avoid Adopting

- **Platform fragmentation**: JMP's multi-window, multi-platform architecture means the analyst manages investigation state mentally. VariScout's single-view, linked-filtering approach is a deliberate simplification.
- **Model-first analysis**: Requiring model specification before exploration inverts the EDA workflow. VariScout should keep the principle that exploration comes before modeling.
- **Feature depth over workflow clarity**: JMP's depth serves advanced users well but creates barriers for the Green Belt audience. VariScout should prioritize workflow clarity over analytical depth.
