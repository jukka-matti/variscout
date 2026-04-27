---
title: 'Phase 6 - Sustainment & Control Handoff'
audience: [product, designer, engineer]
category: design-spec
status: in-progress
related:
  - 2026-04-26-unified-process-hub-methodology-roadmap.md
  - 2026-04-25-process-hub-design.md
  - 2026-04-26-evidence-sources-data-profiles-design.md
date: 2026-04-26
---

# Phase 6 - Sustainment & Control Handoff

> **Implementation plan:** [`2026-04-26-phase-6-implementation-plan.md`](../plans/2026-04-26-phase-6-implementation-plan.md) — 20-task TDD breakdown derived from this spec.

## Summary

Phase 6 closes the Unified Process Hub Methodology Roadmap. The first five
phases take a process owner from "what is this hub" through cadence review,
question-driven EDA, Survey, and Evidence Source workflow. Phase 6 covers the
last unresolved arc: the moment an investigation has produced a verified
improvement and the team must answer, on a recurring basis,

```text
Is the improvement still holding, and where does the control actually live?
```

Phase 6 introduces two related but distinct user behaviours:

1. **Sustainment review inside VariScout** - a periodic check that uses the
   same cadence board surface to ask whether a verified improvement is still
   visible in evidence, with a light-weight record of who reviewed what and
   what they saw.
2. **Control handoff out of VariScout** - an explicit acknowledgement that
   the operating control for a verified improvement now lives in a live
   system the customer already runs (MES, QMS, SCADA, ticketing, alarm
   platform, dashboard, work instruction, training record, audit). VariScout
   stops claiming responsibility for the live control and only retains the
   handoff metadata.

Both behaviours are deliberately small. Phase 6 does not introduce a
control-plan editor, a runtime monitoring loop, or a customer-system
integration. It produces a sustainment record per investigation and a
control-handoff acknowledgement per investigation, and exposes them through
the existing Process Hub cadence board.

## Context

Phases 1-5 establish the process memory (`ProcessHub`, `ProcessHubInvestigation`,
`ProcessHubReview`, `ProcessHubCadenceSummary`, `EvidenceSource`,
`EvidenceSnapshot`). They also already include the conceptual surface for
sustainment - the existing `SUSTAINMENT_STATUSES` set covers `resolved` and
`controlled`, the cadence builder already exposes a `sustainment` queue, and
`ProcessHubAttentionReason` has a `sustainment` reason. What is missing is the
**explicit lifecycle** that takes an investigation from `verifying` through
`resolved` into either a recurring sustainment review cadence or a documented
control handoff.

The roadmap describes Phase 6 in two short bullets. Today an investigation in
`resolved` or `controlled` falls into the sustainment queue but the queue
cannot answer "when is the next review", "who owns it", "is it still
holding", or "is the control actually still our responsibility". The cadence
board is therefore correct as a surface but lacks records to populate.

The complement is real-world boundary management. VariScout is not an
operational platform (ADR-059, ADR-072). When an improvement is operationalised
elsewhere - alarms, escalation, MES recipe locks, training, work instructions,
SOC monitoring, internal audit - the customer expects VariScout to step out of
the control loop without losing the audit trail back to the investigation that
caused the change. The control handoff record is that audit trail.

The improvement-still-holding question is also the natural extension of the
question-driven EDA spine. Phases 1-5 added cadence question bands ("are we
meeting the requirement", "what changed", "where should we focus"). Phase 6
adds a fourth band, "is this control still holding", scoped to investigations
in sustainment.

## Scope

### In scope

- A typed `SustainmentRecord` per investigation that captures cadence, owner,
  most recent review, latest verdict, next-due date, and any open concerns.
- A typed `ControlHandoff` per investigation that captures the system that
  now operates the control, the form of the control (alarm, recipe, work
  instruction, training, audit, dashboard, ticket queue, other), the handoff
  date, the operational owner, and a free-text description.
- A typed `SustainmentReview` per executed review event - small append-only
  log (verdict, reviewer, snapshot reference, comment, observed signals).
- A new "is this control still holding" cadence question band, scoped to
  investigations whose effective `InvestigationStatus` is `resolved` or
  `controlled` and that have a `SustainmentRecord` whose next-due date is at
  or beyond the cadence board's evaluation horizon.
- An extension of the existing sustainment cadence queue to surface
  next-due, overdue, and recently-reviewed sustainment items, plus
  control-handoff acknowledgements that have not yet been recorded.
- IndexedDB v6 schema additions for the three record types.
- Blob namespace reservation under
  `process-hubs/{hubId}/sustainment/...` per ADR-072 conventions.
- Read-only context surfacing of sustainment state into
  `ProcessHubContextContract` for CoScout grounding.
- Test coverage for the new builders and read sites.

### Explicit non-goals

- No live alarm, escalation, or shift-critical monitoring path. Operational
  control stays with the customer's existing systems.
- No customer-system integration (MES, QMS, SCADA, ticketing, ERP, dashboard,
  alarm platform). VariScout records the existence of that system, never
  drives it.
- No control-plan editor or recurring control-plan table. Phase 6 records
  the **handoff**, not a Control Plan Lite document.
- No new domain Zustand store. Sustainment state lives on existing
  investigation persistence; cadence rollup is computed from
  `ProcessHubInvestigation` and the new sustainment records.
- No PWA implementation in Phase 6. Like Process Hub itself, sustainment is
  Azure-first; PWA stays compatible at the type level.
- No automatic verdict (i.e. VariScout does not declare on the user's behalf
  that "the improvement is still holding"). Verdict is always a human entry.
- No retroactive backfill of sustainment records for historical
  `resolved`/`controlled` investigations. Only investigations that pass
  through Phase 6 forward gain records; legacy ones surface as "set up
  sustainment" prompts.

## Single-spec recommendation

**Recommendation: keep Phase 6 as a single design spec.** Sustainment review
and control handoff are two ends of the same lifecycle - a verified
improvement either continues to need recurring evidence checks inside
VariScout or is acknowledged to live elsewhere. Splitting them would force
the control-handoff side to redefine the same record-vs-cadence boundary
and the same `InvestigationStatus`/`SUSTAINMENT_STATUSES` interactions twice.
The data model is small enough that one spec keeps the contract coherent.
If implementation later splits into two PRs (records first, cadence band
second), the spec still reads as one arc.

## Where Phase 6 fits in the roadmap arc

| Phase | What it produces                                                |
| ----- | --------------------------------------------------------------- |
| 1     | Process Hub catalog, investigation rollups                      |
| 2     | Cadence question bands (requirement / change / focus)           |
| 3     | Question-driven EDA + Survey readiness                          |
| 4     | Signal Cards, change signals, hub review                        |
| 5     | Evidence Sources, Data Profiles, Snapshots                      |
| **6** | **Sustainment record, sustainment review log, control handoff** |

Phase 6 deliberately rides on Phase 5: a sustainment review that needs
post-change evidence pulls the latest `EvidenceSnapshot` for the hub from
the investigation's primary Evidence Source, just as verification does. The
review log records which Snapshot was inspected so later reviewers see what
the previous reviewer saw.

## Data model

Phase 6 introduces three new types and extends `ProcessHubInvestigationMetadata`
with a single optional reference. It does **not** extend `InvestigationStatus`;
the existing nine-value enum already covers the relevant lifecycle states
(`verifying`, `resolved`, `controlled`). The override-on-derived contract
documented in `2026-04-25-process-hub-design.md` (lines ~457-471) remains
unchanged - users move into sustainment by setting the status override to
`resolved` or `controlled` exactly as today.

### `SustainmentRecord`

A live record on an investigation that has entered sustainment. Exists for
exactly one investigation at a time; created when an investigation first
acquires effective status `resolved` or `controlled`; deleted only if the
investigation is reopened (status drops back into `ACTIVE_STATUSES`). The
record carries the next-due date that drives the sustainment queue.

```ts
export type SustainmentCadence =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'on-demand';

export type SustainmentVerdict = 'holding' | 'drifting' | 'broken' | 'inconclusive';

export interface SustainmentRecord {
  /** Stable id, generated at first transition into sustainment. */
  id: string;
  /** Investigation that this record sustains. 1:1. */
  investigationId: string;
  /** Hub the investigation belongs to (denormalised for queue queries). */
  hubId: string;
  /** Cadence the team has committed to. */
  cadence: SustainmentCadence;
  /** When the next review is due. ISO-8601. */
  nextReviewDue?: string;
  /** Most recent review verdict, if any review has been logged. */
  latestVerdict?: SustainmentVerdict;
  /** Most recent review timestamp. */
  latestReviewAt?: string;
  /** Most recent review id (foreign key into SustainmentReview log). */
  latestReviewId?: string;
  /** Owner of the recurring review. */
  owner?: ProcessParticipantRef;
  /** Free-text concerns the next reviewer should look at. */
  openConcerns?: string;
  /** Set when the investigation has been handed off to a live system. */
  controlHandoffId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `SustainmentReview`

Append-only log of executed reviews. Multiple per investigation. A review
either confirms the improvement is holding, raises a concern, or escalates
back into a new investigation. The review references the Evidence Snapshot
that was actually inspected so the audit trail is complete.

```ts
export interface SustainmentReview {
  id: string;
  recordId: string; // FK to SustainmentRecord.id
  investigationId: string;
  hubId: string;
  reviewedAt: string;
  reviewer: ProcessParticipantRef;
  verdict: SustainmentVerdict;
  /** Optional Snapshot inspected during review. */
  snapshotId?: string;
  /** Optional summary of observed signals (free text, not a derived stat). */
  observation?: string;
  /** If the verdict was 'drifting' or 'broken', reviewer can mark a
   *  follow-up investigation id that was opened from this review. */
  escalatedInvestigationId?: string;
}
```

### `ControlHandoff`

Acknowledgement that operational control has moved out of VariScout. Exactly
zero or one per investigation. Existence of this record means VariScout no
longer claims responsibility for the live control; the sustainment cadence
shifts to "audit-only" or stops, depending on the team's choice. The
investigation's effective status typically becomes `controlled` once a
handoff is recorded; the override-on-derived rule still applies.

```ts
export type ControlHandoffSurface =
  | 'mes-recipe'
  | 'scada-alarm'
  | 'qms-procedure'
  | 'work-instruction'
  | 'training-record'
  | 'audit-program'
  | 'dashboard-only'
  | 'ticket-queue'
  | 'other';

export interface ControlHandoff {
  id: string;
  investigationId: string;
  hubId: string;
  /** What kind of live system now holds the control. */
  surface: ControlHandoffSurface;
  /** Customer-facing name of that system or program. Free text. */
  systemName: string;
  /** Person/team who operates the live control. */
  operationalOwner: ProcessParticipantRef;
  /** Date control was actually handed off (not necessarily today). */
  handoffDate: string;
  /** Free-text description of how the control works in the live system. */
  description: string;
  /** Optional reference link, e.g. URL to MES recipe id, audit program. */
  referenceUri?: string;
  /** Whether VariScout should keep doing periodic sustainment reviews
   *  alongside the live system. False = audit-only, no recurring queue. */
  retainSustainmentReview: boolean;
  recordedAt: string;
  recordedBy: ProcessParticipantRef;
}
```

### Metadata extension on `ProcessHubInvestigationMetadata`

A single optional pointer is added so cadence builders can avoid an extra
join on the read path:

```ts
export interface ProcessHubInvestigationMetadata {
  // ... existing fields unchanged
  sustainment?: {
    recordId: string;
    cadence: SustainmentCadence;
    nextReviewDue?: string;
    latestVerdict?: SustainmentVerdict;
    handoffSurface?: ControlHandoffSurface;
  };
}
```

This metadata block is a denormalised projection of the canonical
`SustainmentRecord` + optional `ControlHandoff`. Canonical state lives in
the records; the metadata is recomputed whenever a record is written, the
same way `findingCounts`/`actionCounts` are.

### Extension of `processHub.ts` constants and helpers

- `SUSTAINMENT_STATUSES` is **not** renamed and **not** extended. `resolved`
  and `controlled` continue to be the entry condition.
- A new helper `isSustainmentDue(record, now)` returns `true` when
  `nextReviewDue` is at or before `now`. Tested at the day-precision the
  cadence board uses today.
- A new helper `isSustainmentOverdue(record, now, graceDays)` returns
  `true` when `nextReviewDue` is more than `graceDays` past. Default
  `graceDays = 0` for v1.
- New cadence builder fragments `selectSustainmentReviews()` and
  `selectControlHandoffCandidates()` mirror the existing
  `selectVerification()` / `selectOverdueActions()` shape.

## UX surface

### Recommendation: extend `ProcessHubReviewPanel` with a Sustainment & Control section

Phase 6 reuses the existing cadence board chrome. Today
`apps/azure/src/components/ProcessHubReviewPanel.tsx` already renders a
`Sustainment` queue (driven by `cadence.sustainment`). Phase 6 upgrades that
section into two adjacent queues:

- **Sustainment reviews due** - investigations with a `SustainmentRecord`
  whose `nextReviewDue` is at or before today, sorted by overdue depth.
- **Control handoffs to confirm** - investigations whose effective status
  is `controlled` but no `ControlHandoff` record exists yet. This is a
  prompt to the user to either record the handoff or revert the status.

Both queues use the existing `QueueSection` visual treatment so the panel
stays one cohesive surface. A new "is this control still holding" cadence
question band is added at the top of the sustainment region (parallel to
the requirement/change/focus question bands rendered above).

### Alternatives considered, briefly

- **Sibling `ProcessHubSustainmentPanel`** - a dedicated panel for
  sustainment cadence, opened from a Process Hub. Rejected for v1 because
  it splits cadence attention across two panels and loses the at-a-glance
  "everything that needs my attention this week" property the existing
  cadence board has.
- **Question band only, no UI surface** - just add the "is this control
  still holding" band to the existing cadence question section. Rejected
  because it leaves the sustainment record itself without an editing
  surface. Phase 6 needs a place to set cadence and owner.

### Editing surface for records

Adding or editing a `SustainmentRecord`, recording a `SustainmentReview`,
and entering a `ControlHandoff` all happen from a small popover/drawer
opened from the investigation row in the cadence board, plus a parallel
entry point inside the editor's status override surface
(`apps/azure/src/pages/Editor.tsx` near the existing investigation-status
override). No new top-level workspace.

## Cadence integration

The existing cadence shape in `processHub.ts` is:

```text
ProcessHubCadenceSummary
  - latestSignals
  - latestEvidenceSignals
  - readiness
  - verification
  - actions
  - sustainment            <-- exists today, will gain real records
  - nextMoves
  - activeWork (by depth)
```

Phase 6 keeps the shape and changes how `sustainment` is built:

- `selectSustainment()` in v1 returns investigations whose status is in
  `SUSTAINMENT_STATUSES` and whose `metadata.sustainment.nextReviewDue` is
  due-or-overdue. Investigations in sustainment without a record show up
  with a `setup-sustainment` reason instead of `sustainment-candidate`.
- A new `selectControlHandoffCandidates()` returns investigations whose
  effective status is `controlled` and which lack a `ControlHandoff`. These
  surface in the same cadence panel under "Control handoffs to confirm".
- `ProcessHubCadenceSnapshot.sustainment` becomes the count of due
  reviews + missing-handoff prompts (today it counts all sustainment
  candidates, regardless of whether a record exists).
- A new optional `sustainmentReviewed` field on the snapshot records "how
  many recent reviews were logged in the cadence horizon" so the panel
  can show positive activity ("4 reviews logged this week, 2 due now")
  rather than only the unfinished pile.

The new question band integrates via the existing question-band mechanism:

- `buildSustainmentReviewBand(rollup, now)` returns a band entry the
  cadence panel can render alongside the requirement/change/focus bands.
- The band's content is "Investigation X was verified Y days ago - is the
  improvement still visible in the latest Snapshot?" with the latest
  Snapshot's hub-level signal embedded.

Additions to the cadence builder (names, no implementation):

- `buildSustainmentReview(investigation, record, snapshots)` - build a
  single review draft with prefilled context.
- `selectSustainmentReviews(rollups, now, options)` - top-level cadence
  selector.
- `selectControlHandoffCandidates(rollups, now)` - companion selector.
- `buildSustainmentReviewBand(rollup, now)` - cadence question-band entry.

## Storage

### IndexedDB schema (Azure)

`apps/azure/src/db/schema.ts` is currently at version 5. Phase 6 adds
version 6:

```text
v6.stores({
  ...v5 stores,
  sustainmentRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt',
  sustainmentReviews: 'id, recordId, investigationId, hubId, reviewedAt',
  controlHandoffs:    'id, investigationId, hubId, handoffDate',
})
```

Indices chosen so the cadence builder can query by hub, by investigation,
and by next-due date without a full scan. `sustainmentReviews` is queried
mostly by `recordId` (latest review for a record) and occasionally by
`hubId` (per-hub recent activity), so both are indexed.

### Blob namespace (Azure Team)

ADR-072 reserves `process-hubs/{hubId}/...`. Phase 6 reserves the
sustainment subtree:

```text
process-hubs/{hubId}/sustainment/
  records/{recordId}.json
  reviews/{recordId}/{reviewId}.json
  handoffs/{handoffId}.json
  _index.json
```

`_index.json` is a small catalog of records under the hub, mirroring the
Evidence Source catalog convention from
`processHubEvidenceSourcesCatalogPath`. The full review log lives under
`reviews/{recordId}/...` so the catalog stays small even when a record
has many reviews. Conflict resolution follows existing Blob sync
conventions (last-writer-wins on individual JSON files; the catalog is
rebuilt from the per-record files when a sync conflict is detected).

### PWA

PWA does not implement Phase 6 storage. Types are exported from
`@variscout/core` so PWA stays compatible at the type level (matching the
Process Hub MVP boundary).

### Data flow

- Status transition that puts an investigation into `resolved`/`controlled`
  surfaces a "set up sustainment" prompt; user creates a `SustainmentRecord`.
- Each cadence review writes a `SustainmentReview` and updates the
  `SustainmentRecord.latestVerdict`/`latestReviewAt`/`latestReviewId` plus
  recomputes `nextReviewDue` from the cadence.
- Recording a `ControlHandoff` updates `SustainmentRecord.controlHandoffId`
  and the investigation's metadata projection.
- All record writes recompute and persist the
  `metadata.sustainment` projection on the investigation so cadence
  rollups remain a pure function of `ProcessHubInvestigation`.

### CoScout context

`ProcessHubContextContract.sustainment` is extended from the current
`{ candidates: number }` shape to also include due/overdue counts and the
most recent verdicts (verdict counts, not free text), matching ADR-072's
"deterministic, customer-owned, readable without invoking AI" requirement.
CoScout reads but does not write.

## Tests

### `packages/core/src/__tests__/`

- `processHub.sustainment.test.ts`
  - `isSustainmentDue` boundary cases (today, yesterday, tomorrow,
    undefined, far future).
  - `isSustainmentOverdue` with `graceDays = 0` and `graceDays = 7`.
  - `selectSustainmentReviews` returns only investigations in
    `SUSTAINMENT_STATUSES` with a record whose `nextReviewDue` is due.
  - `selectSustainmentReviews` excludes `controlled` investigations whose
    `ControlHandoff.retainSustainmentReview` is `false`.
  - `selectControlHandoffCandidates` returns `controlled` investigations
    with no handoff record.
  - `buildSustainmentReviewBand` returns null when no investigations are
    in sustainment.
  - Cadence snapshot counts are stable when a record is added with no
    review yet (no NaN, no negative numbers - ADR-069 boundary).
- `processHubContext.sustainment.test.ts`
  - `ProcessHubContextContract.sustainment` shape has expected fields.
  - Verdict counts are derived from the most recent review per record,
    not all reviews ever.

### `apps/azure/src/__tests__/`

- `db.schema.v6.test.ts`
  - Database opens at version 6 from a clean state.
  - Database opens at version 6 after upgrade from version 5 (no data
    loss in `processHubs`, `evidenceSources`, `evidenceSnapshots`,
    `projects`, `syncQueue`, `syncState`, `photoQueue`,
    `channelDriveCache`).
- `ProcessHubReviewPanel.sustainment.test.tsx`
  - Sustainment region renders the new question band when at least one
    record exists.
  - Empty state renders the "set up sustainment" prompt for a
    `resolved` investigation with no record.
  - Control handoff candidate row renders when status is `controlled`
    without a `ControlHandoff`.
  - Logging a review updates the cadence snapshot count without a full
    panel rerender.
  - Recording a handoff with `retainSustainmentReview = false` removes
    the investigation from the sustainment-due queue.
- `sustainmentStorage.test.ts`
  - Round-trip a `SustainmentRecord` through IndexedDB.
  - Append `SustainmentReview` entries and read them back ordered by
    `reviewedAt`.
  - Round-trip a `ControlHandoff`.
  - Blob path helpers produce the documented namespace.

### CoScout context

- `coScoutContext.sustainment.test.ts`
  - Verdict counts and overdue counts are present in the assembled
    context.
  - No reviewer free-text fields leak into the context.

### E2E (deferred)

`claude --chrome` walk for the cadence panel sustainment region is a
post-merge step, not part of this spec. The walk should at minimum cover:

- Move an investigation from `verifying` to `resolved`, confirm the
  "set up sustainment" prompt appears, set cadence + owner + first due
  date, confirm the row moves into the sustainment queue.
- Log a `holding` review against the latest Evidence Snapshot, confirm
  the cadence snapshot decrements due-count and increments
  reviewed-count.
- Log a `drifting` review and escalate to a new investigation, confirm
  the new investigation appears in the active depth queue.
- Record a `ControlHandoff` with `retainSustainmentReview = false`,
  confirm the row leaves the sustainment-due queue and the handoff is
  visible on the investigation row.

## Open questions

1. **Cadence anchor** - is `nextReviewDue` anchored to the most recent
   review's `reviewedAt`, to the original verification date, or to a
   user-set "first review on" date? Recommendation: most recent review,
   falling back to verification date for the first review. Confirm with a
   process owner before locking the helper.
2. **Reopen semantics** - when a user reverts an investigation from
   `resolved` back to `improving`, do we delete the `SustainmentRecord`,
   archive it, or keep it dormant? Audit-trail-friendly choice is archive,
   but this implies a tombstone field on the record.
3. **Multi-investigation control** - some controls cover multiple
   investigations on the same hub (e.g. one MES recipe lock prevents
   three drift modes). Phase 6 assumes one record per investigation; do
   we allow a `ControlHandoff` to be referenced by multiple
   investigations, or duplicate the handoff per investigation?
4. **CoScout proactivity** - should the new question band be a fully
   passive band, or should CoScout also draft a "no Snapshot signal change
   in the last week, recommend recording 'holding' verdict" suggestion?
   Default in Phase 6 is passive; flag for follow-up.
5. **Handoff surfaces enum vs free text** - is `ControlHandoffSurface` a
   closed enum (8 values + `other`) or free-text-with-suggestions? Closed
   enum gives better cadence-board grouping but rules out unusual
   customer realities.
6. **Retention and PII** - reviewer identifiers and free-text observations
   carry weak PII. ADR-059 keeps everything in the customer's tenant,
   but should sustainment records also have a documented retention
   horizon (e.g. 2 years), or do they follow the investigation's
   lifetime?

## Acceptance criteria

1. A process owner can mark an investigation as `resolved` or `controlled`
   and the cadence board prompts them to set up a sustainment cadence,
   owner, and next-due date - without a control-plan editor.
2. Logging a sustainment review updates the cadence board's "due now"
   count and surfaces the verdict on the investigation row.
3. A control handoff to MES, QMS, SCADA, training, audit, dashboard,
   ticket queue, or other can be recorded with system name, owner,
   handoff date, and description; the investigation row visibly indicates
   that operational control lives elsewhere.
4. The cadence question band "is this control still holding" appears only
   when at least one investigation in sustainment exists, and references
   the most recent Evidence Snapshot for the hub.
5. The sustainment queue distinguishes "due", "overdue", and "recently
   reviewed" without flattening them into a single bucket.
6. CoScout context exposes sustainment counts and verdict distribution
   without exposing free-text observations or reviewer identifiers.
7. All sustainment data persists through Azure IndexedDB v5 to v6
   migration without data loss in any pre-existing table.
8. The Blob namespace `process-hubs/{hubId}/sustainment/...` is documented
   and used by the implementation, even if the slice ships before Blob
   sync is wired for these records.
