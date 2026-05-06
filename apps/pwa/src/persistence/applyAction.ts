// apps/pwa/src/persistence/applyAction.ts
//
// F3 transactional Dexie writer for the PWA persistence layer.
//
// Replaces the F2-era pure Immer recipe (`applyAction(hub, action) → next hub`)
// with an async transactional dispatcher that writes directly to the F3
// normalized schema:
//
//   applyAction(db: PwaDatabase, action: HubAction): Promise<void>
//
// Action coverage (F3 — narrow; F3.5 extends with evidence handlers):
//   - HUB_PERSIST_SNAPSHOT: bootstrap/full-save path. Decomposes the incoming
//     ProcessHub into hubs / outcomes / canvasState rows in a single
//     `db.transaction('rw', ...)`.
//   - HUB_UPDATE_GOAL / HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS: hubs row patches.
//   - OUTCOME_ADD: validates parent hub exists; adds an outcome row carrying
//     the FK `hubId`.
//   - OUTCOME_UPDATE: idempotent patch on the outcome row.
//   - OUTCOME_ARCHIVE: idempotent soft-delete (deletedAt = Date.now()).
//   - EVIDENCE_ADD_SNAPSHOT / EVIDENCE_ARCHIVE_SNAPSHOT — F3.5 wired (atomic
//     snapshot + provenance writes; cascade-soft-delete on archive).
//
// Out of scope (no-op with comments):
//   - EVIDENCE_SOURCE_UPDATE_CURSOR — F3.5 P5 wires this; currently no-op.
//   - EVIDENCE_SOURCE_ADD / EVIDENCE_SOURCE_REMOVE — pending future use.
//   - INVESTIGATION_* / FINDING_* / QUESTION_* / CAUSAL_LINK_* /
//     SUSPECTED_CAUSE_* — F5 wires this when investigation entity action
//     coverage lands.
//   - CANVAS_* — canvasStore remains the canonical mutation surface;
//     canonicalProcessMap reaches the canvasState table only via
//     HUB_PERSIST_SNAPSHOT until F5 introduces direct canvas action coverage.
//
// `assertNever(action)` enforces TypeScript exhaustiveness — adding a new
// HubAction kind without a case here is a compile error.
//
// Spec: docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md §3 D3, §5

import type { HubAction } from '@variscout/core/actions';
import type { PwaDatabase } from '../db/schema';

// ---------------------------------------------------------------------------
// Exhaustiveness helper
// ---------------------------------------------------------------------------

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
}

// ---------------------------------------------------------------------------
// applyAction
// ---------------------------------------------------------------------------

/**
 * Apply a single HubAction by performing Dexie writes against the PWA database.
 *
 * Transactional where multiple tables are touched (HUB_PERSIST_SNAPSHOT). Single
 * `.update()` / `.add()` calls are atomic at the Dexie level; no explicit
 * transaction needed for them.
 *
 * Loud failure on hub-existence preconditions (OUTCOME_ADD); idempotent on
 * already-deleted-or-missing rows (OUTCOME_UPDATE / OUTCOME_ARCHIVE).
 *
 * Exhaustiveness is enforced at the TypeScript level via `assertNever()`.
 */
export async function applyAction(db: PwaDatabase, action: HubAction): Promise<void> {
  switch (action.kind) {
    // -----------------------------------------------------------------------
    // Hub bootstrap / full-save — atomic decompose into 3 tables.
    //
    // The incoming ProcessHub is split:
    //   hubMeta       → hubs table
    //   outcomes[]    → outcomes table (each row tagged with hubId)
    //   canonicalProcessMap → canvasState table (1 row, keyed by hubId)
    //
    // Wrapping all three writes in a single read/write transaction guarantees
    // partial-state recovery semantics: if any write throws, none commit.
    // -----------------------------------------------------------------------

    case 'HUB_PERSIST_SNAPSHOT': {
      const { canonicalProcessMap, outcomes, ...hubMeta } = action.hub;
      await db.transaction('rw', [db.hubs, db.outcomes, db.canvasState], async () => {
        await db.hubs.put(hubMeta);
        // HUB_PERSIST_SNAPSHOT carries the hub's authoritative full state; rows
        // that exist for this hub but are absent from the incoming snapshot are
        // stale and must be removed inside the same transaction (preserves the
        // F2 blob-replacement invariant in the normalized world). bulkPut/put
        // alone are upserts and would leave dropped outcomes / a removed
        // canonicalProcessMap visible on the next joinHub.
        const incomingOutcomeIds = new Set((outcomes ?? []).map(o => o.id));
        await db.outcomes
          .where('hubId')
          .equals(hubMeta.id)
          .filter(o => !incomingOutcomeIds.has(o.id))
          .delete();
        if (outcomes && outcomes.length > 0) {
          await db.outcomes.bulkPut(outcomes.map(outcome => ({ ...outcome, hubId: hubMeta.id })));
        }
        if (canonicalProcessMap) {
          await db.canvasState.put({ hubId: hubMeta.id, ...canonicalProcessMap });
        } else {
          // Snapshot lacks a canonical process map — clear any stale row so
          // joinHub won't resurrect it.
          await db.canvasState.delete(hubMeta.id);
        }
      });
      return;
    }

    // -----------------------------------------------------------------------
    // Hub meta — single-row patches with updatedAt bump.
    // -----------------------------------------------------------------------

    case 'HUB_UPDATE_GOAL': {
      // Loud failure on missing hub — matches OUTCOME_ADD's invariant.
      // Dexie's `.update()` returns 0 silently on missing rows; in the
      // normalized world that silence is misleading (caller's `await
      // dispatch(...)` resolves without error even though nothing happened).
      const hub = await db.hubs.get(action.hubId);
      if (!hub) {
        throw new Error(`HUB_UPDATE_GOAL hubId mismatch: hub '${action.hubId}' not found`);
      }
      await db.hubs.update(action.hubId, {
        processGoal: action.processGoal,
        updatedAt: Date.now(),
      });
      return;
    }

    case 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS': {
      // Loud failure on missing hub — see HUB_UPDATE_GOAL for rationale.
      const hub = await db.hubs.get(action.hubId);
      if (!hub) {
        throw new Error(
          `HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS hubId mismatch: hub '${action.hubId}' not found`
        );
      }
      await db.hubs.update(action.hubId, {
        primaryScopeDimensions: action.dimensions,
        updatedAt: Date.now(),
      });
      return;
    }

    // -----------------------------------------------------------------------
    // Outcomes — single-row inserts/patches against the outcomes table.
    // -----------------------------------------------------------------------

    case 'OUTCOME_ADD': {
      const hub = await db.hubs.get(action.hubId);
      if (!hub) {
        // Loud failure: parent-hub invariant from F2 preserved.
        throw new Error(`OUTCOME_ADD: parent hub ${action.hubId} does not exist`);
      }
      await db.outcomes.add({ ...action.outcome, hubId: action.hubId });
      return;
    }

    case 'OUTCOME_UPDATE': {
      // Idempotent: Dexie's `.update()` returns 0 on missing rows without throwing.
      await db.outcomes.update(action.outcomeId, action.patch);
      return;
    }

    case 'OUTCOME_ARCHIVE': {
      // Idempotent soft-delete. `OutcomeSpec` has no cascade descendants
      // (cascadeRules.outcome.cascadesTo === []), so no further work.
      await db.outcomes.update(action.outcomeId, { deletedAt: Date.now() });
      return;
    }

    // -----------------------------------------------------------------------
    // Investigation entity actions (investigation / finding / question /
    // causalLink / suspectedCause) — F5 wires these when the investigation
    // entity action coverage lands. The corresponding tables already exist
    // (declared by F3 P1) but writes are not yet routed here.
    // -----------------------------------------------------------------------

    case 'INVESTIGATION_CREATE':
    case 'INVESTIGATION_UPDATE_METADATA':
    case 'INVESTIGATION_ARCHIVE':
    case 'FINDING_ADD':
    case 'FINDING_UPDATE':
    case 'FINDING_ARCHIVE':
    case 'QUESTION_ADD':
    case 'QUESTION_UPDATE':
    case 'QUESTION_ARCHIVE':
    case 'CAUSAL_LINK_ADD':
    case 'CAUSAL_LINK_UPDATE':
    case 'CAUSAL_LINK_ARCHIVE':
    case 'SUSPECTED_CAUSE_ADD':
    case 'SUSPECTED_CAUSE_UPDATE':
    case 'SUSPECTED_CAUSE_ARCHIVE': {
      return;
    }

    // -----------------------------------------------------------------------
    // Evidence — F3.5 ingestion action layer.
    // -----------------------------------------------------------------------

    // F3.5 D2 atomic ingestion handler. Closes the RowProvenanceTag.snapshotId = ''
    // placeholder gap introduced in F1+F2 P1.3 (ADR-077 amendment) — the handler
    // receives tags with snapshotId still empty and populates it from
    // action.snapshot.id inside the transaction. If replacedSnapshotId is
    // present (D1 replacement cascade), the old snapshot + its provenance rows
    // are soft-deleted inside the same transaction before the new rows are
    // written, ensuring no partial state is observable.
    case 'EVIDENCE_ADD_SNAPSHOT': {
      await db.transaction('rw', [db.evidenceSnapshots, db.rowProvenance], async () => {
        const now = Date.now();

        // Cascade: if replacing, mark replaced snapshot + its provenance rows.
        if (action.replacedSnapshotId) {
          await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: now });
          const replacedTags = await db.rowProvenance
            .where('snapshotId')
            .equals(action.replacedSnapshotId)
            .toArray();
          if (replacedTags.length > 0) {
            await db.rowProvenance.bulkUpdate(
              replacedTags.map(t => ({ key: t.id, changes: { deletedAt: now } }))
            );
          }
        }

        // Insert the new snapshot.
        await db.evidenceSnapshots.put(action.snapshot);

        // Insert provenance tags with snapshotId now populated (closes F3.5 wiring gap).
        if (action.provenance.length > 0) {
          const tagsWithSnapshotId = action.provenance.map(t => ({
            ...t,
            snapshotId: action.snapshot.id,
          }));
          await db.rowProvenance.bulkPut(tagsWithSnapshotId);
        }
      });
      return;
    }

    // Cascade-soft-delete to provenance per F3.5. Idempotent on already-deleted
    // rows — Dexie's `.update()` returns 0 silently on a missing key, same
    // pattern as the existing OUTCOME_ARCHIVE handler.
    case 'EVIDENCE_ARCHIVE_SNAPSHOT': {
      await db.transaction('rw', [db.evidenceSnapshots, db.rowProvenance], async () => {
        const now = Date.now();
        await db.evidenceSnapshots.update(action.snapshotId, { deletedAt: now });
        const tags = await db.rowProvenance.where('snapshotId').equals(action.snapshotId).toArray();
        if (tags.length > 0) {
          await db.rowProvenance.bulkUpdate(
            tags.map(t => ({ key: t.id, changes: { deletedAt: now } }))
          );
        }
      });
      return;
    }

    // F3.5 P5 wires EVIDENCE_SOURCE_UPDATE_CURSOR; EVIDENCE_SOURCE_ADD /
    // EVIDENCE_SOURCE_REMOVE stay no-op pending future use.
    case 'EVIDENCE_SOURCE_ADD':
    case 'EVIDENCE_SOURCE_UPDATE_CURSOR':
    case 'EVIDENCE_SOURCE_REMOVE': {
      return;
    }

    // -----------------------------------------------------------------------
    // Canvas — canvasStore remains the canonical mutation surface for
    // canvas state. canvasState reaches the IDB table only via
    // HUB_PERSIST_SNAPSHOT (which decomposes hub.canonicalProcessMap into a
    // canvasState row). F5 introduces direct canvas action coverage if/when
    // canvas mutations move out of the session-only Zustand store.
    // -----------------------------------------------------------------------

    case 'PLACE_CHIP_ON_STEP':
    case 'UNASSIGN_CHIP':
    case 'REORDER_CHIP_IN_STEP':
    case 'ADD_STEP':
    case 'REMOVE_STEP':
    case 'RENAME_STEP':
    case 'CONNECT_STEPS':
    case 'DISCONNECT_STEPS':
    case 'GROUP_INTO_SUB_STEP':
    case 'UNGROUP_SUB_STEP': {
      // Canvas mutations live in canvasStore; canvasState row is overwritten
      // via HUB_PERSIST_SNAPSHOT. F5 wires direct canvas action coverage.
      return;
    }

    default:
      assertNever(action);
  }
}
