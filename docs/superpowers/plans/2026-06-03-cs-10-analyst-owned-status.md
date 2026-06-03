---
tier: ephemeral
purpose: build
title: 'PR-CS-10 — De-automated scoring: analyst-owned hypothesis status'
status: draft
date: 2026-06-03
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-10 — De-automated scoring: analyst-owned hypothesis status

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the analyst the source of truth for a hypothesis's 5-state status; demote `deriveHypothesisStatus` from the displayed authority to a non-binding suggestion chip; rename the code value `'confirmed' → 'evidence-survived-test'` to match the shipped `'Supported'` label.

**Architecture:** Three moves on cleared ground. (1) An atomic, compiler-guided enum rename across all 5 package layers. (2) Re-introduce a named analyst-intent setter (`setHubStatus`) over the _already-existing_ store write-path, wired through `useHypotheses` and the UI exactly like `recordDisconfirmation`. (3) Flip the Wall's **display** sites from rendering `deriveHypothesisStatus(...)` to reading the stored `hub.status`, with the derivation re-surfaced as an advisory suggestion chip — analyst value always wins, the derivation never writes.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand (`analyzeStore`); Vitest + happy-dom; `@variscout/{core,hooks,ui,charts,stores}` + `apps/{azure,pwa}`.

**Spec ref:** §4.0 ("Status is analyst-owned, decided 2026-06-02").

---

## Owner-locked scope decisions (2026-06-03)

- **Free choice, chip suggests only.** The analyst-set control allows **any** of the 5 states freely (full manual override; no validation gate, no contradiction warnings). The suggestion chip only nudges promotion to `evidence-survived-test` when readiness is met. Matches the "tool assists, analyst decides" invariant; least code.
- **Leave + log the PWA/Azure conclusion-categorizer divergence.** PWA buckets 3-way (suspected/contributing/ruledOut, `AnalyzeView.tsx:523-532`); Azure 2-way (suspected/ruledOut, `AnalyzeWorkspace.tsx:849-857`). CS-10 stays **status-only**: both apps read stored `hub.status` identically; the categorizer divergence is **untouched** and logged for a dedicated parity follow-up. Do **not** formalize a `contributing` 6th state.
- **Cp/Cpk / re-ingest / CoScout are out.** Re-ingest auto-link → confirm prompt is **CS-11**; CoScout-as-interpretation-partner is **CS-14**. Touch neither.

## Grounding corrections (7-agent fan-out, 2026-06-03) — recorded so the build doesn't re-discover them

- **Mis-attribution:** the spec/master-plan say "the `setHubStatus` orphan deleted in IM-4c returns." Verified via git: the store action + hook + interface were deleted in **IM-4a** (commit `84045c42`). IM-4c (`c92eee46`) only removed a stale **comment**. The stale comment at `AnalyzeWorkspace.tsx:843` ("IM-4c removed the dead setHubStatus orphan") is the source of the error — **fix it to "IM-4a" in Task 1's docs step**.
- **Not an "un-delete" of the write-path:** `analyzeStore.updateHub(hubId, {status})` already accepts + writes a `status` patch (`analyzeStore.ts:62, 818-824`) and survived IM-4a. CS-10 adds a **named analyst-intent action** over it (clearer intent, matches the deleted symbol, grep/test-able), not a missing mutation.
- **`deriveHypothesisStatus` does NOT auto-apply today.** It is pure/render-only (`survey/wall.ts:24`); all 3 callers (`WallCanvas:473`, `WallCanvas:918`, `MobileCardList:83`) recompute on render — zero store writes. The "demotion" is **structural** (stop letting the derived value BE the displayed status), not removing an active auto-write.
- **NO IDB migration.** Reload-durability is **free**: `buildDocumentSnapshot`/`hydrateDocumentSnapshot` round-trip the whole `hypotheses[]` array via `cloneJson` with no field whitelist (`Editor.tsx:593/610`, PWA `App.tsx:690`). An analyst-set `hub.status` survives `.vrs`/document reload automatically. No Dexie version bump.
- **The value rename touches ZERO i18n catalogs.** The catalog key is `wall.status.confirmed` (value already `'Supported'`), **independent** of the `HypothesisStatus` enum value. After renaming the union member, the `Record<HypothesisStatus, keyof MessageCatalog>` maps point the new member `'evidence-survived-test'` at the **existing** key string `'wall.status.confirmed'`. **Do NOT rename the catalog key** (that would trigger the closed-interface 33-file change for cosmetic alignment — out of scope).
- **`'Supported'` label already shipped** (`en.ts:865`, `HubCard`, `ReportImprovementSummary`). The rename aligns the **code** value with it.
- **Silent-break site:** `packages/charts/src/EvidenceMap/SynthesisLayer.tsx` types status as loose `string` (`getStatusColor(status?: string)`, line 20) — **tsc will NOT flag** the un-renamed `'confirmed'` case at `:22` and the comparison at `:95`. Must be hand-edited; `:95` also still renders the hardcoded `'CONFIRMED'`/`'NOT CONFIRMED'` certainty-overclaim labels — soften them.
- **Do NOT over-rename adjacent domains:** `ControlStatus 'confirmed-sustained'` (`control.ts`) and the `findings.confirmed` defect-**count** i18n key (`processHub.ts`) both contain the substring `confirmed` — leave them untouched.
- **Revived dead readers (behavior change to test):** making `hub.status` authoritative flips ~8 currently-dead `h.status === 'confirmed'` branches from never-firing to reflecting real analyst intent: `useImprovementOrchestration.ts:303` (role: suspected-cause vs contributing), `GoalSection.tsx:51` (goal filter), `IdeaGroupCard.tsx:326` (primary badge), `StepNodeMarker.tsx:18` (open marker), `mechanismBranch.ts:76` (readiness), `useCanvasAnalyzeOverlays.ts:291` (step.investigationCounts.supported), both apps' conclusion categorizers (`AnalyzeWorkspace.tsx:854`, `AnalyzeView.tsx:529`), `Editor.tsx:1854` (open-hubs filter). No direct hypothesis-status→Control-autofire gate exists in core (the only `'confirmed'` improvement coupling is the role-mapping at `useImprovementOrchestration.ts:303`). The final review verifies none of these break.
- **`branchStatus: HypothesisStatus`** (`mechanismBranch.ts:31`), so the two `evaluator.ts` comparisons (`:625`, `:646`) and `deriveBranchStatus` are in the rename scope and **tsc-enforced**.
- **Binding prior to close:** `investigations.md` "Stored-vs-derived hub.status split (LOGGED 2026-05-30, IM-4a)" poses option A (migrate readers to derivation) vs B (persist derived). CS-10's spec decision is a **third** path: **analyst-set stored is the source of truth; derivation advisory.** Task 4 closes that entry following the CS-10 spec, not the older IM-6 "persist derived" framing.
- **Stale doc (opportunistic):** `packages/core/CLAUDE.md` /processHub sub-path list claims `InvestigationStatus` is exported — it was renamed to `AnalyzeStatus` (`f547bfb6`) and no longer exists. Fix the line in Task 4.

---

## The canonical rename token

`'confirmed'` → **`'evidence-survived-test'`** (exact kebab string; lands in the type, the serializer set, the 5 exhaustive maps, and ~35 test assertions). One literal everywhere.

## File structure

- **Rename (Task 1):** the `HypothesisStatus` union member + every typed reader/producer/map (tsc-enforced) + the one loose-typed `charts` reader (manual) + the serializer guard + ~35 tests. One atomic Opus dispatch.
- **Setter (Task 2):** `analyzeStore` action, `useHypotheses` callback, the `HypothesisCardWithPlans` prop + WallCanvas pass-through, app wiring (mirror `recordDisconfirmation`). No display behavior change yet.
- **Flip + chip (Task 3):** `WallCanvas:918` + `MobileCardList:83` display sites → stored; add the advisory chip + the analyst-set control on `HypothesisCardWithPlans`; invert the auto-advance tests.
- **Docs (Task 4):** spec note, decision-log entry, close the investigations prior, the two CLAUDE.md fixes, the stale-comment fix.

---

## Task 1: Atomic rename `'confirmed' → 'evidence-survived-test'` (ONE Opus dispatch)

**Model:** Opus. Per `feedback_atomic_sweep_one_dispatch` — a public-API enum-value change forcing a tsc-wide break is **one** implementer with internal **Architect → Migration → Validator** phases + **per-category commits** (core / hooks / ui / charts / apps / serializer / tests). Do **not** split into sub-tasks. Do it FIRST so all subsequent tasks use the new literal (zero test churn).

**Files:**

- Modify (anchor): `packages/core/src/findings/types.ts:637` (the union member)
- Modify (producer): `packages/core/src/survey/wall.ts:44`
- Modify (typed readers, tsc-enforced): `packages/core/src/survey/evaluator.ts:625,646`; `packages/core/src/findings/mechanismBranch.ts:76`; `packages/hooks/src/useCanvasAnalyzeOverlays.ts:291`; `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx:476`; `packages/ui/src/components/Canvas/internal/StepNodeMarker.tsx:18`; `packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx:326`; `packages/ui/src/components/ImprovementProject/sections/GoalSection.tsx:51`; `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:854`; `apps/azure/src/features/improvement/useImprovementOrchestration.ts:303`; `apps/azure/src/pages/Editor.tsx:1854`; `apps/pwa/src/components/views/AnalyzeView.tsx:529`
- Modify (exhaustive `Record<HypothesisStatus,...>` maps, tsc-enforced — rename the **key**, keep the value): `packages/ui/src/components/AnalyzeWall/HypothesisCard.tsx:96,105`; `packages/ui/src/components/AnalyzeWall/MobileCardList.tsx:37,50`; `packages/ui/src/components/ReportView/ReportImprovementSummary.tsx:45,~52`; `packages/ui/src/components/AnalyzeConclusion/HubCard.tsx` (label map); `apps/azure/src/components/ProjectStatusCard.tsx` (label map)
- Modify (MANUAL — loose `string`, tsc will NOT catch): `packages/charts/src/EvidenceMap/SynthesisLayer.tsx:22,95`
- Modify (serializer guard): `apps/azure/src/services/analyzeSerializer.ts:41`
- Modify (~35 assertions across ~13 test files): `wall.test.ts`, `mechanismBranch.test.ts`, `hypothesis.test.ts`, `survey.test.ts`, `ipReport.test.ts`, `useCanvasAnalyzeOverlays.test.ts`, `useHypotheses.test.ts`, `useImprovementProjections.test.ts`, `useProblemStatement.test.ts`, `HypothesisCard.test.tsx`, `HypothesisCardWithPlans.disconfirmFusion.test.tsx`, `MobileCardList.test.tsx`, `WallCanvas.test.tsx`, `StepNodeMarker.test.tsx`, `causeProjection.test.ts`, `IdeaGroupCard.test.tsx`, `AnalyzeLineageSection.test.tsx`, `GoalSection.test.tsx`, `ReportImprovementSummary.test.tsx`, `analyzeSerializer.test.ts`
- **Do NOT touch:** `control.ts` `'confirmed-sustained'`; the `findings.confirmed` defect-count i18n key in `processHub.ts`; the catalog key `'wall.status.confirmed'` in any `i18n/messages/*.ts`.

- [ ] **Step 1: Rename the union member (the anchor)**

`packages/core/src/findings/types.ts:634-639`:

```ts
export type HypothesisStatus =
  | 'proposed'
  | 'evidenced'
  | 'evidence-survived-test'
  | 'refuted'
  | 'needs-disconfirmation';
```

Update the doc comment above it (point 5: "`evidence-survived-test` — ≥2 distinct evidence types AND ≥1 survived disconfirmation"). Commit: `refactor(core): rename HypothesisStatus 'confirmed' → 'evidence-survived-test' (anchor)`.

- [ ] **Step 2: Run tsc to enumerate every typed break**

Run: `pnpm --filter @variscout/core build && pnpm --filter @variscout/hooks build && pnpm --filter @variscout/ui build && pnpm --filter @variscout/charts build`
Expected: a list of `Type '"confirmed"' is not assignable` + `Record` exhaustiveness errors at the typed-reader + map sites above. This list IS the migration checklist for typed sites. (charts may NOT error — see Step 4.)

- [ ] **Step 3: Migrate core + hooks + ui + maps (compiler-guided), commit per category**

Update the producer (`wall.ts:44` returns `'evidence-survived-test'`), the typed readers, and the exhaustive maps. For the maps, rename only the **key**:

```ts
// HypothesisCard.tsx / MobileCardList.tsx STATUS_KEY
const STATUS_KEY: Record<HypothesisStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  'evidence-survived-test': 'wall.status.confirmed', // catalog key UNCHANGED — value already 'Supported'
  refuted: 'wall.status.refuted',
  'needs-disconfirmation': 'wall.status.needsDisconfirmation',
};
```

Likewise `STATUS_STROKE`/`STATUS_ACCENT` (`'evidence-survived-test': chartColors.pass`), and `ReportImprovementSummary` `STATUS_BADGE_LABELS`/`COLORS` (`'evidence-survived-test': 'Supported'`). Commit per package: `refactor(core|hooks|ui): migrate HypothesisStatus readers to 'evidence-survived-test'`.

- [ ] **Step 4: Hand-edit the loose-typed charts reader + soften the overclaim labels**

`packages/charts/src/EvidenceMap/SynthesisLayer.tsx` — tsc will not flag this (status is `string`). Edit `:22` `case 'evidence-survived-test':` and `:95` the comparison. Soften the hardcoded labels at `:95`:

```tsx
{point.hubStatus === 'evidence-survived-test'
  ? 'SUPPORTED'
  : point.hubStatus === 'refuted'
    ? 'REFUTED'
    : point.hubStatus === 'needs-disconfirmation'
      ? 'NEEDS DISCONFIRMATION'
      : /* ...existing tail... */}
```

Commit: `refactor(charts): rename SynthesisLayer status case + retire CONFIRMED/NOT CONFIRMED overclaim labels`.

- [ ] **Step 5: Update the serializer guard (keep the strict assert — D15)**

`apps/azure/src/services/analyzeSerializer.ts:38-44`:

```ts
const VALID_HYPOTHESIS_STATUSES: ReadonlySet<HypothesisStatus> = new Set([
  'proposed',
  'evidenced',
  'evidence-survived-test',
  'refuted',
  'needs-disconfirmation',
]);
```

Keep `assertHypothesisStatus` throwing on unknown values (no silent old→new migration, per `feedback_strict_assert_over_silent_migration` + RPS V1 D15). Update the doc comment's example legacy value to mention `'confirmed'` is now rejected; note `pnpm dev:reset` for stale dev fixtures. Commit: `refactor(azure): update HypothesisStatus serializer guard`.

- [ ] **Step 6: Migrate the ~35 test assertions, commit**

Replace `'confirmed'` with `'evidence-survived-test'` ONLY where it is the hypothesis-status value (use `createHypothesis()` factories, not bare literals — `feedback ui build`). Leave `'confirmed-sustained'` and defect-count assertions alone. Commit: `test: migrate HypothesisStatus assertions to 'evidence-survived-test'`.

- [ ] **Step 7: Gate — full turbo green (the rename's whole point is compiler-enforced exhaustiveness)**

Run: `pnpm build && pnpm test`
Expected: PASS across all packages + apps. A stray `'confirmed'` hypothesis-status literal anywhere = a failure here or a silent charts bug (Step 4).

---

## Task 2: Re-introduce the analyst-owned `setHubStatus` setter + wire it (TDD)

**Model:** Sonnet (well-specified; mirrors an existing pattern across 1–3 files per layer).

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts` (interface ~238, impl after :885)
- Test: `packages/stores/src/__tests__/analyzeStore.test.ts`
- Modify: `packages/hooks/src/useHypotheses.ts` (interface :64-area, impl after :222, return :401)
- Test: `packages/hooks/src/__tests__/useHypotheses.test.ts`
- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx` (add `onSetStatus?` prop, mirror `onRecordDisconfirmation` at :155/:332)
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` (add `onSetStatus?` to planning props ~:123, pass through ~:979)
- Modify (app wiring, mirror `recordDisconfirmation`): `apps/azure/src/pages/Editor.tsx` (ref pattern :683/:1241 + handler :737), `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` (:448-area), `apps/pwa/src/App.tsx` (:934-area), `apps/pwa/src/components/views/AnalyzeView.tsx` (:397-area)

- [ ] **Step 1: Write the failing store test (analyst sets status; derivation never overwrites)**

`packages/stores/src/__tests__/analyzeStore.test.ts` — re-add the deleted test, plus a load-bearing negative control:

```ts
it('setHubStatus persists the analyst-chosen status (analyst-owned)', () => {
  const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
  useAnalyzeStore.getState().setHubStatus(hub.id, 'evidence-survived-test');
  expect(useAnalyzeStore.getState().hypotheses[0].status).toBe('evidence-survived-test');
});

it('setHubStatus writes any state the analyst picks, even one the derivation would not produce', () => {
  // Negative control: a hub with zero findings derives 'proposed'; the analyst
  // marks it 'refuted' anyway. The store must store the analyst value verbatim —
  // proves the setter is authoritative, not gated by the derivation.
  const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
  useAnalyzeStore.getState().setHubStatus(hub.id, 'refuted');
  expect(useAnalyzeStore.getState().hypotheses[0].status).toBe('refuted');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @variscout/stores test -t setHubStatus`
Expected: FAIL — `setHubStatus is not a function`.

- [ ] **Step 3: Add the store action (verbatim from commit `84045c42`)**

`analyzeStore.ts` — interface near `setHubEvidence` (~:238):

```ts
  setHubStatus: (hubId: string, status: Hypothesis['status']) => void;
```

impl after `setHubEvidence` (~:893):

```ts
  setHubStatus: (hubId, status) => {
    set(state => ({
      hypotheses: state.hypotheses.map(h =>
        h.id !== hubId ? h : { ...h, status, updatedAt: Date.now() }
      ),
    }));
  },
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/stores test -t setHubStatus` → Expected: PASS. Commit: `feat(stores): re-introduce analyst-owned setHubStatus action`.

- [ ] **Step 5: Write the failing hook test (round-trip + negative control)**

`packages/hooks/src/__tests__/useHypotheses.test.ts` — re-add `setHubStatus` coverage + assert it routes through `onHubsChange` (so the store syncs + the Wall re-renders, like `recordDisconfirmation`):

```ts
it('setHubStatus updates local state and fires onHubsChange (analyst-owned)', () => {
  const onHubsChange = vi.fn();
  const { result } = renderHook(() =>
    useHypotheses({ initialHubs: [makeHub({ id: 'h1' })], onHubsChange })
  );
  act(() => result.current.setHubStatus('h1', 'evidence-survived-test'));
  expect(result.current.hubs[0].status).toBe('evidence-survived-test');
  expect(onHubsChange).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ id: 'h1', status: 'evidence-survived-test' }),
    ])
  );
});
```

(Use the file's existing `makeHub` factory / `createHypothesis`.)

- [ ] **Step 6: Run to verify it fails**

Run: `pnpm --filter @variscout/hooks test -t setHubStatus` → Expected: FAIL.

- [ ] **Step 7: Add the hook callback (verbatim from commit `84045c42`)**

`useHypotheses.ts` — interface (~:64):

```ts
  /** Analyst-owned status setter; routes through update() so onHubsChange syncs. */
  setHubStatus: (hubId: string, status: Hypothesis['status']) => void;
```

impl after `recordDisconfirmation` (~:222):

```ts
const setHubStatus = useCallback(
  (hubId: string, status: Hypothesis['status']): void => {
    update(prev => prev.map(h => (h.id !== hubId ? h : { ...h, status, updatedAt: Date.now() })));
  },
  [update]
);
```

add `setHubStatus,` to the return object (~:401).

- [ ] **Step 8: Run to verify pass**

Run: `pnpm --filter @variscout/hooks test -t setHubStatus` → Expected: PASS. Commit: `feat(hooks): re-introduce setHubStatus on useHypotheses`.

- [ ] **Step 9: Plumb the UI prop (mirror `onRecordDisconfirmation`, no behavior yet)**

`HypothesisCardWithPlans.tsx`: add an optional `onSetStatus?: (hubId: string, status: HypothesisStatus) => void;` prop next to `onRecordDisconfirmation` (:155), destructure it (:332). Do NOT render the control yet (Task 3). `WallCanvas.tsx`: add `onSetStatus?` to the planning-props type (~:123) and pass `planningProps.onSetStatus` through where `onRecordDisconfirmation` is passed (~:979).

App wiring — mirror `recordDisconfirmation` end-to-end:

- Azure `Editor.tsx`: add a `setHubStatusRef` like `recordDisconfirmationRef` (:683/:1241 = `hypothesesState.setHubStatus`) and an `onSetStatus` handler in the planning props (:737-area).
- Azure `AnalyzeWorkspace.tsx`: pass `hypothesesState.setHubStatus` through (:448-area).
- PWA `App.tsx`: `onSetStatus: (id, status) => useAnalyzeStore.getState().setHubStatus(id, status)` (:934-area).
- PWA `AnalyzeView.tsx`: pass `store.setHubStatus` through (:397-area).

- [ ] **Step 10: Gate — typecheck + targeted tests green**

Run: `pnpm --filter @variscout/stores test && pnpm --filter @variscout/hooks test && pnpm --filter @variscout/ui build`
Expected: PASS (UI build proves the new prop typechecks through WallCanvas + both card layers). Commit: `feat(ui,apps): plumb onSetStatus through the Wall to both apps`.

---

## Task 3: Flip the Wall to stored-status + advisory chip + analyst-set control (TDD)

**Model:** Opus (the judgment-heavy core: precedence, the chip gating, inverting load-bearing tests, parity).

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` (display flip :918; pass `suggestedStatus`)
- Modify: `packages/ui/src/components/AnalyzeWall/MobileCardList.tsx` (display flip :83)
- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx` (render the chip + the analyst-set control under `canEdit`)
- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCard.tsx` (add optional `suggestedStatus?` for the chip; card stays presentational)
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`, `.../MobileCardList.test.tsx`, `.../HypothesisCardWithPlans.*.test.tsx`

**Precedence contract (the invariant the review enforces):** the **displayed** status = stored `hub.status` (analyst-owned). The **derivation** (`deriveHypothesisStatus`) is computed only as an advisory `suggestedStatus` for the chip + the existing `surveyWallRules` hints + the `WallCanvas:473` `unbackedSurvived` quality flag — it **never** becomes the displayed status and **never** writes. The chip renders only when `suggestedStatus === 'evidence-survived-test' && hub.status !== 'evidence-survived-test'` (no nagging once promoted). `WallCanvas:473` keeps using the derivation (it is an advisory quality check, not a display) — it only took the rename in Task 1.

- [ ] **Step 1: Write/INVERT the failing display tests (stored wins; auto-advance is gone)**

`MobileCardList.test.tsx` — invert the two automation assertions:

```ts
it('renders the stored analyst-set status, not the derivation', () => {
  // Stored 'evidenced' but the evidence would DERIVE 'evidence-survived-test'.
  // The card must show the STORED value — proves the analyst owns the badge.
  const hub = makeHub({ id: 'h-stored', findingIds: ['f-data', 'f-gemba'], status: 'evidenced' });
  // ...render with findings that give 2 evidence types + a survived attempt...
  expect(screen.getByTestId('wall-mobile-hub-h-stored')).toHaveAttribute(
    'data-status',
    'evidenced'
  );
});

it('recording a survived disconfirmation does NOT auto-advance the status (analyst-owned)', () => {
  // The de-automation behavioral assertion: was 'advances to confirmed without reload' (line ~131);
  // now the displayed status stays whatever is stored until the analyst sets it.
  const hub = makeHub({ id: 'h-na', findingIds: ['f-data', 'f-gemba'], status: 'evidenced' });
  // ...render with a survived disconfirmation attempt present...
  expect(screen.getByTestId('wall-mobile-hub-h-na')).toHaveAttribute('data-status', 'evidenced');
});
```

`WallCanvas.test.tsx` — invert the equivalent IM-4a derivation assertion to assert the rendered `displayStatus` reads `hub.status`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @variscout/ui test -t "stored analyst-set status" && pnpm --filter @variscout/ui test -t "does NOT auto-advance"`
Expected: FAIL (still derives).

- [ ] **Step 3: Flip the display sites**

`WallCanvas.tsx:918`: `displayStatus: hub.status,` and add `suggestedStatus: deriveHypothesisStatus(hub, findings),` to `hubProps`.
`MobileCardList.tsx:83`: `const status = hub.status;` and compute `const suggestedStatus = deriveHypothesisStatus(hub, findings);` for the chip.
Keep `WallCanvas:473`'s `deriveHypothesisStatus` call (advisory `unbackedSurvived`).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/ui test -t "stored analyst-set status" && pnpm --filter @variscout/ui test -t "does NOT auto-advance"`
Expected: PASS. Commit: `feat(ui): Wall displays the stored analyst-owned status, not the derivation`.

- [ ] **Step 5: Write the failing chip + control tests (the load-bearing negative controls)**

`HypothesisCardWithPlans.*.test.tsx`:

```ts
it('shows the "mark Supported?" suggestion chip when ready and not yet promoted', () => {
  // suggestedStatus='evidence-survived-test', stored status='evidenced' → chip visible.
  // (render with canEdit + onSetStatus provided)
  expect(screen.getByTestId('status-suggestion-chip')).toBeInTheDocument();
});

it('hides the chip once the analyst has set evidence-survived-test (no nagging)', () => {
  // suggestedStatus='evidence-survived-test', stored status='evidence-survived-test' → chip absent.
  expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
});

it('hides the chip when the analyst lacks edit rights', () => {
  // canEdit=false → no chip, no control (tier/ACL gate mirrors showDisconfirmGesture).
  expect(screen.queryByTestId('status-suggestion-chip')).toBeNull();
});

it('the analyst-set control calls onSetStatus with the chosen state (free choice)', () => {
  const onSetStatus = vi.fn();
  // ...render, pick 'refuted' on a hub whose derivation says 'evidence-survived-test'...
  // assert onSetStatus called with (hubId, 'refuted') — free override, no gate.
  expect(onSetStatus).toHaveBeenCalledWith(expect.any(String), 'refuted');
});
```

- [ ] **Step 6: Run to verify they fail** — Expected: FAIL (no chip/control yet).

- [ ] **Step 7: Render the chip + the analyst-set control on `HypothesisCardWithPlans` (under `canEdit`)**

Gate exactly like `showDisconfirmGesture` (`canEdit && Boolean(onSetStatus)`). The control offers all 5 states (free choice; no validation, no contradiction warning per the owner decision) and calls `onSetStatus(cardProps.hub.id, chosen)`. The chip (`data-testid="status-suggestion-chip"`) renders only when `cardProps.suggestedStatus === 'evidence-survived-test' && cardProps.hub.status !== 'evidence-survived-test'`; clicking it calls `onSetStatus(hub.id, 'evidence-survived-test')`. Copy: "2 evidence types + a survived test — mark Supported?". Use semantic Tailwind classes; mirror the `OneStepAwayBadge`/`surveyWallRules` visual pattern. Card stays presentational — it receives `suggestedStatus` as a prop, never derives.

- [ ] **Step 8: Run to verify pass + ensure the existing `surveyWallRules` hints don't double-nag**

Run: `pnpm --filter @variscout/ui test HypothesisCardWithPlans`
Expected: PASS. Confirm the `evidenced`/`needs-disconfirmation` Survey hints (which key off the derivation, `survey/wall.ts:56`) stay coherent with the new chip (they fire at different readiness levels — no overlap). Commit: `feat(ui): advisory status suggestion chip + analyst-set control on the rich card`.

- [ ] **Step 9: Gate — UI build + full package test**

Run: `pnpm --filter @variscout/ui build && pnpm --filter @variscout/ui test`
Expected: PASS.

---

## Task 4: In-PR docs + close the prior + CLAUDE.md fixes

**Model:** Sonnet / inline.

**Files:** `docs/superpowers/specs/2026-06-02-connective-surface-model-design.md`, `docs/decision-log.md`, `docs/investigations.md`, `packages/core/CLAUDE.md`, `packages/stores/CLAUDE.md`, `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:843`

- [ ] **Step 1: Spec §4.0 delivered-note** — append to the "Status is analyst-owned" paragraph: "**Delivered 2026-06-03 (PR-CS-10):** analyst-owned `setHubStatus` is the source of truth; `deriveHypothesisStatus` demoted to an advisory suggestion chip (free analyst choice, no gate); code value `'confirmed' → 'evidence-survived-test'`. Reload-durability free via DocumentSnapshot; no IDB migration. Conclusion-categorizer PWA(3-way)/Azure(2-way) divergence left + logged for a parity follow-up."

- [ ] **Step 2: decision-log entry (2026-06-03, above the CS-9 entry)** — record: analyst-owned status is the third path (not IM-6 "persist derived"); free-choice + suggest-only chip; categorizer divergence deferred to a parity follow-up; the IM-4a (not IM-4c) attribution correction.

- [ ] **Step 3: Close the investigations.md prior** — mark "Stored-vs-derived hub.status split (LOGGED 2026-05-30, IM-4a)" **RESOLVED 2026-06-03 (PR-CS-10)** with the third-path resolution; add a new lightweight entry for the **PWA/Azure conclusion-categorizer parity divergence** (3-way vs 2-way) as a tracked follow-up.

- [ ] **Step 4: CLAUDE.md fixes** — `packages/core/CLAUDE.md`: drop `InvestigationStatus` from the /processHub export list (renamed to `AnalyzeStatus`, `f547bfb6`). `packages/stores/CLAUDE.md`: update the ADR-080 line if it still implies an auto-status gate ("Control auto-fires once a `Hypothesis` reaches `evidence-survived-test`…" — and the status is now **analyst-set**, not derived).

- [ ] **Step 5: Fix the stale comment** — `AnalyzeWorkspace.tsx:843`: "IM-4c removed the dead setHubStatus orphan" → "IM-4a removed it; CS-10 re-introduced it analyst-owned". Update the now-stale "dead branch" comment at :844 (the `h.status === 'evidence-survived-test'` branch is live again).

- [ ] **Step 6: Commit** — `docs(cs-10): spec note + decision-log + close stored-vs-derived prior + CLAUDE.md fixes`.

---

## Final: whole-branch adversarial review

Per `superpowers:subagent-driven-development`, dispatch the final code-reviewer (Opus) on the whole branch. STEP 0: `git fetch && git checkout` the PR branch (`feedback_code_review_subagent_must_checkout_pr_branch`). Focus the four risk axes:

1. **Precedence leak (highest):** grep every `deriveHypothesisStatus` consumer — confirm each feeds only a hint/quality-flag, never the displayed or persisted status. Confirm no helper resolves status by falling back to the derivation when stored is `'proposed'` (that would re-introduce soft auto-apply).
2. **Rename completeness:** confirm `SynthesisLayer`'s loose-string case was hand-fixed (tsc could not), no stray `'confirmed'` hypothesis-status literal survives (`git grep`), and `'confirmed-sustained'` + the `findings.confirmed` count key were NOT touched.
3. **PWA↔Azure parity:** both apps wire `onSetStatus`; both Wall mounts read stored status; the 3-way vs 2-way categorizer divergence is explicitly logged (not silently widened).
4. **Auto-mutation escape:** verify no `recordDisconfirmation`/re-ingest/`applyAction` path writes `Hypothesis.status` (only `MeasurementPlan.status` auto-bumps — that's CS-11). Verify the revived dead readers (esp. the `useImprovementOrchestration:303` role-mapping) behave sanely on real analyst-set values.

Confirm the load-bearing negative controls actually FAIL when reverted (not presence checks). Confirm `pr-ready-check` green + the investigations prior closed.

## Self-review checklist (run before dispatching Task 1)

- [ ] Spec coverage: §4.0 status-analyst-owned (Tasks 2+3), rename (Task 1), boundary-to-CS-11/14 (scope decisions). ✓
- [ ] Type consistency: `setHubStatus(hubId, status)` signature identical in store + hook + UI prop; the rename token `'evidence-survived-test'` is one literal everywhere; `suggestedStatus`/`displayStatus` prop names consistent across WallCanvas → HypothesisCard(WithPlans). ✓
- [ ] No placeholders: every code step shows code or an exact existing pattern to mirror (`recordDisconfirmation`). ✓
