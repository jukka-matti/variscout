---
title: 'VariScout Methodology'
audience: [business, analyst]
category: methodology
status: stable
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

## Methodology Hierarchy

VariScout now uses a nested methodology model:

| Layer                                | Job                                                                 |
| ------------------------------------ | ------------------------------------------------------------------- |
| **Process Hub**                      | Operating spine for process-owner cadence and team improvement      |
| **Process Measurement System**       | Designed measure, evidence, snapshot, trust, and cadence layer      |
| **Current Process State**            | Latest review of outcome, flow, known x-control, and trust measures |
| **Evidence Sources / Data Profiles** | Recurring hub evidence workflow and deterministic source adapters   |
| **Process learning levels**          | Outcome, flow, and local-mechanism levels of process understanding  |
| **Investigation journey**            | Reasoning loop from Current Process State to response               |
| **Response paths**                   | Quick action, focused investigation, charter, sustainment, handoff  |
| **Question-driven EDA**              | Reasoning spine that sharpens concern into Current Understanding    |
| **Survey**                           | Horizontal readiness check across phases and hub reviews            |
| **Signal Cards**                     | Signal-level trust records quoted by Survey, branches, and reports  |
| **Process moments**                  | Process-rational Cp/Cpk windows for verification and learning       |
| **Sustainment handoff**              | Decision on what stays in VariScout or moves to operational systems |

This is not a replacement for the original journey. Process Hub organizes the
work; the Process Measurement System defines what the process reviews and
trusts; Evidence Sources provide recurring Snapshots; Current Process State
shows what the process looks like now; investigations explain that state well
enough to choose a response path. Survey asks whether the current evidence is
ready for the next move.

The settled vocabulary is:

```text
VariScout = Process Learning System
Process Hub = operating home for one process
Process Measurement System = designed evidence/measure layer
Current Process State = process-owner review surface
Investigation = structured reasoning loop from state to response
Response Path = quick action / focused investigation / charter / sustain / handoff
CoScout = product assistant grounded in shared process context
```

Publicly, VariScout should promise a shared, evidence-backed process context
for teams. CoScout uses that context to explain, draft, and guide investigation
work. VariScout should not promise an open AI-agent platform or autonomous
process control.

### Process Learning Levels

VariScout should not treat analysis modes as the primary mental model. The
stronger frame is the Y / X / x three-level set of process understanding
(faithful to VariScout's existing EDA spine; see
`eda-mental-model.md` Section 5.2):

| Level                          | Question                                                         | Typical evidence                                             |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| **System / outcome**           | What result must the customer or business experience?            | CTS, Y, spec, target, Process Hub cadence, sustainment gaps  |
| **Flow / process model**       | What flows through which steps, at what rate, and where is loss? | CTQ per step, rate, cycle time, wait, throughput, bottleneck |
| **Local mechanism / evidence** | What physics, recipe, condition, or measurement issue explains?  | settings, material, equipment, subgroup, gemba, Signal Card  |

The FRAME process map is one important flow-level lens. It is not the whole
method. The full model links one-off datasets, investigations, recurring
Evidence Sources, Process Hub cadence, and sustainment/control handoff. See
[Process Learning Operating Model](../superpowers/specs/2026-04-27-process-learning-operating-model-design.md).

These levels generalize the older three-level EDA language:

| Investigation language | Process-learning language  |
| ---------------------- | -------------------------- |
| Y / problem condition  | System / outcome           |
| X / concentration      | Flow / process model       |
| x / local mechanism    | Local mechanism / evidence |

The FRAME workspace renders these levels as three visible bands — **Outcome**,
**Process Flow**, and **Operations** — stacked vertically with the river-styled
SIPOC inside the Process Flow band. The visual structure makes the methodology
visible by default. See the [Layered Process View design spec](../superpowers/specs/2026-04-27-layered-process-view-design.md) for band semantics, surface variations, and phasing.

### Current Process State

Current Process State is not a simple "stable or not stable" label. It is the
latest structured read of the process across outcome, flow, known x-control,
capability structure, and trust:

- **Cpk vs target Cpk** shows whether current performance is good enough.
- **Cp-Cpk gap** shows centering loss.
- **Cp/Cpk over subgroups or snapshots** shows how capability itself is moving.
- **flow and wait measures** show whether the process is moving as expected.
- **known x-control measures** show whether confirmed drivers are still inside
  expected windows.
- **sample size, power, subgroup, and MSA signals** protect the team from
  overclaiming.

Current Process State can trigger quick team action, focused investigation,
chartered improvement, sustainment review, or control handoff.

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

### Observed vs Expected — the mathematical spine

The deterministic stats engine's authority comes from one unifying principle:
**every statistical instrument compares observed values to expected values
under a model.** Chi-square asks whether observed counts match expected
proportions. ANOVA decomposes total variation into observed-between-groups
versus expected-within-groups noise. Linear regression fits a model and
measures observed minus predicted residuals. Cp/Cpk compares observed
process spread to the expected window from specs.

This means instrument choice is not a personality test — it is a question
of which observed-vs-expected comparison best matches the analytical
question:

- "Does the distribution match a hypothesized shape?" → chi-square / Anderson-Darling
- "Does this factor contribute to variation?" → ANOVA / regression η²
- "Does the process meet specs?" → Cp/Cpk against the spec window
- "Does the time series show non-random structure?" → Nelson rules against expected ±3σ

Each instrument is a different observed-vs-expected pairing. CoScout
coaching uses this principle when explaining why a particular mode or
test fits the current question.

---

## VariScout's Four Contributions

VariScout adds four original concepts on top of Watson's foundation:

### 1. Coordinated Views

VariScout keeps the analytical tools in one coordinated dashboard with **linked filtering**, but the normal laptop view no longer requires four equal tiles at once. The I-Chart stays visible, the subgroup panel supports drill-down, and the adaptive lens gives access to Probability, Distribution/Capability, and Pareto when it is meaningful. Clicking "Machine B" in the Boxplot still updates the other relevant lenses immediately.

This is how VariScout differs from sequential tool usage — the analyst can move through every perspective without leaving the shared analysis context.

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

### 3. Question-Driven Investigation

Once variation drivers are identified through drill-down, the investigation moves into structured exploration. VariScout uses a **question-driven** approach grounded in Turtiainen's EDA Mental Model (2019) — where questions come first, and evidence answers them.

#### Issue Statement vs. Problem Statement

A critical distinction underpins the investigation flow:

- **Issue Statement** (the input): A vague concern that initiates the investigation. Example: _"Fill weight on line 3 seems too variable."_ Watson (2019a) defines an issue as a concern arising from a gap between customer expectation and observation.
- **Problem Statement** (the output): A precise declaration answering Watson's three questions: (1) What measure needs to change? (2) How should it change? (3) What is the scope? Example: _"Reduce fill weight variation on line 3, night shift, heads 5-8, from Cpk 0.62 to target Cpk 1.33."_

The gap between the two is the entire EDA journey. Every question asked and answered in VariScout exists to close this gap.

#### Question Generation

Questions are generated from two complementary sources:

1. **Factor Intelligence** (deterministic, always available) — R²adj ranking from Best Subsets analysis generates evidence-ranked questions automatically. Factors with R²adj < 5% are auto-answered as "ruled out" — negative learnings captured without analyst effort. Follow-up questions emerge as earlier questions are answered (Layer 2 main effects, Layer 3 interactions).

2. **CoScout** (AI layer, Azure only) — generates additional questions from the issue statement text, upfront hypotheses in the Analysis Brief, factor role detection, and data patterns. These complement the statistical questions with contextual questions that the numbers alone cannot generate.

#### The Diamond Pattern

Investigation follows the same **diamond pattern** as before, reframed around questions:

| Phase          | Purpose                                                 | Analyst Activity                                                                           |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Initial**    | Variation found, questions generated                    | Factor Intelligence generates ranked questions; analyst reviews the question checklist     |
| **Diverging**  | Explore possible causes                                 | Answer questions, spawn follow-up questions — the question tree grows                      |
| **Validating** | Gather evidence                                         | Answer each question — Data (ANOVA auto-validate), Gemba (go inspect), Expert input        |
| **Converging** | Build understanding, identify multiple suspected causes | Mark suspected causes (multiple allowed); formulate the Problem Statement from the answers |

The diamond is a **structured learning** process — a disciplined way to build understanding through multiple evidence types. It is not pure hypothesis testing; the three validation types (data, Gemba, expert) reflect that understanding comes from statistical evidence, physical observation, and domain knowledge alike. The exit is when enough questions are answered to formulate a Problem Statement with suspected causes.

**Multiple suspected causes** are the natural outcome of real investigations. When a process has multiple independent sources of variation, forcing a single root cause oversimplifies the problem. Each suspected cause becomes an improvement target in the IMPROVE phase. Ruled-out factors are preserved as negative learnings (essential for audit trails and preventing re-investigation of dead ends).

After the diamond converges, the investigation is complete. What follows — ideating improvements, selecting corrective actions, implementing, and verifying — belongs to the **IMPROVE** phase, which follows PDCA (Plan-Do-Check-Act). See [Analysis Journey Map § Phase 4: IMPROVE](../03-features/workflows/analysis-journey-map.md#phase-4-improve).

**Three validation types** reflect that not every question can be answered with data:

| Validation | When to Use                                    | How It Works                                                                |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Data       | Question links to a factor in the dataset      | ANOVA η² auto-sets status (≥15% supported, <5% contradicted, 5–15% partial) |
| Gemba      | Requires physical inspection on the shop floor | Define task, inspect, record findings, set status manually                  |
| Expert     | Requires domain knowledge beyond the data      | Consult expert, record assessment, set status manually                      |

For the full methodology behind this approach, see [EDA Mental Model](eda-mental-model.md).

### 4. Survey Readiness Evaluation

Survey is the cross-phase evaluator that asks:

```text
What can I do with this evidence, what would I miss, and what should I collect or check next?
```

Survey is not a fifth phase and not a standalone statistical mode. It is a
readiness check that can run in FRAME, SCOUT, INVESTIGATE, IMPROVE, REPORT, and
Process Hub cadence reviews.

| Context     | Survey evaluates                                                                 |
| ----------- | -------------------------------------------------------------------------------- |
| FRAME       | Data affordance, missing columns, process-map gaps                               |
| SCOUT       | Available analysis modes and practical next checks                               |
| INVESTIGATE | Branch trust, power, counter-checks, and blind spots                             |
| IMPROVE     | Verification data and before/after evidence readiness                            |
| REPORT      | Whether claims are backed by signals and branches                                |
| Process Hub | Which investigations are ready to act, verify, sustain, or collect more evidence |

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

### Analysis Modes

Beyond the standard four-tool view, VariScout supports alternative analysis
modes that reconfigure the dashboard for specific process questions:

- **Performance Mode** — Multi-channel Cpk comparison for wide-format data (fill heads, cavities, nozzles)
- **Yamazumi Mode** — Lean time study with stacked activity bars and cycle time decomposition
- **Capability Mode** — Per-subgroup Cp/Cpk stability analysis on the I-Chart, answering "Are we meeting our Cpk target?" Analysts switch freely between standard and capability views at any drill level. Time-based subgrouping uses extracted time columns from FRAME. See [Analysis Flow](../03-features/workflows/analysis-flow.md) for how these modes interleave through the full journey.

The user-facing question should be "what level of process understanding are we
working on?" before it becomes "which mode?" Each mode reuses the same chart
infrastructure with different data pipelines and interpretation context. See
[Subgroup Capability Analysis](../03-features/analysis/subgroup-capability.md)
for the capability mode details.

---

## Key Principles

**Contribution, Not Causation.** ANOVA η² quantifies how much of the total variation a factor explains. It does not prove that factor causes the variation. Causation requires domain knowledge and further investigation.

**Iterative Exploration.** Each analysis cycle reveals new questions. A finding answers a question and may spawn follow-up questions, which may need new data or a Gemba visit. The loop continues until the solution space is bounded.

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

- [EDA Mental Model](eda-mental-model.md) — Full question-driven methodology grounded in Turtiainen (2019)
- [Philosophy](philosophy.md) — EDA mindset, guided frustration pedagogy, AI philosophy
- [Four Lenses](four-lenses/index.md) — Detailed lens descriptions, system dynamics diagram
- [Two Voices](two-voices/index.md) — Control limits vs spec limits, four scenarios
- [Progressive Stratification](progressive-stratification.md) — Design rationale for filter chip drill-down, tensions, alternative patterns
- [Investigation to Action](../03-features/workflows/investigation-to-action.md) — Findings panel, What-If Simulator, full analyst workflow
- [Question-Driven Investigation](../03-features/workflows/question-driven-investigation.md) — Diamond pattern, validation types, tree view
- [Mental Model Hierarchy](../05-technical/architecture/mental-model-hierarchy.md) — How all conceptual frameworks (journey, investigation diamond, lenses, report steps) relate and nest
