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

## Four Lenses

The four core charts are **parallel lenses** on the same data. They are not sequential steps — apply them in any order. Each asks a fundamentally different question:

| Lens        | Chart                | Core Question                     |
| ----------- | -------------------- | --------------------------------- |
| **CHANGE**  | I-Chart              | "What's shifting over time?"      |
| **FLOW**    | Boxplot              | "Where does variation come from?" |
| **FAILURE** | Pareto               | "Where do problems cluster?"      |
| **VALUE**   | Capability Histogram | "Does it meet customer specs?"    |

The first three lenses (CHANGE, FLOW, FAILURE) analyze **internal process behavior**. VALUE is a different type of question — it brings in an external reference (customer specifications) to ask "does it actually matter?"

**Linked filtering connects all four.** Clicking "Machine B" in the Boxplot simultaneously updates the I-Chart (Machine B's timeline), Pareto (Machine B's failure modes), and Capability (Machine B's Cpk). The lenses become a coordinated investigation team, not four independent displays.

---

## Two Voices

Every process has two voices speaking simultaneously:

| Voice                     | Expressed As             | Source                  | VariScout Lens |
| ------------------------- | ------------------------ | ----------------------- | -------------- |
| **Voice of the Process**  | Control Limits (UCL/LCL) | Calculated from data    | CHANGE         |
| **Voice of the Customer** | Spec Limits (USL/LSL)    | Defined by requirements | VALUE          |

These voices are **independent**. The process does not know what the customer wants. The customer does not know what the process can do.

**The goal:** control limits fit inside specification limits — then the process naturally produces what the customer needs, without inspection.

**The critical sequence:**

1. **Stability first** — check the I-Chart for control violations. If the process is unstable, capability numbers are meaningless.
2. **Capability second** — once stable, compare the process voice to the customer voice. Cpk < 1.0 means fundamental process change is needed.

Reversing this order means chasing numbers without understanding the process.

---

## Progressive Stratification

Progressive stratification converts a multidimensional variation problem into a sequential, one-factor-at-a-time investigation. This is analogous to **binary search in factor space**.

**The drill-down sequence:**

1. Look at which factor explains the most variation (Boxplot eta-squared display)
2. Filter to the highest-impact level of that factor (click a box or bar)
3. See how the remaining factors redistribute in the filtered data
4. Repeat until an actionable condition is isolated

**Each step does two things simultaneously:**

- Reduces the problem space — fewer factors left to investigate
- Quantifies progress — the cumulative variation bar shows how much of total variation is now in scope

**Why contribution to total (not local eta-squared).** If Night Shift accounts for 67% of total variation and Machine explains 36% of the Night Shift subset, the local eta-squared is 36%. But the answer to "how much of my total problem does Machine explain?" is 24%. Contribution to total keeps the analyst anchored to the original question at every step.

**The endpoint** is specific and actionable: "Operator Kim on Machine C during Night Shift accounts for 46% of all variation" — not a vague recommendation.

---

## Investigation Workflow

Once variation drivers are identified through drill-down, the investigation moves into structured root cause exploration. VariScout uses a **diamond pattern**:

| Phase          | Purpose                                           | Analyst Activity                                          |
| -------------- | ------------------------------------------------- | --------------------------------------------------------- |
| **Initial**    | Variation found, driver identified                | Pin finding from filter breadcrumb or chart annotation    |
| **Diverging**  | Generate possible causes                          | Add sub-hypotheses — break the broad cause into theories  |
| **Validating** | Test each theory                                  | Data (ANOVA auto-validate), Gemba (go inspect), Expert    |
| **Converging** | Eliminate contradicted theories, confirm the rest | Mark supported/partial/contradicted; prune dead branches  |
| **Acting**     | Define improvements                               | Attach What-If projections; assign actions with due dates |
| **Resolved**   | Outcome verified                                  | Record Cpk after, mark outcome effective/partial/no       |

**Three validation types** reflect that not every hypothesis can be tested with data:

| Validation | When to Use                                    | How It Works                                                                          |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Data       | Hypothesis links to a factor in the dataset    | ANOVA eta-squared auto-sets status (>=15% supported, <5% contradicted, 5–15% partial) |
| Gemba      | Requires physical inspection on the shop floor | Define task, inspect, record findings, set status manually                            |
| Expert     | Requires domain knowledge beyond the data      | Consult expert, record assessment, set status manually                                |

---

## Key Principles

**Stability Before Capability.** Capability indices (Cp, Cpk) computed on an unstable process are not meaningful. The I-Chart check is always first.

**Contribution, Not Causation.** ANOVA eta-squared quantifies how much of the total variation a factor explains. It does not prove that factor causes the variation. Causation requires domain knowledge and further investigation.

**AI Augments, Never Replaces (Azure App only).** VariScout's statistical engine computes the conclusion. AI translates it into language and adds context — it does not generate competing statistics. The conclusion is reproducible and auditable. The PWA stays AI-free by design; the "guided frustration" pedagogy requires the analyst to do the thinking.

---

## Quality Tools Used

| Tool               | Origin                      | How VariScout Uses It                                                    |
| ------------------ | --------------------------- | ------------------------------------------------------------------------ |
| I-Chart            | Shewhart (1924)             | Time-series stability check; UCL/LCL from 3σ; CHANGE lens                |
| Boxplot            | Tukey (1977)                | Factor-by-factor variation comparison; eta-squared from ANOVA; FLOW lens |
| Pareto Chart       | Juran (1950s)               | Category failure concentration; 80/20 focus; FAILURE lens                |
| Capability Indices | Motorola / Six Sigma (1986) | Cp/Cpk vs USL/LSL; VALUE lens; requires stability first                  |
| ANOVA              | Fisher (1920s)              | Quantifies factor contribution (eta-squared) for drill-down ranking      |
| Nelson Rules       | Nelson (1984)               | 8 pattern rules for I-Chart; catches non-random signals beyond ±3σ       |

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
