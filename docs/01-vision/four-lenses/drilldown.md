---
title: 'Drill-Down: Progressive Variation Analysis'
---

# Drill-Down: Progressive Variation Analysis

The drill-down methodology is the heart of VariScout's approach to finding where variation hides.

---

## The Drill-Down Logic

### Decision Thresholds

| Variation % | Action                                   |
| ----------- | ---------------------------------------- |
| **>50%**    | Auto-drill — this is the primary driver  |
| **>80%**    | Strong focus — highly concentrated issue |
| **30-50%**  | Recommend investigating, ask user        |
| **<30%**    | Multiple factors — check interactions    |

### Example Drill-Down Journey

```
LEVEL 1: ALL DATA
━━━━━━━━━━━━━━━━━
I-Chart: Shows instability
Boxplot: Compare Shift/Machine/Operator
Finding: SHIFT explains 67% of variation
Action: Drill into SHIFT
↓
LEVEL 2: WITHIN SHIFT
━━━━━━━━━━━━━━━━━━━━━
I-Chart: Shows only Night Shift timeline
Boxplot: Compare Machines within Night Shift
Finding: Night Shift = 89% of shift variation
Action: Drill into Night Shift
↓
LEVEL 3: WITHIN NIGHT SHIFT
━━━━━━━━━━━━━━━━━━━━━━━━━━━
I-Chart: Shows only Night Shift + Machine C
Boxplot: Compare Operators on Machine C at Night
Finding: Machine C = 78% of Night Shift variation
Action: Primary driver identified — investigate Machine C conditions
```

### Filter Chips UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                               │
│                                                                              │
│ ┌──────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│ │ Shift: Night ▼ n=240     │  │ Machine: C ▼ n=80     │  │ Op.: Kim ▼ n=40│ │
│ └──────────────────────────┘  └───────────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Each chip shows `n=X` — the sample count for the selected filter values. η² is shown in the ANOVA stats panel.

---

## Cumulative Variation Tracking

:::note[The Power of Filter Chips]
This is the killer insight of the entire methodology. Filter chips aren't just navigation — they show **contribution to TOTAL variation** that tells you exactly how much of your total problem you've isolated.
:::

:::caution[Important Terminology]
VariScout identifies **factors driving variation**, not "root causes." EDA shows _which_ factors explain variation — the _why_ requires further investigation (5 Whys, experimentation, Gemba walks). This distinction matters: we quantify contribution, not causation.
:::

### The Math Behind η²

Each factor's η² (eta-squared) shows the proportion of total variation explained by that factor at the current analysis level. It is computed from the ANOVA decomposition:

```
η² = SS_between / SS_total
```

Where `SS_between` is the sum of squares explained by the factor and `SS_total` is the total sum of squares. η² ranges from 0 to 1 (shown as 0–100%).

```
FILTER CHIP                    η²      MEANING
──────────────────────────────────────────────────────────────────────
[Shift: Night ▼ n=240]         0.67    Shift explains 67% of variation
[Machine: C ▼ n=80]            0.24    Machine C explains 24% within context
[Operator: Kim ▼ n=40]         0.09    Operator explains 9% within context
```

**The insight:** By applying three filters, you've isolated a specific condition (Operator Kim on Machine C during Night Shift) that cumulatively accounts for a large share of your process variation.

---

## Why This Changes Everything

| Traditional Approach                | VariScout Filter Chip Approach                    |
| ----------------------------------- | ------------------------------------------------- |
| "Our Cp is 0.4, process is chaotic" | "46% of variation = Machine C on Nights"          |
| "We need to improve quality"        | "Fix this ONE combination = half the problem"     |
| Scatter resources across everything | Laser focus on highest-impact target              |
| Months of unfocused effort          | Days to targeted solution                         |
| "Quality is everyone's job"         | "Machine C Night Shift team: here's your mission" |

---

## The Actionability Hierarchy

As you add more filters, actionability increases:

```
DEPTH    FILTER CHIPS                         FINDING                 ACTIONABILITY
──────────────────────────────────────────────────────────────────────────────────────
Level 0  (no filters)                         "We have variation"     ❌ Not actionable
                                                                      "Improve everything"

Level 1  [Shift: Night ▼ n=240]               "It's shift-related"    ⚠️ Somewhat actionable
                                                                      "Look at shift practices"

Level 2  + [Machine: C ▼ n=80]                "Night + Machine C"     ✓ Actionable
                                                                      "Investigate Machine C"

Level 3  + [Operator: Kim ▼ n=40]             "Kim on C at Night"     ✓✓ Highly actionable
                                                                      "Fix Machine C setup/maint"
```

---

## Reading Filter Chips

Filter chips show `n=X` — the number of rows matching the active filter selection. ANOVA η² is shown in the stats panel and ANOVA results area, not in the chip label.

```
Example Filter Chips:
[Shift: Night ▼ n=240]  [Machine: C ▼ n=80]  [Operator: Kim ▼ n=40]
         ↑                      ↑                      ↑
    240 matching rows       80 matching rows       40 matching rows
```

The ANOVA panel shows η² for each factor, quantifying how much of the variation is explained at each drill level.

---

## Multi-Select Capability

Filter chips support selecting multiple values within a factor:

```
┌────────────────────────┐
│ Machine: A, C ▼ 45%    │  ← Two machines selected
└────────────────────────┘

Clicking the dropdown reveals:
┌─────────────────────────┐
│ Machine                 │
├─────────────────────────┤
│ ☑ A             23%    │
│ ☐ B             10%    │
│ ☑ C             22%    │
│ ☐ D             12%    │
├─────────────────────────┤
│ [Remove Filter]         │
└─────────────────────────┘
```

This allows comparing specific combinations without losing context.

---

## The "Half Your Problem" Threshold

A practical rule of thumb:

| Cumulative % | Interpretation                        | Action                            |
| ------------ | ------------------------------------- | --------------------------------- |
| **>50%**     | "More than half your problem is HERE" | Strong case for immediate action  |
| **30-50%**   | "Significant chunk isolated"          | Worth focused improvement project |
| **<30%**     | "One of several contributors"         | Address after bigger factors      |

In our example, 46.5% means: **"Fix Machine C on Night Shift and nearly half your quality problems disappear."**

---

## Visual: The Variation Funnel

```
                    ALL VARIATION (100%)
                 ┌─────────────────────────┐
                 │░░░░░░░░░░░░░░░░░░░░░░░░░│
                 │░░░░░░░░░░░░░░░░░░░░░░░░░│
                 └───────────┬─────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    SHIFT (67%)                          Other (33%)
    ┌─────────────┐                      ┌─────────┐
    │█████████████│                      │░░░░░░░░░│
    │█████████████│                      └─────────┘
    └──────┬──────┘                      (park this)
           │
    ┌──────┴──────┐
    │             │
NIGHT (89%)    Day (11%)
┌─────────┐    ┌───┐
│█████████│    │░░░│
│█████████│    └───┘
└────┬────┘
     │
┌────┴────┐
│         │
MACH C   Others
(78%)    (22%)
┌─────┐  ┌──┐
│█████│  │░░│
└─────┘  └──┘
   │
   ▼
46.5% OF TOTAL
VARIATION ISOLATED
TO ONE CONDITION
```

---

## Practical Example: Cost of Inaction vs Action

**Scenario:** Production line with 10,000 units/month, 8% defect rate = 800 defects/month

| Approach                          | Defects Addressed       | Effort                     | ROI            |
| --------------------------------- | ----------------------- | -------------------------- | -------------- |
| "Improve everything"              | 800 (theoretically)     | High, scattered            | Low - no focus |
| Fix Machine C Nights (46.5%)      | ~372 defects eliminated | Focused, measurable        | **High**       |
| Then fix remaining Shift (20.5%)  | +164 more               | Next project               | Compounding    |
| **Total from 2 focused projects** | **536 defects (67%)**   | **Sequential, manageable** | **Maximum**    |

---

## Filter Chips as Communication Tool

**Before (traditional):**

> "ANOVA shows statistically significant differences between shifts (p<0.001) with eta-squared of 0.67, and within the night shift subset, machine effects show F(2,267)=45.3..."

**After (VariScout filter chips):**

> Filter chips: `[Shift: Night ▼ n=240] [Machine: C ▼ n=80] [Operator: Kim ▼ n=40]`
>
> ANOVA panel: Shift η²=0.67, Machine η²=0.24, Operator η²=0.09
>
> Translation: "This combination accounts for a large share of your quality variation. Fix this one combination and nearly half your problems disappear."

**Which one does the plant manager act on?**

---

## Implementation in VariScout UI

The filter chips should always show:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                               │
│                                                                              │
│ ┌──────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│ │ Shift: Night ▼ n=240     │  │ Machine: C ▼ n=80     │  │ Op.: Kim ▼ n=40│ │
│ └──────────────────────────┘  └───────────────────────┘  └────────────────┘ │
│                                                                              │
│ [Clear All Filters]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## See Also

- [Four Lenses Overview](index.md)
- [FLOW](flow.md) — Boxplot for factor comparison
