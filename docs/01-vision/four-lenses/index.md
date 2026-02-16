# Watson's Four Lenses of Process Knowledge

> "VariScout doesn't just display charts — it gives you four lenses to see what averages hide."

---

## Why Lenses?

The Four Lenses are not sequential steps — they are **parallel lenses** on the same data. Each lens asks a fundamentally different question. Apply them in any order, combine them through drill-down, and the same dataset reveals different truths depending on which lens you look through.

Think of a detective examining a crime scene: the same evidence looks different under UV light, through a magnifying glass, or in a timeline reconstruction. VariScout's four charts work the same way — four lenses, one dataset, four kinds of insight.

---

## The Core Insight

VariScout's four core charts aren't random statistical outputs. Each chart directly maps to one of Watson's Four Lenses of Process Knowledge — each a distinct **lens** on your data:

| Chart                    | Lens        | Core Question                     |
| ------------------------ | ----------- | --------------------------------- |
| **I-Chart**              | **CHANGE**  | "What's shifting over time?"      |
| **Boxplot**              | **FLOW**    | "Where does variation come from?" |
| **Pareto**               | **FAILURE** | "Where do problems cluster?"      |
| **Capability Histogram** | **VALUE**   | "Does it meet customer specs?"    |

### Add-on: Regression (Correlation Check)

| Chart          | Purpose           | Core Question                                   |
| -------------- | ----------------- | ----------------------------------------------- |
| **Regression** | Correlation Check | "Is there even a relationship between X and Y?" |

!!! note
Regression in VariScout serves as a **first step** to visually check if correlation exists between two continuous variables. It answers "is there a relationship?" before investing in deeper predictive modeling. For most variation analysis, the Four Lenses are sufficient.

---

## The Four Lenses

<div class="grid cards" markdown>

- :material-chart-line:{ .lg .middle } **CHANGE lens**

  ***

  I-Chart reveals time-based stability. "Is something shifting over time?"

  [:octicons-arrow-right-24: Learn more](change.md)

- :material-chart-box:{ .lg .middle } **FLOW lens**

  ***

  Boxplot traces variation upstream. "Which inputs explain the output?"

  [:octicons-arrow-right-24: Learn more](flow.md)

- :material-chart-bar:{ .lg .middle } **FAILURE lens**

  ***

  Pareto finds where problems concentrate. "What matters most?"

  [:octicons-arrow-right-24: Learn more](failure.md)

- :material-chart-histogram:{ .lg .middle } **VALUE lens**

  ***

  Capability compares to customer specs. "Are we meeting needs?"
  A different type of question — VALUE brings in an external reference (customer specs) rather than analyzing internal process behavior.

  [:octicons-arrow-right-24: Learn more](value.md)

</div>

---

## The System Dynamics

The four lenses don't work in isolation — they're meshed gears:

```
        ┌─────────┐
        │ CHANGE  │ ← Dynamic factor: wear, shifts, seasons
        │(I-Chart)│
        └────┬────┘
             │
             ▼
┌─────────┐     ┌─────────┐
│  FLOW   │◄───►│ FAILURE │
│(Boxplot)│     │(Pareto) │
└────┬────┘     └────┬────┘
     │               │
     └───────┬───────┘
             │
             ▼
        ┌─────────┐
        │  VALUE  │ ← Drive gear: if undefined, nothing turns correctly
        │(Capable)│
        └─────────┘
```

**VariScout's Linked Filtering = Gear Meshing**

When you click on one chart, all others respond. This isn't just a UI feature — it's how the lenses interconnect:

| Action                       | System Response                                            |
| ---------------------------- | ---------------------------------------------------------- |
| Click "Machine B" in Boxplot | I-Chart shows only Machine B's timeline                    |
|                              | Pareto shows only Machine B's failure modes                |
|                              | Capability recalculates for Machine B alone                |
| Click "Above UCL" in I-Chart | Boxplot highlights which factors had out-of-control points |
|                              | Pareto shows defect types during unstable periods          |

---

## Progressive Analysis: Drill-Down

The lenses support progressive analysis through drill-down:

1. **Level 1:** All Data — identify top-level patterns
2. **Level 2:** Filter to dominant factor — zoom in
3. **Level 3:** Within filtered data, find next factor
4. **Continue** until actionable condition is isolated

[:octicons-arrow-right-24: Drill-Down Methodology](drilldown.md)

---

## Reference

Based on Watson's Four Lenses framework, the Sock Mystery experiential exercise, and the VariScout product design.
