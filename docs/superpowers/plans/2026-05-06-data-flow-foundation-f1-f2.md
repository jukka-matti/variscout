---
title: Data-Flow Foundation F1+F2 Implementation Plan — type-level normalization + repository pattern
audience: [engineer]
category: implementation-plan
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

### D-P3. ULID via `crypto.randomUUID()`; rename `generateId` → `generateDeterministicId`; remove `Math.random` fallback

Existing `packages/core/src/findings/factories.ts:24` `generateId()` has a `Math.random` fallback that violates `packages/core/CLAUDE.md`'s "never use Math.random" hard rule. P1 fixes this at the seam (per `feedback_fix_absorbed_violations_at_seam`):

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

| Path                                                                         | Phase            | Action                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/processHub.ts`                                            | P1.2             | `ProcessHub`, `OutcomeSpec`, `ProcessHubInvestigation`, `ProcessHubInvestigation.metadata` (`scopeFilter`, `paretoGroupBy` already exist) get `EntityBase`; verify `ProcessHub.id` already exists, just add `createdAt`+`deletedAt` |
| `packages/core/src/__tests__/processHub.test.ts`                             | P1.2             | Update fixtures with `createdAt`+`deletedAt`                                                                                                                                                                                        |
| `packages/core/src/findings/types.ts`                                        | P1.5             | `Finding`, `Question`, `CausalLink`, `SuspectedCause` extend `EntityBase`; add typed FKs (`Finding.investigationId: Investigation['id']`, `CausalLink.fromFindingId`, etc.)                                                         |
| `packages/core/src/findings/factories.ts`                                    | P1.5             | `createFinding`, `createQuestion`, `createCausalLink`, `createSuspectedCause` set `createdAt: Date.now()`, `deletedAt: null`, use `generateDeterministicId()`                                                                       |
| `packages/core/src/findings/__tests__/factories.test.ts`                     | P1.5             | Fixture updates                                                                                                                                                                                                                     |
| `packages/core/src/matchSummary/types.ts`                                    | P1.4             | `EvidenceSnapshot`, `RowProvenanceTag` extend `EntityBase`; verify existing fields don't already cover these                                                                                                                        |
| `packages/core/src/matchSummary/__tests__/*.test.ts`                         | P1.4             | Fixture updates                                                                                                                                                                                                                     |
| `packages/core/src/processHub.ts` (`EvidenceSource`, `EvidenceSourceCursor`) | P1.4             | Same                                                                                                                                                                                                                                |
| `packages/core/src/index.ts`                                                 | P1.1, P2.5       | Re-export `EntityBase`, `generateDeterministicId`, `HubAction`, `HubRepository`, `cascadeRules` from new sub-paths                                                                                                                  |
| `packages/core/package.json`                                                 | P1.1, P2.1, P2.3 | Add `./identity`, `./actions`, `./persistence` to `exports` field                                                                                                                                                                   |
| `packages/core/tsconfig.json`                                                | P1.1, P2.1, P2.3 | Add path mappings if internal imports use `@variscout/core/*` (verify)                                                                                                                                                              |
| `packages/core/src/findings/factories.ts`                                    | P1.1             | `generateId` deprecates → re-export from `identity.ts`; remove `Math.random` fallback                                                                                                                                               |

### Modified — PWA store + persistence (PR2, P3+P4)

| Path                                                | Phase | Action                                                                                                                                                                              |
| --------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/pwa/src/db/hubRepository.ts`                  | P3.1  | Becomes the _PWA-internal_ Dexie helper; no behavior change. `PwaHubRepository` wraps it.                                                                                           |
| `packages/stores/src/projectStore.ts` (verify name) | P4.1  | Replace direct `hubRepository.saveHub()` calls with `repo.dispatch({ type: 'hub/...', ... })`. Module-scoped repository singleton via dependency injection at app composition root. |
| `packages/stores/src/investigationStore.ts`         | P4.2  | Replace inline Immer recipes (`addFinding`, `archiveInvestigation`, etc.) with `repo.dispatch({ type: 'finding/add', ... })` etc.                                                   |
| `packages/stores/src/improvementStore.ts`           | P4.3  | Same                                                                                                                                                                                |
| `packages/stores/src/sessionStore.ts`               | P4.4  | Verify whether session store touches persistence; if yes, migrate; if not, no change                                                                                                |
| `packages/stores/src/canvasStore.ts`                | P4.5  | Align existing canvas-migration discriminated-union shape with `CanvasAction` re-exported from `@variscout/core/actions`                                                            |
| `packages/stores/src/__tests__/*.test.ts`           | P4.\* | Update tests to mock `HubRepository` instead of `hubRepository` directly                                                                                                            |
| `apps/pwa/src/App.tsx`                              | P3.1  | At composition root, instantiate `PwaHubRepository` and provide to stores via context or singleton                                                                                  |
| `apps/pwa/src/__tests__/...`                        | P4.7  | App-level smoke tests still green                                                                                                                                                   |

### Modified — Azure store + persistence (PR3, P5+P6)

| Path                                                                      | Phase | Action                                                                                   |
| ------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `apps/azure/src/db/schema.ts`                                             | P5.1  | No schema change in F1+F2 (F3 normalizes PWA only; Azure already has tables)             |
| `apps/azure/src/components/...`                                           | P6.\* | Verify no component reaches into Dexie tables directly; if yes, route through repository |
| Azure-specific store extensions in `apps/azure/src/stores/` (verify path) | P6.\* | Same migration pattern as PWA stores; `AzureHubRepository` injected at composition root  |
| `apps/azure/src/App.tsx`                                                  | P5.1  | Instantiate `AzureHubRepository` at composition root                                     |

### Modified — guardrails (PR3, P7)

| Path                                   | Phase | Action                                                                                |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| `packages/stores/CLAUDE.md`            | P7.1  | Document the rule: stores never import `dexie`; repository only                       |
| `apps/pwa/CLAUDE.md`                   | P7.1  | Same                                                                                  |
| `apps/azure/CLAUDE.md`                 | P7.1  | Same                                                                                  |
| `eslint.config.js` (root, verify path) | P7.2  | Add `no-restricted-imports` rule blocking `dexie` outside `apps/*/src/persistence/**` |
| `scripts/pr-ready-check.sh`            | P7.3  | Verify ESLint runs the new rule; no script change if `pnpm lint` already covers it    |

---

## Sequencing

Per `superpowers:subagent-driven-development`. **Sonnet workhorse ≥ 70%.** One worktree, three sequential PRs off branch `data-flow-foundation-f1-f2`. Branch from `main` at `e1352c16`.

### Phase P0 — Audit current state (read-only, single dispatch)

- [ ] **Task P0.1** _(Sonnet, Explore-style scope: very thorough)_ — Read every entity type in `@variscout/core` and produce `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md` containing:
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
