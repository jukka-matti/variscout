---
title: Process Hub - Work-System Context for Team Improvement
audience: [product, designer, engineer]
category: design-spec
status: draft
related:
  [
    process-hub,
    question-driven-eda-2,
    frame-process-map,
    engagement-profile-raci,
    process-flow,
    improvement-workspace,
    portfolio,
    agent-review-log,
  ]
date: 2026-04-25
---

# Process Hub

## Summary

VariScout should move from a project-first entry model to a **Process Hub first**
model. A Process Hub is the organizational home for one process, production line,
cell, queue, value stream, or business flow. It gives the process owner and the
improvement team one place to see what is being investigated, what is being
changed, who owns the work, what is waiting for verification, and what learning
needs to be sustained.

The internal architecture concept can be `WorkSystem`, but the user-facing name
is **Process Hub**.

Process Hub does not replace the existing VariScout investigation spine. It
contains investigations that still follow the VariScout logic:

```text
Issue / Concern
-> Current Understanding
-> Problem Condition
-> Mechanism Branches
-> Ideas / Actions
-> Verification
-> Control handoff
```

## Why This Change

Customers asking how VariScout integrates into ERP, MES, QMS, call-center, or
business-process systems are often asking a management question, not only a data
source question:

- What improvement work is active on this process right now?
- Who owns each investigation and action?
- Which changes are planned this week?
- Which improvements came from larger LSSGB projects versus local team work?
- Which actions are waiting for verification data?
- Which resolved improvements need to become standard work or control checks?

The current project portfolio answers "which saved investigations exist?" A
Process Hub answers "what is happening to this process, why, and did it work?"

This makes VariScout the structured improvement layer around existing management
systems. ERP, MES, QMS, CRM, ACD, or workflow tools remain the source systems.
VariScout turns their data and the team's observations into evidence-backed
learning, action, verification, and sustainment handoff.

## User-Facing Model

### Process Hub

A Process Hub represents the organizational asset being improved:

- Line 4 sachet filling
- Claims queue
- Order-to-cash
- Supplier intake
- Station 3 assembly cell
- Outpatient waiting-time process

Each hub has a process owner or accountable role. Different investigations
inside the hub can be led by different people.

### Investigation

An Investigation remains the core VariScout unit. It can be small or formal, but
it uses one method with different depth:

| Depth         | Meaning                                                           | Example                                 |
| ------------- | ----------------------------------------------------------------- | --------------------------------------- |
| **Quick**     | Small local issue, one or two clues, action and verify quickly    | "Label jam after changeover"            |
| **Focused**   | Needs several checks or one mechanism branch                      | "Night shift overfill on Heads 5-8"     |
| **Chartered** | Formal LSSGB or DMAIC-style work with sponsor, target, and report | "Reduce Line 3 scrap from 4.2% to 1.5%" |

Depth is progressive. A Quick investigation can become Focused. A Focused
investigation can become Chartered when the scope, risk, or organizational
impact grows.

### Ownership

Process Hub should distinguish process accountability from investigation and
action responsibility:

| Role                  | Meaning                                                             |
| --------------------- | ------------------------------------------------------------------- |
| Process owner         | Accountable for process health and improvement load                 |
| Investigation owner   | Drives a specific investigation day to day                          |
| Sponsor / accountable | Owns priority, resources, and escalation for larger work            |
| Contributors          | Operators, agents, maintenance, quality, SMEs, or process engineers |
| Action owners         | Responsible for specific implementation or validation tasks         |

This extends the Engagement-profile RACI direction without turning VariScout
into a generic project-management tool.

## Investigation Status

Process Hub needs investigation-level status, not only finding-level status.
Status should map to the EDA 2.0 journey:

| Status               | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| **Issue captured**   | A concern exists, but process, measure, or data scope is not yet framed |
| **Framing**          | Process context, measure, data, and scope are being clarified           |
| **Scouting**         | Data and clues are being explored                                       |
| **Investigating**    | Mechanism branches, checks, gemba, or expert input are active           |
| **Ready to improve** | A Problem Statement or branch is strong enough to act on                |
| **Improving**        | Actions are in progress                                                 |
| **Verifying**        | Waiting for post-action evidence or staged comparison                   |
| **Resolved**         | Outcome has been measured                                               |
| **Controlled**       | A control or standard-work handoff exists                               |

Status can be derived where possible from existing findings, questions, hubs,
actions, and outcomes. It should only be stored directly when the derived state
is not expressive enough for portfolio or hub rollups.

## Process Hub Dashboard

The Process Hub dashboard is for the process owner, team leader, and
improvement team. It should show:

- Active investigations, grouped by depth and status.
- Current Understanding and Next Move for each active investigation.
- Owners, contributors, and due items.
- Open actions across all investigations for the process.
- Changes planned or active this week.
- Verification waiting for new data or gemba confirmation.
- Recently resolved outcomes and measured effect.
- Control handoff queue for improvements that should update standard work,
  inspection plans, checklists, or reaction plans.

Example investigation card:

```text
Night shift overfill on Heads 5-8
Focused | Investigating | Owner: Eeva
Current understanding: variation is concentrated on Night shift, Heads 5-8.
Next move: inspect nozzle wear during Night shift.
2 clues | 1 mechanism branch | 1 gemba check due today
```

## Data And Integration Boundary

Process Hub does not require VariScout to become an integration platform. The
first version should remain compatible with the customer-owned data principle:

- Data enters through paste, upload, append, customer-owned Blob sync, or
  later customer-controlled export drops.
- ERP, MES, QMS, CRM, ACD, or workflow systems remain systems of record.
- VariScout references data source context and evidence origin, but it does not
  become a live MES, QMS, ticketing, or alarm system.
- CoScout can use hub, investigation, document, and knowledge context, but the
  deterministic stats engine remains the authority for computed evidence.

## Agent-Assisted Process Steps

External AI agents can be treated as steps inside a Process Hub when they
support or gate real work. The agent itself stays in the customer's AI platform;
VariScout imports review logs as process data and helps the process owner
improve the agent-assisted workflow.

The first profile is
[Agent Review Log Profile](2026-04-26-agent-review-log-process-hub-design.md).
It focuses on safe green throughput:

- increase the share of green pass-through decisions
- prove green correctness through sampled audits and downstream outcomes
- reduce yellow/red review burden by improving inputs, policy clarity,
  prompt/tool configuration, routing, or local work standards
- keep false-green rate as a visible guardrail

This should not create a separate AI-quality product, live monitoring surface,
or global ownership hierarchy. In Process Hub terms, it is one investigation
type within the same Issue / Concern -> Current Understanding -> Problem
Condition -> Mechanism Branches -> Ideas / Actions -> Verification -> Control
handoff flow.

## Relationship To EDA 2.0

EDA 2.0 is the investigation language inside Process Hub:

- Process Hub shows investigation rollups.
- EDA 2.0 defines what an investigation is learning.
- Current Understanding is the Process Hub summary line for active work.
- Problem Condition is the measurable gap shown on hub cards.
- Mechanism Branches explain why action is being considered.
- Next Move tells the team what to do next.
- Signal Cards and Survey later improve trust, power, and data readiness.

Implementation should land **EDA 2.0 Phase 1 before Process Hub product code**:

1. Rename upfront "Problem Statement" surfaces to Issue / Concern.
2. Add Current Understanding.
3. Add Problem Condition.
4. Make Problem Statement an approved output.

Without that vocabulary, Process Hub would likely preserve the older
project/finding-centered language and need rework.

## Phasing

### Phase 0 - Documentation Alignment

- Create this Process Hub spec.
- Cross-link EDA 2.0 and Process Hub.
- Update top-level positioning and overview language.
- Keep existing project portfolio docs truthful until implementation begins.

### Phase 1 - EDA 2.0 Vocabulary Foundation

- Implement Issue / Concern, Current Understanding, Problem Condition, and
  approved Problem Statement.
- Keep the current data model as much as possible.
- Preserve existing investigations through migration or derived selectors.

### Phase 2 - Process Hub MVP

- Add `ProcessHub` as the default persisted context for Azure investigations.
- Add investigation metadata: `processHubId`, depth, owner, sponsor,
  contributors, status, Current Understanding, Problem Condition, and Next Move.
- Migrate existing saved projects into a General / Unassigned Process Hub.
- Update Portfolio to show Process Hubs before individual investigations.
- Add Process Hub dashboard rollups.

### Phase 3 - EDA 2.0 Enrichment

- Add Mechanism Branch UI, Survey evaluator, Signal Cards, and process moments
  inside investigations.
- Make Process Hub rollups richer as those investigation artifacts mature.

### Phase 4 - Control Plan Lite Follow-Up

- First Process Hub release should create control handoff items only.
- Full Control Plan Lite is a later design: process step, signal, control
  method, frequency, owner role, reaction plan, evidence source, and status.

## Non-Goals

- No live ERP, MES, QMS, CRM, or call-center platform integration in the first
  Process Hub phase.
- No generic task board.
- No in-product notification system beyond the existing events/webhook design
  direction.
- No forced full investigation for Quick issues.
- No automatic root-cause claims.
- No full Control Plan Lite in the Process Hub MVP.

## Acceptance Scenarios

1. Process owner opens Line 4 Hub and sees active Quick, Focused, and Chartered
   investigations affecting the same line.
2. Team leader sees what changed this week, what actions are overdue, and which
   verification data is missing.
3. Green Belt opens a Chartered investigation from the hub and continues the
   full EDA 2.0 journey.
4. Production team creates a Quick investigation from a shift issue, records a
   clue, adds an action, and later verifies the result.
5. Resolved investigation creates a control handoff item without requiring a
   full control-plan table.

## Open Implementation Decisions

- Whether `ProcessHub` belongs in a new domain store or extends the existing
  project metadata store.
- Which investigation status values are stored versus derived.
- Whether PWA gets a session-only Process Hub wrapper or keeps a simpler
  investigation-first entry.
- Exact migration shape for Azure Standard local projects and Azure Team Blob
  projects.
- Whether Process Hub warrants a new ADR before implementation or can remain a
  design spec until the MVP is accepted.
