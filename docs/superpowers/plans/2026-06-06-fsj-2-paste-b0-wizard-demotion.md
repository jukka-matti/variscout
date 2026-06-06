---
tier: ephemeral
purpose: build
title: 'FSJ-2 — PWA paste lands at b0 + wizard demotion'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# FSJ-2: PWA Paste Lands at b0 + Wizard Demotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measurement-shaped PWA pastes skip the ColumnMapping vestibule and land on the Process tab at b0 pre-filled by inference; the wizard demotes to the "Fix data…" hatch (demote ≠ delete) with the spec §7 guarded regressions — multi-outcome parity + no-Y floor + rawData-wipe fix — closed in this same PR.

**Architecture:** One new branch in `_proceedWithParsedData` (the single post-parse pipeline): fresh + not-defect + not-wide + inference-confidence ≠ 'low' → dispatch `PASTE_LANDED` + invoke an injected `onFreshPasteLanded` callback that App wires to a new `landPasteOnProcess` landing helper (FSJ-1 pattern). Detection-shaped (defect/wide), low-confidence, and match-summary re-dispatch pastes keep today's wizard path unchanged — the wizard surface IS the auto-surfaced hatch when inference fails. FrameViewB0 gains three optional ReactNode slots (topBar / belowY / noYBanner) threaded through CanvasWorkspace; the PWA FrameView supplies the content (provenance line, "Fix data…" hatch link, "+ track another outcome" link, OutcomeNoMatchBanner port). The Stage-1 HubGoalForm gate is removed from the paste render chain (it would otherwise resurrect on every hatch open) and the goal ceremony relocates to an opt-in GoalBanner empty-prompt on the Process tab.

**Tech Stack:** React + Zustand (PWA app shell), `@variscout/core` detection, `@variscout/ui` shared primitives (optional props only — Azure render sites unchanged), Vitest + RTL (happy-dom patterns per `writing-tests` skill), Playwright (PWA e2e adaptation).

**Branch:** `feat/fsj-2-paste-b0` in own worktree `.worktrees/feat-fsj-2-paste-b0/`.

**Read first:** spec §4.1/§4.2/§4.2a/§7/§8; wireframe `docs/02-journeys/wireframes/b0-landing.md` (the review contract — top bar + no-Y guard + multi-outcome parity rows; the quiet-chip + loud-banner rows are P2, NOT this PR); `apps/pwa/CLAUDE.md`; FSJ-1 sub-plan (`2026-06-06-fsj-1-landing-router-untitled-project.md`) for the landing-helper pattern.

---

## Grounded design decisions (code-verified 2026-06-06 — do not re-litigate in tasks)

1. **`detectColumns().confidence === 'low'` ⟺ no outcome inferable** (`packages/core/src/parser/detection.ts:189-205`). So "auto-surface the hatch on low confidence" (spec §4.1) = simply keep today's wizard path when confidence is 'low' — the mapping surface appears unasked. No new confidence plumbing.
2. **Multi-outcome parity = reachability, not new state.** ColumnMapping is ALREADY multi-outcome (`ColumnMappingConfirmPayload.outcomes: OutcomeSpec[]`, OutcomeCandidateRow checkbox list — `packages/ui/src/components/ColumnMapping/index.tsx:58-86, 759-805`); `projectStore.outcome` stays single (first outcome = lead, per spec §4.1). The "+ track another outcome" link opens the demoted wizard in re-edit mode (`openFactorManager`) — the old wizard's multi-outcome surface, one tap from b0. Reuse-production-primitives over a new inline multi-Y picker.
3. **The Stage-1 gate removal is load-bearing, not cosmetic:** `App.tsx:1369-1379` gates on `isMapping && goalNarrative === null` — without removal, the FIRST "Fix data…" open would resurrect the goal-form vestibule over the hatch.
4. **GoalBanner is the relocation target** (`packages/ui/src/components/GoalBanner/GoalBanner.tsx` — already editable via `onChange`, already writes `sessionHub.processGoal` at `App.tsx:1235-1246`) but returns `null` when no goal exists — it needs an opt-in empty-prompt state or PWA goal entry is deleted, not relocated.
5. **Second-paste match-summary cascade:** arming requires `isProcessHubComplete` = processGoal AND outcomes[] (`packages/core/src/processHub.ts:220-227`) — BOTH are ceremony artifacts that were already opt-in (goal skip = `''` → never folded → hub incomplete → no cascade, today). Relocating ceremony does not break the cascade machinery; it fires less often until the user opts into ceremony. Accepted behavior shift — logged in investigations.md at delivery (Task 7).
6. **Cancel fix is minimal:** `handleMappingCancel` stops calling `clearData()` — no new routing. Engine-detected Y/X are already in the store (`usePasteImportFlow.ts:294-299` runs before the modal), so closing the mapping leaves a working session. Applies to ALL first-time cancels (fresh detection-shaped, low-confidence, re-ingestion) — re-ingestion cancel today wipes the MERGED dataset, which is worse than keeping it.
7. **Skipping the wizard skips `applyTimeExtraction`** (today applied at `handleMappingConfirm`, `usePasteImportFlow.ts:685-687`). The landing branch auto-applies it with the hook's default config — the §4.2 quiet-tier interim; the adjust/undo chip arrives in FSJ-4.
8. **New microcopy is hardcoded English in app-level/`ui` components** following the OutcomeNoMatchBanner precedent — `MessageCatalog` is a closed interface requiring all 32 catalogs per key (core CLAUDE.md); the catalog sweep is deferred and logged (Task 7).
9. **`expectedOutcomeNote` has no store home** (the wizard's own adapter already drops it — `App.tsx:677-695`). The b0 banner port wires `onExpectedChange` to a no-op with a comment — parity, not a new gap; already-known, re-logged at delivery.
10. **Out of scope, named:** the paste row-count guardrail (spec §7) defers to FSJ-4 (needs the non-modal banner infra); Azure mirror = FSJ-3; defect/wide re-framing banners = FSJ-5; per-candidate quality strip = P2.
11. **Adversarial-review notes (2026-06-06):** `OutcomeNoMatchBanner` declares `onRename` but never invokes it (`OutcomeNoMatchBanner.tsx:10` destructures only `onExpectedChange`/`onSkip`) — the Task-5 plumbing satisfies the type; actual renaming happens via "Fix data…" → ColumnMapping. The relocated GoalBanner empty-prompt renders as a top-of-page band above the framing toolbar (its existing mount at `App.tsx:1235`), NOT inside the FrameViewB0 composition — defensible per spec §3 "opt-in on the Process tab"; reviewers should not expect it inside the picker. **Line numbers in this plan are anchors, not gospel — re-locate each by symbol/quote before editing.**

---

### Task 1: The landing branch in the paste pipeline (hook core) — Opus implementer

**Files:**

- Modify: `apps/pwa/src/hooks/usePasteImportFlow.ts`
- Test: `apps/pwa/src/hooks/__tests__/pasteFlowReducer.test.ts` (extend)
- Test: `apps/pwa/src/hooks/__tests__/usePasteImportFlow.landing.test.ts` (create — model the renderHook harness + `pwaHubRepository` mock on `usePasteImportFlow.matchSummary.test.ts`; read it FIRST)
- Test: `apps/pwa/src/hooks/__tests__/usePasteImportFlow.matchSummary.test.ts` (UPDATE two tests — see Step 7; its `CSV_TEXT` fixture is measurement-shaped at 'medium' confidence, so the fresh-paste landing branch fires for it)

- [ ] **Step 1: Write the failing reducer tests** (extend `pasteFlowReducer.test.ts`)

```ts
describe('PASTE_LANDED', () => {
  it('exits paste mode without entering mapping (the b0 landing terminal)', () => {
    const state = pasteFlowReducer(
      { ...initialPasteFlowState, isPasteMode: true },
      { type: 'PASTE_LANDED' }
    );
    expect(state.isPasteMode).toBe(false);
    expect(state.isMapping).toBe(false);
    expect(state.isMappingReEdit).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/pwa test -- --run src/hooks/__tests__/pasteFlowReducer`
Expected: FAIL — `PASTE_LANDED` not a known action type.

- [ ] **Step 3: Add the action + reducer case**

In `PasteFlowAction` union (after `| { type: 'PASTE_ANALYZED_WIDE'; detection: WideFormatDetection }`):

```ts
  | { type: 'PASTE_LANDED' }
```

In `pasteFlowReducer` (after the `PASTE_ANALYZED_WIDE` case):

```ts
    case 'PASTE_LANDED':
      // FSJ-2: measurement-shaped fresh paste — no vestibule, lands at b0.
      return { ...state, isPasteMode: false, isMapping: false, isMappingReEdit: false };
```

Run the reducer suite again. Expected: PASS.

- [ ] **Step 4: Write the failing hook tests** (`usePasteImportFlow.landing.test.ts`)

Harness: `renderHook(() => usePasteImportFlow(options))` with all setters as `vi.fn()` spies (the hook is fully DI — no store mocking needed for these paths); mock `pwaHubRepository` exactly as `usePasteImportFlow.matchSummary.test.ts` does (module-level `vi.mock` BEFORE imports per `writing-tests`). Build fixtures and VERIFY their detection shape inside the test (call `detectColumns`/`detectWideFormat`/`detectDefectFormat` from `@variscout/core` on the fixture and assert the precondition — a fixture that stops triggering its detection must fail loudly, not silently pass):

- `measurementRows`: 30 rows of `{ Timestamp: '2026-01-0X', Cycle_Time_sec: <varied numbers>, Step: 'Step 1'|'Step 2' }` — precondition: `detectColumns(...).confidence !== 'low'`, `detectWideFormat(...).isWideFormat === false`, `detectDefectFormat(...)` not high/medium.
- `wideRows`: crib the smallest fixture from `packages/core/src/parser/__tests__/` wide-format tests — precondition: `isWideFormat === true`.
- `defectRows`: crib from core defect-detection tests — precondition: `isDefectFormat && confidence high|medium`.
- `allCategoricalRows`: `{ Region: 'North'|'South', Product: 'A'|'B' }` — precondition: `detectColumns(...).confidence === 'low'`.

Test cases (each pastes via `act(() => result.current.handlePasteAnalyze(tsvOf(fixture)))` — or call `_proceed` indirectly through the public API only):

```ts
it('measurement-shaped paste lands: onFreshPasteLanded fires, mapping never opens', async () => {
  // after handlePasteAnalyze(measurementTsv):
  expect(onFreshPasteLanded).toHaveBeenCalledTimes(1);
  expect(result.current.isMapping).toBe(false);
  expect(setOutcome).toHaveBeenCalledWith('Cycle_Time_sec'); // pre-fill by inference
});

it('measurement paste with a time column auto-applies extraction with defaults (quiet tier)', async () => {
  expect(applyTimeExtraction).toHaveBeenCalledWith(
    'Timestamp',
    expect.objectContaining({ extractDayOfWeek: true })
  );
  expect(result.current.timeExtractionPrompt).toBeNull();
});

it('wide-shaped paste keeps the wizard path (negative control)', async () => {
  expect(result.current.isMapping).toBe(true);
  expect(result.current.wideFormatDetection).not.toBeNull();
  expect(onFreshPasteLanded).not.toHaveBeenCalled();
});

it('defect-shaped paste keeps the wizard path (negative control)', async () => {
  expect(result.current.isMapping).toBe(true);
  expect(result.current.defectDetection).not.toBeNull();
  expect(onFreshPasteLanded).not.toHaveBeenCalled();
});

it('low-confidence paste auto-surfaces the mapping (spec §4.1 — never a silent empty landing)', async () => {
  // allCategoricalRows:
  expect(result.current.isMapping).toBe(true);
  expect(onFreshPasteLanded).not.toHaveBeenCalled();
});

it('match-summary re-dispatch keeps the pipeline — re-ingestion is not first-session (spec §7)', async () => {
  // harness: activeHub complete (crib matchSummary test setup), paste measurementTsv,
  // acceptMatchSummary({ kind: 'append' }) — then:
  expect(onFreshPasteLanded).not.toHaveBeenCalled();
  expect(result.current.isMapping).toBe(true);
});

it('first-time mapping cancel keeps the pasted data (spec §4.1 guarded regression)', async () => {
  // paste wideRows (enters mapping), then handleMappingCancel():
  expect(result.current.isMapping).toBe(false);
  expect(setRawData).not.toHaveBeenCalledWith([]); // the old clearData wiped via setters
});
```

- [ ] **Step 5: Run to verify failure**

Run: `pnpm --filter @variscout/pwa test -- --run src/hooks/__tests__/usePasteImportFlow.landing`
Expected: FAIL — `onFreshPasteLanded` option unknown; landing cases hit `isMapping === true`.

- [ ] **Step 6: Implement the hook changes**

(a) `UsePasteImportFlowOptions`: REMOVE `clearData: () => void;` (its only consumer was the cancel wipe — verify with grep inside the hook; `ingestion.clearData` keeps its other App call sites untouched) and ADD:

```ts
  /**
   * FSJ-2 (first-session spec §4.1): fired when a fresh measurement-shaped
   * paste lands without the mapping vestibule. App wires this to
   * landPasteOnProcess (ensure project + activate IP + route to Process tab).
   */
  onFreshPasteLanded?: () => void;
```

(b) `_proceedWithParsedData` gains an options param and the landing branch — replace the tail (current lines 304-329, from `// Check for defect format` to the end of the callback) with:

```ts
const defectResult = detectDefectFormat(data, detected.columnAnalysis);
const defectFired =
  defectResult.isDefectFormat &&
  (defectResult.confidence === 'high' || defectResult.confidence === 'medium');
const wideFormat = detectWideFormat(data);

// FSJ-2 (first-session spec §4.1/§4.2a): measurement-shaped fresh pastes
// skip the ColumnMapping vestibule and land at b0 pre-filled (Y/X were
// written above). Kept on today's wizard path: defect/wide shapes (until
// the P2 re-framing banners), low inference confidence (= no Y inferable,
// detection.ts:189-205 — the mapping surface auto-surfaces rather than
// landing on an empty picker), and match-summary re-dispatch (re-ingestion
// is not first-session, spec §7).
const landsAtB0 =
  !opts?.reingest && !defectFired && !wideFormat.isWideFormat && detected.confidence !== 'low';

if (landsAtB0) {
  // Quiet-tier interim (spec §4.2): auto-apply time extraction with the
  // current defaults; the adjust/undo chip arrives with FSJ-4.
  if (detected.timeColumn) {
    applyTimeExtraction(detected.timeColumn, timeExtractionConfig);
  }
  setTimeExtractionPrompt(null);
  dispatch({ type: 'PASTE_LANDED' });
  onFreshPasteLanded?.();
  return;
}

if (defectFired) {
  dispatch({ type: 'DEFECT_DETECTED', detection: defectResult });
}
if (wideFormat.isWideFormat) {
  dispatch({ type: 'PASTE_ANALYZED_WIDE', detection: wideFormat });
} else {
  dispatch({ type: 'PASTE_ANALYZED' });
}

if (detected.timeColumn) {
  setTimeExtractionPrompt({
    timeColumn: detected.timeColumn,
    hasTimeComponent: detected.columnAnalysis.some(
      c =>
        c.name === detected.timeColumn &&
        c.sampleValues.some(v => v.includes('T') || v.includes(':'))
    ),
  });
}
```

Signature: `(data: DataRow[], opts?: { reingest?: boolean }) =>`. Destructure `onFreshPasteLanded` from options at the top of the hook. **Dependency arrays (FSJ-1 stale-closure lesson):** `_proceedWithParsedData`'s deps gain `applyTimeExtraction`, `timeExtractionConfig`, `onFreshPasteLanded`, `opts` is a param (not a dep).

(c) `acceptMatchSummary`: every `_proceedWithParsedData(...)` call inside it — **5 total**: `ms.newRows` ×4 (`:475`, `:491` the `!activeHub` overlap-replace fallback, `:593`, `:606`) + `merged` ×1 (`:554`) — becomes `_proceedWithParsedData(x, { reingest: true })`. Verify the count with `grep -n "_proceedWithParsedData" apps/pwa/src/hooks/usePasteImportFlow.ts` (expect 6 hits incl. the definition; only `handlePasteAnalyze`'s fresh call at `:385` stays unflagged).

(d) `handleMappingCancel` — replace entirely:

```ts
const handleMappingCancel = useCallback(() => {
  // FSJ-2 (spec §4.1 guarded regression): cancel never wipes pasted data.
  // The engine-detected Y/X are already in the store (written before the
  // modal rendered), so closing the mapping leaves a working session.
  // Explicit data clearing is owned by the reset affordances, not cancel.
  dispatch({ type: 'CANCEL_MAPPING' });
}, []);
```

Remove `clearData` from the destructure + the options interface; fix App.tsx's options object — **delete ONLY the `clearData: ingestion.clearData,` line inside the `usePasteImportFlow({...})` call (~`App.tsx:359`). The identical line inside `useAppPanels({...})` (~`App.tsx:370`) MUST stay — that hook still consumes it.**

- [ ] **Step 7: Update the two matchSummary tests the landing branch reaches**

`usePasteImportFlow.matchSummary.test.ts`'s `CSV_TEXT` (`weight_g` + timestamp, no categoricals) detects at confidence 'medium' → fresh pastes of it now LAND instead of mapping. Two tests assert the old behavior:

- "skips matchSummary when no active hub" (~`:160`): change `expect(result.current.isMapping).toBe(true)` → `toBe(false)`, and assert the landing instead (pass an `onFreshPasteLanded` spy in `makeOptions` and expect it called).
- "skips matchSummary when hub is incomplete" (~`:192`): same change — an incomplete hub routes to the fresh pipeline, which now lands at b0.

These are honest behavior-change edits, not test weakening — the assertions move from "wizard opened" to "landed without the wizard," which is FSJ-2's contract.

- [ ] **Step 8: Run the hook + reducer suites**

Run: `pnpm --filter @variscout/pwa test -- --run src/hooks/__tests__/`
Expected: ALL PASS — provenance/overlapReplace/stepCapabilities unchanged (their pastes flow through `acceptMatchSummary`, now reingest-flagged → wizard path preserved); matchSummary passes with the Step-7 edits.

- [ ] **Step 9: Commit**

```bash
git add apps/pwa/src/hooks/usePasteImportFlow.ts apps/pwa/src/hooks/__tests__/ apps/pwa/src/App.tsx
git commit -m "feat(pwa): measurement-shaped pastes skip the mapping vestibule + cancel never wipes data (FSJ-2, spec §4.1)"
```

---

### Task 2: `landPasteOnProcess` + App wiring — Sonnet implementer

**Files:**

- Modify: `apps/pwa/src/lib/landing.ts`, `apps/pwa/src/App.tsx`
- Test: `apps/pwa/src/__tests__/sampleLanding.integration.test.tsx` (extend — its harness already covers the landing lib)

- [ ] **Step 1: Write the failing tests** (extend the landing describe blocks in `sampleLanding.integration.test.tsx`, reusing its store-reset scaffolding)

```ts
describe('landPasteOnProcess (FSJ-2, spec §1/§3)', () => {
  it('creates + activates an Untitled project and routes to the Process tab', () => {
    const showFrame = vi.fn();
    let hub: ProcessHub | null = null;
    landPasteOnProcess({
      sessionHub: null,
      setSessionHub: h => {
        hub = h;
      },
      showFrame,
      isEmbedMode: false,
    });
    expect(hub!.improvementProject!.metadata.title).toBe('Untitled project');
    expect(showFrame).toHaveBeenCalledTimes(1);
    const scope = { hubId: hub!.id, userId: DEFAULT_ACTIVE_IP_USER_ID };
    expect(useActiveIPStore.getState().getActiveIP(scope)).toBe(hub!.improvementProject!.id);
  });

  it('embed mode activates state but never routes (negative control, spec §1)', () => {
    const showFrame = vi.fn();
    landPasteOnProcess({ sessionHub: null, setSessionHub: vi.fn(), showFrame, isEmbedMode: true });
    expect(showFrame).not.toHaveBeenCalled();
  });

  it('reuses a live session hub + IP (referential no-op, spec §3)', () => {
    // build a hub via ensureSessionProject(null, 'Existing'), then:
    // landPasteOnProcess with it — setSessionHub receives the SAME reference,
    // title stays 'Existing'.
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @variscout/pwa test -- --run src/__tests__/sampleLanding` → FAIL (no export).

- [ ] **Step 3: Implement** (append to `landing.ts`)

```ts
/**
 * Deps for the fresh-paste landing path (FSJ-2). Pastes have no name source,
 * so the title is always the spec-correct 'Untitled project' literal (§3).
 */
export interface LandPasteOnProcessDeps extends LandHubOnProcessDeps {
  /** Current session hub — passed as hubBase to the shared core */
  sessionHub: ProcessHub | null;
}

/**
 * Fresh-paste landing handler (spec §1, §3): invoked by usePasteImportFlow's
 * onFreshPasteLanded AFTER the pipeline has written rawData/outcome/factors —
 * data loading is not this function's concern (unlike landOnProcess). Ensure +
 * activate + route only.
 */
export function landPasteOnProcess(deps: LandPasteOnProcessDeps): void {
  const { sessionHub, ...coreDeps } = deps;
  landHubOnProcess(sessionHub, 'Untitled project', coreDeps);
}
```

- [ ] **Step 4: Wire App.tsx** — in the `usePasteImportFlow({...})` options object add:

```ts
      // FSJ-2: measurement-shaped paste landed without the vestibule — ensure
      // the Untitled project + activate + route (spec §1/§3). Inline arrow so
      // the closure re-captures sessionHub each render (FSJ-1 stale-closure lesson).
      onFreshPasteLanded: () =>
        landPasteOnProcess({
          sessionHub,
          setSessionHub,
          showFrame: panels.showFrame,
          isEmbedMode,
        }),
```

Add `landPasteOnProcess` to the existing `./lib/landing` import. NOTE: verify the options object is rebuilt per render (it is — inline literal); if the hook memoizes it anywhere, thread deps accordingly.

- [ ] **Step 5: Run + commit**

Run: `pnpm --filter @variscout/pwa test -- --run src/__tests__/sampleLanding src/hooks/__tests__/usePasteImportFlow.landing`
Expected: PASS.

```bash
git add apps/pwa/src/lib/landing.ts apps/pwa/src/App.tsx apps/pwa/src/__tests__/sampleLanding.integration.test.tsx
git commit -m "feat(pwa): paste landing helper — fresh paste lands on Process with an Untitled project (FSJ-2)"
```

---

### Task 3: Stage-1 gate off the paste path + GoalBanner opt-in relocation — Sonnet implementer

**Files:**

- Modify: `apps/pwa/src/App.tsx` (render chain `:1369-1379`, confirm fold `:677-725`, GoalBanner mount `:1232-1246`, goalNarrative reset effect `:424-425`), `apps/pwa/src/store/sessionStore.tsx`
- Modify: `packages/ui/src/components/GoalBanner/GoalBanner.tsx`
- Test: `packages/ui/src/components/GoalBanner/__tests__/GoalBanner.test.tsx` (extend; create if absent — check first)
- Delete: `apps/pwa/src/__tests__/modeB-stage1.test.tsx` (skipped suite that tests the gate this task removes; rationale preserved in git history)

- [ ] **Step 1: Write the failing GoalBanner tests**

```tsx
it('renders the opt-in prompt when no goal exists and startPrompt is given (FSJ-2 relocation)', () => {
  render(<GoalBanner goal="" startPrompt="Set a process goal…" onChange={vi.fn()} />);
  expect(screen.getByText('Set a process goal…')).toBeInTheDocument();
});

it('clicking the prompt opens the editor; saving fires onChange', async () => {
  const onChange = vi.fn();
  render(<GoalBanner goal="" startPrompt="Set a process goal…" onChange={onChange} />);
  await userEvent.click(screen.getByText('Set a process goal…'));
  await userEvent.type(screen.getByRole('textbox'), 'Reduce cycle time');
  await userEvent.click(screen.getByText('Save'));
  expect(onChange).toHaveBeenCalledWith('Reduce cycle time');
});

it('still renders nothing when empty without startPrompt (Azure parity — negative control)', () => {
  const { container } = render(<GoalBanner goal="" onChange={vi.fn()} />);
  expect(container).toBeEmptyDOMElement();
});
```

- [ ] **Step 2: Run to verify failure**, then implement GoalBanner:

```tsx
export interface GoalBannerProps {
  goal?: string;
  onChange?: (next: string) => void;
  /**
   * FSJ-2 (first-session spec §3): opt-in ceremony entry. When set and no goal
   * exists, renders a quiet start affordance instead of returning null —
   * the goal narrative's post-paste-gate home. Azure callers omit it (unchanged).
   */
  startPrompt?: string;
}
```

In the body, replace `if (!goal && !editing) return null;` with:

```tsx
if (!goal && !editing) {
  if (!startPrompt || !onChange) return null;
  return (
    <div className="goal-banner" data-testid="goal-banner">
      <button type="button" onClick={enterEdit} data-testid="goal-banner-start">
        ＋ {startPrompt}
      </button>
    </div>
  );
}
```

(`enterEdit` already guards on `onChange` and seeds `draft` from `goal` — `''` here, correct.)

- [ ] **Step 3: Remove the Stage-1 gate from App.tsx**

(a) Delete the entire `importFlow.isMapping && goalNarrative === null ? (...HubGoalForm...) :` branch (`:1369-1379`) — ColumnMapping renders directly on `importFlow.isMapping`. Remove the `HubGoalForm` import (the component stays in `@variscout/ui` — Azure's HubCreationFlow uses it; FSJ-3 owns that mirror).
(b) In `handleMappingConfirmWithGoal` (`:677-725`): the edit is NARROW — delete the `goalNarrativeForHub` const (`:704`) and the `...(goalNarrativeForHub ? { name: …, processGoal: … } : {})` spread (`:708-713`); drop `goalNarrative` from the deps array (`:724`). **KEEP everything else**: the `importFlow.handleMappingConfirm(firstOutcome, legacyFactors, legacySpecs)` delegation (`:695`), the outcomes/primaryScopeDimensions fold, and `stageFive.openModeB()` (`:722`). Rename to `handleMappingConfirmToHub` (the goal is gone from it) — update the `onConfirm` wiring at `:1399`.
(c) In the data-clear reset effect (`:420-427`): **delete ONLY the `setGoalNarrative(null)` line** — the effect's `setMobileActiveTab('explore')` + `panels.showExplore()` resets are live and MUST stay. Then remove the remaining `goalNarrative`/`setGoalNarrative` reads from App.
(d) `sessionStore.tsx`: remove the `goalNarrative` field + setter IF App was the only consumer — `grep -rn "goalNarrative" apps/pwa/src` first; if other consumers exist, leave the store field and only detach the paste path, noting the leftover in the commit message.

- [ ] **Step 4: Relocate the ceremony — GoalBanner mount** (`:1232-1246`) becomes:

```tsx
{
  /* Goal ceremony home (FSJ-2, spec §3): opt-in on the Process tab —
          relocated off the paste path. Populated banner renders everywhere
          (unchanged); the empty start-prompt only on the framing surface. */
}
{
  sessionHub && (sessionHub.processGoal || panels.activeView === 'frame') ? (
    <GoalBanner
      goal={sessionHub.processGoal ?? ''}
      startPrompt="Set a process goal…"
      onChange={next => {
        setSessionHub({
          ...sessionHub,
          // Name-derivation parity with the retired wizard fold: a narrative-
          // derived name wins over a default; explicit naming is P3 ceremony.
          name: extractHubName(next) || sessionHub.name || 'Untitled hub',
          processGoal: next,
          updatedAt: Date.now(),
        });
      }}
    />
  ) : null;
}
```

(`extractHubName` is already imported for the old fold — keep the import.)

- [ ] **Step 5: Delete `apps/pwa/src/__tests__/modeB-stage1.test.tsx`** (`git rm`).

- [ ] **Step 6: Run the touched suites**

Run: `pnpm --filter @variscout/ui test -- --run src/components/GoalBanner && pnpm --filter @variscout/pwa test -- --run`
Expected: PASS (full PWA suite — the gate removal touches the App render chain; let the whole app suite be the net).

- [ ] **Step 7: Commit**

```bash
git add -A apps/pwa/src packages/ui/src/components/GoalBanner
git commit -m "feat(pwa): goal ceremony relocates off the paste path to an opt-in GoalBanner (FSJ-2, spec §3)"
```

---

### Task 4: b0 slots in shared ui (FrameViewB0 + CanvasWorkspace passthrough) — Sonnet implementer

**Files:**

- Modify: `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx`, `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` (props interface + the `scope === 'b0'` block at `:1314-1335`)
- Test: `packages/ui/src/components/FrameViewB0/__tests__/` (extend the existing FrameViewB0 suite; create the file if absent — check first)

All additions are OPTIONAL props — Azure render sites compile and render unchanged (the master-plan PWA-first constraint; FSJ-3 wires Azure).

- [ ] **Step 1: Write the failing tests**

```tsx
it('renders the topBar slot above the Y picker', () => {
  renderB0({ topBar: <div data-testid="prov-bar">Pasted · 30 rows</div> });
  expect(screen.getByTestId('prov-bar')).toBeInTheDocument();
});

it('renders the belowYSlot between the Y and X sections', () => {
  renderB0({ belowYSlot: <button data-testid="track-another">＋ track another outcome</button> });
  expect(screen.getByTestId('track-another')).toBeInTheDocument();
});

it('renders noYBanner ONLY when there are no Y candidates (spec §4.1 no-numeric-Y guard)', () => {
  renderB0({ yCandidates: [], noYBanner: <div data-testid="no-y-banner" /> });
  expect(screen.getByTestId('no-y-banner')).toBeInTheDocument();
});

it('suppresses noYBanner when candidates exist (negative control)', () => {
  renderB0({ yCandidates: [numericCandidate], noYBanner: <div data-testid="no-y-banner" /> });
  expect(screen.queryByTestId('no-y-banner')).not.toBeInTheDocument();
});

it('renders identically with no slots (Azure parity — negative control)', () => {
  renderB0({});
  expect(screen.getByTestId('frame-view-b0')).toBeInTheDocument();
  expect(screen.queryByTestId('frame-view-b0-top-bar')).not.toBeInTheDocument();
});
```

(`renderB0` = local helper supplying the required FrameViewB0 props; reuse the existing suite's fixtures. i18n: register locale loaders per `writing-tests` if the suite doesn't already.)

- [ ] **Step 2: Run to verify failure**, then implement FrameViewB0 — props additions:

```ts
  /** Optional top bar (provenance + the "Fix data…" hatch) rendered above the Y picker. FSJ-2, spec §4.1. */
  topBar?: ReactNode;
  /** Optional quiet slot between the Y and X sections ("+ track another outcome"). FSJ-2, spec §4.1. */
  belowYSlot?: ReactNode;
  /** No-Y floor banner — rendered beneath the Y picker ONLY when yCandidates is empty (spec §4.1 no-numeric-Y guard). */
  noYBanner?: ReactNode;
```

Render (inside the existing container):

```tsx
      {topBar && <div data-testid="frame-view-b0-top-bar">{topBar}</div>}

      <YPickerSection ... />   {/* unchanged */}

      {yCandidates.length === 0 && noYBanner && (
        <div data-testid="frame-view-b0-no-y-banner">{noYBanner}</div>
      )}
      {belowYSlot && <div data-testid="frame-view-b0-below-y">{belowYSlot}</div>}

      {selectedY && <XPickerSection ... />}   {/* unchanged */}
```

- [ ] **Step 3: CanvasWorkspace passthrough** — add to `CanvasWorkspaceProps`:

```ts
  /**
   * FSJ-2 b0 landing slots (spec §4.1) — content owned by the app shell
   * (provenance, "Fix data…" hatch, "+ track another outcome", no-Y banner).
   * Optional: Azure does not pass them until FSJ-3.
   */
  b0Slots?: { topBar?: ReactNode; belowY?: ReactNode; noYBanner?: ReactNode };
```

In the `scope === 'b0'` return (`:1317`), spread into FrameViewB0:

```tsx
        <FrameViewB0
          ...existing props unchanged...
          topBar={b0Slots?.topBar}
          belowYSlot={b0Slots?.belowY}
          noYBanner={b0Slots?.noYBanner}
        >
```

- [ ] **Step 4: Run + build** (the ui build's tsc catches what vitest misses — `feedback_ui_build_before_merge`)

Run: `pnpm --filter @variscout/ui test -- --run src/components/FrameViewB0 && pnpm --filter @variscout/ui build`
Expected: PASS + clean build.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/FrameViewB0 packages/ui/src/components/Canvas/CanvasWorkspace.tsx
git commit -m "feat(ui): FrameViewB0 landing slots — topBar / belowY / no-Y floor, threaded through CanvasWorkspace (FSJ-2, spec §4.1)"
```

---

### Task 5: PWA b0 content — provenance, "Fix data…" hatch, "+ track another outcome", no-Y banner port — Sonnet implementer

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx` (props + the CanvasWorkspace call at `:444-477`), `apps/pwa/src/App.tsx` (`:1426` FrameView mount)
- Test: `apps/pwa/src/components/views/__tests__/FrameView.b0.integration.test.tsx` (extend — read its harness first)

- [ ] **Step 1: App passes the import-flow handlers to FrameView** (`App.tsx:1426`):

```tsx
<FrameView
  reingestPendingMatches={pendingMatches}
  onFixData={importFlow.openFactorManager}
  onRenameColumn={importFlow.handleColumnRename}
/>
```

(`openFactorManager` opens ColumnMapping in re-edit mode — cancel-safe by construction, pre-loads `sessionHub.outcomes`. This IS the demoted wizard: one tap from b0 to the multi-outcome surface = the spec §7 parity gate. Confirm still flows through the Task-3 confirm handler — outcomes fold into the hub, stage-five behavior unchanged from today's re-edit path.)

- [ ] **Step 2: Write the failing integration tests** (extend `FrameView.b0.integration.test.tsx`; reuse its provider/mock scaffolding verbatim)

```tsx
it('shows the provenance line with source, rows and columns (b0-landing wireframe top bar)', () => {
  // fixture store: dataFilename 'Pasted Data', 30 rows × 3 columns →
  expect(screen.getByTestId('b0-provenance')).toHaveTextContent(
    /Pasted Data · 30 rows · 3 columns/
  );
});

it('"Fix data…" opens the demoted wizard (fires onFixData)', async () => {
  await userEvent.click(screen.getByTestId('b0-fix-data'));
  expect(onFixData).toHaveBeenCalledTimes(1);
});

it('"+ track another outcome" reaches the multi-outcome surface (fires onFixData — wizard parity, spec §7)', async () => {
  await userEvent.click(screen.getByTestId('b0-track-another-outcome'));
  expect(onFixData).toHaveBeenCalledTimes(1);
});

it('all-categorical data shows the OutcomeNoMatchBanner; skip proceeds to Explore (spec §4.1 no-Y floor)', async () => {
  // fixture: categorical-only rawData →
  expect(screen.getByRole('alert')).toHaveTextContent(/No clear outcome match/);
  await userEvent.click(screen.getByText(/Skip outcome/));
  expect(showExploreMock).toHaveBeenCalled(); // never a dead-end CTA
});

it('numeric data shows no banner (negative control)', () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify failure**, then implement in FrameView:

(a) Props: `onFixData?: () => void; onRenameColumn?: (oldName: string, alias: string) => void;` added to the FrameView props interface.

(b) Build the slots (FrameView already reads `rawData` from the project store; verify `dataFilename` + `dataQualityReport` selectors exist in its store reads — add selectors if absent):

```tsx
// FSJ-2 b0 landing slots (spec §4.1; wireframe b0-landing).
// Hardcoded English per the OutcomeNoMatchBanner precedent — the 32-catalog
// i18n sweep is a logged follow-up, not this PR.
const b0Slots = React.useMemo(() => {
  const columnCount = rawData.length > 0 ? Object.keys(rawData[0]).length : 0;
  // Missing %: prefer a ready figure on dataQualityReport (verify its shape in
  // @variscout/core types); else compute one memoized pass; omit the segment
  // rather than showing a wrong number.
  const missingSegment = missingPct !== undefined ? ` · ${missingPct}% missing` : '';
  return {
    topBar: (
      <div className="flex items-center justify-between gap-3 text-xs text-content-muted">
        <span data-testid="b0-provenance">
          {`${dataFilename ?? 'Data'} · ${rawData.length} rows · ${columnCount} columns${missingSegment}`}
        </span>
        {onFixData && (
          <button
            type="button"
            data-testid="b0-fix-data"
            onClick={onFixData}
            className="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline"
          >
            Fix data…
          </button>
        )}
      </div>
    ),
    belowY: onFixData ? (
      <button
        type="button"
        data-testid="b0-track-another-outcome"
        onClick={onFixData}
        className="text-xs text-content-muted hover:text-content underline-offset-2 hover:underline"
      >
        ＋ track another outcome
      </button>
    ) : undefined,
    noYBanner: (
      <OutcomeNoMatchBanner
        onRename={(oldName, newName) => onRenameColumn?.(oldName, newName)}
        onExpectedChange={() => {
          // Parity with the wizard mount: the note has no store home yet
          // (ProcessHub field pending — known gap, logged in investigations.md).
        }}
        onSkip={handleSeeData}
      />
    ),
  };
}, [rawData, dataFilename, missingPct, onFixData, onRenameColumn, handleSeeData]);
```

(c) Pass `b0Slots={b0Slots}` in the CanvasWorkspace call (`:444-477`). Import `OutcomeNoMatchBanner` from `@variscout/ui` (verify it's exported from the barrel; add the barrel line if not).

- [ ] **Step 4: Run the suite**

Run: `pnpm --filter @variscout/pwa test -- --run src/components/views/__tests__/FrameView`
Expected: PASS, including all pre-existing FrameView suites.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx apps/pwa/src/App.tsx apps/pwa/src/components/views/__tests__/FrameView.b0.integration.test.tsx packages/ui/src/index.ts
git commit -m "feat(pwa): b0 landing chrome — provenance + Fix-data hatch + track-another-outcome + no-Y floor (FSJ-2, spec §4.1)"
```

---

### Task 6: PWA E2E adaptation (ALL paste-driving specs → the new journey) — Sonnet implementer

**Files:**

- Modify: `apps/pwa/e2e/modeB.e2e.spec.ts` (describe blocks at `:67/:157/:204/:253` — re-anchor by title before editing)
- Modify: `apps/pwa/e2e/canvas-keyboard.e2e.spec.ts` (the `completeModeBToCanvas` helper at `:24-28` pastes measurement-shaped CANVAS_CSV then waits for `hub-goal-form` + `map-your-data-heading` — every keyboard test breaks)
- Modify: `apps/pwa/e2e/critical-workflow.spec.ts` (`:115-123` pastes then expects `map-your-data-heading`)

THREE PWA e2e specs drive the paste → goal form → ColumnMapping path that no longer exists for measurement-shaped data (adversarial review C2). `active-ip-cascade.spec.ts` is `.vrs`-based with a persisted `processGoal` — verified fine, no edit. Azure's e2e (32 `confirmColumnMapping` sites) is untouched — its reducer is independent (FSJ-3). E2E does NOT run in pr-ready-check/CI, but leaving known-broken suites violates repo discipline.

- [ ] **Step 1: Rewrite the modeB happy path** — paste measurement-shaped data → expect `[data-testid="frame-view-b0"]` (no goal form, no "Map Your Data") → pre-selected Y chip visible → "See the data" → dashboard → keep the existing export assertions. **Includes the SECOND test inside the happy-path block** ("reload without .vrs import…", `:120-141`) which also pastes and waits for `hub-goal-form` (C3).
- [ ] **Step 2: Rewrite the modeB multi-outcome block** — paste → b0 → click `[data-testid="b0-track-another-outcome"]` → "Map Your Data" surface → check 2 outcomes → confirm → keep the multi-outcome assertions (close the stage-five modal if it appears — grep existing helpers for how other specs dismiss it).
- [ ] **Step 3: Rewrite the modeB cryptic-names block** — use an ALL-CATEGORICAL fixture (cryptic-but-numeric now lands at b0 with base-score candidates; the no-Y floor is the surface under test): paste → low confidence keeps today's wizard → cancel (data survives — assert no return to the empty home screen) → b0 shows the OutcomeNoMatchBanner → Skip → Explore renders.
- [ ] **Step 4: Verify the modeB `.vrs` block against post-FSJ-1 reality** (landing on `frame` — it may be stale on main since FSJ-1 didn't touch e2e); fix if needed.
- [ ] **Step 5: Adapt `completeModeBToCanvas`** (canvas-keyboard) — the helper's purpose is "get data + canvas"; post-FSJ-2 that is paste → land at b0 directly. Drop the goal-form + mapping waits; wait for `frame-view-b0` instead. The keyboard tests themselves should need no changes (helper-only fix).
- [ ] **Step 6: Adapt `critical-workflow.spec.ts`** — same shape: paste → expect b0 landing (or switch its fixture to all-categorical if the test's intent is specifically the wizard surface — read the test's intent first, preserve it honestly).
- [ ] **Step 7: Run the three spec files** — `pnpm --filter @variscout/pwa test:e2e -- modeB canvas-keyboard critical-workflow` (controller-level if it exceeds the 90s implementer budget per `feedback_implementer_long_bash_pitfall`). Expected: PASS.
- [ ] **Step 8: Commit**

```bash
git add apps/pwa/e2e/
git commit -m "test(pwa-e2e): paste-driving specs follow the b0 landing journey (FSJ-2)"
```

---

### Task 7: Full verification + chrome walk + PR (controller-level)

- [ ] **Step 1: Targeted sweeps** — `pnpm --filter @variscout/pwa test -- --run` + `pnpm --filter @variscout/ui test -- --run` + `pnpm --filter @variscout/ui build`. Expected: green.
- [ ] **Step 2 (controller): `bash scripts/pr-ready-check.sh`** — green before PR. **Azure filter check**: `pnpm --filter @variscout/azure-app build` must be untouched-green (optional ui props only).
- [ ] **Step 3 (controller): `--chrome` walk** against the b0-landing wireframe (the review contract):
  - (a) paste measurement CSV → lands at b0 on Process tab: provenance line + "Fix data…" top bar, top Y pre-selected with siblings, X chips, derived time factors present; Untitled project in header; **no goal form, no wizard**;
  - (b) "+ track another outcome" → Map Your Data (multi-outcome rows) → cancel → back at b0 **with data intact**;
  - (c) paste wide-channel data → today's wizard path (stack suggestion) — unchanged;
  - (d) paste all-categorical → wizard auto-surfaces (low confidence) → cancel → b0 no-Y state with OutcomeNoMatchBanner → Skip → Explore;
  - (e) GoalBanner "＋ Set a process goal…" on Process tab → save → banner shows goal, hub name derived;
  - (f) regression: sample → L2 landing (FSJ-1), `?embed=true&sample=…` → chart only, manual entry → b0, second paste into a goal+outcome-complete hub → match-summary card still fires.
- [ ] **Step 4: PR** — `gh pr create` (title `feat(fsj-2): PWA paste lands at b0 + wizard demotion`); spec+quality reviewer pair verifies against wireframe `b0-landing` (top-bar/no-Y/parity rows; quiet-chip + loud-banner rows are P2 — out of contract); final review confirms the §7 guarded regressions all closed in-PR. Then `gh pr merge --merge --delete-branch`.
- [ ] **Step 5 (controller, post-merge, direct to main): Apply-at-delivery doc updates** — master-plan FSJ-2 row → ✅ DELIVERED; investigations.md entries: (i) match-summary cascade arms only after opt-in ceremony post-FSJ-2 (fires less often; revisit in the re-ingestion/Home session), (ii) `expectedOutcomeNote` still has no ProcessHub home (pre-existing, now visible at two mounts), (iii) new b0 microcopy is hardcoded English pending a 32-catalog i18n sweep.

---

## Self-review notes (done at plan-write)

- **Master-plan FSJ-2 row coverage:** measurement-shaped skip + detection routing (T1) ✓ · wizard → "Fix data…" hatch (T4+T5 entry; demote ≠ delete — wizard remains for defect/wide/low-confidence/re-ingestion/hatch) ✓ · `handleMappingCancel` rawData-wipe fix (T1) ✓ · no-Y `OutcomeNoMatchBanner` port (T4 slot + T5 mount) ✓ · `HubGoalForm` Stage-1 gate relocation (T3) ✓ · "+ track another outcome" (T4+T5 — parity by reachability, decision 2) ✓. **Gate honored:** multi-outcome parity + no-Y floor land in THIS PR, before the wizard leaves the primary path.
- **Spec §4.1 extras grounded in the wireframe contract:** provenance line (T5) ✓ · hatch auto-surface on low confidence (T1 decision 1) ✓ · sample-and-paste one-path (both land at b0 by construction post-T1/T2) ✓.
- **Known unknowns flagged inline** (verification steps, not placeholders): `dataQualityReport` missing-% shape (T5); `OutcomeNoMatchBanner` barrel export (T5); FrameViewB0 test-file existence (T4); GoalBanner test-file existence + other `goalNarrative` consumers (T3); stage-five dismissal helper in e2e (T6); wide/defect fixture shapes verified by in-test preconditions (T1).
- **Type consistency:** `onFreshPasteLanded?: () => void` (T1 option = T2 wiring); `b0Slots?: { topBar; belowY; noYBanner }` (T4 = T5); `LandPasteOnProcessDeps extends LandHubOnProcessDeps + sessionHub` (T2, mirrors `LandManualOnProcessDeps`); `startPrompt?: string` (T3).
- **Out of scope, routed:** paste row-count guardrail → FSJ-4 (banner infra); Azure mirror → FSJ-3; §4.2a re-framing banners → FSJ-5; i18n catalog sweep + `expectedOutcomeNote` home → investigations.md (T7).
- **Adversarial review (Opus, 2026-06-06) — fix-first verdict applied:** C1 matchSummary fixture breaks (T1 Step 7 added) · C2/C3 three e2e specs + the modeB reload test (T6 expanded) · C5 call-site count ×5 corrected · C6 effect-edit scoped to one line · C7 `clearData` deletion anchored to the `usePasteImportFlow` options only (`useAppPanels` keeps its line) · C9 confirm-handler edit narrowed (delegation + stageFive KEPT) · C4/C8 line anchors corrected + re-anchor rule added · C10/C11 noted as known limitations (decision 11). Verified-fine: Azure optional-prop safety (GoalBanner/CanvasWorkspace/FrameViewB0 call sites), barrel export exists, all referenced test files exist, b0 harness clears the activeIP gate, `goalNarrative` is App-only.
