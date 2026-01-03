# VaRiScout Lite: LSS Trainer Feature Strategy

**Status:** Planning
**Date:** January 2026
**Version:** 1.0

---

## Executive Summary

VaRiScout Lite is positioned as a browser-based variation analysis tool to replace Minitab in Lean Six Sigma training environments. Rather than competing on statistical test coverage, VaRiScout differentiates through superior user experience, plain-language insights, and zero-friction deployment.

This document specifies the minimum feature additions required for Green Belt trainer adoption: ANOVA calculations integrated with existing boxplots, a new Regression tab with multi-factor comparison and auto-fit intelligence, and a Gage R&R tab for measurement system analysis.

---

## Core Value Proposition: Live Analysis & Exploration

### The Problem

Traditional tools (Minitab, Excel) require preparation before meetings. Analysis happens offline, then gets presented later. Questions from stakeholders can't be answered live.

### VaRiScout Solution

Quick setup, then instant live exploration.

```
TWO-PHASE WORKFLOW
─────────────────────────────────────────────────────────────

PHASE 1: SETUP (1-3 minutes)
─────────────────────────────────────────────────────────────

   Upload CSV → Select columns → First charts appear
       │              │                  │
       ▼              ▼                  ▼
   Drag & drop    Outcome, Factor,    Auto-generated
                  Category dropdowns   I-Chart, Boxplot, etc.

   "Here's our delivery time data from Q4..."


PHASE 2: LIVE EXPLORATION (seconds per insight)
─────────────────────────────────────────────────────────────

   "What about     "And if we      "Show me just
    shift B?"       remove          the outliers"
        │           outliers?"           │
        ▼               ▼                ▼
   Click boxplot   Click I-Chart    Click Pareto
   → instant       → instant        → instant
   filter          filter           filter

   Charts update instantly. Questions answered live.
```

### The Magic: Instant Filter Adjustments

| Action                | Time  | Result                          |
| --------------------- | ----- | ------------------------------- |
| Click boxplot bar     | 1 sec | All charts filter to that group |
| Click pareto category | 1 sec | Drill down to that subset       |
| Remove filter         | 1 sec | Back to previous view           |
| Clear all             | 1 sec | Reset to full dataset           |
| Copy to clipboard     | 2 sec | Ready to paste in PPT           |

### Why This Matters

| Traditional Workflow              | VaRiScout Workflow                |
| --------------------------------- | --------------------------------- |
| Prepare analysis before meeting   | 1-3 min setup, then explore live  |
| "I'll check and get back to you"  | "Let me filter to that right now" |
| Static slides, can't drill down   | Click to filter, instant update   |
| New question = new analysis later | New question = one click now      |
| Export → Format → Insert into PPT | Copy → Paste (done)               |

### Key Enablers

| Feature                 | Enables                              |
| ----------------------- | ------------------------------------ |
| Drag-drop CSV upload    | Data loaded in seconds               |
| Simple column selection | Setup in 1-3 minutes                 |
| Auto-generated charts   | No configuration needed              |
| Click-to-filter         | Answer follow-up questions instantly |
| Visible filter state    | Everyone sees what subset is shown   |
| One-click copy          | Charts in PPT immediately            |
| Presentation mode       | Clean view for screen sharing        |

**Setup once, explore endlessly.** This is a **live analysis tool** — not a batch reporting tool.

---

## Strategic Position

### The Wrong Battle

Competing on statistical test coverage means losing to Minitab forever. They have 30 years of accumulated features. VaRiScout wins by solving problems Minitab cannot.

### Trainer Pain Points with Minitab

| Pain Point                              | VaRiScout Opportunity         |
| --------------------------------------- | ----------------------------- |
| Expensive per-seat licensing            | Free/cheap for classroom use  |
| Students fight the UI                   | Clean, obvious interface      |
| "Which menu is that test under?"        | Guided workflows              |
| No connection between tools and DMAIC   | Built-in methodology context  |
| Output requires interpretation training | Plain-language insights       |
| Installation headaches                  | Browser-based, works anywhere |

---

## Current State

VaRiScout Lite is production-ready as a Progressive Web App (PWA). The following features are complete:

1. I-Chart with automatic control limit calculation (UCL/LCL)
2. Boxplot for factor comparison with linked filtering
3. Pareto analysis for frequency visualization
4. Process capability metrics (Cp/Cpk) with histogram
5. Probability plot for normality assessment
6. CSV/Excel import, manual entry, clipboard paste
7. Export to PNG, CSV, and .vrs project files
8. Offline-first PWA (~700KB gzipped)

---

## New Features Required

Only three additions are needed for complete Green Belt training coverage.

### Feature 1: ANOVA Integration with Boxplot

#### Concept

The existing boxplot already shows visual group comparison. Adding ANOVA calculations provides statistical confirmation beneath the visualization. Users do not need to know whether they are running a t-test or ANOVA — they simply ask "are these groups different?" and receive an answer.

**Mathematical note:** ANOVA with 2 groups is mathematically equivalent to a t-test (F = t², same p-value). There is no need for a separate t-test feature.

#### Implementation

1. Calculate group means, sample sizes, and standard deviations
2. Compute sum of squares between groups (SSB) and within groups (SSW)
3. Calculate F-ratio and p-value
4. Display results below boxplot with plain-language interpretation

#### Display Format

Below the boxplot visualization, show:

| Element                | Example                               |
| ---------------------- | ------------------------------------- |
| Group means            | Mean: 24.3 / 28.7 / 27.1              |
| Sample sizes           | n: 45 / 52 / 48                       |
| Statistical result     | Different? YES (p = 0.003)            |
| Plain-language insight | Shift A is fastest (24.3 min average) |

#### Effort Estimate

**Small** — Mathematics only, no new UI components required.

---

### Feature 2: Regression Tab

#### Concept

A new tab displaying up to four scatter plots simultaneously, each showing the relationship between the outcome variable (Y) and a different factor (X). This multi-chart view enables rapid factor screening — users instantly see which variables matter most.

#### Multi-Chart Layout

The tab displays a 2×2 grid of scatter plots. Each plot shows one X-Y relationship with regression line, R² value, p-value, and visual strength indicator (stars). A summary ranking appears below: "Temperature → Speed → Pressure → Humidity" ordered by R² strength.

#### Auto-Fit Intelligence

For each X-Y pair, the system automatically fits both linear and quadratic models. If quadratic R² exceeds linear R² by more than 0.05, the system recommends the curved fit and calculates the optimum point.

| Pattern Detected   | User Sees                            |
| ------------------ | ------------------------------------ |
| Linear positive    | "Higher X → higher Y"                |
| Linear negative    | "Higher X → lower Y"                 |
| Quadratic (peak)   | "There's an optimum at X = 165"      |
| Quadratic (valley) | "Avoid X around 120 — worst results" |
| No relationship    | "X doesn't affect Y"                 |

#### R² Interpretation Guide

| R² Value  | Plain Language             | Visual |
| --------- | -------------------------- | ------ |
| > 0.9     | Very strong relationship   | ★★★★★  |
| 0.7 – 0.9 | Strong relationship        | ★★★★   |
| 0.4 – 0.7 | Moderate relationship      | ★★★    |
| 0.2 – 0.4 | Weak relationship          | ★★     |
| < 0.2     | No meaningful relationship | ★      |

#### Implementation

1. User selects one Y (outcome) column and up to four X (factor) columns
2. System generates four scatter plots in 2×2 grid layout
3. Each plot fits linear model (y = ax + b) and quadratic model (y = ax² + bx + c)
4. System recommends better fit when quadratic significantly outperforms linear
5. For quadratic fits with peak/valley, calculate and display optimum X value
6. Display ranking summary ordered by R² strength

#### Interactions

- Click any chart to expand to full-screen with detailed statistics
- Drag to reorder X variables
- Toggle between linear-only and auto-fit modes
- Option to gray out non-significant relationships (p > 0.05)

#### Effort Estimate

**Medium** — New tab with 2×2 chart grid, regression calculations, and auto-fit logic.

---

### Feature 3: Gage R&R Tab

#### Concept

Measurement System Analysis (MSA) is non-negotiable in manufacturing training. This tab performs crossed Gage R&R analysis, showing how much variation comes from the measurement system versus the actual parts being measured.

#### Data Requirements

User provides three columns: Part ID, Operator ID, and Measurement value. Standard study design is 10 parts × 3 operators × 2-3 replicates.

#### Display Components

- **Variance breakdown bar chart:** Visual showing Part-to-Part %, Repeatability %, and Reproducibility %
- **%GRR result:** Combined Gage R&R percentage with verdict
- **Operator × Part interaction plot:** Shows measurement consistency across operators

#### %GRR Interpretation Guide

| %GRR      | Verdict      | Action                                     |
| --------- | ------------ | ------------------------------------------ |
| < 10%     | Excellent    | Measurement system approved                |
| 10% – 30% | Marginal     | May be acceptable depending on application |
| > 30%     | Unacceptable | Fix measurement system before proceeding   |

#### Implementation

1. User selects Part, Operator, and Measurement columns
2. Calculate variance components using ANOVA method
3. Compute Repeatability (within-operator variation)
4. Compute Reproducibility (between-operator variation)
5. Calculate %GRR = √(Repeatability² + Reproducibility²) / Total Variation
6. Display variance breakdown chart and plain-language verdict

#### Effort Estimate

**Medium** — New tab with variance calculations and interaction plotting.

---

## Development Summary

| Feature                             | Type        | Effort | Priority |
| ----------------------------------- | ----------- | ------ | -------- |
| ANOVA under Boxplot                 | Enhancement | Small  | High     |
| Regression Tab (4-chart + auto-fit) | New Tab     | Medium | High     |
| Gage R&R Tab                        | New Tab     | Medium | High     |

With these three additions, VaRiScout Lite provides complete Green Belt training coverage. The total scope is deliberately minimal — three features instead of fifty — because the goal is trainer adoption, not statistical completeness.

---

## Key Differentiators

These features are not available in Minitab:

- **Multi-chart regression comparison:** See four X-Y relationships simultaneously instead of running four separate analyses
- **Auto-fit intelligence:** System suggests quadratic when it's a better fit, calculates optimum point
- **Plain-language insights:** "Higher X → higher Y" instead of just showing coefficients
- **Zero installation:** Works in any browser, no IT department required
- **Visual strength indicators:** Star ratings make R² instantly readable for students

---

## Next Steps

1. Implement ANOVA calculations and integrate with existing Boxplot tab
2. Build Regression tab with 2×2 chart grid and auto-fit logic
3. Build Gage R&R tab with variance breakdown visualization
4. Test with sample training datasets
5. Pilot with ESTIEM training program

---

## Related Documentation

- [Specs.md](../../Specs.md) — Current feature specifications
- [POWER_BI_STRATEGY.md](POWER_BI_STRATEGY.md) — Power BI Custom Visual strategy
- [SUBSCRIPTION_LICENSING.md](SUBSCRIPTION_LICENSING.md) — Licensing and pricing
