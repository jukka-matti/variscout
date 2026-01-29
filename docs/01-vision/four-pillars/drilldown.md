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
┌─────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                          │
│                                                                         │
│ ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐ │
│ │ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │ │
│ └────────────────────┘  └────────────────────┘  └────────────────────┘ │
│                                                                         │
│ CUMULATIVE: 46% of total variation isolated                            │
│ "Fix this combination to address nearly half your quality problems"    │
└─────────────────────────────────────────────────────────────────────────┘
```

Each chip shows contribution % to TOTAL variation (not local η²).

---

## Cumulative Variation Tracking

!!! methodology "The Power of Filter Chips"
This is the killer insight of the entire methodology. Filter chips aren't just navigation — they show **contribution to TOTAL variation** that tells you exactly how much of your total problem you've isolated.

!!! warning "Important Terminology"
VariScout identifies **factors driving variation**, not "root causes." EDA shows _which_ factors explain variation — the _why_ requires further investigation (5 Whys, experimentation, Gemba walks). This distinction matters: we quantify contribution, not causation.

### The Math Behind Contribution %

Each filter's contribution % shows what portion of TOTAL variation it captures:

```
FILTER CHIP                  CONTRIBUTION TO TOTAL    MEANING
────────────────────────────────────────────────────────────────────────
[Shift: Night ▼ 67%]         67% of total             Night shift alone
[Machine: C ▼ 24%]           24% of total             Machine C within context
[Operator: Kim ▼ 9%]         9% of total              Kim within context

CUMULATIVE ISOLATION: ~46% of total variation in ONE condition
```

**The insight:** By applying three filters, you've isolated 46.5% of ALL your variation into ONE specific condition: Operator Kim on Machine C during Night Shift.

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

Level 1  [Shift: Night ▼ 67%]                 "It's shift-related"    ⚠️ Somewhat actionable
                                                                      "Look at shift practices"

Level 2  + [Machine: C ▼ 24%]                 "Night + Machine C"     ✓ Actionable
                                                                      "Investigate Machine C"

Level 3  + [Operator: Kim ▼ 9%]               "Kim on C at Night"     ✓✓ Highly actionable
                                                                      "Fix Machine C setup/maint"
```

---

## Reading Filter Chips

**Contribution % (shown in chip):**

> "Of TOTAL variation from ALL data, how much does this specific selection capture?"

Unlike local η² which shows variation at the current filtered level, contribution % always references the original dataset.

```
Example Filter Chips:
[Shift: Night ▼ 67%]  [Machine: C ▼ 24%]  [Operator: Kim ▼ 9%]
       ↑                    ↑                    ↑
       67% of TOTAL         24% of TOTAL         9% of TOTAL
       variation            variation            variation
```

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

> Filter chips: `[Shift: Night ▼ 67%] [Machine: C ▼ 24%] [Operator: Kim ▼ 9%]`
>
> Translation: "This combination explains 46% of all our quality variation. Fix this one combination and nearly half our problems disappear."

**Which one does the plant manager act on?**

---

## Implementation in VariScout UI

The filter chips should always show:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ACTIVE FILTERS                                                          │
│                                                                         │
│ ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐ │
│ │ Shift: Night ▼ 67% │  │ Machine: C ▼ 24%   │  │ Operator: Kim ▼ 9% │ │
│ └────────────────────┘  └────────────────────┘  └────────────────────┘ │
│                                                                         │
│ CUMULATIVE: 46% of total variation isolated                            │
│ "Fix this combination to address nearly half your quality problems"    │
│                                                                         │
│ [Clear All Filters]                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## See Also

- [Four Pillars Overview](index.md)
- [FLOW](flow.md) — Boxplot for factor comparison
