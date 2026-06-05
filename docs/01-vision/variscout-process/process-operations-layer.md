---
tier: stable
purpose: remember
title: 'VariScout Process: the process-operations layer'
audience: human
category: strategy
status: named-future
date: 2026-06-05
last-reviewed: 2026-06-05
layer: L1
related:
  - docs/01-vision/variscout-process/index.md
  - docs/01-vision/variscout-process/measurement-system.md
  - docs/07-decisions/adr-090-processhubanalyze-dissolution-lineage-retirement.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
  - docs/archive/specs/2026-04-27-process-learning-operating-model-design.md
  - docs/archive/specs/2026-04-25-process-hub-design.md
  - docs/archive/specs/2026-04-27-actionable-current-process-state-panel-design.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# VariScout Process: the process-operations layer

> **Status: named-future.** This document preserves the coherent design of the
> cadence-review operations layer — the "process-owner monitoring" surface that
> was built for the pre-wedge four-persona product and then extracted as VariScout
> Process territory when the V1 pivot narrowed to single-specialist scope. **None
> of the surfaces described here ship under the V1 SKU.** The code that implemented
> them was deleted across PO-1…PO-5 (PRs #298–#302); git preserves the
> implementation history at the commit pointers below.
>
> Read this when a customer or stakeholder asks "what about monitoring?" or "where
> does process-owner oversight live?" — the answer is "later, in VariScout
> Process," and the design is here.

---

## §1 · What this document captures

The pre-wedge design corpus built a three-level cadence-review layer on top of the
investigation surface: a **Process Measurement System** that aggregated current
process state across ongoing investigations, a **Current Process State panel** that
narrated it, queues that sorted work items by readiness/overdue signals, and a
regular **huddle/review ritual** for process owners and their teams. All of that
constitutes the process-operations layer.

The V1 wedge pivot (2026-05-16) narrowed VariScout to the improvement-specialist
persona and the Project as the self-contained unit. The operations layer was
**named-future** at that decision (ADR-082, connective Decision 0) and its code
removed during the PO extraction (PO-1 through PO-5, 2026-06-04…2026-06-05).

This document relocates the design intact — with implementation-commit pointers —
so the concepts survive code deletion as a buildable starting point for the
VariScout Process activation sequence described in
[index.md §9](index.md#9-if-v1-succeeds---what-activates-first).

---

## §2 · The cadence model

### §2.1 The rhythm of operations

The process-operations layer is structured around a recurring **review cadence**:

- **Daily huddle** (15 min) — the team reviews the Current Process State panel
  together. New investigation findings are surfaced; overdue attention items are
  triaged. The goal is shared situation awareness, not decision-making.
- **Weekly review** (60 min) — deeper cross-investigation review. New measurements
  are evaluated against targets. Hypotheses are advanced or retired. Action
  ownership is confirmed.
- **Monthly/quarterly** — capability trend review. Cross-project pattern memory
  (the Knowledge Catalyst surface, named-future) surfaces learnings.

This cadence is the reason the operations layer needs its own surface. A specialist
running a single project never needs the daily-team-review UI. A process owner
running five simultaneous investigations does — and wants the state presented at
the cadence boundary, not only within the Editor workspace.

### §2.2 Queues

Work items were routed through **typed queues** that sorted investigations by
attention taxonomy (see §5). The queues were Azure-only; the PWA never had a
cadence surface.

The pre-wedge implementation lived in `ProcessHubCadenceQueues` and
`ProcessHubCadenceQuestions` — orphaned dead files by the time of PO-1 (the
committed UI shed pre-dated the pre-extraction grounding). Both deleted in:

**PO-1, commit `094b563b` (PR #298) — queue UI shed.** The cadence-queue and
cadence-question files were removed; the `ProcessHubReviewPanel` survived as the
live host for the remaining surfaces.

### §2.3 The huddle/review ritual

The **Current Process State panel** (`buildCurrentProcessState`, `processState.ts`)
synthesized a narrative from the cadence summary and six state-item kinds — only
one of which was non-cadence-derived (the review signal's `topFocus` field). The
panel surfaced the narrative in the `ProcessHubView` for the process-owner's daily
glance.

The panel deleted in:

**PO-3, commit `b8923b449` (PR #300) — engine delete.** `buildProcessHubCadence`,
`buildProcessHubReview`, `buildCurrentProcessState`, and `processHubReview.ts`
were removed. `ProcessHubReviewPanel` deleted in the same PR; `ProcessHubView`
survived as a thin host for the capability tab and B0-migration banner until CS-P2
retires it.

---

## §3 · Work-item fields

The cadence layer tracked **work items** — investigations in progress — with a set
of fields on the `ProcessHubAnalyzeMetadata` projection that described the
investigation's operational depth and next action. These fields are the
process-owner's vocabulary; they have no V1 specialist equivalent (the specialist
tracks progress through findings, hypotheses, and the Report narrative, not
cadence metadata).

| Field           | Role                                                                                                                                                                                                               | Disposition                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `analyzeDepth`  | Editorial depth signal (`'surface' \| 'adequate' \| 'thorough'`) — set by the process owner at their weekly review to characterise the investigation's analytical completeness                                     | **Shed → named-future** (PO-2)                                                                    |
| `analyzeStatus` | Operational status enum (`'active' \| 'resolved' \| 'controlled' \| …`) — the source that Control-readiness predicates gated on before PO-2 introduced a control-eligible predicate from the stage marker directly | **Shed enum** (PO-2); Control-readiness re-sourced from the wedge stage + ControlRecord existence |
| `nextMove`      | Free-text field: "what should happen next?" — set by the process owner at the weekly review or auto-set from a CoScout recommendation                                                                              | **Shed → named-future** (PO-2)                                                                    |

Additionally, `stateNotes` (§4) was a map from `ProcessStateItem` ids to owner
annotations — the way a process owner attached a brief operational note to a
current-state narrative item ("we know, working on it").

All four fields deleted at:

**PO-2, commit `11ad356e` (PR #299) — strip + re-homes.** The strip landed
atomically with the Control-readiness predicate re-source (since `analyzeStatus`
was the predicate's sole writer; the two had to move together).

---

## §4 · `stateNotes`

`stateNotes` was a `Record<string, string>` on `ProcessHubAnalyzeMetadata`,
mapping ephemeral `ProcessStateItem` ids to owner annotations. The dangling-id
risk — a state-item id could be retired mid-cadence, leaving a stranded note with
no display anchor — was accepted in the design on the grounds that the notes were
ephemeral by nature (the next cadence cycle would regenerate the state items, and
stale notes would simply not render).

The field made sense in the context of the Current Process State panel (§2.3) and
the huddle ritual: the process owner annotated items their team surfaced during the
daily/weekly review. Without the panel, the field has no home.

Deleted with the rest of the `ProcessHubAnalyzeMetadata` projection at:

**PO-4, commit `09a52be98` (PR #301) — entity dissolution.**

---

## §5 · The overdue/readiness attention taxonomy

The operations layer used a typed **attention taxonomy** to surface actionable
signals across all investigations in a Hub's portfolio. The taxonomy categorised
work items by readiness state:

| Attention kind      | Meaning                                                                                      | Source                              |
| ------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `overdue-action`    | A Finding's linked action is past its due date                                               | `FindingAction.dueDate < now`       |
| `overdue-review`    | A control review is past its `nextReviewDue` date                                            | `ControlRecord.nextReviewDue < now` |
| `ready-for-control` | Investigation is `analyzeStatus === 'resolved'` and has no ControlRecord yet                 | Predicate on status + control query |
| `needs-depth`       | Investigation is `analyzeStatus === 'active'` but `analyzeDepth === 'surface'` for > 30 days | Composite time + depth predicate    |
| `pending-handoff`   | An improvement reached the Handoff stage but no ControlHandoff record exists                 | Handoff query                       |

The taxonomy drove the **queue sort order** (§2.2): overdue items floated to the
top; surface-depth long-stale investigations ranked below ready-for-control.

The attention model was implemented in `buildProcessHubCadence` and
`buildCurrentProcessState`. Dashboard rendering consumed it via `ProjectCard`
amber-border + amber-footer signals (`hasOverdueTasks`, `actionCounts.overdue`).

**V1 survivors:** The Control-specific attention signals (overdue review, pending
handoff) survive in V1 as project-card chips — `ProjectMetadata.sustainment`
carries the control due-ness signal (the `ControlMetadataProjection`), and Home
project cards render attention chips from exactly `sustainment` + `latestActivity`

- `findingCounts`. The operations-layer full taxonomy — the depth/readiness
  signals, the cross-investigation sort — is named-future.

Dashboard phantom sort keys `hasOverdueTasks` / `assignedTaskCount` deleted at:

**PO-4, commit `09a52be98` (PR #301) — entity dissolution.**

---

## §6 · The multi-analyze container

In the pre-wedge design, a `ProcessHub` could host **multiple simultaneous
investigations** (`ImprovementProject` instances). The process-owner monitoring
surface was built on this: the Current Process State panel narrated all
investigations in the hub simultaneously; the queues sorted them collectively.

The Dashboard's live **"New Analyze" button** (`Dashboard.tsx:690-696, 768-772`)
minted sibling projects under the selected hub — contradicting the IM-0a 1:1
Project⟷Hub constraint the investigation-surface design (2026-05-29) settled.

**Disposition:**

- Under V1 Project⟷Hub 1:1, the multi-analyze container question dissolved: one
  Project per Hub means the "container" is the Project itself.
- The operations-layer multi-analyze _orchestration_ surface (the hub-level
  dashboard showing all investigations, rollups across them, depth/status per
  investigation) is **named-future** — it requires the Hub to be a first-class
  navigable noun (VariScout Process's structural prerequisite, per
  [hub-portfolios.md](hub-portfolios.md)).
- `ProcessHubCard` and the Dashboard hub-card grid (the per-Hub rollup cards that
  rendered `activeAnalyzeCount`/`statusCounts`/`overdueActionCount`/`reviewSignal`)
  retired in:

**PO-4, commit `09a52be98` (PR #301) — entity dissolution.**

- The `ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata` entity itself — the
  projection type that `buildProjectMetadata` cast into and that backed all of
  §§3–6 above — dissolved entirely at the same commit. Surfaces now read
  `ImprovementProject` / `ProjectMetadata` / `ProcessContext` directly.

---

## §7 · Ancestry — three pre-wedge designs

This document synthesises from three pre-wedge design specs, preserved in
`docs/archive/specs/`. Read those specs for the original design rationale and
depth:

| Spec                                                                                                                                   | What it designs                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [Process Learning Operating Model (2026-04-27)](../../archive/specs/2026-04-27-process-learning-operating-model-design.md)             | The canonical operating-model design: cadence, PMS, three-level methodology, response paths, problem-solving loops                           |
| [Process Hub (2026-04-25)](../../archive/specs/2026-04-25-process-hub-design.md)                                                       | Hub as a multi-investigation container: user-facing model, investigation status, performance review + control boundary, agent-assisted steps |
| [Actionable Current Process State Panel (2026-04-27)](../../archive/specs/2026-04-27-actionable-current-process-state-panel-design.md) | The state-panel design: state-item taxonomy, component contracts, data flow, the huddle/review ritual surface                                |

These specs are superseded by the wedge pivot at the product-strategy level; their
design concepts are the source from which this document distils.

---

## §8 · Implementation commit trail

| PR             | Commit      | Content deleted                                                                                                                                                                                                        |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PO-1 (PR #298) | `094b563b`  | `ProcessHubCadenceQueues` · `ProcessHubCadenceQuestions` · cadence-only `ProcessHubFormat` helpers                                                                                                                     |
| PO-2 (PR #299) | `11ad356e`  | `analyzeDepth`/`analyzeStatus`/`nextMove` strip · `useCanvasFilters.ts` · `analyzeActions.ts` · `onPlansChanged` option · "New Analyze" buttons · hub picker · phantom sort keys `hasOverdueTasks`/`assignedTaskCount` |
| PO-3 (PR #300) | `b8923b449` | `buildProcessHubCadence` · `buildProcessHubReview` · `buildCurrentProcessState` · `processHubReview.ts` · `ProcessHubReviewPanel`                                                                                      |
| PO-4 (PR #301) | `09a52be98` | `ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata` / `ProcessHubRollup` entity types · `buildProcessHubRollups` · `ProcessHubCard` + Dashboard hub-card grid · `stateNotes` · phantom attention sort keys               |
| PO-5 (PR #302) | `5612d904e` | `investigationLineage` section type + factory seed · both apps' `applyAction` lineage cases · `toggleLineageFinding` + the CS-6 pin button                                                                             |

`git show <commit> --stat` reconstructs the file-level change set for each PR.

---

## §9 · Decision-log pointer

The `ProcessHubAnalyze` entity dissolution (PO-4) and the decision to name-future
the operations layer are recorded in:

- **ADR-090** ([`docs/07-decisions/adr-090-processhubanalyze-dissolution-lineage-retirement.md`](../../07-decisions/adr-090-processhubanalyze-dissolution-lineage-retirement.md)) — the two structural calls: entity dissolution + lineage retirement.
- **ADR-091** ([`docs/07-decisions/adr-091-two-tier-persistence-model.md`](../../07-decisions/adr-091-two-tier-persistence-model.md)) — the persistence model that makes V1 honest without the normalization the operations layer would have required.
- **`docs/decision-log.md`** — the connective Decision 0 entry (process-as-operations → named-future) and the PO-4/PO-5 delivery rows.

---

> The design is preserved. The code is deleted. Git and this document are both the
> historical record. When VariScout Process activates, this doc is the starting
> brief — not the final spec.
