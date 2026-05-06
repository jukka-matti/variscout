// apps/pwa/src/db/schema.ts
//
// F3 normalized PWA Dexie schema.
//
// Renames the IDB database from `variscout-pwa` (legacy hub-of-one blob) to
// `variscout-pwa-normalized` and declares 13 tables per spec §3 D3.
//
// Locked decisions:
//   1. DB rename, not version chain. The legacy `variscout-pwa` DB is
//      orphaned in browser storage; `PwaHubRepository` performs a best-effort
//      `Dexie.delete('variscout-pwa').catch(() => {})` on construction to
//      clean it up on dev machines.
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
// rowProvenance, investigations, findings, questions, causalLinks,
// suspectedCauses) start empty in F3 — the dispatch boundary will be wired by
// F3.5 (evidence) and F5 (investigation/finding/question/causalLink/
// suspectedCause + canvas action coverage).
//
// Spec: docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md §3 D3, §5

import Dexie, { type Table } from 'dexie';
import type { ProcessHub, OutcomeSpec, ProcessHubInvestigation } from '@variscout/core/processHub';
import type {
  EvidenceSnapshot,
  EvidenceSource,
  EvidenceSourceCursor,
  RowProvenanceTag,
} from '@variscout/core';
import type { Finding, Question, CausalLink, SuspectedCause } from '@variscout/core/findings';
import type { ProcessMap } from '@variscout/core/frame';

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
export type HubRow = Omit<ProcessHub, 'outcomes' | 'canonicalProcessMap'>;

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
export type InvestigationRow = ProcessHubInvestigation;
export type FindingRow = Finding;
export type QuestionRow = Question;
export type CausalLinkRow = CausalLink;
export type SuspectedCauseRow = SuspectedCause;

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
  investigations!: Table<InvestigationRow, string>;
  findings!: Table<FindingRow, string>;
  questions!: Table<QuestionRow, string>;
  causalLinks!: Table<CausalLinkRow, string>;
  suspectedCauses!: Table<SuspectedCauseRow, string>;
  canvasState!: Table<CanvasStateRow, string>;
  meta!: Table<MetaRow, string>;

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
      suspectedCauses: '&id, investigationId, deletedAt',
      canvasState: '&hubId',
      meta: '&key',
    });
  }
}

export const db = new PwaDatabase();
