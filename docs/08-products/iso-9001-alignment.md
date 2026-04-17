---
title: 'ISO 9001:2026 Alignment Guide'
audience: [quality-manager, auditor]
category: compliance
status: stable
date: 2026-04-03
---

# ISO 9001:2026 Alignment Guide

How VariScout supports your organization's ISO 9001:2026 quality management system.

---

## Purpose

VariScout is not a Quality Management System (QMS). It is a **quality investigation tool** that helps organizations meet specific ISO 9001:2026 requirements through structured, evidence-based variation investigation and improvement verification.

This guide maps VariScout's capabilities to relevant ISO 9001:2026 clauses. Quality managers and auditors can use it to understand how VariScout fits within their existing QMS and supports compliance objectives.

> **Note on clause numbering:** ISO 9001:2026 (DIS approved, final publication expected September 2026) builds on the 2015 structure with new emphasis on digitalization, data-driven decision-making, and knowledge management. The clause numbers below follow the expected 2026 structure. This document will be updated if the final publication renumbers any clauses.

---

## VariScout's Closed-Loop Investigation Model

VariScout implements a structured four-phase investigation journey with a 5-status finding lifecycle that maps directly to the Plan-Do-Check-Act (PDCA) cycle.

### Four-Phase Journey

| Phase           | Purpose                                | Key Activities                                                        |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| **FRAME**       | Define the investigation scope         | Load data, map columns, set specification limits                      |
| **SCOUT**       | Discover variation patterns            | I-Chart stability check, ANOVA factor analysis, Pareto ranking        |
| **INVESTIGATE** | Build understanding of causes          | Drill-down, hypothesis generation, question-driven validation         |
| **IMPROVE**     | Plan, execute, and verify improvements | Brainstorm ideas, assign corrective actions, verify outcomes with Cpk |

### 5-Status Finding Lifecycle

Every observation follows a documented lifecycle from initial detection to verified resolution:

| Status            | Badge  | Meaning                                     | PDCA Mapping |
| ----------------- | ------ | ------------------------------------------- | ------------ |
| **Observed**      | Amber  | Pattern spotted, not yet investigated       | —            |
| **Investigating** | Blue   | Actively drilling into this finding         | —            |
| **Analyzed**      | Purple | Suspected cause identified                  | Plan         |
| **Improving**     | Cyan   | Corrective actions assigned and in progress | Do           |
| **Resolved**      | Green  | Actions completed, outcome verified         | Check / Act  |

Every status transition is timestamped. The analyst can add comments at any stage to record what was checked and what was learned, creating a complete investigation narrative.

### Three Evidence Types

VariScout requires evidence to support investigation conclusions. Three validation types ensure findings are supported by appropriate evidence:

| Evidence Type | Method                                                            | ISO Relevance                                          |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Data**      | ANOVA eta-squared auto-validation against significance thresholds | Objective measurement evidence (9.1)                   |
| **Gemba**     | Physical go-see inspection tasks with recorded observations       | Process evidence from the production floor (8.5, 10.2) |
| **Expert**    | Domain knowledge assessments from experienced personnel           | Competency evidence (7.2)                              |

A hypothesis can only be marked as "supported" when at least one validation type provides sufficient evidence. This prevents conclusions based on assumption alone.

---

## ISO 9001:2026 Clause Mapping

### Clause 7.1.6 — Organizational Knowledge

**Requirement:** Determine, maintain, and make available knowledge necessary for operating processes and achieving conformity.

**VariScout capability:**

- **Knowledge Base (Team plan):** Resolved findings with verified outcomes feed a searchable knowledge index. Over time, this builds organizational memory of what causes variation and which corrective actions are effective
- **Negative learnings:** Ruled-out factors and disproven hypotheses are preserved in the question tree, documenting what was checked and dismissed. This prevents future teams from re-investigating dead ends
- **Knowledge Catalyst:** The AI assistant (CoScout) draws on the knowledge index to suggest actions based on past successes: "For similar findings, nozzle replacement has a 90% success rate"

**Auditor evidence:** Knowledge Base index, resolved finding count, question tree with ruled-out branches

---

### Clause 8.5 — Production and Service Provision (Control)

**Requirement:** Implement production under controlled conditions, including monitoring and measurement activities, and use of suitable infrastructure and environment.

**VariScout capability:**

- **Factor-based analysis:** ANOVA identifies which process parameters (equipment, material, temporal, operator, location) drive variation, with eta-squared (η²) quantifying each factor's contribution
- **Process stability monitoring:** I-Chart with control limits (UCL/LCL) detects special cause variation in real time
- **Capability tracking:** Cpk/Ppk indices measure how well the process meets specification limits
- **Performance Mode:** Multi-channel monitoring analyzes multiple measurement points simultaneously (e.g., fill heads, nozzles, cavities)

**Auditor evidence:** I-Chart control limit violations, ANOVA results with η² values, Cpk indices, factor contribution rankings

---

### Clause 9.1 — Monitoring, Measurement, Analysis and Evaluation

**Requirement:** Determine what needs to be monitored and measured, the methods, when monitoring shall be performed, and when results shall be analyzed and evaluated.

**VariScout capability:**

| Analytical Method     | Purpose                                      | Output                                               |
| --------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **I-Chart**           | Process stability over time                  | Control limit violations, run rules, trend detection |
| **Boxplot**           | Distribution comparison across factor levels | Median, IQR, outliers by category                    |
| **Pareto**            | Factor contribution ranking                  | Ordered bar chart with cumulative percentage         |
| **ANOVA**             | Statistical significance testing             | F-statistic, p-value, η² (variance explained)        |
| **Cpk / Ppk**         | Process capability assessment                | Capability indices relative to specification limits  |
| **Staged comparison** | Before/after measurement                     | Quantified deltas (mean shift, σ change, Cpk delta)  |

All statistical calculations are deterministic — computed in the browser using validated algorithms. AI explains the results but never generates or modifies statistical values.

**Auditor evidence:** Statistical analysis exports (PNG charts, CSV data), capability indices, ANOVA significance tables

---

### Clause 9.2 — Internal Audit

**Requirement:** Conduct internal audits at planned intervals to provide information on whether the QMS conforms to requirements.

**VariScout capability:**

- **Investigation audit trail:** Every finding, question, status change, hypothesis, and comment is timestamped, creating a complete chronological record of the investigation
- **Question tree:** Documents what was explored (answered questions), what was ruled out (disproven hypotheses), and what remains open (unanswered questions). This is essential for audit evidence — auditors can verify that conclusions are supported by systematic investigation, not assumption
- **Journal tab:** Records the chronological investigation timeline — every question generated, status change, finding, and comment — providing a continuous audit trail that feeds into reports
- **Finding comments:** Timestamped notes on each finding record what the investigator checked and learned at each step
- **Low Impact findings:** Findings classified as "Low Impact" are retained, not deleted. They document what was ruled out: "We checked Machine C — minor contribution." This is valuable for audit trails and prevents re-investigation

**Auditor evidence:** Investigation timeline, question tree export, finding status progression with timestamps, journal entries

---

### Clause 10.2 — Nonconformity and Corrective Action

**Requirement:** When a nonconformity occurs, react to it, evaluate the need for action to eliminate the cause, implement any action needed, review effectiveness, and update risks/opportunities.

**VariScout capability:**

The 5-status finding model directly implements the corrective action lifecycle required by Clause 10.2:

| ISO 10.2 Requirement          | VariScout Implementation                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React to nonconformity        | **Observed** status — pattern detected and recorded                                                                                                                                                                                                     |
| Evaluate the need for action  | **Investigating** → **Analyzed** — drill-down analysis, hypothesis testing, factor contribution measurement                                                                                                                                             |
| Determine root cause          | **Question-driven investigation** — diamond pattern of diverge (generate questions), validate (test each with data/gemba/expert evidence), converge (eliminate contradicted theories). Suspected causes are identified through evidence, not assumption |
| Implement corrective action   | **Improving** status — action items with assignee, due date, completion tracking. Auto-transition from Analyzed when first action is added                                                                                                              |
| Review effectiveness          | **Resolved** status — outcome assessment: effective (yes/no/partial), Cpk before/after, verification notes                                                                                                                                              |
| Retain documented information | All statuses, transitions, comments, and outcomes are timestamped and retained                                                                                                                                                                          |

**Key distinction:** VariScout uses the term "suspected cause" rather than "root cause" throughout. A suspected cause becomes confirmed only when the outcome measurement (Cpk after) shows the corrective action was effective. This honest framing aligns with scientific rigor and prevents premature claims of root cause identification.

**Auditor evidence:** Finding lifecycle from Observed to Resolved with all transitions documented, suspected cause narrative, corrective action completion records, outcome assessment with Cpk before/after

---

### Clause 10.3 — Continual Improvement

**Requirement:** Continually improve the suitability, adequacy and effectiveness of the quality management system.

**VariScout capability:**

- **PDCA built into the journey:** The four-phase investigation model (FRAME → SCOUT → INVESTIGATE → IMPROVE) mirrors the PDCA cycle. Each finding progresses through Plan (investigation), Do (corrective actions), Check (outcome assessment), and Act (verification with Cpk)
- **Improvement ideation:** Structured brainstorming using four directions (Prevent / Detect / Simplify / Eliminate) with feasibility criteria (removes root cause? can we do it ourselves? can we try small? can we measure it?)
- **What-If Simulator:** Projects the impact of proposed improvements on Cpk and yield before implementation, enabling evidence-based investment decisions
- **Cpk before/after verification:** Objective measurement of improvement effectiveness using staged analysis. The projected vs. actual learning loop ("Projected 1.35 → Actual 1.42") builds estimation confidence over time
- **Knowledge Base contribution (Team plan):** Resolved findings with verified outcomes feed the knowledge index, enabling pattern recognition across investigations: "Average Cpk improvement for resolved findings: +0.45"

**Auditor evidence:** Improvement ideas with projections, corrective action completion records, Cpk trend data (before/after), resolved finding outcomes, Knowledge Base index

---

### 2026 Emphasis: Digitalization & Data-Driven Decisions

ISO 9001:2026 adds new emphasis on digitalization, data-driven decision-making, and organizational knowledge management. VariScout directly supports these new requirements:

| 2026 Emphasis             | VariScout Capability                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Digitalization**        | Browser-based tool replacing paper forms and spreadsheets. All investigation data is structured, searchable, and exportable                                |
| **Data-driven decisions** | Statistical evidence (η², Cpk, p-values) quantifies every claim. AI explains but never replaces statistical authority                                      |
| **Knowledge management**  | Resolved findings build a searchable knowledge index (Team plan). Negative learnings are preserved. Question trees document the full investigation journey |
| **Measured outcomes**     | Cpk before/after provides objective verification that improvements are effective, not just implemented                                                     |

---

## Verification: Cpk Before/After

The strongest evidence VariScout provides for ISO compliance is **measured Cpk improvement**. This objective outcome measurement proves that corrective actions were effective:

### How It Works

1. **Baseline measurement (Cpk before):** Captured automatically from the initial analysis or first stage in staged analysis
2. **Improvement projection:** What-If Simulator estimates the expected Cpk after proposed changes
3. **Verification measurement (Cpk after):** Measured from new data collected after corrective actions are implemented
4. **Outcome assessment:** Effective / Not effective / Partial — with the Cpk delta as objective evidence
5. **Projected vs. Actual comparison:** When both projection and actual outcome exist, the card displays the delta: "Projected 1.35 → Actual 1.42 (+0.07)"

### Staged Analysis

For formal verification, VariScout supports **staged analysis** — loading before and after data with a Stage column. The Staged Comparison Card shows:

- Mean shift between stages
- Standard deviation change
- Cpk delta (the key improvement metric)
- Statistical significance of the change

This is the most rigorous verification available: same tool, same statistical methods, measured before and after with quantified deltas.

### ISO Relevance

| Verification Element                                                  | ISO Clause  |
| --------------------------------------------------------------------- | ----------- |
| Measured Cpk improvement demonstrates corrective action effectiveness | 10.2        |
| Quantified deltas provide evidence for management review              | 9.3         |
| Knowledge Base records build organizational improvement history       | 7.1.6, 10.3 |
| Projected vs. actual comparison enables estimation calibration        | 10.3        |

---

## Audit Trail Summary

VariScout creates the following documented information relevant to ISO 9001:2026 audits:

| Record                  | Content                                                                                               | Retention        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| **Finding card**        | Status progression, suspected cause, classification tags, timestamps                                  | Project lifetime |
| **Question tree**       | Investigation questions with status (answered/ruled-out/open), linked hypotheses, validation evidence | Project lifetime |
| **Journal**             | Chronological investigation timeline — every event, status change, and comment                        | Project lifetime |
| **Corrective actions**  | Action text, assignee, due date, completion timestamp                                                 | Project lifetime |
| **Outcome assessment**  | Effectiveness (yes/no/partial), Cpk before/after, verification notes                                  | Project lifetime |
| **Improvement ideas**   | Idea text, direction, timeframe, cost, risk, What-If projection                                       | Project lifetime |
| **Statistical exports** | Chart images (PNG/SVG), data exports (CSV), report PDFs                                               | User-managed     |
| **Knowledge Base**      | Resolved finding outcomes searchable for future investigations (Team plan)                            | Project lifetime |

All records are stored in the customer's own infrastructure (browser IndexedDB for Standard; Azure Blob Storage for Team). No audit data leaves the customer's environment.

---

## What VariScout Is Not

To set clear expectations for auditors:

- VariScout is **not a QMS** — it does not manage document control, management review, or supplier evaluation. It is a quality investigation tool that fits within the customer's existing QMS
- VariScout is **not a CAPA system** — it provides structured corrective action tracking as part of investigation, but does not replace dedicated CAPA software for regulated industries
- VariScout **does not generate compliance certificates** — it provides the evidence and audit trail that supports the customer's own compliance claims
- VariScout's AI **does not make decisions** — the analyst reviews, edits, and confirms all AI suggestions. The statistical engine is the authority; AI adds context and explanation

---

## See Also

- [Security Whitepaper](azure/security-whitepaper.md) — Security architecture for IT procurement evaluation
- [ADR-062: Trust & Compliance Roadmap](../07-decisions/adr-063-trust-compliance-roadmap.md) — Phased approach to formal certification
- [Investigation to Action Workflow](../03-features/workflows/investigation-to-action.md) — Detailed workflow documentation
- [Question-Driven Investigation](../03-features/workflows/question-driven-investigation.md) — Diamond pattern investigation methodology
- [Staged Analysis](../03-features/analysis/staged-analysis.md) — Before/after verification methodology
- [EU AI Act Mapping](../05-technical/architecture/eu-ai-act-mapping.md) — AI regulatory classification
