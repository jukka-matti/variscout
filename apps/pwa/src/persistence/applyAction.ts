// apps/pwa/src/persistence/applyAction.ts
//
// Per-action Immer recipe dispatcher for the PWA hub blob.
//
// PWA PERSISTENCE MODEL (Hub-of-one blob):
//   The hub blob (ProcessHub) contains: name, processGoal, outcomes, primaryScopeDimensions,
//   canonicalProcessMap, reviewSignal, plus EntityBase fields. It does NOT contain
//   investigations, findings, questions, causalLinks, suspectedCauses, evidenceSnapshots,
//   or evidenceSources — those live in session-only Zustand stores today.
//
// CASCADE STRATEGY:
//   Cascade helpers use transitiveCascade() from @variscout/core/persistence to walk
//   descendant kinds. On the PWA blob, only hub→outcome produces observable mutations;
//   all other parent kinds are structurally correct but yield no mutations because their
//   arrays do not exist on the blob. F3 normalization will add Dexie queries for the rest.
//
// CANVAS STRATEGY (R15):
//   Canvas mutations live in canvasStore; the hub's canonicalProcessMap is overwritten
//   via HUB_PERSIST_SNAPSHOT when the user saves. All CANVAS_* cases are therefore no-ops
//   here. F3 may revisit if canvas state is normalized into its own Dexie table.
//
// NON-HUB-RESIDENT ACTIONS:
//   INVESTIGATION_*, FINDING_*, QUESTION_*, CAUSAL_LINK_*, SUSPECTED_CAUSE_*,
//   EVIDENCE_*, and EVIDENCE_SOURCE_* handlers exist for type-exhaustiveness (TypeScript
//   validates the switch is exhaustive) but their bodies are no-ops. The dispatch still
//   satisfies the HubRepository contract; the entities live in session-only stores.
//   F3 normalization will give these handlers real bodies.

import { produce, type Draft } from 'immer';
import type { HubAction } from '@variscout/core/actions';
import type { ProcessHub } from '@variscout/core/processHub';
import { transitiveCascade, type EntityKind } from '@variscout/core/persistence';

// ---------------------------------------------------------------------------
// Exhaustiveness helper
// ---------------------------------------------------------------------------

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
}

// ---------------------------------------------------------------------------
// Cascade helpers
//
// PWA blob holds only `outcomes` and `canonicalProcessMap`. Investigations,
// findings, questions, causalLinks, suspectedCauses, evidenceSnapshots,
// evidenceSources, rowProvenance, evidenceSourceCursors, and canvasState live
// in session-only Zustand stores (or Dexie tables introduced in F3) — the walk
// below is structurally correct but yields zero mutations on the PWA blob today
// for all parent kinds except hub→outcome. F3 normalization will fill in the
// remaining cases with real Dexie queries; the helper shape is already correct.
// ---------------------------------------------------------------------------

/**
 * Soft-mark descendants of a single EntityKind on the draft hub.
 *
 * The switch below covers every EntityKind. The only PWA-blob-resident kind
 * that can be cascade-targeted is `outcome` (via hub→outcome). All other kinds
 * are documented no-ops for PWA; F3 will add Dexie queries for the rest.
 *
 * The exhaustive switch (with no `default`) means TypeScript will error if a
 * new EntityKind is added to cascadeRules without updating this function.
 */
function archiveDescendantsOfKindInDraft(
  draft: Draft<ProcessHub>,
  kind: EntityKind,
  parentKind: EntityKind,
  parentId: string,
  archivedAt: number
): void {
  switch (kind) {
    case 'outcome': {
      // hub.outcomes is the only cascade target resident on the PWA blob.
      // Soft-mark all unarchived outcomes whose hubId matches the parent.
      if (parentKind === 'hub' && draft.id === parentId) {
        for (const outcome of draft.outcomes ?? []) {
          if (outcome.deletedAt === null) outcome.deletedAt = archivedAt;
        }
      }
      return;
    }
    case 'hub':
    case 'investigation':
    case 'finding':
    case 'question':
    case 'causalLink':
    case 'suspectedCause':
    case 'evidenceSnapshot':
    case 'evidenceSource':
    case 'rowProvenance':
    case 'evidenceSourceCursor':
    case 'canvasState':
      // PWA blob does not persist these arrays today; F3 will fill in.
      return;
  }
}

/**
 * Walks the transitive cascade rules for the given parent and soft-marks
 * matching descendants on the draft hub.
 *
 * On PWA, only the hub→outcome cascade has observable mutations. All other
 * parent kinds (investigation, evidenceSnapshot, evidenceSource, …) are
 * structurally correct but yield zero mutations because their descendant
 * arrays do not exist on the PWA blob. F3 normalizes.
 *
 * @internal Exported for unit-testing only. Do not call from app code.
 */
export function cascadeArchiveDescendantsInDraft(
  draft: Draft<ProcessHub>,
  parentKind: EntityKind,
  parentId: string,
  archivedAt: number
): void {
  const descendantKinds = transitiveCascade(parentKind);
  for (const kind of descendantKinds) {
    archiveDescendantsOfKindInDraft(draft, kind, parentKind, parentId, archivedAt);
  }
}

/**
 * Archive an investigation and its cascade descendants (finding, question,
 * causalLink, suspectedCause) on the draft hub.
 *
 * PWA blob has no investigations array; the parent soft-mark and the cascade
 * walk are both no-ops today. F3 normalizes.
 */
function archiveInvestigationInDraft(draft: Draft<ProcessHub>, investigationId: string): void {
  // PWA blob has no investigations array; the parent soft-mark is a no-op today.
  // The cascade walk also yields no mutations on the PWA blob. F3 normalizes.
  const archivedAt = Date.now();
  cascadeArchiveDescendantsInDraft(draft, 'investigation', investigationId, archivedAt);
}

/**
 * Archive a finding and its cascade descendants on the draft hub.
 *
 * PWA blob has no findings array; both the parent soft-mark and cascade walk
 * are no-ops today. F3 normalizes.
 */
function archiveFindingInDraft(draft: Draft<ProcessHub>, findingId: string): void {
  // PWA blob has no findings array; the parent soft-mark is a no-op today.
  // The cascade walk also yields no mutations on the PWA blob. F3 normalizes.
  const archivedAt = Date.now();
  cascadeArchiveDescendantsInDraft(draft, 'finding', findingId, archivedAt);
}

/**
 * Archive a question and its cascade descendants on the draft hub.
 *
 * PWA blob has no questions array; both the parent soft-mark and cascade walk
 * are no-ops today. F3 normalizes.
 */
function archiveQuestionInDraft(draft: Draft<ProcessHub>, questionId: string): void {
  // PWA blob has no questions array; the parent soft-mark is a no-op today.
  // The cascade walk also yields no mutations on the PWA blob. F3 normalizes.
  const archivedAt = Date.now();
  cascadeArchiveDescendantsInDraft(draft, 'question', questionId, archivedAt);
}

/**
 * Archive a causal link and its cascade descendants on the draft hub.
 *
 * PWA blob has no causalLinks array; both the parent soft-mark and cascade walk
 * are no-ops today. F3 normalizes.
 */
function archiveCausalLinkInDraft(draft: Draft<ProcessHub>, linkId: string): void {
  // PWA blob has no causalLinks array; the parent soft-mark is a no-op today.
  // The cascade walk also yields no mutations on the PWA blob. F3 normalizes.
  const archivedAt = Date.now();
  cascadeArchiveDescendantsInDraft(draft, 'causalLink', linkId, archivedAt);
}

/**
 * Archive a suspected cause and its cascade descendants on the draft hub.
 *
 * PWA blob has no suspectedCauses array; both the parent soft-mark and cascade
 * walk are no-ops today. F3 normalizes.
 */
function archiveSuspectedCauseInDraft(draft: Draft<ProcessHub>, causeId: string): void {
  // PWA blob has no suspectedCauses array; the parent soft-mark is a no-op today.
  // The cascade walk also yields no mutations on the PWA blob. F3 normalizes.
  const archivedAt = Date.now();
  cascadeArchiveDescendantsInDraft(draft, 'suspectedCause', causeId, archivedAt);
}

// ---------------------------------------------------------------------------
// applyAction
// ---------------------------------------------------------------------------

/**
 * Apply a single HubAction to a ProcessHub snapshot and return the next snapshot.
 * Pure function — no side effects, no I/O.
 *
 * Hub-resident actions produce real Immer mutations.
 * Non-hub-resident actions are no-ops (documented above).
 * Canvas actions are no-ops (canvasStore is the canonical mutation surface).
 * Exhaustiveness is enforced at the TypeScript level via assertNever().
 */
export function applyAction(hub: ProcessHub, action: HubAction): ProcessHub {
  // HUB_PERSIST_SNAPSHOT is a full replacement — bypass produce for clarity.
  if (action.kind === 'HUB_PERSIST_SNAPSHOT') {
    return action.hub;
  }

  return produce(hub, draft => {
    switch (action.kind) {
      // -----------------------------------------------------------------------
      // Hub meta — hub-resident real mutations
      // -----------------------------------------------------------------------

      case 'HUB_UPDATE_GOAL': {
        if (action.hubId !== draft.id) break; // defensive: should never happen in hub-of-one
        draft.processGoal = action.processGoal;
        draft.updatedAt = Date.now();
        break;
      }

      case 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS': {
        if (action.hubId !== draft.id) break; // defensive: should never happen in hub-of-one
        draft.primaryScopeDimensions = action.dimensions;
        draft.updatedAt = Date.now();
        break;
      }

      // -----------------------------------------------------------------------
      // Outcomes — hub-resident real mutations
      // -----------------------------------------------------------------------

      case 'OUTCOME_ADD': {
        if (action.hubId !== draft.id) {
          // Loud failure: hub-of-one constraint — foreign outcomes must never arrive.
          throw new Error(`OUTCOME_ADD hubId mismatch: expected ${draft.id}, got ${action.hubId}`);
        }
        if (!draft.outcomes) {
          draft.outcomes = [];
        }
        draft.outcomes.push(action.outcome);
        break;
      }

      case 'OUTCOME_UPDATE': {
        const outcome = draft.outcomes?.find(o => o.id === action.outcomeId);
        if (!outcome) break; // no-op per Immer recipe pattern
        Object.assign(outcome, action.patch);
        break;
      }

      case 'OUTCOME_ARCHIVE': {
        const outcome = draft.outcomes?.find(o => o.id === action.outcomeId);
        if (!outcome || outcome.deletedAt !== null) break; // idempotent
        outcome.deletedAt = Date.now();
        // outcome has no cascadesTo descendants (cascadeRules.outcome.cascadesTo === [])
        break;
      }

      // -----------------------------------------------------------------------
      // Investigations — PWA blob does not persist investigations today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'INVESTIGATION_CREATE': {
        // PWA blob does not persist investigations today; F3 normalizes.
        break;
      }

      case 'INVESTIGATION_UPDATE_METADATA': {
        // PWA blob does not persist investigations today; F3 normalizes.
        break;
      }

      case 'INVESTIGATION_ARCHIVE': {
        // PWA blob does not persist investigations today; F3 normalizes.
        archiveInvestigationInDraft(draft, action.investigationId);
        break;
      }

      // -----------------------------------------------------------------------
      // Findings — PWA blob does not persist findings today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'FINDING_ADD': {
        // PWA blob does not persist findings today; F3 normalizes.
        break;
      }

      case 'FINDING_UPDATE': {
        // PWA blob does not persist findings today; F3 normalizes.
        break;
      }

      case 'FINDING_ARCHIVE': {
        // PWA blob does not persist findings today; F3 normalizes.
        archiveFindingInDraft(draft, action.findingId);
        break;
      }

      // -----------------------------------------------------------------------
      // Questions — PWA blob does not persist questions today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'QUESTION_ADD': {
        // PWA blob does not persist questions today; F3 normalizes.
        break;
      }

      case 'QUESTION_UPDATE': {
        // PWA blob does not persist questions today; F3 normalizes.
        break;
      }

      case 'QUESTION_ARCHIVE': {
        // PWA blob does not persist questions today; F3 normalizes.
        archiveQuestionInDraft(draft, action.questionId);
        break;
      }

      // -----------------------------------------------------------------------
      // Causal links — PWA blob does not persist causalLinks today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'CAUSAL_LINK_ADD': {
        // PWA blob does not persist causalLinks today; F3 normalizes.
        break;
      }

      case 'CAUSAL_LINK_UPDATE': {
        // PWA blob does not persist causalLinks today; F3 normalizes.
        break;
      }

      case 'CAUSAL_LINK_ARCHIVE': {
        // PWA blob does not persist causalLinks today; F3 normalizes.
        archiveCausalLinkInDraft(draft, action.linkId);
        break;
      }

      // -----------------------------------------------------------------------
      // Suspected causes — PWA blob does not persist suspectedCauses today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'SUSPECTED_CAUSE_ADD': {
        // PWA blob does not persist suspectedCauses today; F3 normalizes.
        break;
      }

      case 'SUSPECTED_CAUSE_UPDATE': {
        // PWA blob does not persist suspectedCauses today; F3 normalizes.
        break;
      }

      case 'SUSPECTED_CAUSE_ARCHIVE': {
        // PWA blob does not persist suspectedCauses today; F3 normalizes.
        archiveSuspectedCauseInDraft(draft, action.causeId);
        break;
      }

      // -----------------------------------------------------------------------
      // Evidence snapshots — PWA blob does not persist evidenceSnapshots today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'EVIDENCE_ADD_SNAPSHOT': {
        // PWA blob does not persist evidenceSnapshots today; F3 normalizes.
        break;
      }

      case 'EVIDENCE_ARCHIVE_SNAPSHOT': {
        // PWA blob does not persist evidenceSnapshots today; F3 normalizes.
        break;
      }

      // -----------------------------------------------------------------------
      // Evidence sources — PWA blob does not persist evidenceSources today; F3 normalizes.
      // -----------------------------------------------------------------------

      case 'EVIDENCE_SOURCE_ADD': {
        // PWA blob does not persist evidenceSources today; F3 normalizes.
        break;
      }

      case 'EVIDENCE_SOURCE_UPDATE_CURSOR': {
        // PWA blob does not persist evidenceSourceCursors today; F3 normalizes.
        break;
      }

      case 'EVIDENCE_SOURCE_REMOVE': {
        // PWA blob does not persist evidenceSources today; F3 normalizes.
        break;
      }

      // -----------------------------------------------------------------------
      // Canvas actions — no-ops: canvasStore is the canonical mutation surface.
      // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT
      // carrying the assembled canonicalProcessMap. F3 may revisit.
      // -----------------------------------------------------------------------

      case 'PLACE_CHIP_ON_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'UNASSIGN_CHIP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'REORDER_CHIP_IN_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'ADD_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'REMOVE_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'RENAME_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'CONNECT_STEPS': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'DISCONNECT_STEPS': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'GROUP_INTO_SUB_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      case 'UNGROUP_SUB_STEP': {
        // Canvas mutations live in canvasStore; PWA persists via HUB_PERSIST_SNAPSHOT.
        break;
      }

      default:
        assertNever(action);
    }
  });
}
