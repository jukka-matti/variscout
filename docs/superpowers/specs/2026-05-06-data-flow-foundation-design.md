---
title: Data-Flow Foundation — repository pattern + normalized persistence + uniform action layer
audience: [product, engineer, designer]
category: design-spec
status: delivered
last-reviewed: 2026-05-06
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Data-Flow Foundation

> **Architectural-decision spec.** Decides HOW data flows from user action → store → repository → persistence → render across BOTH apps. Sequenced as foundation slices F1–F6 that run alongside the canvas migration's PR8 Vision Alignment + PR9 cleanup. No backward-compatibility shims (we are still pre-production); each slice ships atomically with consumer refactors.

## 1. Context

ADR-078 commits to "same product, gated tiers" — PWA and Azure share state shapes, types, and stores; persistence implementation is the only tier difference. In practice, the persistence layer drifted:

- **PWA** persists a single `ProcessHub` JSON blob in Dexie (`apps/pwa/src/db/hubRepository.ts`, `id = 'hub-of-one'`). Every save rewrites the whole hub. Adding investigation-level filter state, multi-snapshot timelines, or canvas authoring grows the blob without bound.
- **Azure** uses 10+ Dexie tables (`apps/azure/src/db/schema.ts`) plus a sync queue. Per-entity writes; per-entity blob-storage round-trips.
- Stores reach **directly** into both — `useProjectStore.persistHub()` calls `hubRepository.saveHub(hub)` in the PWA, and Azure stores call `processHubsTable.put(...)` directly. ADR-078 D2 ("state shapes tier-agnostic; persistence implementation is the only tier gate") is honored at the type level but violated at the call-site level: the apps speak different persistence dialects to the same Zustand stores.

Three knock-on costs:

1. **Stat compute pipeline** is fine (pure-TS in `@variscout/core`), but **write paths** are scattered. Paste flow inlines an Immer recipe in `useEditorDataFlow.ts`. Investigation writes inline another in `investigationStore`. Canvas writes (per Canvas Migration spec Decision 2) are moving to discriminated-union actions — but only canvas. Three patterns for "change a hub."
2. **Atomic multi-table writes** become inexpressible. Pasting evidence with overlap-replace touches `evidenceSnapshots` + `rowProvenance` + (optionally) archives the prior snapshot. In PWA it's one blob rewrite, atomic by accident. In Azure it's three table writes — already at risk of inconsistency on browser close mid-write.
3. **Referential integrity** is implicit (everything embeds in the hub blob). When investigations become first-class loaded entities (deferred per ADR-078 D3) and findings/causal-links/suspected-causes reference each other by ID, we will need explicit cascade rules — and we have none.

The drift compounds with every feature. Slice 4 (framing-layer V1) added `investigation.metadata.{timelineWindow, scopeFilter, paretoGroupBy}` to keep filter state on the existing investigation entity rather than divergent app-specific stores. That worked but ate into the hub blob's surface. Canvas Spec 2 (manual canvas authoring) extended `ProcessMap` with assignments + arrows, again inside the blob. Every "small" addition makes the eventual normalization more expensive.

This spec locks the destination, the patterns, and the slice sequence.

**Pre-production invariant.** No production users; no migrations; no backward-compatibility shims. Per `feedback_no_backcompat_clean_architecture`: required props by default, refactor consumers atomically, fail-fast on builds. Existing dev-state PWA hubs and `.vrs` test fixtures are wiped/regenerated when F3 ships.

## 2. Architecture — four layers, one direction

```
┌──────────────────────────────────────────────────────────────────┐
│  UI components                                React components   │
│  (Dashboard, ProcessHubView, FrameView, EvidenceSheet, ...)      │
└────────────────┬─────────────────────────────────────────────────┘
                 │ subscribes via hooks
┌────────────────▼─────────────────────────────────────────────────┐
│  Stores                                            Zustand       │
│  (project, investigation, improvement, session, canvas,          │
│   wallLayout — 5 domain + 1 cross-app feature)                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │ dispatches actions
┌────────────────▼─────────────────────────────────────────────────┐
│  Repository interfaces                       @variscout/core     │
│  (HubRepository, InvestigationRepository,                        │
│   EvidenceSnapshotRepository, CanvasStateRepository, ...)        │
│                                                                  │
│  • dispatch(action: HubAction): Promise<void>                    │
│  • Cascade rules + transaction model + soft-delete               │
└────────────────┬─────────────────────────────────────────────────┘
                 │ implements
┌────────────────▼─────────────────────────────────────────────────┐
│  Persistence (tier-gated)                                        │
│  PWA: Dexie (normalized schema, opt-in)                          │
│  Azure: Dexie cache + Blob Storage sync via SAS tokens           │
└──────────────────────────────────────────────────────────────────┘
```

**Unidirectional flow.** UI subscribes → store derives → action dispatched → repository transactionally writes → store re-hydrates → UI re-renders. No "store mutates, then async fires-and-forgets to persistence" — that's how the PWA behaves today and it's the source of the worst race conditions. After the refactor, every write is a transaction the store waits on.

**One contract, two implementations.** `HubRepository` is an interface in `@variscout/core`. `PwaHubRepository` lives in `apps/pwa/src/persistence/`. `AzureHubRepository` lives in `apps/azure/src/persistence/`. Stores depend on the interface only — they cannot tell which one they're talking to.

## 3. Locked decisions

### D1. Repository pattern is the only persistence path

Stores never call `db.hubs.put(...)` or any persistence primitive directly. Every store call routes through a repository method. Direct persistence access in store code becomes a CI-checked rule (`packages/stores/CLAUDE.md` already prohibits app-specific imports; extend it to forbid `dexie`/`Dexie`/`Blob` imports outside repositories).

**Why:** without this rule, ADR-078 D2 is structurally unenforceable. The drift between PWA and Azure persistence dialects happened precisely because stores reached past the abstraction.

**How to apply:** F2 ships the interface set. Each store-facing PR checks consumers route through repos. ESLint rule (or grep-based pre-commit hook) ensures no `from 'dexie'` imports outside `apps/*/src/persistence/`.

### D2. Type-level normalization with required identity + lifecycle fields

Every entity gets:

```ts
interface EntityBase {
  id: string; // ULID per generateDeterministicId, never random
  createdAt: number; // Unix ms
  deletedAt: number | null; // soft-delete; null = live
}
```

Plus typed FK fields wherever entities reference each other:

```ts
interface Finding extends EntityBase {
  investigationId: Investigation['id']; // FK (typed-only; no DB-level constraint in Dexie)
  questionId?: Question['id']; // optional FK
  // ...
}

interface CausalLink extends EntityBase {
  investigationId: Investigation['id'];
  fromFindingId: Finding['id'];
  toCauseId: SuspectedCause['id'];
  // ...
}
```

**Required from day one** — not optional-with-fallback. Pre-production state means we just add them and refactor consumers in the same PR.

**Why:** required IDs unlock atomic per-entity writes (D5), referential integrity (D6), and CRDT readiness (D7). Required `createdAt`/`deletedAt` unlock soft-delete + undo without retrofitting.

**How to apply:** F1 adds the fields to all entity types in `@variscout/core`. Test fixtures + seed data update in the same PR. Type-only change at the persistence boundary (F3 then writes them); F2 wires up cascade rules.

### D3. Normalized persistence schema (mirrors Azure's table structure)

PWA Dexie schema becomes:

```ts
this.version(1).stores({
  hubs: '&id, deletedAt',
  outcomes: '&id, hubId, deletedAt',
  evidenceSnapshots: '&id, hubId, capturedAt, deletedAt',
  rowProvenance: '&id, snapshotId',
  evidenceSources: '&id, hubId, deletedAt',
  evidenceSourceCursors: '&id, sourceId',
  investigations: '&id, hubId, deletedAt',
  findings: '&id, investigationId, deletedAt',
  questions: '&id, investigationId, deletedAt',
  causalLinks: '&id, investigationId, deletedAt',
  suspectedCauses: '&id, investigationId, deletedAt',
  canvasState: '&hubId', // 1:1 with hub
  meta: '&key', // opt-in flag, app version, etc.
});
```

Azure schema gets the same shape; Azure additionally has `syncQueue`, `syncState`, `photoQueue`, `channelDriveCache` tables which are tier-gated implementation details PWA doesn't carry.

**Why:** Option A from the brainstorm — fully honors ADR-078 D2. The schemas DIFFER only in the cloud-sync overlay tables; everything else is identical. Per-entity writes; per-entity indexing; partial loads; finer-grained subscription invalidation.

**How to apply:** F3 (= PR7) declares this as Dexie `version(1)` in `apps/pwa/src/db/schema.ts`. Existing dev-state PWA users get their hubs wiped on first open after F3 deploy. No `.upgrade()` callback. Showcase data regenerates from `apps/pwa/src/seedData/` on demand.

### D4. Discriminated-union actions for ALL writes

Every write is an action dispatched into a repository. No in-component Immer recipes. No store-level `set()` that bypasses the repository.

```ts
// @variscout/core — central action surface
export type HubAction =
  // Outcome lifecycle
  | { type: 'outcome/add'; hubId: string; outcome: OutcomeSpec }
  | { type: 'outcome/update'; hubId: string; outcomeId: string; patch: Partial<OutcomeSpec> }
  | { type: 'outcome/archive'; hubId: string; outcomeId: string }

  // Evidence lifecycle
  | { type: 'evidence/addSnapshot'; hubId: string; snapshot: EvidenceSnapshot;
      provenance: RowProvenanceTag[]; replacedSnapshotId?: string }
  | { type: 'evidence/archiveSnapshot'; snapshotId: string }
  | { type: 'evidenceSource/add'; hubId: string; source: EvidenceSource }
  | { type: 'evidenceSource/updateCursor'; sourceId: string; cursor: string }

  // Investigation lifecycle
  | { type: 'investigation/create'; hubId: string; investigation: Investigation }
  | { type: 'investigation/updateMetadata'; investigationId: string;
      patch: Partial<Investigation['metadata']> }
  | { type: 'investigation/archive'; investigationId: string }
  | { type: 'finding/add'; investigationId: string; finding: Finding }
  | { type: 'finding/update'; findingId: string; patch: Partial<Finding> }
  | { type: 'question/add'; investigationId: string; question: Question }
  | { type: 'causalLink/add'; investigationId: string; link: CausalLink }
  | { type: 'suspectedCause/add'; investigationId: string; cause: SuspectedCause }

  // Canvas (matches Spec 2 — already discriminated-union)
  | { type: 'canvas/addStep'; hubId: string; step: ProcessMapStep }
  | { type: 'canvas/removeStep'; hubId: string; stepId: string }
  | { type: 'canvas/groupSubStep'; ... }
  | { type: 'canvas/setOpsMode'; hubId: string; mode: 'author' | 'read' }
  // ...
```

Each action has a single handler inside the repository; the handler runs in a Dexie transaction:

```ts
class PwaHubRepository implements HubRepository {
  async dispatch(action: HubAction): Promise<void> {
    return this.db.transaction('rw', this.allTables, async () => {
      switch (action.type) {
        case 'evidence/addSnapshot':
          await this.db.evidenceSnapshots.add(action.snapshot);
          await this.db.rowProvenance.bulkAdd(action.provenance);
          if (action.replacedSnapshotId) {
            await this.db.evidenceSnapshots.update(action.replacedSnapshotId, {
              deletedAt: Date.now(),
            });
          }
          break;

        case 'investigation/archive':
          await this.cascadeArchiveInvestigation(action.investigationId);
          break;

        // ...
      }
    });
  }
}
```

**Why:** atomic multi-table writes; uniform write-path mental model (paste = investigation write = canvas write at the dispatch layer); CRDT readiness via replayable action log; undo/redo for free; testability via mock repository.

**How to apply:** F2 ships the action-type union + repository interface. F3.5 unifies ingestion through `evidence/addSnapshot`. F5 extends coverage to remaining write surfaces. Canvas migration's actions land naturally as the same union (the canvas-side rename to `canvas/*` action types is a small breaking change F2 can absorb).

### D5. Three-layer state — Document / Annotation / View

Generalizes Canvas Migration spec Decision 2 to all state.

| Layer          | Examples                                                                                                                                                  | Persistence                                                     | Where it lives                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **Document**   | `ProcessHub` fields, `Outcome`, `EvidenceSnapshot`, `Investigation`, `Finding`, `CausalLink`, `SuspectedCause`, `Question`, `CanvasState.canonicalMap`    | Always persists                                                 | Document tables in repository                                   |
| **Annotation** | `Investigation.metadata.{timelineWindow, scopeFilter, paretoGroupBy}`, evidence chips selection, hub-level CoScout context, "favorite" investigation flag | Persists, but on a separate axis (per-investigation or per-hub) | Annotation columns on parent entity OR sibling annotation table |
| **View**       | Modal open/close, hover state, picker dropdown, transient selections, undo stack snapshots, last-clicked entity                                           | Session-only, never persists                                    | `useSessionStore` / per-component `useState`                    |

**Boundary rule:** if the user reloads the tab, did the state survive? If yes, Document or Annotation. If no, View. Annotation distinguishes from Document by being write-cheap and conceptually orthogonal — chip filters don't change "what the hub is," they change "how we're looking at it."

**Why:** without an explicit boundary, every new feature debates re-litigates "should this persist?" The slice 4 brainstorm spent real time on chip-state location precisely because there was no rule. With the rule, future feature design has a one-sentence answer.

**How to apply:** F4 codifies the boundary in store contracts. Existing state gets categorized per the table above. View state moves out of persisted stores (today some lives there transitionally). Annotation tables get explicit homes; today most ride on `investigation.metadata` and that pattern continues for investigation-scoped annotation.

### D6. Soft-delete + cascade rules at the repository layer

Every `delete` is `update({ deletedAt: Date.now() })`. Reads filter `deletedAt === null` by default. Cascade rules are declared in the repository:

```ts
const cascadeRules: Record<string, CascadeRule> = {
  hub: {
    cascadesTo: ['outcome', 'evidenceSnapshot', 'evidenceSource', 'investigation', 'canvasState'],
  },
  investigation: {
    cascadesTo: ['finding', 'question', 'causalLink', 'suspectedCause'],
  },
  evidenceSnapshot: {
    cascadesTo: ['rowProvenance'],
  },
  // ...
};
```

`HubRepository.dispatch` consults the table when handling `*/archive` actions; soft-marks all descendants in the same transaction.

**Why:** referential integrity in a normalized store. Without cascade, deleting an investigation strands its findings/links/questions as orphans pointing to a `deletedAt`-flagged parent. Soft-delete also gives undo ("unarchive investigation") for free + preserves audit trail.

**Hard-delete** is a separate `purgeArchived()` repository operation invoked on storage-quota recovery or explicit user "permanently delete" action. Never called automatically.

**How to apply:** F2 ships the cascade ruleset + handler. F4 + F5 wire UI affordances ("Archive investigation" / "Restore investigation").

### D7. CRDT-readiness via action log; not full event sourcing

Action log is THE write history. State is derived by replaying actions over an initial snapshot. This is the canvas migration spec's CRDT-readiness commitment, generalized.

**Not** full event sourcing — we keep snapshot tables as the read model. Reading current state is "scan tables," not "replay actions from t=0." Action log is an append-only log used for: (a) undo/redo; (b) `.vrs` export envelope; (c) future multi-tab + collaborative-edit sync.

**Why:** event sourcing is overkill at this scale; snapshot tables for reads are pragmatic. But action-log-as-source-of-truth-for-changes is the CRDT seed — when we want collaborative editing in Azure, we already have a replayable action stream, deterministic IDs, and explicit conflict points (only `*/update` actions need merge logic; `*/add` actions are commutative).

**How to apply:** F2 + F5 store dispatched actions to an `actionLog` table (`apps/*/src/db/`). Initial implementation: simple FIFO with a `keepLast` policy (e.g., last 1,000 actions) for memory bound. Multi-tab + collaborative-edit are deferred to F6+ named-future.

## 4. Compute pipeline — what stays, what becomes join-aware

Pure-TS compute layer in `@variscout/core` (capability, regression, defect, pareto/yMetrics, matchSummary, analysisStrategy) is **unchanged**. Functions are stateless over `(rows, columns, context)` and don't know about persistence. F1–F6 do not touch them.

**What changes: hooks become join-aware.** Today `useCapabilityData(hub)` reads `hub.evidenceSnapshots` and `hub.outcomes` from one in-memory blob. Tomorrow these are separate tables. We add one helper:

```ts
// @variscout/hooks
export function useDenormalizedHubView(hubId: string): DenormalizedHub {
  const hub = useHubStore(s => s.byId[hubId]);
  const outcomes = useOutcomeStore(s => s.byHubId[hubId]);
  const evidenceSnapshots = useEvidenceSnapshotStore(s => s.byHubId[hubId]);
  // ... join + memoize

  return useMemo(
    () => ({
      ...hub,
      outcomes,
      evidenceSnapshots,
      // matches the old blob shape, EXCEPT investigations + findings — those stay separate
    }),
    [hub, outcomes, evidenceSnapshots]
  );
}
```

Existing compute-side hooks (`useCapabilityData`, `useParetoChartData`, `useTimelineWindow`, etc.) get migrated to read from `useDenormalizedHubView` + investigation-scoped stores rather than from the blob. Their signatures don't change. The compute functions inside don't change.

**Memoization key shape changes.** Today: reference equality on `hub.evidenceSnapshots`. Normalized: per-snapshot ID + lastModified. Finer-grained — paste a new snapshot, only that snapshot's downstream hooks re-fire. Risk: wrong dependency arrays cause stale renders. Mitigation: typed selector helpers in `@variscout/hooks` so callers don't hand-roll dependency arrays.

## 5. Ingestion — F3.5 dedicated slice

Paste / file-upload / evidence-source-pull is the busiest write path and the most error-prone. It touches: paste classification, MatchSummaryCard, atomic multi-table write, provenance tagging, archived-row handling.

**Today's three implementations:**

- `apps/azure/src/features/data-flow/useEditorDataFlow.ts` (paste in editor)
- `apps/pwa/src/hooks/usePasteImportFlow.ts` (paste in PWA)
- (Future) Evidence-source-pull background ingestion

**After F3.5:** all three call `hubRepo.dispatch({ type: 'evidence/addSnapshot', ... })`. The action handler:

1. Reads `existingRange` from the most-recent snapshot (closes the slice 4 follow-up automatically).
2. Runs `archiveReplacedRows` if classifier returned `overlap-replace`.
3. Atomically inserts snapshot row + provenance tags + (optionally) marks replaced snapshot `deletedAt`.

UI layer simplifies to: classify paste → present MatchSummaryCard if needed → user confirms → dispatch one action. 200+ LOC of inline Immer recipes drop.

**Why this is its own slice (not part of F3):** F3 (PR7) is the schema cutover — declaring tables + wiring repo. F3.5 is the action-handler unification — refactoring the three paste call sites onto the dispatched action. Conceptually distinct; testable independently. Bundling them risks scope creep + harder review.

## 6. F-series sequencing

| #                     | Slice                                            | Scope                                                                                                                                                                                                                                                                                                       | Approx PR size                                                  |
| --------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **F1+F2**             | Type-level normalization + repository interfaces | Add `id`/`createdAt`/`deletedAt` + typed FKs to all entities in `@variscout/core`. Define `HubRepository` interface + `HubAction` union. First repository implementation per app (initially routing to existing storage; F3 swaps the persistence backend). Stores migrate from direct-Dexie to repo calls. | Large but mechanical (1 PR per app, then 1 unifying PR — 3 PRs) |
| **F3 = PR7**          | PWA Dexie normalized schema                      | `version(1)` with full table set per D3. PWA repo backend swaps from blob to normalized writes. Existing dev hubs wipe on first open. No migration code.                                                                                                                                                    | Medium (1 PR)                                                   |
| **F3.5**              | Ingestion action layer                           | Three paste call sites unified onto `evidence/addSnapshot`. `existingRange` wiring drops out automatically. Archived-row handling moves into repo.                                                                                                                                                          | Small-medium (1 PR)                                             |
| **F4**                | Three-layer state codification                   | Document/Annotation/View boundary explicit in store contracts. View state migrates out of persisted stores. Annotation tables / fields formalized.                                                                                                                                                          | Medium (1 PR)                                                   |
| **F5**                | Discriminated-union actions, full coverage       | Investigation writes (findings, questions, causalLinks, suspectedCauses) move to dispatched actions. Canvas already there. Outcome lifecycle aligned. Action log persisted (FIFO, 1,000-entry cap).                                                                                                         | Medium (1 PR per surface — 3-4 PRs total)                       |
| **F6 (named-future)** | Multi-investigation lifecycle                    | Investigations become first-class loaded entities. Tier-gated multi-investigation per ADR-078 D3. Soft-delete UI affordance. Action-log replay for cross-tab + collab edits.                                                                                                                                | Out of scope for this spec — opens its own brainstorm           |

**Parallelization with canvas migration.** Canvas migration's PR8 Vision Alignment + PR9 cleanup run in parallel with F1-F2 + F3.5 + F4. Canvas PRs touch UI surface (LayeredProcessView absorption, Wall mirror, hypothesis drawing); F-series PRs touch persistence + store internals. Conflict surface is small — both touch `canvasStore`, but F-series adds `canvasStore.dispatch()` shape that canvas migration is already moving toward.

**One worktree per parallel agent** per `feedback_one_worktree_per_agent`. F-series and canvas-migration get separate worktrees; Codex's Tier 1 fix work gets a third.

## 7. `.vrs` format implications

Current `.vrs` v1.0 (`packages/core/src/serialization/vrsFormat.ts`):

```ts
interface VrsFile {
  version: typeof VRS_VERSION;
  exportedAt: string;
  hub: ProcessHub;
  rawData?: Array<Record<string, unknown>>;
  metadata?: { exportSource: 'pwa' | 'azure'; appVersion: string };
}
```

Post-F3, the in-memory `hub: ProcessHub` is reconstructed from normalized tables via `useDenormalizedHubView`-like join logic. The `.vrs` envelope stays the same shape but is **constructed differently**:

- **Export:** `repo.collectVrsExport(hubId)` — runs a read transaction across all hub-scoped tables, joins into the legacy blob shape, writes the file.
- **Import:** parse `.vrs` → decompose blob into normalized rows → bulk-insert across tables in a write transaction.

**Format version bumps to 1.1** for clarity (export source now reports normalized origin, internal field shapes differ slightly per F1 type changes). Old v1.0 `.vrs` files are NOT readable post-F3. Pre-production: regenerate seed files from `apps/*/src/seedData/`. Test fixture `.vrs` files in `packages/core/src/serialization/__tests__/fixtures/` regenerate in the same PR as the format bump.

## 8. Known one-time costs

Pre-production refactor; some local state gets wiped:

- **Jukka's PWA dev hub.** Any real test data pasted into the PWA Hub-of-one (syringe-barrel, fill-weight, custom paste experiments) is wiped when F3 deploys. Mitigation: showcase data regenerates from seed; custom paste data needs to be re-pasted.
- **Saved `.vrs` files on disk.** Test fixtures + any developer-saved exports become unreadable. Mitigation: regenerate from seed; dev exports re-export post-F3.
- **Azure dev tenant data.** Azure Blob Storage hubs in the dev tenant migrate via the F3 PR's Azure-side schema swap. Recommendation: clear the dev tenant before F3 ships rather than write a one-off migration script.

These are **one-time** costs. Production deployment is out-of-scope for F1-F6; if/when we go production, the deferred work is a v1→v2 migration script + rolling-deploy strategy. Not in this spec.

## 9. Risks

| Risk                                                           | Probability | Mitigation                                                                                                                                                                                |
| -------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1+F2 PR scope balloons (touches every store + every consumer) | High        | Per-store sequence inside F2; one PR per app initially, then unifier PR. ESLint rule blocking direct Dexie imports outside repo prevents partial-fix drift.                               |
| Memoization regressions when hooks become join-aware           | Medium      | `useDenormalizedHubView` central join + typed selector helpers. Unit tests assert hook output stable when irrelevant tables update.                                                       |
| Canvas migration PR conflict                                   | Medium      | F-series and canvas migration share `canvasStore`. Coordinate by landing F1+F2 BEFORE canvas PR8; canvas PR8 then dispatches via repo from day one.                                       |
| Repository action handler bloat                                | Low         | Cascade rules declared as data, not code. Action handlers are short (3-10 lines) — most are `db.<table>.add(action.entity)`. Complex multi-table actions stay in dedicated handler files. |
| Browser closes mid-write (Dexie transaction rollback)          | Low         | Dexie auto-rolls-back on tab close mid-transaction. Dispatched action either fully commits or fully rolls back. UI shows pending state until promise resolves.                            |
| Action log unbounded growth                                    | Low         | FIFO cap at 1,000 entries (configurable). Hard-cap by row count, not byte size. Older actions purged on dispatch.                                                                         |
| Storage quota exceeded                                         | Low         | Repository surfaces `QuotaExceededError`. UI prompts user to "purge archived" (hard-delete soft-deleted rows) or export `.vrs` + clear. F4+ wires this UX.                                |

## 10. Out of scope (named-future)

- **Production migration strategy.** Pre-production refactor. If/when we ship to real users, write a v1→v2 migration script as a separate spec. Approach is straightforward (Dexie `.upgrade()` callback that decomposes blob into normalized rows) but the policy questions (rolling deploy, failure recovery, undo path) deserve their own brainstorm.
- **Multi-investigation lifecycle (F6).** Investigations as first-class loaded entities; tier-gated multi-investigation in Azure; PWA single-Hub-of-one stays single-investigation. Opens its own brainstorm.
- **Multi-tab live sync.** Dexie supports `liveQuery` broadcasting across tabs. Action log replay enables it. Out of scope for F1-F5; tie-in for F6.
- **Collaborative editing (CRDT).** Action log + deterministic IDs + cascade rules are the seeds. Full collab requires conflict resolution policy + presence + operational-transform-or-CRDT decision. Far-future.
- **Canvas authoring features.** Spec 2 (manual canvas authoring) covers these; this spec only covers the data-flow plumbing.
- **AI/CoScout context assembly.** AI tool definitions read from stores today; post-refactor they read from repos via stores. Tool definitions may need updating but the contract surface is unchanged. Audit + update is part of F5 if needed; otherwise unchanged.

## 11. References

- **Architectural foundation:** ADR-078 (PWA + Azure architecture alignment) — locks "same product, gated tiers" framing α.
- **Companion specs:**
  - Canvas Migration (`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`) — strangler-fig + three-layer state precedent; this spec generalizes Decision 2.
  - Manual Canvas Authoring (`docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md`) — canvas action-shape is the prototype for D4.
  - Vision (`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`) — destination informing F-series ordering.
  - Framing Layer (archived, `docs/archive/specs/2026-05-03-framing-layer-design.md`) — slice 4 introduced `investigation.metadata` annotation pattern (D5 codifies).
- **Constraints:**
  - ADR-073 (no statistical roll-up across heterogeneous units) — referential model must preserve per-(unit × context) cell shapes; normalized schema makes this easier, not harder.
  - ADR-077 (snapshot provenance + match-summary wedge) — `EvidenceSnapshot` + `RowProvenanceTag` shape from slice 3 is the persistence surface F3 normalizes.
- **Workflow rules:**
  - `feedback_no_backcompat_clean_architecture` — required props by default, atomic refactors.
  - `feedback_one_worktree_per_agent` — F-series and canvas migration get separate worktrees.
  - `feedback_subagent_driven_default` — implementation uses fresh-subagent-per-task with Sonnet workhorse + per-task spec/quality reviewers.

## 12. Verification (pre-implementation)

Spec is ready for plan-writing when:

- [x] Architecture diagram + four layers locked
- [x] Seven decisions (D1–D7) documented with why + how
- [x] Compute pipeline impact spelled out (what stays, what becomes join-aware)
- [x] Ingestion as F3.5 explicit
- [x] F-series sequencing table with PR-size estimates
- [x] `.vrs` format evolution captured (v1.0 → v1.1, no backward read)
- [x] Known one-time costs disclosed (Jukka's local data, dev fixtures)
- [x] Risk register with mitigations
- [x] Out-of-scope / named-future explicit
- [x] References to ADRs + companion specs + workflow rules

Plan-writing proceeds with F1+F2 as the first plan file. Subsequent F slices each get their own plan file as we approach them.
