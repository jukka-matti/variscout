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
  ]
date: 2026-04-25
---

# Process Hub

## Summary

VariScout should move from a project-first entry model to a **Process Hub first**
model. A Process Hub is the durable organizational home for one process,
production line, cell, queue, value stream, development flow, lab flow, or
business workflow. It gives the process owner and improvement team one place to
see what is being investigated, what is being changed, who owns the work, what
is waiting for verification, and what learning needs to be sustained.

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
The "why" rollup comes from Mechanism Branches inside investigations: branch
readiness, supporting/counter clues, open checks, and branch next moves explain
why the hub summary recommends action, deeper checking, or waiting.

This makes VariScout the structured improvement layer around existing management
systems. ERP, MES, QMS, CRM, ACD, or workflow tools remain the source systems.
VariScout turns their data and the team's observations into evidence-backed
learning, action, verification, and sustainment handoff.

## User-Facing Model

### Process Hub

A Process Hub represents the recurring operational or development context being
improved, not an individual improvement project:

- Line 4 sachet filling
- Claims queue
- Order-to-cash
- Supplier intake
- Station 3 assembly cell
- Outpatient waiting-time process
- API release quality flow

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

### Improvement Project / Chartered Work

A formal improvement project is optional and secondary to the Process Hub. A
Green Belt, Black Belt, OpEx lead, or development-organization engineer may run
chartered work that:

- lives inside one Process Hub,
- touches several Process Hubs, or
- compares the same mechanism across multiple lines, queues, or flows.

The MVP stores one primary `processHubId` per investigation. Cross-hub programs
or formal project wrappers are deferred, but the model should not block future
`relatedProcessHubIds` or `improvementProgramId` concepts.

### Multi-Hub Users

The Process Hub home should support both single-hub and multi-hub users:

- A process owner or team leader may mostly live in one hub.
- A quality engineer may own investigations across a small set of hubs.
- A Green Belt, Black Belt, OpEx lead, or development-org engineer may scan many
  hubs to find leverage, blocked work, verification gaps, or charter candidates.
- A sponsor or manager may only need status, owner, Problem Condition, and next
  decision points across selected hubs.

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

## Process Hub Home

The Azure home should become hub-first. It is not merely a saved-project
portfolio; it is the operating view over accessible Process Hubs and the active
investigations inside them. It is for the process owner, team leader, GB/BB,
OpEx lead, quality engineer, and sponsor. It should show:

- Accessible Process Hubs before individual investigations.
- Active investigations, grouped by hub, depth, and status.
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

## Relationship To EDA 2.0

EDA 2.0 is the investigation language inside Process Hub:

- Process Hub shows investigation rollups.
- EDA 2.0 defines what an investigation is learning.
- Current Understanding is the Process Hub summary line for active work.
- Problem Condition is the measurable gap shown on hub cards.
- Mechanism Branches explain why action is being considered and remain
  investigation artifacts projected from `SuspectedCause` hubs.
- Next Move tells the team what to do next. Branch-level next moves can inform
  the investigation-level Process Hub summary, but the summary remains
  separately editable.
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
- Update the Azure home to show Process Hubs before individual investigations.
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

- Which investigation status values are stored versus derived.

## Closed Implementation Decisions

- The MVP does **not** add a fifth domain Zustand store. The Process Hub catalog
  lives in Azure persistence, and active investigation assignment lives in
  `processContext` plus `ProjectMetadata`.
- PWA remains investigation-first for this phase. Shared types stay compatible,
  but Process Hub UI and persistence are Azure-only in the MVP.
- Whether PWA gets a session-only Process Hub wrapper or keeps a simpler
  investigation-first entry.
- Exact migration shape for Azure Standard local projects and Azure Team Blob
  projects.
- Whether Process Hub warrants a new ADR before implementation or can remain a
  design spec until the MVP is accepted.
