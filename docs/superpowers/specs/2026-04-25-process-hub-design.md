---
title: Process Hub - Work-System Context for Team Improvement
audience: [product, designer, engineer]
category: design-spec
status: in-progress
related:
  [
    process-hub,
    question-driven-eda-2,
    frame-process-map,
    engagement-profile-raci,
    process-flow,
    improvement-workspace,
    portfolio,
    evidence-sources,
    data-profiles,
    agent-review-log,
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

The Process Hub promise is:

> Monitor performance. Detect change. Focus investigation. Verify action.
> Sustain control.

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
-> Sustained control
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
- Which resolved improvements need sustained control in VariScout, standard
  work, live monitoring, or another operational control?
- What changed since the last review, where is variation concentrated, and
  what should the team investigate next?

The current project portfolio answers "which saved investigations exist?" A
Process Hub answers "what is happening to this process, why, and did it work?"
The "why" rollup comes from Mechanism Branches inside investigations: branch
readiness, supporting/counter clues, open checks, and branch next moves explain
why the hub summary recommends action, deeper checking, or waiting.

This makes VariScout the structured improvement layer around existing management
systems. ERP, MES, QMS, CRM, ACD, or workflow tools remain the source systems.
VariScout turns their data and the team's observations into evidence-backed
learning, action, verification, and sustained control.

Process Hub supports process performance monitoring at an improvement cadence.
It is not a 24/7 operational monitoring platform. Live alarms, shift-critical
escalation, SCADA/MES/QMS response workflows, and hard real-time reliability
remain responsibilities of the customer's operational systems. VariScout should
help teams review performance snapshots, detect meaningful change signals, find
where to focus, and decide whether to investigate, act, verify, sustain in
VariScout, or operationalize control elsewhere.

Process Hub evidence workflow starts from the hub cadence question, not from an
import workflow: are we meeting the requirement, what changed, and where should
we focus? User-facing **Evidence Sources** provide recurring hub evidence.
Internal **Data Profiles** adapt recognizable source-data shapes into the
deterministic analysis shape that existing VariScout instruments can use.

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

The MVP stores one primary `processHubId` per investigation. Cross-hub coordination is designed in [Investigation Scope and Drill Semantics](./2026-04-29-investigation-scope-and-drill-semantics-design.md) (Org Hub-of-Hubs view as visual side-by-side, never arithmetic). The model should not block future `relatedProcessHubIds` or `improvementProgramId` concepts associated with Portfolio Investigation (named-future, H3).

### Evidence Sources

An Evidence Source is a recurring source of hub evidence, named in process-owner
language: a weekly Line 4 fill-weight export, a claims queue extract, a supplier
defect log, an agent review log, or a verification audit sample. Each Snapshot
from a source can feed cadence signals, Survey readiness, investigations,
verification, and sustainment reviews.

When VariScout recognizes the source-data shape, a Data Profile provides the
deterministic adapter behind the source. The user-facing workflow remains
"configure evidence for this hub"; the implementation concept is the profile,
mapping, and validation that make the evidence auditable.

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
| **Controlled**       | A control exists in VariScout or has been operationalized elsewhere     |

Status can be derived where possible from existing findings, questions, hubs,
actions, and outcomes. It should only be stored directly when the derived state
is not expressive enough for portfolio or hub rollups.

## Process Hub Home

The Azure home should become hub-first. It is not merely a saved-project
portfolio; it is the operating view over accessible Process Hubs and the active
investigations inside them. It is for the process owner, team leader, GB/BB,
OpEx lead, quality engineer, and sponsor. It should show:

- Accessible Process Hubs before individual investigations.
- Evidence Sources and latest Snapshots for the selected hub.
- Active investigations, grouped by hub, depth, and status.
- Current Understanding and Next Move for each active investigation.
- Whether the process appears to meet the requirement, what changed since the
  previous Snapshot, and where variation or burden is concentrated.
- Owners, contributors, and due items.
- Open actions across all investigations for the process.
- Changes planned or active this week.
- Verification waiting for new data or gemba confirmation.
- Recently resolved outcomes and measured effect.
- Sustainment/control queue for improvements that should be periodically
  reviewed in VariScout, update standard work, feed live monitoring, or update
  inspection plans, checklists, and reaction plans.

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
  become a live MES, QMS, ticketing, SCADA, or alarm system.
- Scheduled refresh is allowed, but the cadence is an improvement cadence:
  manual, shiftly, daily, weekly, or hourly when the process needs it. The
  product should not promise real-time alerting, millisecond/minute response, or
  operational uptime semantics.
- CoScout can use hub, investigation, document, and knowledge context, but the
  deterministic stats engine remains the authority for computed evidence.

The preferred integration model is contract-first and customer-integrated:
VariScout owns Evidence Source setup, Data Profile contracts, validation,
evidence snapshots, analysis, investigation state, actions, verification, and
sustainment/control records. The customer data team or an external consultant
owns extraction and transformation from company-specific source systems into
those contracts.

Future conceptual objects are documented in
[Evidence Sources And Data Profiles](2026-04-26-evidence-sources-data-profiles-design.md):
`EvidenceSource`, `DataProfileDefinition`, `EvidenceSnapshot`, and
`ProfileApplication`. This Process Hub design does not implement them yet.

## Performance Review And Control Boundary

Process Hub can be used to monitor process performance, but the monitoring is
for improvement and control learning rather than live operations. The recurring
review loop is:

```text
New data snapshot
-> Review process performance
-> Ask whether the process meets the requirement
-> Detect meaningful change signals
-> Identify where variation is concentrated
-> Start or update investigation
-> Act and verify
-> Sustain control in VariScout or operationalize it elsewhere
```

This boundary gives different users the right level of engagement:

- Process owners and line/team leaders can use one hub for recurring
  performance review, open actions, verification gaps, and sustained controls.
- GB/BBs, quality engineers, analysts, and OpEx leads can scan many hubs, attach
  quick analyses to the right process context, and accelerate root-cause
  analysis by starting from detected change and variation concentration.
- Data teams and consultants can make the organization's data fit VariScout's
  contracts without requiring VariScout to build company-specific integrations.

Control has two valid destinations:

- **Control in VariScout** - periodic sustainment reviews, evidence snapshots,
  actions, verification history, and control-plan checks that fit an
  improvement cadence.
- **Control operationalized elsewhere** - live alerts, escalation, ticketing,
  MES/QMS/SCADA workflows, or Power BI/enterprise dashboards built from the
  learning and control plan knowledge captured in VariScout.

## Agent-Assisted Process Steps

External AI agents can be treated as steps inside a Process Hub when they
support or gate real work. The agent itself stays in the customer's AI platform;
VariScout imports review logs as process data and helps the process owner
improve the agent-assisted workflow.

The first profile is
[Agent Review Log Profile](2026-04-26-agent-review-log-process-hub-design.md).
It is the first Data Profile behind an Evidence Source and focuses on safe green
throughput:

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
- Mechanism Branches explain why action is being considered and remain
  investigation artifacts projected from `SuspectedCause` hubs.
- Next Move tells the team what to do next. Branch-level next moves can inform
  the investigation-level Process Hub summary, but the summary remains
  separately editable.
- Signal Cards and Survey later improve trust, power, and data readiness.
- Sustainment Reviews connect Process Hub back to the CHANGE lens: the question
  is not only "is it stable?" but "what changed, where is variation
  concentrated, does it affect the target, and what should we do next?"

Process Hub fits the unified methodology hierarchy:

| Layer                 | Role in Process Hub                                           |
| --------------------- | ------------------------------------------------------------- |
| Process Hub           | Operating spine for cadence review and improvement load       |
| Evidence Sources      | Recurring hub evidence, Snapshots, and source provenance      |
| Data Profiles         | Deterministic adapters for recognizable source-data shapes    |
| Investigation journey | FRAME, SCOUT, INVESTIGATE, IMPROVE inside each investigation  |
| Question-driven EDA   | Reasoning spine that sharpens each issue into next moves      |
| Survey                | Readiness evaluator for act, verify, sustain, or collect more |
| Signal Cards          | Trust records that make hub rollups safer to act on           |
| Sustainment handoff   | Choice between VariScout review and operationalized control   |

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
- Align the unified methodology hierarchy so Process Hub, the investigation
  journey, question-driven EDA, Survey, Signal Cards, and sustainment handoff
  have distinct responsibilities.
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
- Keep Survey horizontal; it improves hub cadence and investigation readiness
  without becoming a new top-level workspace.

### Phase 4 - Sustainment Reviews And Control Plan Lite

- First Process Hub release should create sustainment/control items only.
- Full Control Plan Lite is a later design: process step, signal, control
  method, frequency, owner role, reaction plan, evidence source, and status.
- Later releases can let selected controls stay in VariScout as periodic
  sustainment reviews or be marked as operationalized in another system.

### Phase 5 - Evidence Sources, Data Profiles, And Snapshot Contracts

- Add the hub evidence workflow: Evidence Source setup, Data Profile selection,
  mapping confirmation, Snapshot history, and validation.
- Connect Snapshots to cadence board signals, Survey readiness, investigation
  attachment, action verification, and sustainment handoff.
- Use Snapshot history to distinguish daily huddle questions from weekly
  process-review questions. Before Phase 5 lands, the cadence board may show
  daily/weekly meeting lanes only as derived views over current project
  metadata, not as persisted cadence records.
- Keep extraction and transformation outside VariScout; customers or
  consultants provide exports that match documented contracts.
- Reserve future Blob direction without claiming current support:
  `process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...`.
  Current Blob behavior remains project-based until this phase is implemented.

## Non-Goals

- No live ERP, MES, QMS, CRM, or call-center platform integration in the first
  Process Hub phase.
- No 24/7 operational monitoring, live alarms, shift-critical escalation, or
  real-time control-loop responsibility.
- No custom integrations owned by VariScout for customer-specific source
  systems.
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
5. Resolved investigation creates a sustainment/control item without requiring a
   full control-plan table.
6. A team reviews a new Snapshot from an Evidence Source, sees whether the
   process appears to meet the requirement, what changed, and where variation is
   concentrated, then starts a focused investigation without expecting
   VariScout to behave as a live alarm system.

## Open Implementation Decisions

### Decision: investigation status — stored override on top of derived natural status

`InvestigationStatus` is a single nine-value enum (`issue-captured`, `framing`, `scouting`, `investigating`, `ready-to-improve`, `improving`, `verifying`, `resolved`, `controlled`). The natural status is **derived at read time** from the active journey phase via `investigationStatusFromJourneyPhase(phase)`, which maps `frame|scout|investigate|improve` to `framing|scouting|investigating|improving`. The persisted value `investigation.metadata.investigationStatus` is treated as an **optional user-set override**: when present it wins, otherwise the derived value is used. This lets users explicitly mark off-journey states the four-phase walk cannot express — `issue-captured`, `ready-to-improve`, `verifying`, `resolved`, `controlled` — while keeping in-journey investigations self-updating without manual bookkeeping. Downstream rollups (`ACTIVE_STATUSES`, `SUSTAINMENT_STATUSES`, readiness reasons, cadence queues) operate on the resolved effective status only.

**Rationale:** Keeps the common case (an investigator working through FRAME/SCOUT/INVESTIGATE/IMPROVE) zero-effort and free of drift between phase and status, while preserving a single source of truth: one stored field, one derivation function, one resolution rule. Override-on-derived also matches the existing `projectMetadata.ts` pattern (line 195: `processContext?.investigationStatus ?? investigationStatusFromJourneyPhase(phase)`), so the contract documents what the code already does rather than imposing a refactor.

**Code:** `packages/core/src/processHub.ts` — `investigationStatusFromJourneyPhase()` (line 271) derives the natural status; `metadata.investigationStatus` (declared line 47) stores the optional override; `ACTIVE_STATUSES` (line 250) and `SUSTAINMENT_STATUSES` (line 264) apply to the resolved effective status. `packages/core/src/projectMetadata.ts` (line 195-196) is the canonical write site that materialises the override-or-derive resolution. `apps/azure/src/pages/Editor.tsx` (line 194-196) is the user-facing override surface.

**Follow-up:** Add a small helper `resolveInvestigationStatus({ override, phase })` exported from `@variscout/core/processHub` (or `projectMetadata`) that encapsulates the `override ?? investigationStatusFromJourneyPhase(phase)` rule. Audit existing read sites in `processHub.ts` (`buildProcessHubRollups`, `buildProcessHubReview`, `readinessReasons`, `buildProcessHubContext`) — most fall back to the literal `'scouting'` when metadata is missing, which silently masks the FRAME phase; those should call the resolver with the investigation's actual phase instead. No code changes in this task; tracked for a future implementation pass.

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
