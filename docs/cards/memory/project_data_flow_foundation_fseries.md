---
title: 'Data-Flow Foundation F-series (F1-F6 sequence)'
description: 'F1+F2+F3+F3.5+F3.6-β+F4 SHIPPED across 7 PRs (#130/#131/#132/#133/#134/#135/+PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_data_flow_foundation_fseries.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

[Data-Flow Foundation Spec](docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md) (status: **delivered** 2026-05-06) decides HOW data flows from user action → store → repository → persistence → render across both PWA + Azure. Operationalizes ADR-078 D2 ("state shapes tier-agnostic; persistence implementation is the only tier gate") at the call-site level. **F1+F2+F3+F3.5+F3.6-β+F4 SHIPPED across 7 PRs: PR #130 (F1 types, 2026-05-06) + PR #131 (F2 PWA, 2026-05-06) + PR #132 (F2 Azure + ESLint guard, 2026-05-06) + PR #133 (F3 PWA normalized schema cutover, 2026-05-06) + PR #134 (F3.5 ingestion action layer, 2026-05-07) + PR #135 (F3.6-β Azure rowProvenance parity + ETag concurrency, 2026-05-07) + PR #136 (three-layer state codification, 2026-05-07). F5-F6 remaining.**

**Locked architecture (load-bearing for all future entity + persistence work):**

- **4 layers, one direction.** UI subscribes → stores derive → action dispatched → repository transactionally writes → store re-hydrates → UI re-renders.
- **`HubAction` discriminator: `kind` field with SCREAMING_SNAKE_CASE values** (e.g., `EVIDENCE_ADD_SNAPSHOT`, `INVESTIGATION_ARCHIVE`). 36 kinds total across 10 sub-action files in `packages/core/src/actions/`. Future actions use `kind` not `type`; SCREAMING_SNAKE_CASE not `'domain/verb'`.
- **`EntityBase` contract** at `packages/core/src/identity.ts`: `{ id: string; createdAt: number; deletedAt: number | null }`. All hub-domain entities extend it. Required props (no optional id/createdAt/deletedAt). `createdAt: number` is Unix ms.
- **`generateDeterministicId()` in `@variscout/core/identity`** is the only ID source. Wraps `crypto.randomUUID()`; throws when unavailable. Removes the `Math.random` fallback that violated `packages/core/CLAUDE.md`. Rename to `generateEntityId()` is on the F3.6/F4 carry-forward list (D7) but has not happened yet.
- **`HubRepository` interface** at `packages/core/src/persistence/HubRepository.ts`: `dispatch(action: HubAction): Promise<void>` is the only write path; grouped read APIs (`hubs`, `outcomes`, `evidenceSnapshots`, `evidenceSources`, `investigations`, `findings`, `questions`, `causalLinks`, `suspectedCauses`, `canvasState`).
- **`cascadeRules` at `packages/core/src/persistence/cascadeRules.ts`** + `transitiveCascade(kind)` BFS helper covers 12 `EntityKind`s. Soft-delete via `deletedAt: number | null`.
- **Pre-production = no migration code.** Required props by default; consumers refactor atomically per `feedback_no_backcompat_clean_architecture`.

**Three-layer state (F4 codification — 6 stores, boundary enforced):**

F4 (branch `worktree-f4-three-layer-state`, 2026-05-07) operationalizes Data-Flow Foundation §3 D5. Every Zustand store in `packages/stores/` belongs to exactly one layer:

- **View layer (no persist):** `useViewStore` — transient selections (`selectedPoints`, `selectionIndexMap`, `focusedQuestionId`, `highlightedIdeaId`, `activeView`), expanded-id sets, pending chart focus, hover state. `STORE_LAYER = 'view'`.
- **Annotation-per-user layer (idb-keyval persist, `'variscout-preferences'` key):** `usePreferencesStore` — workspace tab, panel toggles, AI preferences, time lens, `riskAxisConfig`, `budgetConfig`. `STORE_LAYER = 'annotation-per-user'`.
- **Document layer (no persist middleware — persistence via repository dispatch):** `projectStore`, `investigationStore`, `canvasStore`. `STORE_LAYER = 'document'`. `wallLayoutStore` is `STORE_LAYER = 'view'` (canvas layout — transient).

**Locked decisions D1–D8:**
- D1: Physical store separation (one layer per store, enforced structurally).
- D2: `useSessionStore` split — transient fields → `useViewStore`; durable per-user fields → `usePreferencesStore`. Old `useSessionStore` fully deleted.
- D3: `useImprovementStore` deleted — `riskAxisConfig` + `budgetConfig` → preferences (now persist); `activeView` + `highlightedIdeaId` → view (transient).
- D4: `selectedPoints` / `selectionIndexMap` + 4 rich selection actions relocated from `projectStore` → `useViewStore`.
- D5: `focusedQuestionId` relocated from `investigationStore` → `useViewStore`.
- D6: `STORE_LAYER` constant (`'document' | 'annotation-per-user' | 'annotation-per-investigation' | 'view'`) added to all 6 stores.
- D7: `packages/stores/src/__tests__/layerBoundary.test.ts` enforces: no `persist` middleware on view stores; mandatory `persist` on annotation-per-user; no `persist` on document stores; all 6 stores export `STORE_LAYER`; no `useSessionStore` import anywhere.
- D8: `DocumentSnapshot` intersection type at `packages/stores/src/types/DocumentSnapshot.ts` — intersection of `ProjectStore`, `InvestigationStore`, `CanvasStore` document fields; pre-positioned for future `.vrs` export envelope.

**Behaviour delta (F4):** `riskAxisConfig` + `budgetConfig` now survive page reload (previously reset because `improvementStore` had no persist middleware). Intentional UX fix per spec D2. **Storage migration:** legacy `'variscout-session'` IDB blob dropped; `usePreferencesStore` writes `'variscout-preferences'`. Acceptable per `feedback_no_backcompat_clean_architecture` (pre-production). **Test count delta:** stores 286 → 250 (sessionStore.test.ts removed; 6 stores remain: projectStore + investigationStore + canvasStore + wallLayoutStore + useViewStore + usePreferencesStore). All packages green; `pnpm build` green.

**Surfaced investigations (F4):** two new entries added to `docs/investigations.md`: (1) per-app feature-store (`panelsStore.ts`) overlap with `usePreferencesStore`; (2) `wallLayoutStore.selection: Set<NodeId>` JSON round-trip hazard with Dexie.

**Per-app implementation reality:**

- **PWA** (`apps/pwa/src/persistence/`): `PwaHubRepository` + `applyAction.ts` Immer-on-blob recipes. Persists ONLY a single hub-of-one ProcessHub blob; investigations/findings/etc. are session-only Zustand state. `applyAction` handles HUB_*/OUTCOME_* with real mutations; everything else is documented no-op (F3 normalizes). `HUB_PERSIST_SNAPSHOT` is the bootstrap action — bypasses no-active-hub guard.
- **Azure** (`apps/azure/src/persistence/`): `AzureHubRepository` + `applyAction.ts` (per-action handlers across 36 kinds with `assertNever` exhaustiveness) + `cascadeArchive.ts` (Dexie transaction wrapper using `transitiveCascade` walker). Real Azure tables today: `processHubs`, `evidenceSources`, `evidenceSnapshots`, `evidenceSourceCursors`, `sustainmentRecords`, `sustainmentReviews`, `controlHandoffs`. Investigations/findings/questions/causalLinks/suspectedCauses are session-only (same as PWA — F3 normalizes both). The MEANINGFUL multi-table cascade Azure does today is `evidenceSource → evidenceSourceCursor`; `hub → {evidenceSources, evidenceSnapshots, evidenceSourceCursors}` via transitive walk.
- **Sustainment/handoff dispatch deferred:** no `SUSTAINMENT_*` or `HANDOFF_*` HubAction kinds in the union. Sustainment editors continue calling `services/localDb.ts` helpers directly (R13 allow-listed). F3 may unify under HubAction.
- **Storage facade boundary** (`apps/azure/src/services/storage.ts`): `saveProcessHub` / `saveEvidenceSource` / `saveEvidenceSnapshot` route IndexedDB writes through `azureHubRepository.dispatch`; cloud-sync calls (`saveXxxToCloud`) stay orthogonal. Bootstrap cache-fill loop in `listProcessHubs` (`storage.ts:548`) is the documented exception (cloud→local sync, not user-driven dispatch).
- **Atomicity for cascade actions:** `EVIDENCE_SOURCE_REMOVE` wraps cascade + parent update in a single `db.transaction('rw', [evidenceSources, evidenceSourceCursors, evidenceSnapshots, processHubs], ...)` — outer table list MUST be a superset of cascadeArchive's internal lock-set or Dexie 4 raises SubTransactionError. Pattern documented in `cascadeArchive.ts` JSDoc "Atomic call pattern (P5.3+)".

**ESLint repository-boundary guard (P7.2):**

- `eslint.config.js` `no-restricted-imports` rule blocks BOTH `dexie` package imports AND `**/db/schema` glob imports. The `db/schema` extension catches the `useEvidenceSourceSync.ts` pattern (importing `db` symbol from schema, bypassing dispatch).
- Allow-list per audit R12+R13: `apps/*/src/persistence/**`, `apps/*/src/db/**`, `apps/azure/src/services/{storage,localDb,cloudSync}.ts`, `apps/azure/src/lib/persistence.ts`, `packages/stores/src/wallLayoutStore.ts`. Test files exempt.
- Smoke-tested live: planted `import Dexie from 'dexie'` in `ProcessHubEvidencePanel.tsx` fired the rule with the actionable message.

**F-series sequence forward:**

- **F3 (PR #133)** — PWA Dexie normalized schema cutover SHIPPED 2026-05-06. New IDB DB `variscout-pwa-normalized` (renamed, not version-chained — old `variscout-pwa` orphans with best-effort `Dexie.delete` cleanup at construction). 13-table `version(1)` schema per spec D3. Narrow action coverage: only `HUB_*`/`OUTCOME_*` got real Dexie writes (plus `HUB_PERSIST_SNAPSHOT` decompose into hubs+outcomes+canvasState in a single `db.transaction('rw', ...)` with stale-row cleanup preserving F2's blob-replacement invariant). `canvasState` decomposed out of hub blob into 1:1 table; `joinHub` private helper re-attaches outcomes + canonicalProcessMap inside a `db.transaction('r', ...)` wrap. `HUB_UPDATE_*` loud-fail on missing hub (matches `OUTCOME_ADD` invariant). `evidenceSources.getCursor` post-filters by `hubId` (PWA `&id, sourceId` schema; Azure `[hubId+sourceId]` compound key). Opt-in helpers extracted to `apps/pwa/src/persistence/optIn.ts`; legacy `apps/pwa/src/db/hubRepository.ts` deleted.
- **F3.5 (PR #134) — SHIPPED 2026-05-07.** Ingestion action layer; both paste flows unified onto `EVIDENCE_ADD_SNAPSHOT` dispatch. **PWA atomic write inside `db.transaction('rw', [evidenceSnapshots, rowProvenance], ...)` closes the F1+F2 P1.3 `RowProvenanceTag.snapshotId = ''` placeholder gap** (ADR-077 amendment) — handler populates `snapshotId` from the freshly-written snapshot's id, plus cascades `deletedAt` to old snapshot + its provenance when `replacedSnapshotId` is set. **Azure asymmetric persistence** — handler writes snapshot only (no `rowProvenance` Dexie table; resolved in F3.6-β). **PWA paste flow** dropped `evidenceSnapshots?` + `setRowProvenance?` props; hook now reads `existingRange` + `priorSnapshotId` from `pwaHubRepository.evidenceSnapshots.listByHub()` at classification time and threads `priorSnapshotId` through matchSummary state to activate the cascade at accept time. **Azure paste flow** kept the props (D3 — Azure has no provenance table; session-only path retained until F3.6-β); both `overlap-replace` paths thread `replacedSnapshotId: evidenceSnapshots?.at(-1)?.id`. **EVIDENCE_SOURCE_UPDATE_CURSOR** wired in both apps — PWA id-keyed put with `id ?? generateDeterministicId()` defensive fallback; Azure compound-keyed put (already correct from F1+F2 — comment refresh only). `crypto.randomUUID()` → `generateDeterministicId()` at the absorbed-violations seam in both paste flows. Source: spec [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md) §5; plan [`docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md`](docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md); audit [`docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion-audit.md`](docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion-audit.md).
- **F3.6-β (PR #135) — SHIPPED 2026-05-07.** Azure `rowProvenance` parity via **envelope facet** + **cloud-sync** + **ETag optimistic concurrency**. **D1 envelope facet:** `provenance?: RowProvenanceTag[]` is now an optional field on `EvidenceSnapshot` itself (NOT a sibling Dexie table). OpenLineage / METS / image-header industry pattern; Azure Blob Storage has no native multi-object atomic transactions, so envelope is the only way to guarantee snapshot+provenance reach cloud atomically per paste. ADR-077 amendment 2026-05-07 codifies the shape change. **D5 ETag optimistic concurrency** on `_snapshots.json` per-source catalog (PD4 retarget: original D5 `_process_hubs.json` was wrong race surface) via new `updateBlobEvidenceSnapshotsConditional` in `apps/azure/src/services/blobClient.ts` — raw `fetch` `If-Match` header (PD3: no Azure SDK on client), 3-retry exponential backoff (100/200/400ms), typed `{ ok: true; etag } | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' }`. New event channel `subscribePasteConflict` in `cloudSync.ts` emits `PasteConflictEvent`. **F3.5 D3 asymmetry closed:** Azure `useEditorDataFlow` drops `evidenceSnapshots?` + `setRowProvenance?` props. **PasteConflictToast** mounted in `App.tsx` shell. **Opus final-branch review caught a CRITICAL:** stale `EvidenceSnapshot` fixture shape in test files — `tsc --noEmit` failed and `pnpm build` exited 2. Fixed in `2085fdd2`. Lesson: full `pnpm build` is part of pre-merge verification. **Test count delta:** core 3241 → 3246 (+5); azure 1188 → 1226 (+38). **Closes:** `docs/investigations.md` "Azure rowProvenance Dexie table — deferred" entry (now `[RESOLVED 2026-05-07]`). Source: PR #135 + plan [`docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md`](docs/superpowers/plans/2026-05-07-data-flow-foundation-f3-6-azure-provenance-parity.md) (status: delivered).
- **F4 (PR pending, branch `worktree-f4-three-layer-state`) — SHIPPED 2026-05-07.** Three-layer state codification. `useSessionStore` and `useImprovementStore` deleted; split into `useViewStore` (no persist) + `usePreferencesStore` (persist). `selectedPoints`/`selectionIndexMap`/`focusedQuestionId` relocated to view. `STORE_LAYER` consts on all 6 stores. `layerBoundary.test.ts` enforces the boundary. `DocumentSnapshot` intersection type pre-positioned for `.vrs` export. Behaviour delta: `riskAxisConfig` + `budgetConfig` now persist. Storage migration: `'variscout-session'` → `'variscout-preferences'`. Test count: stores 286 → 250. F4 spec `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` status: **delivered**.
- **F5 (named-future)** — sustainment/handoff dispatch coverage; add `SUSTAINMENT_*` + `HANDOFF_*` kinds to HubAction; migrate sustainment editors off direct localDb.ts.
- **F6 (named-future)** — multi-investigation lifecycle (deferred per ADR-078 D3).

**Plan-reality deltas absorbed during execution (documented in `docs/decision-log.md` 2026-05-06 entry):**

1. Sustainment/handoff dispatch deferred (no kinds in HubAction union).
2. P6 sub-tasks consolidated (call-site analysis showed only `services/storage.ts` facade + `useEvidenceSourceSync.ts` cursor were real migration targets; UI components calling `useStorage()` are auto-satisfied).
3. Bootstrap cache-fill at `storage.ts:548` left direct (cloud→local sync, not write-dispatch).
4. ESLint rule extended to also block `**/db/schema` (broader than original `dexie`-only spec).
5. `--chrome` walk deferred to user pre-merge.

**Cross-references:** ADR-078 (PWA + Azure architecture alignment) framing α; canvas migration spec (Decision 2 three-layer state precedent); ADR-077 (snapshot provenance — `RowProvenanceTag` reshape amended); `feedback_no_backcompat_clean_architecture`; `feedback_plan_grounded_in_actual_types`; `feedback_plan_call_site_reachability`; `feedback_partial_integration_policy`.
