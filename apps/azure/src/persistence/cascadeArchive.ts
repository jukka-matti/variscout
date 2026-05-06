// apps/azure/src/persistence/cascadeArchive.ts
//
// Generic cascade-archive helper for Azure Dexie tables.
//
// AZURE PERSISTENCE MODEL:
//   Azure stores processHubs, evidenceSources, evidenceSnapshots, and
//   evidenceSourceCursors in dedicated Dexie tables. Investigations, findings,
//   questions, causalLinks, suspectedCauses, rowProvenance, and canvasState
//   have no Azure Dexie tables today — their cascade steps are documented no-ops.
//
// CASCADE STRATEGY:
//   cascadeArchiveDescendants calls transitiveCascade() from @variscout/core/persistence
//   to walk all descendant kinds in a single BFS, then soft-marks (sets deletedAt)
//   every row in tables that Azure has, leaving no-op stubs for the rest.
//
//   The meaningful multi-table cascade Azure supports today is:
//     evidenceSource → evidenceSourceCursor
//   For a hub parent, the walk also covers:
//     hub → evidenceSnapshot (hubId FK)
//     hub → evidenceSource (hubId FK)
//     hub → evidenceSource → evidenceSourceCursor (compound [hubId+sourceId] PK)
//
// OUTCOME CASCADE:
//   Outcomes are embedded arrays inside the processHubs blob row. This helper
//   does NOT touch the hub blob — that is the per-action handler's responsibility
//   in P5.3. The per-action handler for hub/outcome archive will call
//   processHubs.update() with a patch that mutates the outcomes[] array. The
//   cascade helper handles cross-table cascades only.
//
// F3 NOTE:
//   Per audit R10/PWA pattern: investigation/finding/question/causalLink/
//   suspectedCause/rowProvenance/canvasState have no Azure Dexie tables today —
//   cascade is a no-op for those kinds. F3 normalization will add the Dexie
//   tables; updating this helper is part of F3.

import { transitiveCascade, type EntityKind } from '@variscout/core/persistence';
import { db } from '../db/schema';

// ---------------------------------------------------------------------------
// Internal: per-kind archive step inside a Dexie transaction
// ---------------------------------------------------------------------------

/**
 * Soft-mark all live rows of the given descendant kind that are scoped to
 * the parent identified by (parentKind, parentId).
 *
 * Called inside a Dexie transaction; every operation here participates in
 * the same transaction scope. If any awaited call throws, Dexie aborts the
 * whole transaction automatically.
 *
 * No default/exhaustive guard: the switch is deliberately non-exhaustive
 * for no-op cases so TypeScript does not require a default branch.
 * EntityKind additions in cascadeRules must be audited here and in
 * the equivalent PWA helper (applyAction.ts > archiveDescendantsOfKindInDraft).
 */
async function archiveKindRows(
  kind: EntityKind,
  parentKind: EntityKind,
  parentId: string,
  archivedAt: number
): Promise<void> {
  switch (kind) {
    // -----------------------------------------------------------------------
    // outcome — embedded array in the processHubs blob.
    // The per-action handler (P5.3) rewrites the hub blob including its
    // outcomes[] array. This helper handles cross-table cascades only.
    // -----------------------------------------------------------------------
    case 'outcome':
      // Azure has no separate 'outcome' table today.
      // outcome lives inside the processHubs blob; P5.3 per-action handler
      // mutates it via processHubs.update(). See module-level comment.
      return;

    // -----------------------------------------------------------------------
    // evidenceSnapshot — dedicated Azure table; FK: hubId
    // Only reached when parentKind === 'hub'.
    // -----------------------------------------------------------------------
    case 'evidenceSnapshot': {
      if (parentKind !== 'hub') return;
      const snaps = await db.evidenceSnapshots.where('hubId').equals(parentId).toArray();
      if (snaps.length === 0) return;
      await db.evidenceSnapshots.bulkUpdate(
        snaps.map(s => ({ key: s.id, changes: { deletedAt: archivedAt } }))
      );
      return;
    }

    // -----------------------------------------------------------------------
    // rowProvenance — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'rowProvenance':
      // Azure has no 'rowProvenance' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // evidenceSource — dedicated Azure table; FK: hubId
    // Only reached when parentKind === 'hub'.
    // -----------------------------------------------------------------------
    case 'evidenceSource': {
      if (parentKind !== 'hub') return;
      const sources = await db.evidenceSources.where('hubId').equals(parentId).toArray();
      if (sources.length === 0) return;
      await db.evidenceSources.bulkUpdate(
        sources.map(s => ({ key: s.id, changes: { deletedAt: archivedAt } }))
      );
      return;
    }

    // -----------------------------------------------------------------------
    // evidenceSourceCursor — dedicated Azure table; compound PK [hubId+sourceId]
    //
    // When parentKind === 'evidenceSource': parentId is a sourceId.
    //   Query: compound key range [parentId, *] is not directly queryable because
    //   the compound PK is [hubId+sourceId], not [sourceId+hubId]. Instead we
    //   use a collection scan filtered by sourceId. In practice each source has
    //   at most one cursor per hub, so this is O(1) or very small.
    //
    // When parentKind === 'hub': parentId is a hubId.
    //   Query: compound key range — Dexie supports between([hubId, ''], [hubId, '￿'])
    //   on compound primary keys. This is a native IDB key-range scan, efficient.
    //
    // The parent must have an Azure Dexie table (evidenceSource or hub); if not,
    // the cursor rows would not exist and the query returns empty anyway.
    // -----------------------------------------------------------------------
    case 'evidenceSourceCursor': {
      if (parentKind === 'evidenceSource') {
        // sourceId is parentId; hubId is unknown here — scan by sourceId field.
        const cursors = await db.evidenceSourceCursors
          .filter(c => c.sourceId === parentId)
          .toArray();
        if (cursors.length === 0) return;
        await db.evidenceSourceCursors.bulkUpdate(
          cursors.map(c => ({
            key: [c.hubId, c.sourceId] as [string, string],
            changes: { deletedAt: archivedAt },
          }))
        );
      } else if (parentKind === 'hub') {
        // hubId is parentId; use compound key range on the [hubId+sourceId] PK.
        const cursors = await db.evidenceSourceCursors
          .where('[hubId+sourceId]')
          .between([parentId, ''], [parentId, '￿'], true, true)
          .toArray();
        if (cursors.length === 0) return;
        await db.evidenceSourceCursors.bulkUpdate(
          cursors.map(c => ({
            key: [c.hubId, c.sourceId] as [string, string],
            changes: { deletedAt: archivedAt },
          }))
        );
      }
      // Other parent kinds have no cursor children in Azure today — no-op.
      return;
    }

    // -----------------------------------------------------------------------
    // investigation — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'investigation':
      // Azure has no 'investigation' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // finding — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'finding':
      // Azure has no 'finding' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // question — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'question':
      // Azure has no 'question' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // causalLink — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'causalLink':
      // Azure has no 'causalLink' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // suspectedCause — no Azure Dexie table today; F3 normalizes.
    // -----------------------------------------------------------------------
    case 'suspectedCause':
      // Azure has no 'suspectedCause' table today; F3 normalization will add
      // the table; updating this helper is part of F3.
      return;

    // -----------------------------------------------------------------------
    // canvasState — no Azure Dexie table today; canonicalProcessMap is
    // embedded in the hub blob (rewritten by the P5.3 hub-archive handler).
    // -----------------------------------------------------------------------
    case 'canvasState':
      // Azure has no 'canvasState' table today; canonicalProcessMap is
      // embedded in the processHubs blob. F3 may normalize this.
      return;

    // -----------------------------------------------------------------------
    // hub — hub is the parent, never a cascade descendant of itself.
    // Included for TypeScript exhaustiveness on EntityKind.
    // -----------------------------------------------------------------------
    case 'hub':
      // hub is never a cascade target of itself; no-op.
      return;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Cascade-archive all Dexie-table descendants of the given parent entity
 * within a single Dexie read-write transaction.
 *
 * This helper soft-marks (sets `deletedAt = archivedAt`) every descendant row
 * in the Azure Dexie tables that the parent's cascade rules cover. Descendant
 * kinds that Azure does not have dedicated tables for today are documented
 * no-ops (see module-level comment and per-case comments in archiveKindRows).
 *
 * IMPORTANT — not wired into dispatch() yet:
 *   This helper is called by P5.3's per-action handlers. Do not call it
 *   directly from non-persistence code.
 *
 * IMPORTANT — does NOT soft-mark the parent row itself:
 *   The per-action handler in P5.3 is responsible for updating the parent row.
 *   This helper only handles the descendant cross-table cascade.
 *
 * IMPORTANT — does NOT touch the hub blob for outcome/canvasState cascade:
 *   Outcomes and canonicalProcessMap are embedded in the processHubs blob row.
 *   The P5.3 per-action handler mutates the hub blob via processHubs.update().
 *   This helper handles cross-table cascades only.
 *
 * Transaction semantics:
 *   On any error thrown inside the transaction callback, Dexie aborts the
 *   entire transaction automatically. All intermediate writes are rolled back.
 *   Errors propagate to the caller without re-wrapping.
 *
 * ## Atomic call pattern (P5.3+)
 *
 * To atomically combine this cascade with the parent row's own deletedAt
 * update, wrap both in a single `db.transaction` that covers the parent
 * table plus the descendant tables this helper writes to:
 *
 * ```ts
 * await db.transaction('rw',
 *   [db.processHubs, db.evidenceSnapshots, db.evidenceSources, db.evidenceSourceCursors],
 *   async () => {
 *     await cascadeArchiveDescendants('hub', hubId, now);
 *     await db.processHubs.update(hubId, { deletedAt: now });
 *   });
 * ```
 *
 * Dexie 4 reuses the outer transaction zone when the helper's inner
 * `db.transaction(...)` call detects an active outer transaction whose
 * locked tables are a superset of the helper's required tables. Calling
 * the helper outside of an outer transaction (today's tests, simple flows)
 * still works — the helper opens its own transaction.
 *
 * @param parentKind The EntityKind of the entity being archived (e.g. 'hub', 'evidenceSource').
 * @param parentId   The id of the entity being archived.
 * @param archivedAt Unix ms timestamp for the soft-delete mark.
 */
export async function cascadeArchiveDescendants(
  parentKind: EntityKind,
  parentId: string,
  archivedAt: number
): Promise<void> {
  const descendantKinds = transitiveCascade(parentKind);

  // If there are no descendant kinds, skip the transaction overhead.
  if (descendantKinds.length === 0) return;

  await db.transaction(
    'rw',
    [
      db.evidenceSnapshots,
      db.evidenceSources,
      db.evidenceSourceCursors,
      // processHubs is included so the hub-archive handler (P5.3) may also
      // call processHubs.update() inside the same transaction scope if needed.
      // This helper itself does not write to processHubs.
      db.processHubs,
    ],
    async () => {
      for (const kind of descendantKinds) {
        await archiveKindRows(kind, parentKind, parentId, archivedAt);
      }
    }
  );
}
