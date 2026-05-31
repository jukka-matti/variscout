---
tier: stable
purpose: orient
title: 'VariScout Methodology'
audience: human
category: methodology
status: active
layer: L1
---

# VariScout Methodology

> **Canonical product vision lives at [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](../archive/specs/2026-05-03-variscout-vision-design.md).** This methodology document remains as a longer narrative companion; the vision spec's §2 (Methodology spine) is the authoritative summary. Where the two diverge, the vision spec wins. Reconciliation is a follow-up edit (see vision spec §6).
>
> **Canonical terminology lives at [`docs/glossary.md`](../glossary.md).** This methodology narrative cross-references the glossary rather than re-defining terms. The glossary is the home for canvas vocabulary (step / sub-step / column / input / output / outcome) and for the retired-terms list (tributary / CTS / FRAME / Analysis tab / etc) per Q10 of the 2026-05-03 vision §8 resolution.

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

> VariScout finds WHERE to focus — the scope (outcome + conditions). Suspected causes (WHY) nest within that scope and are carried by Hypotheses.

VariScout identifies **factors contributing to variation**, not causes in a strict sense. EDA shows _which_ factors explain variation. Suspected causes (mechanisms) require further investigation (Gemba walks, expert input, disconfirmation). This is intentional: we quantify contribution, not causation.

---

## Methodology Hierarchy

VariScout now uses a nested methodology model:

| Layer                                | Job                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Process Hub**                      | Operating spine for process-owner cadence and team improvement                               |
| **Process Measurement System**       | Designed measure, evidence, snapshot, trust, and cadence layer                               |
| **Current Process State**            | Latest review of outcome, flow, known x-control, and trust measures                          |
| **Evidence Sources / Data Profiles** | Recurring hub evidence workflow and deterministic source adapters                            |
| **Process learning levels**          | Outcome, flow, and local-mechanism levels of process understanding                           |
| **Investigation journey**            | Reasoning loop from Current Process State to response                                        |
| **Response paths**                   | Quick action, focused investigation, charter, sustainment, handoff                           |
| **Scope-first investigation**        | Drill to a `ProblemStatementScope` (WHERE), then collect `Hypothesis` causes (WHY) within it |
| **Survey**                           | Horizontal readiness check across phases and hub reviews                                     |
| **Signal Cards**                     | Signal-level trust records quoted by Survey, branches, and reports                           |
| **Process moments**                  | Process-rational Cp/Cpk windows for verification and learning                                |
| **Sustainment handoff**              | Decision on what stays in VariScout or moves to operational systems                          |

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
ProblemStatementScope = the WHERE (outcome + {factor=level} predicates; first-class persisted type)
Hypothesis = a suspected cause (the WHY) nested within a scope
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
[VariScout Product Vision](../archive/specs/2026-05-03-variscout-vision-design.md) (supersedes the 2026-04-27 operating-model spec, now archived).

These levels generalize the older three-level EDA language:

| Investigation language | Process-learning language  |
| ---------------------- | -------------------------- |
| Y / problem condition  | System / outcome           |
| X / concentration      | Flow / process model       |
| x / local mechanism    | Local mechanism / evidence |

The FRAME workspace renders these levels as three visible bands — **Outcome**,
**Process Flow**, and **Operations** — stacked vertically with the river-styled
SIPOC inside the Process Flow band. The visual structure makes the methodology
visible by default. See the [Layered Process View design spec](../archive/specs/2026-04-27-layered-process-view-design.md) for band semantics, surface variations, and phasing.

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

### 3. Scope-First Investigation

Once variation drivers are identified through drill-down, the investigation moves into structured exploration. VariScout uses a **scope-first** approach grounded in Turtiainen's EDA Mental Model (2019) — drill to a specific condition (the WHERE), then collect suspected causes (the WHY) within that scope.

#### Issue Statement vs. Problem Statement

A critical distinction underpins the investigation flow:

- **Issue Statement** (the input): A vague concern that initiates the investigation. Example: _"Fill weight on line 3 seems too variable."_ Watson (2019a) defines an issue as a concern arising from a gap between customer expectation and observation.
- **Problem Statement** (the output): A precise declaration answering Watson's three questions: (1) What measure needs to change? (2) How should it change? (3) What is the scope? Example: _"Reduce fill weight variation on line 3, night shift, heads 5-8, from Cpk 0.62 to target Cpk 1.33."_

**The scope is first-class.** The "where does this happen?" dimension is captured as a `ProblemStatementScope` — an outcome (Y) plus a set of `{factor=level}` predicates — not merely a filter chip. Suspected causes (Hypotheses) nest within a scope; a scope's WHERE and its nested WHY (mechanism hypotheses) are always kept strictly separate. **Temporal scope** is further captured by a **timeline window** on the investigation — fixed, rolling, open-ended, or cumulative — that travels with every chart and Finding. See [Timeline Windows in Investigations](../03-features/analysis/timeline-window-investigations.md) and [ADR-085](../07-decisions/adr-085-drop-question-problem-statement-scope.md).

The gap between the two is the entire EDA journey. Every drill and hypothesis tested in VariScout exists to close this gap.

#### Factor Intelligence as the Exploration Engine

Factor exploration is driven from two complementary sources:

1. **Factor Intelligence** (deterministic, always available) — R²adj ranking from Best Subsets analysis surfaces evidence-ranked factor nodes automatically. Factors with R²adj < 5% are flagged as "examined, no contribution" — negative learnings captured without analyst effort. Follow-up exploration emerges as earlier factors are drilled (Layer 2 main effects, Layer 3 interactions). **Factor node ranking is transient** — it guides the analyst but nothing is persisted as a `Question` entity; the Investigation Wall and Evidence Map subsume completeness tracking.

2. **CoScout** (AI layer, Azure only) — generates additional exploration directions from the issue statement text, upfront hypotheses in the Analysis Brief, factor role detection, and data patterns. These complement the statistical signals with contextual directions that the numbers alone cannot generate.

#### The Diamond Pattern

Investigation follows the same **diamond pattern**, now anchored to scopes and hypotheses rather than a question tree:

| Phase          | Purpose                                                 | Analyst Activity                                                                                           |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Initial**    | Variation found, factor nodes ranked                    | Factor Intelligence surfaces ranked factor nodes; analyst reviews the Evidence Map                         |
| **Diverging**  | Drill to scope, explore possible causes                 | Capture a `ProblemStatementScope` (the WHERE); add `Hypothesis` entries for suspected mechanisms (the WHY) |
| **Validating** | Gather evidence for each hypothesis                     | Data (ANOVA auto-validate), Gemba (go inspect), Expert input — each updates `Hypothesis.status`            |
| **Converging** | Build understanding, identify multiple suspected causes | Hypotheses move to `evidenced` / `confirmed` / `refuted`; Problem Statement assembles from scope + causes  |

The diamond is a **structured learning** process — a disciplined way to build understanding through multiple evidence types. It is not pure hypothesis testing; the three validation types (data, Gemba, expert) reflect that understanding comes from statistical evidence, physical observation, and domain knowledge alike. The exit is when enough hypotheses are resolved to formulate a Problem Statement with suspected causes.

**Multiple suspected causes** are the natural outcome of real investigations. When a process has multiple independent sources of variation, forcing a single suspected cause oversimplifies the problem. Each confirmed or evidenced hypothesis becomes an improvement target in the IMPROVE phase. Refuted hypotheses are preserved as negative learnings (essential for audit trails and preventing re-investigation of dead ends).

After the diamond converges, the investigation is complete. What follows — ideating improvements, selecting corrective actions, implementing, and verifying — belongs to the **IMPROVE** phase, which follows PDCA (Plan-Do-Check-Act). See [Analysis Journey Map § Phase 4: IMPROVE](../03-features/workflows/analysis-journey-map.md#phase-4-improve).

**Three validation types** reflect that not every hypothesis can be answered with data:

| Validation | When to Use                                    | How It Works                                                                        |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Data       | Hypothesis links to a factor in the dataset    | ANOVA η² auto-sets `Hypothesis.status` (≥15% evidenced, <5% refuted, 5–15% partial) |
| Gemba      | Requires physical inspection on the shop floor | Define task, inspect, record findings, set status manually                          |
| Expert     | Requires domain knowledge beyond the data      | Consult expert, record assessment, set status manually                              |

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

The "Four Lenses" label is a pedagogical device — a memorable way to communicate that the same data looks different through each analytical tool. It is **not a product feature, type, or picker**: there are no CHANGE/FLOW/FAILURE/VALUE knobs in the app, and the analyst never selects a lens. The four charts are always shown together. The label maps to the four tools as a teaching aside:

| Teaching label | Tool                 | Core Question                     |
| -------------- | -------------------- | --------------------------------- |
| _change_       | I-Chart              | "What's shifting over time?"      |
| _flow_         | Boxplot              | "Where does variation come from?" |
| _failure_      | Pareto               | "Where do problems cluster?"      |
| _value_        | Capability Histogram | "Does it meet customer specs?"    |

The lens metaphor is useful for marketing and teaching, but the methodology works with standard tool names. VariScout's CoScout AI assistant uses tool names, not lens names. See [ADR-089](../07-decisions/adr-089-retire-mode-lens-user-axis.md) for why mode/lens are not user axes.

---

### Data shape is set at Frame, not picked ([ADR-089](../07-decisions/adr-089-retire-mode-lens-user-axis.md))

The analyst tunes a **measure (Y) + factor(s)**; the four charts are always shown and always drillable. There is **no mode-picker and no lens-picker**. What used to read like "alternative analysis modes" is really the **data shape**, set automatically at FRAME/setup time:

- **Performance** (`AnalysisMode = 'performance'`) — multi-channel Cpk comparison for wide-format data (fill heads, cavities, nozzles). Set by the wide-channel transform during setup, not by a menu.
- **Defect** (`AnalysisMode = 'defect'`) — set by the defect-rate ingest transform.
- **Standard** otherwise.

`AnalysisMode` is a Frame-derived data-shape discriminant, never a user knob. The one genuine analysis **view** the analyst toggles is **Values ⇄ Capability**: per-subgroup Cp/Cpk stability analysis on the I-Chart, answering "Are we capable when stable?" It is specs-gated and Cp/Cpk-only ([ADR-084](../07-decisions/adr-084-capability-indices-cp-cpk-only.md)) — never Pp/Ppk — and is _not_ a lens and _not_ an `AnalysisMode`. Time-based subgrouping uses extracted time columns from FRAME. See [Subgroup Capability Analysis](../03-features/analysis/subgroup-capability.md) and [Analysis Flow](../03-features/workflows/analysis-flow.md).

> Yamazumi mode (lean time study with stacked VA / NVA / Waste / Wait activity bars + cycle-time decomposition) was removed in wedge V1 via PR-LV1-0 (2026-05-28). Process-flow mode covers the flow-analysis use case; activity-classified time-study data is deferred to a future pivot-table capability. See [ADR-034](../07-decisions/adr-034-yamazumi-analysis-mode.md) (superseded).

The user-facing question is "what **level** of process understanding are we working on, and which **measure + factor**?" — never "which mode?" or "which lens?" Both of those are derived (data shape) or invariant (the four charts).

---

## Key Principles

**Contribution, Not Causation.** ANOVA η² quantifies how much of the total variation a factor explains. It does not prove that factor causes the variation. Causation requires domain knowledge and further investigation.

**Iterative Exploration.** Each analysis cycle deepens understanding. A finding evidences or refutes a hypothesis and may motivate new hypotheses or a deeper drill, which may need new data or a Gemba visit. The Measure⇄Analyze loop continues until the scope and its suspected causes are bounded.

**AI Augments, Never Replaces (Azure App only).** VariScout's statistical engine computes the conclusion. AI translates it into language and adds context — it does not generate competing statistics. The conclusion is reproducible and auditable. The PWA stays AI-free by design; the "guided frustration" pedagogy requires the analyst to do the thinking.

**Distribution, Not Aggregation.** When capability indices come from heterogeneous units — different specs, different contexts, different process families, different hubs — VariScout shows their **distribution**, typically as a per-step boxplot, rather than collapsing them into a single number. A `mean Cpk` across hubs running different products is mathematically meaningless: each Cpk is interpretable only against the spec that produced it. The structural enforcement is design absence: the engine exposes no function that combines Cp/Cpk across heterogeneous units. The legitimate visualization is a per-step boxplot of per-`(node × context-tuple)` Cpks, side-by-side across hubs when needed; the analyst's eye does the pattern recognition. See ADR-073 and the [investigation-scope-and-drill-semantics spec](../archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md).

**One Graph, Two Projections.** The investigation graph (`ProblemStatementScope` + `Hypothesis` + `CausalLink` + `Finding`) admits two projections — _factor-centric_ ([Evidence Map](../archive/specs/2026-04-05-evidence-map-design.md): which factors contribute to variation?) and _hypothesis-centric_ ([Investigation Wall](../03-features/workflows/analyze-wall.md): which hypotheses are we betting on, what evidence holds them, what's missing?). Each projection is the same data, different lens. Skilled investigators move fluently between them — the Map to identify which columns explain variation, the Wall to ask what would _contradict_ the leading hypothesis. Question generation is transient ranked factor-node metadata (nothing persisted); the Wall subsumes the "what to answer" tracking role. See [ADR-085](../07-decisions/adr-085-drop-question-problem-statement-scope.md) and [ADR-086](../07-decisions/adr-086-unified-investigation-canvas.md).

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
- [Investigation to Action](../03-features/workflows/analyze-to-action.md) — Findings panel, What-If Simulator, full analyst workflow
- [Question-Driven Investigation](../03-features/workflows/question-driven-analyze.md) — Diamond pattern, validation types (historical; superseded by ADR-085 scope-first model)
- [Mental Model Hierarchy](../05-technical/architecture/mental-model-hierarchy.md) — How all conceptual frameworks (journey, investigation diamond, lenses, report steps) relate and nest
- [Multi-level SCOUT design](../archive/specs/2026-04-29-multi-level-scout-design.md) — How the three Process Learning Levels above are operationalized as a level-spanning surface architecture (each surface owns one level, lenses the others); boundary policy in [ADR-074](../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).
