---
title: Process Learning Operating Model
audience: [product, designer, engineer, analyst]
category: design-spec
status: draft
related:
  [
    methodology,
    process-hub,
    question-driven-eda-2,
    frame-process-map,
    evidence-sources,
    data-profiles,
    process-flow,
    yamazumi,
    capability,
    survey,
    signal-cards,
    sustainment,
  ]
date: 2026-04-27
---

# Process Learning Operating Model

## Summary

VariScout should be designed as a process learning system, not as a collection
of statistical modes. The Process Hub is the operating home for one process. A
Process Measurement System converts recurring evidence into Current Process
State. Current Process State then triggers quick actions, investigations,
charters, sustainment checks, or handoffs.

The strongest methodology insight is the three-level view of
process understanding (faithful to VariScout's existing Y / X / x EDA spine
documented in `docs/01-vision/eda-mental-model.md` Section 5.2):

1. **System / outcome level** - what the customer or business must experience.
2. **Flow / process model level** - what flows through which steps, at what
   rate, with which waits, handoffs, and bottlenecks.
3. **Local mechanism / evidence level** - the actual physics, recipe,
   equipment, material, operator, environment, subgrouping, and evidence behind
   the flow.

The current SIPOC-style FRAME process map remains useful, but it is one lens
inside this model. It should not become the whole method. The product should
help a team move from one dataset to process understanding, then to repeatable
Evidence Sources, Current Process State, Process Hub cadence, and
sustainment/control handoff.

## Product Thesis

VariScout's wedge is not deep integration into ERP, MES, QMS, or BI systems.
The wedge is structured process learning from customer-owned evidence.

```text
downloaded export -> dataset -> investigation project -> process understanding
-> recurring Evidence Source -> Current Process State -> response path
-> updated measurement system
```

This keeps the product aligned with the current architecture:

- **Interface, not integration.** CSV and Excel exports are valid first-class
  evidence. VariScout should not start by writing SQL against customer systems.
- **Process learning before statistics.** Statistics are instruments for
  answering process questions. They are not the product's primary mental model.
- **Customer-owned data.** Browser processing, local cache, and customer-tenant
  Blob Storage remain the trust boundary.
- **Deterministic authority.** The stats engine, Survey, Signal Cards, and
  user-confirmed evidence remain authoritative. CoScout explains and drafts.
- **Quality systems are not improvement systems.** FDA, ISO, QMS, and BI
  dashboards can protect consistency or visibility, but they do not by
  themselves create durable process learning.
- **Shared process context.** Process Hub artifacts should be readable by
  humans and structured enough for CoScout grounding without promising an open
  AI-agent platform.

## Core Vocabulary

| Concept                        | Meaning                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| **Process Learning System**    | VariScout's overall product thesis: structured learning from evidence   |
| **Process Hub**                | Operating home for one process, team, cadence, and accumulated learning |
| **Process Measurement System** | Designed measures, evidence sources, snapshots, trust, and cadence      |
| **Current Process State**      | Latest process-owner review surface across outcome, flow, x, and trust  |
| **Investigation**              | Structured reasoning loop from Current Process State to response        |
| **Response Path**              | Quick action, focused investigation, charter, sustainment, or handoff   |
| **CoScout**                    | Product assistant grounded in shared process context                    |

The customer-facing promise should stay practical: VariScout creates a shared,
evidence-backed process context for teams, and CoScout uses that context to
explain, draft, and guide investigation work. Internally, every durable Process
Hub artifact should be structured for both human review and CoScout grounding:
readable, evidence-linked, deterministic-stat aware, and customer-owned.

## Operating And Problem-Solving Loops

The core operating loop is:

```text
Process Measurement System
-> Current Process State
-> trigger / prompt
-> investigation or immediate response
-> response path
-> updated Process Measurement System
```

The distinction matters for product design:

| Loop                               | Product expression                                                        |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Process operating loop             | Process Hub cadence, Current Process State, Evidence Sources, sustainment |
| Investigation problem-solving loop | FRAME -> SCOUT -> INVESTIGATE -> IMPROVE                                  |
| Evidence learning loop             | Snapshot -> Signal Cards -> Survey readiness -> updated source contract   |
| Response loop                      | Quick action, focused investigation, charter, sustainment, or handoff     |
| Shared process-context loop        | Human review and CoScout grounding over the same evidence-backed records  |

Historical note: Xerox Leadership Through Quality is a useful analogy because
it distinguished process improvement work from specific problem solving. It is
not a template to copy, and VariScout should not use QIP/PSP as the primary
product language.

## Process Measurement System And Current Process State

Current Process State is not a claim that the process is stable. It is the
latest structured read of the process measure system:

| Measure family               | What it answers                                                             |
| ---------------------------- | --------------------------------------------------------------------------- |
| **Outcome / Y measures**     | Are we meeting the customer, business, or specification requirement?        |
| **Capability structure**     | Is the issue spread, centering, subgroup movement, or gap to target Cpk?    |
| **Flow measures**            | Is the process moving as expected through rate, wait, queue, or bottleneck? |
| **Known x-control measures** | Are known controllable drivers inside their expected operating window?      |
| **Trust measures**           | Can we trust the current reading, sample, subgroup, MSA, or source mapping? |

For capability, the Current Process State should distinguish:

- **Cpk vs target Cpk** - whether current performance is good enough.
- **Cp-Cpk gap** - how much potential capability is lost through centering.
- **Cp/Cpk over subgroups or snapshots** - how capability itself is moving.
- **sample size, power, and measurement trust** - whether the conclusion is
  safe enough to act on.

The Process Measurement System is the designed layer underneath that state. It
includes stable measure definitions, Evidence Sources, Data Profiles,
Snapshots, Signal Cards, Survey readiness, subgroup logic, targets, and cadence
rules. Investigations improve the system by adding, validating, retiring, or
refining measures, known x's, trust rules, controls, and response logic.

## The Three Levels

The process-learning levels generalize the existing three-level EDA and
problem-solving model:

| Existing investigation language | Product-wide process-learning language |
| ------------------------------- | -------------------------------------- |
| Y: problem condition            | System / outcome                       |
| X: where it concentrates        | Flow / process model                   |
| x: local mechanism              | Local mechanism / evidence             |

The Process Flow lens has a parallel translation: line level, station level,
and activity level. The question tree can still stop at three levels for UX
clarity, but the reason is methodological: the user is moving from outcome to
flow to local mechanism.

### 1. System / Outcome Level

This level asks:

```text
What result must the process deliver, who owns it, and is it meeting the
requirement?
```

Typical users:

- process owner
- OpEx lead
- GB/BB
- sponsor
- quality or operations leader

Typical evidence:

- CTS / Y-of-Ys
- customer or business requirement
- process owner cadence
- current capability or service level
- open verification and sustainment items
- Process Hub rollup across investigations and Evidence Sources

Product surfaces:

- Process Hub
- cadence review
- Survey rollup
- sustainment/control handoff
- report summary

### 2. Flow / Process Model Level

This level asks:

```text
What entity flows through which steps, at what rate, and where does the flow
lose time, quality, or capacity?
```

Typical users:

- process engineer
- lean practitioner
- local process owner
- analyst
- team lead

Typical evidence:

- process steps
- CTQ per step
- throughput, rate, cycle time, lead time, wait time
- bottleneck and handoff evidence
- step-level factors and input conditions
- Process Flow and Yamazumi linkage

Product surfaces:

- FRAME process map
- Process Flow
- Yamazumi full-line or scoped-step view
- flow clues in QDE 2.0 branches
- measurement-gap report

The existing SIPOC-style map belongs here. It should become a flow lens that can
be read as SIPOC, Y=f(x), or process flow, depending on the user's task.

### 3. Local Mechanism / Evidence Level

This level asks:

```text
What local mechanism, recipe, setting, condition, or measurement issue explains
the pattern?
```

Typical users:

- local process owner
- operator or gemba observer
- maintenance or process expert
- quality engineer
- data analyst

Typical evidence:

- recipe, procedure, sequence, delay, and settings
- equipment class, material state, operator practice, environment
- rational subgroup axis
- sample size, power, and measurement trust
- gemba and expert validation
- Cp/Cpk over samples or subgroups
- Cp-Cpk gap as centering loss

Product surfaces:

- Investigation Wall / Mechanism Branches
- Signal Cards
- subgroup capability
- gemba and expert validation tasks
- local Yamazumi activity detail
- Survey power/trust recommendations

This is where process physics matters. Granulation, coating, and nanoforming may
share a higher-level product family, but they are not the same local process.
The local owner owns the physics, recipe, constraints, and operating conditions.

## Global And Local Ownership

The model should make ownership visible.

| Role                 | Owns                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| Global process owner | comparable outcomes, common metrics, portfolio patterns, standards, cadence |
| Local process owner  | process physics, recipe, constraints, operating windows, local improvement  |
| Analyst / GB / BB    | evidence quality, structured investigation, statistical interpretation      |
| Gemba contributor    | observations, photos, checks, local facts, task completion                  |
| Data / admin partner | export contracts, snapshot files, Blob Storage, profile enablement          |
| Sponsor              | priority, resources, charter decision, whether to improve or sustain        |

VariScout should support comparison without false aggregation. For example, a
global owner can compare capability patterns across tabletting families, but
Cp/Cpk from unrelated local processes should not be treated as additive.

## Analysis Modes Are Question-Driven

Analysis modes stay analysis modes — both in code and in copy. What changes is
the user-facing entry: instead of asking "which mode?", we frame the question
as "what level and question are we working on?", and the deterministic mode
inference picks the right mode from process understanding and data shape.

| Mode         | Primary level                     | Primary question                                           |
| ------------ | --------------------------------- | ---------------------------------------------------------- |
| Standard EDA | Outcome -> flow -> local evidence | Where does variation concentrate?                          |
| Capability   | Outcome and local evidence        | Is the process meeting spec consistently?                  |
| Performance  | Outcome and flow                  | Which channel, head, cavity, or line is weakest?           |
| Defect       | Outcome and flow                  | Where do failures concentrate and what burden do they add? |
| Process Flow | Flow                              | Where does time, rate, wait, or bottleneck loss live?      |
| Yamazumi     | Flow -> local mechanism           | What work content or waste explains the selected step?     |
| Survey       | All levels                        | What can this evidence support, and what is missing?       |

Mode inference (`resolveMode()` + `getStrategy()` in `packages/core/src/strategy/`)
remains the dispatch point. The UX explains the inferred mode as a consequence
of process understanding and data shape.

## Investigations And Response Paths

Investigations are the structured reasoning loop between Current Process State
and action. They explain what changed, where it changed, why it may have
changed, whether the signal is trustworthy, and which response path fits.

An investigation can do more than discover a new x:

| Investigation job            | Example                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| Find a new x                 | Material temperature was not known to drive variation.                |
| Check which known x changed  | Cpk dropped; compare setup, nozzle wear, batch, and cleaning delay.   |
| Validate a suspected x       | Confirm whether a handover change explains the latest state.          |
| Scope the problem            | Determine whether the issue is one line, product, shift, or step.     |
| Separate spread vs centering | Cp is acceptable but Cpk dropped, so centering loss is likely.        |
| Resolve trust gaps           | Check sample size, MSA, subgrouping, source mapping, or missing data. |
| Verify an action             | Compare post-action snapshots with the expected movement.             |
| Choose the response path     | Decide quick action, focused work, charter, sustainment, or handoff.  |

Response paths should be visible in Process Hub cadence:

| Response path                     | When it fits                                                        |
| --------------------------------- | ------------------------------------------------------------------- |
| **Quick team action**             | Cause is obvious enough, low-risk, reversible, and locally owned.   |
| **Focused investigation**         | Pattern is real, but mechanism, subgroup, trust, or scope is open.  |
| **Chartered improvement project** | High impact, cross-functional, expensive, regulatory, or unclear.   |
| **Sustainment review**            | Improvement is verified and should stay checked in VariScout.       |
| **Control handoff**               | Live control belongs in MES, QMS, SCADA, BI, Jira, or another tool. |

Current Process State can trigger any of these paths. For example, a widening
Cp-Cpk gap may trigger centering-loss investigation; a known x outside its
operating window may trigger a quick team action; repeated patterns across
snapshots may trigger a chartered project; a trust warning may trigger
measurement-system work before process action.

## Upload And Maturity Path

The current upload path parses and detects data mechanics first. That stays
necessary, but the product should add a process-understanding step after parse:

1. **Evidence intake.** Parse CSV, Excel, paste, or snapshot file. Detect
   columns, data shape, time, specs, and candidate instruments.
2. **Level read.** Show what level the evidence appears to describe: outcome,
   flow, local mechanism, or measurement trust.
3. **FRAME lenses.** Let the user map CTS, CTQs, process steps,
   input/condition columns, subgroup axes, hunches, and gaps.
4. **Investigation project.** SCOUT, INVESTIGATE, and IMPROVE build Current
   Understanding and Mechanism Branches.
5. **Promote learning.** Attach the project to a Process Hub and decide whether
   the source should become recurring evidence.
6. **Evidence Source.** Confirm the export contract, Data Profile where
   applicable, cadence, mapping, validation, and snapshot history.
7. **Process Measurement System.** Define the stable measures, targets,
   subgroup logic, trust checks, known x-controls, and cadence rules.
8. **Current Process State.** Use latest snapshots to review outcome, flow,
   x-control, capability structure, and trust.
9. **Response path.** Route the state to quick action, focused investigation,
   chartered project, sustainment review, or control handoff.
10. **Sustainment / handoff.** Keep periodic review in VariScout when that is
    enough. Hand off to MES, QMS, SCADA, BI, Jira, or ticketing when live
    operational control is needed.

## Current Implementation Reality

The repo already has several parts of this model:

- `ProcessContext.processMap` stores the FRAME map: steps, CTS, CTQs,
  input/condition columns, subgroup axes, and hunches.
- `detectGaps()` and `inferMode()` already connect map shape, data columns, and
  instrument eligibility.
- QDE 2.0 already defines Current Understanding, Problem Condition, Mechanism
  Branches, and Signal Cards.
- Process Flow + Yamazumi already describes the locator/microscope pattern.
- Process Hub metadata already summarizes process maps, investigations, Survey,
  signals, actions, and sustainment projections.
- Evidence Source, Data Profile, Evidence Snapshot, and Profile Application
  types exist in core, and Azure has an initial Agent Review Log evidence panel.
- ADR-038 and Process Moments already support the capability-state direction:
  Cpk vs target, Cp/Cpk over rational windows, and Cp-Cpk gap as centering loss.

The current gaps:

- upload still starts as parse/detect/mode mechanics rather than process-level
  intake
- Current Process State is not yet a first-class Process Hub review object
- Process Measurement System is not yet named as the stable measure/evidence
  layer behind Process Hub cadence
- response paths are present as actions, sustainment, and charter candidates,
  but not yet one explicit routing model
- the process map can show a flow skeleton but not the full three-level capability view
- process edges, rates, waits, recipe/settings, and local operating windows are
  not first-class process-model concepts
- ordinary process datasets cannot yet be promoted cleanly into recurring
  Evidence Sources
- public terminology still leaks "tributary" in places where users should see
  "process input" or "condition"
- Cp/Cpk stability needs clearer product treatment: Cpk over subgroups/samples
  and Cp-Cpk gap as centering loss
- sample size, power, and measurement trust need to be visible as protection
  against overclaiming

## World-Class Product Evaluation Checklist

A product team evaluating this direction should ask:

1. **Existence.** Why should VariScout exist when users already have Excel,
   Power BI, Minitab, QMS, MES dashboards, Jira, and consultants?
2. **Wedge.** Does the product own structured process learning better than those
   alternatives, without trying to become a generic integration platform?
3. **Users.** Can each user see their role: process owner, local owner, analyst,
   gemba contributor, data partner, sponsor?
4. **State.** Does the Process Hub show Current Process State across outcome,
   flow, x-control, capability structure, and trust?
5. **Loops.** Is the screen supporting the Process Hub operating loop, the
   investigation loop, the Evidence Source loop, or the response loop?
6. **Levels.** Does the user know whether they are working at outcome, flow, or
   local mechanism level?
7. **Evidence.** Does the product separate what is known, what is inferred, what
   is missing, and what must be checked by gemba/expert/data?
8. **Trust.** Are power, sample size, measurement trust, and subgroup logic
   visible before conclusions become recommendations?
9. **Response.** Can the user choose quick action, focused investigation,
   chartered project, sustainment, or handoff from the same review logic?
10. **Ownership.** Does the product avoid false global aggregation while still
    helping global owners compare patterns?
11. **Path to cadence.** Can a one-off dataset become a reusable Evidence Source
    and Process Hub review object?
12. **CoScout grounding.** Are artifacts structured enough for CoScout to
    explain and draft without becoming the authority?
13. **Boundary.** Is VariScout clear that it is not live monitoring, generic BI,
    generic task management, a QMS replacement, or a deep ERP/MES integration?

## Non-Goals

- No custom ERP, MES, QMS, CRM, SCADA, or ticketing integration as the first
  wedge.
- No live alarms or shift-critical escalation promise.
- No open AI-agent platform, autonomous process-control promise, or external
  agent access commitment.
- No claim that static SIPOC mapping is sufficient process understanding.
- No attempt to make every analysis mode a separate user journey.
- No automatic root-cause claim from statistical association.
- No additive Cp/Cpk summaries across unrelated local processes.

## Implementation Direction

This spec should drive several later implementation plans:

1. **Methodology documentation alignment.** Update the public methodology to
   describe Process Learning System, Process Hub, Process Measurement System,
   Current Process State, investigation loop, response paths, and CoScout
   grounding.
2. **Current Process State design.** Make Process Hub cadence show latest
   outcome, flow, known x-control, capability-structure, and trust measures.
3. **Upload-to-FRAME redesign.** Add a process-understanding intake after parse
   that classifies evidence by level and proposes map/lens work.
4. **FRAME lens model.** Evolve the current process map into level-aware lenses:
   outcome, flow, local mechanism, evidence/trust, and cadence.
5. **Response-path routing.** Let Current Process State trigger quick action,
   focused investigation, chartered project, sustainment review, or handoff.
6. **Evidence Source promotion.** Let a useful project/export become a recurring
   Process Hub source with snapshot history.
7. **Capability improvement.** Make Cpk over subgroups/samples and Cp-Cpk gap a
   primary capability story, with sample-size/power warnings.
8. **Terminology cleanup.** Keep `tributary` as internal code if needed, but use
   "process input" and "condition" in user-facing language.

## See also

- Investigation scope (B1/B2 unified) and drill patterns (Hub→Step / Step→Channels / Step→Sub-flow / Org Hub-of-Hubs) are designed in [Investigation Scope and Drill Semantics](./2026-04-29-investigation-scope-and-drill-semantics-design.md).
- The three levels above are operationalized as a level-spanning surface architecture in [Multi-level SCOUT design](./2026-04-29-multi-level-scout-design.md); the structural boundary policy that keeps each level owned by exactly one surface is captured in [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).

## References

- Carnegie Mellon Software Engineering Institute, _The Subject Matter of
  Process Improvement_ (1995), section on Xerox QIP / PSP:
  https://www.sei.cmu.edu/documents/1126/1995_005_001_16379.pdf
- Gitlow and Loredo, _Total Quality Management at Xerox: A Case Study_,
  Quality Engineering, 1993:
  https://scholarship.miami.edu/esploro/outputs/journalArticle/TOTAL-QUALITY-MANAGEMENT-AT-XEROX-A/991031577658102976
- ASQ, _Advanced Problem Solving at Xerox_, 1997:
  https://asq.org/quality-resources/articles/case-studies/advanced-problem-solving-at-xerox?id=a28f04a4a9fb4e0585d50021dc6f17a7
