// apps/azure/src/persistence/AzureHubRepository.ts
//
// Azure persistence model: per-entity Dexie tables.
// Unlike the PWA hub-blob, Azure stores hubs, evidence sources, evidence snapshots,
// and evidence source cursors in dedicated Dexie tables (see src/db/schema.ts).
// Entities that Azure does not have dedicated tables for today (investigations, findings,
// questions, causalLinks, suspectedCauses, canvas state) are stubbed — F3 normalizes
// them into Dexie tables.

import type {
  HubRepository,
  HubReadAPI,
  OutcomeReadAPI,
  EvidenceSnapshotReadAPI,
  EvidenceSourceReadAPI,
  InvestigationReadAPI,
  FindingReadAPI,
  QuestionReadAPI,
  CausalLinkReadAPI,
  SuspectedCauseReadAPI,
  CanvasStateReadAPI,
} from '@variscout/core/persistence';
import type { HubAction } from '@variscout/core/actions';
import { db } from '../db/schema';
import { saveProcessHubToIndexedDB } from '../services/localDb';
import { applyAction } from './applyAction';

export class AzureHubRepository implements HubRepository {
  // ---------------------------------------------------------------------------
  // Single write path
  // ---------------------------------------------------------------------------

  async dispatch(action: HubAction): Promise<void> {
    // HUB_PERSIST_SNAPSHOT is the bootstrap/save path — the action carries the
    // full hub blob, so no existing hub needs to be loaded first. This matches
    // the PWA pattern and supports the null-hub bootstrap case (first hub save).
    if (action.kind === 'HUB_PERSIST_SNAPSHOT') {
      await saveProcessHubToIndexedDB(action.hub);
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
    // hubs.get is unscoped — direct id lookup; hubs.list filters tombstones
    async get(id) {
      return db.processHubs.get(id);
    },
    async list() {
      const all = await db.processHubs.toArray();
      return all.filter(h => h.deletedAt === null);
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

  investigations: InvestigationReadAPI = {
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

  questions: QuestionReadAPI = {
    // Azure has no dedicated questions table today; F3 normalizes this.
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

  suspectedCauses: SuspectedCauseReadAPI = {
    // Azure has no dedicated suspectedCauses table today; F3 normalizes this.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };
}

// Module-scoped singleton. Composition root + dispatch boundary documented in apps/azure/CLAUDE.md.
// Vitest module-mocking handles test override.
export const azureHubRepository = new AzureHubRepository();
