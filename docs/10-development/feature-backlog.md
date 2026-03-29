---
title: Feature Backlog
---

# Feature Backlog

Features identified from user testing discussions (2026-03-29) and development sessions. Organized by theme, prioritized by user impact.

## Source Discussions

| Date       | Topic                                     | Transcript                                                                                                               |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-29 | Dataset analysis (Finland arrivals)       | [discussions/2026-03-29-dataset-analysis.txt](discussions/2026-03-29-dataset-analysis.txt)                               |
| 2026-03-29 | Probability plot UX                       | [discussions/2026-03-29-probability-plot.txt](discussions/2026-03-29-probability-plot.txt)                               |
| 2026-03-29 | Probability plot methodology + commenting | [discussions/2026-03-29-probability-plot-and-commenting.txt](discussions/2026-03-29-probability-plot-and-commenting.txt) |

---

## Chart Interaction & Annotations

- [ ] **Chart commenting on data points and regions** — Select a specific data point, region, or range on any chart (Boxplot, Probability plot, I-Chart) and add a comment. Extends the current Finding/annotation system to support more granular anchoring (point-level, not just category-level).
  - _Source: Probability plot discussion — "there should be multiple possibilities to make a comment on it"_

- [ ] **Brushing mode with smart selection** — Select all points above/below a value (e.g., target, control limit). Selection respects performance measure direction: if smaller-is-better, "select all above USL" highlights the failures. Could also support "select all outside control limits" as a one-click action.
  - _Source: User feedback — "select all above/below certain value depending on direction of performance measure"_

## Statistical Features

- [ ] **Chi-square test (simple)** — Observed vs expected distribution test. Foundation for probability plot regression, goodness-of-fit, and hypothesis testing. Could be shown alongside probability plot as a normality/distribution test.
  - _Source: Methodology discussion — "chi-square test is a fundamental aspect in building all statistical analysis"_

- [ ] **Multiple probability plots** — Overlay probability plots for each rational subgroup (process step) on the same axes. Steeper line = faster/better process. Enables visual prioritization of which process steps to fix first.
  - _Source: Methodology discussion — "show you that whole set of individual process steps as a multiple probability plot"_

- [ ] **Best subsets regression** — "Don't search for the function first. Search for which variables make a difference." Identifies which factors explain the most variation using R² adjusted. Natural extension of ANOVA. (Deferred per ADR-014.)
  - _Source: Methodology discussion — "that's best subsets regression, that's what you teach first"_

## Analysis Modes

- [ ] **Output-based analysis** — Analyze output per process step and overall production line output. Relates to Yamazumi (time study) but focused on throughput/yield rather than cycle time. Probability plot inflection points map to process step transitions.
  - _Source: Methodology discussion — "relate those to the process steps, you can say which process steps should be fixed in what order"_

## UX & Accessibility

- [ ] **Text size for everything, not just charts** — Current "Chart Text Size" setting (compact/normal/large) only scales chart fonts. Extend to all UI: stats panel, data table, filter chips, tooltips, navigation. Users with reduced vision need consistent scaling.
  - _Source: Both discussions — "bigger fonts... my current setting is just chart text size but it should be everything"_

- [ ] **Data panel to left sidebar, CoScout to right sidebar** — In the Process Improvement tab, data/stats should live on the left side and CoScout AI on the right side. Clear spatial separation between data exploration (left) and AI assistance (right).
  - _Source: User feedback — "data only to left side process improvement tab, right side is for CoScout"_

---

## Already Implemented (2026-03-29)

- [x] **Wide-form data support (Stack Columns)** — ADR-050. Paste 80+ column datasets, stack into long-form for analysis. Integrated into ColumnMapping with smart detection.
  - _Source: Dataset analysis discussion — "I'm not able to answer with the current data structure"_

- [x] **Pareto Top N + Others** — ADR-051. Top 20 categories + "Others" aggregated bar for many-category datasets.

- [x] **Adaptive boxplot category limits** — Width-driven limits with specs-aware priority selection. Overflow indicator + category picker in BoxplotDisplayToggle.

- [x] **I-Chart factor tooltips** — Hover shows factor values (Month, Year) alongside point value.

- [x] **Create Factor auto-switch** — After creating a factor from selection, boxplot and pareto auto-switch to the new factor.

- [x] **Chart label rotation** — Boxplot and Pareto rotate labels -45° and truncate for 10+ categories.
