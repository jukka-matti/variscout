---
title: 'EDA Mental Model Reference — Turtiainen (2019)'
audience: [analyst, engineer]
category: reference
status: stable
related: [eda-mental-model, methodology, investigation]
---

# EDA Mental Model Reference — Turtiainen (2019)

## Citation

Turtiainen, J.-M. (2019). _Exploratory Data Analysis Mental Model for Quality Improvement_. Master's thesis, LUT University, Lappeenranta, Finland.

---

## 1. Core Concepts: Issue vs. Problem Statement

### 1.1 Issue Statement (Section 2.2, p. 16)

Watson (2019a, p. 13) defines an issue as:

> "A concern that arises as a difference between customer expectation and their observations or perceptions with respect to these expectations."

Before defining a problem statement, the analyst should evaluate:

- **Who** does it affect? **Where** is it taking place?
- **What** would be the outcome if the issue is not corrected?
- **When** does this need to be fixed (sense of urgency)?
- **Why** is it important for this to be fixed?

### 1.2 Problem Statement (Section 2.3, pp. 16-17)

A good problem statement answers three questions (Watson, 2019a, p. 17):

1. **What measure needs to be changed?** — Performance measure
2. **How does the measure need to be changed?** — Direction of change of performance
3. **What is the scope of the problem? Where?** — Location where further investigation needs to focus

The distinction is critical: an _issue_ is a vague concern ("delivery times seem too long"), while a _problem statement_ is a precise, measurable, scoped declaration ("reduce cycle time of process step 2 for product A").

---

## 2. The Mental Model (Section 4.1, p. 53)

### 2.1 Four-Step Model with PDCA/DMAIC Alignment

The initial Mental Model has four steps linked to PDCA and DMAIC:

| Step | Activity                                    | PDCA  | DMAIC   |
| ---- | ------------------------------------------- | ----- | ------- |
| 1    | Possible Issue Identification and Selection | Plan  | Define  |
| 2    | Data Collection                             | Do    | Measure |
| 3    | Defined Data Analysis                       | Check | Analyze |
| 4    | Exploratory Data Analysis                   | Act   | Analyze |

**"Check with the Sponsor"** is the decision point where results are shared with the process owner, who decides whether to proceed to Improve or loop back for further analysis.

### 2.2 Figure 28 — Mental Model for EDA (p. 53)

> Four-step model with the PDCA cycle at center. Steps flow sequentially: Possible Issue Identification -> Data Collection -> Defined Data Analysis -> Exploratory Data Analysis -> Check with Sponsor -> Improve (or loop back to earlier steps).

---

## 3. Step 1: Possible Issue Identification (Section 4.2, pp. 54-56)

### 3.1 Activities in Step 1 (Figure 30)

1. **Possible Issue Identification**: "What has caught management's attention? What could be the problem? Which factors affect the process?"
2. **Prioritize Issues and Selection**: "Which issues affect the process most? How easy is data to collect?"
3. **Defining Analysis**: "Which analytical tools to use?"

### 3.2 Analysis Plan Output (Figure 31)

The output of Step 1 is a first version of the analysis plan containing:

- **Issue Statement** — What is the concern?
- **Factors (X's)** — Which variables to investigate?
- **Data Collection specs** — What data, how much, from where?
- **Analytical Tools** — Which charts and statistical methods?
- **Scope** — Boundaries of the investigation

### 3.3 Updated Planning with 5W+1H (Figure 42, p. 77)

The analysis planning activities were updated to include structured questioning:

- **Possible Issue/Problem Identification** — with 5W+1H: What happened? Who was there? When? Where? Why? How?
- **Prioritization of Possible Issues/Problems**
- **Defining Analysis** — which analytical tools?
- **Defining Data Collection**

---

## 4. Three EDA Levels (Section 6.1, pp. 73-83)

Each level of EDA is progressively deeper, narrowing from broad concern to actionable scope.

### 4.1 Level 1 — Issue Statement (pp. 74-75, Figure 40)

- **Focus**: Y-measure analysis, high-level sub-groups
- **Output**: Issue Statement
- **Example**: "Production throughput time of product A is five hours longer than planned."

### 4.2 Level 2 — Problem Statement (pp. 75-77, Figure 41)

- **Focus**: Process flow details, middle-level X's
- **Output**: Problem Statement
- **Example**: "Decrease cycle time of process step 2 for product A."

### 4.3 Level 3 — Solutions Space (p. 78, Figure 43)

- **Focus**: Operational details, product/process X's
- **Output**: Solutions Space
- **Example**: "Process step 2 for shift 2 and machine M for product A containing part B."

---

## 5. Logic of EDA (Section 6.1.4, pp. 79-80)

### 5.1 The Inner Loop (Figure 44)

The EDA inner loop follows its own PDCA-like cycle:

**Exploratory Analysis Planning -> Data Organizing (filtering/sorting) -> Exploratory Analysis -> Evaluation**

### 5.2 Three Evaluation Outcomes

At the Evaluation step, three outcomes are possible:

1. **Output for next phase** — produce the issue statement, problem statement, or solutions space and advance to the next level
2. **Trigger for another rotation at the same level** — additional issues to check at the current depth
3. **Trigger for deeper exploration** — more detail is needed, drill down further

> "This type of iteration with the Exploratory step occurs frequently and the iteration acts like a progressive revelation of the process knowledge."
>
> — Turtiainen (2019, p. 80)

---

## 6. From Undesired Performance to Solutions Space (Section 6.1.5, pp. 82-83)

### 6.1 Complete Progression Example (Figure 47)

A complete Level 1 -> 2 -> 3 progression:

**Level 1**

- Issue Statement: "Assembly time of product A is too high"

**Level 2**

- Potential Issue: "Process step 2 is the bottleneck"
- Problem Statement: "Decrease cycle time of process step 2 for product A"

**Level 3**

- Potential Problem: "When product A contains part B, cycle time is higher"
- Solutions Space: "Process step 2 for shift 2 and machine M for product A containing part B"

---

## 7. Analysis Planning Template

Based on Figures 31 and 42, the analysis plan template captures:

| Field                   | Description                          | Example                                  |
| ----------------------- | ------------------------------------ | ---------------------------------------- |
| Issue/Problem Statement | Current understanding of the concern | "Assembly time of product A is too high" |
| 5W+1H                   | What, Who, When, Where, Why, How     | Structured context gathering             |
| Factors (X's)           | Variables to investigate             | Shift, Machine, Part type                |
| Data Collection         | What data, how much, source          | Last 6 months, MES system                |
| Analytical Tools        | Charts and methods to apply          | I-Chart, Boxplot, Pareto, ANOVA          |
| Scope                   | Boundaries of investigation          | Product A, Line 2                        |

---

## 8. Case Study: Supplier Delivery Analysis (Section 8.2, pp. 91-99)

### 8.1 Four EDA Loop Iterations (Figure 58)

**Trigger**: "Some parts are delivered later than others by supplier JDK" (vague concern)

**EDA Loop 1**: Boxplot by Parts -> Parts O and Q are worst performers.

- Updated statement: "Parts O and Q have been delivered late"

**EDA Loop 2**: Boxplot of Part O by Factor 1 and Factor 2 -> Factor 1=K, Factor 2=F are late.

**EDA Loop 3**: Same analysis for Part Q -> confirms the same pattern (Factor 1=K, Factor 2=F).

**EDA Loop 4**: Both parts with Factor 1=K, Factor 2=F analyzed by time -> Period E is worst.

**Final Issue Statement**: "Deliveries of Parts O and Q with Factors 1=K and 2=F have been bad in time period E."

This case demonstrates the progressive narrowing from a vague trigger to a precise, actionable statement through four iterations of the EDA inner loop.

---

## 9. Analytical Tools Sequence (Figure 35, p. 60)

The thesis defines a recommended sequence of analytical tools:

1. **Individuals Chart** — detect shifts, trends, and special causes over time
2. **Probability Plot** — assess distribution normality
3. **Capability Analysis** — evaluate process against specification limits
4. **Pareto Chart** — identify dominant factors
5. **Analysis of Variance (ANOVA)** — test statistical significance of factor effects
6. **Yamazumi Diagram** — visualize cycle time composition (lean context)
7. **Trigger for exploratory analysis** — decide next iteration

This sequence moves from understanding the process behavior (time series) through distribution assessment and capability, then into factor analysis and root cause investigation.

---

## 10. Key Figures Reference

Since figures cannot be embedded, the following describes key diagrams from the thesis:

### Figure 28 — Mental Model for EDA (p. 53)

Four-step cyclical model with PDCA at center. Sequential flow from Issue Identification through Data Collection, Defined Analysis, and Exploratory Analysis, with a "Check with Sponsor" gate before Improve.

### Figure 35 — Set of Analytical Tools (p. 60)

Linear sequence: Individuals Chart -> Probability Plot -> Capability Analysis -> Pareto Chart -> ANOVA -> Yamazumi Diagram -> Trigger for exploratory analysis.

### Figures 40-43 — Three EDA Levels (pp. 74-78)

Three diagrams showing progressive depth: Level 1 (Y-measure, high-level groups), Level 2 (process flow, mid-level X's), Level 3 (operational details, product/process X's). Each level produces a more specific output.

### Figure 44 — Logic of EDA Inner Loop (pp. 79-80)

Four-phase cycle: Exploratory Analysis Planning -> Data Organizing -> Exploratory Analysis -> Evaluation, with three possible evaluation outcomes (advance, rotate, drill deeper).

### Figures 45-46 — Mind Maps of Analyzed Sub-groups (pp. 81-82)

Progressive drill-down through factor hierarchy: Parts (A/B/C) -> Process step 2 -> Shift (1/2/3) -> Machines (J/M/T). Visual coding: dark boxes = currently in focus, white boxes = already analyzed, grey boxes = identified but not yet explored.

### Figure 47 — From Undesired Performance to Solutions Space (pp. 82-83)

Complete three-level progression example showing how an initial vague concern ("assembly time too high") narrows through issue statement, problem statement, and finally to a precise solutions space.

### Figure 58 — Case Study: Four EDA Iterations (pp. 91-99)

Supplier delivery analysis showing four iterations of the EDA loop, progressively adding factors (Part -> Factor 1 -> Factor 2 -> Time period) until reaching an actionable issue statement.
