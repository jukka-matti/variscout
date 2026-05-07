---
title: Data-Flow Foundation F3.5 — Ingestion Action Layer (paste / upload unified onto EVIDENCE_ADD_SNAPSHOT dispatch)
audience: [engineer]
category: implementation-plan
status: delivered
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2.md
  - docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md
  - docs/07-decisions/adr-077-snapshot-provenance-and-match-summary-wedge.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/decision-log.md
---

# Data-Flow Foundation F3.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Sonnet for implementer + spec/quality reviewer roles (≥70% of dispatches); Opus only for the final-branch code review and any task explicitly tagged `[OPUS]`.**

**Goal:** Unify the two paste call sites (`apps/pwa/src/hooks/usePasteImportFlow.ts`, `apps/azure/src/features/data-flow/useEditorDataFlow.ts`) onto a single `EVIDENCE_ADD_SNAPSHOT` action dispatch. PWA handler writes snapshot + `RowProvenanceTag` + (optional) replaced-snapshot `deletedAt` atomically inside a Dexie transaction; Azure handler writes snapshot only (Azure has no `rowProvenance` table; out of scope). The action handler reads `existingRange` itself from the most-recent live snapshot — closes the slice 4 follow-up automatically + closes the F3.5 wiring gap that left `RowProvenanceTag.snapshotId = ''` at construction time. UI layer simplifies to: **classify paste → present MatchSummaryCard → user confirms → dispatch one action.** ~200 LOC of inline Immer recipes drop from the PWA paste flow; Azure surface trims similarly.

**Architecture:** Single branch (`data-flow-foundation-f3-5`), single PR. **Schema unchanged** (F3 already declared the PWA `rowProvenance` table; Azure schema unchanged). Two app-side handlers in `apps/*/src/persistence/applyAction.ts` + two paste-flow refactors + one cursor-schema reconciliation in `EVIDENCE_SOURCE_UPDATE_CURSOR`. Smaller than F3 — the persistence schema is the load-bearing change F3 already shipped; F3.5 only wires the action handlers + call sites.

**Tech Stack:** TypeScript, Vitest + React Testing Library, Dexie 4 (existing `db.transaction('rw', ...)` patterns from F1+F2 PR3 + F3), pure-TS engine helpers (`archiveReplacedRows`, `classifyPaste`) from `@variscout/core`. No new dependencies.

---

## Context

[Data-Flow Foundation Spec](../specs/2026-05-06-data-flow-foundation-design.md) §5 ("Ingestion — F3.5 dedicated slice") commits to F3.5 unifying the three paste call sites. After F3 (PR #133, `65f26d10`) shipped the PWA Dexie normalized schema, the architectural prerequisite for atomic provenance writes is in place. F3.5 wires the action handler.

**Current state (post-F3):**

- `EVIDENCE_ADD_SNAPSHOT` handler in `apps/pwa/src/persistence/applyAction.ts:197-206` is a documented no-op with comment _"F3.5 implements"_. PWA Dexie has `evidenceSnapshots` + `rowProvenance` tables ready (declared in F3's `version(1)` schema) but writes are not yet wired.
- `EVIDENCE_ADD_SNAPSHOT` handler in `apps/azure/src/persistence/applyAction.ts:146-150` writes `db.evidenceSnapshots.put(action.snapshot)` only. Comment notes _"rowProvenance has no Azure Dexie table today (F3 normalizes); no-op for provenance."_
- `apps/pwa/src/hooks/usePasteImportFlow.ts` (660 lines) and `apps/azure/src/features/data-flow/useEditorDataFlow.ts` (941 lines) both:
  - Read `existingRange` via `evidenceSnapshots?.at(-1)?.rowTimestampRange` (passed in as a prop)
  - Call `archiveReplacedRows` from `@variscout/core/matchSummary/provenance` directly
  - Construct `RowProvenanceTag[]` inline and pass via a `setRowProvenance?` prop callback
  - Mutate hub state via local `useReducer` dispatch + caller-provided setters (NOT through the repository)
- `RowProvenanceTag.snapshotId = ''` is the documented placeholder at both paste call sites (per F1+F2 P1.3 ADR-077 amendment) — the snapshot doesn't exist when the tag is constructed today. F3.5's atomic handler closes this gap by constructing snapshot + provenance in one transaction with the snapshot's id available.

**F3 deferral notes (from F3 plan + memory):**

- F3 deliberately stayed scoped to `HUB_*`/`OUTCOME_*` handlers + `HUB_PERSIST_SNAPSHOT` decompose; `EVIDENCE_*`/`INVESTIGATION_*`/etc. all stayed no-op pending F3.5/F5.
- F3 was PWA-only (per spec §6 sequencing); Azure schema unchanged.
- Memory's F3.5 reconciliation point: _"F3.5 ingestion writers must branch on cursor schema (PWA id-keyed put + post-filter, Azure compound-keyed put)."_ This task picks that up in P5 below.

**Pre-production invariant.** No backward-compatibility shims. PWA dev hubs created post-F3 but pre-F3.5 will not have `rowProvenance` rows from prior pastes; the table starts empty. Acceptable; future paste flow populates from F3.5 forward. No migration code needed.

All file paths and line numbers below are verified against `main` at `65f26d10`.

---

## PR boundary

Single squash-merged PR off branch `data-flow-foundation-f3-5`. Phases P0 → P7 below all land on this branch in the same PR. Per-task spec/quality reviewers; final Opus review at P7.

---

## Locked decisions (this slice — F3.5 D1–D7)

### D1. Action handler reads `existingRange` itself; not caller-provided

`EVIDENCE_ADD_SNAPSHOT` action payload does NOT carry `existingRange`. The handler queries `evidenceSnapshots` table for the most-recent live snapshot (filter `deletedAt === null`, sort by `capturedAt` desc, limit 1) and reads `rowTimestampRange`. Passes it into `classifyPaste` as part of the per-handler classification re-run if needed.

**Why:** keeps the action payload tier-agnostic + keeps the read invariant inside the handler (the only place that knows the persistence layout). Caller doesn't need to thread `existingRange` through props. Closes the slice 4 follow-up automatically — every dispatch through the action picks it up.

**How to apply:** P1 + P2 handler implementations include the most-recent-snapshot query before applying classifier output.

### D2. PWA handler: full atomic write inside `db.transaction('rw', ...)`

PWA `EVIDENCE_ADD_SNAPSHOT` handler runs:

```ts
await db.transaction('rw', [db.evidenceSnapshots, db.rowProvenance], async () => {
  // 1. If action.replacedSnapshotId, mark its rowProvenance + the snapshot itself as deletedAt
  // 2. Insert the new snapshot row (db.evidenceSnapshots.put(action.snapshot))
  // 3. bulkPut RowProvenanceTag[] with snapshotId now populated (closes F3.5 gap)
});
```

The `archiveReplacedRows` runtime helper continues to exist for in-memory tag computation (the classifier still uses it), but the persistence-side replacement happens via `deletedAt` updates inside the transaction, not by mutating an in-memory tag list.

**Why:** atomic — no partial state where snapshot exists but provenance is missing. Closes the `RowProvenanceTag.snapshotId = ''` placeholder gap.

**How to apply:** P1.1 implements the handler. P1.2 covers `EVIDENCE_ARCHIVE_SNAPSHOT` (currently also a no-op) — also needs cascade to provenance.

### D3. Azure handler: snapshot only; provenance stays session-only

Azure has no `rowProvenance` Dexie table today. F3 was PWA-only per spec §6 sequencing; Azure normalization is its own slice (out of scope here). F3.5 Azure handler:

```ts
case 'EVIDENCE_ADD_SNAPSHOT': {
  // existingRange query + classifier re-run as in PWA (D1)
  if (action.replacedSnapshotId) {
    await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: Date.now() });
  }
  await db.evidenceSnapshots.put(action.snapshot);
  // rowProvenance stays session-only via existing setRowProvenance prop callback
  return;
}
```

**Asymmetric persistence; symmetric call-site pattern.** Both apps dispatch the same action; PWA persists provenance, Azure doesn't. The action surface is unified; the persistence implementation differs (per ADR-078 D2).

**Why:** keeps F3.5 scope contained. Adding `rowProvenance` to Azure schema is a parallel slice that doesn't depend on F3.5 — call it F3.6 or fold into F4.

**How to apply:** P2 implements the Azure handler with the asymmetric persistence note in JSDoc + a follow-up entry in `docs/investigations.md` flagging "Azure rowProvenance table — defer to F3.6 or F4."

### D4. PWA paste flow drops `setRowProvenance?` + `evidenceSnapshots?` prop pass-through

`apps/pwa/src/hooks/usePasteImportFlow.ts` currently accepts `evidenceSnapshots?: EvidenceSnapshot[]` + `setRowProvenance?: (startIndex: number, tags: RowProvenanceTag[]) => void` as props (lines 139, 151, 232, 243). Both are caller-provided in the PWA Dashboard wiring.

After F3.5:

- `evidenceSnapshots` no longer needed (handler reads from repo)
- `setRowProvenance` no longer needed (handler writes to repo)
- Hook signature simplifies; consumers in `apps/pwa/src/components/Dashboard.tsx` etc. drop the prop pass-through.

**Why:** the spec §5 promise of "200+ LOC of inline Immer recipes drop" depends on this. Without it, F3.5 just centralizes writes inside the handler but call sites keep doing the same prop dance — the diff would be marginal.

**How to apply:** P3 simplifies the hook signature + sweeps consumers. Azure does NOT drop these props yet (because Azure handler can't persist provenance — see D3); P4 keeps the Azure prop pattern but routes the snapshot write through dispatch.

### D5. `EVIDENCE_SOURCE_UPDATE_CURSOR` cursor schema reconciliation

Per memory's F3.5 reconciliation point: PWA's `evidenceSourceCursors` table uses `&id, sourceId` (id-keyed primary; secondary index on sourceId). Azure's uses `[hubId+sourceId]` compound key. The action handler in each app branches on the storage layout:

- **PWA** `EVIDENCE_SOURCE_UPDATE_CURSOR`: write `db.evidenceSourceCursors.put({ ...cursor, id: cursor.id ?? generateDeterministicId() })`. Reads via `evidenceSources.getCursor(hubId, sourceId)` post-filter on `hubId` (per F3 implementation).
- **Azure** `EVIDENCE_SOURCE_UPDATE_CURSOR`: write `db.evidenceSourceCursors.put(cursor)` — Dexie auto-resolves the compound key from `cursor.hubId` + `cursor.sourceId`.

The action payload shape stays identical. The handler's persistence call differs.

**Why:** memory called this out explicitly as F3.5 work. Pre-F3.5 the handlers in both apps are documented no-ops; F3.5 wires both paths.

**How to apply:** P5 implements both handler bodies + tests covering each app's read-back path.

### D6. Single PR, one branch

`data-flow-foundation-f3-5` branched off main at `65f26d10`. All P0–P7 land on this branch. Squash-merge after CI + Opus final review (P7).

**Why:** F3.5 is a focused refactor — handler + 2 call sites + cursor reconciliation. Splitting into multiple PRs adds review overhead without atomicity benefit.

### D7. Out of scope

- **Adding `rowProvenance` table to Azure** — per D3, this is a separate slice (F3.6 / F4 territory).
- **Future evidence-source-pull background ingestion** — when this lands, it plugs into the same `EVIDENCE_ADD_SNAPSHOT` action; F3.5 doesn't build the consumer.
- **F4 three-layer state codification** — Document/Annotation/View boundary; separate slice.
- **F5 — `SUSTAINMENT_*`/`HANDOFF_*` action kinds + investigation/finding/etc. action handler bodies** — separate slice.
- **`generateDeterministicId` → `generateEntityId` rename** — flagged Important by P1 reviewers; carry into F3.6 or F4 (not blocking F3.5).
- **`'general-unassigned'` runtime guard** — repository-layer check; can land in F3.6 or F5.
- **`useEvidenceSourceSync.markSeen` `createdAt` overwrite** — F4 normalization concern.
- **`id: \`snapshot-${Date.now()}\``in`ProcessHubEvidencePanel.tsx:333`** — replaced when F4 absorbs the surface.

---

## File structure

### Created

| Path                                                                                                                                     | Phase | Responsibility                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion-audit.md`                                                         | P0    | Output of P0 audit phase — call-site map for both paste flows + EVIDENCE_ADD_SNAPSHOT consumer trace                 |
| `apps/pwa/src/persistence/__tests__/applyAction.evidence.test.ts`                                                                        | P1.3  | Coverage for PWA `EVIDENCE_ADD_SNAPSHOT` + `EVIDENCE_ARCHIVE_SNAPSHOT` handlers (atomic write, replacement, cascade) |
| `apps/azure/src/persistence/__tests__/applyAction.evidence.test.ts` (verify path; may exist as part of P1.4 azure handler tests already) | P2.3  | Azure handler coverage (snapshot only — no provenance assertion since out of scope per D3)                           |

### Modified

| Path                                                                                  | Phase            | Action                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/pwa/src/persistence/applyAction.ts`                                             | P1.1, P1.2, P5.1 | Implement `EVIDENCE_ADD_SNAPSHOT` (atomic snapshot + provenance + replaced cascade per D2); implement `EVIDENCE_ARCHIVE_SNAPSHOT` (cascade to provenance); implement `EVIDENCE_SOURCE_UPDATE_CURSOR` (id-keyed put per D5)                                                                     |
| `apps/azure/src/persistence/applyAction.ts`                                           | P2.1, P2.2, P5.2 | Extend `EVIDENCE_ADD_SNAPSHOT` (existingRange read + replaced cascade per D3); extend `EVIDENCE_ARCHIVE_SNAPSHOT` (already does soft-delete); implement `EVIDENCE_SOURCE_UPDATE_CURSOR` (compound-keyed put per D5)                                                                            |
| `apps/pwa/src/hooks/usePasteImportFlow.ts`                                            | P3.1             | Refactor: replace `archiveReplacedRows` + inline `RowProvenanceTag[]` construction + `setRowProvenance?` calls with single `pwaHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` per D4. Drop `evidenceSnapshots?` + `setRowProvenance?` props from hook signature               |
| `apps/pwa/src/hooks/__tests__/usePasteImportFlow.test.ts` (verify path)               | P3.2             | Update tests — mock `pwaHubRepository.dispatch` instead of the prop callbacks. Assert dispatch called with correct action shape                                                                                                                                                                |
| `apps/pwa/src/components/Dashboard.tsx` (verify path)                                 | P3.3             | Drop the prop pass-through to `usePasteImportFlow` for `evidenceSnapshots` + `setRowProvenance` (no longer accepts them)                                                                                                                                                                       |
| `apps/azure/src/features/data-flow/useEditorDataFlow.ts`                              | P4.1             | Refactor: route the snapshot persistence through `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` per D3. Keep `setRowProvenance?` prop pattern (Azure provenance stays session-only)                                                                                     |
| `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.test.ts` (verify path) | P4.2             | Update tests — mock dispatch + verify action payload                                                                                                                                                                                                                                           |
| `docs/investigations.md`                                                              | P2.4             | New entry: "Azure `rowProvenance` Dexie table — deferred to F3.6 or F4. F3.5's `EVIDENCE_ADD_SNAPSHOT` handler in Azure persists snapshot only; provenance stays session-only via existing `setRowProvenance` prop. Asymmetric persistence vs PWA accepted for F3.5 scope. Logged 2026-05-06." |

---

## Sequencing

Per `superpowers:subagent-driven-development`. **Sonnet workhorse ≥ 70%.** One worktree at `.worktrees/data-flow-foundation-f3-5/`, single squash-merged PR.

### Phase P0 — Audit (read-only, single dispatch)

- [ ] **Task P0.1** _(Sonnet, general-purpose, Explore-style scope: thorough)_ — Read both paste flows (`apps/pwa/src/hooks/usePasteImportFlow.ts`, `apps/azure/src/features/data-flow/useEditorDataFlow.ts`) and produce `docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion-audit.md` with:
  1. **Call-site map (PWA):** every place in `usePasteImportFlow.ts` that constructs a `RowProvenanceTag`, calls `archiveReplacedRows`, reads `evidenceSnapshots`, or calls `setRowProvenance`. File path + line range + intent (read / write / classifier-input).
  2. **Call-site map (Azure):** same for `useEditorDataFlow.ts`.
  3. **Consumer chain (PWA):** trace where `evidenceSnapshots` + `setRowProvenance` props originate. `apps/pwa/src/components/Dashboard.tsx` is the likely composition root; verify.
  4. **Consumer chain (Azure):** same. Likely `apps/azure/src/pages/Editor.tsx` or feature-store.
  5. **Test fixtures referencing the old shape:** any test file constructing `EvidenceSnapshot` or `RowProvenanceTag` literals OR mocking `setRowProvenance` callback.
  6. **Surprises section:** anything that changes the F3.5 plan scope (e.g., a third paste-style call site we missed, a hook that depends on `setRowProvenance` returning sync, etc.).

  **Acceptance:** audit doc committed; subsequent phases reference it.

  **Why:** F1+F2's P0 audit caught 15 plan-revising findings; same pattern here. Cheaper than mid-flight pivots.

### Phase P1 — PWA EVIDENCE_ADD_SNAPSHOT handler (atomic per D2)

- [ ] **Task P1.1** _(Sonnet)_ — Implement `EVIDENCE_ADD_SNAPSHOT` in `apps/pwa/src/persistence/applyAction.ts` per D1 + D2:

  ```ts
  case 'EVIDENCE_ADD_SNAPSHOT': {
    await db.transaction('rw', [db.evidenceSnapshots, db.rowProvenance], async () => {
      const now = Date.now();

      // Cascade: if replacing, mark replaced snapshot + its provenance rows
      if (action.replacedSnapshotId) {
        await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: now });
        const replacedTags = await db.rowProvenance
          .where('snapshotId').equals(action.replacedSnapshotId)
          .toArray();
        if (replacedTags.length > 0) {
          await db.rowProvenance.bulkUpdate(
            replacedTags.map(t => ({ key: t.id, changes: { deletedAt: now } }))
          );
        }
      }

      // Insert the new snapshot
      await db.evidenceSnapshots.put(action.snapshot);

      // Insert provenance tags with snapshotId now populated (closes F3.5 wiring gap)
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
  ```

  Replace the existing no-op + comment.

- [ ] **Task P1.2** _(Sonnet)_ — Implement `EVIDENCE_ARCHIVE_SNAPSHOT` (currently no-op):

  ```ts
  case 'EVIDENCE_ARCHIVE_SNAPSHOT': {
    await db.transaction('rw', [db.evidenceSnapshots, db.rowProvenance], async () => {
      const now = Date.now();
      await db.evidenceSnapshots.update(action.snapshotId, { deletedAt: now });
      const tags = await db.rowProvenance
        .where('snapshotId').equals(action.snapshotId)
        .toArray();
      if (tags.length > 0) {
        await db.rowProvenance.bulkUpdate(
          tags.map(t => ({ key: t.id, changes: { deletedAt: now } }))
        );
      }
    });
    return;
  }
  ```

- [ ] **Task P1.3** _(Sonnet)_ — Tests in `apps/pwa/src/persistence/__tests__/applyAction.evidence.test.ts`:
  - `EVIDENCE_ADD_SNAPSHOT inserts snapshot + provenance atomically` — dispatch action with 3 tags; assert `db.evidenceSnapshots.get(id)` returns the snapshot and `db.rowProvenance.where('snapshotId').equals(id).count()` returns 3 with `snapshotId` populated.
  - `EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId cascades deletedAt to provenance` — pre-seed a snapshot + tags, dispatch with replacement, assert old snapshot + tags have `deletedAt` set.
  - `EVIDENCE_ADD_SNAPSHOT rolls back on failure` — force a transaction error mid-write, assert no partial state.
  - `EVIDENCE_ARCHIVE_SNAPSHOT cascades to provenance`
  - Use deterministic literal IDs + timestamps (no `Date.now()` in fixture value positions; literal `1714000000000`-style numbers).

- [ ] **Task P1.4** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review of P1.

### Phase P2 — Azure EVIDENCE_ADD_SNAPSHOT handler (snapshot only per D3)

- [ ] **Task P2.1** _(Sonnet)_ — Extend `EVIDENCE_ADD_SNAPSHOT` in `apps/azure/src/persistence/applyAction.ts`:

  ```ts
  case 'EVIDENCE_ADD_SNAPSHOT': {
    if (action.replacedSnapshotId) {
      await db.evidenceSnapshots.update(action.replacedSnapshotId, { deletedAt: Date.now() });
    }
    await db.evidenceSnapshots.put(action.snapshot);
    // F3.5 D3: rowProvenance stays session-only — Azure has no rowProvenance table.
    // Caller continues to use setRowProvenance prop for in-memory tag tracking.
    // Adding the table is deferred to F3.6 or F4 (logged in docs/investigations.md).
    return;
  }
  ```

  Update the JSDoc to reflect F3.5 wiring.

- [ ] **Task P2.2** _(Sonnet)_ — Verify `EVIDENCE_ARCHIVE_SNAPSHOT` already does the right thing (`db.evidenceSnapshots.update(action.snapshotId, { deletedAt: Date.now() })` per current code at line 156). No change required; just update the comment to reflect F3.5 scope.

- [ ] **Task P2.3** _(Sonnet)_ — Tests in `apps/azure/src/persistence/__tests__/applyAction.evidence.test.ts` (or extend existing P5 test file):
  - `EVIDENCE_ADD_SNAPSHOT inserts snapshot` — assert `db.evidenceSnapshots.get(id)` returns the snapshot.
  - `EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId marks old snapshot deletedAt`
  - **No assertion on provenance** (D3 — out of scope for Azure).

- [ ] **Task P2.4** _(Sonnet)_ — Add an entry to `docs/investigations.md`:

  > **Azure `rowProvenance` Dexie table — deferred.** F3.5's `EVIDENCE_ADD_SNAPSHOT` handler in Azure persists snapshot only; provenance tracking stays session-only via the existing `setRowProvenance` prop callback. Asymmetric persistence vs PWA (which atomically writes provenance) is accepted for F3.5 scope. Adding the table requires Azure schema bump + cascade-rule consumer. **Action:** target F3.6 (Azure normalization parity) or F4. _Logged 2026-05-06._

- [ ] **Task P2.5** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P3 — PWA paste flow refactor (D4 prop drop)

- [ ] **Task P3.1** _(Sonnet)_ — Refactor `apps/pwa/src/hooks/usePasteImportFlow.ts`:
  - Drop `evidenceSnapshots?: EvidenceSnapshot[]` from hook props (lines 139, 232, 402)
  - Drop `setRowProvenance?: (startIndex: number, tags: RowProvenanceTag[]) => void` from props (lines 151, 243, 443)
  - Replace inline `archiveReplacedRows(...)` + `setRowProvenance?.(...)` blocks (around lines 433-475) with single `pwaHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', hubId, snapshot, provenance, replacedSnapshotId? })`
  - Construct the snapshot + provenance tags inline before dispatch (existing logic; just the persistence path changes)
  - Remove `archiveReplacedRows` import (no longer needed at this site — handler handles cascade)
  - Keep the `useReducer` for paste-flow state machine; only the persistence-side calls change

  Verify the refactor preserves all classifier branches (overlap-replace, append, columns-merge, wide-format, defect-detection, yamazumi-detection).

- [ ] **Task P3.2** _(Sonnet)_ — Update tests in `apps/pwa/src/hooks/__tests__/usePasteImportFlow.test.ts` (verify path):
  - Mock `pwaHubRepository.dispatch` via `vi.mock('@variscout/core/persistence', ...)` or the singleton-mock pattern documented in `apps/pwa/CLAUDE.md`
  - Replace assertions on `setRowProvenance` callback with assertions on `dispatch` call args (action shape, snapshot id, provenance length)
  - Verify all classifier branches still trigger the correct dispatch payload

- [ ] **Task P3.3** _(Sonnet)_ — Sweep consumers of `usePasteImportFlow`:
  - Find every caller via grep: `grep -rn "usePasteImportFlow" apps/pwa/src/`
  - Drop `evidenceSnapshots` + `setRowProvenance` from prop pass-throughs
  - Likely `apps/pwa/src/components/Dashboard.tsx` is the primary consumer

- [ ] **Task P3.4** _(Sonnet)_ — Manual `claude --chrome` walk in PWA per `feedback_verify_before_push`:
  - Open existing showcase data; verify rendering unchanged
  - Paste new CSV via Mode A.1 paste; verify Stage 1+2+3 flow + persistence (Save to browser)
  - Reload tab; verify hub restored + paste persisted via repo (open IndexedDB devtools panel, confirm `evidenceSnapshots` + `rowProvenance` rows exist with deterministic-IDs and proper `snapshotId` linkage)
  - Paste a second CSV with overlapping time range → MatchSummaryCard appears → choose "Replace overlap" → verify old snapshot + provenance get `deletedAt` set + new snapshot + new provenance rows insert (open IndexedDB to confirm both branches)

- [ ] **Task P3.5** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P4 — Azure paste flow refactor (D3 keep prop pattern; route snapshot through dispatch)

- [ ] **Task P4.1** _(Sonnet)_ — Refactor `apps/azure/src/features/data-flow/useEditorDataFlow.ts`:
  - Replace inline snapshot persistence (currently happens via `useStorage().saveProcessHub` route or similar) with `azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', hubId, snapshot, provenance, replacedSnapshotId? })`
  - **Keep** `evidenceSnapshots?` + `setRowProvenance?` props per D3 — Azure provenance stays session-only; the prop pattern is the in-memory tracking surface
  - Remove `archiveReplacedRows` import only if no longer used at this site (handler handles persistence-side cascade; in-memory tag list still uses it via the prop callback)
  - Verify all classifier branches preserve behavior

- [ ] **Task P4.2** _(Sonnet)_ — Update tests in `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.test.ts` (verify path):
  - Mock `azureHubRepository.dispatch`
  - Verify `EVIDENCE_ADD_SNAPSHOT` dispatched with correct payload per classifier branch
  - Existing `setRowProvenance` prop coverage stays (still in use for session tracking)

- [ ] **Task P4.3** _(Sonnet)_ — Sweep callers of `useEditorDataFlow`:
  - Likely `apps/azure/src/pages/Editor.tsx` and feature stores
  - Verify no direct `useStorage().saveProcessHub` calls remain in the paste-snapshot path (they should be absorbed by the dispatch)

- [ ] **Task P4.4** _(Sonnet)_ — Manual `claude --chrome` walk in Azure:
  - Sign in, open existing project + hub
  - Paste new CSV via Mode A.2-paste; verify MatchSummaryCard + persistence
  - Reload; verify hub restored + snapshot persisted
  - Paste with overlap → "Replace overlap" → verify old snapshot `deletedAt` set + new snapshot inserted
  - Provenance: check session-state via React DevTools (no Dexie persistence — confirm asymmetry per D3)

- [ ] **Task P4.5** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P5 — `EVIDENCE_SOURCE_UPDATE_CURSOR` cursor reconciliation (D5)

- [ ] **Task P5.1** _(Sonnet)_ — Implement PWA handler in `apps/pwa/src/persistence/applyAction.ts`:

  ```ts
  case 'EVIDENCE_SOURCE_UPDATE_CURSOR': {
    // PWA schema: &id, sourceId — primary key is `id`. Generate if missing.
    const cursorWithId = {
      ...action.cursor,
      id: action.cursor.id ?? generateDeterministicId(),
    };
    await db.evidenceSourceCursors.put(cursorWithId);
    return;
  }
  ```

- [ ] **Task P5.2** _(Sonnet)_ — Implement Azure handler in `apps/azure/src/persistence/applyAction.ts`:

  ```ts
  case 'EVIDENCE_SOURCE_UPDATE_CURSOR': {
    // Azure schema: [hubId+sourceId] compound key — Dexie auto-resolves.
    await db.evidenceSourceCursors.put(action.cursor);
    return;
  }
  ```

- [ ] **Task P5.3** _(Sonnet)_ — Tests in both apps' applyAction test files:
  - PWA: dispatch updates cursor; read-back via `repo.evidenceSources.getCursor(hubId, sourceId)` returns it.
  - Azure: same.
  - Verify the `markSeen` flow in `useEvidenceSourceSync.ts` (which reads + dispatches) routes through these handlers cleanly. (The `createdAt` overwrite concern from the watchlist stays out of scope here per D7.)

- [ ] **Task P5.4** _(Sonnet, spec + code-quality reviewer)_ — Two-stage review.

### Phase P6 — Verify monorepo

- [ ] **Task P6.1** _(Sonnet)_ — Run from worktree:

  ```bash
  pnpm --filter @variscout/core test
  pnpm --filter @variscout/hooks test
  pnpm --filter @variscout/stores test
  pnpm --filter @variscout/ui test
  pnpm --filter @variscout/azure-app test
  pnpm --filter @variscout/pwa test
  pnpm --filter @variscout/ui build
  pnpm --filter @variscout/azure-app build
  pnpm --filter @variscout/pwa build
  bash scripts/pr-ready-check.sh
  ```

  All green. Record test counts per package; expected delta is small (core unchanged; PWA + Azure +5-10 each from new applyAction + paste-flow tests).

- [ ] **Task P6.2** _(Sonnet)_ — Verify ESLint repository-boundary guard still passes — neither app's paste flow should now import `dexie` directly (handler dispatch is the only persistence path).

### Phase P7 — Final review + PR

- [ ] **Task P7.1** _([OPUS], final reviewer)_ — Final-branch code review of the entire F3.5 surface. Verify:
  - Both EVIDENCE_ADD_SNAPSHOT handlers correct + atomic (PWA) / snapshot-only (Azure)
  - Both EVIDENCE_ARCHIVE_SNAPSHOT handlers cascade to provenance (PWA) / soft-delete only (Azure)
  - EVIDENCE_SOURCE_UPDATE_CURSOR handlers branch on schema correctly per D5
  - PWA paste flow drops props per D4; Azure keeps props per D3 (asymmetry intentional + documented)
  - `RowProvenanceTag.snapshotId = ''` placeholder is gone in PWA paste flow (snapshot id populated in handler)
  - `existingRange` no longer plumbed through props on PWA side (handler reads via repo)
  - No new `Math.random` introductions
  - No `--no-verify` use in any commit
  - Tests deterministic
  - All builds green
  - `--chrome` walks signed off
  - `docs/investigations.md` Azure rowProvenance deferral entry present

- [ ] **Task P7.2** _(Sonnet)_ — Open PR (`Data-Flow Foundation F3.5 — Ingestion Action Layer`). Body lists D1-D7 + per-phase summary + watchlist items still pending. Run `bash scripts/pr-ready-check.sh`. Subagent code review pass. Address comments. Squash-merge.

- [ ] **Task P7.3** _(Sonnet)_ — Update `docs/decision-log.md` with a 2026-05-XX (date of PR merge) entry documenting F3.5 close-out. Update memory file `project_data_flow_foundation_fseries.md` to mark F3.5 SHIPPED + reflect Azure-rowProvenance-deferred state. Update ruflo entry. Update spec status if appropriate (likely stays `delivered` since spec covers F1-F6 holistically).

---

## Verification

### Per-phase gates

**P1 (PWA handler):**

- [ ] `EVIDENCE_ADD_SNAPSHOT` handler is atomic (single `db.transaction('rw', ...)`)
- [ ] Snapshot + provenance written together; `snapshotId` populated on every tag
- [ ] `replacedSnapshotId` cascades `deletedAt` to old snapshot + its provenance
- [ ] Rollback on transaction failure (no partial state)
- [ ] `EVIDENCE_ARCHIVE_SNAPSHOT` cascades to provenance
- [ ] Tests deterministic; all green

**P2 (Azure handler):**

- [ ] `EVIDENCE_ADD_SNAPSHOT` handler writes snapshot + replacement cascade
- [ ] Provenance NOT written (D3 asymmetry)
- [ ] `docs/investigations.md` deferral entry present
- [ ] Tests green

**P3 (PWA paste flow):**

- [ ] `evidenceSnapshots?` + `setRowProvenance?` props removed from `usePasteImportFlow`
- [ ] All consumers swept (no caller passes those props)
- [ ] Single `dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', ... })` replaces inline `archiveReplacedRows` + `setRowProvenance` blocks
- [ ] `--chrome` walk: paste persists, reload restores, overlap-replace works end-to-end (IndexedDB verified)

**P4 (Azure paste flow):**

- [ ] Snapshot persistence routes through dispatch
- [ ] Props retained per D3
- [ ] `--chrome` walk: paste persists, reload restores

**P5 (cursor reconciliation):**

- [ ] PWA handler uses id-keyed put with auto-generated id
- [ ] Azure handler uses compound-keyed put
- [ ] Read-back works in both apps

**P6 (verify):**

- [ ] All tests green per package
- [ ] All builds green
- [ ] `pr-ready-check.sh` green
- [ ] ESLint repository-boundary guard fires nowhere (no new violations)

### Holistic checks (post-P7)

- [ ] `RowProvenanceTag.snapshotId = ''` placeholder is gone in PWA paste flow (verify by grep — should return 0 matches)
- [ ] `existingRange` is no longer threaded through props in PWA (verify by reading hook signature)
- [ ] `archiveReplacedRows` direct call from `apps/pwa/src/hooks/usePasteImportFlow.ts` is gone (or remains only for in-memory tag computation, not for persistence)
- [ ] `apps/investigations.md` has the Azure rowProvenance deferral entry
- [ ] Decision-log entry captures the close-out

---

## Risk register

- **PWA paste-flow refactor blast radius.** `usePasteImportFlow.ts` is 660 LOC with multiple classifier branches (overlap, append, columns-merge, wide, defect, yamazumi). Mitigation: P0 audit maps every branch + ensures the dispatch refactor preserves them. Per-task spec reviewer flags if any branch lost coverage. `--chrome` walk in P3.4 covers the manual end-to-end path.
- **Azure prop-pattern asymmetry confusion.** Future readers may wonder why PWA dropped `setRowProvenance` but Azure kept it. Mitigation: D3 explicitly documented in plan + JSDoc + `docs/investigations.md` deferral entry.
- **Dexie transaction granularity.** PWA handler wraps snapshot + provenance + replacement in one `db.transaction('rw', ...)`. If browser closes mid-transaction, Dexie auto-rolls back (no partial state). Mitigation: P1.3 includes rollback test. Pattern is identical to F1+F2 PR3 cascadeArchive.
- **Cursor schema reconciliation drift.** P5 wires both handlers; future schema changes (e.g., adding indexed columns) need to keep the asymmetry working. Mitigation: handler comments document the schema dependency + reference the F3.5 plan.
- **Branch staleness during P0–P7.** Standard `feedback_branch_staleness_guardrails` applies. Check `git log HEAD..origin/main` before each push.
- **Subagent --no-verify hazard.** Per `feedback_subagent_no_verify`, every dispatch prompt explicitly forbids `--no-verify`.

---

## Out of scope (carried forward)

- **Azure `rowProvenance` Dexie table** — deferred to F3.6 or F4. Logged in `docs/investigations.md` per P2.4.
- **Future evidence-source-pull background ingestion** — plugs into `EVIDENCE_ADD_SNAPSHOT` when it lands; F3.5 doesn't build the consumer.
- **F4 three-layer state codification** (Document / Annotation / View).
- **F5 — `SUSTAINMENT_*`/`HANDOFF_*` action kinds + investigation/finding/etc. action handler bodies.**
- **F6 (named-future) — multi-investigation lifecycle.**
- **`generateDeterministicId` → `generateEntityId` rename** (carry into F3.6 or F4).
- **`'general-unassigned'` placeholder runtime guard** (F3.6 or F5).
- **`useEvidenceSourceSync.markSeen` `createdAt` overwrite** (F4 normalization concern).
- **`id: \`snapshot-${Date.now()}\``in`ProcessHubEvidencePanel.tsx:333`** — F4 will replace surface entirely.

---

## References

- **Spec:** [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](../specs/2026-05-06-data-flow-foundation-design.md) §5 "Ingestion — F3.5 dedicated slice"
- **Companion plans:**
  - F1+F2 plan ([`docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2.md`](2026-05-06-data-flow-foundation-f1-f2.md)) — Audit pattern + per-task subagent flow precedent
  - F1+F2 P0 audit ([`docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md`](2026-05-06-data-flow-foundation-f1-f2-audit.md)) — entity inventories
- **Architectural foundations:**
  - ADR-077 (snapshot provenance + match-summary wedge) — `RowProvenanceTag` shape from F1+F2 P1.3 amendment; F3.5 closes the `snapshotId = ''` placeholder gap
  - ADR-078 (PWA + Azure architecture alignment) — D2 tier-agnostic state shapes; F3.5's asymmetric persistence + symmetric call sites honors this
- **Workflow rules:**
  - `feedback_subagent_driven_default` — Sonnet workhorse + per-task spec/quality reviewers + final Opus
  - `feedback_no_backcompat_clean_architecture` — required props by default; atomic refactor
  - `feedback_one_worktree_per_agent` — F3.5 worktree at `.worktrees/data-flow-foundation-f3-5/`
  - `feedback_subagent_no_verify` — explicit prohibition in every dispatch prompt
  - `feedback_branch_staleness_guardrails` — fetch + drift check before each push
  - `feedback_ui_build_before_merge` — `pnpm --filter @variscout/ui build` in pre-merge gate
  - `feedback_verify_before_push` — `--chrome` walk per app per PR
- **Existing surfaces touched:**
  - `apps/pwa/src/persistence/applyAction.ts:197-206` — current EVIDENCE_ADD_SNAPSHOT no-op
  - `apps/azure/src/persistence/applyAction.ts:146-150` — current EVIDENCE_ADD_SNAPSHOT (snapshot only, no provenance)
  - `apps/pwa/src/hooks/usePasteImportFlow.ts` (660 LOC)
  - `apps/azure/src/features/data-flow/useEditorDataFlow.ts` (941 LOC)
  - `packages/core/src/matchSummary/classifier.ts:77-91` — `existingRange` consumer
  - `packages/core/src/matchSummary/provenance.ts` — `archiveReplacedRows` (still used for in-memory tag computation post-F3.5)
