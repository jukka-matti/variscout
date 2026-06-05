---
tier: living
purpose: design
title: 'PO-6 · Findings hygiene — FK drop + PWA findings unification + Stage-5 fold (sub-plan)'
audience: human
status: delivered
date: 2026-06-05
last-reviewed: 2026-06-05
layer: spec
topic: [findings-domain, fk-drop, pwa-unification, dexie-retirement, process-as-operations]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-6 · Findings Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Branch: `feat/po-6-findings-hygiene`, worktree `.worktrees/feat-po-6-findings-hygiene`. Model: Sonnet per task (master-plan row); reviewers per the standard pair.

**Goal:** Honest Finding/Hypothesis types (the write-only `investigationId` sentinel FK deletes), one findings collection in the PWA (`useAnalyzeStore.findings` becomes the single source; the bare `useFindings()` React-state path retires), `.vrs` round-trips the free onramp (quick-analysis pins survive export→import, with a negative control), and the Stage-5 `hypothesisDraft` TODO closes in both apps.

**Architecture:** Additive → behavioral → deletion ladder, every intermediate commit green. (1) The store gains the one missing action (`promoteFindingAction`); (2) the PWA swaps ~25 `findingsState.*` sites onto the store directly (ratified owner call: TRUE STORE-SWAP, not the Azure seed-mirror — the mirror has a verified lost-write clobber hazard because `useFindings` seeds only at first render while `BrushToFindingFlow`/AnalyzeView write the store directly); (3) `.vrs` arc + negative-control tests; (4) Stage-5 folds; (5) the FK drop atomic cascade (required member ⇒ literals land WITH the type deletion, PO-5 lesson); (6) Dexie table retirement v14 + dead ReadAPI deletion.

**Tech stack:** TypeScript monorepo (pnpm + turbo), Zustand, Dexie, Vitest. Apps' `tsc` covers test files; package builds do NOT (package-test stale keys need grep-guards, not tsc).

**Grounding provenance:** 12-agent workflow 2026-06-05 (6 readers + 5 adversarial verifiers + completeness critic), owner-ratified 4 calls: store-swap mechanism · Stage-5 fold in BOTH apps · drop the action-variant FKs + the dead ReadAPIs · cascadeRules EntityKind members KEPT (resolution recorded in Task 6).

---

## Hard scope boundary (PO-7 decoys — DO NOT TOUCH)

The repo has ~146 test files matching `investigationId`; only ~10–12 carry Finding/Hypothesis literals. Everything below is **PO-7's rename sweep, not PO-6**:

- `ProblemStatementScope.investigationId` (`packages/core/src/findings/types.ts:829`) + `createProblemStatementScope` (`factories.ts:325,333`) + `ScopeReadAPI` + all scope fixtures/tests (`analyzeStore.scope.test.ts`, `documentSnapshotVrs.test.ts:53` scope seed, `problemStatementScope.test.ts`).
- All Control entities (`ControlRecord/Review/Handoff.investigationId`, Azure `controlRecords/controlReviews/controlHandoffs` Dexie indexes).
- `ImprovementProject.metadata.investigationId` (+ `ImprovementProjectPanel.onInvestigationIdChange`).
- `AnalyzeNodeMapping.investigationId` (migration modal).
- `analyzeStore.ts` scope actions (`addScope`/`syncScopeFromDrill` params, `:737` scope filter).
- The string `'general-unassigned'` is ALSO `DEFAULT_PROCESS_HUB_ID` (`processHub.ts:38`) — **never blanket find-replace that literal**.
- PWA `App.test.tsx:79-81` + `modeA1.test.tsx:76-78` LEGACY v11 schema fixture strings — historical migration fixtures, leave AS-IS.
- The dead core `vrsExport`/`vrsImport` path (`packages/core/src/serialization/`) — zero app callers, treats the snapshot as `unknown`; NOT a PO-6 target.
- `.vrs` import validation (`documentSnapshotVrs.ts:31-47`) — shape-only by design. **schemaVersion stays literal `1`; do NOT add strict field checks or bump it** (PO-8a owns the validator re-freeze).
- E2E fixtures `active-ip-hub.vrs`/`sample-hub.vrs` — empty findings/hypotheses arrays, unaffected.

All cited line numbers below were grounded 2026-06-05 — **locate by symbol if drifted; never trust line numbers alone.**

---

### Task 1: `promoteFindingAction` store action (additive, TDD)

The store mirrors `useFindings`' API except `promoteAction`. Add it so Task 2 can re-point `handlePromoteFindingAction`.

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts` (interface ~`:129-147` action block; impl ~`:594-660` block)
- Test: `packages/stores/src/__tests__/analyzeStore.test.ts`

- [ ] **Step 1: Write the failing test** (append to the findings-actions describe block in `analyzeStore.test.ts`; match the file's existing `addFinding('note', ctx)` fixture style):

```ts
describe('promoteFindingAction', () => {
  it('stamps parentImprovementProjectId on the matching action only', () => {
    const store = useAnalyzeStore.getState();
    const finding = store.addFinding('note', ctx);
    const a1 = store.addFindingAction(finding.id, 'fix the fixture');
    const a2 = store.addFindingAction(finding.id, 'leave me alone');

    useAnalyzeStore.getState().promoteFindingAction(finding.id, a1.id, 'ip-123');

    const updated = useAnalyzeStore.getState().findings.find(f => f.id === finding.id)!;
    expect(updated.actions?.find(a => a.id === a1.id)?.parentImprovementProjectId).toBe('ip-123');
    // negative control: the sibling action must NOT be stamped
    expect(updated.actions?.find(a => a.id === a2.id)?.parentImprovementProjectId).toBeUndefined();
  });

  it('is a no-op for an unknown finding id', () => {
    const before = useAnalyzeStore.getState().findings;
    useAnalyzeStore.getState().promoteFindingAction('nope', 'nope', 'ip-123');
    expect(useAnalyzeStore.getState().findings).toEqual(before);
  });
});
```

(`ctx` = the file's existing `FindingContext` fixture. If `addFindingAction` returns the created `ActionItem` — it does, signature `(findingId, text, assignee?, dueDate?, ideaId?)` at `:594` — use its `.id`.)

- [ ] **Step 2: Run it, verify it fails**

Run: `pnpm --filter @variscout/stores test -- --run analyzeStore.test`
Expected: FAIL — `promoteFindingAction is not a function`.

- [ ] **Step 3: Implement.** Interface (after `deleteFindingAction` ~`:143`):

```ts
  /** PR-CS-6 Edge 1 (PO-6): stamp a finding-level action as copied into a project tracker. */
  promoteFindingAction: (findingId: string, actionId: string, projectId: string) => void;
```

Impl (after the `deleteFindingAction` impl ~`:652`, mirroring `useFindings.ts` `promoteAction` ~`:579-597`):

```ts
  promoteFindingAction: (findingId, actionId, projectId) => {
    set(state => ({
      findings: state.findings.map(f =>
        f.id === findingId
          ? {
              ...f,
              actions: f.actions?.map(a =>
                a.id === actionId ? { ...a, parentImprovementProjectId: projectId } : a
              ),
            }
          : f
      ),
    }));
  },
```

- [ ] **Step 4: Run the test, verify pass:** same command, expect PASS (whole file green).
- [ ] **Step 5: Commit:** `git add -A && git commit -m "feat(stores): promoteFindingAction — store parity for the useFindings promote path (PO-6 Task 1)"`

---

### Task 2: PWA findings unification — the store-swap

`useAnalyzeStore.findings` becomes the PWA's single findings source. The bare `useFindings()` call retires; **the hook itself survives** (Azure's `useFindingsOrchestration.ts:119` still wires it — do NOT delete `packages/hooks/src/useFindings.ts` or its 58-test suite).

This heals, in one move: (a) the split-brain bug (Wall renders store findings but its callbacks mutated React state — edits silently no-op'd); (b) the Charter-promotion mismatch (`approachInputs.hypotheses` from store, `.actions` from React state); (c) the lost-on-export quick-analysis pins; (d) imported findings being invisible (hydrate already writes the store).

**Files:**

- Modify: `apps/pwa/src/App.tsx` (the ~25 `findingsState.*` sites, enumerated below)
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx` (drop the `findingsState: UseFindingsReturn` prop; store-bind the FindingsLog callbacks)
- Test: existing PWA suite (`pnpm --filter @variscout/pwa test`) must stay green; tsc (`pnpm --filter @variscout/pwa build`) covers test files

**Method name map (hook → store):** `addAction`→`addFindingAction` · `completeAction`→`completeFindingAction` · `deleteAction`→`deleteFindingAction` · `setOutcome`→`setFindingOutcome` · `promoteAction`→`promoteFindingAction` (Task 1) · `findDuplicate(filters)`→core pure fn `findDuplicateFinding(findings, filters)` · `findDuplicateSource(source)`→core pure fn `findDuplicateBySource(findings, source)` (both already exported from `@variscout/core` — `useFindings.ts:6-7` imports them today). Everything else is same-named on the store (`addFinding` has full signature parity incl. `scopeId`/`originStepId`, `:389`).

- [ ] **Step 1: App.tsx — replace the source.** At `:376`:

```tsx
// BEFORE
// Findings state — useFindings is the CRUD engine, findingsStore holds UI-only state
const findingsState = useFindings();

// AFTER
// PO-6 §4.4: useAnalyzeStore.findings is the single findings source (the bare
// useFindings() React-state mirror retired — quick-analysis pins now round-trip .vrs).
const findings = useAnalyzeStore(s => s.findings);
```

Remove the `useFindings` import; add `findDuplicateFinding, findDuplicateBySource` to the `@variscout/core` import.

- [ ] **Step 2: App.tsx — re-point every consumer.** Site-by-site (locate by symbol):

| Site (symbol)                                                    | Change                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useJournalEntries({ findings: findingsState.findings })` `:384` | `useJournalEntries({ findings })`                                                                                                                                                                                                                                                                                          |
| `useAnalyzeOrchestration({ findingsState: {...} })` `:399-403`   | `findingsState: { findings, setFindingStatus: useAnalyzeStore.getState().setFindingStatus, addAction: (id, text) => { useAnalyzeStore.getState().addFindingAction(id, text); } }` (slice shape `FindingsStateSlice` unchanged; `addAction` wraps to return void)                                                           |
| `handlePinFinding` `:595-606`                                    | `const existing = findDuplicateFinding(findings, filters);` … `const newFinding = useAnalyzeStore.getState().addFinding('', context);` deps: swap `findingsState` → `findings`                                                                                                                                             |
| `handleAddChartObservation` `:609-632`                           | `const existing = findDuplicateBySource(findings, source);` … `useAnalyzeStore.getState().addFinding('', context, source);` deps likewise                                                                                                                                                                                  |
| `chartFindings` memo `:636-637`                                  | `groupFindingsByChart(findings)`, dep `[findings]`                                                                                                                                                                                                                                                                         |
| `handleRestoreFinding` `:645`                                    | `findings.find(...)`, dep `[findings, setFilters]`                                                                                                                                                                                                                                                                         |
| `handleOpenFindingsPopout` `:659-660`                            | `openFindingsPopout(findings, columnAliases, drillPath)`                                                                                                                                                                                                                                                                   |
| popout sync effect `:776-777`                                    | `updateFindingsPopout(findings, ...)`, dep `[findings, ...]`                                                                                                                                                                                                                                                               |
| popout message switch `:789-808`                                 | each `findingsState.X(...)` → `useAnalyzeStore.getState().X(...)` (same names: `editFinding`/`deleteFinding`/`setFindingStatus`/`setFindingTag`/`addFindingComment`/`editFindingComment`/`deleteFindingComment`); effect dep `[findingsPopoutMessage]`                                                                     |
| `handlePromoteFindingAction` `:847-871`                          | `findings.find(...)` + final line `useAnalyzeStore.getState().promoteFindingAction(findingId, actionId, activeIP.id);` deps: `findings` replaces `findingsState`                                                                                                                                                           |
| `<AnalyzeView findingsState={findingsState}>` `:1398`            | delete the prop (Step 3 removes it from the component)                                                                                                                                                                                                                                                                     |
| ProjectsTabView `approachInputs.actions` `:1432`                 | `actions: findings.flatMap(f => f.actions ?? [])` — **the Charter-mismatch heal**                                                                                                                                                                                                                                          |
| `<ReportView findings={findingsState.findings}>` `:1475`         | `findings={findings}`                                                                                                                                                                                                                                                                                                      |
| Dashboard `findingsCallbacks` `:1528-1531`                       | `onEditFinding: useAnalyzeStore.getState().editFinding, onDeleteFinding: useAnalyzeStore.getState().deleteFinding`, `findings={findings}`                                                                                                                                                                                  |
| `<FindingsPanel>` `:1552-1560`                                   | `findings={findings}`; callbacks → `useAnalyzeStore.getState().editFinding` / `.deleteFinding` / `.setFindingTag`; `onAddComment={(id, text) => useAnalyzeStore.getState().addFindingComment(id, text)}` (panel expects void; store returns `FindingComment` — wrap); `onEditComment`/`onDeleteComment` → store same-names |
| `<MobileTabBar findingsCount={...}>` `:1694`                     | `findingsCount={findings.length}`                                                                                                                                                                                                                                                                                          |

Zustand action references off `useAnalyzeStore.getState()` are stable — safe in deps arrays or omitted per the file's existing convention (it already uses `getState()` actions in 15+ places; match that idiom).

- [ ] **Step 3: AnalyzeView.tsx — drop the prop, store-bind internals.**
  - Delete `findingsState: UseFindingsReturn;` from `AnalyzeViewProps` (~`:84`) + the `UseFindingsReturn` import + the destructure.
  - `detectInvestigationPhase(findingsState.findings)` (~`:183-184`) → `detectInvestigationPhase(wallFindings)` (already subscribed at `:163`).
  - FindingsLog callbacks (~`:773-789`): bind to the store —

```tsx
onEditFinding={useAnalyzeStore.getState().editFinding}
onDeleteFinding={useAnalyzeStore.getState().deleteFinding}
onSetFindingTag={useAnalyzeStore.getState().setFindingTag}
onAddComment={(id: string, text: string) => {
  useAnalyzeStore.getState().addFindingComment(id, text);
}}
onAddAction={(id: string, text: string) => {
  useAnalyzeStore.getState().addFindingAction(id, text);
}}
onCompleteAction={useAnalyzeStore.getState().completeFindingAction}
onDeleteAction={useAnalyzeStore.getState().deleteFindingAction}
onSetOutcome={useAnalyzeStore.getState().setFindingOutcome}
```

(Match each FindingsLog prop's expected signature — wrap where the store action's return type differs from a void callback. `useAnalyzeStore` is already imported.)

- [ ] **Step 4: tsc + suite.** Run `pnpm --filter @variscout/pwa build` (tsc covers tests — fix any test now referencing the deleted prop/`useFindings` wiring; re-target assertions to the store, do not delete coverage), then `pnpm --filter @variscout/pwa test -- --run`. Expected: green. (Tests that previously mocked or seeded `useFindings` for App-level flows re-seed via `useAnalyzeStore.getState().loadAnalyzeState({ findings: [...] })` instead.)
- [ ] **Step 5: Grep guard** — `grep -n "findingsState" apps/pwa/src/App.tsx apps/pwa/src/components/views/AnalyzeView.tsx` → only the `useAnalyzeOrchestration` option-slice key may remain (it's the hook's option name, store-fed). `grep -rn "useFindings(" apps/pwa/src` → zero hits.
- [ ] **Step 6: Commit:** `git commit -am "feat(pwa): findings unification — useAnalyzeStore is the single source; bare useFindings() retires (PO-6 §4.4)"`

**Keep-guards:** `useFindingsStore` (`findingsStore.ts`) is UI-only highlight state — UNTOUCHED. `useAnalyzeOrchestration`'s `FindingsStateSlice` interface — unchanged (only the values App passes change). `packages/hooks/src/useFindings.ts` + its tests — unchanged in this task (Task 5 drops one sentinel arg).

---

### Task 3: `.vrs` round-trip arc + negative control (the non-negotiable test)

**Files:**

- Test: `packages/stores/src/__tests__/documentSnapshotVrs.test.ts` (reuse the existing beforeEach store-reset `:33-38` + `hub` fixture + build→parse infra)

- [ ] **Step 1: Write the arc + negative-control test** (mirror the PO-5 dual-assert template, `ipReport.test.ts:241-256` — assert the absent item is NOT there AND the present item IS):

```ts
describe('PO-6: findings round-trip the .vrs arc (quick-analysis onramp)', () => {
  it('a store finding survives export → reset → import; a store-absent finding does NOT appear', () => {
    // seed: finding A lives in the store (the quick-analysis pin path post-unification)
    const a = useAnalyzeStore.getState().addFinding('finding A — pinned from Explore', ctx);
    const vrsWithA = buildDocumentSnapshotVrs({
      activeHub: hub,
      metadata: { exportSource: 'pwa' },
    });

    // reset (fresh session), then craft a .vrs carrying ONLY finding B (the distractor seed:
    // A must not leak through module state or a merge-instead-of-replace hydrate)
    resetAllStores(); // the file's existing beforeEach helper pattern
    const b = useAnalyzeStore.getState().addFinding('finding B — different session', ctx);
    const vrsWithB = buildDocumentSnapshotVrs({
      activeHub: hub,
      metadata: { exportSource: 'pwa' },
    });
    resetAllStores();
    // re-seed A so the store is non-empty pre-import — hydrate must REPLACE, not merge
    useAnalyzeStore.getState().addFinding('finding A — pinned from Explore', ctx);

    const parsed = parseDocumentSnapshotVrs(JSON.stringify(JSON.parse(vrsWithB)));
    hydrateDocumentSnapshot(parsed.documentSnapshot);

    const texts = useAnalyzeStore.getState().findings.map(f => f.text);
    expect(texts).toContain('finding B — different session'); // imported finding IS visible
    expect(texts).not.toContain('finding A — pinned from Explore'); // store-absent finding does NOT appear
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);

    // and the original export carried A (the export side of the arc)
    expect(
      JSON.parse(vrsWithA).documentSnapshot.analyze.findings.map((f: { text: string }) => f.text)
    ).toContain('finding A — pinned from Explore');
    void a;
    void b;
  });
});
```

Adapt names to the file's actual fixtures/imports (`hydrateDocumentSnapshot` is exported from `@variscout/stores` `documentSnapshot.ts`; `ctx` = a minimal `FindingContext` like `documentSnapshot.test.ts`'s `makeFinding` context; the reset helper is whatever `:33-38` beforeEach uses — extract/reuse, don't reinvent). The replace-not-merge guarantee is `loadAnalyzeState`'s `partial.findings ?? state.findings` (`analyzeStore.ts:1221`).

- [ ] **Step 2: Run** `pnpm --filter @variscout/stores test -- --run documentSnapshotVrs` — expected PASS (this locks behavior; it's a control, not red-green).
- [ ] **Step 3: Prove the negative control is load-bearing** (`feedback_load_bearing_tests`): temporarily change the hydrate call to merge semantics mentally is not enough — instead temporarily seed the post-reset store with finding A and SKIP hydrate; the test must FAIL on the `.not.toContain`. Revert. (One-line toggle, do it, note PASS→FAIL→PASS in the commit body.)
- [ ] **Step 4: Commit:** `git commit -am "test(stores): .vrs round-trip arc + store-absent negative control (PO-6 §13)"`

---

### Task 4: Stage-5 `hypothesisDraft` fold — both apps

Close the `TODO slice 4: persist brief.hypothesisDraft…` in BOTH apps (ratified). The StageFiveModal already emits `brief.hypothesisDraft` (trimmed, omitted when blank — locked by `StageFiveModal.test.tsx:149-173`); zero modal changes.

**Files:**

- Modify: `apps/pwa/src/App.tsx` (StageFiveModal `onOpenInvestigation`, ~`:1676-1684`)
- Modify: `apps/azure/src/pages/Editor.tsx` (StageFiveModal `onOpenInvestigation`, ~`:2267-2284`)
- Test: `apps/pwa/src/__tests__/App.test.tsx` + `apps/azure/src/pages/__tests__/Editor.test.tsx` (capture-prop pattern)

- [ ] **Step 1: PWA wiring.** The callback (locate by `TODO slice 4: persist brief.hypothesisDraft`):

```tsx
onOpenInvestigation={brief => {
  // PO-6: persist the Stage-5 draft as a proposed Hypothesis hub (analyst renames
  // on the card — same convention as handleWriteHypothesis / propose-hypothesis).
  if (brief.hypothesisDraft) {
    useAnalyzeStore.getState().createHub(brief.hypothesisDraft, '');
  }
  // TODO (slice 4): wire brief.target into processContext once PWA gains a
  // processContext or equivalent improvement-target store field.
  stageFive.close();
}}
```

(The IM-1 Question-retirement comment lines and the second TODO stay; only the hypothesisDraft TODO resolves. Param renames `_brief` → `brief`.)

- [ ] **Step 2: Azure wiring.** In the existing callback, after the `setProcessContext` block and before `stageFive.close()` (the `hypothesesState` with `.createHub` is in scope — declared via `useAnalyzeOrchestration` ~`:1167`; verify the exact binding name and use it — Azure's hook-state is the source of truth, do NOT call `useAnalyzeStore.getState().createHub` here, it would desync the mirror):

```tsx
// PO-6: persist the Stage-5 draft as a proposed Hypothesis hub.
if (brief.hypothesisDraft) {
  hypothesesState.createHub(brief.hypothesisDraft, '');
}
stageFive.close();
```

Delete the `// TODO slice 4: persist brief.hypothesisDraft…` line in both apps.

- [ ] **Step 3: Tests (capture-prop pattern, both apps).** In each app's existing harness that mounts the surface (PWA `App.test.tsx`; Azure `Editor.test.tsx`, which currently stubs `StageFiveModal: () => null` at `:205`): change the stub to capture the prop, then drive it:

```tsx
let capturedOnOpenInvestigation: ((brief: AnalysisBrief) => void) | undefined;
// in the existing vi.mock for the modal:
StageFiveModal: (props: { onOpenInvestigation: (brief: AnalysisBrief) => void }) => {
  capturedOnOpenInvestigation = props.onOpenInvestigation;
  return null;
},
```

```tsx
it('Stage-5 hypothesisDraft creates exactly one proposed hub', async () => {
  // ...render the surface per the file's existing setup...
  act(() => capturedOnOpenInvestigation!({ hypothesisDraft: 'Resin lot drift' }));
  const hubs = useAnalyzeStore.getState().hypotheses;
  expect(hubs).toHaveLength(1);
  expect(hubs[0].name).toBe('Resin lot drift');
  expect(hubs[0].status).toBe('proposed');
});

it('NEGATIVE: a blank brief creates zero hubs', async () => {
  act(() => capturedOnOpenInvestigation!({}));
  expect(useAnalyzeStore.getState().hypotheses).toHaveLength(0);
});
```

(Azure: `hypothesesState.createHub` mirrors to `useAnalyzeStore` via `onHubsChange: resetHubs` — `useAnalyzeOrchestration.ts:67-70` — so the store assertion holds in both apps. Adapt render/act mechanics to each file's conventions; reset the analyze store in beforeEach.)

- [ ] **Step 4: Run both app suites' touched files:** `pnpm --filter @variscout/pwa test -- --run App.test` and `pnpm --filter @variscout/azure test -- --run Editor.test`. Expected: PASS.
- [ ] **Step 5: Commit:** `git commit -am "feat: Stage-5 hypothesisDraft persists as a proposed Hypothesis hub in both apps (PO-6 optional fold)"`

---

### Task 5: The FK drop — atomic cascade (types + factories + writers + action variants + fixtures + tests)

`Finding.investigationId` + `Hypothesis.investigationId` are REQUIRED members ⇒ **every literal/param lands in this one commit** (PO-5 lesson). Apps' tsc covers their test files (hard break); package `__tests__` are tsc-invisible — grep-guarded below.

**Files:**

- Modify: `packages/core/src/findings/types.ts` (Finding `:497-500`, Hypothesis `:701-703` — field + JSDoc; **`:829` ProblemStatementScope untouched**)
- Modify: `packages/core/src/findings/factories.ts` (`createFinding` `:32-34,43,51`; `createHypothesis` `:255,263`; **`createProblemStatementScope` `:325,333` untouched**)
- Modify: `packages/stores/src/analyzeStore.ts:397` + `packages/hooks/src/useFindings.ts:173` (drop the 7th positional sentinel arg + its `TODO(F6)` comment — call becomes `createFinding(text, …, undefined, source)`)
- Modify: `packages/core/src/actions/findingActions.ts:5`, `hypothesisActions.ts:7`, `causalLinkActions.ts:7` (drop the `investigationId: ImprovementProject['id'];` member from the `*_ADD` variants; remove now-unused `ImprovementProject` imports)
- Modify: `packages/data/src/samples/analyze-showcase.ts` (6 keys: `:119,175,203,222,249,277`) + `syringe-barrel-weight.ts` (8 keys: `:166,195,224,252,280,308,337,368`)
- Modify (apps — tsc-enforced): `apps/pwa/src/features/findings/__tests__/findingRestore.test.ts:84,193` · `findingsStore.test.ts:17` · `apps/pwa/src/components/__tests__/ImprovementProjectPanel.test.tsx:125` · `apps/pwa/src/persistence/__tests__/applyAction.test.ts` (FINDING_ADD/HYPOTHESIS_ADD/CAUSAL_LINK_ADD action literals lose the `investigationId` key) · `apps/azure/src/components/__tests__/WhatsNewSection.test.tsx:18,38` · `ProjectDashboard.test.tsx:85,108` · `apps/azure/src/services/__tests__/analyzeSerializer.test.ts:32,37,61` (**keep the scope literal `:8`**)
- Modify (packages — grep-guarded, tsc-silent): `packages/core/src/findings/__tests__/` Finding/Hypothesis literals (`hypothesis.test.ts:37,61,120,135` keys + **DELETE the assertion at `:94`** `expect(hypothesis.investigationId).toBe('investigation-1')`, not just the literal; `hypothesisConditionEvaluator.test.ts:213`; `miniChart.test.ts:14,108,172,201`; `findingSourceTimeLens.test.ts:21`; `drift.test.ts:16,70`; `hypothesisTestPlan.test.ts:33,47`; `mechanismBranch.test.ts:12,32`; `helpers.test.ts:22,38`) · `packages/stores/src/__tests__/documentSnapshot.test.ts:45,59` (**keep `:68` makeScope**) · `featureFactories.test.ts:78,96` · `wallSelectors.test.ts` Finding/Hypothesis fixtures (`:32-148` — classify per literal) · `packages/hooks/src/__tests__/useFindings.test.ts:23` makeFinding + the ~15 other hooks-test files each carrying one Finding/Hypothesis fixture key (enumerate via the Step-4 grep; **classify Finding/Hypothesis vs scope/Control per literal — never blanket-edit a file**) · `packages/ui/src/components/**/__tests__/` Finding/Hypothesis fixtures (AnalyzeWall/FindingsLog/FindingsPanel etc.; **ControlForm/ControlOverview/HeaderMetadataSection tests are Control = PO-7, untouched**)

- [ ] **Step 1: Delete the two type fields + JSDoc** (types.ts — also delete the stale "Field name preserved (the projectId rename is PO-7)" comment lines; the rename deferral is moot once the field is gone).
- [ ] **Step 2: Factories + the two sentinel writers + the three action variants.** `createFinding` loses param 7; `createHypothesis` loses param 4 (its 3 call sites — `analyzeStore.ts:812,822`, `useHypotheses.ts:140` — never pass it; no edit needed there).
- [ ] **Step 3: Fixtures + tests per the file list above.** For the action-variant test literals (`applyAction.test.ts`): drop the key from the action objects; the no-op switch cases in both apps' `applyAction.ts` need NO change (they never read it). **Constructor guard before deleting:** `grep -rn "kind: 'FINDING_ADD'\|kind: 'HYPOTHESIS_ADD'\|kind: 'CAUSAL_LINK_ADD'" --include='*.ts' --include='*.tsx' packages apps | grep -v __tests__ | grep -v '\.test\.'` → expected ZERO non-test constructors (grounded 2026-06-05; re-confirm).
- [ ] **Step 4: The acceptance grep (the guard — tsc can NOT catch package-test stale keys):**

```bash
# findings-domain FK fully gone (only ProblemStatementScope + scope/Control/metadata survivors may match):
grep -rn "investigationId" packages/core/src/findings/ packages/core/src/actions/ \
  packages/data/src/samples/ packages/hooks/src/useFindings.ts packages/stores/src/analyzeStore.ts
# expected hits: types.ts ProblemStatementScope block (~:829), factories.ts createProblemStatementScope,
# analyzeStore.ts scope actions (addScope/syncScopeFromDrill/:737). NOTHING Finding/Hypothesis-flavored.

# package-test stale keys gone (classified — scope/Control hits are PO-7 and expected):
grep -rln "investigationId" packages/*/src --include='*.test.*' | xargs grep -ln "Finding\|Hypothesis" \
  # then eyeball each remaining hit: every survivor must be a scope/Control/metadata literal.
```

- [ ] **Step 5: Builds + suites.** `pnpm --filter @variscout/core build && pnpm --filter @variscout/data build && pnpm --filter @variscout/stores build && pnpm --filter @variscout/hooks build` (the data build is the tsc trap — samples are SRC), then `pnpm --filter @variscout/core test -- --run && pnpm --filter @variscout/stores test -- --run && pnpm --filter @variscout/hooks test -- --run`, then both apps: `pnpm --filter @variscout/pwa build && pnpm --filter @variscout/azure build` (apps' tsc covers tests). Expected: all green.
- [ ] **Step 6: Commit:** `git commit -am "feat(core)!: drop the write-only Finding/Hypothesis investigationId sentinel FK (PO-6 §4.3 — ownership = the document, 1:1)"`

---

### Task 6: PWA Dexie table retirement + dead ReadAPI deletion

The `findings`/`causalLinks`/`hypotheses` Dexie tables were NEVER written (F3-era dead surface; all `applyAction` cases are no-ops); their only readers are the zero-caller repository stubs. Retire tables + the three ReadAPI interfaces (ratified; PO-4 `AnalyzeReadAPI` precedent). **tsc-invisible hazards:** the `.where('investigationId')` string keys and `db.findings.*` dynamic access break at RUNTIME, not tsc — the PWA test suite is the gate.

**Files:**

- Modify: `apps/pwa/src/db/schema.ts` — add `version(14)`; delete table props `:109-111` + Row aliases `:88-90` (`FindingRow`/`CausalLinkRow`/`HypothesisRow`; **keep `ActionItemRow`**); slim the `:45` type import (keep `ActionItem`); update the header comment block `:22-30`; **the v1 store declarations `:131,133,137` STAY** (Dexie monotonic-chain rule)
- Modify: `apps/pwa/src/persistence/PwaHubRepository.ts` — delete the `findings`/`causalLinks`/`hypotheses` sub-API impls `:218-264` + their interface imports + header-comment mention `:22-25`
- Modify: `apps/azure/src/persistence/AzureHubRepository.ts` — delete the three `[]`-stub impls (~`:226-265`) + imports + the "Azure has no dedicated findings/…" comments
- Modify: `packages/core/src/persistence/HubRepository.ts` — delete `FindingReadAPI`/`CausalLinkReadAPI`/`HypothesisReadAPI` interfaces + the `findings`/`causalLinks`/`hypotheses` members on `HubRepository` (`:106-109` block); **`ScopeReadAPI` + `scopes` + `MeasurementPlanReadAPI` (live caller!) stay**
- Modify: `packages/core/src/persistence/index.ts` — drop the three type exports (check `packages/core/src/index.ts` for re-exports of the same names too)
- Test: `apps/pwa/src/db/__tests__/schema.v7.test.ts` (`LATEST_SCHEMA_VERSION` 13→14 + version-history comment) · `apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts` (remove the three `.clear()` calls `:163-167` + the three `listByInvestigation → []` tests `:553-573`) · `applyAction.test.ts` (re-point the no-op count assertions `:558-603` from `db.findings/causalLinks/hypotheses.count()` to a surviving table, e.g. `db.actionItems.count()` — incl. the SCOPE_ADD proxy `:569-583`) · `apps/azure/src/persistence/__tests__/AzureHubRepository.read.test.ts` (drop the three `[]` assertions `:497-514`)

- [ ] **Step 1: schema.ts.** Append after `version(13)` (`:220`), mirroring the v10/v13 precedent comments:

```ts
// v14 (PO-6): the never-written findings/causalLinks/hypotheses normalized
// tables retire (tableName: null — the v10 questions / v13 investigations
// precedent). Findings/hypotheses persist via the .vrs DocumentSnapshot
// analyze facet only (R6d: export-only, no IndexedDB document-save paths).
this.version(14).stores({ findings: null, causalLinks: null, hypotheses: null });
```

No `.upgrade()` callback (wedge no-back-compat; tables were never written — zero data loss).

- [ ] **Step 2: Delete the repo sub-APIs (PWA + Azure) + the core interfaces/members + barrel exports.** tsc drives the consumer cleanup from here — but re-check `grep -rn "FindingReadAPI\|CausalLinkReadAPI\|HypothesisReadAPI\|listByInvestigation" packages apps --include='*.ts'` afterward: survivors must be `ScopeReadAPI.listByInvestigation` only.
- [ ] **Step 3: The runtime-break test fixes** per the Test list above (grep `db\.findings\.\|db\.causalLinks\.\|db\.hypotheses\.` across `apps/pwa` → zero hits when done).
- [ ] **Step 4: cascadeRules resolution (ratified owner call, recorded here):** the `finding`/`causalLink`/`hypothesis` `EntityKind` members in `packages/core/src/persistence/cascadeRules.ts:15-18,36-39` **STAY** — the entities survive in the domain (the Wall renders them; `FINDING_*`/`HYPOTHESIS_*` HubAction kinds remain); only their dead normalized TABLES retire. "cascadeRules references cleaned" (master-plan row) = this verification + stale-comment updates: fix the `applyAction.ts` comment block (~`:372-377`, "tables already exist … writes are not yet routed here") to say the tables are retired (v14) and findings/hypotheses round-trip via the analyze blob.
- [ ] **Step 5: Suites.** `pnpm --filter @variscout/pwa build && pnpm --filter @variscout/pwa test -- --run` (the load-bearing gate — `schema.v7.test` asserts the real `db.verno`) + `pnpm --filter @variscout/azure build && pnpm --filter @variscout/azure test -- --run` + `pnpm --filter @variscout/core build && pnpm --filter @variscout/core test -- --run`. Expected: all green.
- [ ] **Step 6: Commit:** `git commit -am "feat(pwa)!: retire the dead findings/causalLinks/hypotheses Dexie tables (v14) + the zero-caller ReadAPIs (PO-6 §4.3)"`

---

### Task 7: Logs + final sweep

**Files:**

- Modify: `docs/investigations.md` (2 new entries)
- Verify-only: repo-wide greps

- [ ] **Step 1: investigations.md entries** (follow the file's existing entry format/date conventions):
  1. **Azure `useFindings` mirror has a latent lost-write seam** — `useFindings` seeds from `initialFindings` only at first render (`useFindings.ts:156`, no re-sync); `BrushToFindingFlow` (`packages/ui`, mounted via `HypothesisCard`) writes `useAnalyzeStore` directly; an Azure mirror flush (`onFindingsChange` → `loadAnalyzeState({findings})`) can clobber store-direct findings. PWA escaped this class via the PO-6 store-swap; Azure still runs the mirror (`useFindingsOrchestration.ts:119-121`). Watch-item: surface if Azure adopts store-direct Wall writes; candidate fix = Azure store-swap mirroring PO-6.
  2. **`useImprovementOrchestration` (PWA) appears orphaned** — `ImprovementView` migrated to `ImproveTabRoot`; the only reference is the barrel re-export (`features/improvement/index.ts:6`). It consumed the now-retired React-state findings slice. Candidate dead-shed for a future hygiene PR.
- [ ] **Step 2: Final acceptance greps** (the PR's definition of done):

```bash
grep -rn "investigationId" packages/core/src/findings/types.ts   # → ONLY the ProblemStatementScope block
grep -rn "useFindings(" apps/pwa/src                              # → zero
grep -rn "db\.findings\.\|db\.causalLinks\.\|db\.hypotheses\." apps/pwa/src  # → zero
grep -rn "FindingReadAPI\|CausalLinkReadAPI\|HypothesisReadAPI" packages apps  # → zero
grep -rn "hypothesisDraft" apps                                   # → wired handlers, no TODO-slice-4 lines
```

- [ ] **Step 3: Full local gate** (controller-level, NOT inside an implementer dispatch — `feedback_implementer_long_bash_pitfall`): `bash scripts/pr-ready-check.sh` + both app suites if not already covered.
- [ ] **Step 4: Commit:** `git commit -am "docs(po-6): investigations.md watch-items (Azure mirror seam; orphaned useImprovementOrchestration)"`

---

## Verification (PR-level, after all tasks)

- `bash scripts/pr-ready-check.sh` green + **both app test suites** (`pnpm --filter @variscout/pwa test -- --run` · `pnpm --filter @variscout/azure test -- --run`) — CS-12 lesson: builds alone miss red tests; this PR has runtime-only Dexie breaks.
- **`--chrome` verify (PWA, UI-touching):** load sample data → Explore → pin a finding from a chart (lands in the Findings panel) → edit it from the Wall (the split-brain heal: the rendered item updates) → export `.vrs` → reload → import → the pinned finding is visible. Stage-5: Mode B ingest → Stage-5 modal → type a hypothesis draft → "Open investigation" → the hub appears on the Wall. **Known blocker:** the replace-data `window.confirm` (`useEditorDataFlow.ts`) wedges CDP on the paste path (PO-3/PO-5 precedent) — if hit, the import-arc check stays test-covered-only per owner call; note it in the PR.
- Final adversarial Opus branch review before merge (non-negotiable — per-PR pipeline).
- Acceptance criteria from the master-plan row: `.vrs` round-trip negative control ✓ (Task 3) · quick-analysis → pin → export → import arc ✓ (Task 3 + chrome) · gate + app suites green ✓.

## Self-review notes (spec coverage)

§4.3 FK drop → Tasks 5+6 (types/factories/writers/fixtures = 5; Dexie tables + indexes = 6). §4.4 unification → Tasks 1+2+3 (single source, retire bare hook call, `.vrs` round-trip + Charter heal). §4.4 optional fold → Task 4 (both apps, ratified). Critic gaps: action-variant FKs → Task 5; cascadeRules contradiction → Task 6 Step 4 (resolution recorded); method-set divergence → Task 1 + Task 2 name map; lax-import/no-version-bump coupling → scope boundary (schemaVersion stays 1) + Task 3; sample-data tsc-visibility split → Task 5 file classification. PARTIAL verdict (tsc-invisible Dexie chains) → Task 6 grep guards + PWA-suite gate.
