---
tier: living
purpose: design
title: 'PO-3 · Engine delete — sub-plan (cadence layer out)'
audience: human
status: active
date: 2026-06-04
last-reviewed: 2026-06-04
layer: spec
topic: [process-as-operations, cadence-extraction, state-items, sub-plan]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-3 · Engine Delete — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Worktree: `.worktrees/po-3-engine-delete` (branch `feat/po-3-engine-delete`). Implementer verification = targeted `<90s` runs; the full sweep is controller-level. **All line refs below are 2026-06-04 grounding refs and WILL drift as tasks land — locate by symbol/label, never by cited line number.**

**Goal:** The cadence layer leaves V1 — `buildProcessHubCadence`/`buildProcessHubReview`/`buildCurrentProcessState` + the interim `buildControlReviewQueue` bridge + `ProcessHubReviewPanel` + the state-items UI delete; `ProcessHubView` survives as the thin host (GoalBanner + framing prompt + OutcomePin row + B0-migration banner/modal + CapabilityTab — the §5 host-ordering rule: deleting it would take CS-P2's lift-source offline); the duplicate ReviewPanel survey mount dies (FrameView mounts carry survey alone).

**Architecture:** Reverse-dependency-order deletion ladder — Azure app surfaces first (Task 1), then the ui panel (Task 2), then the core engines + state-item modules (Task 3). Every intermediate state compiles and tests green; no atomic mega-cascade needed.

**Grounded decisions (2026-06-04, 7-slice workflow + owner ratification — encode, don't re-derive):**

- **`buildProcessHubContext` DELETES wholesale (owner-ratified deviation from the spec's "slim for CoScout").** It has ZERO live callers; CoScout's real path is `assembleCoScoutPrompt`/`buildAIContext` over `AIContext` (`packages/core/src/ai/buildAIContext.ts`), which never touches `ProcessHubContextContract`. The spec's acceptance criterion "CoScout prompt assembly tests green with the slimmed context" has no referent — no such tests exist. A literal slim would be internally inconsistent (its control/verification inputs derive from the dying `buildProcessHubReview`).
- **`stateNotes` strips fully (owner-ratified).** `ProcessStateNote` is woven into 3 persisted shapes + the CoScout context type: `ProcessHubAnalyzeMetadata.stateNotes` (processHub.ts), `ProcessContext.stateNotes` (ai/types.ts), `ProjectMetadata.stateNotes` + its writer (projectMetadata.ts). All become zero-reader/zero-writer once the notes UI dies. Delete `processStateNote.ts` + strip all 4 references (spec §10 already relocates the stateNotes design to named-future; PO-4's ProjectMetadata KEEP-set excludes it).
- **The i18n task has ZERO work items** — the dying UI uses hardcoded TS literals (LENS_LABELS/RESPONSE_LABELS/SEVERITY_LABELS/KIND_LABELS), no MessageCatalog keys. PO-1's "deleted-surface i18n keys go with their UI" clause is moot (the hazard never existed). **Fence:** `canvas.system.reviewAction`/`canvas.system.inbox`/`canvas.localMechanism.control` are substring false-positives — no grep-driven key deletion.
- **Hidden cascade members the spec missed** (all orphan the moment the review surface dies): `EvidenceSheet.tsx` (+test), `apps/azure/src/lib/processHubRoutes.ts`/`actionToHref` (+test), core `processEvidence.ts` (`linkFindingsToStateItems`) + `responsePathAction.ts` (`deriveResponsePathAction`) (+tests +barrel lines), and a ~10-handler cluster in `pages/Dashboard.tsx` (notes/evidence/sheet state + 2 mounts).
- **`processHubReview.ts` deletes wholesale** — it exports ONLY `buildReviewItem`, whose only value-consumers are the dying `buildProcessHubReview` + `buildControlReviewQueue`. Its header comment claiming control.ts imports it is STALE (control.ts has its own `buildControlReviewItem`).
- **`ProcessHubFormat.ts` deletes wholesale** — `formatLatestActivity`'s only caller is the dying panel; `formatMetric`/`formatStatus` already have zero consumers (`ProcessHubCard` defines its own local `formatMetric`).
- **ProcessHubView survives** (master-plan host-ordering rule wins over the decision-log §285 "retired" shorthand — its declared retirement happens at CS-P2's lift, not here). Survivor set is LARGER than the spec shorthand: GoalBanner + hub-framing-prompt + OutcomePin row + migration banner/modal + CapabilityTab + the `process-hub-surface` wrapper.
- **e1/f1/g1 flow tests are FALSE POSITIVES** (blanket `@variscout/ui` mocks for the surviving FrameView / the other Dashboard) — do not touch. `apps/azure/src/components/Dashboard.tsx` (~1333-line component) is NOT `pages/Dashboard.tsx` — do not confuse.
- **PWA needs zero changes** (verified — its only matches are the surviving FrameView InboxDigest mount; `cadence: monthly` in its test is an `EvidenceCadence` form value, unrelated).
- **No package.json#exports / tsconfig#paths edits** — all dying modules are root-barrel-only in both core and ui.

**Conventions:** work only in the worktree · commit per task · tsc error revealing an unlisted live consumer → BLOCKED with file:line, don't improvise · locate by symbol, never cited line numbers · `git rm` for whole-file deletions; review `git status` before commit (lint-staged stash hazard — no `git add -A` without a status read).

**Keep-guards (violating any of these = BLOCKED, report instead of proceeding):**

1. `ProcessHubView.tsx` thin host: GoalBanner, hub-framing-prompt block, OutcomePin row, `ProductionLineGlanceMigrationBanner`/`Modal`, `ProcessHubCapabilityTab`, `data-testid="process-hub-surface"`, `useHubMigrationState`, `isProcessHubComplete`. Surviving props: `rollup`, `persistInvestigation`, `onHubCpkTargetCommit`, `onHubGoalChange`, `onEditFraming`.
2. `controlFormat.ts` + `controlFormat.test.ts` + `ProcessHubControlRegion.tsx` + the Editor.tsx Control mount (`controlRegionSlot`) — the PO-2 re-homed Control surface. `controlFormat.ts` matched panel greps only via a header comment.
3. `control.ts` selectors (`selectControlBuckets`/`selectControlReviews`/`ControlReviewItem`/`buildControlReviewItem`) — the project-keyed Control queue; fully independent of `buildControlReviewQueue`; zero rewiring.
4. InboxDigest survivors: the `@variscout/ui` Inbox primitive + barrel exports + **four** of its mounts minus one — azure FrameView, pwa FrameView, AND the canvas `SystemLevelView.tsx` mount (its own spec/drift prompts, not survey — a 4th mount the spec never listed). Only the ReviewPanel mount dies (with its file). The entire `packages/core/src/survey/` engine survives.
5. JourneyPhase: `ai/types.ts` `JourneyPhase` + all consumers (coScout prompts/phases/registry/modes, `useJourneyPhase`, `useProcessProjection`'s local duplicate, `analyzeStatusFromJourneyPhase` in processHub.ts, `projectMetadata.ts`'s consumer) stay byte-identical. **`coScoutModes.test.ts` is the regression sentinel — it must pass untouched.**
6. processHub.ts survivors: `buildProcessHubRollups`, `isProcessHubComplete`, `analyzeStatusFromJourneyPhase`, `asProcessHubId`/`isProcessHubId`/`normalizeProcessHubId`, `DEFAULT_PROCESS_HUB*`, `ProcessHub`/`ProcessHubAnalyze`/`ProcessHubRollup`/`ScopeFilter`/`OutcomeSpec` types, hub-level `reviewSignal` (the OutcomePin read in ProcessHubView is the HUB-level signal — untouched).
7. `ProcessHubEvidencePanel.tsx` + its Dashboard mount — independent evidence-SOURCE ingestion, not the dying review surface (its `cadence` literal is an `EvidenceCadence` form field).
8. i18n: zero catalog changes; `formatStatistic`/`formatPlural` exports stay (the dying files import them; hundreds of live call sites remain).
9. Tests untouched: e1/f1/g1 flow tests, `Dashboard.editFraming.test.tsx`, `InboxDigest.test.tsx`, both FrameView test files, `components/Dashboard.tsx` anything.

---

### Task 1: Azure — the review surface + Dashboard surgery (Opus)

**Files:**

- Delete: `apps/azure/src/components/ProcessHubReviewPanel.tsx` · `apps/azure/src/components/ProcessHubFormat.ts` · `apps/azure/src/components/StateItemNotesDrawer.tsx` + `apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx` · `apps/azure/src/components/EvidenceSheet.tsx` + `apps/azure/src/components/__tests__/EvidenceSheet.test.tsx` · `apps/azure/src/lib/processHubRoutes.ts` + `apps/azure/src/lib/__tests__/processHubRoutes.test.ts`
- Modify: `apps/azure/src/components/ProcessHubView.tsx` · `apps/azure/src/pages/Dashboard.tsx` · `apps/azure/src/components/__tests__/ProcessHubView.test.tsx` · `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx`

- [ ] **Step 1: Trim ProcessHubView to the thin host.** Remove the `ProcessHubReviewPanel` import + mount + the `...reviewProps` spread. Drop the now-unused type imports (`Finding`, `ProcessStateItem`, `ProcessStateNote`, `ResponsePathAction`). The post-trim props interface is EXACTLY:

```typescript
export interface ProcessHubViewProps {
  rollup: ProcessHubRollup<ProcessHubAnalyze>;
  persistInvestigation: (next: ProcessHubAnalyze) => void;
  /**
   * Persist the hub-level Cpk target default (cascade level "hub"). Writes to
   * `processHub.reviewSignal.capability.cpkTarget`. `undefined` clears it.
   */
  onHubCpkTargetCommit: (hubId: string, next: number | undefined) => void;
  /** Called when the analyst edits the goal narrative inline via GoalBanner. */
  onHubGoalChange?: (hubId: string, next: string) => void;
  /** Opens the framing flow for this hub. Absent → no CTA rendered. */
  onEditFraming?: (hubId: string) => void;
}
```

The component body keeps everything else verbatim (GoalBanner → framing prompt → OutcomePin row → migration banner/modal → the scroll surface with `ProcessHubCapabilityTab`); only the `<ProcessHubReviewPanel rollup={rollup} {...reviewProps} />` line goes.

- [ ] **Step 2: Dashboard surgery** (`apps/azure/src/pages/Dashboard.tsx`). For EACH handler below, first grep its callers within the file; delete only if its sole consumers are the dying props/mounts — any unexpected caller → BLOCKED with file:line. Expected removals: `handleSetupSustainment`, `handleLogReview` (vestigial post-PO-2 — only the dying panel's `onSetupControl`/`onLogReview` consumed them), `handleResponsePathAction`, `loadFindingsForItem`, `handleChipClick`, `handleFindingSelect`, `handleRequestAddNote`, `handleRequestEditNote`, `handleSaveNote`, `handleDeleteNote`; the `notesDrawerState`/`isSavingNote`/`sheetState` state; the `<StateItemNotesDrawer>` + `<EvidenceSheet>` mounts; imports (`linkFindingsToStateItems`, `actionToHref`, `EvidenceSheet`, `StateItemNotesDrawer`, `ProcessStateItem`/`ProcessStateNote`/`ProcessStateNoteKind`/`ResponsePathAction` types). **CAUTION:** handlers like the one behind `onOpenInvestigation`/`onStartInvestigation` likely have OTHER consumers (project-open paths) — remove only the prop-passing, keep shared handlers. The `<ProcessHubView>` mount slims to:

```tsx
<ProcessHubView
  rollup={rollup}
  persistInvestigation={persistInvestigation}
  onHubCpkTargetCommit={handleHubCpkTargetCommit}
  onHubGoalChange={handleHubGoalChange}
  onEditFraming={handleEditFraming}
/>
```

(match the existing handler names at the mount — keep whatever the surviving five are wired to today). **Keep:** `ProcessHubEvidencePanel` mount, `ProjectCard`, `SampleDataPicker`, hub-selection scaffold, `handleHubCpkTargetCommit`, goal/framing wiring.

- [ ] **Step 3: Delete the orphaned files**:

```bash
git rm apps/azure/src/components/ProcessHubReviewPanel.tsx \
  apps/azure/src/components/ProcessHubFormat.ts \
  apps/azure/src/components/StateItemNotesDrawer.tsx \
  apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx \
  apps/azure/src/components/EvidenceSheet.tsx \
  apps/azure/src/components/__tests__/EvidenceSheet.test.tsx \
  apps/azure/src/lib/processHubRoutes.ts \
  apps/azure/src/lib/__tests__/processHubRoutes.test.ts
```

- [ ] **Step 4: Trim `ProcessHubView.test.tsx`.** Remove the `vi.mock('../ProcessHubReviewPanel')` block and the `mock-process-hub-review-panel` assertion (the first test keeps its no-tablist + capability-content assertions); drop the ~11 review-only callbacks from `baseProps`. All GoalBanner/framing-prompt/OutcomePin/migration tests stay untouched.
- [ ] **Step 5: Re-anchor `Dashboard.processHub.test.tsx` (load-bearing).** Five tests anchor on `findByRole('region', { name: /Current Process State/ })` (the dying panel's aria region). Re-anchor each to a survivor (`await screen.findByTestId('process-hub-surface')` or `hub-framing-prompt`) — they still assert live behavior (search-filter persistence, evidence-defer, framing wiring). The test that asserts the current-state panel itself ("shows the current-state panel" or equivalent — locate by assertion) is REWRITTEN into the negative control:

```typescript
it('renders the thin hub host without the retired current-state review surface', async () => {
  // ...existing render arrangement...
  await screen.findByTestId('process-hub-surface'); // survivor present
  expect(
    screen.queryByRole('region', { name: /Current Process State/i })
  ).not.toBeInTheDocument(); // the retired surface must NOT come back
});
```

- [ ] **Step 6: Verify (targeted, <90s):**

```bash
pnpm --filter @variscout/azure-app test -- ProcessHubView Dashboard.processHub Dashboard.editFraming
pnpm --filter @variscout/azure-app exec tsc --noEmit
```

Expected: green. (azure tsc covers test files — a missed trim shows here.)

- [ ] **Step 7: Commit** — `feat(po-3): retire the ProcessHubReviewPanel review surface + state-item UI from Azure (thin ProcessHubView host stays)`

### Task 2: UI — ProcessHubCurrentStatePanel deletes (Haiku)

**Files:**

- Delete: `packages/ui/src/components/ProcessHubCurrentStatePanel/` (whole dir: component + `index.ts` + `__tests__/ProcessHubCurrentStatePanel.test.tsx`)
- Modify: `packages/ui/src/index.ts` (remove the `ProcessHubCurrentStatePanel` + `ProcessHubCurrentStatePanelProps` barrel block — locate by symbol)

- [ ] **Step 1:** `git rm -r packages/ui/src/components/ProcessHubCurrentStatePanel/`
- [ ] **Step 2:** Remove the barrel export block from `packages/ui/src/index.ts`.
- [ ] **Step 3: Verify:** `grep -rn "ProcessHubCurrentStatePanel" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v dist` → zero hits; `pnpm --filter @variscout/ui test` + `pnpm --filter @variscout/ui exec tsc --noEmit` → green.
- [ ] **Step 4: Commit** — `feat(po-3): delete ProcessHubCurrentStatePanel (state-items UI goes named-future)`

### Task 3: Core — cadence engines + state-item modules + the stateNotes strip (Opus)

**Files:**

- Delete: `packages/core/src/processState.ts` · `packages/core/src/processHubReview.ts` · `packages/core/src/processEvidence.ts` · `packages/core/src/responsePathAction.ts` · `packages/core/src/processStateNote.ts` + tests `packages/core/src/__tests__/{processState,processStateNote,processEvidence,responsePathAction}.test.ts`
- Modify: `packages/core/src/processHub.ts` · `packages/core/src/projectMetadata.ts` · `packages/core/src/ai/types.ts` · `packages/core/src/index.ts` · `packages/core/src/__tests__/processHub.test.ts` · `packages/core/src/__tests__/evidenceSources.test.ts`

- [ ] **Step 1: processHub.ts engine surgery** (locate every symbol by name). DELETE functions: `buildProcessHubReview` · `buildProcessHubCadence` · `buildControlReviewQueue` (the interim bridge — its `Interim bridge` comment confirms) · `buildProcessHubContext`. DELETE interfaces: `ProcessHubReview` · `ProcessHubReviewItem` · `ProcessHubCadenceSnapshot` · `ProcessHubCadenceQueue` · `ProcessHubCadenceSummary` · `ProcessHubContextContract` · `ProcessHubContextAnalyze` · `ProcessHubMetricContext` · `ProcessHubVariationConcentration`. DELETE imports: `buildReviewItem` (+ its `export {…}` re-export), `buildCurrentProcessState`, all `ProcessState*` type imports, `ProcessStateNote`. STRIP the `stateNotes?: ProcessStateNote[]` field from `ProcessHubAnalyzeMetadata`.
- [ ] **Step 2: Orphan sweep inside processHub.ts.** After Step 1, grep WITHIN the file for each now-suspect private helper: `cadenceQueue`, `evidenceSignals`, `evidenceSignalQueue`, `controlRecentlyReviewedCount`, `buildControlSummary`, `READINESS_REASON_ORDER`, `uniqueReadinessReasons`, `ProcessHubAttentionReason`, `ProcessHubReadinessReason`. Delete each with zero remaining references; REPORT the final kept/deleted split (e.g. `buildControlSummary` dies if `buildProcessHubContext` was its only caller). **Do not touch** the keep-guard #6 survivors.
- [ ] **Step 3: Delete the stranded modules + their tests:**

```bash
git rm packages/core/src/processState.ts packages/core/src/processHubReview.ts \
  packages/core/src/processEvidence.ts packages/core/src/responsePathAction.ts \
  packages/core/src/processStateNote.ts \
  packages/core/src/__tests__/processState.test.ts \
  packages/core/src/__tests__/processStateNote.test.ts \
  packages/core/src/__tests__/processEvidence.test.ts \
  packages/core/src/__tests__/responsePathAction.test.ts
```

- [ ] **Step 4: The stateNotes strip.** Remove `stateNotes` from `ProcessContext` (`ai/types.ts` — type field only; nothing assembles it) and from `ProjectMetadata` + its copy-forward writer in `buildProjectMetadata` (`projectMetadata.ts` — field + the write line). Then: `grep -rn "stateNotes" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v dist` → expected ZERO hits; any sample-fixture hit (`packages/data/src/samples/*`) gets its property removed; any OTHER hit → BLOCKED with file:line.
- [ ] **Step 5: Barrel prune** (`packages/core/src/index.ts`, locate by symbol): remove `buildProcessHubCadence`, `buildProcessHubContext`, `buildProcessHubReview`, `buildCurrentProcessState`, `CurrentProcessState`, `ProcessStateItem`, `ProcessStateLens`, `ProcessStateMetric`, `ProcessStateResponsePath`, `ProcessStateSeverity`, `ProcessStateSource`, `linkFindingsToStateItems`, `RELEVANT_FINDING_STATUSES`, `LinkFindingsResult`, `deriveResponsePathAction`, `ResponsePathAction`, `ProcessHubCadenceQueue`, `ProcessHubCadenceSnapshot`, `ProcessHubCadenceSummary`, `ProcessHubContextContract`, `ProcessHubContextAnalyze`, `ProcessHubMetricContext`, `ProcessHubVariationConcentration`, `ProcessHubReview`, `ProcessHubReviewItem`, `PROCESS_STATE_NOTE_KINDS`, `isProcessStateNoteKind`, `ProcessStateNote`, `ProcessStateNoteKind` (+ `ProcessHubAttentionReason`/`ProcessHubReadinessReason` per the Step 2 outcome). KEEP: `analyzeStatusFromJourneyPhase`, `isProcessHubComplete`, `buildProcessHubRollups`, `normalizeProcessHubId` and every other survivor.
- [ ] **Step 6: Test trims.** In `processHub.test.ts`: delete the `buildProcessHubReview`, `buildProcessHubCadence`, and `buildProcessHubCadence — control lane` describe blocks, plus EVERY block that calls `buildProcessHubContext` (grep the file — includes an `it` inside the surviving `buildProcessHubRollups` describe and the `buildProcessHubContext — control` describe); the rest of the rollups/defaults/id-helper blocks stay. In `evidenceSources.test.ts`: delete the single it-block calling `buildProcessHubCadence` ("allows Process Hub cadence to include latest evidence snapshots") + the import; everything else stays.
- [ ] **Step 7: Verify (targeted):**

```bash
pnpm --filter @variscout/core test -- processHub evidenceSources coScoutModes projectMetadata
pnpm --filter @variscout/core exec tsc --noEmit
grep -rn "buildProcessHubCadence\|buildProcessHubReview\|buildCurrentProcessState\|buildProcessHubContext\|ProcessHubCadence\|ProcessStateItem\|ProcessStateNote\|deriveResponsePathAction\|linkFindingsToStateItems" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v dist
```

Expected: tests green (coScoutModes = the JourneyPhase sentinel, untouched and green); grep → ZERO hits.

- [ ] **Step 8: Commit** — `feat(po-3): delete the cadence engines + state-item modules from core (stateNotes facet strips; zero-caller buildProcessHubContext goes)`

### Task 4: Docs — decision-log entries (Sonnet)

**Files:**

- Modify: `docs/decision-log.md`

(The master-plan PO-3 row's sub-plan link + grounding-amendments note already landed with the plan commit on this branch.)

- [ ] **Step 1: decision-log entries** (append per the log's house format, date 2026-06-04): (a) update the CS-P1 row (locate "hide-not-delete") with a note that PO-3 executed the deferred cadence-engine deletion; (b) new entry: `buildProcessHubContext` deleted as zero-caller dead code — owner-ratified deviation from the spec's "slim for CoScout" (CoScout's real path is `buildAIContext`; the queued CoScout phase+journey brainstorm designs from there); (c) new entry: `stateNotes`/`ProcessStateNote` fully stripped (UI + type + 3 persisted shapes + CoScout-context field) — owner-ratified; design relocated via spec §10; (d) note: the PO-1 "deleted-surface i18n keys" thread closes — the dying surfaces never had catalog keys.
- [ ] **Step 2: Verify:** `pnpm docs:check` green (the pr-ready-check doc gate).
- [ ] **Step 3: Commit** — `docs(po-3): decision-log entries (context zero-caller delete; stateNotes strip; i18n thread closed)`

---

## Controller-level acceptance

`bash scripts/pr-ready-check.sh` green + ALL FOUR suites (`core`, `ui`, `azure-app`, `pwa-app` — the CS-12 lesson: builds alone miss app breakage) · the Step-7 negative-control grep ZERO outside git history · `coScoutModes.test.ts` green untouched (JourneyPhase sentinel) · `--chrome` verify: Process tab renders the thin ProcessHubView (GoalBanner + capability content + no review section; framing prompt on an unframed hub) · FrameView survey inbox still renders (both apps' FrameView tests green) · final adversarial Opus branch review (non-negotiable — caught cross-task seams on PO-1 AND PO-2) · merge `--merge --delete-branch`; DELIVERED flips ride a follow-up commit on main.
