---
title: 'VariScout Methodology'
---

# VariScout Methodology

Single-page consolidation of VariScout's analytical approach — how the product is designed to think, and why.

---

## Philosophy

VariScout is **Exploratory Data Analysis (EDA) for process improvement** — not statistical verification.

The distinction matters in practice:

| Academic Statistician            | Process Improvement Practitioner |
| -------------------------------- | -------------------------------- |
| "Is this significant at p<0.05?" | "Where should I focus?"          |
| Hypothesis testing               | Pattern finding                  |
| Prove with math                  | See with eyes                    |
| Analysis as end goal             | Analysis as starting point       |

> VariScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it.

VariScout identifies **factors driving variation**, not root causes. EDA shows _which_ factors explain variation. The _why_ requires further investigation (5 Whys, experimentation, Gemba walks). This is intentional: we quantify contribution, not causation.

---

## Foundation: Watson's EDA

VariScout's analytical approach is grounded in Watson's Exploratory Data Analysis methodology (Turtiainen, 2019). Watson's EDA uses four standard quality tools, each asking a different analytical question:

| Tool                | Analytical Question             | Origin                      |
| ------------------- | ------------------------------- | --------------------------- |
| I-Chart             | What patterns exist over time?  | Shewhart (1924)             |
| Boxplot             | Where does variation come from? | Tukey (1977)                |
| Pareto Chart        | Where do problems concentrate?  | Juran (1950s)               |
| Capability Analysis | Does it meet customer specs?    | Motorola / Six Sigma (1986) |

The thesis places the I-Chart first in the sequence for practical reasons — time-series data often reveals the most immediate patterns. But this is not a rigid rule; Watson's EDA is iterative, not sequential. The analyst moves between tools as the data suggests.

### Supporting Tools

| Tool         | Origin         | How VariScout Uses It                                              |
| ------------ | -------------- | ------------------------------------------------------------------ |
| ANOVA        | Fisher (1920s) | Quantifies factor contribution (η²) for drill-down ranking         |
| Nelson Rules | Nelson (1984)  | 8 pattern rules for I-Chart; catches non-random signals beyond ±3σ |

---

## VariScout's Three Contributions

VariScout adds three original concepts on top of Watson's foundation:

### 1. Parallel Views

All four analytical tools are visible simultaneously on a single dashboard with **linked filtering**. Clicking "Machine B" in the Boxplot simultaneously updates the I-Chart (Machine B's timeline), Pareto (Machine B's failure modes), and Capability (Machine B's Cpk). The tools become a coordinated investigation team, not four independent displays.

This is how VariScout differs from sequential tool usage — the analyst sees every perspective at once.

### 2. Progressive Stratification

Progressive stratification converts a multidimensional variation problem into a sequential, one-factor-at-a-time investigation. This is analogous to **binary search in factor space**.

**The drill-down sequence:**

1. Look at which factor explains the most variation (Boxplot η² display)
2. Filter to the highest-impact level of that factor (click a box or bar)
3. See how the remaining factors redistribute in the filtered data
4. Repeat until an actionable condition is isolated

**Each step does two things simultaneously:**

- Reduces the problem space — fewer factors left to investigate
- Quantifies progress — the cumulative variation bar shows how much of total variation is now in scope

**Why contribution to total (not local η²).** If Night Shift accounts for 67% of total variation and Machine explains 36% of the Night Shift subset, the local η² is 36%. But the answer to "how much of my total problem does Machine explain?" is 24%. Contribution to total keeps the analyst anchored to the original question at every step.

**The endpoint** is specific and actionable: "Operator Kim on Machine C during Night Shift accounts for 46% of all variation" — not a vague recommendation.

### 3. Hypothesis Investigation

Once variation drivers are identified through drill-down, the investigation moves into structured root cause exploration. VariScout uses a **diamond pattern**:

| Phase          | Purpose                                       | Analyst Activity                                                                   |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Initial**    | Variation found, driver identified            | Pin finding; upfront hypothesis (from FRAME) or new observation becomes tree root  |
| **Diverging**  | Generate possible causes                      | Add sub-hypotheses — break the broad cause into testable theories. The tree grows. |
| **Validating** | Gather evidence                               | Test each theory — Data (ANOVA auto-validate), Gemba (go inspect), Expert input    |
| **Converging** | Build understanding, identify suspected cause | Prune contradicted branches; promote supported hypothesis as suspected root cause  |

The diamond is a **structured learning** process — a disciplined way to build understanding of the cause through multiple evidence types. It is not pure hypothesis testing; the three validation types (data, Gemba, expert) reflect that understanding comes from statistical evidence, physical observation, and domain knowledge alike. The exit is confidence-based: the analyst has sufficient understanding of the cause to move to improvement.

After the diamond converges, the investigation is complete. What follows — ideating improvements, selecting corrective actions, implementing, and verifying — belongs to the **IMPROVE** phase, which follows PDCA (Plan-Do-Check-Act). See [Analysis Journey Map § Phase 4: IMPROVE](../03-features/workflows/analysis-journey-map.md#phase-4-improve).

**Three validation types** reflect that not every hypothesis can be tested with data:

| Validation | When to Use                                    | How It Works                                                                |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Data       | Hypothesis links to a factor in the dataset    | ANOVA η² auto-sets status (≥15% supported, <5% contradicted, 5–15% partial) |
| Gemba      | Requires physical inspection on the shop floor | Define task, inspect, record findings, set status manually                  |
| Expert     | Requires domain knowledge beyond the data      | Consult expert, record assessment, set status manually                      |

---

## Two Voices

Every process has two voices speaking simultaneously:

| Voice                     | Expressed As             | Source                  |
| ------------------------- | ------------------------ | ----------------------- |
| **Voice of the Process**  | Control Limits (UCL/LCL) | Calculated from data    |
| **Voice of the Customer** | Spec Limits (USL/LSL)    | Defined by requirements |

These voices are **independent**. The process does not know what the customer wants. The customer does not know what the process can do.

**The goal:** control limits fit inside specification limits — then the process naturally produces what the customer needs, without inspection.

---

## Four Lenses (Teaching Shorthand)

The "Four Lenses" label is a pedagogical device — a memorable way to communicate that the same data looks different through each analytical tool. It maps directly to the four tools above:

| Lens        | Tool                 | Core Question                     |
| ----------- | -------------------- | --------------------------------- |
| **CHANGE**  | I-Chart              | "What's shifting over time?"      |
| **FLOW**    | Boxplot              | "Where does variation come from?" |
| **FAILURE** | Pareto               | "Where do problems cluster?"      |
| **VALUE**   | Capability Histogram | "Does it meet customer specs?"    |

The lens metaphor is useful for marketing and teaching, but the methodology works with standard tool names. VariScout's CoScout AI assistant uses tool names, not lens names.

---

## Key Principles

**Contribution, Not Causation.** ANOVA η² quantifies how much of the total variation a factor explains. It does not prove that factor causes the variation. Causation requires domain knowledge and further investigation.

**Iterative Exploration.** Each analysis cycle reveals new questions. A finding triggers a sub-hypothesis, which may need new data or a Gemba visit. The loop continues until the solution space is bounded.

**AI Augments, Never Replaces (Azure App only).** VariScout's statistical engine computes the conclusion. AI translates it into language and adds context — it does not generate competing statistics. The conclusion is reproducible and auditable. The PWA stays AI-free by design; the "guided frustration" pedagogy requires the analyst to do the thinking.

---

## What VariScout Is NOT

VariScout is intentionally not:

- A **hypothesis testing tool** — use Minitab, R, or JMP for p-value-based inference
- A **predictive modeling platform** — use Python/ML tools for forecasting
- A **DOE analysis system** — use JMP or specialized software for designed experiments
- A **statistical verification engine** — use academic tools for formal proof

VariScout is **the first step** — finding where to focus before investing in deeper analysis. The output of a VariScout session is a prioritized investigation target, not a statistical proof.

---

## See Also

- [Philosophy](philosophy.md) — EDA mindset, guided frustration pedagogy, AI philosophy
- [Four Lenses](four-lenses/index.md) — Detailed lens descriptions, system dynamics diagram
- [Two Voices](two-voices/index.md) — Control limits vs spec limits, four scenarios
- [Progressive Stratification](progressive-stratification.md) — Design rationale for filter chip drill-down, tensions, alternative patterns
- [Investigation to Action](../03-features/workflows/investigation-to-action.md) — Findings panel, What-If Simulator, full analyst workflow
- [Hypothesis Investigation](../03-features/workflows/hypothesis-investigation.md) — Diamond pattern, validation types, tree view
- [Mental Model Hierarchy](../05-technical/architecture/mental-model-hierarchy.md) — How all conceptual frameworks (journey, IDEOI, lenses, report steps) relate and nest
