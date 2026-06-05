---
title: >-
  ADR-091: Two-tier persistence model — operational entities + analysis aggregate
status: active
date: 2026-06-05
purpose: decide
tier: living
audience: both
topic: [persistence, architecture, dexie, document-snapshot, vrs, wedge-v1, schema-policy]
related:
  - adr-059-web-first-deployment-architecture
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-003-indexeddb
  - adr-012-pwa-browser-only
  - adr-078-pwa-azure-architecture-alignment
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
layer: L5
last-verified: 2026-06-05
verified-against-commit: 5612d904e
---

# ADR-091: Two-tier persistence model — operational entities + analysis aggregate

**Status:** Accepted
**Date:** 2026-06-05

## Context

VariScout's persistence layer has evolved from an under-specified implicit pattern
toward an explicit two-tier model. The process-as-operations extraction spec
(2026-06-04, §9) promoted this to a declared architectural decision based on:

1. **Research validation** (6 web researchers + adversarial critic, unanimous
   SUPPORT): Figma (Postgres operational metadata + monolithic per-document
   checkpoints), tldraw (one JSON snapshot on disk, document/session split),
   Automerge (document as the addressable, wholesale-loaded unit), and Excalidraw
   (one versioned JSON file) all converge on two-tier separation. Notion
   normalises because it _queries across documents_ — the exact pattern
   ADR-073 forbids VariScout.
2. **History corroborates:** the F3-era normalised analyze-domain Dexie surface
   (findings/hypotheses/causalLinks/investigations tables) went dead in live code.
   Normalisation belongs in memory (the 9 Zustand stores), not necessarily on disk.
3. **IndexedDB research:** the bottleneck is **transaction count, not record size**
   — one aggregate read/written in one transaction is transaction-optimal.

The pre-ADR implicit pattern had:

- Tier-1 operational entities (individual Dexie rows + blob sync) for
  `ProcessHub`, `ImprovementProject`, `ControlRecord/Review/Handoff`, etc.
- Tier-2 analysis aggregate (`DocumentSnapshot` → Azure blob / `.vrs` file) for
  the working set (raw data, findings, hypotheses, scopes, canvas structure).
- But no declared rule distinguishing them, no explicit bridge rules, and no schema
  policy beyond `schemaVersion: 1` (strict-reject on any other value).

The `ProcessHubAnalyze` projection entity (dissolved by ADR-090) was a symptom of
the under-specification: it tried to be both a portfolio-visible operational entity
and an in-memory projection summary.

## Decision

VariScout adopts the **explicit two-tier persistence model** for the Azure build.
(PWA scoping: see §9.1 R6d guard below.)

### §9.1 · The two tiers

> **App scoping — R6d guard:** Tier-1 per-entity Dexie + blob sync and ALL schema/
> durability hardening in §9.3–§9.4 apply to the **Azure build only**. The PWA is
> session-only per R6d — it must gain no new IndexedDB document-save paths or
> reload promises. Its sole Tier-2 durability is `.vrs` export/import; its only
> schema concern is `.vrs` forward-compat (newer-than-reader, §9.3). The one V1
> note: quick-analysis findings now round-trip through `.vrs` (PO-6, PR #303) —
> the PWA's "save findings" promise is true via export, not IndexedDB.

| Tier                                                                                         | Entities                                                                                                                                                                                                                                               | Persistence                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Tier 1 — operational entities** (portfolio-visible, cross-session, individually addressed) | `ProcessHub` · `ImprovementProject` (+ `ProjectMetadata` projection) · `EvidenceSnapshot` + provenance · `ControlRecord/Review/Handoff` · `ProjectMember` (embedded in `ImprovementProject.metadata.members` — no separate Dexie table; action-routed) | Per-entity Dexie tables · action-routed writes · per-entity blob sync                          |
| **Tier 2 — the analysis aggregate** (the working set, loaded wholesale into the stores)      | raw data + findings + hypotheses + scopes + causal links + durable canvas structure                                                                                                                                                                    | `DocumentSnapshot` → one Azure blob / one `.vrs` file — **one schema, parity by construction** |

**Do not split Tier 2; do not normalise the analysis domain; no CRDTs for V1**
(research verdict). The large aggregate is a **conscious deviation from Vernon's
small-aggregates rule** — that rule targets multi-user contention + partial-load
cost; here contention is coarse (per-project, 2–5 users, blob ETag) and the whole
document is in memory anyway. Invariants set the boundary, not size.

### §9.2 · Bridge rules

1. **Projection single-writer + load-time heal.** `ProjectMetadata` is written only
   by `buildProjectMetadata` at save (the `sustainment` direct-Dexie path is the
   one sanctioned bypass, documented). On project open the portfolio card is
   recomputed from the loaded aggregate and healed on mismatch — a partial save
   can never become a permanent lie.

2. **FK direction.** Tier 1 may hold Tier-2 roots (`projectId`, `hubId`); nothing
   inside the aggregate references Tier-1 rows. The PO-7 rename sweep enforces the
   spirit: `investigationId → projectId` on all join-key fields makes the naming
   match the runtime truth.

3. **Co-load invariant.** Any feature joining a Tier-2 finding to a Tier-1 record
   (evidence/provenance) does so **in-memory after wholesale load** — never via a
   cross-document query.

4. **View-state exclusion — a known violation, PO-8a fix.** Per-user `ViewState`
   (`activeView`/`activeTab`/`focusedChart`/`boxplotFactor`/`findingsViewMode`)
   already serialises into the shared snapshot (`buildProjectSnapshot`,
   `documentSnapshot.ts:95`; hydrated on load, `projectStore.ts:93,159,353`). A
   teammate's import adopts the saver's working context. **PO-8a fixes this** by
   stripping `viewState` from the shared snapshot or splitting it into a per-user
   session record. Rule going forward: "canvas state" in the aggregate means
   durable analytical structure only.

### §9.3 · Schema policy

- **`schemaVersion: 1` already exists** — `DocumentSnapshot.schemaVersion` is a
  literal `1` today; the `.vrs` validator **strict-rejects any other value**
  (`documentSnapshotVrs.ts:34`). PO-8a is therefore not "add the field" but:
  _re-freeze v1 after the cleaned post-PO-7 shape lands, and replace the
  strict-reject validator with a three-way branch_ — known-current → load ·
  known-but-newer → read-only + warning · unknown/corrupt → strict-assert throw.
  The shipped `documentSnapshotVrs.test.ts:125` flips from newer-rejected to
  newer-opens-read-only.

- **Strict-assert on load** for malformed/corrupt documents (loud failure per
  `feedback_strict_assert_over_silent_migration`) — **with a documented expiry:**
  the first real customer's saved `.vrs`/blob is permanent history; strict-reject
  of old versions becomes data loss at that instant.

- **Newer-than-reader (launch-blocking).** A _known-but-newer_ `schemaVersion`
  opens **read-only with a "saved by a newer version" warning** — never a refusal.
  With staggered upgrades across 2–5 users, a Member on an older build opening a
  Lead's newer blob is a day-one scenario. Incompatibility surfaces as a user-facing
  message, never an uncaught throw.

- **Migration-dispatch seam scaffolded in PO-8a.** An (initially empty)
  `migrateVn→Vn+1` table + an additive-first content model (the tldraw/Automerge
  pattern) so the first post-customer schema change is a migration, not an event.

### §9.4 · Normalization retired as a goal

**Do not switch the write model back to per-entity Dexie tables for the analysis
domain.** The cross-document queryability pattern (e.g., "all findings across
projects") has no V1 query (ADR-073; the portfolio reads `ProjectMetadata`
projections). Revive trigger = a real product need (cross-project search, portfolio
CoScout). Revive path = **derive an index from aggregates** — not switching writes.

### §9.5 · PO-7 accepted cost — pre-rename persisted keys

**Recorded explicitly.** The PO-7 honest-rename sweep (`investigationId →
projectId` across all join-key fields) is **name-only** — no persistence migration,
no back-compat shim, no key transforms. Pre-rename persisted data (Dexie rows with
`investigationId`, `.vrs` blobs with `scope.investigationId`) will deserialise with
the renamed field `projectId === undefined` and silently stop joining.

This is the **wedge no-back-compat** accepted cost. It is acceptable because:

- V1 had no customer data at the time of the rename (the rename swept production
  code before the first customer save).
- The loud validator (`schemaVersion` three-way branch) lands in PO-8a — the
  proper enforcement point once version semantics are stable.

**Documentation-by-test:** a test in the vrs round-trip suite verifies that a
hand-built pre-rename snapshot JSON (with `scope.investigationId`) deserialises
without throwing and yields `scope.projectId === undefined`, with a comment:
_"wedge no-back-compat (ADR-091): pre-rename .vrs scope joins are silently
dropped; loud validation is PO-8a."_

## Consequences

### Positive

- **One explicit rule, not accumulated convention.** The two-tier boundary is
  declared; future PRs that add persistence can categorize correctly without
  archaeology.
- **Transaction-optimal.** The analysis aggregate is one read/write per session
  (one blob, one `.vrs`) — the IndexedDB transaction-count bottleneck argument
  confirms this is correct, not accidental.
- **Portfolio scale improves.** Home synthesises `ProjectMetadata` projections
  (save-time, linear in small metadata) instead of spinning up analysis entities
  per mount. This is why the dissolving-projection entity's non-cadence fields
  (findingCounts, sustainment) are kept on `ProjectMetadata`.
- **Schema policy is auditable.** The three-way branch (current/newer/corrupt) plus
  the migration-dispatch seam means the first post-customer schema change has a
  defined path.

### Harder

- **View-state is a known violation until PO-8a.** Importing a collaborator's
  snapshot adopts their working context. The fix is specified; the budget
  (dirty-fingerprint + fixture updates) is acknowledged.
- **Concurrency + durability hardening is PO-8b.** The 412 UX evolution (shipped
  auto-fork → explicit reload-or-branch), Web Locks, `navigator.storage.persist()`,
  worker-marshal serialize + Blob-PUT, and size telemetry land there, not here.
  The existing `If-Match`/`412` mechanism already prevents blind overwrites.
- **Pre-PO-7 `.vrs` files** join silently against `projectId === undefined`.
  Acceptable under wedge no-back-compat; PO-8a adds loud validation.

### Forward implication

- **Derive, don't normalise.** When any future feature needs cross-document
  querying (portfolio search, cross-project CoScout), the path is to derive an
  index from aggregates at read time — not to re-introduce per-entity write tables
  for analysis-domain entities.
- **PWA gains no Tier-1 for analysis entities.** R6d is a hard boundary. If the
  PWA SKU grows to include cross-session durability, that is a separate spec
  decision — not an incremental add to the shared `DocumentSnapshot`.

## Links

- Spec §9: `docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md` §9
- Master plan PO-8a/8b rows: `docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md`
- ADR-073 (no statistical roll-up across heterogeneous units — why no cross-document queries)
- ADR-059 (web-first; Azure Blob Storage)
- ADR-003 (IndexedDB for storage — the original choice)
- ADR-012 (PWA browser-only — the R6d constraint source)
- ADR-078 (PWA + Azure architecture alignment — D2 persistence tier-gate)
- ADR-090 (ProcessHubAnalyze dissolution — the trigger that made this declaration necessary)
