// apps/pwa/src/db/schema.ts
//
// Clean pre-launch PWA Dexie schema.
//
// Uses the `variscout-pwa-v1` database and declares only current IndexedDB
// tables. Retired compatibility stores are intentionally omitted: questions,
// investigations, findings, causalLinks, hypotheses, and documentSnapshots.
//
// Locked decisions:
//   1. DB rename, not version chain. The legacy `variscout-pwa` and
//      `variscout-pwa-normalized` DBs are orphaned in browser storage. Per
//      wedge V1 no-back-compat policy (no users), any stale legacy DB on dev
//      machines is harmless.
//   2. Clean `version(1)` schema. No `.upgrade()` callback; future schema work
//      uses normal `version()`/`.upgrade()` chains from this point.
//   3. canvasState lives in its own table (1:1 with hub). On
//      `HUB_PERSIST_SNAPSHOT` the persistence layer decomposes
//      `hub.canonicalProcessMap` out of the hub blob into a `canvasState` row;
//      reads in `PwaHubRepository.hubs.get/list` rejoin it.
//   4. `outcomes` are decomposed out of the hub blob and persisted with their
//      `hubId` foreign key (already on `OutcomeSpec` via core).
//
// All other tables (evidenceSnapshots, evidenceSources, evidenceSourceCursors,
// rowProvenance) start empty in F3 — the dispatch boundary will be wired by
// F3.5 (evidence). ProblemStatementScope persists via the analyze blob, not a
// dedicated IndexedDB table. PWA durability is export-only (.vrs), so there is
// no browser documentSnapshots table.
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
import type { ActionItem } from '@variscout/core/findings';
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
  improvementProjects!: Table<ImprovementProjectRow, string>;
  actionItems!: Table<ActionItemRow, string>;
  controlRecords!: Table<ControlRecordRow, string>;
  controlReviews!: Table<ControlReviewRow, string>;
  controlHandoffs!: Table<ControlHandoffRow, string>;
  canvasState!: Table<CanvasStateRow, string>;
  meta!: Table<MetaRow, string>;
  measurementPlans!: Table<MeasurementPlanRow, string>;

  constructor() {
    super('variscout-pwa-v1');
    this.version(1).stores({
      hubs: '&id, deletedAt',
      outcomes: '&id, hubId, deletedAt',
      evidenceSnapshots: '&id, hubId, capturedAt, deletedAt',
      rowProvenance: '&id, snapshotId',
      evidenceSources: '&id, hubId, deletedAt',
      evidenceSourceCursors: '&id, sourceId',
      improvementProjects: '&id, hubId, deletedAt, status, updatedAt',
      actionItems:
        '&id, hubId, stepId, parentImprovementProjectId, parentImprovementIdeaId, status, deletedAt, createdAt',
      controlRecords: '&id, hubId, nextCheckSuggestedAt, updatedAt, deletedAt',
      controlReviews: '&id, recordId, hubId, reviewedAt',
      controlHandoffs: '&id, hubId, handoffDate, deletedAt',
      canvasState: '&hubId',
      meta: '&key',
      measurementPlans: '&id, hypothesisId, status, deletedAt',
    });
  }
}

export const db = new PwaDatabase();
