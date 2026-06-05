---
title: >-
  ADR-090: ProcessHubAnalyze dissolution + investigationLineage retirement
status: active
date: 2026-06-05
purpose: decide
tier: living
audience: both
topic:
  [
    entity-disposition,
    process-as-operations,
    findings-domain,
    investigation-lineage,
    wedge-v1,
    persistence,
  ]
related:
  - adr-078-pwa-azure-architecture-alignment
  - adr-085-drop-question-problem-statement-scope
  - adr-082-wedge-architecture
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
layer: L5
last-verified: 2026-06-05
verified-against-commit: 5612d904e
---

# ADR-090: ProcessHubAnalyze dissolution + investigationLineage retirement

**Status:** Accepted
**Date:** 2026-06-05

## Context

The 2026-06-04 process-as-operations extraction spec
(`docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md`)
settled the disposition of two structural entities that were the backbone of the
pre-wedge cadence-review operations layer:

**1. `ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata`** — a projection entity
synthesised by `buildProjectMetadata` at Dashboard render. Pre-extraction grounding
(9 code-readers + 24 adversarial verifications) revealed it was never a persisted
entity in the DDD sense: Azure cast `ImprovementProject.metadata` into
analyze-shaped objects on the fly; the `INVESTIGATION_*` HubAction surface was
dead (no-op reducers, zero dispatchers); the Azure `AnalyzeReadAPI` was a stub;
the PWA `investigations` Dexie table was never written. It was a projection wearing
the clothes of an entity.

Its fields served two distinct masters: **process-owner cadence operations**
(`analyzeDepth`, `analyzeStatus`, `nextMove`, `stateNotes`, `reviewSignal`, the
attention-taxonomy rollup fields) which are VariScout Process territory (ADR-082,
connective Decision 0); and **V1 survivors** (`processHubId`, `findingCounts`,
`sustainment`, `nodeMappings`, `migrationDeclinedAt`) which belong on
`ImprovementProject`, `ProjectMetadata`, and `ProcessContext` directly.

The multi-analyze future (multiple `ImprovementProject` instances per hub) was
deferred at ADR-078 D3. The V1 Project⟷Hub 1:1 invariant (IM-0a) dissolved the
last reason to maintain the projection entity.

**2. `investigationLineage`** (`IP.sections.investigationLineage`) — a section
containing `{findingIds: string[], hypothesisIds: string[]}` designed to answer
"of all the findings in this hub, which belong to this investigation?" IM-0a
dissolved the question (document boundary ≈ project boundary). The two halves had
distinct delivery histories:

- `hypothesisIds` was **never wired** — zero writers existed (the Report's
  `ReportView.tsx:182` filtered hypotheses by this never-written set, producing a
  silent Report-collapse defect in active-IP scope).
- `findingIds` was **deliberately wired** by CS-6 (PR #287, 2026-06-04): the
  FindingCard pin gesture populated `investigationLineage.findingIds` per the
  connective spec §4.6 Edge-2. This wire is **intentionally reversed** by this
  decision (spec §4.1–4.2). The reversal is recorded loudly because a shipped
  delivery is being undone.

## Decision

### Call 1: `ProcessHubAnalyze` dissolves

**No projection entity is synthesised.** Surfaces that previously read
`ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata` read `ImprovementProject`,
`ProjectMetadata`, and `ProcessContext` directly:

- V1-keep fields (`processHubId`, `findingCounts`, `sustainment`,
  `nodeMappings`, `migrationDeclinedAt`) re-home to their natural owners
  (`ProjectMetadata` for the first three, `ProcessContext` for the last two —
  where the data lived already).
- **`nodeMappings` on `ProcessContext` is the CS-P2 contract**: the
  `ProcessStepCapabilitySource` typed carrier introduced in PO-4 (replacing the
  `(inv as {rows?}).rows` duck cast) formalises this path as the
  per-step-capability data source CS-P2 consumes.
- Cadence-operations fields (`analyzeDepth`, `analyzeStatus`, `nextMove`,
  `stateNotes`, `reviewSignal`, attention rollups, the multi-analyze Dashboard
  hub-card grid) — **shed to named-future** (VariScout Process territory, §10
  relocation doc at
  `docs/01-vision/variscout-process/process-operations-layer.md`).
- `analyzeStatus` predicate re-sourced in PO-2: Control-readiness is now
  `control-eligible` (analyst advanced to Control stage or a ControlRecord exists)
  / `controlled` (active ControlRecord) — a small typed source from the wedge stage
  marker, not the shed enum.

**Delivered by:** PO-4 (PR #301, commit `09a52be98`).

### Call 2: `investigationLineage` retires

**The section type, factory seed, and all consumers are deleted.** The
`investigationLineage` section is removed from `ImprovementProject.sections`.

The Report composes from **analyst-owned `HypothesisStatus`** (CS-10) instead of
a membership list:

- `evidence-survived-test` / `evidenced` → narrative + cause rows;
- `refuted` → "tested and excluded" section;
- `proposed` / `needs-disconfirmation` → open-questions block.

Findings enter via hypothesis linkage + their own `FindingStatus` for section
placement. The `selectIPReportScope → linkedHypothesisIds` path and
`deriveIPCauseRows` were rewritten to key on status (PO-5).

**The CS-6 pin wire (PR #287) is reversed.** The FindingCard pin gesture no longer
populates lineage. Under active-IP scope, the Wall shows the whole document
(density is CS-12 DOI/Focus territory, not membership filtering — per the
`empty-set-means-unfiltered interim` established in PR #296 as the permanent
semantics).

The Report-collapse defect (`hypothesisIds` never-written → empty Report hypothesis
list in active-IP scope) is fixed by deletion: the membership system that depended
on the never-written field is replaced by the status system that has live data.

**Trade-off recorded:** The CS-6 pin let the analyst exclude a finding from the
Report without changing their epistemic verdict. Post-retirement, status is the
single judgment system — "exclude from Report" and "my verdict on the evidence"
conflate. Accepted deliberately (owner direction: one judgment system, no stored
membership). Escape hatch if noise control is demanded: a per-finding "show in
Report" boolean as Report-view state, addable without resurrecting lineage. Revive
trigger = user demand.

**Delivered by:** PO-5 (PR #302, commit `5612d904e`).

## Consequences

### Positive

- **The Report-collapse defect is fixed by deletion.** Under active-IP scope the
  Report now renders all hypotheses routed by status, not an empty membership set.
- **Code surface shrinks.** The projection entity + its synthesis machinery
  (`buildProjectMetadata`'s analyze-shaped output, the `INVESTIGATION_*` dead
  action surface, the PWA `investigations` Dexie table) are gone. Surfaces read the
  real owning types directly; the type graph is flatter.
- **The CS-P2 contract is clean.** CS-P2 sources per-step capability from
  `ProcessContext.nodeMappings` via the typed `ProcessStepCapabilitySource` carrier
  — never from a projection-entity rollup that required the hub's full analyze
  history to be in memory.
- **"Tool assists, analyst decides" is enforced by structure.** Removing the
  membership list (lineage) means the Report can only reflect what the analyst
  actually judged (status), not a mechanical membership gesture. The escape hatch
  (per-finding show-in-Report toggle) is addable later without re-introducing a
  parallel membership system.

### Harder

- **The CS-6 pin wire is a shipped delivery that was reversed.** This is the
  explicitly recorded case: the Edge-2 lineage wire (PR #287) shipped, then PO-5
  reversed it. The connective spec §4.6 carries the supersession banner noting this
  (added by PO-5). Future readers must not interpret the §4.6 pre-banner text as
  live design.
- **Pre-PO-5 `.vrs` files** that carried `investigationLineage.findingIds` will
  deserialize with the section silently dropped (wedge no-back-compat). Loud
  validation of unknown sections lands in PO-8a.

### Forward implication

- **Process-owner monitoring surfaces** (the cadence model, queues, work-item
  fields, multi-analyze container) are preserved as named-future design in
  `docs/01-vision/variscout-process/process-operations-layer.md`. When VariScout
  Process activates, that document is the starting brief.
- **ADR-078 D3** (multi-analyze future deferred) is amended — the entity dissolves
  under V1; the named-future design relocates to the §10 doc (see D4 amendment in
  `adr-078-pwa-azure-architecture-alignment.md`).
- **The `ProcessHubView` husk** (`GoalBanner + CapabilityTab + B0-migration
banner`) survives until CS-P2 retires it (host-ordering fix, spec §5). CS-P2
  owns the CapabilityTab lift; the husk is not this ADR's to delete.

## Links

- Spec: `docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md` §§3–5
- Master plan: `docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md` rows PO-4, PO-5
- PR #301 (PO-4, entity dissolution): commit `09a52be98`
- PR #302 (PO-5, lineage retirement): commit `5612d904e`
- PR #287 (CS-6, superseded pin wire): lineage wire reversed by PO-5
- ADR-078 (D3 amendment — multi-analyze future + entity dissolution)
- ADR-085 (ScopeFilter-reconcile mandate, closed by the PO cascade — §6 deletion)
- Connective spec §4.6 (supersession banner for the CS-6 wire)
- `docs/01-vision/variscout-process/process-operations-layer.md` (§10 relocation)
- ADR-091 (two-tier persistence model — the structural context this dissolution clarifies)
