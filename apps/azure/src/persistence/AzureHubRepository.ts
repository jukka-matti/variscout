// apps/azure/src/persistence/AzureHubRepository.ts
//
// Azure persistence model: per-entity Dexie tables.
// Unlike the PWA hub-blob, Azure stores hubs, evidence sources, evidence snapshots,
// and evidence source cursors in dedicated Dexie tables (see src/db/schema.ts).
// Entities that Azure does not have dedicated tables for today (investigations, findings,
// scopes, causalLinks, hypotheses, canvas state) are stubbed — F3 normalizes
// them into Dexie tables.

import type {
  HubRepository,
  HubReadAPI,
  OutcomeReadAPI,
  EvidenceSnapshotReadAPI,
  EvidenceSourceReadAPI,
  AnalyzeReadAPI,
  FindingReadAPI,
  ScopeReadAPI,
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
import type { ActionItem } from '@variscout/core/findings';
import type { ProcessHub } from '@variscout/core/processHub';
import { db } from '../db/schema';
import { saveProcessHubToIndexedDB } from '../services/localDb';
import { applyAction } from './applyAction';

export class AzureHubRepository implements HubRepository {
  // ---------------------------------------------------------------------------
  // Single write path
  // ---------------------------------------------------------------------------

  async dispatch(action: HubAction): Promise<void> {
    // HUB_PERSIST_SNAPSHOT is the bootstrap/save path — the action carries the
    // in-memory ProcessHub view, so no existing hub needs to be loaded first.
    // This matches the PWA pattern and supports the null-hub bootstrap case
    // (first hub save).
    if (action.kind === 'HUB_PERSIST_SNAPSHOT') {
      // improvementProjects live in their own table; decompose them out of the
      // hub blob before saving. Mirrors the PWA HUB_PERSIST_SNAPSHOT decomposition.
      const { improvementProject, controlRecords, controlReviews, controlHandoffs, ...hubRow } =
        action.hub;
      await db.transaction(
        'rw',
        [
          db.processHubs,
          db.improvementProjects,
          db.controlRecords,
          db.controlReviews,
          db.controlHandoffs,
        ],
        async () => {
          await saveProcessHubToIndexedDB(hubRow);
          // Drop stale rows for this hub (at most one under 1:1), then put the incoming project.
          const incomingProjectIds = new Set(improvementProject ? [improvementProject.id] : []);
          await db.improvementProjects
            .where('hubId')
            .equals(action.hub.id)
            .filter(p => !incomingProjectIds.has(p.id))
            .delete();
          if (improvementProject) {
            await db.improvementProjects.put({ ...improvementProject, hubId: action.hub.id });
          }
          const incomingControlRecords = controlRecords ?? [];
          const incomingRecordIds = new Set(incomingControlRecords.map(record => record.id));
          await db.controlRecords
            .where('hubId')
            .equals(action.hub.id)
            .filter(record => !incomingRecordIds.has(record.id))
            .delete();
          if (incomingControlRecords.length > 0) {
            await db.controlRecords.bulkPut(incomingControlRecords);
          }

          const incomingControlReviews = controlReviews ?? [];
          const incomingReviewIds = new Set(incomingControlReviews.map(review => review.id));
          await db.controlReviews
            .where('hubId')
            .equals(action.hub.id)
            .filter(review => !incomingReviewIds.has(review.id))
            .delete();
          if (incomingControlReviews.length > 0) {
            await db.controlReviews.bulkPut(incomingControlReviews);
          }

          const incomingControlHandoffs = controlHandoffs ?? [];
          const incomingHandoffIds = new Set(incomingControlHandoffs.map(handoff => handoff.id));
          await db.controlHandoffs
            .where('hubId')
            .equals(action.hub.id)
            .filter(handoff => !incomingHandoffIds.has(handoff.id))
            .delete();
          if (incomingControlHandoffs.length > 0) {
            await db.controlHandoffs.bulkPut(incomingControlHandoffs);
          }
        }
      );
      return;
    }

    // All other action kinds are handled by applyAction (P5.3).
    await applyAction(action);
  }

  // ---------------------------------------------------------------------------
  // Read APIs — hubs
  // Azure has a dedicated `processHubs` Dexie table; read directly from it.
  // ---------------------------------------------------------------------------

  hubs: HubReadAPI = {
    // hubs.get is unscoped — direct id lookup; hydrates improvementProjects from dedicated table.
    async get(id) {
      return db.transaction(
        'r',
        [
          db.processHubs,
          db.improvementProjects,
          db.controlRecords,
          db.controlReviews,
          db.controlHandoffs,
        ],
        async () => {
          const hub = await db.processHubs.get(id);
          if (!hub) return undefined;
          if (hub.deletedAt !== null) return undefined;
          return hydrateHub(hub);
        }
      );
    },
    async list() {
      return db.transaction(
        'r',
        [
          db.processHubs,
          db.improvementProjects,
          db.controlRecords,
          db.controlReviews,
          db.controlHandoffs,
        ],
        async () => {
          const all = await db.processHubs.toArray();
          const live = all.filter(h => h.deletedAt === null);
          return Promise.all(live.map(hydrateHub));
        }
      );
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — outcomes
  // Outcomes are hub-resident arrays on the ProcessHub blob; filter for live
  // entries (deletedAt === null). Azure stores the full hub in processHubs,
  // so we read the hub and extract outcomes from it.
  // F3 may normalize outcomes into a dedicated table.
  // ---------------------------------------------------------------------------

  outcomes: OutcomeReadAPI = {
    // O(n hubs) linear scan — acceptable for P5.1; F3 normalization will remove this.
    async get(id) {
      const hubs = await db.processHubs.toArray();
      for (const hub of hubs) {
        const found = hub.outcomes?.find(o => o.id === id && o.deletedAt === null);
        if (found) return found;
      }
      return undefined;
    },
    async listByHub(hubId) {
      const hub = await db.processHubs.get(hubId);
      if (!hub) return [];
      return (hub.outcomes ?? []).filter(o => o.deletedAt === null);
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — canvas state
  // canonicalProcessMap is the hub's canvas snapshot stored in the hub blob.
  // ---------------------------------------------------------------------------

  canvasState: CanvasStateReadAPI = {
    async getByHub(hubId) {
      const hub = await db.processHubs.get(hubId);
      if (!hub) return undefined;
      return hub.canonicalProcessMap;
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — evidence snapshots
  // Azure has a dedicated `evidenceSnapshots` Dexie table.
  // ---------------------------------------------------------------------------

  evidenceSnapshots: EvidenceSnapshotReadAPI = {
    async get(id) {
      return db.evidenceSnapshots.get(id);
    },
    async listByHub(hubId) {
      return db.evidenceSnapshots.where('hubId').equals(hubId).toArray();
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — evidence sources
  // Azure has a dedicated `evidenceSources` Dexie table.
  // ---------------------------------------------------------------------------

  evidenceSources: EvidenceSourceReadAPI = {
    async get(id) {
      return db.evidenceSources.get(id);
    },
    async listByHub(hubId) {
      return db.evidenceSources.where('hubId').equals(hubId).toArray();
    },
    async getCursor(hubId, sourceId) {
      return db.evidenceSourceCursors.get([hubId, sourceId]);
    },
  };

  // ---------------------------------------------------------------------------
  // Stub read APIs — entities not yet in dedicated Azure Dexie tables.
  // F3 normalizes these into dedicated tables (investigations, findings, etc.).
  // ---------------------------------------------------------------------------

  investigations: AnalyzeReadAPI = {
    // Azure has no dedicated investigations table today; F3 normalizes this.
    async get(_id) {
      return undefined;
    },
    async listByHub(_hubId) {
      return [];
    },
  };

  findings: FindingReadAPI = {
    // Azure has no dedicated findings table today; F3 normalizes this.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  scopes: ScopeReadAPI = {
    // Azure has no dedicated scopes table today; scopes persist via the
    // analyze blob (ADR-085) — read API stubbed, mirroring findings/hypotheses.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  causalLinks: CausalLinkReadAPI = {
    // Azure has no dedicated causalLinks table today; F3 normalizes this.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  hypotheses: HypothesisReadAPI = {
    // Azure has no dedicated hypotheses table today; F3 normalizes this.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  actionItems: ActionItemReadAPI = {
    async get(id) {
      const row = await db.actionItems.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return stripActionItemHubId(row);
    },
    async listByHub(hubId) {
      const rows = await db.actionItems.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null).map(stripActionItemHubId);
    },
    async listByStep(hubId, stepId) {
      const rows = await db.actionItems.where('hubId').equals(hubId).toArray();
      return rows
        .filter(row => row.deletedAt === null && row.stepId === stepId)
        .map(stripActionItemHubId);
    },
  };

  controlRecords: ControlRecordReadAPI = {
    async get(id) {
      const row = await db.controlRecords.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    async listByHub(hubId) {
      const rows = await db.controlRecords.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };

  controlReviews: ControlReviewReadAPI = {
    async get(id) {
      const row = await db.controlReviews.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    async listByHub(hubId) {
      const rows = await db.controlReviews.where('hubId').equals(hubId).toArray();
      return sortReviewsDescending(rows.filter(row => row.deletedAt === null));
    },
    async listByRecord(hubId, recordId) {
      const rows = await db.controlReviews.where('recordId').equals(recordId).toArray();
      return sortReviewsDescending(
        rows.filter(row => row.hubId === hubId && row.deletedAt === null)
      );
    },
  };

  controlHandoffs: ControlHandoffReadAPI = {
    async get(id) {
      const row = await db.controlHandoffs.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    async listByHub(hubId) {
      const rows = await db.controlHandoffs.where('hubId').equals(hubId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };

  measurementPlans: MeasurementPlanReadAPI = {
    async get(id) {
      const row = await db.measurementPlans.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    async listByHypothesis(hypothesisId) {
      const rows = await db.measurementPlans.where('hypothesisId').equals(hypothesisId).toArray();
      return rows.filter(row => row.deletedAt === null);
    },
  };
}

async function hydrateHub(hub: ProcessHub): Promise<ProcessHub> {
  const [ips, controlRecords, controlReviews, controlHandoffs] = await Promise.all([
    db.improvementProjects.where('hubId').equals(hub.id).toArray(),
    db.controlRecords.where('hubId').equals(hub.id).toArray(),
    db.controlReviews.where('hubId').equals(hub.id).toArray(),
    db.controlHandoffs.where('hubId').equals(hub.id).toArray(),
  ]);
  const liveIp = ips.find(p => p.deletedAt === null);
  const liveControlRecords = controlRecords.filter(record => record.deletedAt === null);
  const liveControlReviews = sortReviewsDescending(
    controlReviews.filter(review => review.deletedAt === null)
  );
  const liveControlHandoffs = controlHandoffs.filter(handoff => handoff.deletedAt === null);
  return {
    ...hub,
    ...(liveIp ? { improvementProject: liveIp } : {}),
    ...(liveControlRecords.length > 0 ? { controlRecords: liveControlRecords } : {}),
    ...(liveControlReviews.length > 0 ? { controlReviews: liveControlReviews } : {}),
    ...(liveControlHandoffs.length > 0 ? { controlHandoffs: liveControlHandoffs } : {}),
  };
}

function stripActionItemHubId(row: { hubId: string } & ActionItem): ActionItem {
  const { hubId: _hubId, ...actionItem } = row;
  void _hubId;
  return actionItem;
}

function sortReviewsDescending<T extends { reviewedAt: number }>(rows: T[]): T[] {
  return rows.sort((a, b) => b.reviewedAt - a.reviewedAt);
}

// Module-scoped singleton. Composition root + dispatch boundary documented in apps/azure/CLAUDE.md.
// Vitest module-mocking handles test override.
export const azureHubRepository = new AzureHubRepository();
