// apps/pwa/src/db/schema.ts
//
// F3 normalized PWA Dexie schema.
//
// Renames the IDB database from `variscout-pwa` (legacy single-blob document store) to
// `variscout-pwa-normalized` and declares 13 tables per spec §3 D3.
//
// Locked decisions:
//   1. DB rename, not version chain. The legacy `variscout-pwa` DB is
//      orphaned in browser storage. Per wedge V1 no-back-compat policy
//      (no users), the previous best-effort delete-on-construction has been
//      retired; any stale legacy DB on dev machines is harmless.
//   2. `version(1)` of the new schema. No `.upgrade()` callback; future schema
//      work uses normal `version()`/`.upgrade()` chains from this point.
//   3. canvasState lives in its own table (1:1 with hub). On
//      `HUB_PERSIST_SNAPSHOT` the persistence layer decomposes
//      `hub.canonicalProcessMap` out of the hub blob into a `canvasState` row;
//      reads in `PwaHubRepository.hubs.get/list` rejoin it.
//   4. `outcomes` are decomposed out of the hub blob and persisted with their
//      `hubId` foreign key (already on `OutcomeSpec` via core).
//
// All other tables (evidenceSnapshots, evidenceSources, evidenceSourceCursors,
// rowProvenance, findings, causalLinks,
// hypotheses) start empty in F3 — the dispatch boundary will be wired by
// F3.5 (evidence) and F5 (finding/causalLink/
// hypothesis + canvas action coverage). The `questions` table (IM-1, ADR-085)
// was dropped at v10 — ProblemStatementScope persists via the analyze blob.
// The former documentSnapshots table was dropped at v12 when PWA durability
// became export-only (.vrs). The never-written `investigations` projection
// table was dropped at v13 (PO-4 — ProcessHubAnalyze dissolved).
//
// Spec: docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md §3 D3, §5

import Dexie, { type Table } from 'dexie';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type {
  EvidenceSnapshot,
  EvidenceSource,
  EvidenceSourceCursor,
  RowProvenanceTag,
  ControlRecord,
  ControlReview,
  ControlHandoff,
} from '@variscout/core';
import type { Finding, CausalLink, Hypothesis, ActionItem } from '@variscout/core/findings';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessMap } from '@variscout/core/frame';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export interface MetaRow {
  key: string;
  value: unknown;
}

/**
 * Hub metadata row — the durable hub fields minus the embedded
 * `outcomes` array and `canonicalProcessMap` blob, which are decomposed into
 * the `outcomes` and `canvasState` tables respectively on `HUB_PERSIST_SNAPSHOT`.
 */
export type HubRow = Omit<
  ProcessHub,
  'outcomes' | 'canonicalProcessMap' | 'controlRecords' | 'controlReviews' | 'controlHandoffs'
>;

/**
 * Outcome row — the public `OutcomeSpec` entity. `OutcomeSpec` already carries
 * `hubId: ProcessHub['id']` (see `packages/core/src/processHub.ts`), so no
 * wrapper is needed. Reads strip nothing; the public entity shape is the row
 * shape.
 */
export type OutcomeRow = OutcomeSpec;

/**
 * 1:1 with hub. Stores the hub's canonical process map keyed by `hubId`.
 * Spread of ProcessMap fields keeps the row queryable by Dexie without
 * wrapping the map in a sub-property.
 */
export type CanvasStateRow = { hubId: ProcessHub['id'] } & ProcessMap;

export type EvidenceSnapshotRow = EvidenceSnapshot;
export type EvidenceSourceRow = EvidenceSource;
export type EvidenceSourceCursorRow = EvidenceSourceCursor;
export type RowProvenanceRow = RowProvenanceTag;
export type FindingRow = Finding;
export type CausalLinkRow = CausalLink;
export type HypothesisRow = Hypothesis;
export type ImprovementProjectRow = ImprovementProject;
export type ActionItemRow = ActionItem & { hubId: ProcessHub['id'] };
export type ControlRecordRow = ControlRecord;
export type ControlReviewRow = ControlReview;
export type ControlHandoffRow = ControlHandoff;
export type MeasurementPlanRow = MeasurementPlan;

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export class PwaDatabase extends Dexie {
  hubs!: Table<HubRow, string>;
  outcomes!: Table<OutcomeRow, string>;
  evidenceSnapshots!: Table<EvidenceSnapshotRow, string>;
  rowProvenance!: Table<RowProvenanceRow, string>;
  evidenceSources!: Table<EvidenceSourceRow, string>;
  evidenceSourceCursors!: Table<EvidenceSourceCursorRow, string>;
  findings!: Table<FindingRow, string>;
  causalLinks!: Table<CausalLinkRow, string>;
  hypotheses!: Table<HypothesisRow, string>;
  improvementProjects!: Table<ImprovementProjectRow, string>;
  actionItems!: Table<ActionItemRow, string>;
  controlRecords!: Table<ControlRecordRow, string>;
  controlReviews!: Table<ControlReviewRow, string>;
  controlHandoffs!: Table<ControlHandoffRow, string>;
  canvasState!: Table<CanvasStateRow, string>;
  meta!: Table<MetaRow, string>;
  measurementPlans!: Table<MeasurementPlanRow, string>;

  constructor() {
    super('variscout-pwa-normalized');
    this.version(1).stores({
      hubs: '&id, deletedAt',
      outcomes: '&id, hubId, deletedAt',
      evidenceSnapshots: '&id, hubId, capturedAt, deletedAt',
      rowProvenance: '&id, snapshotId',
      evidenceSources: '&id, hubId, deletedAt',
      evidenceSourceCursors: '&id, sourceId',
      investigations: '&id, hubId, deletedAt',
      findings: '&id, investigationId, deletedAt',
      questions: '&id, investigationId, deletedAt',
      causalLinks: '&id, investigationId, deletedAt',
      // NOTE: `questions` is declared at v1 to preserve the historical version
      // chain, then dropped at v10 below (IM-1, ADR-085). Rewriting v1 to omit
      // it would change the schema delta for any on-disk v1..v9 DB.
      hypotheses: '&id, investigationId, deletedAt',
      improvementProjects: '&id, hubId, deletedAt, status, updatedAt',
      canvasState: '&hubId',
      meta: '&key',
    });
    this.version(2).stores({
      actionItems:
        '&id, hubId, stepId, parentImprovementProjectId, parentImprovementIdeaId, status, deletedAt, createdAt',
    });
    this.version(3).stores({
      controlRecords: '&id, investigationId, hubId, nextReviewDue, updatedAt, deletedAt',
      controlReviews: '&id, recordId, investigationId, hubId, reviewedAt',
    });
    this.version(4).stores({
      controlHandoffs: '&id, investigationId, hubId, status, handoffDate, deletedAt',
    });
    // Version 5: PR-WV1-3 — MeasurementPlan dedicated table for Investigation Wall plans.
    this.version(5).stores({
      measurementPlans: '&id, hypothesisId, status, deletedAt',
    });

    // Version 6: PR-WV1-NAV — Sustainment → Control vocabulary rename.
    // Earlier version statements have been rewritten to declare 'controlRecords' /
    // 'controlReviews' (the new table names) in their stores definitions. For
    // any existing on-disk v5 database that physically holds tables named
    // 'sustainmentRecords' / 'sustainmentReviews', Dexie will detect the
    // schema mismatch and re-initialize on next open.
    // Per wedge V1 no-back-compat policy (feedback_wedge_v1_no_migration_no_backcompat),
    // NO upgrade callback is provided — existing v5 rows in the old tables
    // become unreachable. Accepted because wedge V1 has no real users yet.
    // This empty stores() call bumps the version to flush any cached schema.
    this.version(6).stores({});

    // Version 7: PR-CCJ-E1 — ImprovementProject extended with issueStatement +
    // 3 Canvas-state binding fields (stepTimings, formulaBindings,
    // timeDecompositionBindings; processSteps was added here but removed in v9).
    // Stored shape changes but Dexie indexes are
    // unchanged (new fields are in-row, not indexed). Per wedge V1
    // no-back-compat policy (feedback_wedge_v1_no_migration_no_backcompat),
    // NO upgrade callback — existing v6 rows that lack the new fields read
    // back with `undefined`, which the optional type allows. The bump flushes
    // cached schema state; no destructive re-init needed because the changes
    // are purely additive.
    this.version(7).stores({});

    // Version 8: IM-0a — Hub↔Project 1:1 collapse. The improvementProjects
    // Dexie table is unchanged (still keyed by id, hubId-indexed); the 1:1
    // invariant is now enforced at the logical layer (ProcessHub.improvementProject
    // is singular). No schema migration needed — the table shape is identical.
    // Bumping the version flushes any cached schema.
    this.version(8).stores({});

    // Version 9: IM-0b — process-step model reconciliation (ADR-087). The rich
    // ProcessMap (on ProcessContext.processMap, inside the hub blob) becomes the
    // single canonical step structure. IP.processSteps was removed from the
    // ImprovementProject type (it was vestigial — no write path ever persisted
    // it; the derived projection via deriveProcessSteps is the only read path).
    // The improvementProjects Dexie table shape is otherwise unchanged; the
    // field is gone from the type so it can no longer be accidentally written.
    // Per wedge V1 no-users / no-migration stance (ADR-082), NO upgrade
    // callback. The bump flushes cached schema; no destructive re-init.
    this.version(9).stores({});

    // Version 10: IM-1 — drop the `Question` entity (ADR-085). The `questions`
    // table was declared at v1 but never written (its QUESTION_* dispatch cases
    // were always no-ops); ProblemStatementScope replaces Question and persists
    // via the analyze blob, not Dexie. Declaring `questions: null` removes the
    // store. Per wedge V1 no-back-compat policy, no data migration — the table
    // was empty.
    this.version(10).stores({ questions: null });
    // Version 11: R6c — Former DocumentSnapshot browser-save table.
    // Version 12 drops it; retain v11 in the historical chain so existing v10
    // databases can upgrade through the same schema sequence.
    this.version(11).stores({ documentSnapshots: '&key, savedAt' });

    // Version 12: R6d — PWA durable persistence is export-only. Remove the
    // browser documentSnapshot store from the latest schema.
    this.version(12).stores({ documentSnapshots: null });

    // v13 (PO-4): ProcessHubAnalyze dissolved — the never-written
    // `investigations` projection table retires (tableName: null; the v1
    // store declaration stays per the Dexie monotonic-chain rule, mirroring
    // the v10 `questions: null` precedent).
    this.version(13).stores({ investigations: null });
  }
}

export const db = new PwaDatabase();
