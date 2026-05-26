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
//   - EVIDENCE_SOURCE_UPDATE_CURSOR — F3.5 P5 wired (id-keyed put per D5;
//     caller-provided id preserved; generates one if absent).
//
// Out of scope (no-op with comments):
//   - EVIDENCE_SOURCE_ADD / EVIDENCE_SOURCE_REMOVE — pending future use.
//   - INVESTIGATION_* / FINDING_* / QUESTION_* / CAUSAL_LINK_* /
//     HYPOTHESIS_* — F5 wires this when investigation entity action
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
import { generateDeterministicId } from '@variscout/core/identity';
import { applySustainmentTick, type EvidenceSnapshot } from '@variscout/core';
import { reduceMeasurementPlans } from '@variscout/core/measurementPlan';
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
      // improvementProjects live in their own table; drop the embedded copy from the hub row.
      const {
        canonicalProcessMap,
        outcomes,
        improvementProjects,
        sustainmentRecords,
        sustainmentReviews,
        controlHandoffs,
        ...hubMeta
      } = action.hub;
      await db.transaction(
        'rw',
        [
          db.hubs,
          db.outcomes,
          db.canvasState,
          db.improvementProjects,
          db.sustainmentRecords,
          db.sustainmentReviews,
          db.controlHandoffs,
        ],
        async () => {
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
          // improvementProjects: drop stale rows for this hub, then bulk-put the
          // incoming snapshot. bulkPut alone is upsert; we delete first to remove
          // rows that are absent from the incoming snapshot (same invariant as outcomes).
          const incomingProjectIds = new Set((improvementProjects ?? []).map(p => p.id));
          await db.improvementProjects
            .where('hubId')
            .equals(hubMeta.id)
            .filter(p => !incomingProjectIds.has(p.id))
            .delete();
          if (improvementProjects && improvementProjects.length > 0) {
            await db.improvementProjects.bulkPut(
              improvementProjects.map(p => ({ ...p, hubId: hubMeta.id }))
            );
          }
          if (canonicalProcessMap) {
            await db.canvasState.put({ hubId: hubMeta.id, ...canonicalProcessMap });
          } else {
            // Snapshot lacks a canonical process map — clear any stale row so
            // joinHub won't resurrect it.
            await db.canvasState.delete(hubMeta.id);
          }
          const incomingSustainmentRecords = sustainmentRecords ?? [];
          const incomingRecordIds = new Set(incomingSustainmentRecords.map(record => record.id));
          await db.sustainmentRecords
            .where('hubId')
            .equals(hubMeta.id)
            .filter(record => !incomingRecordIds.has(record.id))
            .delete();
          if (incomingSustainmentRecords.length > 0) {
            await db.sustainmentRecords.bulkPut(incomingSustainmentRecords);
          }

          const incomingSustainmentReviews = sustainmentReviews ?? [];
          const incomingReviewIds = new Set(incomingSustainmentReviews.map(review => review.id));
          await db.sustainmentReviews
            .where('hubId')
            .equals(hubMeta.id)
            .filter(review => !incomingReviewIds.has(review.id))
            .delete();
          if (incomingSustainmentReviews.length > 0) {
            await db.sustainmentReviews.bulkPut(incomingSustainmentReviews);
          }

          const incomingControlHandoffs = controlHandoffs ?? [];
          const incomingHandoffIds = new Set(incomingControlHandoffs.map(handoff => handoff.id));
          await db.controlHandoffs
            .where('hubId')
            .equals(hubMeta.id)
            .filter(handoff => !incomingHandoffIds.has(handoff.id))
            .delete();
          if (incomingControlHandoffs.length > 0) {
            await db.controlHandoffs.bulkPut(incomingControlHandoffs);
          }
        }
      );
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

    case 'ACTION_ITEM_ADD': {
      const hub = await db.hubs.get(action.hubId);
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
      const hub = await db.hubs.get(action.hubId);
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
      const hub = await db.hubs.get(action.hubId);
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

    // -----------------------------------------------------------------------
    // Investigation entity actions (investigation / finding / question /
    // causalLink / hypothesis) — F5 wires these when the investigation
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
    case 'HYPOTHESIS_ADD':
    case 'HYPOTHESIS_UPDATE':
    case 'HYPOTHESIS_ARCHIVE': {
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
      await db.transaction(
        'rw',
        [db.evidenceSnapshots, db.rowProvenance, db.sustainmentRecords, db.sustainmentReviews],
        async () => {
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
          await evaluateSustainmentRecordsForSnapshot(db, action.hubId, action.snapshot);
        }
      );
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

    // F3.5 P5 — cursor reconciliation (D5). PWA schema: &id, sourceId — primary
    // key is `id`. Caller-provided synthetic id (e.g., `cursor-${hubId}-${sourceId}`
    // per the Azure useEvidenceSourceSync pattern, audit S8) is preserved. The
    // `id ?? generateDeterministicId()` fallback is defensive: EvidenceSourceCursor.id
    // is typed as string, so the guard only fires if a non-typed caller omits the
    // field. Audit S6 (markSeen createdAt overwrite): intentionally NOT guarded here
    // per D7 — the put is unconditional; the caller's cursor is written as-is.
    case 'EVIDENCE_SOURCE_UPDATE_CURSOR': {
      const cursorWithId = {
        ...action.cursor,
        id: action.cursor.id ?? generateDeterministicId(),
      };
      await db.evidenceSourceCursors.put(cursorWithId);
      return;
    }

    // EVIDENCE_SOURCE_ADD + EVIDENCE_SOURCE_REMOVE stay no-op pending future use.
    case 'EVIDENCE_SOURCE_ADD':
    case 'EVIDENCE_SOURCE_REMOVE': {
      return;
    }

    // -----------------------------------------------------------------------
    // Improvement Project — single-row inserts / patches with deep-merge.
    //
    // UPDATE applies the deep-merge contract documented on
    // `improvementProjectActions.ts`:
    //   - objects shallow-merge one level (metadata, goal, signoff)
    //   - nested metadata.financialImpact also shallow-merges
    //   - sections shallow-merge per sub-section key (missing keys preserved)
    //   - all arrays REPLACE wholesale (including goal.outcomeGoals)
    //   - id, createdAt, hubId, deletedAt, updatedAt are not caller-controllable
    //   - updatedAt is set by THIS handler to Date.now()
    // -----------------------------------------------------------------------

    case 'IMPROVEMENT_PROJECT_CREATE': {
      const hub = await db.hubs.get(action.hubId);
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
              // outcomeGoals[] replaces wholesale (consistent with other arrays).
              outcomeGoals: patch.goal.outcomeGoals ?? existing.goal.outcomeGoals,
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

    // -----------------------------------------------------------------------
    // Canvas — canvasStore remains the canonical mutation surface for
    // canvas state. canvasState reaches the IDB table only via
    // HUB_PERSIST_SNAPSHOT (which decomposes hub.canonicalProcessMap into a
    // canvasState row). F5 introduces direct canvas action coverage if/when
    // canvas mutations move out of the session-only Zustand store.
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    // MeasurementPlan actions — dedicated measurementPlans Dexie table.
    // -----------------------------------------------------------------------

    case 'MEASUREMENT_PLAN_ADD':
      await db.measurementPlans.put(action.plan);
      return;

    case 'MEASUREMENT_PLAN_UPDATE': {
      const existing = await db.measurementPlans.get(action.planId);
      if (!existing) return;
      const next = reduceMeasurementPlans([existing], action);
      if (next[0]) await db.measurementPlans.put(next[0]);
      return;
    }

    case 'MEASUREMENT_PLAN_REMOVE': {
      const existing = await db.measurementPlans.get(action.planId);
      if (!existing) return;
      const next = reduceMeasurementPlans([existing], action);
      if (next[0]) await db.measurementPlans.put(next[0]);
      return;
    }

    case 'MEASUREMENT_PLAN_LINK_FINDING': {
      const existing = await db.measurementPlans.get(action.planId);
      if (!existing) return;
      const next = reduceMeasurementPlans([existing], action);
      if (next[0]) await db.measurementPlans.put(next[0]);
      return;
    }

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

async function evaluateSustainmentRecordsForSnapshot(
  db: PwaDatabase,
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
