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
//     `findings` / `questions` / `causalLinks` / `suspectedCauses` query the
//     real (empty) tables. Until F3.5 (evidence) and F5 (investigation
//     entities) wire writes, these consistently return empty rows.
//
// Best-effort legacy DB cleanup:
//   On first construction, kicks off a fire-and-forget
//   `Dexie.delete('variscout-pwa').catch(() => {})` to remove the orphaned
//   pre-F3 IDB database on dev machines. Failures are swallowed — pre-
//   production, no recovery needed; the new `variscout-pwa-normalized` DB is
//   already live regardless.

import Dexie from 'dexie';
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
import type { ProcessHub } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import { db, type HubRow } from '../db/schema';
import { applyAction } from './applyAction';

const LEGACY_DB_NAME = 'variscout-pwa';

export class PwaHubRepository implements HubRepository {
  constructor() {
    // Best-effort cleanup of the pre-F3 IDB database on dev machines. Fire-
    // and-forget; we do not block construction on its outcome. Failures
    // (database doesn't exist, browser denies access, etc.) are swallowed.
    void Dexie.delete(LEGACY_DB_NAME).catch(() => {
      /* legacy DB cleanup is best-effort; ignore errors */
    });
  }

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
    const [outcomes, canvasRow] = await Promise.all([
      db.outcomes.where('hubId').equals(hubMeta.id).toArray(),
      db.canvasState.get(hubMeta.id),
    ]);
    const liveOutcomes = outcomes.filter(o => o.deletedAt === null);
    const canonicalProcessMap = canvasRow ? stripHubId(canvasRow) : undefined;
    return {
      ...hubMeta,
      ...(liveOutcomes.length > 0 ? { outcomes: liveOutcomes } : {}),
      ...(canonicalProcessMap ? { canonicalProcessMap } : {}),
    } as ProcessHub;
  }

  // ---------------------------------------------------------------------------
  // Read APIs — hubs
  // ---------------------------------------------------------------------------

  hubs: HubReadAPI = {
    get: async id => {
      const hubMeta = await db.hubs.get(id);
      if (!hubMeta) return undefined;
      if (hubMeta.deletedAt !== null) return undefined;
      return this.joinHub(hubMeta);
    },
    list: async () => {
      const allHubs = await db.hubs.toArray();
      const liveHubs = allHubs.filter(h => h.deletedAt === null);
      return Promise.all(liveHubs.map(h => this.joinHub(h)));
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
    getCursor: async (_hubId, sourceId) => {
      // EvidenceSourceCursor is keyed by sourceId; the cursor row's hubId
      // FK is preserved on the entity itself. Filter post-fetch when the
      // hubId argument is meaningful (currently the F2 contract simply
      // narrows by sourceId; F3.5 will revisit if multi-hub cursor lookup
      // becomes a real path).
      const row = await db.evidenceSourceCursors.where('sourceId').equals(sourceId).first();
      return row;
    },
  };

  investigations: InvestigationReadAPI = {
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

  suspectedCauses: SuspectedCauseReadAPI = {
    get: async id => {
      const row = await db.suspectedCauses.get(id);
      if (!row || row.deletedAt !== null) return undefined;
      return row;
    },
    listByInvestigation: async investigationId => {
      const rows = await db.suspectedCauses
        .where('investigationId')
        .equals(investigationId)
        .toArray();
      return rows.filter(r => r.deletedAt === null);
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

// Module-scoped singleton. Composition root + dispatch boundary documented in apps/pwa/CLAUDE.md.
// Vitest module-mocking handles test override.
export const pwaHubRepository = new PwaHubRepository();
