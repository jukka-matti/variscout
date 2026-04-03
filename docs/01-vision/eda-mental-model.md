---
title: 'EDA Mental Model — Question-Driven Analysis'
audience: [analyst, engineer]
category: methodology
status: stable
related: [methodology, four-lenses, progressive-stratification, factor-intelligence, investigation]
---

# EDA Mental Model — Question-Driven Analysis

How VariScout implements Exploratory Data Analysis as a structured, question-driven methodology for process improvement — grounded in academic research, validated by Lean Six Sigma practitioners, and designed for quality professionals at every skill level.

---

## 1. Foundation

### 1.1 The EDA Mental Model

This document is grounded in Turtiainen's Master's thesis _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ (LUT University, 2019). The thesis synthesizes decades of quality methodology — Shewhart's control charts (1924), Tukey's exploratory data analysis (1977), Juran's Pareto principle (1950s), and Watson's structured EDA approach — into a coherent mental model that was validated by nine Lean Six Sigma Master Black Belt experts across multiple industries.

The central insight of the thesis is that EDA in quality contexts is not an open-ended fishing expedition. It is a structured investigation that begins with a vague concern and progressively sharpens it into a precise, actionable problem statement through iterative analysis loops. Each loop answers specific questions, and each answer makes the next question more focused.

This is what distinguishes quality EDA from academic statistics. The goal is not to prove a hypothesis at p<0.05 — it is to understand the process well enough to improve it.

### 1.2 Scientific Method in Quality

The relationship between scientific method and quality improvement has a clear lineage:

| Framework         | Origin            | Core Cycle                                          |
| ----------------- | ----------------- | --------------------------------------------------- |
| Scientific Method | Bacon, Galileo    | Observe -> Hypothesize -> Test -> Conclude          |
| Shewhart Cycle    | Shewhart (1939)   | Specification -> Production -> Inspection           |
| PDCA              | Deming (1950)     | Plan -> Do -> Check -> Act                          |
| DMAIC             | Six Sigma (1986)  | Define -> Measure -> Analyze -> Improve -> Control  |
| EDA Mental Model  | Turtiainen (2019) | Issue -> Questions -> Findings -> Problem Statement |

Each framework refines the previous one for its domain. DMAIC operationalized PDCA for manufacturing. The EDA Mental Model further operationalizes the Analyze phase of DMAIC — the part where practitioners most often stall because the methodology says "analyze the data" without specifying how.

The thesis addresses this gap directly. Watson (2015b) wrote: _"Statistical Thinking seeks answers to process questions."_ The EDA Mental Model makes this concrete by defining what those questions are, where they come from, how they get answered, and what the answers produce.

### 1.3 Why This Matters for Practitioners

Most quality software assumes the practitioner already knows what to look for. Open a statistical tool, select a test, interpret the output. But the hardest part of quality analysis is not running the test — it is knowing which test to run and which factor to examine first.

The EDA Mental Model addresses this by providing:

- A starting structure (the issue statement) that accepts vague input
- A question generation mechanism that tells the analyst what to check next
- A progress indicator that shows how much of the problem is understood
- A conclusion format (the problem statement) that is precise enough to act on

VariScout implements all four of these. The methodology works whether the analyst has one year of experience or twenty.

### 1.4 The Four-Step Model

The thesis defines a four-step mental model for EDA, aligned with both PDCA and DMAIC:

| Step | Activity                                    | PDCA  | DMAIC   |
| ---- | ------------------------------------------- | ----- | ------- |
| 1    | Possible Issue Identification and Selection | Plan  | Define  |
| 2    | Data Collection                             | Do    | Measure |
| 3    | Defined Data Analysis                       | Check | Analyze |
| 4    | Exploratory Data Analysis                   | Act   | Analyze |

A critical gate exists between Step 4 and improvement: **"Check with the Sponsor."** This is the decision point where results are shared with the process owner, who decides whether to proceed to Improve or loop back for further analysis. In VariScout, this maps to the transition from SCOUT to INVESTIGATE — the point where the analyst has enough findings to present a preliminary conclusion and seek direction.

Step 1 produces the first version of the analysis plan: the issue statement, the factors to investigate, the data requirements, the analytical tools to use, and the scope boundaries. In VariScout, this is the FRAME phase — column mapping, factor selection, and the Analysis Brief.

Steps 2-4 are iterative. The analyst does not pass through them once — they cycle through them repeatedly, each iteration producing a more refined understanding. This is the EDA inner loop, and it is the heart of the methodology.

For full thesis excerpts and figure descriptions, see [Turtiainen (2019) Reference](references/turtiainen-2019-eda-mental-model.md).

---

## 2. Issue Statement to Problem Statement

### 2.1 Two Different Things

The most important distinction in the EDA Mental Model is between the **Issue Statement** and the **Problem Statement**. They are not the same thing, and confusing them is one of the most common mistakes in quality improvement projects.

**Issue Statement** (the input): A vague concern that initiates investigation. Watson (2019a) defines an issue as _"a concern that arises as a difference between customer expectation and their observations or perceptions with respect to these expectations."_

Examples of issue statements:

- "Fill weight on line 3 seems too variable"
- "Some parts are delivered later than others by supplier JDK"
- "Assembly time of product A is too high"
- "Customers are complaining about dimension consistency"

Notice what these have in common: they identify that something is wrong, but they do not specify what needs to change, by how much, or where the focus should be.

**Problem Statement** (the output): A precise declaration that answers Watson's three questions:

1. **What measure needs to change?** — The specific performance measure (the Y)
2. **How should it change?** — The direction and target (reduce, increase, stabilize)
3. **What is the scope?** — Where further investigation needs to focus (specific factors, levels, conditions)

Examples of problem statements:

- "Reduce fill weight variation on line 3, night shift, heads 5-8, from Cpk 0.62 to target Cpk 1.33"
- "Decrease delivery time for Parts O and Q with Factor 1=K and Factor 2=F during time period E"
- "Decrease cycle time of process step 2 for shift 2 and machine M for product A containing part B"

The gap between an issue statement and a problem statement is the entire EDA journey. Everything VariScout does in the SCOUT phase exists to close this gap.

### 2.2 The 5W+1H Framework

Before jumping into data analysis, the thesis recommends structured context gathering using the 5W+1H framework (Figure 42):

- **What** happened? What is the observable symptom?
- **Who** is affected? Who reported it? Who is involved in the process?
- **When** does it occur? Is it time-dependent? How urgent is it?
- **Where** is it taking place? Which line, machine, department?
- **Why** is it important? What are the consequences if unresolved?
- **How** was it detected? How is it being measured?

These questions are not statistical — they are contextual. They ensure the analyst understands the business significance of the issue before investing in data analysis. In VariScout, the Analysis Brief in the FRAME phase captures this context: the issue statement, the process description, upfront hypotheses, and the improvement target all map to 5W+1H elements.

The 5W+1H framework also feeds CoScout's heuristic question generation. When the analyst writes "fill weight problems started after maintenance on heads 5-8 last week," CoScout extracts temporal and equipment context that shapes the questions it suggests.

### 2.3 Progressive Sharpening

The issue statement does not transform into the problem statement in a single leap. It sharpens progressively through iterative EDA loops, each loop adding precision.

Consider this progression:

| After                       | Issue Statement                                            | What Changed                     |
| --------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Start                       | "Fill weight on line 3 is too variable"                    | Vague concern, no specifics      |
| Loop 1 (Shift analysis)     | "Fill weight variation on line 3 is driven by night shift" | Added: which condition matters   |
| Loop 2 (Equipment analysis) | "...night shift, heads 5-8"                                | Added: which equipment           |
| Loop 3 (Capability check)   | "...Cpk 0.62, target 1.33"                                 | Added: how much change is needed |
| Conclusion                  | Problem Statement formulated                               | All three questions answered     |

Each loop answers a specific question. Each answer makes the next question more focused. The analyst does not need to know in advance what the problem is — the analysis reveals it, one question at a time.

This is the thesis's case study pattern in action. In the supplier delivery case (Section 8.2), four EDA loop iterations transformed "some parts are delivered later than others" into "deliveries of Parts O and Q with Factors 1=K and 2=F have been bad in time period E." Four loops, four questions answered, one precise statement.

### 2.4 Multiple Suspected Causes

Real quality problems rarely have a single root cause. The EDA Mental Model explicitly supports multiple suspected causes as the natural conclusion of investigation — not as a failure to find "the" root cause, but as an accurate reflection of how processes work.

After the SCOUT and INVESTIGATE phases, the analyst typically identifies:

- **Suspected causes** — mechanisms with strong evidence of contribution (e.g., "Night shift technique drift", eta-squared=34%; "Heads 5-8 mechanical wear", eta-squared=22%)
- **Contributing factors** — evidence threads that amplify or enable a suspected cause (e.g., Shift x Head interaction, delta-R-squared=4%)
- **Ruled-out factors** — factors checked and found not relevant (e.g., Material batch, R-squared-adjusted=2%)

VariScout implements this as **SuspectedCause hubs**: named entities that group related questions and findings into one coherent causal story. A hub is not a label on a single question — it is the "connected story" that collects all the evidence threads pointing toward the same mechanism. Multiple independent hubs coexist in one investigation, each driving its own improvement focus.

This grouping mechanism is the key difference between "we found three significant factors" and "we understand that nozzle wear and temperature drift are two independent mechanisms, each needing its own corrective action."

All three categories are valuable. The suspected cause hubs drive improvement actions. The contributing evidence refines those actions. The ruled-out factors are negative learnings — they document what was checked and dismissed, which is essential for audit trails and for preventing future teams from re-investigating the same dead ends.

This is a deliberate departure from the traditional "single root cause" model. When a process has multiple independent sources of variation, forcing a single root cause oversimplifies the problem and leads to incomplete solutions.

### 2.5 The Three Questions as a Completeness Check

Watson's three questions serve as a simple completeness test. If the analyst cannot answer all three, the investigation is not finished:

| Question                      | Test                              | Example                                            |
| ----------------------------- | --------------------------------- | -------------------------------------------------- |
| What measure needs to change? | Can you name the Y?               | "Fill weight standard deviation"                   |
| How should it change?         | Can you state direction + target? | "Reduce from sigma=2.1 to sigma<1.0 (Cpk >= 1.33)" |
| What is the scope?            | Can you state where?              | "Line 3, night shift, heads 5-8"                   |

If any answer is missing or vague, the analyst needs more EDA loops. The questions are not bureaucratic checkboxes — they are a practical test of whether the investigation has produced enough understanding to act.

---

## 3. VariScout's EDA Implementation

VariScout brings the thesis model to life through four interconnected mechanisms: parallel visual exploration (Four Lenses), evidence-based question generation (Factor Intelligence), guided drill-down (Progressive Stratification), and distribution validation (Probability Plot). Together, they implement the EDA inner loop — Analysis Planning, Data Organizing, Exploratory Analysis, Evaluation — as an interactive, visual workflow.

### 3.1 Four Lenses as Parallel Exploration

The thesis identifies four core analytical tools, each answering a different question about the process:

| Tool                | VariScout Lens | Question                              |
| ------------------- | -------------- | ------------------------------------- |
| Individuals Chart   | **CHANGE**     | What patterns exist over time?        |
| Boxplot             | **FLOW**       | Where does variation come from?       |
| Pareto Chart        | **FAILURE**    | Where do problems concentrate?        |
| Capability Analysis | **VALUE**      | Does it meet customer specifications? |

VariScout's contribution is making these four tools work **simultaneously with linked filtering**. In traditional statistical software (Minitab, JMP, R), the analyst opens one tool at a time: create an I-Chart, examine it, close it, create a Boxplot, examine it. Each tool is an independent window with no connection to the others.

In VariScout, all four are visible on a single dashboard. Clicking "Machine B" in the Boxplot simultaneously updates the I-Chart to show Machine B's timeline, the Pareto to show Machine B's failure modes, and the Capability analysis to recalculate for Machine B alone. The analyst sees every perspective at once.

This is not just a convenience feature. It changes how analysis works. When an analyst sees that Machine B has the highest variation (Boxplot) and also shows a drift starting in week 3 (I-Chart) and predominantly produces oversized parts (Pareto) with Cpk 0.4 (Capability), the four pieces of evidence form a coherent story that no single chart could tell. The lenses are meshed gears: turning one turns all of them.

**The contrast with traditional tools is stark.** In Minitab, an analyst investigating fill weight variation might: (1) create an I-Chart, notice a shift, write down the observation; (2) open a new analysis, create a Boxplot by shift, see that night shift is worse; (3) open another analysis, create a capability analysis for night shift only, see Cpk is low; (4) open yet another, create a Pareto of defect types for night shift. Four separate workflows, four separate windows, no linked context. The analyst maintains the thread of investigation in their head.

In VariScout, step 1 through 4 happens with a single click. The analyst clicks "Night Shift" in the Boxplot, and all four charts update to show night shift's story from four perspectives simultaneously. The cognitive load shifts from "remembering what I found in each tool" to "understanding the pattern across all tools at once."

The first three lenses — CHANGE, FLOW, FAILURE — analyze internal process behavior. The VALUE lens is fundamentally different: it brings in an external reference (customer specifications) to ask "does this variation actually matter?" A factor might explain 40% of process variation, but if the filtered Cpk is still 1.5, the process easily meets spec even with that factor active. Conversely, a factor explaining only 15% of variation might push Cpk below 1.0, making it the real priority despite its lower statistical contribution.

This interaction between the process voice (control limits, stability) and the customer voice (specification limits, capability) is what the thesis calls the bridge between internal analysis and external relevance. Both perspectives are needed to prioritize correctly.

### 3.2 Factor Intelligence as the Question Engine

The thesis's Analysis Planning step asks: "Which factors should be investigated? In what order?" Traditionally, this is answered by domain knowledge alone — the analyst decides based on experience which factors to look at first. This works for experts but leaves novices guessing.

VariScout's Factor Intelligence (ADR-052) makes analysis planning data-driven. It is a three-layer progressive feature that generates evidence-ranked questions from the data itself:

**Layer 1: Best Subsets Ranking (always available)**

When analysis begins, Factor Intelligence calculates R-squared-adjusted for every factor and every combination of factors (up to 2^k - 1 combinations for k factors). The result is a ranked list:

- "Shift + Fill Head combination explains 52% of variation"
- "Shift alone explains 34%"
- "Fill Head alone explains 28%"
- "Material Batch explains 2%"

Each ranking becomes a question: "Does this factor (or combination) drive variation?" Factors with R-squared-adjusted below 5% are automatically answered: "No, this factor does not matter." These auto-answers are negative learnings — captured without any analyst effort.

This is the thesis's Analysis Planning step made quantitative. Instead of the analyst guessing which factors to investigate, the data tells them. Instead of spending time on irrelevant factors, irrelevant factors are ruled out automatically.

**Layer 2: Main Effects (gated: R-squared-adjusted > 5%)**

When Layer 1 identifies a significant factor, Layer 2 answers the follow-up question: "Which specific level of this factor is the problem?" Main effects analysis shows per-level group means and identifies best and worst performers.

For example, if Shift is significant at Layer 1, Layer 2 reveals: "Night shift mean is 15.2 vs Day shift mean of 12.8 — Night shift is specifically worse." This turns "the factor matters" into "HERE is the problem within the factor."

**Layer 3: Interactions (gated: at least 2 significant main effects)**

When two or more factors are individually significant, Layer 3 asks the question that progressive stratification alone cannot answer: "Do these factors interact?" An interaction means one factor's effect depends on the level of another.

"Is the Head 5-8 problem worse on night shift?" is an interaction question. If the answer is yes, the solution requires addressing the combination, not each factor independently. Layer 3 uses delta-R-squared between additive and cell-means models to detect this.

The evidence gating is critical. Layer 2 does not appear until Layer 1 shows a factor matters. Layer 3 does not appear until Layer 2 confirms at least two significant factors. This prevents premature conclusions — a novice analyst cannot jump to interaction analysis before confirming that the individual factors are relevant.

### 3.3 Progressive Stratification

Progressive stratification is the mechanism that converts a multidimensional variation problem into a sequential, one-factor-at-a-time investigation. It is analogous to binary search applied to a factor space.

The drill-down sequence:

1. Look at which factor explains the most variation (Boxplot eta-squared display)
2. Filter to the highest-impact level of that factor (click a box or bar)
3. See how the remaining factors redistribute in the filtered data
4. Repeat until an actionable condition is isolated

Each step does two things simultaneously:

- **Reduces the problem space** — fewer factors remain to investigate
- **Quantifies progress** — the cumulative variation bar shows how much of total variation is now in scope

**Why contribution to TOTAL variation matters.** This is a critical design choice. If the analyst filters to Night Shift (67% of total variation) and then sees Machine explains 36% of the Night Shift subset, the local eta-squared is 36%. But the answer to "how much of my TOTAL problem does Machine explain?" is 24% (36% of the 67% Night Shift portion).

Local eta-squared disconnects from the original problem. Contribution to total keeps the analyst anchored at every step. The cumulative variation bar reflects this: it shows how much of the original, unfiltered variation is captured by the current filter combination. When it crosses 50%, the analyst has isolated more than half of the total problem — a meaningful threshold for action.

**The variation bar as a progress indicator:**

- Above 50% (green): Strong isolation — enough evidence to act
- 30-50% (amber): Moderate — investigation is progressing but needs more
- Below 30% (blue): Early stage — keep drilling or consider interaction effects

This directly implements the thesis's Evaluation step. At each iteration, the analyst evaluates: "Have I found enough? Should I drill deeper? Should I investigate a different factor?" The variation bar quantifies this judgment.

**When progressive stratification is not enough.** One-factor-at-a-time drill-down captures main effects — how much variation each factor explains independently. But it can miss interactions where two factors together behave differently than either alone. This is why Factor Intelligence Layer 3 exists: it detects interaction effects that sequential drill-down may overlook. The cumulative variation bar below 30% after exhausting all individual factors is a signal that interactions may be at play.

### 3.4 Probability Plot

The Probability Plot adds a capability that the other three lenses do not provide: distribution shape analysis.

**Distribution validation.** The Anderson-Darling goodness-of-fit test tells the analyst whether the data follows a normal distribution. This matters because capability indices (Cp, Cpk) assume normality. If the data is not normal, the Cpk number may be misleading. The probability plot makes this visible — data points that fall on the reference line are normally distributed; systematic departures indicate non-normality.

**Multi-series factor comparison.** When the probability plot is split by a factor (e.g., one line per shift), the slope of each line reveals the spread of that subgroup. A steeper slope means less variation. Comparing slopes across factor levels shows at a glance which level is most capable — without computing separate Cpk values for each.

**Inflection points.** A probability plot with a distinct bend or kink reveals a process transition — two populations mixed together. This is often invisible in a histogram or boxplot but unmistakable on a probability plot. It suggests that the data contains a hidden factor not yet captured in the analysis, directing the analyst to investigate what condition changed.

The probability plot is the thesis's tool for validating assumptions before drawing conclusions. It answers: "Can I trust the statistics I am computing from this data?"

In the thesis's recommended tool sequence (Figure 35), the probability plot comes immediately after the I-Chart and before capability analysis. This ordering is deliberate: verify that the data is well-behaved before computing indices that assume it is. VariScout places the probability plot alongside the capability histogram in the stats sidebar, making it easy to check normality whenever capability numbers are being reviewed.

For the question-driven model, the probability plot answers questions that the other lenses cannot: "Is this data from one process or two?" (inflection point detection), "Which factor level has the tightest distribution?" (slope comparison), "Can I trust this Cpk number?" (normality validation). These are not statistical trivia — they are practical questions that determine whether the analyst's conclusions are reliable.

---

## 4. Question-Driven Investigation Flow

The EDA Mental Model defines an inner loop (Analysis Planning -> Data Organizing -> Exploratory Analysis -> Evaluation) that repeats at each of three progressively deeper levels. VariScout implements this loop as a question-driven investigation flow where each iteration is anchored to a specific question, and each answer either advances the investigation or spawns follow-up questions.

### 4.1 FRAME: Setting the Stage

The investigation begins in the FRAME phase, where the analyst provides:

- **Issue Statement** — the vague concern that initiated the investigation (e.g., "fill weight on line 3 is too variable"). This is entered as free text during data import.
- **Upfront hypotheses** — the analyst's initial beliefs about what might be causing the problem (e.g., "I think night shift is worse"). These come from domain knowledge, management direction, or previous experience.
- **Improvement target** — the desired outcome, if known (e.g., "Cpk >= 1.33"). This may be refined during analysis.
- **Factor selection** — which columns in the data represent factors to investigate. VariScout's column mapping interface helps the analyst identify measure columns and factor columns.

The FRAME phase corresponds to the thesis's Step 1 (Possible Issue Identification and Selection) and the Analysis Planning portion of the inner loop. The issue statement is the seed; everything that follows exists to sharpen it.

### 4.2 Question Generation

When analysis begins in the SCOUT phase, questions are generated from two complementary sources.

**Source 1: Factor Intelligence (deterministic, always available)**

Layer 1 (Best Subsets R-squared-adjusted) generates evidence-ranked questions automatically:

- Single factors: "Does Shift explain variation?" (R-squared-adjusted = 34%)
- Factor combinations: "Does Shift + Fill Head together explain more?" (R-squared-adjusted = 52%)
- Auto-answered: "Does Material Batch matter?" (R-squared-adjusted = 2%) — automatically ruled out

These questions are ranked by their R-squared-adjusted values. The analyst sees immediately which factors are most worth investigating and which have already been ruled out by the data.

**Source 2: Heuristic and CoScout questions (AI layer, Azure with CoScout only)**

When CoScout AI is available, additional questions are generated from context that Factor Intelligence cannot derive:

- From the issue statement text — natural language understanding of what the analyst cares about
- From upfront hypotheses — "Is Night shift worse?" (from the analyst's prior belief)
- From factor roles — temporal questions for date columns, equipment questions for machine columns
- From specification limits — "Is the process capable?" (always relevant when specs are defined)
- From data patterns — "Is there a time trend?" (prompted by I-Chart instability)

The two sources are merged into a single ranked checklist. Factor Intelligence questions carry R-squared-adjusted evidence; heuristic questions are interleaved based on relevance.

### 4.3 SCOUT: Exploring the Four Lenses

With questions in hand, the analyst explores the dashboard. Each question is clickable — clicking it navigates the dashboard to show the relevant evidence. Clicking "Does Shift explain variation?" applies the Shift factor to the Boxplot, updates all linked charts, and shows the eta-squared for that factor.

The analyst is free to follow the questions in order, skip to questions they find most interesting, or ignore the questions entirely and drill through the charts manually. The question checklist is a guide, not a constraint. Progressive stratification works the same way whether the analyst follows a question or clicks a chart element directly.

This dual-mode interaction — guided questions alongside free exploration — matches how experienced analysts actually work. Sometimes they follow the data systematically. Sometimes they have a hunch and want to check it immediately. VariScout supports both without forcing either.

### 4.4 Findings as Answers

When the analyst discovers something worth recording — a pattern, a significant factor, a capability gap — they pin a **Finding**. Findings are VariScout's unit of evidence. Each finding captures:

- The observation (what the analyst noticed)
- The statistical context (filter state, eta-squared, Cpk, relevant statistics)
- The chart source (which lens revealed it)
- A link to the question it answers (if the finding was prompted by a question)

When a finding is linked to a question, the question's status updates: answered-yes (the factor matters), answered-no (it does not), or partial (inconclusive, needs more investigation). This linking is what transforms the question checklist from a to-do list into an evidence trail.

Findings auto-link to the currently focused question — no explicit "answer" action needed. The analyst pins observations using the familiar chart interaction (right-click → Add observation), and the system detects which question the finding relates to based on the focused question context. Chart annotations from findings are opt-in (not shown by default) to keep dashboards clean.

Each finding also sharpens the issue statement. After pinning a finding about night shift variation, the issue statement can be updated from "fill weight is too variable" to "fill weight variation is driven by night shift." With CoScout, this sharpening is suggested automatically. Without CoScout, the analyst edits the statement manually.

### 4.5 Follow-Up Questions

Answering a question often spawns follow-up questions. This is the thesis's inner loop in action — the Evaluation step determines whether to advance, rotate, or drill deeper.

When a Layer 1 question is answered with "yes" (the factor matters), Layer 2 questions emerge: "Which specific level of Shift is the problem?" When two Layer 2 questions are both answered, Layer 3 questions may emerge: "Do Shift and Fill Head interact?"

CoScout (when available) adds contextual follow-ups that go beyond the statistical layers: "Your process description mentions nozzle maintenance — has Head 5-8 maintenance been checked recently?" These connect statistical findings to operational context.

The question tree grows as the investigation progresses. Initial questions spawn follow-ups, which may spawn deeper follow-ups, up to a maximum depth of three levels — mapping directly to the thesis's three EDA levels (Level 1: Y-measure overview, Level 2: process flow details, Level 3: operational details).

### 4.6 Problem Statement Emergence

The Problem Statement forms progressively — it is not produced in a single step at the end of investigation. Watson's three questions are answered at different points in the journey:

1. **What measure needs to change?** — answered during FRAME when the measure column is mapped
2. **How should it change?** — answered during FRAME/SCOUT when characteristic type and target direction are set
3. **What is the scope?** — answered at SCOUT Loop 1 when the first SuspectedCause hub is created and named

The problem statement is assembled live from these three answers and is visible in the PI panel conclusion card from the moment Q1+Q2 are answered. Q3 fills in as SuspectedCause hubs are created. The statement sharpens with each new hub — not only at investigation end.

This is a direct implementation of the thesis's progressive sharpening pattern (Section 2.3): each EDA loop adds precision to the scope, but the measure and direction are stable from the moment the analysis is framed.

### 4.7 SuspectedCause Hubs as Investigation Output

The complete investigation output includes:

1. **Problem Statement** — precise, answering all three questions (assembled progressively)
2. **SuspectedCause hubs** — named mechanisms, each grouping multiple evidence threads; ranked by total evidence strength (eta-squared or R-squared-adjusted)
3. **Contributing evidence** — questions and findings that amplify or enable each hub mechanism
4. **Ruled-out factors** — negative learnings, documented for audit and future reference
5. **Issue Statement evolution** — the trail from vague concern to precise understanding

Each hub is a named causal story — not just a factor name, but a mechanism description (e.g., "Worn nozzle tip" rather than "Fill Head"). This naming step is what transforms statistical evidence into actionable understanding.

This output becomes the input to the IMPROVE phase. Each SuspectedCause hub is a target for improvement brainstorming (one HMW session per hub). Hub confirmation only comes when the corresponding improvement is verified effective — the hub transitions from "suspected" to "confirmed" at `resolved` finding status.

### 4.8 Example: Fill Weight Investigation

To make the flow concrete, consider a complete walkthrough of a fill weight investigation.

**FRAME:** The analyst uploads fill weight data with factors: Shift (Day/Night), Fill Head (1-12), Material Batch (A/B/C), and Operator (Kim/Lee/Park). Issue statement: "Fill weight on line 3 is too variable." Improvement target: Cpk >= 1.33. Current overall Cpk: 0.85.

**Question Generation:** Factor Intelligence Layer 1 produces:

1. "Does Shift + Fill Head together explain variation?" (R-squared-adjusted = 52%)
2. "Does Shift alone explain variation?" (R-squared-adjusted = 34%)
3. "Does Fill Head alone explain variation?" (R-squared-adjusted = 28%)
4. "Does Operator explain variation?" (R-squared-adjusted = 8%)
5. "Does Material Batch matter?" (R-squared-adjusted = 2%) — auto-ruled-out

Five questions, one already answered. The analyst has a ranked checklist before touching a single chart.

**SCOUT Loop 1:** The analyst clicks question 2 (Shift). The Boxplot shows Night shift with higher spread and eta-squared = 34%. The I-Chart shows Night shift points clustering above the mean. The Pareto shows "above USL" defects concentrated on Night shift. Cpk for Night shift: 0.62.

Finding pinned: "Night shift accounts for 34% of variation, Cpk 0.62." Question 2 status: answered-yes.

Issue statement updated: "Fill weight variation on line 3 is driven by night shift."

**SCOUT Loop 2:** Layer 2 follow-up question: "Which fill heads are specifically worse on Night shift?" The analyst filters to Night shift and examines Fill Head. Heads 5-8 show significantly higher variation than Heads 1-4 and 9-12.

Finding pinned: "Heads 5-8 on Night shift show excess variation, eta-squared = 22% within Night shift." Question status: answered-yes.

Issue statement updated: "Fill weight variation on line 3, night shift, heads 5-8."

**SCOUT Loop 3:** The analyst clicks question 4 (Operator). Operator shows some effect (eta-squared = 8%), but when filtered to Night shift / Heads 5-8, the operator effect drops to 3%. Operator is not driving the specific problem.

Finding pinned: "Operator effect is minor when scoped to Night shift, Heads 5-8." Question 4 status: answered-no (in the relevant scope).

**SCOUT Loop 4:** Layer 3 question emerges: "Do Shift and Fill Head interact?" The interaction analysis confirms yes — the Head 5-8 problem is significantly worse on Night shift than Day shift (delta-R-squared = 4%). This is not just "Night shift is bad" and "Heads 5-8 are bad" — the combination is worse than the sum of the parts.

**Problem Statement:** "Reduce fill weight variation on line 3, Night shift, Heads 5-8, from Cpk 0.62 to >= 1.33."

**Suspected Causes:**

1. Night shift technique or conditions (eta-squared = 34%) — suspected cause
2. Heads 5-8 mechanical state (eta-squared = 22%) — suspected cause
3. Shift x Head interaction: worse together (delta-R-squared = 4%) — contributing
4. ~~Material Batch~~ — ruled out (R-squared-adjusted = 2%)
5. ~~Operator~~ — ruled out in relevant scope (eta-squared = 3% when filtered)

Four loops, five questions answered (one automatically), one precise problem statement, two suspected causes, two ruled-out factors. The investigation took minutes, not days.

### 4.9 The Question Checklist as a Presentation Tool

A subtle but important aspect of the question-driven model: the question checklist is not just an analytical tool — it is a **presentation tool**.

Quality analysts work within organizations. They report to sponsors, answer questions from management, and present to cross-functional teams. When a sponsor asks "did you check the material batch?", the analyst clicks the question in the checklist. The dashboard immediately shows the evidence: a flat boxplot with eta-squared of 2%. The answer is visual, immediate, and irrefutable.

The checklist documents what was checked, what was found, and what was ruled out. This is essential for ISO 10.2 compliance (nonconformity and corrective action), which requires documented evidence of investigation thoroughness.

---

## 5. Integration with DMAIC

VariScout's four-phase journey maps to Lean Six Sigma's DMAIC methodology. The mapping is not one-to-one — VariScout's phases combine and refine DMAIC steps to match how quality professionals actually work with data.

### 5.1 Phase Mapping

| VariScout Phase | DMAIC Phase(s)    | Activity                                                                                                                                         |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FRAME**       | Define            | Identify the Y-measure, set the scope, enter the issue statement, select factors, define improvement target                                      |
| **SCOUT**       | Measure + Analyze | Characterize Y (statistical overview), discover X's via EDA (Factor Intelligence, progressive stratification, four lenses)                       |
| **INVESTIGATE** | Analyze (deeper)  | Validate suspected causes with evidence — data (ANOVA auto-validation), Gemba (physical inspection), expert input                                |
| **IMPROVE**     | Improve           | PDCA cycle: plan improvement actions from suspected causes, implement changes, verify improvement with staged analysis (before/after comparison) |

The Control phase of DMAIC is beyond VariScout's current scope. VariScout's role ends when the improvement is verified. Sustained control — monitoring, control plans, standard work documentation — belongs to the operational management system.

### 5.2 The Three EDA Levels Within DMAIC

The thesis defines three levels of EDA that map to progressive depth within the Analyze phase:

**Level 1: Y-measure overview (Measure phase)**

The analyst examines the Y-measure at a high level. The I-Chart shows time-based stability. The Boxplot shows variation by top-level factors. The Capability analysis shows the overall process state against specifications.

The output of Level 1 is the **Issue Statement** — a first characterization of what is happening, refined from the initial vague concern with evidence from the data.

**Level 2: Process flow details (Analyze phase, first pass)**

The analyst drills into the factors identified at Level 1. Progressive stratification isolates specific levels (which shift, which machine, which operator). Layer 2 Main Effects from Factor Intelligence identify which specific levels are best and worst.

The output of Level 2 is the **Problem Statement** — answering Watson's three questions with specific factors, levels, and targets.

**Level 3: Operational details (Analyze phase, deep dive)**

The analyst investigates the operational mechanisms behind the identified factors. Why is night shift worse? Is it training, tooling, environmental conditions? Layer 3 Interactions from Factor Intelligence reveal whether factors combine in unexpected ways. The Probability Plot may reveal hidden process transitions.

The output of Level 3 is the **Solutions Space** — specific operational conditions where improvement efforts should focus. This becomes the input to the INVESTIGATE phase, where suspected causes are validated through data, Gemba visits, and expert consultation.

### 5.3 The PDCA Loop Within Each Level

Each EDA level contains its own PDCA-like cycle, as defined in the thesis (Figure 44):

1. **Analysis Planning** — What question to check next? (Factor Intelligence ranking, CoScout suggestions, or analyst judgment)
2. **Data Organizing** — Apply the appropriate filter, sort, or view (click the question, apply a filter chip, switch factors)
3. **Exploratory Analysis** — Examine the Four Lenses for the current view (read the charts, note patterns, check statistics)
4. **Evaluation** — Three possible outcomes:
   - **Advance:** The question is answered, produce output for the next level (pin a finding, update the issue statement)
   - **Rotate:** Additional questions to check at the current depth (follow-up questions spawned)
   - **Drill deeper:** More detail needed (the current answer is insufficient, move to the next EDA level)

This inner loop is what the analyst experiences as "the analysis flow." Each rotation takes seconds to minutes. A typical investigation involves 3-8 rotations across the three levels, progressively building understanding until the problem statement can be formulated.

### 5.4 From SCOUT to INVESTIGATE to IMPROVE

The EDA Mental Model covers the analytical journey — from issue to problem statement to solutions space. But the quality improvement cycle does not end with analysis. VariScout's INVESTIGATE and IMPROVE phases extend the model into validation and action.

**INVESTIGATE: Validating suspected causes.** The SCOUT phase produces suspected causes ranked by statistical evidence. But statistical association is not causation. The INVESTIGATE phase uses a diamond pattern — diverging into possible explanations, then converging through evidence:

- **Data validation** — Does the ANOVA evidence hold when examined more closely? VariScout auto-validates hypotheses against eta-squared thresholds (above 15% = supported, below 5% = contradicted, between = partial).
- **Gemba validation** — Does physical inspection of the process confirm the statistical finding? An analyst who found that Heads 5-8 are problematic goes to the production floor to inspect those heads.
- **Expert validation** — Does the maintenance engineer, process expert, or operator confirm the pattern? Domain knowledge explains the mechanism behind the statistical signal.

Each suspected cause may require a different validation approach. "Night shift technique" might need Gemba observation and expert interviews. "Heads 5-8 mechanical state" might need physical inspection and maintenance records. The question tree from SCOUT provides the investigation targets; the diamond pattern from INVESTIGATE provides the validation methodology.

**IMPROVE: Acting on validated causes.** Once causes are validated, the IMPROVE phase follows PDCA:

- **Plan** — Ideate improvement actions for each validated cause. Factor Intelligence Layer 2 provides X-level targets: "Set Night shift technique to match Day shift parameters" or "Replace nozzles on Heads 5-8."
- **Do** — Implement the changes.
- **Check** — Collect new data and run staged analysis (before/after comparison). VariScout's staged analysis capability overlays pre-improvement and post-improvement data on the same dashboard, showing whether the suspected causes were actually addressed.
- **Act** — If improvement is confirmed, standardize. If not, loop back to SCOUT or INVESTIGATE with the new data.

The problem statement from SCOUT drives the verification criteria. "Reduce fill weight variation from Cpk 0.62 to >= 1.33" is a measurable target. The staged analysis shows whether it was achieved.

---

## 6. Without AI

The question-driven model works at all product tiers because Factor Intelligence is deterministic — it uses standard statistical calculations (R-squared-adjusted, eta-squared, ANOVA), not machine learning or large language models.

### 6.1 Capability by Tier

| Capability                              | PWA (free, 3 factors max) | Azure (6 factors max) | Azure + CoScout  |
| --------------------------------------- | ------------------------- | --------------------- | ---------------- |
| Issue Statement field                   | Yes                       | Yes                   | Yes              |
| Factor Intelligence L1-3 questions      | Yes                       | Yes                   | Yes              |
| Auto-answered (R-squared-adjusted < 5%) | Yes                       | Yes                   | Yes              |
| Click question to navigate dashboard    | Yes                       | Yes                   | Yes              |
| Finding links to question               | Yes                       | Yes                   | Yes              |
| Multiple suspected causes               | Yes                       | Yes                   | Yes              |
| Progressive stratification              | Yes                       | Yes                   | Yes              |
| Four Lenses linked filtering            | Yes                       | Yes                   | Yes              |
| Probability Plot                        | Yes                       | Yes                   | Yes              |
| Heuristic questions from issue text     | No                        | No                    | Yes              |
| Issue statement auto-sharpening         | Manual only               | Manual only           | CoScout suggests |
| Problem statement formulation           | Manual only               | Manual only           | CoScout assists  |
| Natural language follow-up questions    | No                        | No                    | Yes              |

### 6.2 The PWA as a Teaching Tool

The PWA (free tier) deliberately omits AI features. This is not a limitation — it is a pedagogical choice rooted in the "guided frustration" teaching philosophy.

When an analyst uses the PWA, they must:

- Interpret the charts themselves (no narrative explanation)
- Decide which question to investigate next (no CoScout suggestion)
- Sharpen the issue statement manually (no auto-suggestion)
- Formulate the problem statement on their own (no CoScout assistance)

This struggle builds statistical intuition. The analyst who has manually traced the path from "fill weight is too variable" to "reduce variation on line 3, night shift, heads 5-8, Cpk 0.62 to 1.33" has internalized the EDA methodology in a way that no AI-assisted shortcut can replicate.

Factor Intelligence provides the statistical backbone even in the PWA: the questions are generated, the evidence is ranked, the ruled-out factors are identified. The analyst does the thinking; the tool provides the structure.

### 6.3 CoScout as an Amplifier

In the Azure app with CoScout enabled, AI amplifies the question-driven model without replacing it:

- **Question generation** — CoScout adds heuristic questions that Factor Intelligence cannot derive (from process description, domain patterns, upfront hypotheses)
- **Issue statement sharpening** — CoScout suggests updated phrasing as findings accumulate
- **Problem statement formulation** — CoScout drafts the problem statement from the collection of answered questions
- **Follow-up suggestions** — CoScout proposes investigation directions based on the current state of evidence
- **Methodology coaching** — CoScout explains why a particular factor is important, what the statistics mean, and what to check next

The statistical conclusions remain deterministic. CoScout translates them into language and adds context — it does not generate competing statistics. The conclusion is reproducible and auditable whether or not CoScout was involved.

### 6.4 What This Means in Practice

Consider two analysts investigating the same fill weight problem — one using the PWA, one using Azure with CoScout.

**PWA analyst:** Uploads data, sees Factor Intelligence ranking, clicks through questions, pins findings manually, writes "Night shift, Heads 5-8" in the issue statement, formulates the problem statement by typing it. Time: 15-25 minutes. Learning: deep. The analyst understands every step because they performed every step.

**Azure + CoScout analyst:** Uploads data, sees Factor Intelligence ranking plus CoScout's heuristic questions ("your process description mentions nozzle maintenance — have Heads 5-8 been serviced recently?"). Clicks through questions, pins findings. CoScout suggests "based on your three findings, the issue statement could be sharpened to: fill weight variation on line 3, night shift, heads 5-8." The analyst reviews and accepts. CoScout drafts the problem statement. Time: 8-12 minutes. The analyst reviews and validates rather than generating from scratch.

Both arrive at the same conclusion. Both have the same evidence trail. The difference is speed and cognitive support, not analytical rigor. The question-driven model ensures that both analysts check the same factors and reach evidence-based conclusions.

---

## 7. EDA Across Analysis Modes

> See [ADR-054: Mode-Aware Question Strategy](../07-decisions/adr-054-mode-aware-question-strategy.md) for the architectural decision.

The EDA mental model described above assumes Standard mode — continuous measurement, categorical factors, ANOVA decomposition. VariScout supports four analysis modes, each requiring the methodology to adapt while preserving its core principles.

### 7.1 How the Issue Statement Adapts

| Mode            | Issue Statement Focus                     | Example                                   |
| --------------- | ----------------------------------------- | ----------------------------------------- |
| **Standard**    | Variation in outcome                      | "Fill weight on line 3 is too variable"   |
| **Capability**  | Gap between performance and specification | "Cpk on line 3 is 0.62, target is 1.33"   |
| **Yamazumi**    | Waste in process flow                     | "Assembly line 2 cycle time exceeds takt" |
| **Performance** | Channel-level inconsistency               | "Channels 5-8 have lower Cpk than 1-4"    |

The sharpening process is the same (vague → precise through evidence), but the language and metrics differ.

### 7.2 How the Four Lenses Map to Modes

| Lens                      | Standard                         | Capability                 | Yamazumi                     | Performance                       |
| ------------------------- | -------------------------------- | -------------------------- | ---------------------------- | --------------------------------- |
| **CHANGE** (I-Chart)      | Time-based stability             | Cpk trend across subgroups | Waste metric trend over time | Per-channel Cpk trend             |
| **FLOW** (Boxplot)        | Factor comparison                | Cpk by factor level        | Activity composition by step | Channel distribution              |
| **FAILURE** (Pareto)      | Category ranking by count/impact | Cpk ranking by factor      | Waste type ranking           | Channel Cpk ranking (worst first) |
| **VALUE** (Stats/Summary) | Statistical overview             | Capability indices         | VA ratio, takt compliance    | Worst-channel summary             |

In Yamazumi mode, the **VALUE** lens is primary — lean practitioners start with "are we meeting takt?" and "what is our VA ratio?" before drilling into specific waste types. In Capability mode, the **CHANGE** lens is primary — the Cpk trend reveals whether the process is improving or degrading.

### 7.3 How Factor Intelligence Adapts

Factor Intelligence Layer 1 (Best Subsets R²adj) applies to Standard, Capability, and Performance modes — the data structure is the same (continuous outcome × categorical factors). For Capability mode, the adapter rewords questions: "Which factor affects Cpk?" instead of "Which factor explains variation?"

**Yamazumi mode requires a different approach.** The data is time composition by activity type, not continuous measurements. R²adj ranking does not apply. Instead, a waste composition generator produces lean-specific questions:

1. "Which steps exceed takt time?" (from takt compliance analysis)
2. "Which waste type dominates?" (from Pareto of waste reasons)
3. "Is waste increasing over time?" (from I-Chart of waste metric)

The evidence metric changes too: waste contribution percentage replaces R²adj. The question checklist shows "Waste %" badges instead of "R²adj" badges.

### 7.4 Principle Preservation

Despite these adaptations, the core EDA principles hold across all modes:

- **Questions before answers** — generated from data, not hunches
- **Evidence-ranked** — prioritized by the mode's relevant metric
- **Progressive sharpening** — issue statement evolves through answered questions
- **Multiple causes** — lean investigations often find multiple waste sources
- **Negative learnings** — steps confirmed as within takt are documented
- **AI amplifies** — CoScout already coaches in mode-specific language

---

## 8. Summary

The EDA Mental Model is not a feature — it is the analytical philosophy that informs every design decision in VariScout. The key principles are:

1. **Start vague, end precise.** The Issue Statement accepts uncertainty. The Problem Statement demands specificity. The analysis journey bridges the gap.

2. **Questions before answers.** Factor Intelligence generates evidence-ranked questions from the data. The analyst follows questions, not hunches.

3. **Parallel, not sequential.** The Four Lenses show the same data through four perspectives simultaneously. The analyst sees the whole story, not one chapter at a time.

4. **Progress is measurable.** The cumulative variation bar quantifies how much of the total problem is understood. The question checklist tracks how many questions have been answered.

5. **Multiple causes are normal.** Real processes have multiple sources of variation. The model embraces this rather than forcing a single root cause.

6. **Negative learnings have value.** Ruled-out factors are documented, not discarded. They prevent re-investigation and satisfy audit requirements.

7. **AI amplifies, never replaces.** The statistical backbone works without AI. CoScout adds language, context, and suggestions — not competing conclusions.

8. **The methodology scales.** From a student learning with three factors in the PWA to a Master Black Belt investigating six factors with CoScout guidance in Azure — the same mental model applies.

---

## 8. References

### 8.1 Academic Sources

- Turtiainen, J.-M. (2019). _Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving_. Master's thesis, Lappeenranta-Lahti University of Technology LUT, School of Engineering Science.
- Watson, G.H. (2015b). _Statistical Thinking for Quality Improvement_. [Referenced in thesis for the principle "Statistical Thinking seeks answers to process questions."]
- Watson, G.H. (2019a). _Six Sigma EDA and the issue/problem statement framework_. [Referenced in thesis for Issue Statement and Problem Statement definitions.]
- Shewhart, W.A. (1924). Control chart methodology. [Origin of the Individuals Chart.]
- Tukey, J.W. (1977). _Exploratory Data Analysis_. Addison-Wesley. [Foundation of EDA methodology.]

### 8.2 VariScout Documentation

- [Turtiainen (2019) — Full Thesis Excerpts](references/turtiainen-2019-eda-mental-model.md) — Key definitions, figure descriptions, case study details
- [Question-Driven EDA Design Spec](../superpowers/specs/2026-03-30-question-driven-eda-design.md) — Implementation design for the question-driven investigation flow
- [ADR-052: Factor Intelligence](../07-decisions/adr-052-factor-intelligence.md) — Architecture decision for the three-layer progressive factor analysis
- [ADR-053: Question-Driven Investigation](../07-decisions/adr-053-question-driven-investigation.md) — Architecture decision for the question-driven EDA model

### 8.3 Related VariScout Methodology Documents

- [VariScout Methodology](methodology.md) — Consolidated methodology overview (this document complements it with the EDA-specific mental model)
- [Philosophy](philosophy.md) — EDA mindset, guided frustration pedagogy, AI philosophy
- [Four Lenses](four-lenses/index.md) — Detailed lens descriptions and system dynamics
- [Progressive Stratification](progressive-stratification.md) — Design rationale for filter chip drill-down
- [Two Voices](two-voices/index.md) — Control limits (Voice of the Process) vs specification limits (Voice of the Customer)
