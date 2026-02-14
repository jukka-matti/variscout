# Vision & Methodology

VariScout is built on a philosophy of **EDA for process improvement** — not statistical verification.

---

## The Philosophy

| Academic Statistician            | Process Improvement Practitioner |
| -------------------------------- | -------------------------------- |
| "Is this significant at p<0.05?" | "Where should I focus?"          |
| Hypothesis testing               | Pattern finding                  |
| Prove with math                  | See with eyes                    |
| Statistical correctness          | Directional guidance             |
| Analysis as end goal             | Analysis as starting point       |

**The goal:**

- Find where to focus
- See where to apply Lean thinking
- Guide improvement effort
- Move fast, iterate, improve

**The key insight:**

> VaRiScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it.

**The promise:**

> 46% of your variation may be hiding in one place. Find it. Fix it. Check it. Continue.

---

## Core Frameworks

### Watson's Four Pillars — Four Lenses on Variation

Watson's Four Pillars of Process Knowledge give you four distinct **lenses** — each revealing a different dimension of your process:

| Chart                    | Lens        | What You See Through It           |
| ------------------------ | ----------- | --------------------------------- |
| **I-Chart**              | **CHANGE**  | "What's shifting over time?"      |
| **Boxplot**              | **FLOW**    | "Where does variation come from?" |
| **Pareto**               | **FAILURE** | "Where do problems cluster?"      |
| **Capability Histogram** | **VALUE**   | "Does it meet customer specs?"    |

No single lens tells the full story — you need all four to see clearly.

[:octicons-arrow-right-24: Four Pillars](four-pillars/index.md)

### Two Voices

Every process has two voices speaking at the same time:

| Voice                     | What It Says                      | Expressed As                   |
| ------------------------- | --------------------------------- | ------------------------------ |
| **Voice of the Process**  | "This is what I actually produce" | Control Limits (UCL/LCL)       |
| **Voice of the Customer** | "This is what I need"             | Specification Limits (USL/LSL) |

The critical insight: These two voices are independent. The process doesn't know what the customer wants. The customer doesn't know what the process can do.

[:octicons-arrow-right-24: Two Voices](two-voices/index.md)

### Progressive Stratification

The conceptual bridge between VariScout's UI design and its statistical methodology. Why filter chips with contribution percentages, why one-factor-at-a-time drilling, and where the current design may be insufficient.

[:octicons-arrow-right-24: Progressive Stratification](progressive-stratification.md)

### Design Evaluations

Product strategy evaluations for the 6 design tensions and 7 alternative patterns identified in Progressive Stratification. Each evaluation assesses fit against VariScout's philosophy, personas, and competitive positioning to inform roadmap decisions.

[:octicons-arrow-right-24: Evaluations](evaluations/index.md)

---

## Target Audience

VariScout is designed for practitioners who need to **find and act on variation sources quickly**:

| Role                    | Primary Need                          | How VariScout Helps                   |
| ----------------------- | ------------------------------------- | ------------------------------------- |
| **Fresh Green Belts**   | Apply LSS training to real data       | Guided methodology, no Minitab needed |
| **Operations Managers** | Quick answers, clear actions          | Breadcrumb trail, cumulative %        |
| **Supervisors**         | Identify which shift/machine/operator | Boxplot + linked filtering            |
| **Quality Teams**       | Capability reporting, spec compliance | Cp/Cpk, pass/fail %                   |
| **OpEx Teams**          | Prioritize improvement projects       | Pareto, variation contribution %      |

**What they DON'T need (initially):**

- Complex predictive models
- Response surface methodology
- DOE analysis software

**What they DO need:**

- "Where is the variation coming from?" → Boxplot
- "Is it stable over time?" → I-Chart
- "What defects matter most?" → Pareto
- "Are we meeting specs?" → Capability
- "Is there a relationship?" → Regression (add-on)

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

**Linked Filtering = Gear Meshing**

When you click on one chart, all others respond. This isn't just a UI feature — it's how the lenses interconnect.

---

## References

Based on:

- Watson's Four Pillars of Process Knowledge
- The Sock Mystery experiential exercise
- ITC Quality Control principles
- Shewhart's foundational work on control charts
- Wheeler's "Understanding Variation"
