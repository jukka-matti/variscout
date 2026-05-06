---
title: Data-Flow Foundation F3.5 Ingestion Audit
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-06
related:
  - docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
---

# F3.5 Ingestion Audit

> Read-only inventory of paste-flow call sites + consumer chains for the F3.5 `EVIDENCE_ADD_SNAPSHOT` dispatch refactor.

All file paths are repo-root relative. All line numbers verified against the worktree at commit `a527e795` (branch `data-flow-foundation-f3-5`, branched from main `65f26d10`).

---

## 1. PWA call-site map (`apps/pwa/src/hooks/usePasteImportFlow.ts`)

The hook is **660 lines** with a pure `useReducer` state machine (lines 72–117) for flow-UI states. Provenance-related call sites are confined to `acceptMatchSummary` (lines 411–500).

### 1a. Imports

| Line | Symbol | Role |
|------|--------|------|
| 22 | `archiveReplacedRows` from `@variscout/core/matchSummary` | **classifier-input + in-memory mutation** |
| 23 | `MatchSummaryClassification` | type only |
| 26 | `EvidenceSnapshot`, `RowProvenanceTag` from `@variscout/core/evidenceSources` | types only |

### 1b. Props that carry provenance state

| Line | Prop | Type | Direction | Role |
|------|------|------|-----------|------|
| 139 | `evidenceSnapshots?` | `EvidenceSnapshot[]` | **read** (prop-pass-through from caller) | Supplies `rowTimestampRange` to `classifyPaste` in `handlePasteAnalyze`. The most-recent snapshot's `rowTimestampRange` is forwarded as `existingRange`. |
| 151 | `setRowProvenance?` | `(startIndex: number, tags: RowProvenanceTag[]) => void` | **write** (prop-pass-through to caller) | Callback for multi-source join; caller receives the `RowProvenanceTag[]` array to store in session state. |

### 1c. Classifier-input site (Mode A.2 entry)

**`handlePasteAnalyze`** — lines 355–403:

```
existingRange: evidenceSnapshots?.at(-1)?.rowTimestampRange,
```

Line 375: reads `evidenceSnapshots?.at(-1)?.rowTimestampRange` and passes as `existingRange` into `classifyPaste(...)`. Role: **classifier-input / read**.

Dependency captured in the `useCallback` dep array at line 402: `[activeHub, evidenceSnapshots, rawData, _proceedWithParsedData]`.

### 1d. `RowProvenanceTag` construction — `multi-source-join` branch

**`acceptMatchSummary`** — lines 427–447 (within the `'multi-source-join'` case):

```ts
// Line 433
const tags: RowProvenanceTag[] = ms.newRows.map((_, i) => ({
  id: crypto.randomUUID(),        // NOT deterministic — see §6 surprise #1
  createdAt: now,
  deletedAt: null,
  snapshotId: '',                 // ← placeholder — F3.5 closes this
  rowKey: String(startIndex + i),
  source: sourceId,
  joinKey: choice.candidate.hubColumn,
}));
// Line 443
setRowProvenance?.(startIndex, tags);
```

Role: **write (provenance construction + prop callback)**. Cluster: `multi-source-join`.

### 1e. `archiveReplacedRows` call — `overlap-replace` branch

**`acceptMatchSummary`** — lines 473–474 (within the `'overlap-replace'` case):

```ts
const archived = archiveReplacedRows(overlapRows, importId);
const merged = [...nonOverlapRows, ...archived, ...ms.newRows];
```

`importId` is a `crypto.randomUUID()` generated at line 452. Role: **in-memory mutation only** — tags `__replacedBy` sentinel column onto overlap rows. No persistence side-effect today. Post-F3.5, this call survives for in-memory tag computation; the persistence-side replacement goes into the handler.

`archiveReplacedRows` is NOT called for any other branch (append, backfill, replace, no-timestamp, overlap-keep-both, multi-source-join). Cluster: `overlap-replace`.

### 1f. `existingRange` in `handlePasteAnalyze` dep closure

`evidenceSnapshots` is also captured at line 232 in the destructuring of `options` and at line 402 in the dep array of `handlePasteAnalyze`. No additional read site beyond line 375.

### 1g. Summary by classifier branch

| Branch | `RowProvenanceTag` constructed? | `archiveReplacedRows` called? | `setRowProvenance?` called? | `evidenceSnapshots` read? |
|--------|--------------------------------|-------------------------------|------------------------------|--------------------------|
| `multi-source-join` | yes (lines 433–442) | no | yes (line 443) | classifier-input (line 375) |
| `overlap-replace` | no | yes (line 473) | no | classifier-input (line 375) |
| `append` / `backfill` / `replace` / `no-timestamp` / `overlap-keep-both` | no | no | no | classifier-input (line 375) |
| `overlap-cancel` / `different-grain-cancel` / `different-grain-separate-hub` / `different-source-no-key-new-hub` | no | no | no | classifier-input (line 375) |

**P3 refactor scope:** All branches enter via the same `handlePasteAnalyze` classifyPaste call (line 375). The `multi-source-join` branch is the only one that calls `setRowProvenance?`. The `overlap-replace` branch calls `archiveReplacedRows` for in-memory tagging — this call survives post-F3.5 because it annotates the in-memory row array (sentinel column `__replacedBy`); the persistence side of replacement moves into the handler.

---

## 2. Azure call-site map (`apps/azure/src/features/data-flow/useEditorDataFlow.ts`)

The hook is **941 lines** with a larger `useReducer` (lines 76–189) reflecting Azure's richer flow states (append mode, file upload, project load, drill-to-measure). Provenance-related call sites are structurally identical to the PWA.

### 2a. Imports

| Line | Symbol | Role |
|------|--------|------|
| 25 | `archiveReplacedRows` from `@variscout/core/matchSummary` | **in-memory mutation** |
| 26 | `MatchSummaryClassification` | type only |
| 29 | `EvidenceSnapshot`, `RowProvenanceTag` from `@variscout/core/evidenceSources` | types only |

### 2b. Props that carry provenance state

| Line | Prop | Type | Direction | Role |
|------|------|------|-----------|------|
| 221 | `evidenceSnapshots?` | `EvidenceSnapshot[]` | **read** (prop-pass-through from caller) | Same as PWA: `rowTimestampRange` of last snapshot forwarded as `existingRange` to `classifyPaste`. |
| 239 | `setRowProvenance?` | `(startIndex: number, tags: RowProvenanceTag[]) => void` | **write** (prop-pass-through to caller) | Same as PWA: callback for multi-source join. |

### 2c. Classifier-input site

**`handlePasteAnalyze`** — line 550:

```
existingRange: evidenceSnapshots?.at(-1)?.rowTimestampRange,
```

Role: **classifier-input / read**. Dep array at line 577: `[activeHub, evidenceSnapshots, rawData, outcome, _proceedWithParsedData]`.

### 2d. `RowProvenanceTag` construction — `multi-source-join` branch

**`acceptMatchSummary`** — lines 606–616 (within the `'multi-source-join'` case):

```ts
// Line 606
const tags: RowProvenanceTag[] = ms.newRows.map((_, i) => ({
  id: crypto.randomUUID(),        // NOT deterministic — see §6 surprise #1
  createdAt: now,
  deletedAt: null,
  snapshotId: '',                 // ← placeholder — F3.5 wires this
  rowKey: String(startIndex + i),
  source: sourceId,
  joinKey: choice.candidate.hubColumn,
}));
// Line 616
setRowProvenance?.(startIndex, tags);
```

Role: **write (provenance construction + prop callback)**. Cluster: `multi-source-join`.

### 2e. `archiveReplacedRows` call — `overlap-replace` branch

**`acceptMatchSummary`** — lines 646–647:

```ts
const archived = archiveReplacedRows(overlapRows, importId);
```

`importId` is `crypto.randomUUID()` at line 625. Role: **in-memory mutation only**. Cluster: `overlap-replace`.

### 2f. Additional persistence write-path in Azure — `useStorage().saveEvidenceSnapshot`

**CRITICAL:** Azure has a **second persistence path** for `EVIDENCE_ADD_SNAPSHOT` that bypasses both `useEditorDataFlow` and `useEditorDataFlow`'s prop callbacks: the `saveEvidenceSnapshot` function exposed by `useStorage()` (context facade). This path is already routed through `azureHubRepository.dispatch` (see `apps/azure/src/services/storage.ts:660–688`) — the storage façade dispatches `EVIDENCE_ADD_SNAPSHOT` with `provenance: []` because it has no provenance context.

This path is called from:

- `apps/azure/src/components/ProcessHubEvidencePanel.tsx:203` — false-green snapshot upload (see §3.3 Third call site below)
- `apps/azure/src/components/ProcessHubEvidencePanel.tsx:344` — generic wizard new-source save

**These two call sites are NOT in `useEditorDataFlow` at all.** They are a completely independent ingestion surface that persists snapshots through `useStorage().saveEvidenceSnapshot` → `storage.ts:saveEvidenceSnapshot` → `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', provenance: [] })`. They do not handle provenance or `replacedSnapshotId`. This matters for P2 scope — see §6.

### 2g. `setRowProvenance?` is currently NOT passed by `Editor.tsx`

At `apps/azure/src/pages/Editor.tsx:566–595`, the call to `useEditorDataFlow(...)` does NOT include `setRowProvenance` in the options object. The prop is absent from the call site entirely, so `setRowProvenance` is effectively `undefined` in production today. This means `setRowProvenance?.(...)` at line 616 of `useEditorDataFlow.ts` is always a no-op (the `?` guard swallows the undefined).

This is not a bug introduced by F3.5 — it's the current state. D3's "keep props per D3" means this stays the same post-F3.5 for the Azure `useEditorDataFlow`-level props. But it does mean that the existing `multi-source-join` provenance tracking path in Azure is currently never exercised in production.

### 2h. Summary by classifier branch

| Branch | `RowProvenanceTag` constructed? | `archiveReplacedRows` called? | `setRowProvenance?` called? | `evidenceSnapshots` read? |
|--------|--------------------------------|-------------------------------|------------------------------|--------------------------|
| `multi-source-join` | yes (lines 606–615) | no | yes (line 616, but `undefined` in prod — see §2g) | classifier-input (line 550) |
| `overlap-replace` | no | yes (line 646) | no | classifier-input (line 550) |
| `append` / `backfill` / `replace` / `no-timestamp` / `overlap-keep-both` | no | no | no | classifier-input (line 550) |
| `overlap-cancel` / cancel variants | no | no | no | classifier-input (line 550) |

---

## 3. PWA consumer chain

### 3.1 Primary consumer: `apps/pwa/src/App.tsx`

`usePasteImportFlow` has **one production call site**: `apps/pwa/src/App.tsx:261–282`.

**Prop origins:**

| Prop passed | Source in `App.tsx` |
|-------------|---------------------|
| `rawData` | `useProjectStore(s => s.rawData)` (via destructuring at App mount) |
| `outcome` | `useProjectStore(s => s.outcome)` |
| `factors` | `useProjectStore(s => s.factors)` |
| `columnAliases` | `useProjectStore(s => s.columnAliases)` |
| `dataFilename` | `useProjectStore(s => s.dataFilename)` |
| `dataQualityReport` | `useProjectStore(s => s.dataQualityReport)` |
| `activeHub` | `sessionHub ?? undefined` — the session store's current hub |
| `evidenceSnapshots` | **hardcoded `undefined`** (line 271) — PWA has no snapshot persistence today (Spec 5/Q8) |
| `setRowProvenance` | **not passed** — the prop is absent from the call at lines 261–282 |
| `setRawData` | `useProjectStore(s => s.setRawData)` |
| `setOutcome` | `useProjectStore(s => s.setOutcome)` |
| `setFactors` | `useProjectStore(s => s.setFactors)` |
| `setSpecs` | `useProjectStore(s => s.setSpecs)` |
| `setDataFilename` | `useProjectStore(s => s.setDataFilename)` |
| `setDataQualityReport` | `useProjectStore(s => s.setDataQualityReport)` |
| `setColumnAliases` | `useProjectStore(s => s.setColumnAliases)` |
| `clearData` | `ingestion.clearData` |
| `clearSelection` | `useProjectStore(s => s.clearSelection)` |
| `applyTimeExtraction` | `ingestion.applyTimeExtraction` |

**Implication for P3 (D4 prop drop):**
- `evidenceSnapshots: undefined` → drop prop from interface; remove the literal `undefined` at line 271.
- `setRowProvenance` is already absent → no consumer cleanup needed in `App.tsx` for this prop.
- P3.3 sweep: **only `App.tsx` needs updating** (one call site).

### 3.2 Test-only caller: `apps/pwa/src/__tests__/modeB-stage1.test.tsx`

References `usePasteImportFlow` in comments only (lines 7, 9, 24) — the test skips the integration path as too complex for jsdom. No prop wiring to update.

**Full prop-flow path:**
```
App.tsx (composition root)
  → usePasteImportFlow({ evidenceSnapshots: undefined, /* setRowProvenance absent */ })
  → acceptMatchSummary (multi-source-join) → setRowProvenance?.() [no-op today]
  → acceptMatchSummary (overlap-replace) → archiveReplacedRows() [in-memory only]
```

---

## 4. Azure consumer chain

### 4.1 Primary consumer: `apps/azure/src/pages/Editor.tsx`

`useEditorDataFlow` has **one call site**: `apps/azure/src/pages/Editor.tsx:566–595`, via the re-export barrel at `apps/azure/src/hooks/useEditorDataFlow.ts` (which simply re-exports from the feature module at `apps/azure/src/features/data-flow/useEditorDataFlow.ts`).

**Prop origins:**

| Prop passed | Source in `Editor.tsx` |
|-------------|------------------------|
| `rawData`, `outcome`, `factors`, `specs`, etc. | Zustand `useProjectStore` selectors (via DataContext destructure) |
| `activeHub` | Derived at line 564: `processHubs.find(h => h.id === processContext?.processHubId)` — local `useState<ProcessHub[]>` list loaded from IndexedDB via `listProcessHubs()` |
| `evidenceSnapshots` | `hubEvidenceSnapshots` — local `useState<EvidenceSnapshot[]>` at line 446; loaded from IndexedDB via `listEvidenceSnapshotsFromIndexedDB(activeHubId)` in a `useEffect` at lines 462–481. Sorted ascending by `capturedAt` after reversing (DB returns descending). |
| `setRowProvenance` | **NOT PASSED** — absent from the options object at lines 566–595 |
| `handleFileUpload` | `ingestion.handleFileUpload` |
| `processFile` | `ingestion.processFile` |
| `loadSample` | `ingestion.loadSample` |
| `applyTimeExtraction` | `ingestion.applyTimeExtraction` |

**Downstream consumers of `dataFlow`:**

`dataFlow` (the `UseEditorDataFlowReturn` object) is spread into the return and threaded to:
- `apps/azure/src/components/editor/EditorDashboardView.tsx` — receives `UseEditorDataFlowReturn` as a prop (line 34, typed via the re-export)
- `apps/azure/src/components/editor/DashboardSection.tsx` — similarly typed
- `apps/azure/src/components/editor/EditorEmptyState.tsx` — similarly typed

None of these components reference `setRowProvenance` or `evidenceSnapshots` directly — they consume the flow actions (`handlePasteAnalyze`, `acceptMatchSummary`, etc.).

**Implication for P4 (D3 keep prop pattern):**

`setRowProvenance` is already absent from `Editor.tsx`'s call to `useEditorDataFlow`. Per D3, it stays absent. P4 should NOT add it. The prop remains on the hook's options interface for future F3.6 work when Azure gains a `rowProvenance` table and the caller is updated to pass a session-storage setter.

`evidenceSnapshots` is wired (line 579). It stays wired post-F3.5 for the classifier-input path (D1 says the handler reads `existingRange` itself, but the hook still needs `evidenceSnapshots` to run `classifyPaste` before dispatch). See §6 surprise #4 for the implication.

### 4.2 Third call site (independent ingestion surface — NOT in `useEditorDataFlow`)

`apps/azure/src/components/ProcessHubEvidencePanel.tsx` writes snapshots at two internal call sites (lines 203, 344) via `useStorage().saveEvidenceSnapshot(snapshot, rawText)`. This function routes through `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', snapshot, provenance: [] })` already (wired in `apps/azure/src/services/storage.ts:660–688`).

This third call site:
- Does NOT use `classifyPaste` — it writes directly from an evidence-source wizard.
- Does NOT construct `RowProvenanceTag` — provenance is empty array `[]`.
- Does NOT use `existingRange` — no temporal classification.
- Does NOT check `replacedSnapshotId` — no replacement cascade.
- Constructs snapshot ids as `\`snapshot-${snapshotNow}\`` (line 183) and `\`snapshot-${Date.now()}\`` (line 333) — non-deterministic, flagged in D7 as out of scope for F3.5.

**P4 scope implication:** This path does NOT need P4 refactoring — it already dispatches through the repository. However, the P2.1 Azure handler extension (adding `replacedSnapshotId` cascade) will also benefit this path once wired.

**Full prop-flow path:**
```
Editor.tsx (composition root, line 566)
  → useEditorDataFlow({ evidenceSnapshots: hubEvidenceSnapshots, /* setRowProvenance absent */ })
  → handlePasteAnalyze → classifyPaste (reads existingRange from evidenceSnapshots)
  → acceptMatchSummary (multi-source-join) → setRowProvenance?.() [no-op today, prop absent]
  → acceptMatchSummary (overlap-replace) → archiveReplacedRows() [in-memory only]

ProcessHubEvidencePanel.tsx (independent, via useStorage())
  → saveEvidenceSnapshot() → azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', provenance: [] })
  → applyAction.ts:146–149 [current: puts snapshot, no-op for provenance]
```

---

## 5. Test fixtures referencing the old shape

### 5.1 PWA paste-flow tests

**`apps/pwa/src/hooks/__tests__/usePasteImportFlow.provenance.test.ts`**
- Imports `RowProvenanceTag` (line 40).
- Passes `setRowProvenance` as a `vi.fn()` mock at lines 149, 207, 237, 266.
- Asserts `setRowProvenance` called with `(startIndex, tags)` at lines 177–183 (multi-source-join test) and lines 282–283 (tag validation test).
- The `tags` assertions check `snapshotId: ''` (implicit in the shape — the fixture asserts on `source` + `joinKey` + `rowKey`; does not explicitly assert `snapshotId === ''` but also does not assert it's populated).
- **P3.2 impact:** All `setRowProvenance` assertions must be replaced with assertions on `pwaHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` call shape. The `snapshotId` assertion opportunity arises: after P3 refactor, tags in the dispatch payload will still have `snapshotId: ''` at construction time (the handler populates it at write time). Tests should assert the dispatch shape, not the final persisted `snapshotId`.

**`apps/pwa/src/hooks/__tests__/usePasteImportFlow.overlapReplace.test.ts`**
- Constructs `EvidenceSnapshot` literals at lines 245–258 and 288–302 (two separate describe blocks; both use inline object literals with `id: 'snap-1'`, `hubId`, `sourceId`, `capturedAt`, `importedAt`, `createdAt`, `deletedAt: null`, `origin`, `rowCount`, and optionally `rowTimestampRange`).
- Passes `evidenceSnapshots` as a prop to `usePasteImportFlow(...)` at lines 261, 275, 304.
- **P3.2 impact:** `evidenceSnapshots` prop removal means these tests must no longer pass the prop. After D1, the handler reads `existingRange` itself. The `evidenceSnapshots`-wiring tests in this file (`describe('usePasteImportFlow — existingRange wiring')`) become obsolete for the caller-prop path — they should be moved to P1 applyAction tests that verify the handler's own DB query path. These test cases exist specifically to verify the `evidenceSnapshots` → `classifyPaste` wiring and will need to be re-targeted.

**`apps/pwa/src/hooks/__tests__/usePasteImportFlow.matchSummary.test.ts`**
- Does not reference `evidenceSnapshots` or `setRowProvenance` directly (verified by grep). Tests standard flow state machine behavior.

**`apps/pwa/src/hooks/__tests__/pasteFlowReducer.test.ts`**
- Pure reducer tests. No provenance references.

### 5.2 Azure paste-flow tests

**`apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.provenance.test.ts`**
- Imports `RowProvenanceTag` (line 40).
- Passes `setRowProvenance` as `vi.fn()` at lines 155, 212, 242, 271.
- Asserts `setRowProvenance` called at lines 183–185 (multi-source-join) and 287–288 (tag check).
- **P4.2 impact:** Post-F3.5, `setRowProvenance` prop is kept per D3 (Azure provenance stays session-only). However, the snapshot write should now also assert `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` was called alongside `setRowProvenance`.

**`apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.overlapReplace.test.ts`**
- Constructs `EvidenceSnapshot` literals at lines 253–266 and 296–310.
- Passes as `evidenceSnapshots` prop at lines 269, 283, 312.
- **P4.2 impact:** `evidenceSnapshots` prop stays on the Azure hook (D3 keeps it). These tests remain valid and should NOT be changed in scope of F3.5, as the `evidenceSnapshots` prop still flows from `Editor.tsx` on the Azure side.

**`apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.matchSummary.test.ts`**
- Does not reference `evidenceSnapshots` or `setRowProvenance` directly.

### 5.3 Existing repository-dispatch pattern used in PWA tests

**`apps/pwa/src/__tests__/outcomePinMulti.test.tsx`** and **`apps/pwa/src/__tests__/modeA1.test.tsx`**
- Both mock `pwaHubRepository.dispatch` via the module-scoped singleton pattern.
- P3.2 tests should follow the same pattern used here for mocking dispatch with `vi.mock('@variscout/core/persistence')` or the singleton-level mock documented in `apps/pwa/CLAUDE.md`.

**`apps/azure/src/features/evidenceSources/__tests__/useEvidenceSourceSync.test.ts`**
- Mocks `azureHubRepository.dispatch` at line 24 via `vi.mocked(azureHubRepository.dispatch)`. P4.2 should follow this pattern.

### 5.4 `EvidenceSnapshot` shape in Azure component tests

**`apps/azure/src/components/__tests__/ProcessHubEvidencePanel.test.tsx`**
- Mocks `saveEvidenceSnapshot` (the storage façade function), NOT `azureHubRepository.dispatch` directly. These tests mock the `useStorage()` context. Post-F3.5, the `saveEvidenceSnapshot` path already dispatches through the repository; no change needed to the component test — the storage façade mock remains appropriate since F3.5 only wires the applyAction handler, not the façade.

**`apps/azure/src/persistence/__tests__/cascadeArchive.test.ts`**
- Constructs `EvidenceSnapshot` literals via `makeEvidenceSnapshot(id, hubId, sourceId)` helper (line 51). Shapes used in P1.3 / P2.3 test scaffolding can mirror this factory function.

---

## 6. Surprises

### S1. `crypto.randomUUID()` for `RowProvenanceTag.id` — not `generateDeterministicId()`

Both paste flows construct `RowProvenanceTag.id = crypto.randomUUID()` (PWA:434, Azure:607). This is non-deterministic and violates the `feedback_fix_absorbed_violations_at_seam` rule — when the P3/P4 refactor rewrites these blocks, the IDs should switch to `generateDeterministicId()` from `@variscout/core/identity`. The plan text doesn't call this out explicitly; P3.1 / P4.1 implementers must be prompted to make this substitution.

Similarly, `importId = crypto.randomUUID()` (PWA:452, Azure:625) in the `overlap-replace` branch — this value is only used as a marker for `archiveReplacedRows`' `__replacedBy` sentinel column (in-memory only), so it stays non-persisted. But the deterministic-id rule applies here too if the marker becomes persisted in the future. **Flag in P3.1 + P4.1 task prompts.**

### S2. THIRD Azure snapshot write site — `ProcessHubEvidencePanel` already routes through dispatch, but with `provenance: []`

`apps/azure/src/components/ProcessHubEvidencePanel.tsx` lines 203 and 344 write snapshots via `useStorage().saveEvidenceSnapshot(snapshot, ...)`. This façade already calls `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', provenance: [] })` (storage.ts:665–670). The plan identified two Azure call sites (useEditorDataFlow + useEditorDataFlow-internal); this is a third distinct path.

**Scope impact:** P4 does NOT need to touch `ProcessHubEvidencePanel` for the snapshot-write routing — it's already dispatching. However:
- It uses `\`snapshot-${Date.now()}\`` for the snapshot id (line 333), a non-deterministic pattern flagged in D7 as "replaced when F4 absorbs the surface." This is confirmed present at both lines 183 and 333 and is out of scope for F3.5 per D7.
- It passes `provenance: []` with no `replacedSnapshotId`. Once P2.1 adds the replacement cascade to the Azure handler, this path will correctly no-op on `replacedSnapshotId` since it's undefined — no concern.
- **This path has no overlap-replace / multi-source-join logic.** It is a direct evidence-source write; no classifier runs, no `existingRange` consumed.

### S3. Azure `setRowProvenance` prop is NEVER populated in production

`Editor.tsx:566–595` calls `useEditorDataFlow(options)` without passing `setRowProvenance`. The prop defaults to `undefined`; the `setRowProvenance?.(...)` guard at lines 616 is always a no-op. This means the `multi-source-join` branch in Azure's `useEditorDataFlow` has **never triggered provenance tracking in production**. Per D3, F3.5 does NOT add `setRowProvenance` wiring to `Editor.tsx` — provenance stays session-only. But P4.1 + P4.2 task prompts should note that adding `azureHubRepository.dispatch` for the snapshot write is the new observable effect on the `multi-source-join` branch (not the provenance prop). This is intentional asymmetry per D3.

### S4. D1 (`existingRange` reads from handler) vs. current hook still needing `evidenceSnapshots` for `classifyPaste`

D1 says "the action handler reads `existingRange` itself from the most-recent live snapshot — closes the slice 4 follow-up." This is correct for the *persistence handler* — the handler will query the DB to find `existingRange` before writing.

However, `classifyPaste` is also called **in the hook** at classification time (before the user confirms a choice), and that call also needs `existingRange` (to determine whether to show the overlap-replace card at all). This is the `handlePasteAnalyze` call at line 375 (PWA) / line 550 (Azure).

**Implication:** For PWA, dropping `evidenceSnapshots` as a prop (D4) means the hook can no longer supply `existingRange` to `classifyPaste` at classification time. The hook will need to read `existingRange` from the repository directly, or the action payload needs to carry it explicitly to the classifier call. This is a non-trivial change to `handlePasteAnalyze` that the plan text does not address.

**Concrete resolution options for P3.1:**

- **Option A (recommended):** The hook calls `pwaHubRepository.evidenceSources.getLatestSnapshot(hubId)` (or equivalent) before calling `classifyPaste`, removing the dependency on the `evidenceSnapshots` prop entirely. This aligns with D1.
- **Option B:** The hook keeps a local state that is populated once on mount/hub-change via a `useEffect` querying the repository. Similar to how `Editor.tsx` already loads `hubEvidenceSnapshots`.
- **Option C:** The hook accepts a `getExistingRange: () => Promise<DateRange | undefined>` function prop (repo-injected). Avoids direct repo import in the hook.

On the Azure side (D3 keeps props), `evidenceSnapshots` stays as a prop, so the Azure hook does NOT have this problem for F3.5. Only the PWA hook removal (P3) triggers this issue.

**This is the most significant scope gap in the current plan and must be resolved before P3.1 dispatches.**

### S5. Plan line number drift check

The plan states (context block and "Existing surfaces touched" section) specific line numbers for `usePasteImportFlow.ts`:

| Plan claim | Actual location (verified) |
|-----------|---------------------------|
| `evidenceSnapshots` prop at lines 139, 232, 402 | Line 139 (interface), line 232 (destructuring), line 402 (dep array) — **MATCH** |
| `setRowProvenance` prop at lines 151, 243, 443 | Line 151 (interface), line 243 (destructuring), line 443 (call site in `multi-source-join`) — **MATCH** |
| `archiveReplacedRows` + `setRowProvenance?` blocks "around lines 433-475" | Lines 427–499 (the full `acceptMatchSummary` callback); `archiveReplacedRows` at line 473, `setRowProvenance?` at line 443 — **MATCH within range** |
| `apps/pwa/src/persistence/applyAction.ts:197-206` — current EVIDENCE_ADD_SNAPSHOT no-op | Actual no-op is lines 197–207 (grouped case with `EVIDENCE_ARCHIVE_SNAPSHOT` etc.) — **MATCH** |
| `apps/azure/src/persistence/applyAction.ts:146-150` — current EVIDENCE_ADD_SNAPSHOT | Lines 146–149 — **MATCH** |

All plan line-number claims hold against the current worktree. No drift detected.

### S6. `useEvidenceSourceSync.markSeen` — `createdAt` overwrite risk for D5 cursor handler

`apps/azure/src/features/evidenceSources/useEvidenceSourceSync.ts:65–87`: `markSeen` dispatches `EVIDENCE_SOURCE_UPDATE_CURSOR` with a cursor object that always sets `createdAt: now` (line 77). The D5 handler uses `db.evidenceSourceCursors.put(action.cursor)` which upserts. Repeated `markSeen` calls will overwrite the existing cursor's `createdAt` field with the current timestamp, which breaks the "created-at is a creation timestamp" invariant for subsequent markSeens.

This is flagged in the plan's D7 watchlist as a known concern. P5.3 should explicitly **not** fix it (per D7 scope), but the P5.1 handler implementation must not introduce a `createdAt` guard that would block the upsert. The existing test for `useEvidenceSourceSync` (line 24 mock) should be consulted when writing P5.3 test scaffolding.

### S7. PWA has no `EVIDENCE_SOURCE_UPDATE_CURSOR` caller today

Unlike Azure (where `useEvidenceSourceSync.markSeen` dispatches it), the PWA has no active dispatch of `EVIDENCE_SOURCE_UPDATE_CURSOR` in production code. The handler is wired in P5.1 for future use. P5.3's "verify the markSeen flow routes through these handlers cleanly" can only be demonstrated in the Azure test; the PWA test covers the handler in isolation.

### S8. `EvidenceSourceCursor` in PWA schema — `id` field is a stable synthetic key

`apps/pwa/src/persistence/PwaHubRepository.ts:180–185`: PWA's `evidenceSourceCursors` table is indexed `&id, sourceId`. The `getCursor` method queries via `where('hubId').equals(hubId).and(r => r.sourceId === sourceId)` — a post-filter (no compound index). The plan's P5.1 implementation note "Generate if missing: `action.cursor.id ?? generateDeterministicId()`" is correct. The Azure `useEvidenceSourceSync` cursor object already provides `id: \`cursor-${hubId}-${sourceId}\`` (line 76 of `useEvidenceSourceSync.ts`) — this is the stable synthetic key. P5.1 implementers should preserve this deterministic id pattern rather than generating a new UUID per put.

---

## Appendix: files touched by F3.5 (verification checklist)

| File | Status pre-F3.5 | F3.5 phase |
|------|----------------|-----------|
| `apps/pwa/src/persistence/applyAction.ts` | No-op stubs at lines 197–207 | P1.1, P1.2, P5.1 |
| `apps/azure/src/persistence/applyAction.ts` | Partial (EVIDENCE_ADD_SNAPSHOT snapshot-only at lines 146–149) | P2.1, P2.2, P5.2 |
| `apps/pwa/src/hooks/usePasteImportFlow.ts` | Props + archiveReplacedRows + setRowProvenance calls intact | P3.1 |
| `apps/azure/src/features/data-flow/useEditorDataFlow.ts` | Props + archiveReplacedRows + (no-op) setRowProvenance intact | P4.1 |
| `apps/pwa/src/App.tsx` | `evidenceSnapshots: undefined`; `setRowProvenance` absent | P3.3 |
| `apps/azure/src/pages/Editor.tsx` | `evidenceSnapshots: hubEvidenceSnapshots`; `setRowProvenance` absent | P4.3 (no setRowProvenance change needed; may need snapshot dispatch wiring) |
| `docs/investigations.md` | New entry pending | P2.4 |
| Test files (PWA): `usePasteImportFlow.provenance.test.ts`, `usePasteImportFlow.overlapReplace.test.ts` | Assert on `setRowProvenance` prop callback | P3.2 |
| Test files (Azure): `useEditorDataFlow.provenance.test.ts`, `useEditorDataFlow.overlapReplace.test.ts` | Assert on `setRowProvenance` prop callback; `evidenceSnapshots` prop stays | P4.2 |
| `apps/pwa/src/persistence/__tests__/applyAction.evidence.test.ts` | Does not exist | P1.3 (create) |
| `apps/azure/src/persistence/__tests__/applyAction.evidence.test.ts` | Does not exist | P2.3 (create) |
