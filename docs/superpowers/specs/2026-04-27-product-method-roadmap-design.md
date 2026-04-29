---
title: Product-Method Roadmap
audience: [product, designer, engineer, analyst, manager]
category: design-spec
status: draft
related:
  [
    product-method,
    methodology,
    process-hub,
    process-measurement-system,
    current-process-state,
    evidence-sources,
    process-learning,
    coscout,
  ]
date: 2026-04-27
---

# Product-Method Roadmap

## Summary

VariScout should mature from a strong investigation tool into a process
learning system. The roadmap is not a calendar commitment. It is a maturity map
for product, methodology, UX, and engineering.

The core direction is:

```text
one dataset
-> investigation project
-> Process Hub context
-> recurring Evidence Sources
-> Process Measurement System
-> Current Process State
-> response paths
-> process learning memory for people and CoScout
```

This roadmap replaces a narrow feature-phase view with maturity horizons. It
keeps the existing investigation journey, deterministic statistics engine, and
customer-owned data boundary, while making Process Hub the operating home for
process-owner cadence and team learning.

## Current Baseline

The product is further along than the original roadmap assumed.

| Area                  | Current state                                                                 |
| --------------------- | ----------------------------------------------------------------------------- |
| Investigation journey | FRAME -> SCOUT -> INVESTIGATE -> IMPROVE exists as the reasoning spine        |
| Deterministic stats   | Stats engine remains authority; CoScout does not recompute claims             |
| Process Hub           | Hubs, rollups, quick/focused/chartered queues, cadence questions, and context |
| Current Process State | Branch-ready v1 projection and Azure review surface                           |
| Evidence Sources      | Core types, IndexedDB, Blob paths, and Agent Review Log workflow exist        |
| Sustainment / handoff | Sustainment records, reviews, and control handoff are implemented             |
| Methodology docs      | Process learning levels and Process Measurement System are now named          |

The main gap is not one missing screen. The gap is coherence: users need a
clear path from dataset, to investigation, to reusable process evidence, to
current state, to response, to sustained learning.

## Roadmap Principles

1. **Process learning before statistics.** Statistics are instruments for
   answering process questions, not the primary product mental model.
2. **Interface, not integration.** CSV and Excel exports remain first-class.
   Deep ERP, MES, QMS, CRM, ACD, SCADA, or ticketing integration is not the
   wedge.
3. **Current state is not stability.** Current Process State is the latest
   structured read of the process measurement system. It must not collapse into
   a simple stable/unstable label.
4. **Response paths are product behavior.** Current state should route to quick
   team action, focused investigation, chartered project, measurement-system
   work, sustainment review, or control handoff.
5. **Local physics matter.** Global owners compare patterns; local process
   owners own the mechanism, recipe, equipment, material, and operating window.
6. **CoScout is grounded by context.** CoScout explains, drafts, and proposes
   from structured evidence-backed context. It is not the authority and not an
   open agent platform promise.

## Horizon 0 - Foundation Now

**Product promise:** VariScout helps a user investigate a dataset, structure
the reasoning, and attach learning to a process context.

**Who it serves:**

- analyst
- GB/BB
- engineer
- trainer/student
- early process owner

**Already real or branch-ready:**

- investigation journey and six analysis modes
- Process Hub rollups and cadence queues
- quick, focused, and chartered work depth
- Current Understanding, Problem Condition, and branch language
- Survey readiness foundation
- Evidence Source/Data Profile/Snapshot types
- Agent Review Log as first profile-specific evidence workflow
- Sustainment and control handoff
- Current Process State v1 projection and Azure surface

**Done when:**

- Current Process State v1 is reviewed, merged, and visible in Azure.
- The docs explain the product as a process learning system, not as unrelated
  analysis modes.
- A new contributor can distinguish Process Hub, Process Measurement System,
  Current Process State, Evidence Sources, investigations, and response paths.

## Horizon 1 - Process-Owner Operating System

**Product promise:** A process team can open one hub and understand what needs
attention now, why, and which response path fits.

This is the next product maturity horizon because it makes the existing Process
Hub work operationally useful before expanding data contracts.

**Primary user jobs:**

- process owner reviews the current state for one line, queue, lab process, or
  service flow
- local team captures questions, gemba findings, and next moves
- GB/BB sees whether work is quick action, focused investigation, or charter
- owner checks verification, overdue actions, and sustainment

**Key capabilities:**

- make Current Process State items actionable
- route each item to the correct response path
- preserve comments, questions, gemba findings, and assumptions on the hub
- show what is known, inferred, missing, or waiting for verification
- keep daily huddle and weekly process review as cadence views, not separate
  products

**Likely next slices:**

1. State item -> open or start the matching workflow.
2. Team notes on state items: question, gemba finding, data gap, decision.
3. Better response-path language across queues and investigation metadata.

**Done when:**

- a process owner can run a cadence review from the hub without understanding
  internal analysis modes
- a state item can trigger a quick action, focused investigation, charter,
  measurement-system work, sustainment review, or handoff
- the team can see why the path was chosen and what evidence supports it

## Horizon 2 - Process Measurement System

**Product promise:** A team can turn useful recurring evidence into a designed
measurement system for one process.

This horizon is where the product moves from "latest project and snapshots" to
"stable evidence contracts and review logic."

**Primary user jobs:**

- data partner or consultant defines a repeatable export contract
- process owner names the measures that matter
- analyst confirms mappings, subgroup logic, target, and trust checks
- team reviews snapshot history across hourly, shiftly, daily, or weekly
  cadence

**Key capabilities:**

- promote a useful project/export into a recurring Evidence Source
- generalize Evidence Source setup beyond Agent Review Log
- support snapshot history and latest-versus-previous comparison
- define measure families: outcome/Y, flow, known x-control, capability
  structure, and trust
- make Cpk vs target Cpk, Cp-Cpk gap, Cp/Cpk over rational windows, sample size,
  power, and measurement trust visible

**Likely slices:**

1. General Evidence Source setup for ordinary CSV/Excel exports.
2. Snapshot trend summary for Current Process State.
3. Capability-state card: Cpk vs target, Cp-Cpk gap, subgroup/sample warnings.
4. Evidence Source promotion from an existing project.

**Done when:**

- a one-off dataset can become recurring process evidence without custom
  integration
- Current Process State is produced from stable measure definitions and
  snapshots, not only from project metadata
- the system prevents overclaiming when sample size, subgrouping, or
  measurement trust is weak

## Horizon 3 - Process Learning Memory

**Product promise:** VariScout accumulates reusable process knowledge without
pretending that different local processes are identical.

This horizon is where global and local process ownership become useful product
concepts.

**Primary user jobs:**

- local process owner manages the physics and operating conditions of one
  process
- global process owner compares patterns across similar processes
- OpEx lead sees repeated mechanisms, measurement gaps, and leverage points
- trainer or MBB teaches how process understanding matures

**Key capabilities:**

- model the three process-learning levels: system/outcome, flow/process model,
  local mechanism/evidence
- link FRAME map, Process Flow, Yamazumi, capability, defect, and performance
  views as lenses over the same process
- track known x-control measures and operating windows
- distinguish global pattern comparison from false aggregation of Cp/Cpk or
  unrelated mechanisms
- reuse patterns across equipment classes, products, teams, or service flows

**Likely slices:**

1. Level-aware Process Hub map: outcome, flow, local mechanism, evidence/trust.
2. Known x-control measure records connected to state items.
3. Multi-hub comparison that compares patterns and queues, not raw process
   capability as if it were additive.

**Done when:**

- a team can explain which level of process understanding they are working at
- local and global process owners see different but connected views
- recurring mechanisms and measurement weaknesses are reusable learning, not
  buried in isolated investigations

## Horizon 4 - CoScout Context Layer

**Product promise:** CoScout becomes more useful because the organization has a
structured process context layer for humans first.

This is not a promise to open an AI-agent platform. It is an internal design
principle: every durable Process Hub artifact should be readable by people and
structured enough for CoScout grounding.

**Primary user jobs:**

- analyst asks CoScout to explain current state and possible next moves
- process owner asks for a concise review summary
- GB/BB asks for open risks, weak evidence, and likely response path
- team asks what needs gemba check, data check, or verification

**Key capabilities:**

- compact Current Process State summary in Process Hub context
- evidence-linked explanation of why a response path is suggested
- summaries of known x-control, unresolved questions, assumptions, and trust
  gaps
- prompt boundaries that keep deterministic statistics and user-confirmed
  evidence as authority
- no autonomous decision, live control, or external-agent access promise

**Likely slices:**

1. CoScout hub review prompt grounded in Current Process State.
2. Draft cadence summary from state, evidence, actions, and sustainment.
3. Draft investigation charter from repeated state items and evidence gaps.

**Done when:**

- CoScout can explain Process Hub state without recomputing statistics
- users can trace AI text back to deterministic signals and user-owned records
- AI improves shared understanding without becoming the source of truth

## Cross-Horizon Product Spine

The same operating loop should remain visible across all horizons:

```text
Process Measurement System
-> Current Process State
-> response path
-> investigation / action / sustainment / handoff
-> updated Process Measurement System
```

The investigation journey remains:

```text
FRAME -> SCOUT -> INVESTIGATE -> IMPROVE
```

The process-learning levels remain:

| Level                      | Product question                                                 |
| -------------------------- | ---------------------------------------------------------------- |
| System / outcome           | What result must the customer or business experience?            |
| Flow / process model       | What flows through which steps, at what rate, and where is loss? |
| Local mechanism / evidence | What physics, recipe, condition, or measurement issue explains?  |

## Roadmap Review Criteria

Use these questions when choosing the next slice:

1. Does it strengthen the path from one dataset to reusable process learning?
2. Does it make Process Hub more useful for a real process owner or team?
3. Does it clarify Current Process State rather than adding another isolated
   mode?
4. Does it improve evidence trust, sample/power protection, or measurement
   system clarity?
5. Does it preserve customer-owned data and interface-not-integration?
6. Does it help CoScout only after deterministic context exists?

## Near-Term Recommendation

After merging Current Process State v1, the next implementation slice should be
**Horizon 1: state-to-response actionability**.

Reason:

- Current Process State now exists as a visible review surface.
- Evidence Source storage already exists, but generalizing it before state
  actionability risks building data plumbing before the user workflow is clear.
- Team notes, questions, gemba findings, and response routing will reveal which
  evidence-source contracts matter most.

The next two slices after that should be:

1. **General Evidence Source setup** for ordinary CSV/Excel exports.
2. **Snapshot trend and capability-state cards** for Cpk vs target, Cp-Cpk gap,
   subgroup/sample warnings, and measurement trust.

## Boundaries

VariScout is not:

- live monitoring or shift-critical alarm management
- generic BI
- generic task management
- QMS replacement
- MES/ERP integration platform
- autonomous process-control system
- open AI-agent platform

VariScout is:

- a structured investigation and process learning system
- a process-owner cadence workspace
- a deterministic stats and evidence interpretation layer
- a customer-owned Process Hub memory for humans and CoScout

## Related Docs

- [Process Learning Operating Model](2026-04-27-process-learning-operating-model-design.md)
- [Unified Process Hub Methodology Roadmap](2026-04-26-unified-process-hub-methodology-roadmap.md)
- [Evidence Sources And Data Profiles](2026-04-26-evidence-sources-data-profiles-design.md)
- [Customer-Tenant Ingestion And Rollups Concept](2026-04-29-customer-tenant-ingestion-rollups-concept.md) — Future automated/hourly Evidence Sources should use raw Blob evidence plus manifest-first rollups, with TypeScript-first VariScout product logic and Python allowed at the customer data edge.
- [Process Hub Design](2026-04-25-process-hub-design.md)
- [Question-Driven EDA 2.0](2026-04-25-question-driven-eda-2-design.md)
- [Investigation Scope and Drill Semantics](2026-04-29-investigation-scope-and-drill-semantics-design.md) — Hub-of-Hubs design constraints (no statistical roll-up; visual side-by-side; cross-hub context filter) are specified here.
