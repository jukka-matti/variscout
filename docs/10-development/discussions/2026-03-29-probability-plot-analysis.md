---
title: Probability Plot — Multi-Angle Analysis
date: 2026-03-29
sources:
  - 2026-03-29-probability-plot.txt
  - 2026-03-29-probability-plot-and-commenting.txt
audience: [developer, product]
category: reference
status: draft
---

# Probability Plot: Multi-Angle Analysis

Deep analysis of two user testing discussions about the probability plot feature, examined from statistical methodology, usability, and practical perspectives.

---

## 1. Statistical Methodology Perspective

### What the expert is teaching

The probability plot isn't just a normality check — it's a **process diagnostic tool**. The key methodological insights from the discussion:

**Inflection points = process transitions.** When the probability plot shows a change in slope (inflection), that indicates a shift in the underlying distribution. In a production process, each inflection corresponds to a transition between process steps. A perfectly designed single-step process produces a straight line. Multiple slopes = multiple processes mixed.

**Steepness = speed/capability.** A steeper (more vertical) line means tighter distribution — the process step is faster/more capable. A flatter line means wider distribution — slower/less capable. This gives an immediate visual ranking of process steps.

**The chi-square connection.** The fitted line on the probability plot represents the _expected_ distribution. The actual data points are _observed_. The ratio of observed vs expected is the chi-square statistic. This connects probability plot → goodness-of-fit testing → ANOVA → regression. The chi-square test quantifies "how well does this data follow the expected distribution?"

**Multiple probability plots for subgroup comparison.** Overlay probability lines for each rational subgroup (process step) on the same axes. Each should be approximately straight (normal within its step). The comparison reveals:

- Which steps are most variable (flattest lines)
- Which steps deviate from normal (curved lines)
- Priority order for improvement (fix the flattest/most curved first)

### What VariScout currently has vs what's needed

| Capability                      | Current                                           | Needed                                       |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| Single probability plot         | Yes — fitted normal line + CI bands + data points | Works well                                   |
| Normality assessment            | Visual (line straightness)                        | Add chi-square or Anderson-Darling p-value   |
| Inflection point detection      | No                                                | Auto-detect slope changes, mark on plot      |
| Multiple subgroup overlay       | No                                                | Overlay lines by factor level (process step) |
| Annotation on inflection points | No                                                | Mark inflection = "process loss here"        |
| Cp/Cpk display on plot          | No — user had to search stats panel               | Show on probability plot itself              |

### Statistical features to add (prioritized)

1. **Chi-square / Anderson-Darling goodness-of-fit** — Show p-value on the plot. "Is this data normally distributed?" Answer: p-value and a clear pass/fail indicator.
2. **Multiple probability plot by factor** — When a factor is selected, draw one line per factor level. Same Y-axis (probability), same X-axis (values). Different colors per level.
3. **Inflection point detection** — Piecewise linear regression on the probability plot data. Detect where the slope changes significantly. Mark inflection points with vertical markers.

---

## 2. Usability Perspective

### What went wrong in the testing

**Discussion 1 (6 min) — navigating the probability plot:**

| Time      | What happened                                             | Root cause                                                                     |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 2:09      | Found the probability plot                                | OK — it's in the capability view                                               |
| 2:20      | "I can't really see any dashed lines for outer limits"    | **Plot too small in dashboard card** — CI dashed lines are thin at small scale |
| 2:28      | "It is so small"                                          | Dashboard card ≈ 250-400px, probability plot needs more space                  |
| 2:37      | Tried to click to open focused view                       | **Didn't know how to focus** — no clear "click to expand" affordance           |
| 2:51      | "You can't do that, okay"                                 | **Focused view entry is unclear**                                              |
| 3:00      | "Bigger fonts... should be everything"                    | **Text scale only affects charts**, not UI                                     |
| 3:33      | Found the histogram but confused it with probability plot | **Two similar-looking charts** without clear labels                            |
| 4:01      | Looking for Cp/Cpk                                        | **Cp/Cpk values not on the chart itself** — had to open stats panel            |
| 4:15-5:37 | Struggled with stats panel open/close                     | **Stats panel UX confusing** — not obvious how to toggle                       |
| 5:33      | "How do I close this?"                                    | **No clear close button or gesture**                                           |

**Key UX problems:**

1. **Probability plot is too small in dashboard card.** It's a detail-rich chart (data points, fitted line, CI bands, axis labels) crammed into ~300-400px. Needs focused view prominence.

2. **No clear "click to expand" on charts.** Users expected clicking the chart to open focused/fullscreen view. Current: need to find the focus icon in the card header.

3. **Cp/Cpk should be ON the probability plot** in capability mode, not hidden in the stats panel. In Minitab, the probability plot shows: AD test statistic, p-value, mean, StDev, N, and capability indices directly on the chart.

4. **Stats panel toggle is confusing.** The "Stats" button's open/close behavior wasn't intuitive. User spent 90 seconds trying to close it.

5. **Histogram and probability plot look similar at small size.** Both show distribution shape. At dashboard card scale, the probability plot's distinguishing features (diagonal line, probability Y-axis) are hard to see.

### UX improvements needed

1. **Double-click or prominent expand button on probability plot** — since it's a detail chart, it should be easy to go fullscreen.
2. **Signature block on probability plot** — Show key stats (N, Mean, StDev, AD p-value, Cp/Cpk if specs set) directly on the chart, Minitab-style. The `signatureElement` prop already exists but isn't used.
3. **Better chart labels at small size** — Small icon or text label distinguishing "Probability Plot" from "Histogram" in the dashboard card header.
4. **Stats panel toggle needs clearer affordance** — Consider a dedicated sidebar pattern instead of a toggle that adds/removes content.

---

## 3. Practical / Workflow Perspective

### How the probability plot fits in the analysis workflow

From the discussions, the probability plot serves three distinct purposes depending on the analysis phase:

**Phase 1 — SCOUT (Exploration):**
"Is my data normally distributed?" → Single probability plot, look for straight line. If it curves, there are mixed distributions (multiple processes, outliers, or non-normal behavior). This is a quick check.

**Phase 2 — INVESTIGATE (Root Cause):**
"Which process steps contribute to non-normality?" → Multiple probability plot overlaid by factor (process step). Each step should be straight. Inflection points in the combined plot show where process transitions add variation. **This is the killer feature the expert is describing.**

**Phase 3 — IMPROVE (Prioritize):**
"Which process step should I fix first?" → Compare slopes across subgroup lines. Flattest = most variable = highest priority. The probability plot becomes a **prioritization tool**, not just a normality check.

### What the expert's workflow looks like

```
1. Look at combined probability plot → see inflection points
2. Identify inflection points align with process step transitions
3. Split by rational subgroups (factor = process step)
4. Each subgroup shows a straight line → confirms normality within step
5. Compare slopes → flatter = more variation = fix first
6. Annotate: "Process Step 3 is the bottleneck — flattest line"
7. Prioritize improvement actions based on slope ranking
```

### Data requirements for this workflow

The expert explicitly stated: "Each step would have to be one column" or "have the process step in a column." This maps directly to VariScout's factor model:

- **Outcome** = the Y measurement (productivity, cycle time, weight)
- **Factor** = process step (Step 1, Step 2, Step 3...)
- **Multiple probability plot** = one line per factor level

This doesn't require new data structures — just a multi-series probability plot that reads from the same factor/outcome data already in VariScout.

### Commenting on the probability plot

The expert specifically wants to annotate inflection points: "there should be multiple possibilities to make a comment on it." This connects to VariScout's existing Finding system:

- **Current:** I-Chart supports free-floating annotations, Boxplot/Pareto support category-based annotations
- **Needed:** Probability plot annotations anchored to either (a) a specific data point or (b) a percentile/value position on the plot

### Integration with existing VariScout features

| VariScout feature     | Probability plot connection                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Staged analysis**   | Each stage = a potential subgroup for multi-probability overlay                                |
| **ANOVA**             | ANOVA identifies which factor matters; probability plot shows the distribution shape per level |
| **Findings**          | Annotate inflection points as findings ("loss point between Step 2 and 3")                     |
| **CoScout AI**        | "Why isn't this data normal?" → CoScout could interpret the probability plot shape             |
| **Filter drill-down** | Filter to one factor level → probability plot shows that level's distribution                  |

---

## 4. Feature Roadmap: Probability Plot Enhancement

Based on all three angles, here's the recommended build sequence:

### Phase A — Quick wins (UX polish)

1. **Signature block** — Show N, Mean, StDev, AD p-value directly on the chart (use existing `signatureElement` prop)
2. **Anderson-Darling p-value** — Compute and display normality test result
3. **Easier focused view** — Larger click target, or double-click to expand
4. **Cp/Cpk on chart** when in capability mode

### Phase B — Multi-series probability plot

1. **Overlay by factor** — When a factor is selected, draw one line per factor level with different colors
2. **Legend** — Show factor levels with their line colors
3. **Per-level stats** — Mean, StDev, N per subgroup line
4. **Slope comparison** — Visual indicator of which line is steepest/flattest

### Phase C — Process diagnostics

1. **Inflection point detection** — Piecewise linear regression, mark change points
2. **Annotations on inflection points** — Create findings at inflection locations
3. **Chi-square goodness-of-fit** — Statistical test with visual feedback
4. **Process step prioritization** — Rank subgroups by slope (variation) for improvement

### Phase D — Advanced

1. **Non-normal distributions** — Fit lognormal, Weibull, etc. (currently normal only)
2. **Best subsets connection** — Link probability plot residuals to factor analysis
3. **Export with annotations** — Include inflection markers and findings in chart export
