// apps/pwa/src/persistence/PwaHubRepository.ts
//
// PWA persistence model: Hub-of-one blob only.
// The PWA stores exactly one row in IndexedDB — `{ id: 'hub-of-one', hub: ProcessHub }`.
// There are no per-entity tables. The grouped read APIs below serve data from
// that single hub blob; F3 will normalize into dedicated tables.

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
import { hubRepository } from '../db/hubRepository';
import { applyAction } from './applyAction';

export class PwaHubRepository implements HubRepository {
  // ---------------------------------------------------------------------------
  // Single write path
  // ---------------------------------------------------------------------------

  async dispatch(action: HubAction): Promise<void> {
    // HUB_PERSIST_SNAPSHOT is the bootstrap/save path — the action carries the
    // full hub blob, so no existing hub needs to be loaded first. This is the
    // only action that can execute before a hub has been persisted (e.g. the
    // first "Save to this browser" click). applyAction still handles this kind
    // for purity over HubAction, but dispatch short-circuits to avoid the
    // unnecessary load round-trip and to support the null-hub bootstrap case.
    if (action.kind === 'HUB_PERSIST_SNAPSHOT') {
      await hubRepository.saveHub(action.hub);
      return;
    }
    const hub = await hubRepository.loadHub();
    if (!hub) {
      throw new Error('No active hub to dispatch action against');
    }
    const next = applyAction(hub, action);
    await hubRepository.saveHub(next);
  }

  // ---------------------------------------------------------------------------
  // Read APIs — hubs
  // ---------------------------------------------------------------------------

  hubs: HubReadAPI = {
    async get(id) {
      const hub = await hubRepository.loadHub();
      return hub?.id === id ? hub : undefined;
    },
    async list() {
      const hub = await hubRepository.loadHub();
      return hub ? [hub] : [];
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — outcomes
  // Outcomes are hub-resident arrays; filter for live entries (deletedAt === null).
  // ---------------------------------------------------------------------------

  outcomes: OutcomeReadAPI = {
    async get(id) {
      const hub = await hubRepository.loadHub();
      return hub?.outcomes?.find(o => o.id === id && o.deletedAt === null);
    },
    async listByHub(hubId) {
      const hub = await hubRepository.loadHub();
      if (!hub || hub.id !== hubId) return [];
      return (hub.outcomes ?? []).filter(o => o.deletedAt === null);
    },
  };

  // ---------------------------------------------------------------------------
  // Read APIs — canvas state
  // canonicalProcessMap is the hub's canvas snapshot.
  // ---------------------------------------------------------------------------

  canvasState: CanvasStateReadAPI = {
    async getByHub(hubId) {
      const hub = await hubRepository.loadHub();
      if (!hub || hub.id !== hubId) return undefined;
      return hub.canonicalProcessMap;
    },
  };

  // ---------------------------------------------------------------------------
  // Stub read APIs — entities not yet stored in PWA hub blob.
  // PWA persists hub blob only; F3 normalizes these into dedicated tables.
  // ---------------------------------------------------------------------------

  evidenceSnapshots: EvidenceSnapshotReadAPI = {
    // PWA persists hub blob only; F3 normalizes evidenceSnapshots into a dedicated table.
    async get(_id) {
      return undefined;
    },
    async listByHub(_hubId) {
      return [];
    },
  };

  evidenceSources: EvidenceSourceReadAPI = {
    // PWA persists hub blob only; F3 normalizes evidenceSources into a dedicated table.
    async get(_id) {
      return undefined;
    },
    async listByHub(_hubId) {
      return [];
    },
    async getCursor(_hubId, _sourceId) {
      return undefined;
    },
  };

  investigations: InvestigationReadAPI = {
    // PWA persists hub blob only; investigations live in session-only Zustand store today.
    async get(_id) {
      return undefined;
    },
    async listByHub(_hubId) {
      return [];
    },
  };

  findings: FindingReadAPI = {
    // PWA persists hub blob only; findings live in session-only Zustand store today.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  questions: QuestionReadAPI = {
    // PWA persists hub blob only; questions live in session-only Zustand store today.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  causalLinks: CausalLinkReadAPI = {
    // PWA persists hub blob only; causalLinks live in session-only Zustand store today.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };

  suspectedCauses: SuspectedCauseReadAPI = {
    // PWA persists hub blob only; suspectedCauses live in session-only Zustand store today.
    async get(_id) {
      return undefined;
    },
    async listByInvestigation(_investigationId) {
      return [];
    },
  };
}

// Module-scoped singleton. Composition root + dispatch boundary documented in apps/pwa/CLAUDE.md.
// Vitest module-mocking handles test override.
export const pwaHubRepository = new PwaHubRepository();
