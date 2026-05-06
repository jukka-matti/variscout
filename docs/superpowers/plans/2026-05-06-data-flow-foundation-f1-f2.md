---
title: Data-Flow Foundation F1+F2 Implementation Plan — type-level normalization + repository pattern
audience: [engineer]
category: implementation
status: active
last-reviewed: 2026-05-06
related:
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/decision-log.md
---

# Data-Flow Foundation F1+F2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Sonnet for implementer + spec/quality reviewer roles (≥70% of dispatches); Opus only for the final-branch code review and any task explicitly tagged `[OPUS]`.**

**Goal:** Land the foundational layer of the data-flow refactor — every entity has identity + lifecycle fields; every persistence call goes through a `HubRepository.dispatch(action)` interface; PWA + Azure each get a repository implementation that wraps existing storage; all stores migrate off direct-Dexie/blob calls; an ESLint guard prevents regression. After F1+F2, the codebase has the repository abstraction in place but persistence is still backed by today's storage shapes — F3 (PR7) swaps the PWA backend to normalized Dexie tables without changing any store-layer code.

**Architecture:** One branch (`data-flow-foundation-f1-f2`), three sequenced PRs. **PR1** lands type-level changes in `@variscout/core` (`EntityBase`, typed FK fields, `HubAction` discriminated union, `HubRepository` interface, cascade ruleset) — pure-types + tests + fixture updates, no runtime change. **PR2** lands `PwaHubRepository` implementation + PWA store migration off direct-Dexie calls. **PR3** lands `AzureHubRepository` + Azure store migration + ESLint guard. Each PR builds independently (compile-clean + tests green); each ships under one squash-merge to main; the branch advances through all three before the foundation is complete.

**Tech Stack:** TypeScript (`@variscout/core` pure-TS, repository implementations in app packages), Vitest + React Testing Library, Zustand (existing 5 domain + 1 feature store), Dexie (existing PWA + Azure backends — F1+F2 keeps them intact, F3 swaps PWA's), Immer (existing in stores; action handlers may use it inside repositories). No new runtime dependencies.

---

## Context

[Foundation spec](../specs/2026-05-06-data-flow-foundation-design.md) commits to F1–F6 sequence. **F1+F2 is the abstraction-only foundation:**

- **F1** — type-level normalization. Every entity gets `id: string`, `createdAt: number`, `deletedAt: number | null` plus typed FK fields. Pure-type change to `@variscout/core`. Consumers refactor in same PR (per `feedback_no_backcompat_clean_architecture`).
- **F2** — repository interfaces + first implementations. `HubRepository.dispatch(action: HubAction)` becomes the only write path. PWA + Azure each ship a `*HubRepository` class that initially delegates to today's storage; F3 swaps PWA's backend to normalized Dexie tables without changing the repository surface.

**Out of scope for this plan (deferred to F3+):**

- PWA Dexie schema cutover to normalized tables (F3 = PR7).
- Ingestion action-layer unification (F3.5).
- Three-layer state codification (F4).
- Action-log persistence + replay (F5).
- Multi-investigation lifecycle (F6, named-future).

**Pre-production invariant.** No backward-compatibility shims (per `feedback_no_backcompat_clean_architecture`). Existing PWA dev hubs and Azure dev tenant data persist unchanged across F1+F2 (the repository implementations route writes to current storage); they are wiped at F3 deploy. `.vrs` v1.0 files remain readable across F1+F2 (the read/write codepath inside the repository preserves the current envelope shape until F3 bumps to v1.1).

All file paths and type signatures below are verified against commit `e1352c16`.

---

## Audit revisions (2026-05-06, post-P0)

P0 audit ([`docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md`](2026-05-06-data-flow-foundation-f1-f2-audit.md)) surfaced 15 grounding gaps. The following decisions update the plan in place; original wording elsewhere stands EXCEPT where contradicted here:

- **R1. `createdAt` atomic-converts to `number` (Unix ms) across all entities.** Audit found ~70% of entities use ISO-8601 strings (`Question`, `SuspectedCause`, `CausalLink`, `EvidenceSource`, `ProcessHub`, `SustainmentRecord`, `ImprovementIdea`, `EvidenceSnapshot.capturedAt/importedAt`, `ImprovementIdea`, `createInvestigationCategory` missing entirely); ~30% use `Date.now()` numbers (`Finding`, `ActionItem`, `FindingComment`, `PhotoAttachment`, `CommentAttachment`). Per `feedback_no_backcompat_clean_architecture`, no `string | number` loose union; convert atomically. Half-the-codebase diff multiplier flagged in risk register.
- **R2. `HubAction` discriminator is `kind` with SCREAMING_SNAKE_CASE payloads** (matching the existing canvas convention at `packages/core/src/canvas/types.ts`), NOT `type` with `'domain/verb'` lowercase. Original plan code samples showed `{ type: 'evidence/addSnapshot' }`; replace with `{ kind: 'EVIDENCE_ADD_SNAPSHOT' }`. Same for all action types. Avoids cross-team naming churn.
- **R3. `SustainmentRecord.tombstoneAt` renames to `deletedAt`** atomically. Already semantically equivalent to soft-delete (Phase 6 shipped this). One pass across `packages/core/src/sustainment.ts` + Azure consumers (`SustainmentRecordEditor.tsx`, `SustainmentReviewLogger.tsx`, `Editor.sustainment.tsx`, `services/storage.ts`, `services/localDb.ts`).
- **R4. `EvidenceSourceCursor` relocates from `apps/azure/src/db/schema.ts` to `packages/core/src/evidenceSources.ts`** as part of F1. Honors ADR-078 D2 (state shapes tier-agnostic). Azure schema imports from core; PWA can use the same type when F3 adds the table.
- **R5. `CausalLink` actual FK shape (corrects original P1.4 prescription).** Today: `hubId?: string` references `SuspectedCause['id']` (misleading name); `questionIds: string[]` references `Question['id'][]`; `findingIds: string[]` references `Finding['id'][]`; `fromFactor`/`toFactor`/`fromLevel`/`toLevel` are column-name strings (NOT entity FKs). F1 P1.4 renames `hubId` → `suspectedCauseId` AND retypes the array fields with the proper entity types. The originally-prescribed `fromFindingId`/`toCauseId` fields **do not exist**; do not invent them.
- **R6. `ProcessMap` itself does NOT extend `EntityBase`** (per spec D3 `canvasState: '&hubId'` 1:1 schema). Only embedded entities — `ProcessMapNode`, `ProcessMapTributary`, `ProcessMapArrow`, `ProcessMapHunch` — get typed FKs (already have ids). P1.5 task scope reduces accordingly.
- **R7. `OutcomeSpec` gets a surrogate `id` (it has none today; uses `columnName` natural key).** F1 P1.2 introduces `id` + `hubId: ProcessHub['id']` typed FK; sweeps every fixture + test that constructs `outcomes: OutcomeSpec[]` arrays.
- **R8. `RowProvenanceTag` shape change is substantive.** Today: `{ source, joinKey }` only, held in a sidecar `Map<rowKey, tag>`. F1 adds `id`, `createdAt`, `deletedAt`, `snapshotId: EvidenceSnapshot['id']` FK, AND a row identifier (`rowKey: string` literal of the row's join-key value). Substantively changes ADR-077 D6 surface — call it out in P1.3 + the spec D6 reference.
- **R9. New P1 task — Sustainment + ControlHandoff get `EntityBase`.** Audit found `SustainmentRecord`, `SustainmentReview`, `ControlHandoff` were not in original P1 enumeration. They are hub-domain entities and Phase-6-shipped; add P1.4b covering them. Includes the R3 `tombstoneAt` rename.
- **R10. P4 + P6 re-scope to UI/app files, NOT store files.** Audit found `packages/stores/src/{projectStore,investigationStore,improvementStore}.ts` make ZERO Dexie calls today — persistence is at composition layer (PWA: `App.tsx`, `SaveToBrowserButton.tsx`; Azure: `Dashboard.tsx`, `Editor.tsx`, `useNewHubProvision.ts`, `ProcessHubEvidencePanel.tsx`, sustainment editors, etc.). Migration target is the app/UI layer. Smaller diff than the plan originally implied.
- **R11. `D-P3` extends to a second `Math.random` `generateId` at `apps/azure/src/lib/persistence.ts:26`.** Sweep both. Pre-production = no migration concern.
- **R12. `wallLayoutStore` whitelisted in P7.2 ESLint rule** — it imports `dexie` and operates a separate `WallLayoutDB` (`variscout-wall-layout`) per existing UI-state-separation pattern. Whitelist is the lowest-disruption choice; extraction to apps/persistence/ is a future cleanup if warranted.
- **R13. Project-level types explicitly out of scope.** `ProjectRecord`, `SyncItem`, `SyncStateRecord`, `SavedProject`, `ProjectMetadata` stay outside F1+F2. ESLint guard at P7.2 must allow `apps/azure/src/lib/persistence.ts`, `apps/azure/src/services/cloudSync.ts`, and `apps/azure/src/services/storage.ts` (project-level overlay) to keep using Dexie directly.
- **R14. `addHubComment` network-fetch in `investigationStore.ts:953` stays outside dispatch** — it's optimistic-update IO, not persistence. Document as deliberate exception in store CLAUDE.md.
- **R15. `canvasStore.ts` consolidation is a breaking-rename.** Today: per-action methods (`placeChipOnStep(...)`, `addStep(...)`) on the store; action union exists in `packages/core/src/canvas/types.ts` but isn't dispatched. F2 P4.5 introduces dispatch entry; method-per-action API stays as a thin wrapper for transitional consumers within PR2, then is removed in PR3 cleanup (per `feedback_no_backcompat_clean_architecture`).

---

## PR boundaries

The branch `data-flow-foundation-f1-f2` advances through three squash-merged PRs:

### PR1 — Types + interfaces in `@variscout/core` (compile-clean change)

Phases **P0 + P1 + P2**. Pure-types change to `@variscout/core`; consumer fixes for type errors across the monorepo. No runtime behavior change. Reviewable by reading `packages/core/` diffs + the type-error-induced fixes elsewhere. Tests pass.

### PR2 — PWA repository + store migration

Phases **P3 + P4**. New `apps/pwa/src/persistence/PwaHubRepository.ts`; PWA stores migrate off direct `hubRepository.saveHub()` calls onto `repo.dispatch(action)`. Existing UI behavior unchanged. Tests + manual `--chrome` walk green.

### PR3 — Azure repository + store migration + ESLint guard

Phases **P5 + P6 + P7 + P8**. `apps/azure/src/persistence/AzureHubRepository.ts`; Azure stores migrate; ESLint rule (`no-restricted-imports` blocking `dexie` outside `apps/*/src/persistence/`); final Opus code review of the full F1+F2 surface. Tests + manual `--chrome` walk green.

Each PR runs `bash scripts/pr-ready-check.sh` before merge.

---

## Locked decisions (this plan — D-P1 through D-P6)

### D-P1. Single `HubRepository` interface per app; reads grouped on the same class; writes via central `dispatch(action)`

Sub-repositories are NOT separate interfaces (the spec's mention of `InvestigationRepository`, `EvidenceSnapshotRepository` referred to grouped read APIs, not parallel write surfaces). Shape:

```ts
// packages/core/src/persistence/HubRepository.ts
export interface HubRepository {
  // Single write path
  dispatch(action: HubAction): Promise<void>;

  // Grouped read APIs (extension point — F3 fills these in;
  // F1+F2 may pass through to existing storage)
  hubs: HubReadAPI;
  outcomes: OutcomeReadAPI;
  evidenceSnapshots: EvidenceSnapshotReadAPI;
  evidenceSources: EvidenceSourceReadAPI;
  investigations: InvestigationReadAPI;
  findings: FindingReadAPI;
  questions: QuestionReadAPI;
  causalLinks: CausalLinkReadAPI;
  suspectedCauses: SuspectedCauseReadAPI;
  canvasState: CanvasStateReadAPI;
}

export interface HubReadAPI {
  get(id: string): Promise<ProcessHub | undefined>;
  list(): Promise<ProcessHub[]>;
}
// ... one ReadAPI per entity
```

**Why:** one write surface = one mental model + one place to enforce cascade rules + one CRDT-replay target. Grouped reads keep the call site readable (`repo.evidenceSnapshots.list()` reads better than `repo.listEvidenceSnapshots()`).

### D-P2. F1+F2 repositories DELEGATE to existing storage; do not normalize

`PwaHubRepository.dispatch({ type: 'evidence/addSnapshot', ... })` reads the current hub blob, applies the action via Immer, calls existing `hubRepository.saveHub(updatedHub)`. Same pattern for Azure but writing to today's tables. **No schema changes in F1+F2.** Per-action handlers are essentially "Immer recipes that previously lived inline in stores, now centralized in the repository."

**Why:** keeps the diff bounded. The point of F1+F2 is the abstraction layer; persistence shape change is F3. Splitting them means each PR is independently reviewable and reversible.

**How to apply:** every action handler in P3 + P5 is `async (action) => { const hub = await this.currentHub(); const next = produce(hub, draft => { /* apply action */ }); await this.persistHub(next); }`. F3 replaces `persistHub` with normalized table writes.

### D-P3. ULID via `crypto.randomUUID()`; rename `generateId` → `generateDeterministicId`; remove `Math.random` fallback (sweeps BOTH instances)

Existing `packages/core/src/findings/factories.ts:24` `generateId()` has a `Math.random` fallback that violates `packages/core/CLAUDE.md`'s "never use Math.random" hard rule. **Audit (R11) found a second `generateId` at `apps/azure/src/lib/persistence.ts:26` with the same `Math.random` fallback** (used for `SavedProject.id`). P1 fixes BOTH at the seam (per `feedback_fix_absorbed_violations_at_seam`):

```ts
// packages/core/src/identity.ts (new)
export function generateDeterministicId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  throw new Error('crypto.randomUUID unavailable; cannot generate deterministic ID');
}
```

`findings/factories.ts` re-exports from `identity.ts` for backward import-path compat within the same PR (then call sites get migrated). All entity-creation factories (Question, Finding, etc.) call `generateDeterministicId()`.

**Why:** `crypto.randomUUID()` is universally available in modern browsers + Node 19+. The fallback was dead-code defensive programming that smuggled `Math.random` past the rule.

**How to apply:** P1.1 ships the new identity module; P1.\* entity updates use it for all `id` defaults. Test fixtures provide fixed IDs explicitly (don't call `generateDeterministicId` in test setup — provide deterministic strings like `'finding-001'`).

### D-P4. Action union lives in `packages/core/src/actions/HubAction.ts`; cascade rules in `packages/core/src/persistence/cascadeRules.ts`

Two new sub-paths in `@variscout/core`:

```ts
// packages/core/src/actions/HubAction.ts
export type HubAction =
  | OutcomeAction
  | EvidenceAction
  | EvidenceSourceAction
  | InvestigationAction
  | FindingAction
  | QuestionAction
  | CausalLinkAction
  | SuspectedCauseAction
  | HubMetaAction // updateGoal, updatePrimaryScopeDimensions, etc.
  | CanvasAction; // existing canvas migration shape, integrated here
```

Each sub-union defined in its own file under `packages/core/src/actions/` (e.g., `outcomeActions.ts`, `evidenceActions.ts`). Re-exported from `actions/index.ts`. Sub-path export added to `packages/core/package.json`.

```ts
// packages/core/src/persistence/cascadeRules.ts
export const cascadeRules = {
  hub: {
    cascadesTo: ['outcome', 'evidenceSnapshot', 'evidenceSource', 'investigation', 'canvasState'],
  },
  investigation: { cascadesTo: ['finding', 'question', 'causalLink', 'suspectedCause'] },
  evidenceSnapshot: { cascadesTo: ['rowProvenance'] },
  // ...
} as const satisfies CascadeRuleset;
```

**Why:** isolates the action surface in one place; cascade rules are data, not code (testable, auditable, queryable).

**How to apply:** P2 ships actions/ + persistence/ sub-paths; P3 + P5 consume them.

### D-P5. Repository interface in `packages/core/src/persistence/HubRepository.ts`; implementations per app at `apps/<app>/src/persistence/`

```
packages/core/src/persistence/
  HubRepository.ts            # interface
  cascadeRules.ts             # data
  index.ts                    # barrel

apps/pwa/src/persistence/
  PwaHubRepository.ts         # implements HubRepository
  __tests__/
    PwaHubRepository.test.ts

apps/azure/src/persistence/
  AzureHubRepository.ts       # implements HubRepository
  __tests__/
    AzureHubRepository.test.ts
```

Stores import from `@variscout/core/persistence` for the interface; from app-local `persistence/` only at the composition root (where the app instantiates its repository and provides it via dependency injection or a module-scoped singleton).

**Why:** keeps `@variscout/core` pure-TS; app-specific persistence stays in the app boundary; ADR-078 D2 contract is in core, implementations are tier-gated.

**How to apply:** P2 + P3 + P5 follow this layout. Composition root choice (singleton vs DI) decided in P3.1.

### D-P6. All entities get `id` + `createdAt` + `deletedAt` from day one; consumers refactor atomically

Per `feedback_no_backcompat_clean_architecture`. Optional fields are not added; fields are required. Existing test fixtures + seed data + entity factories update in the same PR (PR1) as the type changes.

**Why:** pre-production state means we're not migrating real users; fields can be required. Optional-with-fallback hedging is exactly the optionality pollution that rule prevents.

**How to apply:** P1.\* tasks add the fields entity-by-entity and propagate the type change through fixtures + seed data + factories in the same task. Tests stay green per task.

---

## File structure

### Created

| Path                                                                    | Phase | Responsibility                                                                                                |
| ----------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/identity.ts`                                         | P1.1  | `generateDeterministicId()` + `EntityBase` interface                                                          |
| `packages/core/src/identity.test.ts`                                    | P1.1  | Coverage for ID uniqueness + crypto-only path                                                                 |
| `packages/core/src/actions/HubAction.ts`                                | P2.1  | Top-level `HubAction` discriminated union + barrel                                                            |
| `packages/core/src/actions/outcomeActions.ts`                           | P2.1  | `OutcomeAction` (add/update/archive)                                                                          |
| `packages/core/src/actions/evidenceActions.ts`                          | P2.1  | `EvidenceAction` (addSnapshot, archiveSnapshot)                                                               |
| `packages/core/src/actions/evidenceSourceActions.ts`                    | P2.1  | `EvidenceSourceAction` (add, updateCursor, remove)                                                            |
| `packages/core/src/actions/investigationActions.ts`                     | P2.1  | `InvestigationAction` (create, updateMetadata, archive)                                                       |
| `packages/core/src/actions/findingActions.ts`                           | P2.1  | `FindingAction` (add, update, archive)                                                                        |
| `packages/core/src/actions/questionActions.ts`                          | P2.1  | `QuestionAction` (add, update, archive)                                                                       |
| `packages/core/src/actions/causalLinkActions.ts`                        | P2.1  | `CausalLinkAction` (add, update, archive)                                                                     |
| `packages/core/src/actions/suspectedCauseActions.ts`                    | P2.1  | `SuspectedCauseAction` (add, update, archive)                                                                 |
| `packages/core/src/actions/hubMetaActions.ts`                           | P2.1  | `HubMetaAction` (updateGoal, updatePrimaryScopeDimensions, …)                                                 |
| `packages/core/src/actions/canvasActions.ts`                            | P2.1  | `CanvasAction` (re-export / consolidate from existing canvas migration shape)                                 |
| `packages/core/src/actions/index.ts`                                    | P2.1  | Barrel re-exporting all sub-unions + `HubAction`                                                              |
| `packages/core/src/actions/__tests__/exhaustiveness.test.ts`            | P2.2  | Type-level exhaustiveness check via `assertNever` switch                                                      |
| `packages/core/src/persistence/HubRepository.ts`                        | P2.3  | `HubRepository` interface + read-API interfaces                                                               |
| `packages/core/src/persistence/cascadeRules.ts`                         | P2.4  | `cascadeRules` ruleset + `CascadeRuleset` type                                                                |
| `packages/core/src/persistence/__tests__/cascadeRules.test.ts`          | P2.4  | Ruleset shape + transitive-closure helper coverage                                                            |
| `packages/core/src/persistence/index.ts`                                | P2.5  | Barrel                                                                                                        |
| `apps/pwa/src/persistence/PwaHubRepository.ts`                          | P3.1  | `class PwaHubRepository implements HubRepository`                                                             |
| `apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts`           | P3.\* | Per-action coverage + cascade behavior                                                                        |
| `apps/pwa/src/persistence/index.ts`                                     | P3.1  | Barrel + module-scoped singleton                                                                              |
| `apps/azure/src/persistence/AzureHubRepository.ts`                      | P5.1  | `class AzureHubRepository implements HubRepository`                                                           |
| `apps/azure/src/persistence/__tests__/AzureHubRepository.test.ts`       | P5.\* | Per-action coverage + cascade behavior                                                                        |
| `apps/azure/src/persistence/index.ts`                                   | P5.1  | Barrel + module-scoped singleton                                                                              |
| `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md` | P0    | Output of audit phase — list of every entity + every persistence call site + every store touching persistence |

### Modified — `@variscout/core` types (PR1, P1.\*)

Each modification adds `id` + `createdAt` + `deletedAt` to the named entity, plus typed FK fields where the entity references others. Existing factories update to call `generateDeterministicId()`; test fixtures provide explicit IDs.

| Path                                                                                                                                                               | Phase              | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/processHub.ts`                                                                                                                                  | P1.2               | `ProcessHub` (verify `id` exists, convert `createdAt: string` → `number` per R1, add `deletedAt`), `OutcomeSpec` (add surrogate `id` per R7 + `hubId: ProcessHub['id']` typed FK + EntityBase; sweep every fixture constructing `outcomes: OutcomeSpec[]`), `ProcessHubInvestigation` (add `createdAt`+`deletedAt`; existing `modified: string` ISO is `updatedAt`-equivalent — convert to number), `ProcessHubInvestigation.metadata` already has `scopeFilter` + `paretoGroupBy` (slice 4) — no change                                                                                                                                                                                                                                                                                                                                                                          |
| `packages/core/src/__tests__/processHub.test.ts`                                                                                                                   | P1.2               | Update fixtures with `createdAt`+`deletedAt` numbers + outcome `id`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `packages/core/src/findings/types.ts`                                                                                                                              | P1.5               | `Finding` (already has `createdAt: number`; add `deletedAt`, add `investigationId: ProcessHubInvestigation['id']` FK), `Question` (convert `createdAt: string` → `number`; add `deletedAt`, `investigationId` FK; retype `parentId?: Question['id']`, `linkedFindingIds: Finding['id'][]`), `CausalLink` (convert `createdAt`; add `deletedAt`; **per R5: rename `hubId?: string` → `suspectedCauseId?: SuspectedCause['id']`**, retype `questionIds: Question['id'][]`, `findingIds: Finding['id'][]`; `from*`/`to*` factor/level fields are column-name strings, NOT entity FKs — leave shape untouched), `SuspectedCause` (convert `createdAt`; add `deletedAt`; add `investigationId` FK; retype string-array FKs to typed entity arrays). Plus `ActionItem`, `FindingComment`, `PhotoAttachment`, `CommentAttachment`, `ImprovementIdea`, `InvestigationCategory` per R1+R9. |
| `packages/core/src/findings/factories.ts`                                                                                                                          | P1.5               | All `create*` set `createdAt: Date.now()` (number), `deletedAt: null`, use `generateDeterministicId()`. Per R14 audit fix: `createInvestigationCategory` newly sets `createdAt`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `packages/core/src/findings/__tests__/factories.test.ts`                                                                                                           | P1.5               | Fixture updates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `packages/core/src/evidenceSources.ts`                                                                                                                             | P1.4               | `EvidenceSource` (convert `createdAt: string` → `number`; add `deletedAt`; retype `hubId: ProcessHub['id']`); `EvidenceSnapshot` (convert `capturedAt`/`importedAt` → `number`, add `deletedAt`, retype `hubId`/`sourceId` FKs); `RowProvenanceTag` per R8 — substantive shape change adding `id`, `createdAt`, `deletedAt`, `snapshotId: EvidenceSnapshot['id']` FK, `rowKey: string` row-identifier; coordinate with ADR-077 D6. **Per R4: NEW `EvidenceSourceCursor` type relocates here from `apps/azure/src/db/schema.ts`** with EntityBase + typed FKs                                                                                                                                                                                                                                                                                                                      |
| `apps/azure/src/db/schema.ts`                                                                                                                                      | P1.4               | Remove local `EvidenceSourceCursor` declaration; import from `@variscout/core/evidenceSources` per R4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `packages/core/src/matchSummary/__tests__/*.test.ts`                                                                                                               | P1.4               | Fixture updates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `packages/core/src/sustainment.ts`                                                                                                                                 | P1.4b (NEW per R9) | `SustainmentRecord` (rename `tombstoneAt` → `deletedAt` per R3; add `id`-already-exists, retype `investigationId: ProcessHubInvestigation['id']`, `hubId: ProcessHub['id']`, `controlHandoffId?: ControlHandoff['id']`, `latestReviewId?: SustainmentReview['id']`); `SustainmentReview` (add `deletedAt`, retype FKs); `ControlHandoff` (add `deletedAt`, retype FKs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `apps/azure/src/components/SustainmentRecordEditor.tsx` + `SustainmentReviewLogger.tsx` + `Editor.sustainment.tsx` + `services/storage.ts` + `services/localDb.ts` | P1.4b              | Sweep `tombstoneAt` references → `deletedAt` per R3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `packages/core/src/frame/types.ts`                                                                                                                                 | P1.5               | Per R6: `ProcessMap` itself does NOT extend `EntityBase` (per spec D3 1:1 schema); embedded entities `ProcessMapNode`, `ProcessMapTributary`, `ProcessMapArrow`, `ProcessMapHunch` already have `id` — add typed FKs only (`parentStepId?: ProcessMapNode['id']`, `tributaryId?: ProcessMapTributary['id']`, `fromStepId/toStepId: ProcessMapNode['id']`, `stepId: ProcessMapNode['id']`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `packages/core/src/index.ts`                                                                                                                                       | P1.1, P2.5         | Re-export `EntityBase`, `generateDeterministicId`, `HubAction`, `HubRepository`, `cascadeRules` from new sub-paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `packages/core/package.json`                                                                                                                                       | P1.1, P2.1, P2.3   | Add `./identity`, `./actions`, `./persistence` to `exports` field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `packages/core/tsconfig.json`                                                                                                                                      | P1.1, P2.1, P2.3   | Add path mappings if internal imports use `@variscout/core/*` (verify)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `packages/core/src/findings/factories.ts`                                                                                                                          | P1.1               | `generateId` deprecates → re-export from `identity.ts`; remove `Math.random` fallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Modified — PWA persistence + UI/app composition (PR2, P3+P4 — re-scoped per R10)

Per R10: domain stores in `packages/stores/src/` make ZERO Dexie calls today; the persistence calls live in PWA app/UI files. The migration target is the composition layer. Domain stores stay clean (still no persistence imports); the dispatch boundary lives at the app/UI composition root.

| Path                                                             | Phase          | Action                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/pwa/src/db/hubRepository.ts`                               | P3.1           | Becomes the _PWA-internal_ Dexie helper; no behavior change. `PwaHubRepository` wraps it.                                                                                                                                                                               |
| `apps/pwa/src/components/SaveToBrowserButton.tsx`                | P4.1           | Replace `hubRepository.saveHub(currentHub)` (lines 21,36) with `pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: currentHub })` (or `dispatch` per resolved action shape — see R2). `getOptInFlag` / `setOptInFlag` stay (meta dispatch or special-case). |
| `apps/pwa/src/App.tsx`                                           | P4.2           | Lines 162-164: replace `hubRepository.getOptInFlag()` + `hubRepository.loadHub()` with `pwaHubRepository.hubs.get('hub-of-one')` + repo opt-in API. Lines elsewhere: instantiate `PwaHubRepository` at composition root.                                                |
| `apps/pwa/src/hooks/usePasteImportFlow.ts` (verify)              | P4.3           | If paste-flow inlines persistence, route through `dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })`                                                                                                                                                                     |
| `packages/stores/src/canvasStore.ts`                             | P4.5 (per R15) | Add `dispatch(action: HubAction)` entry that delegates to existing per-action methods. Method-per-action API stays as transitional wrapper for PR2; removed in PR3 cleanup. Existing immer + undoable behavior preserved.                                               |
| `packages/stores/CLAUDE.md`                                      | P4.6           | Document: domain stores stay persistence-free; dispatch boundary lives at app/UI composition root. R14 exception: `addHubComment` network IO stays in store (not persistence; deliberate).                                                                              |
| `apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx` | P4.\*          | Update tests to mock `pwaHubRepository.dispatch` instead of `hubRepository.saveHub`                                                                                                                                                                                     |
| `apps/pwa/src/__tests__/...`                                     | P4.7           | App-level smoke tests still green                                                                                                                                                                                                                                       |

### Modified — Azure persistence + UI/app composition (PR3, P5+P6 — re-scoped per R10)

Per R10: same as PWA — Azure persistence calls are in UI/app code, not store files. Migration target is the composition layer. Azure has more call sites + per-table writes (vs PWA's blob), so PR3 is larger than PR2.

| Path                                                                                                                                                                                                 | Phase | Action                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/azure/src/db/schema.ts`                                                                                                                                                                        | P5.1  | No schema change in F1+F2 (F3 normalizes PWA only; Azure already has tables). Per R4: remove local `EvidenceSourceCursor` decl, import from core (already covered in P1.4).                                                                                                                       |
| `apps/azure/src/services/storage.ts` (lines 547-733+)                                                                                                                                                | P5.1  | Wrap `saveProcessHubToIndexedDB`, `saveEvidenceSourceToIndexedDB`, `saveEvidenceSnapshotToIndexedDB`, `saveSustainmentRecord*`, `saveSustainmentReview*` etc. inside `AzureHubRepository.dispatch` action handlers. Existing exports preserve as legacy paths during PR3; deleted in PR3 cleanup. |
| `apps/azure/src/services/localDb.ts`                                                                                                                                                                 | P5.1  | Same — wrap per-table writes inside repository dispatch handlers.                                                                                                                                                                                                                                 |
| `apps/azure/src/components/ProcessHubEvidencePanel.tsx` (lines 150,194,318,331)                                                                                                                      | P6.1  | Replace `saveEvidenceSource` / `saveEvidenceSnapshot` UI calls with `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` etc.                                                                                                                                                    |
| `apps/azure/src/components/SustainmentRecordEditor.tsx` (line 99)                                                                                                                                    | P6.2  | Replace `storage.saveSustainmentRecord(record)` with dispatch                                                                                                                                                                                                                                     |
| `apps/azure/src/components/SustainmentReviewLogger.tsx` (lines 62,81)                                                                                                                                | P6.2  | Replace with dispatch                                                                                                                                                                                                                                                                             |
| `apps/azure/src/components/ControlHandoffEditor.tsx` (line 88)                                                                                                                                       | P6.2  | Replace with dispatch                                                                                                                                                                                                                                                                             |
| `apps/azure/src/features/hubCreation/useNewHubProvision.ts` (line 48)                                                                                                                                | P6.3  | Replace `saveProcessHub(hub)` with dispatch                                                                                                                                                                                                                                                       |
| `apps/azure/src/pages/Dashboard.tsx` (lines 606,627)                                                                                                                                                 | P6.3  | Replace `saveProcessHub(updated)` (CpkTarget editor + reviewSignal cascade) with dispatch                                                                                                                                                                                                         |
| `apps/azure/src/pages/Editor.tsx` (line 1335)                                                                                                                                                        | P6.3  | Replace `saveProcessHub({...})` with dispatch                                                                                                                                                                                                                                                     |
| `apps/azure/src/features/evidenceSources/useEvidenceSourceSync.ts` (lines 43,67)                                                                                                                     | P6.4  | Replace `db.evidenceSourceCursors.get/put` with dispatch (cursor read/write surface lives on repository per R4)                                                                                                                                                                                   |
| `apps/azure/src/App.tsx`                                                                                                                                                                             | P5.1  | Instantiate `AzureHubRepository` at composition root                                                                                                                                                                                                                                              |
| **Out of scope per R13:** `apps/azure/src/lib/persistence.ts` (`db.projects` ops), `apps/azure/src/services/cloudSync.ts` (sync overlay), `apps/azure/src/db/schema.ts:146-165` (`db.syncQueue` ops) | —     | Project-level + sync-overlay persistence stays direct-Dexie. ESLint rule (P7.2) whitelists.                                                                                                                                                                                                       |

### Modified — guardrails (PR3, P7)

| Path                                   | Phase | Action                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/stores/CLAUDE.md`            | P7.1  | Document the rule: domain stores stay persistence-free; dispatch boundary lives at app/UI composition root. Per R12: `wallLayoutStore.ts` is exempt (separate `WallLayoutDB` for UI-state separation). Per R14: `addHubComment` network IO stays in store (deliberate).                                                                                                                                                                        |
| `apps/pwa/CLAUDE.md`                   | P7.1  | Persistence access via `pwaHubRepository.dispatch(action)` only (composition root setup)                                                                                                                                                                                                                                                                                                                                                       |
| `apps/azure/CLAUDE.md`                 | P7.1  | Same; per R13 `lib/persistence.ts`/`services/cloudSync.ts` project-overlay paths excepted                                                                                                                                                                                                                                                                                                                                                      |
| `eslint.config.js` (root, verify path) | P7.2  | Add `no-restricted-imports` rule blocking `dexie` outside the explicit allow-list. Allow-list per R12+R13: `apps/pwa/src/db/**`, `apps/pwa/src/persistence/**`, `apps/azure/src/db/**`, `apps/azure/src/persistence/**`, `apps/azure/src/services/storage.ts`, `apps/azure/src/services/localDb.ts`, `apps/azure/src/services/cloudSync.ts`, `apps/azure/src/lib/persistence.ts`, `packages/stores/src/wallLayoutStore.ts`. Test files exempt. |
| `scripts/pr-ready-check.sh`            | P7.3  | Verify ESLint runs the new rule; no script change if `pnpm lint` already covers it                                                                                                                                                                                                                                                                                                                                                             |

---

## F1+F2 SHIPPED 2026-05-06 — Session 3 closeout

**Spec status:** active → **delivered**. The plan target (4-layer architecture + repository pattern + EntityBase + cascadeRules + ESLint guard) is on `origin/main` in three squash commits:

- `d2822eab` — PR #130 (F1 types + interfaces)
- `7fc1a360` — PR #131 (F2 PWA repository + composition migration; PWA tests 189 → 298, +109)
- `2490fc8f` — PR #132 (F2 Azure repository + ESLint guard; Azure tests 1042 → 1179, +137)

### What Session 3 shipped (PR3)

- ✅ **P5.1** `AzureHubRepository` skeleton at `apps/azure/src/persistence/` + composition root singleton (mirrors PWA pattern)
- ✅ **P5.2** `cascadeArchive.ts` Dexie transaction wrapper using `transitiveCascade` walker; `EVIDENCE_SOURCE_REMOVE` wraps cascade + parent update in single `db.transaction('rw', [...])`
- ✅ **P5.3** Per-action handlers wrapping today's table writes (36 action kinds with `assertNever` exhaustiveness)
- ✅ **P6.1–P6.4** Composition migration consolidated (call-site analysis showed only `services/storage.ts` facade + `useEvidenceSourceSync.ts` cursor were real migration targets; UI components calling `useStorage()` were auto-satisfied — plan-reality delta #2)
- ✅ **P7.1** Documentation update across `packages/stores/CLAUDE.md`, `apps/pwa/CLAUDE.md`, `apps/azure/CLAUDE.md`
- ✅ **P7.2** ESLint repository-boundary guard: blocks BOTH `dexie` package AND `**/db/schema` glob imports (broader than original spec — caught the `useEvidenceSourceSync.ts` pattern). Smoke-tested live by planting `import Dexie from 'dexie'` in `ProcessHubEvidencePanel.tsx`.
- ✅ **P8.1** [OPUS] final-branch review across PR1 + PR2 + PR3 — verified F3 swap point is clean (PwaHubRepository.dispatch is the only place that needs to change from blob-write to normalized-table-write; no store-side changes required)
- ✅ **P8.2** PR #132 squash-merged at `2490fc8f` 2026-05-06 17:14 UTC

### Plan-reality deltas absorbed during PR3 execution

(Documented in `docs/decision-log.md` 2026-05-06 entry + memory file.)

1. **Sustainment/handoff dispatch deferred** — no `SUSTAINMENT_*`/`HANDOFF_*` HubAction kinds yet. Sustainment editors continue calling `services/localDb.ts` directly (R13 allow-listed). F5 may unify.
2. **P6 sub-tasks consolidated** — only `services/storage.ts` facade + `useEvidenceSourceSync.ts` cursor were real migration targets; UI components calling `useStorage()` auto-satisfied.
3. **Bootstrap cache-fill at `storage.ts:548` left direct** — cloud→local sync, not user-driven dispatch; documented exception.
4. **ESLint rule extended to block `**/db/schema`** — broader than original `dexie`-only spec.
5. **`--chrome` walk deferred to user pre-merge** — controller session lacked chrome\_\* tools.

### F-series sequence forward

The plan target shipped. Remaining workstreams (separate plans):

- **F3 (PR7 in canvas migration sequence)** — PWA Dexie `version(1)` normalized schema; `PwaHubRepository.dispatch` swaps from blob-write to normalized-table-write. **Clean swap point per Opus review.** No store-side changes.
- **F3.5** — ingestion action layer (paste / upload / evidence-source unified onto `EVIDENCE_ADD_SNAPSHOT`); `existingRange` wiring drops out.
- **F4** — three-layer state codification (Document / Annotation / View).
- **F5** — discriminated-union actions full coverage. Likely scope: `SUSTAINMENT_*` + `HANDOFF_*` action kinds added to `HubAction`; sustainment editors migrate off direct `localDb.ts`.
- **F6 (named-future)** — multi-investigation lifecycle (deferred per ADR-078 D3).

### Watchlist (carries into F3+)

- **`generateDeterministicId` → `generateEntityId` rename** — flagged Important by P1 reviewers; not surfaced during PR2/PR3 reviews. Carry into F3.
- **`'general-unassigned'` placeholder** leaking through `Finding.investigationId` / `Question.investigationId` — runtime guard target at repository layer in F3 or F5.
- **`RowProvenanceTag.snapshotId = ''`** placeholder at paste-flow call sites — F3.5 wiring gap.
- **~33 pre-existing tsc errors** (core/stores/hooks/charts vitest globals + `import.meta.env`) — out of F-series scope.
- **`useEvidenceSourceSync.markSeen` overwrites `createdAt` on every `put`** — F3 normalization concern.
- **`id: \`snapshot-${Date.now()}\``in`ProcessHubEvidencePanel.tsx:333`** — should reuse captured timestamp. F3 will replace surface entirely.

---

## Session 2 status (2026-05-06 afternoon) — PR2 history

**PR1 #130 + PR2 #131 BOTH MERGED.** PR2 squashed at `7fc1a360` 2026-05-06 13:50 UTC.

### What Session 2 shipped (PR2)

- ✅ **P3.1** `PwaHubRepository` skeleton at `apps/pwa/src/persistence/` + module-scoped singleton composition root (Vitest `vi.hoisted` + module-mock pattern documented in `apps/pwa/CLAUDE.md`)
- ✅ **P3.2** `applyAction` per-action Immer recipes — HUB*\*/OUTCOME*\* with real mutations; all other action kinds documented as no-ops with "F3 normalizes" comments (per **D-P2** PWA blob constraint: PWA persists ONLY a single hub-of-one ProcessHub blob; investigations/findings/etc. are session-only Zustand state)
- ✅ **P3.3** Cascade walkers in `applyAction.ts`
- ✅ **P3.4** Tests for `PwaHubRepository.dispatch`
- ✅ **P4.1–4.6** Composition migration — `SaveToBrowserButton.tsx`, `App.tsx`, `canvasStore.dispatch(CanvasAction)` transitional wrapper added (per-action methods stay until PR3 cleanup per R15)
- ✅ **HUB_PERSIST_SNAPSHOT bootstrap path:** `PwaHubRepository.dispatch` short-circuits this kind to skip the no-active-hub guard — required for first-save when opt-in is initially false. All other actions still require existing hub.
- ✅ **PR #131** opened, reviewed, merged at `7fc1a360`

### Test counts at PR2 merge

- pwa: 189 → **298** (+109 from new persistence + composition tests)
- stores: 261 → **272** (+11 from `canvasStore.dispatch` wrapper coverage)
- core / ui / azure-app / hooks / charts unchanged

### R10 outcome confirmed

PR2's diff was small because domain stores (`projectStore`, `investigationStore`, `improvementStore`) make ZERO Dexie calls today — migration target was UI/composition layer. Store files were untouched. The audit's R10 finding held.

### Caveat: `--chrome` walk deferred to user pre-merge

P4.7 manual `claude --chrome` walk (Save-to-browser round-trip, paste persist) was deferred — chrome\_\* tools were unavailable in the controller session. User performed the walk pre-merge. Worth noting for any future regression sleuthing.

---

## Session 3 resume — start PR3

**Goal:** AzureHubRepository + Azure composition migration + ESLint guard + final Opus review (P8.1 final-branch review across all three PRs).

### Setup

```bash
# Fresh worktree off current main (7fc1a360 + any newer)
git fetch origin --prune
git worktree add .worktrees/data-flow-foundation-pr3 -b data-flow-foundation-pr3
cd .worktrees/data-flow-foundation-pr3
pnpm install --frozen-lockfile
pnpm --filter @variscout/azure-app test  # baseline 1042 ✓
```

### Phase sequence (per plan §"Phase P5–P8")

1. **P5.1** `AzureHubRepository` skeleton at `apps/azure/src/persistence/` + composition root singleton (mirror PWA pattern from PR2)
2. **P5.2** Cascade handler with Dexie transactions (Azure already normalized; cascade is meaningful — investigation→findings/questions/links/causes)
3. **P5.3** Per-action handlers wrapping today's table writes (`saveProcessHubToIndexedDB`, `saveEvidenceSourceToIndexedDB`, `saveSustainmentRecord*`, etc.)
4. **P6.1** `ProcessHubEvidencePanel.tsx` (lines 150, 194, 318, 331) → `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` etc.
5. **P6.2** `SustainmentRecordEditor.tsx`, `SustainmentReviewLogger.tsx`, `ControlHandoffEditor.tsx` migrate to dispatch
6. **P6.3** `useNewHubProvision.ts`, `Dashboard.tsx`, `Editor.tsx` hub writes → dispatch
7. **P6.4** `useEvidenceSourceSync.ts` cursor read/write → dispatch (per R4 cursor lives on repository)
8. **P6.5** `--chrome` walk in Azure (sign in, paste, evidence sources, sustainment, archive cascade)
9. **P7.1** Update `packages/stores/CLAUDE.md`, `apps/pwa/CLAUDE.md`, `apps/azure/CLAUDE.md` with the dispatch-only rule
10. **P7.2** ESLint `no-restricted-imports` rule for `dexie` with explicit allow-list per audit R12+R13: `apps/pwa/src/db/**`, `apps/pwa/src/persistence/**`, `apps/azure/src/db/**`, `apps/azure/src/persistence/**`, `apps/azure/src/services/storage.ts`, `apps/azure/src/services/localDb.ts`, `apps/azure/src/services/cloudSync.ts`, `apps/azure/src/lib/persistence.ts`, `packages/stores/src/wallLayoutStore.ts`. Test files exempt.
11. **P7.3** Verify `pnpm lint` runs the rule via `scripts/pr-ready-check.sh`
12. **P8.1** [OPUS] Final-branch code review across PR1 + PR2 + PR3 — verify every entity has EntityBase, every store write goes through `repo.dispatch`, cascade rules applied consistently, ESLint blocks regressions, no `Math.random` introductions, tests deterministic, all builds green
13. **P8.2** Open PR3 → CI green → squash-merge

### Sizing

PR3 is materially larger than PR2 — Azure has 12+ Dexie tables across 8 schema versions vs PWA's 2-table blob. Budget for **≥1 fresh session**, possibly more depending on Azure consumer sweep depth.

### Dispatch model

- Sonnet workhorse for P5+P6+P7 implementers + per-task spec/quality reviewers
- **Opus reserved for P8.1** final-branch review across all three PRs
- Fresh subagent per task per `superpowers:subagent-driven-development`

### Open watchlist (still pending after PR2)

- **`generateDeterministicId` → `generateEntityId` rename** — flagged Important by P1 reviewers; not surfaced during PR2 review. Carry into PR3 / F3.
- **`'general-unassigned'` placeholder** leaking through `Finding.investigationId` / `Question.investigationId` — runtime guard target at repository layer in F2 PR3 or F3.
- **`RowProvenanceTag.snapshotId = ''`** placeholder at paste-flow call sites — F3.5 wiring gap.
- **~33 pre-existing tsc errors** in core/stores/hooks/charts (vitest globals + `import.meta.env`) — out of F-series scope.
- **`useEvidenceSourceSync.markSeen`** overwrites `createdAt` on every `put` — F3 normalization concern.
- **`id: \`snapshot-${Date.now()}\``in`ProcessHubEvidencePanel.tsx:333`** — should reuse captured timestamp. F3 will replace surface entirely.

---

## Session 1 status (2026-05-06 morning) — PR1 history

**PR1 #130 squashed at `d2822eab`.** 8 commits on branch `data-flow-foundation-f1-f2`, 174 files (+3334 / -1107), `pr-ready-check.sh` green.

### What's done

- ✅ **P0** audit (15 plan-revising findings absorbed as R1–R15 above)
- ✅ **P1.1** `@variscout/core/identity` (`160978ea`) — sweeps both `Math.random` `generateId` instances
- ✅ **P1.2** `ProcessHub` + `OutcomeSpec` (surrogate id) + `ProcessHubInvestigation` EntityBase (`34cb664d`)
- ✅ **P1.3** Evidence types EntityBase + `EvidenceSourceCursor` relocated azure→core (`a006f420`); ADR-077 amended
- ✅ **P1.4** Findings types EntityBase + `CausalLink.hubId → suspectedCauseId` rename (`94051a31`)
- ✅ **P1.4 review fixes** — tsc-clean fixtures, factory `investigationId` hardening, `'general-unassigned'` debt logged in `investigations.md` (`51abfb80`)
- ✅ **P1.4b** Sustainment + ControlHandoff EntityBase + `tombstoneAt → deletedAt` rename (`bb6c078d`)
- ✅ **P1.5** Canvas embedded entity typed FKs (`5c6b9183`); `ProcessMap` itself stays non-EntityBase per R6
- ✅ **P2.1–P2.5** `HubAction` (`kind` + SCREAMING_SNAKE_CASE per R2) + `HubRepository` interface + `cascadeRules` + exhaustiveness test (`e7a9938e`)
- ✅ **P2.6** PR1 spec compliance — per-task spec/quality reviewers approved each phase + holistic `pr-ready-check.sh` green
- ✅ **P2.7** PR1 opened at #130 (squash-merge after CI/review)

### Test counts at branch HEAD

- core: **3241** (3230 baseline + 11 new from P2 actions/cascade)
- ui: **1604** / azure-app: **1042** / pwa: **189** / hooks: **1099** / charts: **272** / stores: **261** / eslint-plugin: **39**
- All package builds clean (ui/azure-app/pwa tsc all 0 errors); `pr-ready-check.sh` green

### Resume point — Session 2 starts PR2

After PR1 #130 merges (squash):

1. **Sync the worktree:**

   ```bash
   git -C .worktrees/data-flow-foundation-f1-f2 fetch origin
   git -C .worktrees/data-flow-foundation-f1-f2 reset --hard origin/main
   # (or `git rebase origin/main` — but squash means a clean reset is simpler since the branch's commits collapse into one squash commit on main)
   ```

2. **Dispatch P3.1** (PwaHubRepository skeleton + module-scoped singleton at `apps/pwa/src/persistence/`) per `superpowers:subagent-driven-development` with Sonnet workhorse.

3. Continue through:
   - **P3.x** PWA repo + `applyAction` per-action Immer recipes + tests
   - **P4.x** PWA composition migration — re-scoped per R10 to UI/app files (`SaveToBrowserButton.tsx`, `App.tsx`, `usePasteImportFlow.ts`), NOT store files
   - **P4.5** `canvasStore.dispatch` entry that delegates to existing per-action methods (transitional wrapper, removed in PR3 cleanup per R15)
   - **P4.7** `claude --chrome` walk in PWA — verify Save-to-browser round-trip, paste persist, archive cascade

4. **PR2** = phases P3 + P4 = `Data-Flow Foundation F1+F2 — PR2: PWA repository + composition migration`. Likely 30+ task subagent dispatches based on PR1's pattern; budget for ≥1 fresh session.

5. **PR3** = phases P5 (AzureHubRepository) + P6 (Azure composition migration) + P7 (ESLint guard) + P8 (final Opus review). Per audit R12+R13: ESLint allow-list includes `wallLayoutStore.ts` + project-overlay paths.

### Open watchlist items (deferred to PR2 review or later)

- **`generateDeterministicId` rename to `generateEntityId`** — both P1.1 + P1.2 reviewers flagged this Important. Cheap to rename in PR2 if it surfaces during review; spec D2 + plan D-P3 update along with it.
- **`'general-unassigned'` placeholder** leaking through store actions (`addFinding`/`addQuestion`/`addSuspectedCause`) — runtime guard at repository layer in F2 PR2/PR3 per `docs/investigations.md` entry.
- **`RowProvenanceTag.snapshotId = ''`** placeholder at paste-flow call sites — F3 wiring gap (snapshot doesn't exist when tag is constructed; reorder in F3.5 ingestion action layer).
- **Pre-existing tsc errors** (~33 across core/stores/hooks/charts) — vitest globals + `import.meta.env` config-level; out of F-series scope; track in a separate cleanup if it becomes load-bearing.
- **`useEvidenceSourceSync.markSeen` overwrites `createdAt` on every put** — F3 normalization concern.
- **`id: \`snapshot-${Date.now()}\``in`ProcessHubEvidencePanel.tsx:333`** — should reuse captured `timestamp`. F3 will replace surface entirely.

### Context budget note

Session 1 used substantial context across 6 implementer dispatches + 4 reviewer dispatches + audit + fix subagent. Session 2 should start fresh with this plan + audit + the merged PR1 state as loaded context. Keep PR2 dispatches Sonnet-workhorse; reserve Opus for PR3 P8.1 final-branch review.

---

## Sequencing

Per `superpowers:subagent-driven-development`. **Sonnet workhorse ≥ 70%.** One worktree, three sequential PRs off branch `data-flow-foundation-f1-f2`. Branch from `main` at `e1352c16`.

### Phase P0 — Audit current state (read-only, single dispatch) ✅ COMPLETE

Audit landed at commit before R-revisions; output at [`2026-05-06-data-flow-foundation-f1-f2-audit.md`](2026-05-06-data-flow-foundation-f1-f2-audit.md). 15 plan-revising findings absorbed into "Audit revisions" section at top of this plan (R1–R15). Subsequent phases reference the audit doc directly when implementing.

- [x] **Task P0.1** _(Sonnet, general-purpose, Explore-style scope: very thorough)_ — Read every entity type in `@variscout/core` and produce `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md` containing:
  1. **Entity inventory:** every type that needs `EntityBase` + which sub-path it lives in (e.g., `processHub.ts`, `findings/types.ts`, `matchSummary/types.ts`, etc.). For each entity, list current ID-like fields (`id`, `hubId`, `findingId`, …) and whether `createdAt` / `deletedAt` analogues exist.
  2. **Factory inventory:** every `create*` factory function in `@variscout/core`; whether it currently sets ID fields; what fixture pattern its tests use.
  3. **Persistence call-site inventory:** every place `dexie` is imported AND every place `hubRepository`, `processHubsTable`, `evidenceSnapshotsTable`, etc. are called from store code. Output as a table with file path + symbol + intent (read / write).
  4. **Store file inventory:** every store in `packages/stores/src/`; for each, list write methods and whether they currently mutate via Immer + persist, or via direct table writes.
  5. **Action-shape inventory for canvas:** read `packages/stores/src/canvasStore.ts` (or wherever canvas migration's discriminated-union actions live) and list each action shape, so P2.1's `CanvasAction` consolidation is grounded in actual code.

  **Acceptance:** audit doc committed at `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md`. Subsequent phases reference it.

  **Why this phase exists:** P1._ and P4._ tasks reference exact file paths + entity names. Without an audit, those tasks would either invent paths or get blocked mid-implementation.

### Phase P1 — Identity + lifecycle on every entity (PR1, types only)

- [ ] **Task P1.1** _(Sonnet)_ — Create `packages/core/src/identity.ts` with `EntityBase` interface + `generateDeterministicId()` (crypto-only, no `Math.random` fallback). Add `./identity` sub-path export to `packages/core/package.json`. Update `findings/factories.ts:24` `generateId` to re-export from `identity.ts` (one-line wrapper for transitional callers). Tests in `identity.test.ts` cover (a) generated IDs are unique across 1000 calls, (b) `crypto.randomUUID` unavailability throws, (c) ID format is RFC-4122 UUID.

- [ ] **Task P1.2** _(Sonnet)_ — Add `EntityBase` (`id`, `createdAt`, `deletedAt`) to `ProcessHub`, `OutcomeSpec`, `ProcessHubInvestigation` in `packages/core/src/processHub.ts`. Verify which IDs already exist (`ProcessHub.id` does); add missing `createdAt` + `deletedAt`. Update `processHub.test.ts` fixtures + every consumer in the monorepo where the type-checker fails. Verify `pnpm --filter @variscout/core test` green.

- [ ] **Task P1.3** _(Sonnet)_ — Add `EntityBase` to `EvidenceSnapshot`, `RowProvenanceTag` in `packages/core/src/matchSummary/types.ts`. Add `EntityBase` to `EvidenceSource`, `EvidenceSourceCursor` in `packages/core/src/processHub.ts` (or wherever they live per audit). Update related tests + fixtures. Verify build.

- [ ] **Task P1.4** _(Sonnet)_ — Add `EntityBase` to `Finding`, `Question`, `CausalLink`, `SuspectedCause` in `packages/core/src/findings/types.ts`. Add typed FK fields:
  - `Finding.investigationId: ProcessHubInvestigation['id']` (refine current looser typing if any)
  - `Finding.questionId?: Question['id']`
  - `CausalLink.fromFindingId: Finding['id']`
  - `CausalLink.toCauseId: SuspectedCause['id']`
  - (etc., per audit)

  Update `findings/factories.ts` to call `generateDeterministicId()` and set `createdAt: Date.now()`, `deletedAt: null`. Update `findings/__tests__/factories.test.ts` + every consumer.

- [ ] **Task P1.5** _(Sonnet)_ — Add `EntityBase` to canvas-related entities (`ProcessMap`, `ProcessMapStep`, etc., per audit). Verify with canvas migration team's existing shape that this isn't a regression. Update tests + fixtures.

- [ ] **Task P1.6** _(Sonnet)_ — Update seed data in `apps/pwa/src/seedData/` and `apps/azure/src/seedData/` to populate `createdAt` + `deletedAt: null` on all generated entities. Verify showcase data renders unchanged (run `pnpm dev` for both apps; check syringe-barrel + fill-weight showcases).

- [ ] **Task P1.7** _(Sonnet)_ — Update `packages/core/src/index.ts` barrel to re-export `EntityBase` + `generateDeterministicId`. Verify `pnpm --filter @variscout/core build` + `pnpm test` green at the monorepo level.

### Phase P2 — Action union + repository interface + cascade ruleset (PR1, types only)

- [ ] **Task P2.1** _(Sonnet)_ — Create `packages/core/src/actions/` directory with one file per sub-union (per File Structure table). Each sub-union enumerates the actions that mutate that entity surface. Cross-reference the audit doc's canvas action list to ensure `CanvasAction` matches today's canvas migration shape exactly (no drift). Add `./actions` sub-path export to `package.json`. Barrel re-exports.

- [ ] **Task P2.2** _(Sonnet)_ — Add `actions/__tests__/exhaustiveness.test.ts`:

  ```ts
  import type { HubAction } from '../HubAction';

  function assertNever(x: never): never {
    throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
  }

  // Type-only check: this function must compile.
  // If a new action is added without a case branch, TS errors here.
  function _exhaustive(action: HubAction): void {
    switch (action.type) {
      // every type literal listed exhaustively
      case 'outcome/add':
        return;
      case 'outcome/update':
        return;
      // ...
      default:
        return assertNever(action);
    }
  }
  ```

  Test asserts the function compiles by importing it. Document the pattern in a code comment.

- [ ] **Task P2.3** _(Sonnet)_ — Create `packages/core/src/persistence/HubRepository.ts` with the interface per D-P1. Each `*ReadAPI` interface defines `get(id)` + `list()` minimally; richer queries deferred to F3. Add `./persistence` sub-path export.

- [ ] **Task P2.4** _(Sonnet)_ — Create `packages/core/src/persistence/cascadeRules.ts`:

  ```ts
  export type EntityKind =
    | 'hub'
    | 'outcome'
    | 'evidenceSnapshot'
    | 'rowProvenance'
    | 'evidenceSource'
    | 'evidenceSourceCursor'
    | 'investigation'
    | 'finding'
    | 'question'
    | 'causalLink'
    | 'suspectedCause'
    | 'canvasState';

  export interface CascadeRule {
    cascadesTo: readonly EntityKind[];
  }

  export type CascadeRuleset = Readonly<Record<EntityKind, CascadeRule>>;

  export const cascadeRules: CascadeRuleset = {
    hub: {
      cascadesTo: ['outcome', 'evidenceSnapshot', 'evidenceSource', 'investigation', 'canvasState'],
    },
    outcome: { cascadesTo: [] },
    evidenceSnapshot: { cascadesTo: ['rowProvenance'] },
    rowProvenance: { cascadesTo: [] },
    evidenceSource: { cascadesTo: ['evidenceSourceCursor'] },
    evidenceSourceCursor: { cascadesTo: [] },
    investigation: { cascadesTo: ['finding', 'question', 'causalLink', 'suspectedCause'] },
    finding: { cascadesTo: [] },
    question: { cascadesTo: [] },
    causalLink: { cascadesTo: [] },
    suspectedCause: { cascadesTo: [] },
    canvasState: { cascadesTo: [] },
  };

  export function transitiveCascade(kind: EntityKind): readonly EntityKind[] {
    const visited = new Set<EntityKind>();
    const queue: EntityKind[] = [...cascadeRules[kind].cascadesTo];
    while (queue.length > 0) {
      const next = queue.shift()!;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(...cascadeRules[next].cascadesTo);
      }
    }
    return Array.from(visited);
  }
  ```

  Test in `__tests__/cascadeRules.test.ts`: `transitiveCascade('hub')` returns the full set; `transitiveCascade('outcome')` returns `[]`; `transitiveCascade('investigation')` returns 4-entry list; no entity has a self-loop; every `cascadesTo` target is a known `EntityKind`.

- [ ] **Task P2.5** _(Sonnet)_ — Update `packages/core/src/index.ts` barrel + `packages/core/package.json` exports to expose `HubAction`, `HubRepository`, `cascadeRules`, `transitiveCascade`. Verify `pnpm build` green across monorepo.

- [ ] **Task P2.6** _(Sonnet, spec reviewer)_ — Spec-compliance review of PR1 surface against this plan: entity inventory complete, action union exhaustive, cascade rules cover every entity kind, no `Math.random` introductions, no optional `id`/`createdAt`/`deletedAt`. Block PR1 merge if gaps found.

- [ ] **Task P2.7** _(Sonnet)_ — Open PR1 (`Data-Flow Foundation F1+F2 — PR1: types + interfaces`). Run `bash scripts/pr-ready-check.sh`. Subagent code review. Address review comments. Squash-merge.

### Phase P3 — `PwaHubRepository` (PR2, runtime change)

- [ ] **Task P3.1** _(Sonnet)_ — Create `apps/pwa/src/persistence/PwaHubRepository.ts`. Class skeleton:

  ```ts
  import type { HubRepository, HubAction, ProcessHub } from '@variscout/core/persistence';
  import { db } from '../db/schema';
  import { saveHub, loadHub } from '../db/hubRepository';

  export class PwaHubRepository implements HubRepository {
    async dispatch(action: HubAction): Promise<void> {
      const hub = await loadHub();
      if (!hub) throw new Error('No active hub to dispatch action against');
      const next = applyAction(hub, action);
      await saveHub(next);
    }

    hubs = {
      async get(id: string) {
        const h = await loadHub();
        return h?.id === id ? h : undefined;
      },
      async list() {
        const h = await loadHub();
        return h ? [h] : [];
      },
    };

    // ... grouped read APIs derived from current hub blob
    // (each one filters hub.* arrays for live entries)
  }

  export const pwaHubRepository = new PwaHubRepository();
  ```

  `applyAction(hub, action)` is the per-action Immer recipe — implemented in P3.2.

- [ ] **Task P3.2** _(Sonnet)_ — Implement `applyAction(hub: ProcessHub, action: HubAction): ProcessHub` in `apps/pwa/src/persistence/applyAction.ts`. Per-action recipe handlers for all action types in `HubAction`. For `*/archive` actions, soft-mark the entity AND its cascade descendants per `cascadeRules`. Each handler is a 3-10 line Immer block. Use `produce()` from immer.

  ```ts
  import { produce } from 'immer';
  import type { HubAction } from '@variscout/core/actions';
  import type { ProcessHub } from '@variscout/core/processHub';
  import { transitiveCascade, type EntityKind } from '@variscout/core/persistence';

  export function applyAction(hub: ProcessHub, action: HubAction): ProcessHub {
    return produce(hub, draft => {
      switch (action.type) {
        case 'outcome/add':
          draft.outcomes.push(action.outcome);
          break;
        case 'outcome/update': {
          const idx = draft.outcomes.findIndex(o => o.id === action.outcomeId);
          if (idx !== -1) Object.assign(draft.outcomes[idx], action.patch);
          break;
        }
        case 'investigation/archive':
          archiveInvestigationInDraft(draft, action.investigationId);
          break;
        // ... one case per action type, exhaustive switch
        default:
          assertNever(action);
      }
    });
  }
  ```

- [ ] **Task P3.3** _(Sonnet)_ — Implement cascade helpers in `applyAction.ts`. `archiveInvestigationInDraft(draft, investigationId)` walks `transitiveCascade('investigation')` and soft-marks all descendant entities. Same pattern for `archiveHubInDraft`, etc. Tests in `__tests__/applyAction.test.ts` cover (a) every action type produces the expected diff; (b) cascade actions soft-mark the right descendants; (c) idempotency (applying same action twice on already-archived entity is no-op).

- [ ] **Task P3.4** _(Sonnet)_ — Tests in `apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts`:
  - dispatch on each action type persists the expected change (mock `saveHub`/`loadHub`)
  - cascade behavior via `dispatch({ type: 'investigation/archive', ... })`
  - read APIs filter `deletedAt !== null` by default
  - error path: dispatch with no active hub throws

  Vitest pattern; deterministic IDs in fixtures.

- [ ] **Task P3.5** _(Sonnet, spec reviewer + code-quality reviewer)_ — Two-stage review of P3.1–P3.4. Spec compliance: HubRepository interface fully implemented, action coverage matches `HubAction` exhaustively, cascade rules consulted. Code quality: no `Math.random`, no hardcoded palette colors (N/A in repository code but check imports), tests deterministic, no `// @ts-ignore`.

### Phase P4 — PWA store migration (PR2)

- [ ] **Task P4.1** _(Sonnet)_ — Migrate `packages/stores/src/projectStore.ts` (or wherever per audit). Every `setState` block that previously mutated hub state and called `hubRepository.saveHub()` becomes `await pwaHubRepository.dispatch({ type: '...', ... })`. The store shape (`ProjectState` interface) stays the same; only the implementation of methods changes. Tests update to mock the repository instead.

- [ ] **Task P4.2** _(Sonnet)_ — Migrate `packages/stores/src/investigationStore.ts`. `addFinding`, `updateFinding`, `archiveInvestigation`, etc. dispatch through repository. Tests update.

- [ ] **Task P4.3** _(Sonnet)_ — Migrate `packages/stores/src/improvementStore.ts`. Same pattern.

- [ ] **Task P4.4** _(Sonnet)_ — Migrate `packages/stores/src/sessionStore.ts` IF the audit shows it touches persistence (likely doesn't — session is View layer per F4 D5). If not, no-op task; document in audit doc.

- [ ] **Task P4.5** _(Sonnet)_ — Align `packages/stores/src/canvasStore.ts` with `CanvasAction` from `@variscout/core/actions`. The store likely already uses discriminated-union actions per canvas migration spec; ensure the action-type literals + payloads match. If they drifted, update the store to import from `@variscout/core/actions` instead of defining locally.

- [ ] **Task P4.6** _(Sonnet)_ — Wire `PwaHubRepository` singleton at PWA composition root. Two options:
  - **(A) Module-scoped singleton:** `apps/pwa/src/persistence/index.ts` exports `pwaHubRepository`; stores import directly. Simple but couples store package to app.
  - **(B) Dependency injection via context:** `apps/pwa/src/App.tsx` provides a `RepositoryContext`; stores read via a hook. Decoupled but more wiring.

  Decide between (A) and (B) based on testability — option (A) is simpler if test setup can override the singleton via Vitest module mocks. Document the choice in `apps/pwa/CLAUDE.md`.

- [ ] **Task P4.7** _(Sonnet)_ — Manual `claude --chrome` walk in PWA per `feedback_verify_before_push`:
  - Open existing showcase data; verify rendering unchanged
  - Paste new CSV via Mode A.1; verify Stage 1+2+3 flow + persistence (Save to browser)
  - Reload tab; verify hub restored
  - Open Investigation panel; add a Question + a Finding; reload; verify persisted
  - Archive an investigation; verify findings/questions/links archived too (cascade)

- [ ] **Task P4.8** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review of P4. Spec compliance: every store write path goes through `repo.dispatch`; no direct `saveHub`/`db.*` calls in store code. Code quality: tests use mocks correctly, no race-condition-prone async patterns, no leftover `console.log`.

- [ ] **Task P4.9** _(Sonnet)_ — Open PR2 (`Data-Flow Foundation F1+F2 — PR2: PWA repository + store migration`). Run `bash scripts/pr-ready-check.sh`. Subagent code review. Address comments. Squash-merge.

### Phase P5 — `AzureHubRepository` (PR3)

- [ ] **Task P5.1** _(Sonnet)_ — Create `apps/azure/src/persistence/AzureHubRepository.ts` mirroring the PWA shape. Action handlers route to today's Azure tables (`db.processHubs`, `db.evidenceSnapshots`, etc.). Note: Azure already has more normalized tables than PWA, so handlers may directly do per-table writes (vs PWA's blob-rewrite). Tests cover per-action persistence.

- [ ] **Task P5.2** _(Sonnet)_ — Cascade handler implementation for Azure. Per-table writes wrapped in a Dexie transaction:

  ```ts
  case 'investigation/archive':
    await this.db.transaction('rw', this.allTables, async () => {
      const now = Date.now();
      await this.db.investigations.update(action.investigationId, { deletedAt: now });
      const findings = await this.db.findings.where('investigationId').equals(action.investigationId).toArray();
      await this.db.findings.bulkUpdate(findings.map(f => ({ key: f.id, changes: { deletedAt: now } })));
      // ... cascade to questions, causalLinks, suspectedCauses
    });
    break;
  ```

  Tests cover transaction commit + rollback paths.

- [ ] **Task P5.3** _(Sonnet)_ — Wire `AzureHubRepository` singleton at Azure composition root. Match the choice (A or B) made for PWA in P4.6 — same pattern across apps.

- [ ] **Task P5.4** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P6 — Azure store migration (PR3)

- [ ] **Task P6.1** _(Sonnet)_ — Migrate Azure-specific store extensions (per audit) off direct Dexie calls onto `azureHubRepository.dispatch`. Mirror the PWA store-migration tasks.

- [ ] **Task P6.2** _(Sonnet)_ — Manual `claude --chrome` walk in Azure:
  - Sign in, open existing project + hub
  - Paste new CSV via paste flow; verify Mode A.2-paste MatchSummaryCard + persistence
  - Open Investigation surface; add finding; verify persisted
  - Archive investigation; verify cascade (findings/questions/links archived)
  - Multi-hub: switch between hubs; verify isolation

- [ ] **Task P6.3** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P7 — ESLint guard (PR3)

- [ ] **Task P7.1** _(Sonnet)_ — Update `packages/stores/CLAUDE.md`, `apps/pwa/CLAUDE.md`, `apps/azure/CLAUDE.md` documenting: stores never import `dexie`; persistence access only via `HubRepository`. One sentence each.

- [ ] **Task P7.2** _(Sonnet)_ — Add ESLint rule in `eslint.config.js` (root):

  ```js
  {
    files: ['packages/stores/**/*.ts', 'apps/*/src/**/*.{ts,tsx}'],
    ignores: ['apps/*/src/persistence/**', 'apps/*/src/db/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'dexie',
          message: 'Persistence access is via @variscout/core HubRepository. See apps/<app>/src/persistence/.',
        }],
      }],
    },
  }
  ```

  Verify rule fires when a store file imports `dexie`; verify rule does NOT fire for `apps/pwa/src/persistence/PwaHubRepository.ts`.

- [ ] **Task P7.3** _(Sonnet)_ — Verify `pnpm lint` runs the new rule via `scripts/pr-ready-check.sh` (no script change expected — `lint` already covers it). Document in pre-push checklist.

### Phase P8 — Final review + PR3 merge

- [ ] **Task P8.1** _([OPUS], final reviewer)_ — Final-branch code review of the entire F1+F2 surface across all three PRs. Verify:
  - Every entity has `id` + `createdAt` + `deletedAt` (no optionality)
  - Every store write goes through `repo.dispatch` (no direct `db.*` or `saveHub`)
  - Cascade rules are applied consistently
  - ESLint rule blocks regressions
  - No `Math.random` introduced anywhere
  - No hardcoded palette colors introduced (N/A for persistence code but check)
  - Tests deterministic; coverage on every action type
  - `pnpm test` + `pnpm build` + `pnpm --filter @variscout/ui build` (per `feedback_ui_build_before_merge`) green
  - PWA + Azure UI behavior unchanged (`--chrome` walks signed off)

- [ ] **Task P8.2** _(Sonnet)_ — Open PR3 (`Data-Flow Foundation F1+F2 — PR3: Azure repository + ESLint guard`). Run `bash scripts/pr-ready-check.sh`. Subagent code review. Address comments. Squash-merge.

- [ ] **Task P8.3** _(Sonnet)_ — Update `docs/decision-log.md` with a 2026-05-XX (date of PR3 merge) entry documenting F1+F2 close-out: types normalized, repository pattern enforced, ESLint guard live, ready for F3 (PR7) PWA Dexie schema cutover. Update `docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md` `last-reviewed` to PR3 merge date.

---

## Verification

### Per-PR gates

**PR1 (P0 + P1 + P2):**

- [ ] All entity types in `@variscout/core` have `id` + `createdAt` + `deletedAt` (verify via grep)
- [ ] No optional `id`/`createdAt`/`deletedAt` (TypeScript required)
- [ ] `generateDeterministicId()` is the only ID source; no `Math.random` anywhere
- [ ] `HubAction` discriminated union covers every write surface enumerated in audit
- [ ] `cascadeRules` covers every `EntityKind`
- [ ] `pnpm --filter @variscout/core test` green
- [ ] `pnpm build` green across monorepo
- [ ] No runtime behavior change (manual smoke: PWA + Azure showcases render unchanged)

**PR2 (P3 + P4):**

- [ ] `PwaHubRepository` implements `HubRepository` exhaustively
- [ ] All PWA store write methods route through `pwaHubRepository.dispatch`
- [ ] No direct `dexie` imports in store code
- [ ] `--chrome` walk: showcase render unchanged + paste-persist round-trip + archive-cascade work
- [ ] `pnpm test` green
- [ ] `pnpm --filter @variscout/ui build` green

**PR3 (P5 + P6 + P7 + P8):**

- [ ] `AzureHubRepository` implements `HubRepository` exhaustively
- [ ] All Azure store write methods route through `azureHubRepository.dispatch`
- [ ] ESLint rule fires on regression attempts; passes on legitimate persistence code
- [ ] `--chrome` walk in Azure
- [ ] Final Opus review approves
- [ ] `bash scripts/pr-ready-check.sh` green

### Holistic checks (post-PR3)

- [ ] Read F3 plan starting point: with F1+F2 in main, the F3 (PR7) plan only needs to swap `PwaHubRepository`'s `dispatch` implementation from blob-write to normalized table-write — no store-side changes required
- [ ] Decision-log entry captures the close-out
- [ ] `docs/llms.txt` references the new persistence sub-path if relevant (verify)

---

## Risk register

- **PR1 type-error blast radius.** Adding required fields to every entity will surface every consumer where IDs / fixtures are constructed inline. Mitigation: fix-as-you-go inside P1 tasks; prioritize the audit (P0) so the scope is known up front. Don't merge PR1 until ALL type errors resolved.
- **Module-scoped singleton vs DI for repository wiring.** P4.6 picks one; risk is locking in a pattern that's hard to test. Mitigation: Vitest module mocks (option A) are battle-tested across this codebase; DI (option B) only if test ergonomics demand it. Default to A.
- **Canvas action drift.** `CanvasAction` in `@variscout/core/actions` must match the existing canvasStore's action shape exactly. Mitigation: P0 audit captures the existing shape; P2.1 is a consolidation (not redesign); spec reviewer in P2.6 catches drift.
- **Azure transaction granularity.** `dispatch({ type: 'investigation/archive' })` cascades to findings + questions + links + causes. If transactions span too many tables, browser-tab-close mid-write rolls back the whole archive (consistent but user sees no progress). Mitigation: Dexie's transaction model handles this correctly; P5.2 tests cover rollback.
- **ESLint rule false positives.** `no-restricted-imports` for `dexie` may fire in legitimate test files or scripts. Mitigation: precise `ignores` glob in P7.2; test the rule against the existing codebase before committing.
- **Subagent --no-verify hazard** per `feedback_subagent_no_verify`. Mitigation: every dispatch prompt explicitly forbids `--no-verify` and `--no-gpg-sign`; pre-commit hooks must pass.
- **Branch staleness during PR1→PR2→PR3 sequence.** With three PRs sequenced over potentially several days, main may drift. Mitigation: per `feedback_branch_staleness_guardrails`, `git fetch && git log HEAD..origin/main` before each push; merge main if drift ≥ 10 commits.
- **Worktree discipline** per `feedback_one_worktree_per_agent`. F-series worktree at `.worktrees/data-flow-foundation-f1-f2/` is exclusive to this work — Codex's Tier 1 fix work + canvas migration get separate worktrees.
- **Pre-existing `Math.random` fallback fix.** D-P3 removes `Math.random` from `findings/factories.ts:24`. If any test relies on the fallback path (unlikely — tests should provide explicit IDs), it'll fail. Mitigation: P1.1 tests cover the new shape; P1 audit catches dependents.

---

## Out of scope (carried forward)

- **F3 (PR7) — PWA Dexie schema cutover to normalized tables.** Repository surface stays the same; backend swaps. Separate plan after F1+F2.
- **F3.5 — ingestion action layer unification.** Paste/upload/evidence-source migrate to `evidence/addSnapshot` action; `existingRange` wiring drops out as side effect.
- **F4 — three-layer state codification.** Document/Annotation/View boundary explicit in store contracts.
- **F5 — discriminated-union actions, full coverage extension** (e.g., outcome/\* writes that today still go through hub-meta path).
- **F6 (named-future) — multi-investigation lifecycle.**
- **Action log persistence** (FIFO 1,000-entry cap) — F5 territory.
- **`.vrs` v1.1 format bump** — F3 territory.
- **Multi-tab live sync** (Dexie `liveQuery` broadcast) — F6+ territory.

---

## References

- **Spec:** [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](../specs/2026-05-06-data-flow-foundation-design.md)
- **Architectural foundation:** [`docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`](../../07-decisions/adr-078-pwa-azure-architecture-alignment.md)
- **Companion patterns:**
  - Canvas Migration spec ([`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`](../specs/2026-05-04-canvas-migration-design.md)) — discriminated-union action pattern precedent
  - Manual Canvas Authoring spec ([`docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md`](../specs/2026-05-04-manual-canvas-authoring-design.md)) — canvas action surface that consolidates into `CanvasAction`
- **Workflow rules:**
  - `feedback_no_backcompat_clean_architecture` — atomic refactors, required props, no optionality pollution
  - `feedback_fix_absorbed_violations_at_seam` — fix `Math.random` in `findings/factories.ts:24` at the seam
  - `feedback_one_worktree_per_agent` — F-series worktree exclusive to this work
  - `feedback_subagent_driven_default` — Sonnet workhorse + per-task spec/quality reviewers + final Opus
  - `feedback_subagent_no_verify` — explicit prohibition in every dispatch prompt
  - `feedback_branch_staleness_guardrails` — fetch + drift check before each push
  - `feedback_ui_build_before_merge` — `pnpm --filter @variscout/ui build` in pre-merge gate
  - `feedback_verify_before_push` — `--chrome` walk per PR
- **Existing surfaces touched:**
  - `packages/core/src/findings/factories.ts:24` — `generateId` to deprecate/replace
  - `packages/core/src/processHub.ts` — ProcessHub, OutcomeSpec, ProcessHubInvestigation
  - `packages/core/src/findings/types.ts` — Finding, Question, CausalLink, SuspectedCause
  - `packages/core/src/matchSummary/types.ts` — EvidenceSnapshot, RowProvenanceTag
  - `packages/stores/src/*.ts` — every store
  - `apps/pwa/src/db/hubRepository.ts` — wrapped by `PwaHubRepository`
  - `apps/azure/src/db/schema.ts` — wrapped by `AzureHubRepository`
