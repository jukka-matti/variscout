---
title: Unified Process Hub Methodology Roadmap
audience: [product, designer, engineer]
category: design-spec
status: in-progress
related:
  [
    process-hub,
    methodology,
    question-driven-eda-2,
    survey,
    signal-cards,
    process-moments,
    evidence-sources,
    data-profiles,
    user-journeys,
    aix,
  ]
date: 2026-04-26
---

# Unified Process Hub Methodology Roadmap

## Summary

Process Hub is the operating spine for VariScout. It is where recurring
process-improvement work lives over time for one line, queue, flow, cell, lab
process, service workflow, or development value stream.

For the horizon-level product-method roadmap that places Process Hub inside
the broader progression from one dataset to Process Measurement System,
process learning memory, and CoScout context layer, see
[VariScout Product Vision](2026-05-03-variscout-vision-design.md) (supersedes the 2026-04-27 product-method-roadmap, now in `docs/archive/specs/`).

Process Hub does not replace the investigation method. Each investigation still
uses the VariScout journey:

```text
FRAME -> SCOUT -> INVESTIGATE -> IMPROVE
```

The roadmap should treat the product as a nested methodology:

| Layer                            | Role                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| Process Hub                      | Operating spine for process-owner cadence and team improvement     |
| Process Measurement System       | Designed measure, evidence, snapshot, trust, and cadence layer     |
| Current Process State            | Latest review of outcome, flow, known x-control, and trust signals |
| Evidence Sources / Data Profiles | Recurring hub evidence workflow and deterministic source adapters  |
| Process learning levels          | Outcome, flow, and local-mechanism levels of process understanding |
| Investigation journey            | Reasoning loop from Current Process State to response              |
| Response paths                   | Quick action, focused investigation, charter, sustainment, handoff |
| Question-driven EDA              | Reasoning spine that sharpens issue into problem condition         |
| Survey                           | Horizontal readiness evaluator across every phase and hub review   |
| Signal Cards                     | Signal-level trust records that Survey and branches quote          |
| Process moments                  | Process-rational windows for Cp/Cpk and verification learning      |
| Sustainment/control handoff      | Decision on what stays in VariScout and what moves to live systems |

This hierarchy keeps VariScout out of custom integrations and 24/7 operational
monitoring while still supporting process performance review at an improvement
cadence.

Process Hub is the operating loop for how a team improves a process over time.
The Process Measurement System turns recurring evidence into Current Process
State. Current Process State triggers quick action, focused investigation,
chartered improvement, sustainment review, or control handoff. The process
learning levels explain what each loop is learning: outcome, flow, or local
mechanism.

## Usage Levels

The roadmap must serve several levels of product use without turning them into
separate products:

| Level                       | Primary user                         | Product job                                                       |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| PWA / training              | Trainer, student, learner            | Learn the investigation method without organizational persistence |
| Quick analyst dataset       | Analyst, GB, engineer                | Analyze a dataset fast and attach the learning to process context |
| Process-owner cadence       | Process owner, team leader           | Review what changed, what is blocked, and what needs verification |
| GB/BB multi-hub scan        | Green Belt, Black Belt, OpEx lead    | Compare hubs for leverage, charter candidates, and blocked work   |
| Evidence-source enablement  | Process owner, data team, consultant | Fit recurring evidence to documented contracts and snapshots      |
| Sustainment/control handoff | Owner, quality, operations, sponsor  | Decide what stays reviewed in VariScout or is operationalized     |

## Methodology Placement

### Process Hub

Process Hub is the durable process context. It organizes investigations,
actions, verification gaps, and sustainment decisions around the process that
the team actually owns.

At hub level, the recurring question is:

```text
What is the Current Process State, what changed, what needs attention, and
which response path fits?
```

### Process Measurement System And Current Process State

The Process Measurement System is the designed layer behind Process Hub cadence:
stable measure definitions, Evidence Sources, Snapshots, targets, subgroup
logic, known x-control measures, Signal Cards, Survey readiness, and cadence
rules.

Current Process State is the review surface produced from that system. It
should show outcome, flow, known x-control, capability structure, and trust
measures. Capability state should distinguish Cpk vs target Cpk, Cp-Cpk gap,
Cp/Cpk movement across process-rational windows, and sample/trust warnings.

### Evidence Sources And Data Profiles

Evidence Sources are the hub-level sources of recurring evidence that answer
"are we meeting the requirement, what changed, and where should we focus?" A
Data Profile is the deterministic adapter behind an Evidence Source when
VariScout recognizes a repeatable source-data shape.

Snapshots are dated evidence packages from an Evidence Source. A Profile
Application records the Data Profile version and confirmed mapping used for one
Snapshot. See
[Evidence Sources And Data Profiles](2026-04-26-evidence-sources-data-profiles-design.md).

### Investigation Journey

FRAME, SCOUT, INVESTIGATE, and IMPROVE remain the investigation spine. They
describe how one issue moves from concern to evidence-backed action and
verification. In Process Hub use, investigations are the reasoning loop between
Current Process State and response. They can discover a new x, check which
known x changed, validate a suspected mechanism, scope the problem, resolve
trust gaps, verify action effectiveness, or decide escalation.

### Response Paths

Process Hub cadence should route attention into five response paths:

| Response path                 | Meaning                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| Quick team action             | Low-risk local action that can be done and verified quickly             |
| Focused investigation         | Bounded investigation when mechanism, subgroup, trust, or scope is open |
| Chartered improvement project | Formal project when impact, risk, ownership, or resources require it    |
| Sustainment review            | Periodic check that a verified improvement is still visible             |
| Control handoff               | Acknowledgement that live control belongs in another system             |

### Process Learning Levels

Every investigation and cadence review should be readable through three levels:

| Level                      | Question                                                         |
| -------------------------- | ---------------------------------------------------------------- |
| System / outcome           | What result must the customer or business experience?            |
| Flow / process model       | What flows through which steps, at what rate, and where is loss? |
| Local mechanism / evidence | What physics, recipe, condition, or measurement issue explains?  |

FRAME's process map is a flow-level lens. Capability, Process Flow, Yamazumi,
Defect, Performance, and Standard EDA are analysis modes that help the user
move between levels. See
[VariScout Product Vision](2026-05-03-variscout-vision-design.md) §2 (supersedes the 2026-04-27 operating-model, now in `docs/archive/specs/`).

### Question-Driven EDA

Questions remain the reasoning spine inside the journey. They convert a vague
Issue / Concern into Current Understanding, Problem Condition, Mechanism
Branches, Next Move, and eventually an approved Problem Statement.

### Survey

Survey is not a fifth phase, not a top-level workspace, and not a fifth domain
store. Survey is the horizontal readiness evaluator. It asks whether the
current data, signals, branches, and verification evidence are good enough for
the next methodological move.

| Context     | Survey asks                                                              |
| ----------- | ------------------------------------------------------------------------ |
| FRAME       | What does this data afford, and what is missing?                         |
| SCOUT       | Which analysis modes and checks are available?                           |
| INVESTIGATE | What trust, power, and counter-checks would make this branch safer?      |
| IMPROVE     | What data verifies whether the action worked?                            |
| REPORT      | Which claims are backed by signals, checks, and branches?                |
| Process Hub | Which investigations are ready to act, verify, sustain, or collect more? |

### CoScout

CoScout explains, drafts, and proposes. It does not decide. Deterministic
statistics, Survey output, Signal Cards, and user-confirmed evidence remain the
authority.

## Phased Roadmap

### Phase 1 - Methodology Hierarchy Refresh

- Align the Constitution, Methodology, EDA Mental Model, Analysis Journey Map,
  Process Hub, QDE 2.0, AIX, and User Journeys around the hierarchy above.
- Close the Survey placement decision: horizontal readiness evaluator.
- Keep PWA investigation-first and Azure Process Hub-first.

### Phase 2 - Process Owner Cadence UX

- Evolve the selected Process Hub review surface into a cadence workspace.
- Show Current Process State, response-path routing, overdue actions,
  verification queue, next moves, and sustainment candidates.
- Keep the implementation Azure-only and reuse existing Process Hub metadata.

### Phase 3 - Signal Cards

- Persist signal-level trust facts for key Y, X, CTQ, sensor, and process-flow
  signals.
- Replace Survey trust placeholders with Signal Card records and trust chips.
- Surface branch-level trust and power warnings as advisory next-move inputs.

### Phase 4 - Process Moments

- Add process-rational Cp/Cpk windows tied to stages, events, factors, or manual
  boundaries.
- Let weak process moments become clues in Mechanism Branches.
- Use process moments for verification and sustainment learning.

### Phase 5 - Evidence Sources, Data Profiles, And Snapshot Contracts

- Define the Evidence Source workflow: source setup, profile selection, mapping
  confirmation, snapshot history, and validation.
- Define customer-owned snapshot contracts for data teams and consultants.
- Document Data Profile contracts, including `EvidenceSource`,
  `DataProfileDefinition`, `EvidenceSnapshot`, and `ProfileApplication`. These
  types now exist in core, but the general product workflow is still incomplete
  beyond the first profile-specific slice.
- Connect Snapshots to cadence review signals, Survey readiness, investigation
  attachment, action verification, and sustainment handoff.
- Make daily huddle and weekly process review horizons explicit: v1 cadence
  boards can label these meeting uses from existing metadata, but true
  daily/weekly comparison needs Snapshot history from Evidence Sources.
- Keep extraction and transformation outside VariScout.
- Reserve a logical future hub namespace such as
  `process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...`
  for snapshots, documents, and sustainment artifacts when a slice needs it.

### Phase 6 - Sustainment And Control Handoff

- Support periodic sustainment reviews inside VariScout when the control cadence
  fits improvement work.
- Mark controls as operationalized elsewhere when live alarms, escalation,
  ticketing, MES/QMS/SCADA workflows, or enterprise dashboards take ownership.

## Acceptance Criteria

1. A reader can explain the difference between Process Hub, Process Measurement
   System, Current Process State, Evidence Sources, Data Profiles, Snapshots,
   response paths, the investigation journey, question-driven EDA, Survey,
   Signal Cards, and sustainment handoff.
2. User journeys describe quick analyst work, process-owner cadence, multi-hub
   GB/BB work, PWA training, evidence-source enablement, and
   sustainment/control.
3. Survey is documented as horizontal across phases and hub cadence.
4. No document claims VariScout is a 24/7 operational monitoring platform.
5. The first code slice after this alignment can focus on Process Owner Cadence
   UX without needing schema, store, or integration decisions.

## Non-Goals

- No custom ERP, MES, QMS, CRM, ACD, or workflow integrations.
- No live alarms, shift-critical escalation, or operational uptime promises.
- No claim that Phase 5 Blob namespaces or Evidence Source objects exist before
  implementation.
- No new domain store for Process Hub or Survey.
- No Survey top-level workspace in this roadmap phase.
- No full Control Plan Lite before sustainment review behavior proves useful.
