// apps/pwa/src/persistence/PwaHubRepository.ts
//
// F3 normalized PWA hub repository.
//
// Replaces the F2-era hub-of-one blob façade with the canonical implementation
// of `@variscout/core/persistence#HubRepository` against the F3 normalized
// 13-table schema (see `../db/schema.ts`).
//
// Write path:
//   - `dispatch(action)` routes every HubAction to `applyAction(db, action)`,
//     which performs transactional Dexie writes against the new schema.
//   - The `HUB_PERSIST_SNAPSHOT` short-circuit is gone: bootstrap is just
//     another transaction now, since the action carries the full ProcessHub.
//
// Read path:
//   - `hubs.get` / `hubs.list` query `db.hubs`, then **join** outcomes
//     (live entries only — `deletedAt === null`) and `canvasState` back into
//     the in-memory `ProcessHub` shape consumers (stores, hooks) expect today.
//   - `outcomes.get` / `outcomes.listByHub` filter by `deletedAt === null`.
//   - `canvasState.getByHub` returns the row, stripped of the `hubId` FK.
//   - `evidenceSnapshots` / `evidenceSources` / `investigations` /
//     `findings` / `questions` / `causalLinks` / `hypotheses` query the
//     real (empty) tables. Until F3.5 (evidence) and F5 (investigation
//     entities) wire writes, these consistently return empty rows.

import type {
  HubRepository,
  HubReadAPI,
  OutcomeReadAPI,
  EvidenceSnapshotReadAPI,
  EvidenceSourceReadAPI,
  AnalyzeReadAPI,
  FindingReadAPI,
  QuestionReadAPI,
  CausalLinkReadAPI,
  HypothesisReadAPI,
  CanvasStateReadAPI,
  ActionItemReadAPI,
  ControlRecordReadAPI,
  ControlReviewReadAPI,
  ControlHandoffReadAPI,
  MeasurementPlanReadAPI,
} from '@variscout/core/persistence';
import type { HubAction } from '@variscout/core/actions';
import type { ProcessHub } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import type { ActionItem } from '@variscout/core/findings';
import { db, type HubRow } from '../db/schema';
import { applyAction } from './applyAction';

export class PwaHubRepository implements HubRepository {
  // ---------------------------------------------------------------------------
  // Single write path
  // ---------------------------------------------------------------------------

  async dispatch(action: HubAction): Promise<void> {
    await applyAction(db, action);
  }

  // ---------------------------------------------------------------------------
  // Join helper — rebuilds the in-memory ProcessHub shape from row data.
  //
  // `hub.outcomes` collects all live outcomes for the hub (deletedAt === null);
  // `hub.canonicalProcessMap` rejoins the canvasState row (stripped of the
  // `hubId` FK). Consumers see the same denormalized view they saw under the
  // F2 hub-of-one model.
  // ---------------------------------------------------------------------------

  private async joinHub(hubMeta: HubRow): Promise<ProcessHub> {
    const [outcomes, canvasRow, improvementProjects] = await Promise.all([
      db.outcomes.where('hubId').equals(hubMeta.id).toArray(),
      db.canvasState.get(hubMeta.id),
      db.improvementProjects.where('hubId').equals(hubMeta.id).toArray(),
    ]);
    const [controlRecords, controlReviews, controlHandoffs] = await Promise.all([
      this.controlRecords.listByHub(hubMeta.id),
      this.controlReviews.listByHub(hubMeta.id),
      this.controlHandoffs.listByHub(hubMeta.id),
    ]);
    const liveOutcomes = outcomes.filter(o => o.deletedAt === null);
    const liveProject = improvementProjects.find(p => p.deletedAt === null);
    const canonicalProcessMap = canvasRow ? stripHubId(canvasRow) : undefined;
    return {
      ...hubMeta,
      ...(liveOutcomes.length > 0 ? { outcomes: liveOutcomes } : {}),
      ...(canonicalProcessMap ? { canonicalProcessMap } : {}),
      ...(liveProject ? { improvementProject: liveProject } : {}),
      ...(controlRecords.length > 0 ? { controlRecords } : {}),
      ...(controlReviews.length > 0 ? { controlReviews } : {}),
      ...(controlHandoffs.length > 0 ? { controlHandoffs } : {}),
    } as ProcessHub;
  }

  // ---------------------------------------------------------------------------
  // Read APIs — hubs
  // ---------------------------------------------------------------------------

  hubs: HubReadAPI = {
    // Wrap multi-table joins in a read transaction so a concurrent write
    // between db.hubs.get and the outcomes/canvasState reads in joinHub can't
    // splice partial state across versions. Dexie read transactions don't
    // reenter; joinHub stays a private helper that only touches the three
    // tables already declared in the transaction scope.
    get: async id => {
      return db.transaction(
        'r',
        [
          db.hubs,
          db.outcomes,
          db.canvasState,
          db.improvementProjects,
          db.controlRecords,
          db.controlReviews,
          db.controlHandoffs,
        ],
        async () => {
          const hubMeta = await db.hubs.get(id);
          if (!hubMeta) return undefined;
          if (hubMeta.deletedAt !== null) return undefined;
          return this.joinHub(hubMeta);
        }
      );
    },
    list: async () => {
      return db.transaction(
        'r',
        [
          db.hubs,
          db.outcomes,
          db.canvasState,
          db.improvementProjects,
          db.controlRecords,
          db.controlReviews,
          db.controlHandoffs,
        ],
        async () => {
          const allHubs = await db.hubs.toArray();
          const liveHubs = allHubs.filter(h => h.deletedAt === null);
          return Promise.all(liveHubs.map(h => this.joinHub(h)));
        }
      );
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — outcomes
  // ---------------------------------------------------------------------------

  outcomes: OutcomeReadAPI = {
    get: async id => {
      const row = await db.outcomes.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.outcomes.where('hubId').equals(hubId).toArray();
      return rows.filter(o => o.deletedAt === null);
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — canvas state
  // ---------------------------------------------------------------------------

  canvasState: CanvasStateReadAPI = {
    getByHub: async hubId => {
      const row = await db.canvasState.get(hubId);
      if (!row) return undefined;
      return stripHubId(row);
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — entities the F3 schema declares but does not yet write.
  // F3.5 (evidence) and F5 (investigation entities) wire dispatch handlers;
  // until then these reads return empty rows from real (empty) tables.
  // ---------------------------------------------------------------------------

  evidenceSnapshots: EvidenceSnapshotReadAPI = {
    get: async id => {
      const row = await db.evidenceSnapshots.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.evidenceSnapshots.where('hubId').equals(hubId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  evidenceSources: EvidenceSourceReadAPI = {
    get: async id => {
      const row = await db.evidenceSources.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.evidenceSources.where('hubId').equals(hubId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
    getCursor: async (hubId, sourceId) => {
      // Dexie schema indexes evidenceSourceCursors by `&id, sourceId`, but the
      // semantic key per F1 R4 / Azure parity is `[hubId, sourceId]` — the
      // cursor row's hubId FK is carried on the entity. Filter post-fetch by
      // hubId so F3.5 writes can't return a foreign hub's cursor when two
      // hubs happen to share a sourceId.
      const row = await db.evidenceSourceCursors
        .where('sourceId')
        .equals(sourceId)
        .filter(c => c.hubId === hubId)
        .first();
      return row;
    },
  };

  investigations: AnalyzeReadAPI = {
    get: async id => {
      const row = await db.investigations.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.investigations.where('hubId').equals(hubId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  findings: FindingReadAPI = {
    get: async id => {
      const row = await db.findings.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByInvestigation: async investigationId => {
      const rows = await db.findings.where('investigationId').equals(investigationId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  questions: QuestionReadAPI = {
    get: async id => {
      const row = await db.questions.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByInvestigation: async investigationId => {
      const rows = await db.questions.where('investigationId').equals(investigationId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  causalLinks: CausalLinkReadAPI = {
    get: async id => {
      const row = await db.causalLinks.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByInvestigation: async investigationId => {
      const rows = await db.causalLinks.where('investigationId').equals(investigationId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  hypotheses: HypothesisReadAPI = {
    get: async id => {
      const row = await db.hypotheses.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByInvestigation: async investigationId => {
      const rows = await db.hypotheses.where('investigationId').equals(investigationId).toArray();
      return rows.filter(r => r.deletedAt === null);
    },
  };

  actionItems: ActionItemReadAPI = {
    get: async id => {
      const row = await db.actionItems.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return stripActionItemHubId(row);
    },
    listByHub: async hubId => {
      const rows = await db.actionItems.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null).map(stripActionItemHubId);
    },
    listByStep: async (hubId, stepId) => {
      const rows = await db.actionItems.where('hubId').equals(hubId).toArray();
      return rows
        .filter(row => row.deletedAt === null && row.stepId === stepId)
        .map(stripActionItemHubId);
    },
  };

  controlRecords: ControlRecordReadAPI = {
    get: async id => {
      const row = await db.controlRecords.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.controlRecords.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };

  controlReviews: ControlReviewReadAPI = {
    get: async id => {
      const row = await db.controlReviews.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.controlReviews.where('hubId').equals(hubId).toArray();
      return sortReviewsDescending(rows.filter(row => row.deletedAt === null));
    },
    listByRecord: async (hubId, recordId) => {
      const rows = await db.controlReviews.where('recordId').equals(recordId).toArray();
      return sortReviewsDescending(
        rows.filter(row => row.hubId === hubId && row.deletedAt === null)
      );
    },
  };

  controlHandoffs: ControlHandoffReadAPI = {
    get: async id => {
      const row = await db.controlHandoffs.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHub: async hubId => {
      const rows = await db.controlHandoffs.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };

  measurementPlans: MeasurementPlanReadAPI = {
    get: async id => {
      const row = await db.measurementPlans.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByHypothesis: async hypothesisId => {
      const rows = await db.measurementPlans.where('hypothesisId').equals(hypothesisId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip the `hubId` FK from a canvasState row, returning the underlying ProcessMap. */
function stripHubId(row: { hubId: string } & ProcessMap): ProcessMap {
  // Object rest preserves the ProcessMap shape (version, nodes, tributaries,
  // ctsColumn, etc.) without leaking the FK column to consumers.
  const { hubId: _hubId, ...processMap } = row;
  void _hubId;
  return processMap;
}

function stripActionItemHubId(row: { hubId: string } & ActionItem): ActionItem {
  const { hubId: _hubId, ...actionItem } = row;
  void _hubId;
  return actionItem;
}

function sortReviewsDescending<T extends { reviewedAt: number }>(rows: T[]): T[] {
  return rows.sort((a, b) => b.reviewedAt - a.reviewedAt);
}

// Module-scoped singleton. Composition root + dispatch boundary documented in apps/pwa/CLAUDE.md.
// Vitest module-mocking handles test override.
export const pwaHubRepository = new PwaHubRepository();
