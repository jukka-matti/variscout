---
tier: ephemeral
purpose: build
title: 'FSJ-3b — Azure paste lands at b0 + wizard demotion'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# FSJ-3b: Azure Paste Lands at b0 + Wizard Demotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measurement-shaped Azure pastes skip the HubCreationFlow vestibule and land on the Process tab at b0 pre-filled by inference; the wizard demotes to ColumnMapping-only (Stage-1 HubGoalForm retired from the flow; goal ceremony → opt-in GoalBanner on the Process tab); the §7 guarded regressions — mapping-cancel rawData wipe + the §3 guarantee for wizard-path pastes (incl. the empty-goal-Confirm asymmetry) — close in this same PR. The FSJ-2 mirror, on Azure's primitives.

**Architecture:** One new branch in `_proceedWithParsedData` (the single post-parse pipeline in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`): fresh + not-defect + not-wide + confidence ≠ 'low' → auto-apply time extraction + dispatch `PASTE_LANDED` + invoke an injected `onFreshPasteLanded` callback that Editor wires to `landFreshEntryOnProcess('Untitled project', {...makeLandingDeps(), user})` (the third caller the FSJ-3a extraction anticipated). Detection-shaped / low-confidence / re-ingest pastes keep the wizard path and get `onFreshPasteAnalyzed` (ensure+activate WITHOUT routing — the §3 guarantee that retires Stage-1's provisioning role and closes the empty-goal asymmetry at the right layer). `HubCreationFlow` collapses to ColumnMapping-only (`showBrief` off — brief keeps its Analyze BriefHeader + Stage-5 homes per the owner's minimal-relocation call). Azure FrameView gains the `b0Slots` chrome (provenance / "Fix data…" hatch / "+ track another outcome" / `OutcomeNoMatchBanner`) through the shared `CanvasWorkspace` prop FSJ-2 shipped. GoalBanner (with `startPrompt`) mounts on the frame-tab region writing `hub.processGoal` Word-style via `commitHubChange`.

**Tech Stack:** React + Zustand (Azure app shell), `@variscout/core` detection, `@variscout/ui` shared primitives (NO ui-package changes — the slots shipped in FSJ-2), Vitest + RTL, Playwright (scoped helper adaptation only).

**Branch:** `feat/fsj-3b-azure-paste-b0` in own worktree `.worktrees/feat-fsj-3b-azure-paste-b0/`.

**Read first:** spec §4.1/§4.2a/§7/§8; FSJ-2 sub-plan (the PWA mirror being ported — `2026-06-06-fsj-2-paste-b0-wizard-demotion.md`); FSJ-3a sub-plan §Grounded-decisions; `apps/pwa/src/hooks/usePasteImportFlow.ts:306-393` (the landsAtB0 reference); `apps/pwa/src/components/views/FrameView.tsx:444-496` (the b0Slots reference).

---

## Grounded design decisions (code-verified 2026-06-06 — do not re-litigate in tasks)

1. **The live hook is `apps/azure/src/features/data-flow/useEditorDataFlow.ts`** (1036 LOC); `apps/azure/src/hooks/useEditorDataFlow.ts` is a re-export shim (types flow through — no barrel edit unless export names change). The match-summary cascade (`acceptMatchSummary`, ~:569-770) is §7-FENCED.
2. **Azure's landsAtB0 predicate keeps Azure's existing detection gates**, not PWA's: defect = ANY `isDefectFormat` (Azure's modal fires without a confidence filter — preserving today's defect routing exactly per §4.2a "no worst-combo interim"); wide = `isWideFormat` (any; Azure's ≥3-channel silent performance auto-apply stays on the wizard path untouched). Document the divergence from PWA's `high|medium` defect gate inline.
3. **Re-ingest exclusion**: `_proceedWithParsedData` gains `opts?: { reingest?: boolean }`; ALL `acceptMatchSummary`-internal call sites pass `{ reingest: true }` (grep the count first — PWA had 5; Azure's layout differs, verify each), as does `handleAppendPaste`'s path if it re-enters the pipeline (read it — append may flow through different machinery; the guard is "fresh `handlePasteAnalyze` only fires the callbacks").
4. **The §3 guarantee moves to paste-time** (the PWA FSJ-2 pattern): `onFreshPasteLanded` (route) and `onFreshPasteAnalyzed` (provision-only) are mutually exclusive, fired only for fresh pastes. This RETIRES Stage-1's provisioning role: `HubCreationFlow` renders ColumnMapping directly; `createHubFromGoal`'s wizard call site disappears (the hook itself stays — Dashboard's New Hub uses it). The empty-goal-Confirm asymmetry (investigations 2026-06-06) dissolves by construction.
5. **Double-provision safety**: `onFreshPasteAnalyzed` ensures on the CURRENT activeHub (`ensureHubProject` no-ops on a live pair). Order: provision fires at paste-analyzed; the demoted wizard then reads `processContext.processHubId` already set — `handleMappingConfirmWithCategories`'s outcomes fold targets the in-memory hub via `commitHubChange` (FSJ-3a) with zero changes.
6. **Stage-5 stays on wizard confirm** (`stageFive.openModeB()` in `handleMappingConfirmWithCategories` — PWA precedent kept it); fresh b0 landings get NO Stage-5 (ceremony opt-in via the existing `+ New analyze` button). The brief stays collected by ColumnMapping ONLY if `showBrief` is on — turn it OFF in HubCreationFlow (minimal relocation: BriefHeader on Analyze + Stage-5 are the brief's live homes; both write `processContext`, no orphaned readers).
7. **`handleMappingCancel` wipe fix is minimal** (PWA decision 6): first-time cancel stops calling the setRawData([])/setOutcome(null)/… wipe block — engine-detected Y/X are already in the store (written before the modal), so closing the mapping leaves a working session. Applies to ALL cancels.
8. **Azure b0 chrome reuses everything**: `CanvasWorkspace.b0Slots` prop + `OutcomeNoMatchBanner` from `@variscout/ui` (shipped in FSJ-2; Azure's `index.css` already `@source`s packages/ui). The hatch = `openFactorManager()` → `OPEN_FACTOR_MANAGER` → `{isMapping:true, isMappingReEdit:true}` (exists in the Azure reducer — verify the action name); ColumnMapping `mode='edit'` re-edit wiring exists at the Editor render site (initialOutcomes/initialPrimaryScopeDimensions). "+ track another outcome" wires to the same `openFactorManager` (multi-outcome parity by reachability — PWA decision 2).
9. **No-Y floor**: `detectColumns().confidence === 'low'` ⟺ no outcome inferable (core detection.ts) — low-confidence pastes keep the wizard (auto-surfaced hatch), and the `OutcomeNoMatchBanner` covers the b0 no-Y state reached via skip/hatch-cancel. `onSkip` → `usePanelsStore.getState().showExplore()` (never a dead end).
10. **GoalBanner relocation**: mount in Editor's `activeView === 'frame'` region (above FrameView, beside the ribbon area) with `startPrompt="Set a process goal…"`; `onChange` builds `{...activeHub, name: extractHubName(next) || activeHub.name || 'Untitled hub', processGoal: next, updatedAt: Date.now()}` and commits via `commitHubChange` (Word-style: unsaved hubs stay in-memory). Azure's existing populated-GoalBanner on ProcessHubView is untouched (different surface, persisted hubs).
11. **Provenance line content**: `dataFilename ?? 'Pasted Data'` + rows × columns (+ missing % only if a ready figure exists on `dataQualityReport` — omit rather than compute wrong). Hardcoded English per the FSJ-2 precedent (i18n sweep logged).
12. **E2E scope**: ONE task adapts the shared Azure e2e helper(s) that drive paste→`confirmColumnMapping` so measurement-shaped pastes expect the b0 landing; specs that explicitly test wizard surfaces switch fixtures to detection-shaped data where intent-preserving; anything beyond the helper + the directly-broken specs is FSJ-10's budgeted spine rewrite (master plan P4). E2E does NOT run in pr-ready-check; the task runs the adapted specs directly.
13. **Fenced:** match-summary cascade; defect/wide modal+auto-apply paths; the existing-project landing; `acceptMatchSummary`; PWA + packages/\* (Azure-only PR — except NOTHING this time; the ui slots shipped in FSJ-2).
14. **Line numbers are anchors, not gospel** — re-locate by symbol/quote before editing.

---

### Task 1: The landing branch in the paste pipeline (hook core) — Opus implementer

**Files:**

- Modify: `apps/azure/src/features/data-flow/useEditorDataFlow.ts`
- Test: `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.landing.test.ts` (create — model the renderHook + makeOptions harness on `useEditorDataFlow.matchSummary.test.ts`; read it FIRST)

- [ ] **Step 1: Reducer action.** Add `| { type: 'PASTE_LANDED' }` to `EditorFlowAction`; reducer case: `return { ...state, isPasteMode: false, isMapping: false, isMappingReEdit: false };` with the FSJ-3b comment. Extend the existing reducer test file if one exists (grep `editorFlowReducer` in **tests**) else cover via the hook tests.

- [ ] **Step 2: Hook options.** `UseEditorDataFlowOptions` gains:

```ts
  /** FSJ-3b (spec §4.1): fired when a fresh measurement-shaped paste lands
   *  without the mapping vestibule. Editor wires it to the Process-tab landing. */
  onFreshPasteLanded?: () => void;
  /** FSJ-3b (spec §3): fired when a fresh paste enters the WIZARD path
   *  (detection-shaped / low confidence). Editor wires it to provision-only
   *  (ensure + activate, no route) — the Untitled guarantee for every fresh
   *  paste, retiring Stage-1's provisioning role. Mutually exclusive with
   *  onFreshPasteLanded; neither fires on re-ingest. */
  onFreshPasteAnalyzed?: () => void;
```

- [ ] **Step 3: The pipeline branch.** `_proceedWithParsedData(data, opts?: { reingest?: boolean })`. Replace the tail (the defect/wide/dispatch block, anchor `detectDefectFormat`) with:

```ts
const defectResult = detectDefectFormat(data, detected.columnAnalysis);
const wideFormat = detectWideFormat(data);

// FSJ-3b (spec §4.1/§4.2a): measurement-shaped fresh pastes skip the
// ColumnMapping vestibule and land at b0 pre-filled (Y/X written above).
// Kept on today's wizard path: ANY defect detection (Azure's modal has no
// confidence filter — preserving today's routing exactly; PWA gates on
// high|medium), wide shape (the ≥3-channel silent performance auto-apply
// stays untouched), low confidence (= no Y inferable — the mapping surface
// auto-surfaces), and re-ingest (not first-session, spec §7).
const landsAtB0 =
  !opts?.reingest &&
  !defectResult.isDefectFormat &&
  !wideFormat.isWideFormat &&
  detected.confidence !== 'low';

if (landsAtB0) {
  // Quiet-tier interim (spec §4.2): auto-apply time extraction with the
  // current defaults; the adjust/undo chip arrives with FSJ-6.
  if (detected.timeColumn) {
    applyTimeExtraction(detected.timeColumn, timeExtractionConfig);
  }
  setTimeExtractionPrompt(null);
  dispatch({ type: 'PASTE_LANDED' });
  onFreshPasteLanded?.();
  return;
}

/* ...today's defect/wide/PASTE_ANALYZED dispatches + the timeExtractionPrompt
   block stay EXACTLY as-is here... */

if (!opts?.reingest) onFreshPasteAnalyzed?.();
```

Verify what the current tail actually does (Azure sets defect via `setDefectDetection`, wide via inline `setMeasureColumns`+`setAnalysisMode('performance')` — preserve verbatim on the non-landing path). Check `applyTimeExtraction` + `timeExtractionConfig` are in the hook's scope (they come via the ingestion delegation — find the names; if the hook only has `setTimeExtractionPrompt`, thread `applyTimeExtraction` from options the way PWA does). Deps arrays updated.

- [ ] **Step 4: Re-ingest flags.** Grep `_proceedWithParsedData(` — every call inside `acceptMatchSummary` gets `{ reingest: true }`; the fresh call in `handlePasteAnalyze` stays unflagged. Verify `handleAppendPaste` / append flows: if they reach `_proceedWithParsedData`, flag them too (append ≠ first-session).

- [ ] **Step 5: Cancel-never-wipes.** `handleMappingCancel`: keep ONLY `dispatch({ type: 'CANCEL_MAPPING' })` (+ the FSJ-3b comment: engine-detected Y/X are already in the store; explicit clearing is owned by reset affordances). Delete the first-time wipe block (setRawData([]) etc.). Remove now-unused deps.

- [ ] **Step 6: Tests** (`useEditorDataFlow.landing.test.ts`) — fixtures verified by in-test preconditions (call the real core detectors on each fixture and assert its shape — a fixture that stops triggering its detection must fail loudly):

```ts
it('measurement-shaped paste lands: onFreshPasteLanded fires, mapping never opens, Y pre-filled', ...);
it('wide-shaped paste keeps the wizard + fires onFreshPasteAnalyzed (negative control for landing)', ...);
it('defect-shaped paste keeps the wizard + fires onFreshPasteAnalyzed (ANY confidence — Azure gate)', ...);
it('low-confidence paste auto-surfaces the mapping + provisions (spec §4.1/§3)', ...);
it('match-summary re-dispatch fires NEITHER callback (re-ingest is not first-session, spec §7)', ...);
it('first-time mapping cancel keeps the pasted data (spec §4.1 guarded regression)', ...);
```

Run the WHOLE data-flow suite after: `pnpm --filter @variscout/azure-app test -- --run src/features/data-flow` — matchSummary/overlapReplace/provenance/stepCapabilities must stay green (their pastes flow through acceptMatchSummary → reingest-flagged → wizard path preserved). If any pre-existing test pastes measurement-shaped data expecting the wizard, update it honestly (assertions move to "landed without the wizard" — the FSJ-2 Step-7 precedent).

- [ ] **Step 7: Commit** — `feat(azure): measurement-shaped pastes skip the mapping vestibule + cancel never wipes (FSJ-3b, spec §4.1)`

---

### Task 2: Editor wiring — landing + provision callbacks — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx` (the `useEditorDataFlow(...)` options object + a small provision helper next to `makeLandingDeps`)

- [ ] **Step 1:** Next to `makeLandingDeps` (FSJ-3a) add:

```tsx
// FSJ-3b: paste callbacks. Inline arrows re-capture state per render; the
// async user resolution mirrors handleLoadSampleWithLanding. landFreshEntry
// routes (spec §1); provisionFreshPaste ensures WITHOUT routing — the §3
// guarantee for wizard-path pastes (retires Stage-1's provisioning role and
// the empty-goal-Confirm asymmetry, investigations 2026-06-06).
const handleFreshPasteLanded = useCallback(() => {
  void (async () => {
    const user = currentUser ?? (await getCurrentUser().catch(() => null));
    if (!user) return;
    landFreshEntryOnProcess('Untitled project', { ...makeLandingDeps(), user });
  })();
}, [currentUser, makeLandingDeps]);

const handleFreshPasteAnalyzed = useCallback(() => {
  void (async () => {
    const user = currentUser ?? (await getCurrentUser().catch(() => null));
    if (!user) return;
    const deps = makeLandingDeps();
    const hub = ensureHubProject(deps.activeHub, 'Untitled project', user);
    if (hub !== deps.activeHub) {
      deps.registerHub(hub);
      deps.setProcessHubId(hub.id);
    }
    activateHubProject(hub, user.email);
    // no route — the wizard owns the screen (spec §3 provision-only)
  })();
}, [currentUser, makeLandingDeps]);
```

Import `ensureHubProject` (already? check) from '../lib/landing'. Wire both into the `useEditorDataFlow({...})` options object.

- [ ] **Step 2:** Targeted run: `pnpm --filter @variscout/azure-app test -- --run src/pages/__tests__/Editor src/features/data-flow` + tsc clean. Commit — `feat(azure): paste callbacks — land measurement pastes, provision wizard pastes (FSJ-3b, spec §1/§3)`

---

### Task 3: Wizard demotion — Stage-1 retired, ColumnMapping-only, brief off — Opus implementer

**Files:**

- Modify: `apps/azure/src/features/hubCreation/HubCreationFlow.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx` (only if HubCreationFlow's props change ripple)
- Test: `apps/azure/src/features/hubCreation/__tests__/HubCreationFlow.test.tsx` (rewrite the Stage-1 tests honestly)

- [ ] **Step 1:** Read `HubCreationFlow.tsx` fully. Restructure: the Stage-1 `HubGoalForm` branch + `createHubFromGoal`/`useNewHubProvision` usage + the `skipStage1` logic all RETIRE — the component renders ColumnMapping directly (it becomes a thin pass-through; if it reduces to nothing but ColumnMapping + props, consider whether the Editor should mount ColumnMapping directly and HubCreationFlow be deleted — decide by what's smaller; if deleted, `git rm` + update the Editor render sites + keep `HubGoalForm` in `@variscout/ui` untouched). `showBrief={false}` (or remove the prop — read the ColumnMapping default). `goalContext`: thread `activeHub?.processGoal` if the prop plumbs cheaply, else drop it (the bias source was the retired Stage-1 narrative; GoalBanner-set goals can re-thread in FSJ-6 — note it).
- [ ] **Step 2:** `onHubCreated`/`handleHubCreated` callers: the provisioning now happens via `onFreshPasteAnalyzed` (Task 2) BEFORE the wizard renders — verify `handleHubCreated` is still reachable from any surface (Dashboard New Hub path enters the editor differently); if its only caller was Stage-1, it stays for the Dashboard→editor flow only or simplifies. Trace before cutting.
- [ ] **Step 3:** Tests: Stage-1 tests rewrite to the new contract (mapping renders immediately; no goal form; provisioning asserted at the paste layer — covered by Task 1/2 tests; keep the confirm-flow tests). Negative control: `HubGoalForm` never renders on the paste path.
- [ ] **Step 4:** Run `src/features/hubCreation src/pages` + tsc. Commit — `feat(azure): wizard demotes to ColumnMapping-only — Stage-1 goal vestibule retired (FSJ-3b, spec §2/§3)`

---

### Task 4: Azure b0 chrome — b0Slots + hatch + no-Y floor — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx` (the CanvasWorkspace call ~:460-490)
- Modify: `apps/azure/src/pages/Editor.tsx` (pass `onFixData`/`onRenameColumn` to FrameView)
- Test: extend the FrameView test file if a b0 harness exists (check `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`); else rely on the shared-ui slot tests (FSJ-2) + the chrome walk — note which.

- [ ] **Step 1:** Mirror `apps/pwa/src/components/views/FrameView.tsx:444-496` VERBATIM-adapted: FrameView props gain `onFixData?: () => void; onRenameColumn?: (oldName: string, alias: string) => void;`; build the memoized `b0Slots` (provenance topBar from `dataFilename`/`rawData` — add the store selectors if absent; "Fix data…" button; "+ track another outcome" → same `onFixData`; `noYBanner` = `<OutcomeNoMatchBanner onRename={...} onExpectedChange={() => {/* no store home — parity, investigations */}} onSkip={handleSeeData-or-showExplore} />`); pass `b0Slots={b0Slots}` to CanvasWorkspace. data-testids match the PWA's (`b0-provenance`, `b0-fix-data`, `b0-track-another-outcome`) for cross-app e2e symmetry.
- [ ] **Step 2:** Editor passes `onFixData={dataFlow.openFactorManager}` (verify the exact opener name in the Azure hook — `OPEN_FACTOR_MANAGER` dispatcher) and `onRenameColumn={<the Azure column-rename handler — find what ColumnMapping's onColumnRename wires to>}`.
- [ ] **Step 3:** Run FrameView + Editor suites + `pnpm --filter @variscout/azure-app build` (tsc gate). Commit — `feat(azure): b0 landing chrome — provenance + Fix-data hatch + track-another-outcome + no-Y floor (FSJ-3b, spec §4.1)`

---

### Task 5: GoalBanner opt-in on the Process tab — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx` (the `activeView === 'frame'` region, near the ActiveIPScopeRibbon mount)

- [ ] **Step 1:** Mount (mirroring PWA App.tsx's relocation, FSJ-2 Task 3):

```tsx
{
  activeHub && (activeHub.processGoal || true) /* frame tab is the framing surface */ ? (
    <GoalBanner
      goal={activeHub.processGoal ?? ''}
      startPrompt="Set a process goal…"
      onChange={next => {
        void commitHubChange({
          ...activeHub,
          name: extractHubName(next) || activeHub.name || 'Untitled hub',
          processGoal: next,
          updatedAt: Date.now(),
        });
      }}
    />
  ) : null;
}
```

Inside the frame-tab branch only (the empty start-prompt belongs to the framing surface; verify whether a populated banner should ALSO show on other tabs — NO: ProcessHubView owns the reopen surface; keep this frame-only). Import `GoalBanner` from `@variscout/ui` + `extractHubName` from `@variscout/core` (check existing imports).

- [ ] **Step 2:** Run Editor suites + tsc. Commit — `feat(azure): goal ceremony opt-in on the Process tab via GoalBanner, Word-style commit (FSJ-3b, spec §3)`

---

### Task 6: Scoped e2e adaptation — Sonnet implementer

**Files:**

- Discover first: `grep -rln "confirmColumnMapping\|hub-goal-form\|Map Your Data" apps/azure/e2e/` + read the shared helper(s).

- [ ] **Step 1:** Adapt the shared paste-driving helper(s): measurement-shaped pastes now expect `[data-testid="frame-view-b0"]` (no goal form, no "Map Your Data"); add a `pasteToB0` helper; specs that explicitly exercise the wizard switch to detection-shaped fixtures where that preserves intent. Touch ONLY the helper + specs the helper change directly breaks (list them in the report); the remaining sweep is FSJ-10 (decision 12).
- [ ] **Step 2:** Run the touched spec files via `pnpm --filter @variscout/azure-app test:e2e -- <files>` (controller-level if >90s). Commit — `test(azure-e2e): paste helpers follow the b0 landing journey (FSJ-3b; full spine rewrite = FSJ-10)`

---

### Task 7: Full verification + chrome walk + PR (controller-level)

- [ ] **Step 1:** `pnpm --filter @variscout/azure-app test -- --run` + `pnpm --filter @variscout/azure-app build`. Cross-app guard: `git diff --stat origin/main -- apps/pwa packages` EMPTY.
- [ ] **Step 2 (controller):** `bash scripts/pr-ready-check.sh` green.
- [ ] **Step 3 (controller): `--chrome` walk** (fresh Azure dev server from the worktree; drive via `element.click()`; probe app-local stores via `/src/...` URLs and packages via `/@fs/...` — module-identity lesson 2026-06-06):
  - (a) paste measurement CSV → lands at b0 on the Process tab: provenance + "Fix data…", top Y pre-selected with siblings, derived time factors present, Untitled pair active (ribbon), **no goal form, no wizard, no Stage-5**;
  - (b) "+ track another outcome" → ColumnMapping (multi-outcome rows) → cancel → back **with data intact**; confirm → outcomes fold onto the unsaved hub (no IDB write) + Stage-5 opens;
  - (c) paste defect-shaped data → today's modal path + the pair provisioned (provision-only, no route);
  - (d) paste all-categorical → wizard auto-surfaces → cancel → b0 no-Y state with OutcomeNoMatchBanner → Skip → Explore;
  - (e) GoalBanner "＋ Set a process goal…" on the Process tab → save → hub name derived, in-memory until Save As (Word-style);
  - (f) regression: sample → L2 landing (FSJ-3a), manual → b0, Save-As flush + reload survival, second paste into a complete hub → match-summary card.
- [ ] **Step 4: PR** — `feat(fsj-3b): Azure paste lands at b0 + wizard demotion`; reviewer pair verifies against wireframe `b0-landing` (top-bar/no-Y/parity rows; quiet-chip + loud-banner rows are P2/FSJ-6 — out of contract); then `gh pr merge --merge --delete-branch`.
- [ ] **Step 5 (controller, post-merge, direct to main): Apply-at-delivery** — master-plan FSJ-3 row → 3b ✅ (FSJ-3 COMPLETE); investigations: close the empty-goal-asymmetry entry (`[RESOLVED]`), note the goalContext-bias thread (decision 1, Task 3) if dropped, log any walk findings; memory topic-file update.

---

## Self-review notes (done at plan-write)

- **Master-plan FSJ-3b row coverage:** landsAtB0 + PASTE_LANDED + callbacks (T1/T2) ✓ · cancel-wipe fix (T1) ✓ · wizard → hatch (T3 demotion + T4 entry) ✓ · b0Slots chrome (T4) ✓ · goal→GoalBanner minimal relocation (T5; brief keeps BriefHeader/Stage-5 — decision 6) ✓ · empty-goal asymmetry (dissolves via T2's provision-at-paste — decision 4) ✓ · scoped e2e (T6) ✓.
- **§7 gates honored in-PR:** multi-outcome parity by reachability (T4 "+ track another outcome" → mode='edit' ColumnMapping) · no-Y floor (T4) · cancel-never-wipes (T1) · defect/wide stay confirm-not-auto = stay on today's path (decision 2).
- **Known unknowns flagged inline:** `applyTimeExtraction` scope in the Azure hook (T1) · `openFactorManager`/rename handler names (T4) · HubCreationFlow delete-vs-thin decision (T3) · FrameView b0 test harness existence (T4) · append-paste pipeline reachability (T1 Step 4) · e2e helper layout (T6).
- **Type consistency:** `onFreshPasteLanded`/`onFreshPasteAnalyzed?: () => void` (T1 options = T2 wiring); `landFreshEntryOnProcess(title, {...makeLandingDeps(), user})` (FSJ-3a contract); `commitHubChange(hub)` (FSJ-3a contract, T5).
