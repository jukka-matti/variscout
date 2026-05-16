// apps/azure/src/persistence/applyAction.ts
//
// Per-action handler dispatcher for AzureHubRepository (P5.3).
//
// AZURE PERSISTENCE MODEL:
//   Azure stores processHubs, evidenceSources, evidenceSnapshots, and
//   evidenceSourceCursors in dedicated Dexie tables. See src/db/schema.ts.
//
// ACTION CATEGORIES:
//
//   Hub-blob mutations (read-modify-write via saveProcessHubToIndexedDB):
//     HUB_UPDATE_GOAL, HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS,
//     OUTCOME_ADD, OUTCOME_UPDATE, OUTCOME_ARCHIVE
//
//   Direct Dexie table writes:
//     EVIDENCE_ADD_SNAPSHOT, EVIDENCE_ARCHIVE_SNAPSHOT,
//     EVIDENCE_SOURCE_ADD, EVIDENCE_SOURCE_UPDATE_CURSOR, EVIDENCE_SOURCE_REMOVE
//
//   Session-only / no Azure Dexie table today (F3 normalizes):
//     INVESTIGATION_*, FINDING_*, QUESTION_*, CAUSAL_LINK_*, HYPOTHESIS_*
//
//   Canvas mutations (flow through canvasStore → HUB_PERSIST_SNAPSHOT):
//     PLACE_CHIP_ON_STEP, UNASSIGN_CHIP, REORDER_CHIP_IN_STEP, ADD_STEP,
//     REMOVE_STEP, RENAME_STEP, CONNECT_STEPS, DISCONNECT_STEPS,
//     GROUP_INTO_SUB_STEP, UNGROUP_SUB_STEP
//
// ATOMICITY:
//   EVIDENCE_SOURCE_REMOVE wraps the cascade + parent update in a single
//   db.transaction('rw', [...]) so both succeed or neither does.
//   Hub-blob read-modify-write (OUTCOME_*, HUB_UPDATE_*) is atomic per Dexie
//   put — each dispatch call is one atomic unit.
//   EVIDENCE_ADD_SNAPSHOT is non-atomic (update + put on evidenceSnapshots
//   only when replacedSnapshotId is set; see case comment for accepted
//   failure mode pre-F3.6).
//
// NOTE: HUB_PERSIST_SNAPSHOT is handled by AzureHubRepository.dispatch before
//   reaching this function — do not handle it here.

import type { EvidenceSnapshot } from '@variscout/core';
import { applySustainmentTick } from '@variscout/core';
import type { HubAction } from '@variscout/core/actions';
import { db } from '../db/schema';
import { saveProcessHubToIndexedDB } from '../services/localDb';
import { cascadeArchiveDescendants } from './cascadeArchive';

// ---------------------------------------------------------------------------
// Exhaustiveness helper
// ---------------------------------------------------------------------------

function assertNever(x: never): never {
  throw new Error(
    `applyAction: unhandled action kind: ${JSON.stringify((x as { kind?: string }).kind)}`
  );
}

// ---------------------------------------------------------------------------
// applyAction
// ---------------------------------------------------------------------------

/**
 * Dispatch a HubAction to the appropriate Azure Dexie table(s).
 *
 * Called by AzureHubRepository.dispatch after the HUB_PERSIST_SNAPSHOT
 * short-circuit — do not call with HUB_PERSIST_SNAPSHOT.
 *
 * Exhaustiveness is enforced at the TypeScript level via assertNever().
 * Adding a new HubAction kind without handling it here is a compile error.
 */
export async function applyAction(action: HubAction): Promise<void> {
  switch (action.kind) {
    // -------------------------------------------------------------------------
    // HUB_PERSIST_SNAPSHOT — handled upstream in dispatch(); must not reach here.
    // -------------------------------------------------------------------------
    case 'HUB_PERSIST_SNAPSHOT':
      // Guard: dispatch() short-circuits before calling applyAction.
      // This case only exists to keep TypeScript exhaustiveness satisfied.
      throw new Error(
        'applyAction: HUB_PERSIST_SNAPSHOT must be handled by AzureHubRepository.dispatch before reaching applyAction.'
      );

    // -------------------------------------------------------------------------
    // Hub meta — read-modify-write via saveProcessHubToIndexedDB
    // Single-actor assumption: concurrent dispatches on the same hub can race
    // (last-write-wins). Acceptable for P5.3; F3 normalization removes embedded arrays.
    // -------------------------------------------------------------------------

    case 'HUB_UPDATE_GOAL': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) throw new Error(`HUB_UPDATE_GOAL: hub ${action.hubId} not found`);
      await saveProcessHubToIndexedDB({ ...hub, processGoal: action.processGoal });
      return;
    }

    case 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub)
        throw new Error(`HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS: hub ${action.hubId} not found`);
      await saveProcessHubToIndexedDB({ ...hub, primaryScopeDimensions: action.dimensions });
      return;
    }

    // -------------------------------------------------------------------------
    // Outcomes — embedded array in the processHubs blob (read-modify-write)
    // -------------------------------------------------------------------------

    case 'OUTCOME_ADD': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) throw new Error(`OUTCOME_ADD: hub ${action.hubId} not found`);
      const updated = { ...hub, outcomes: [...(hub.outcomes ?? []), action.outcome] };
      await saveProcessHubToIndexedDB(updated);
      return;
    }

    case 'OUTCOME_UPDATE': {
      // OUTCOME_UPDATE has no hubId — scan all hubs for the outcome.
      // O(n hubs) linear scan acceptable for P5.3; F3 normalization will remove this.
      const hubs = await db.processHubs.toArray();
      for (const hub of hubs) {
        const idx = hub.outcomes?.findIndex(o => o.id === action.outcomeId) ?? -1;
        if (idx === -1) continue;
        const outcomes = [...(hub.outcomes ?? [])];
        outcomes[idx] = { ...outcomes[idx], ...action.patch };
        await saveProcessHubToIndexedDB({ ...hub, outcomes });
        return;
      }
      // No hub found with that outcome — no-op per PWA Immer pattern.
      return;
    }

    case 'OUTCOME_ARCHIVE': {
      // OUTCOME_ARCHIVE has no hubId — scan all hubs for the outcome.
      const hubs = await db.processHubs.toArray();
      for (const hub of hubs) {
        const idx = hub.outcomes?.findIndex(o => o.id === action.outcomeId) ?? -1;
        if (idx === -1) continue;
        const outcomes = [...(hub.outcomes ?? [])];
        // Idempotent: skip if already archived.
        if (outcomes[idx].deletedAt !== null) return;
        outcomes[idx] = { ...outcomes[idx], deletedAt: Date.now() };
        await saveProcessHubToIndexedDB({ ...hub, outcomes });
        return;
      }
      // No hub found with that outcome — no-op.
      return;
    }

    // -------------------------------------------------------------------------
    // Evidence snapshots — dedicated evidenceSnapshots Dexie table
    // -------------------------------------------------------------------------

    case 'EVIDENCE_ADD_SNAPSHOT': {
      // F3.6-β envelope write: provenance rides on the snapshot facet —
      // no separate rowProvenance Dexie table (Azure model per ADR-077 amendment
      // 2026-05-07). One record in evidenceSnapshots carries both snapshot data
      // and its provenance tags, matching the cloud-sync envelope shape.
      //
      // No db.transaction wrapper: this case writes only to evidenceSnapshots.
      // The optional update + put pair is not strictly atomic (mid-call browser
      // close could leave the replaced snapshot soft-deleted without the new
      // one inserted), but this is acceptable for Azure's single-table model
      // pre-F3.6. Future Azure normalization will revisit.
      await db.transaction(
        'rw',
        [db.evidenceSnapshots, db.sustainmentRecords, db.sustainmentReviews],
        async () => {
          if (action.replacedSnapshotId) {
            await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: Date.now() });
          }
          const envelope: EvidenceSnapshot = {
            ...action.snapshot,
            provenance: action.provenance,
          };
          await db.evidenceSnapshots.put(envelope);
          await evaluateSustainmentRecordsForSnapshot(action.hubId, envelope);
        }
      );
      return;
    }

    case 'EVIDENCE_ARCHIVE_SNAPSHOT': {
      // F3.5 D3: snapshot soft-delete only. Azure has no rowProvenance Dexie
      // table; cascade-to-provenance is a PWA-only operation (closure happens
      // in apps/pwa/src/persistence/applyAction.ts).
      //
      // Not idempotent: repeated calls refresh deletedAt. Intentional — aligns
      // with Dexie.update semantics; contrasts with OUTCOME_ARCHIVE's
      // skip-if-already-deleted guard (where the embedded-array model makes
      // idempotence cheap).
      await db.evidenceSnapshots.update(action.snapshotId, { deletedAt: Date.now() });
      return;
    }

    // -------------------------------------------------------------------------
    // Evidence sources — dedicated evidenceSources + evidenceSourceCursors tables
    // -------------------------------------------------------------------------

    case 'EVIDENCE_SOURCE_ADD': {
      await db.evidenceSources.put(action.source);
      return;
    }

    case 'EVIDENCE_SOURCE_UPDATE_CURSOR': {
      // F3.5 P5 cursor reconciliation (D5). Azure schema: [hubId+sourceId] compound
      // primary key — Dexie auto-resolves the key from cursor.hubId + cursor.sourceId;
      // no explicit id needed for the key path (asymmetric vs PWA's id-keyed &id put).
      // put() replaces the existing row or inserts a new one (upsert semantics).
      // Audit S6 (markSeen createdAt overwrite): put is unconditional per D7 scope;
      // a future F4 normalization pass may add a createdat-preserving merge strategy.
      await db.evidenceSourceCursors.put(action.cursor);
      return;
    }

    case 'EVIDENCE_SOURCE_REMOVE': {
      // ATOMIC: cascade (source → cursor) + parent soft-delete in one transaction.
      // Dexie 4 zone propagation: cascadeArchiveDescendants detects the outer
      // transaction and reuses it — both writes succeed or neither does.
      //
      // IMPORTANT: the outer transaction must lock ALL tables that cascadeArchiveDescendants
      // may access internally (evidenceSnapshots, evidenceSources, evidenceSourceCursors,
      // processHubs — see cascadeArchive.ts). The locked set must be a superset of the
      // helper's internal transaction's tables, or Dexie raises SubTransactionError.
      const now = Date.now();
      await db.transaction(
        'rw',
        [db.evidenceSources, db.evidenceSourceCursors, db.evidenceSnapshots, db.processHubs],
        async () => {
          await cascadeArchiveDescendants('evidenceSource', action.sourceId, now);
          await db.evidenceSources.update(action.sourceId, { deletedAt: now });
        }
      );
      return;
    }

    // -------------------------------------------------------------------------
    // Improvement Project — dedicated improvementProjects Dexie table.
    //
    // Mirrors the PWA handler byte-for-byte (apps/pwa/src/persistence/applyAction.ts).
    // UPDATE applies the deep-merge contract documented on
    // `improvementProjectActions.ts`:
    //   - objects shallow-merge one level (metadata, goal, signoff)
    //   - nested metadata.financialImpact + goal.outcomeGoal also shallow-merge
    //   - sections shallow-merge per sub-section key (missing keys preserved)
    //   - all arrays REPLACE wholesale
    //   - id, createdAt, hubId, deletedAt, updatedAt are not caller-controllable
    //   - updatedAt is set by THIS handler to Date.now()
    // -------------------------------------------------------------------------

    case 'IMPROVEMENT_PROJECT_CREATE': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) {
        throw new Error(`IMPROVEMENT_PROJECT_CREATE: parent hub ${action.hubId} does not exist`);
      }
      await db.improvementProjects.add(action.project);
      return;
    }

    case 'IMPROVEMENT_PROJECT_UPDATE': {
      // Idempotent on missing.
      const existing = await db.improvementProjects.get(action.projectId);
      if (!existing) return;
      const { patch } = action;
      const merged = {
        ...existing,
        ...patch,
        metadata: patch.metadata
          ? {
              ...existing.metadata,
              ...patch.metadata,
              ...(patch.metadata.financialImpact
                ? {
                    financialImpact: {
                      ...(existing.metadata.financialImpact ?? {}),
                      ...patch.metadata.financialImpact,
                    },
                  }
                : {}),
            }
          : existing.metadata,
        goal: patch.goal
          ? {
              ...existing.goal,
              ...patch.goal,
              ...(patch.goal.outcomeGoal
                ? { outcomeGoal: { ...existing.goal.outcomeGoal, ...patch.goal.outcomeGoal } }
                : {}),
            }
          : existing.goal,
        sections: patch.sections
          ? {
              background: { ...existing.sections.background, ...(patch.sections.background ?? {}) },
              investigationLineage: {
                ...existing.sections.investigationLineage,
                ...(patch.sections.investigationLineage ?? {}),
              },
              approach: { ...existing.sections.approach, ...(patch.sections.approach ?? {}) },
              outcomeReference: {
                ...existing.sections.outcomeReference,
                ...(patch.sections.outcomeReference ?? {}),
              },
            }
          : existing.sections,
        signoff: patch.signoff
          ? { ...(existing.signoff ?? {}), ...patch.signoff }
          : existing.signoff,
        updatedAt: Date.now(),
      };
      await db.improvementProjects.put(merged);
      return;
    }

    case 'IMPROVEMENT_PROJECT_ARCHIVE': {
      // Idempotent soft-delete.
      await db.improvementProjects.update(action.projectId, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return;
    }

    case 'ACTION_ITEM_ADD': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) {
        throw new Error(`ACTION_ITEM_ADD: parent hub ${action.hubId} does not exist`);
      }
      await db.actionItems.add({ ...action.actionItem, hubId: action.hubId });
      return;
    }

    case 'ACTION_ITEM_UPDATE': {
      const existing = await db.actionItems.get(action.actionItemId);
      if (!existing) return;
      await db.actionItems.update(action.actionItemId, {
        ...action.patch,
        updatedAt: Date.now(),
      });
      return;
    }

    case 'ACTION_ITEM_REMOVE': {
      await db.actionItems.update(action.actionItemId, {
        deletedAt: action.removedAt,
        updatedAt: action.removedAt,
      });
      return;
    }

    case 'SUSTAINMENT_RECORD_CREATE': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) {
        throw new Error(`SUSTAINMENT_RECORD_CREATE: parent hub ${action.hubId} does not exist`);
      }
      if (action.record.hubId !== action.hubId) {
        throw new Error(
          `SUSTAINMENT_RECORD_CREATE hubId mismatch: action hub '${action.hubId}' does not match record hub '${action.record.hubId}'`
        );
      }
      await db.sustainmentRecords.add(action.record);
      return;
    }

    case 'SUSTAINMENT_RECORD_UPDATE': {
      const existing = await db.sustainmentRecords.get(action.recordId);
      if (!existing) return;
      await db.sustainmentRecords.update(action.recordId, {
        ...action.patch,
        updatedAt: Date.now(),
      });
      return;
    }

    case 'SUSTAINMENT_RECORD_ARCHIVE': {
      await db.sustainmentRecords.update(action.recordId, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return;
    }

    case 'SUSTAINMENT_CONFIRM': {
      await db.sustainmentRecords.update(action.recordId, {
        status: 'confirmed-sustained',
        updatedAt: Date.now(),
      });
      return;
    }

    case 'SUSTAINMENT_MARK_DRIFTED': {
      await db.sustainmentRecords.update(action.recordId, {
        status: 'drifted',
        consecutiveOnTargetTicks: 0,
        updatedAt: Date.now(),
      });
      return;
    }

    case 'SUSTAINMENT_TICK_EVALUATED': {
      await db.transaction('rw', [db.sustainmentRecords, db.sustainmentReviews], async () => {
        const existing = await db.sustainmentRecords.get(action.record.id);
        await db.sustainmentRecords.put({ ...existing, ...action.record });
        await db.sustainmentReviews.put(action.review);
      });
      return;
    }

    case 'CONTROL_HANDOFF_CREATE': {
      const hub = await db.processHubs.get(action.hubId);
      if (!hub) {
        throw new Error(`CONTROL_HANDOFF_CREATE: parent hub ${action.hubId} does not exist`);
      }
      if (action.handoff.hubId !== action.hubId) {
        throw new Error(
          `CONTROL_HANDOFF_CREATE hubId mismatch: action hub '${action.hubId}' does not match handoff hub '${action.handoff.hubId}'`
        );
      }
      await db.controlHandoffs.add(action.handoff);
      return;
    }

    case 'CONTROL_HANDOFF_UPDATE': {
      const existing = await db.controlHandoffs.get(action.handoffId);
      if (!existing) return;
      await db.controlHandoffs.update(action.handoffId, action.patch);
      return;
    }

    case 'CONTROL_HANDOFF_ARCHIVE': {
      await db.controlHandoffs.update(action.handoffId, { deletedAt: Date.now() });
      return;
    }

    case 'CONTROL_HANDOFF_ACKNOWLEDGE': {
      const acknowledgedAt = action.acknowledgedAt ?? Date.now();
      await db.controlHandoffs.update(action.handoffId, {
        status: 'acknowledged',
        acknowledgedAt,
        ownerAcknowledgement: {
          acknowledgedBy: action.acknowledgedBy,
          notes: action.notes,
        },
      });
      return;
    }

    case 'CONTROL_HANDOFF_MARK_OPERATIONAL': {
      await db.controlHandoffs.update(action.handoffId, {
        status: 'operational',
        operationalAt: action.operationalAt ?? Date.now(),
      });
      return;
    }

    case 'CONTROL_HANDOFF_SIGNOFF': {
      const existing = await db.controlHandoffs.get(action.handoffId);
      if (!existing) return;
      const operationalAt = existing.operationalAt ?? action.signoff.approvedAt ?? Date.now();
      await db.controlHandoffs.update(action.handoffId, {
        status: 'operational',
        operationalAt,
        signoff: { ...(existing.signoff ?? {}), ...action.signoff },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // Session-only — Azure has no dedicated Dexie table today; F3 normalizes.
    // -------------------------------------------------------------------------

    case 'INVESTIGATION_CREATE':
      // Azure has no 'investigation' table today; F3 normalizes — no-op.
      return;

    case 'INVESTIGATION_UPDATE_METADATA':
      // Azure has no 'investigation' table today; F3 normalizes — no-op.
      return;

    case 'INVESTIGATION_ARCHIVE':
      // Azure has no 'investigation' table today; F3 normalizes — no-op.
      return;

    case 'FINDING_ADD':
      // Azure has no 'finding' table today; F3 normalizes — no-op.
      return;

    case 'FINDING_UPDATE':
      // Azure has no 'finding' table today; F3 normalizes — no-op.
      return;

    case 'FINDING_ARCHIVE':
      // Azure has no 'finding' table today; F3 normalizes — no-op.
      return;

    case 'QUESTION_ADD':
      // Azure has no 'question' table today; F3 normalizes — no-op.
      return;

    case 'QUESTION_UPDATE':
      // Azure has no 'question' table today; F3 normalizes — no-op.
      return;

    case 'QUESTION_ARCHIVE':
      // Azure has no 'question' table today; F3 normalizes — no-op.
      return;

    case 'CAUSAL_LINK_ADD':
      // Azure has no 'causalLink' table today; F3 normalizes — no-op.
      return;

    case 'CAUSAL_LINK_UPDATE':
      // Azure has no 'causalLink' table today; F3 normalizes — no-op.
      return;

    case 'CAUSAL_LINK_ARCHIVE':
      // Azure has no 'causalLink' table today; F3 normalizes — no-op.
      return;

    case 'HYPOTHESIS_ADD':
      // Azure has no 'hypothesis' table today; F3 normalizes — no-op.
      return;

    case 'HYPOTHESIS_UPDATE':
      // Azure has no 'hypothesis' table today; F3 normalizes — no-op.
      return;

    case 'HYPOTHESIS_ARCHIVE':
      // Azure has no 'hypothesis' table today; F3 normalizes — no-op.
      return;

    // -------------------------------------------------------------------------
    // Canvas actions — no-ops: canvas mutations flow through canvasStore →
    // HUB_PERSIST_SNAPSHOT. No direct dispatch path for these in Azure.
    // -------------------------------------------------------------------------

    case 'PLACE_CHIP_ON_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'UNASSIGN_CHIP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'REORDER_CHIP_IN_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'ADD_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'REMOVE_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'RENAME_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'CONNECT_STEPS':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'DISCONNECT_STEPS':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'GROUP_INTO_SUB_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    case 'UNGROUP_SUB_STEP':
      // Canvas mutations flow through canvasStore → HUB_PERSIST_SNAPSHOT; no direct dispatch path.
      return;

    default:
      assertNever(action);
  }
}

async function evaluateSustainmentRecordsForSnapshot(
  hubId: string,
  snapshot: EvidenceSnapshot
): Promise<void> {
  await db.transaction('rw', [db.sustainmentRecords, db.sustainmentReviews], async () => {
    const liveRecords = await db.sustainmentRecords
      .where('hubId')
      .equals(hubId)
      .filter(record => record.deletedAt === null && record.lastEvaluatedSnapshotId !== snapshot.id)
      .toArray();

    if (liveRecords.length === 0) return;

    const now = Date.now();
    const evaluations = liveRecords.map(record => applySustainmentTick(record, snapshot, now));
    await db.sustainmentRecords.bulkPut(evaluations.map(evaluation => evaluation.record));
    await db.sustainmentReviews.bulkPut(evaluations.map(evaluation => evaluation.review));
  });
}
