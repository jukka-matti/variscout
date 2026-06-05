---
tier: living
purpose: design
title: 'PO-4 · Entity dissolution — sub-plan (ProcessHubAnalyze ceases to exist)'
audience: human
status: delivered
date: 2026-06-04
last-reviewed: 2026-06-05
layer: spec
topic: [process-as-operations, entity-disposition, capability-carrier, sub-plan]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-4 · Entity Dissolution — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development — executed as **ONE Opus atomic-cascade dispatch** (Architect → Migration → Validator internal phases, per-category commits) per `feedback_atomic_sweep_one_dispatch`; the carrier introduction is a producer change breaking consumers simultaneously, so the PO-3 reverse-ladder carve-out does not apply wholesale (the commit ladder below still orders consumers-first where possible). Worktree: `.worktrees/po-4-entity-dissolution` (branch `feat/po-4-entity-dissolution`). Implementer verification = targeted `<90s` runs; the full sweep is controller-level. **All line refs are 2026-06-04 grounding refs vs main `e94f156cf` and WILL drift — locate by symbol/label, never by cited line number.**

**Goal:** `ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata` / `ProcessHubRollup` / `buildProcessHubRollups` / `analyzeStatusFromJourneyPhase` / `AnalyzeStatus` / `AnalyzeDepth` / `AnalyzeReadAPI` cease to exist; the per-step capability path reads the new **typed carrier** (`ProcessStepCapabilitySource` — the CS-P2 contract) sourced from `ProcessContext` via the project document; `ProcessHubCard` + the Dashboard hub-card grid retire (a minimal hub selector preserves interim reachability); `ProjectMetadata` slims to the §3 KEEP set; the PWA `investigations` Dexie table retires (v13 `tableName: null`).

**Architecture:** Carrier-first ladder — introduce the carrier + re-thread engines/shared hooks (old types still standing), then the Azure capability surfaces + Dashboard surgery, then the ProjectMetadata slim with its readers/writers atomically, then the persistence cascade + FK annotation re-points, then the type deletion + comment sweep last (now zero-referenced). Every intermediate commit compiles + targeted tests green.

**Acceptance gate:** `grep -rIo 'ProcessHubAnalyze' --include='*.ts' --include='*.tsx' packages apps scripts .claude | wc -l` → **0** (140 today; **src-tree-zero is the gate, not docs-zero** — specs/plans/decision-log are historical record). Comments count — the sweep cleans comment mentions too.

**Grounded decisions (2026-06-04, 6-slice workflow + 24 adversarial verdicts + owner ratification — encode, don't re-derive):**

- **The per-step capability ROW CHANNEL IS DEAD IN PROD.** All three duck-cast readers (`useHubProvision` `(inv as {rows?}).rows`, `stepErrorAggregation` `(member as {rows?}).rows`, `useHubMigrationState.getDatasetColumns`) always resolve to `[]` — the only prod mount builds members from `CloudProject.metadata`, which carries no rows. Rows are non-empty ONLY in test fixtures. The carrier therefore carries **no rows field**; rows stay in the explicit `rowsByAnalyze: ReadonlyMap<string, readonly DataRow[]>` params that already exist (`UseProductionLineGlanceDataInput.rowsByAnalyze`) — **that map is the CS-P2 re-wire seam** (CS-P2 feeds the editor's live `rawData` through it). `rollupStepErrors` gains a `rowsByAnalyze` param; the hook's `windowedMembers` row-splice (`{...member, rows: windowedRows}`) deletes.
- **`AnalyzeReadAPI` is NOT zero-implementor** (verdict REFUTED the hedge): `PwaHubRepository.investigations` does real Dexie reads (`db.investigations.get/where('hubId')`); Azure's is a behavioral stub but a tsc-enforced implementor. Coordinated cascade: interface + `HubRepository.investigations` member + `persistence/index.ts` re-export + BOTH impl blocks + 3 live tests.
- **The carrier MUST carry `migrationDeclinedAt`** (verdict) — `useB0AnalyzesInHub` (`if (meta.migrationDeclinedAt) return false`) + Dashboard's persist merge read it live; B0 banner dismissal silently breaks without it. `nodeMappings` keeps the FULL `AnalyzeNodeMapping` shape incl. `specsOverride` (read by `nodeCapability` `getEffectiveSpecRules`).
- **`['id']` re-points are plain top-level `import type`** (verdict: empirically tsc-verified) — NO inline `import()` workaround; type-only cycles compile under `isolatedModules` (`control.ts` + `findings/miniChart.ts` already import `ImprovementProject` top-level). Justification = structural identity (`ProcessHubAnalyze['id']` ≡ `ImprovementProject['id']` ≡ `EntityBase['id']` = `string`), NOT "the value is always a project id" (factory-defaulted findings carry literal `'general-unassigned'`). Field NAMES stay `investigationId` — the rename is PO-7.
- **Hub-level `ProcessHub.reviewSignal` is a DIFFERENT field from the shed metadata projection** — it is the live Cpk-target home (written by `Dashboard.handleHubCpkTargetCommit`, read by `ProcessHubCapabilityTab`). The rollup's `reviewSignal: hub.reviewSignal ?? reviewSignalSource?.metadata?.reviewSignal` coalesce dies WITH `buildProcessHubRollups` (the metadata branch is already dead in prod — `ProjectMetadata` carries no `reviewSignal` post-PO-2); `ProcessHubView`'s OutcomePin read re-points to `source.hub.reviewSignal` directly. **No live read to repair.**
- **`AnalyzeStatus` death is multi-site**: the enum backs `ProcessContext.analyzeStatus` + `ProjectMetadata.analyzeStatus` + `ProcessHubAnalyzeMetadata.analyzeStatus`, and ONE live non-test reader survives — the **storage.ts sustainment-reopen tombstone** (`oldStatus/newStatus === 'resolved'|'controlled'`). **Owner-ratified: EXCISE the branch** (the trigger is provably dead post-PO-2 — no writer can produce those values; wedge no-back-compat). `tombstoneControlRecordsForInvestigation` (localDb.ts) then goes zero-caller → delete it + its import (+ test block if any). Decision-log entry routes reopen semantics to #12.
- **Owner-ratified: `ProjectMetadata.nextMove`/`currentUnderstandingSummary`/`problemConditionSummary` SHED in PO-4 with an atomic `ProjectCard` slim** (ProjectCard.tsx ~96-104 still live-reads all three — the spec's "only cadence read the projections" was false for them). Logged to the Home-launchpad brief.
- **Owner-ratified: a MINIMAL HUB SELECTOR replaces the hub-card grid** — deleting the grid removes the only non-creation `setSelectedHubId` trigger; the §5 "interim reachable" guarantee for the B0-migration host requires an affordance until CS-P2's lift. A plain `<select aria-label="Select process hub">` (today's visual language, no new interaction pattern per §8). The card's `Start analyze in <name>` affordance (IM-0a violation class) does NOT return.
- **The 4 "deterministic hub context" projections are write-only** (`processDescription` / `customerRequirementSummary` / `processMapSummary` / `surveyReadiness` — zero non-test readers; grounding's KEEP cited only writers; spec §3 SHED wins). They DROP, killing the `localDb.ts` `summarizeSurveyReadiness(evaluateSurvey(...))` pipeline + `buildProjectMetadata`'s 7th param. `evaluateSurvey` itself has live FrameView callers — **fence: only the summarize→metadata pipeline dies**. `ProcessHubProcessMapSummary`/`ProcessHubSurveyReadinessSummary` types + `summarizeProcessMap`/`summarizeSurveyReadiness` go zero-ref → delete (verify each).
- **PO-6 boundary** (verdict-confirmed consistent): PO-4 retires ONLY the PWA `investigations` table. `findings`/`hypotheses`/`causalLinks` tables + their `investigationId` indexes are **PO-6** — do not touch.
- **The dead `kind:'children'` `nodeCapability` branch deletes** + `nodeCapability.children.test.ts` (sole invoker; its data source `meta.reviewSignal` sheds; the one prod caller hardcodes `kind:'column'`).
- **`cascadeRules.ts` carries an `'investigation'` EntityKind** (union member + `cascadesTo` arrays + rules entry) — retires with the entity.
- **`schema.v7.test.ts` pins `LATEST_SCHEMA_VERSION = 12`** — bump to 13 or the PWA suite reds (builds alone won't catch it — CS-12 lesson).
- **`ProcessContext.nextMove` SURVIVES PO-4** (possible live writer via `PISection.tsx` recommendation auto-set; not required for entity dissolution; vestigial-write is PO-7 territory). Only `ProjectMetadata.nextMove` + its copy-forward writer line die.
- **i18n: ZERO catalog work** (verdict-confirmed) — the dying UI uses `formatStatistic`/`formatPlural` with inline English; no `MessageCatalog` keys.

**Conventions:** work only in the worktree · commit per category (ladder below) · tsc error revealing an unlisted live consumer → BLOCKED with file:line, don't improvise · locate by symbol · `git rm` for whole-file deletions · review `git status` before commit (lint-staged stash hazard — no blind `git add -A`).

**Keep-guards (violating any = BLOCKED, report instead of proceeding):**

1. **`ProcessHubView` SURVIVES, re-signed not deleted** — the thin host (GoalBanner + framing prompt + OutcomePin row + B0 banner/modal + CapabilityTab + `data-testid="process-hub-surface"`) deletes only at CS-P2's lift. Same for `ProcessHubCapabilityTab`, `ProductionLineGlanceMigrationBanner/Modal`, `useHubMigrationState`'s `handleSave`/`handleDecline` write contract, and `isProcessHubComplete`.
2. **`ProcessHub` + `OutcomeSpec` + `AnalyzeNodeMapping` + `ScopeFilter` + `ProcessParticipantRef` + `DEFAULT_PROCESS_HUB*` + `normalizeProcessHubId`/`asProcessHubId`/`isProcessHubId` + hub-level `ProcessHub.reviewSignal` + `buildHubReviewSignal` (processReviewSignal.ts) stay byte-identical.**
3. **JourneyPhase untouched**: `ai/types.ts` `JourneyPhase` + all CoScout phase-gating consumers (`prompts/coScout/**`, `modes/*`, `phases/`, `registry.ts` `phases:`, `useJourneyPhase`, `detectPhase` in projectMetadata.ts). **`coScoutModes.test.ts` is the sentinel — green untouched.** Deleting `analyzeStatusFromJourneyPhase` (sole call site: the dying `buildProjectMetadata` line) touches none of them.
4. **Control join semantics byte-identical**: `metadata.investigationId` field name + value flow, the `${hub.id}:sustainment` fallback (`useControlPanelModel.ts`), `selectControlBuckets`/`selectControlReviews`/`ControlReviewItem` bodies, `controlReadiness.ts` predicates, `ipReport.ts` join lines (`record.investigationId === ip.metadata.investigationId`). Type annotations swap; nothing else.
5. **The Hypothesis-domain `nextMove` is a DIFFERENT field** (`findings/types.ts` branch `nextMove`, `mechanismBranch.ts`, `HypothesisCard`/`MobileCardList`/`HubComposer`/`HubCard`, `analyzeStore`/`useHypotheses` Pick lists, `AnalyzeWorkspace` branchFields) — untouched. Same for `ProcessContext.nextMove` + `PISection.tsx`.
6. **PO-5/PO-6/PO-7 fences**: no lineage work (`activeIPLineage`, `investigationLineage` reads in AnalyzeWorkspace/AnalyzeView/ReportView), no PWA findings/hypotheses/causalLinks table work, no `investigationId`→`projectId` field renames, no `'general-unassigned'` literal edits (overloads `DEFAULT_PROCESS_HUB_ID`).
7. **`ProjectMetadata` KEEP set**: `phase` (ProjectCard reads it) · `findingCounts` · `questionCounts` (ADR-085 shape stability) · `lastViewedAt` · `processHubId` · `nodeMappings` · `migrationDeclinedAt` · `sustainment` · `processOwner`/`investigationOwner`/`sponsor`/`contributors` (not analyze-projection fields; their disposition is not PO-4's). DROP set: `analyzeDepth` · `analyzeStatus` · `actionCounts` · `assignedTaskCount` · `hasOverdueTasks` · `processDescription` · `customerRequirementSummary` · `processMapSummary` · `surveyReadiness` · `currentUnderstandingSummary` · `problemConditionSummary` · `nextMove`.
8. **`ProcessHubEvidencePanel` + its Dashboard mount stay** (independent evidence-source ingestion). The Dashboard `evidenceSnapshots`/`controlRecords`/`controlHandoffs` state trio + `loadEvidenceForHub`/`loadSustainmentForHub` effect fed ONLY the dying rollup build — shed them after grepping callers; if the panel's `onEvidenceChanged` prop is required, keep the minimal reload the panel actually needs (locate by symbol, report the final shape).
9. **i18n untouched**; `formatStatistic`/`formatPlural` exports stay.

---

## The carrier (THE CS-P2 CONTRACT — freeze exactly)

Home: `packages/core/src/processHub.ts` (co-located with `AnalyzeNodeMapping` + `ProcessHub`), exported via the root barrel:

```typescript
/**
 * Typed per-step capability carrier — the CS-P2 contract (PO-4).
 * Replaces the dissolved `ProcessHubAnalyze` projection in the per-step
 * capability path. Members are sourced from `ProcessContext` via the project
 * document (the `ProjectMetadata` projection); raw rows travel separately as
 * `rowsByAnalyze` maps (dead-in-prod today — CS-P2 wires the editor's live
 * `rawData` through the existing `rowsByAnalyze` input seam).
 */
export interface ProcessStepCapabilityMemberMetadata {
  /** Durable process context that owns this step's project (1:1). */
  processHubId?: string;
  /** Per-node measurement-column mappings — FULL shape incl. `specsOverride`. */
  nodeMappings?: AnalyzeNodeMapping[];
  /** ISO 8601 marker for dismissed B0 migration prompts. */
  migrationDeclinedAt?: string;
}

export interface ProcessStepCapabilityMember {
  /** The ImprovementProject id under Project⟷Hub 1:1. */
  id: string;
  name: string;
  metadata?: ProcessStepCapabilityMemberMetadata;
}

export interface ProcessStepCapabilitySource {
  hub: ProcessHub;
  members: readonly ProcessStepCapabilityMember[];
}
```

`ProcessHubAnalyze` is structurally assignable to `ProcessStepCapabilityMember` (and `ProcessHubAnalyzeMetadata` to the member metadata) — re-signed engines/hooks compile against BOTH during the ladder; the old types delete last.

---

### Commit 1: Core engines + shared hooks re-thread (carrier in; rows → explicit maps)

**Files:** Modify `packages/core/src/processHub.ts` (add carrier + barrel block in `packages/core/src/index.ts`) · `packages/core/src/scopeDetection.ts` · `packages/core/src/stats/nodeMappingState.ts` · `packages/core/src/stats/nodeCapability.ts` · `packages/core/src/stats/stepErrorAggregation.ts` · `packages/hooks/src/useProductionLineGlanceData.ts` · `packages/hooks/src/useB0AnalyzesInHub.ts` + their tests. Delete `packages/core/src/stats/__tests__/nodeCapability.children.test.ts`.

- [ ] **Step 1:** Add the carrier block above to `processHub.ts` (below `AnalyzeNodeMapping`); export the three types from `packages/core/src/index.ts` (type block, alphabetical near the `ProcessHub*` exports).
- [ ] **Step 2:** `scopeDetection.ts` — `detectScope(investigation: ProcessHubAnalyze)` → `detectScope(member: ProcessStepCapabilityMember)`; import swap. Body (`member.metadata?.nodeMappings ?? []`) unchanged. `detectScopeFromMap` untouched. Refresh the "don't have a `ProcessHubAnalyze`" doc comment.
- [ ] **Step 3:** `nodeMappingState.ts` — `isUnmappedAnalyze(meta: ProcessHubAnalyzeMetadata)` → `(meta: ProcessStepCapabilityMemberMetadata)`; import swap. `suggestNodeMappings` untouched.
- [ ] **Step 4:** `nodeCapability.ts` — re-type the `calculateFromColumn`/`calculateNodeCapability` `investigationMeta` params to `{ nodeMappings?: AnalyzeNodeMapping[] }` (or the member-metadata type); **delete the `kind:'children'` branch** (`calculateFromChildren` + its source union member — sole data source `meta.reviewSignal` sheds; sole invoker is the test). `git rm packages/core/src/stats/__tests__/nodeCapability.children.test.ts`.
- [ ] **Step 5:** `stepErrorAggregation.ts` — re-sign:

```typescript
export interface StepErrorRollupInput {
  hub: /* keep the EXISTING hub param type unchanged — locate by symbol */;
  members: readonly ProcessStepCapabilityMember[];
  /** Per-member raw rows. Dead-in-prod today; CS-P2 wires editor rawData. */
  rowsByAnalyze: ReadonlyMap<string, readonly DataRow[]>;
  defectColumns?: readonly string[];
  contextFilter?: SpecLookupContext;
}
```

(only `members` re-types and `rowsByAnalyze` is added — the `hub`/`defectColumns`/`contextFilter` params stay byte-identical). Body: `const rows = rowsByAnalyze.get(member.id) ?? [];` replaces the duck cast. Update `stepErrorAggregation.test.ts`: fixtures pass `rowsByAnalyze` map; drop `as unknown as ProcessHubAnalyze` / `as never` casts; defect-count math assertions unchanged.

- [ ] **Step 6:** `useProductionLineGlanceData.ts` — `members: readonly ProcessStepCapabilityMember[]`; DELETE the `windowedMembers` row-splice memo (`{...member, rows: windowedRows}`); call `rollupStepErrors({hub, members, rowsByAnalyze: windowedRowsByInvestigation, defectColumns, contextFilter})`; drop the `member.metadata as ProcessHubAnalyzeMetadata` cast (direct typed access). Update its test: `makeMember` → carrier member + sibling `rowsByAnalyze` entries; drop `& {rows}` intersections; capability/error math assertions unchanged.
- [ ] **Step 7:** `useB0AnalyzesInHub.ts` — `members`/`unmapped` re-type to `ProcessStepCapabilityMember`; filter body unchanged. Test: `inv()` factory → carrier member; unmapped/declined/different-hub assertions translate verbatim.
- [ ] **Step 8: Verify (targeted):** `pnpm --filter @variscout/core test -- scopeDetection nodeCapability nodeMappingState stepErrorAggregation processHub && pnpm --filter @variscout/hooks test -- useB0AnalyzesInHub useProductionLineGlanceData && pnpm --filter @variscout/core exec tsc --noEmit && pnpm --filter @variscout/hooks exec tsc --noEmit` → green.
- [ ] **Step 9: Commit** — `refactor(po-4): introduce the ProcessStepCapabilitySource carrier; re-thread engines + shared hooks off ProcessHubAnalyze (rows → explicit rowsByAnalyze maps)`

### Commit 2: Azure capability surfaces + Dashboard surgery (grid → minimal selector)

**Files:** Delete `apps/azure/src/components/ProcessHubCard.tsx`. Modify `apps/azure/src/components/ProcessHubView.tsx` · `ProcessHubCapabilityTab.tsx` · `apps/azure/src/features/processHub/useHubProvision.ts` · `useHubMigrationState.ts` · `apps/azure/src/pages/Dashboard.tsx` · `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` + tests (`ProcessHubView.test.tsx`, `ProcessHubCapabilityTab.test.tsx`, `useHubProvision.test.ts`, `useHubMigrationState.test.ts`, `Dashboard.processHub.test.tsx`, `Dashboard.editFraming.test.tsx`) + e2e `apps/azure/e2e/modeB-framing.spec.ts`.

- [ ] **Step 1:** `useHubProvision.ts` — input `{ source: ProcessStepCapabilitySource }`; result `{ hub, members: readonly ProcessStepCapabilityMember[], rowsByAnalyze }` with `rowsByAnalyze = new Map()` + seam comment (`// CS-P2 seam: populated from the editor's live rawData at lift; the portfolio source carries no rows.`). Duck cast gone. Header comment refreshed.
- [ ] **Step 2:** `useHubMigrationState.ts` — `members: readonly ProcessStepCapabilityMember[]`; `persistInvestigation: (next: ProcessStepCapabilityMember) => void`; `getDatasetColumns` → `const cols: string[] = []` inline at the call site + seam comment (dead-in-prod; CS-P2 wires editor columns); `handleSave`/`handleDecline` metadata rebuilds re-typed to `ProcessStepCapabilityMemberMetadata` — **write contract byte-identical** (nodeMappings single-entry write; `migrationDeclinedAt: new Date().toISOString()`). Test: `member()` factory → carrier; KEEP the `handleSave`/`handleDecline` write-contract assertions (load-bearing).
- [ ] **Step 3:** `ProcessHubView.tsx` — props re-sign (prop renamed `rollup` → `source`; honest naming, the mount + tests rewrite anyway):

```typescript
export interface ProcessHubViewProps {
  source: ProcessStepCapabilitySource;
  persistInvestigation: (next: ProcessStepCapabilityMember) => void;
  onHubCpkTargetCommit: (hubId: string, next: number | undefined) => void;
  onHubGoalChange?: (hubId: string, next: string) => void;
  onEditFraming?: (hubId: string) => void;
}
```

Body: `rollup.hub` → `source.hub`; `rollup.analyzes` → `source.members`; the OutcomePin block's `rollup.reviewSignal` reads → `source.hub.reviewSignal` (keep the existing `as { mean?: number }` cast verbatim — not PO-4's to fix). Everything else (GoalBanner, framing prompt, migration banner/modal, CapabilityTab mount, `process-hub-surface` testid) verbatim.

- [ ] **Step 4:** `ProcessHubCapabilityTab.tsx` — prop `rollup` → `source: ProcessStepCapabilitySource`; provision call + `detectScope(provision.members[0])` + `source.hub.reviewSignal?.capability?.cpkTarget` reads re-point. Tests: rollup fixtures → `source` + the empty `rowsByAnalyze`; drop `as unknown as ProcessHubRollup<...>` casts; cascade/Cpk-editor assertions stay.
- [ ] **Step 5: Dashboard surgery** (`apps/azure/src/pages/Dashboard.tsx`, locate by symbol):
  - DELETE: the `ProcessHubCard` import + the hub-card grid `<section>` content (the `hubRollups.map(...)` grid + the "Show all analyzes" reset button) + the `hubRollups` memo + the `buildProcessHubRollups`/`ProcessHubAnalyze` imports + `selectedHubRollup`.
  - REPLACE the grid with the minimal selector (same `<section>` + "Process Hubs" heading):

```tsx
<select
  aria-label="Select process hub"
  value={selectedHubId ?? ''}
  onChange={e => setSelectedHubId(e.target.value || null)}
  className="w-full max-w-md rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
>
  <option value="">All process hubs</option>
  {processHubs.map(hub => (
    <option key={hub.id} value={hub.id}>
      {hub.name}
    </option>
  ))}
</select>
```

- ADD the carrier build replacing the rollup memo:

```typescript
const selectedHub = processHubs.find(hub => hub.id === selectedHubId);
const capabilitySource = useMemo<ProcessStepCapabilitySource | undefined>(() => {
  if (!selectedHub) return undefined;
  return {
    hub: selectedHub,
    members: sortedProjects
      .filter(p => normalizeProcessHubId(p.metadata?.processHubId) === selectedHub.id)
      .map(p => ({ id: p.id || p.name, name: p.name, metadata: p.metadata })),
  };
}, [selectedHub, sortedProjects]);
```

(the members' raw `metadata.processHubId` re-filter inside the hooks is preserved behavior — do not normalize member metadata). The `<ProcessHubView>` mount becomes `{selectedHub && capabilitySource && (<><ProcessHubView source={capabilitySource} … /><ProcessHubEvidencePanel hubId={selectedHub.id} … /></>)}`.

- `handlePersistInvestigation` re-signs to `(next: ProcessStepCapabilityMember)` — the processContext merge body (nodeMappings/migrationDeclinedAt) byte-identical.
- Empty-state condition `sortedProjects.length === 0 && hubRollups.length === 0` → `… && processHubs.length === 0`.
- SHED (after grepping callers per keep-guard 8): the `evidenceSnapshots`/`controlRecords`/`controlHandoffs` state trio, their load effect, `loadEvidenceForHub`/`loadSustainmentForHub` if zero-consumer beyond it, and the now-unused `ControlRecord`/`ControlHandoff`/`EvidenceSnapshot` type imports. Handle `ProcessHubEvidencePanel.onEvidenceChanged` per the guard.
- [ ] **Step 6:** `CanvasWorkspace.tsx` (packages/ui) — `members: [] as ProcessHubAnalyze[]` → `[] as ProcessStepCapabilityMember[]`; import swap (`@variscout/core`); `previewRollup` naming → `previewSource` optional.
- [ ] **Step 7: Test rewrites.** `ProcessHubView.test.tsx`: fixtures → `source` (hub + members); GoalBanner/framing/OutcomePin/migration assertions read `hub.*` — survive. `Dashboard.processHub.test.tsx`: DELETE the hub-cards render test + the card-metrics test (the card is gone); re-anchor hub-selection tests from `getByLabelText('Open Line N')`/`'Start analyze in Line 4'` to `fireEvent.change(screen.getByLabelText('Select process hub'), { target: { value: <hubId> } })`; the evidence-defer test re-targets to "EvidencePanel mounts only when a hub is selected" if the state trio shed; ADD the negative control:

```typescript
it('renders no hub cards and no start-analyze affordance (IM-0a)', async () => {
  // ...existing render arrangement with hubs + projects...
  await screen.findByLabelText('Select process hub'); // survivor present
  expect(screen.queryByRole('button', { name: /^Open / })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Start analyze in/ })).not.toBeInTheDocument();
});
```

`Dashboard.editFraming.test.tsx`: re-anchor its `getByLabelText('Open Line 4')` clicks to the select. e2e `modeB-framing.spec.ts` groups 2+4: `page.getByRole('button', { name: 'Open <fixture name>' })` → `page.getByLabel('Select process hub').selectOption({ label: '<fixture name>' })`; groups 1+3 untouched.

- [ ] **Step 8: Verify:** `pnpm --filter @variscout/azure-app test -- ProcessHubView ProcessHubCapabilityTab Dashboard.processHub Dashboard.editFraming useHubProvision useHubMigrationState && pnpm --filter @variscout/azure-app exec tsc --noEmit && pnpm --filter @variscout/ui exec tsc --noEmit` → green (azure tsc covers test files + the e2e spec).
- [ ] **Step 9: Commit** — `refactor(po-4): retire ProcessHubCard + the hub-card grid (minimal hub selector); re-sign ProcessHubView/CapabilityTab + Dashboard onto the carrier`

### Commit 3: ProjectMetadata slim + readers/writers atomic

**Files:** Modify `packages/core/src/projectMetadata.ts` · `apps/azure/src/components/ProjectCard.tsx` · `apps/azure/src/services/localDb.ts` · `apps/azure/src/services/cloudSync.ts` · `apps/azure/src/services/storage.ts` · `packages/core/src/ai/types.ts` (+ affected tests; `packages/data/src/samples/*` fixtures if they carry dropped fields).

- [ ] **Step 1:** `projectMetadata.ts` — DROP the keep-guard-7 DROP set from the `ProjectMetadata` interface + the matching writer lines in `buildProjectMetadata`'s return (incl. `analyzeStatus: processContext?.analyzeStatus ?? analyzeStatusFromJourneyPhase(phase)`); drop the `surveyReadiness` parameter (7th) + the `assignedTaskCount`/`hasOverdueTasks` accumulation block + `summarizeProcessMap` (zero-caller after) + the dead imports (`AnalyzeDepth`, `AnalyzeStatus`, `analyzeStatusFromJourneyPhase`, `ProcessHubProcessMapSummary`, `ProcessHubSurveyReadinessSummary`). `detectPhase`/`phase` stay (JourneyPhase guard).
- [ ] **Step 2:** `ai/types.ts` — DROP `ProcessContext.analyzeDepth` + `ProcessContext.analyzeStatus` (+ their `AnalyzeDepth`/`AnalyzeStatus` imports). KEEP `processHubId`/`nodeMappings`/`migrationDeclinedAt`/owners/`nextMove`/`description`/everything else.
- [ ] **Step 3:** `ProjectCard.tsx` — remove the `currentUnderstandingSummary`/`problemConditionSummary`/`nextMove` reads from the summary block (the block keeps `metadata?.processHubId` if that's its only survivor — slim the conditional accordingly). `phase`/`findingCounts`/`questionCounts`/`sustainment` reads stay.
- [ ] **Step 4:** `localDb.ts` — remove the `summarizeSurveyReadiness(evaluateSurvey({...}))` computation + the 7th arg to `buildProjectMetadata`. Zero-caller-check `summarizeSurveyReadiness` afterwards → delete it (+ barrel line + test block) if zero; `evaluateSurvey` + the survey engine stay (FrameView callers).
- [ ] **Step 5:** `cloudSync.ts` — in the default-`ProjectMetadata` literal, drop the `actionCounts`/`assignedTaskCount`/`hasOverdueTasks` lines.
- [ ] **Step 6:** `storage.ts` — EXCISE the reopen-tombstone branch (the `oldStatus`/`newStatus`/`wasSustainment`/`isSustainment` block + the `tombstoneControlRecordsForInvestigation(name, Date.now())` call + its import). Then zero-caller-check `tombstoneControlRecordsForInvestigation` in `localDb.ts` → delete the function (+ its test block if any). Any storage.test assertion pinning the tombstone behavior → delete that block (it pins excised-dead behavior), note it in the report.
- [ ] **Step 7:** Repo-wide grep `analyzeStatus|analyzeDepth` (non-test src) → remaining hits must be ONLY comments/glossary-term strings (control.ts/controlReadiness.ts/Editor.tsx narrative comments; `glossary/terms.ts` ids — PO-7 territory, leave). Any LIVE code hit → BLOCKED with file:line. Sample fixtures (`packages/data/src/samples/*`) carrying dropped fields get the properties removed.
- [ ] **Step 8: Verify:** `pnpm --filter @variscout/core test -- projectMetadata coScoutModes && pnpm --filter @variscout/azure-app test -- ProjectCard storage localDb cloudSync && pnpm --filter @variscout/azure-app exec tsc --noEmit` → green (coScoutModes = JourneyPhase sentinel).
- [ ] **Step 9: Commit** — `refactor(po-4): slim ProjectMetadata to the §3 KEEP set (atomic ProjectCard slim; surveyReadiness pipeline + reopen tombstone excised)`

### Commit 4: Persistence cascade + FK annotation re-points

**Files:** Modify `packages/core/src/persistence/HubRepository.ts` · `persistence/index.ts` · `persistence/cascadeRules.ts` · `packages/core/src/control.ts` · `findings/types.ts` · `improvementProject/types.ts` · `actions/{scope,finding,hypothesis,causalLink}Actions.ts` · `apps/azure/src/persistence/AzureHubRepository.ts` · `apps/pwa/src/persistence/PwaHubRepository.ts` · `apps/pwa/src/db/schema.ts` + tests (`AzureHubRepository.read.test.ts`, `PwaHubRepository.test.ts`, pwa `applyAction.test.ts`, `schema.v7.test.ts`, cascadeRules tests).

- [ ] **Step 1:** `HubRepository.ts` — DELETE the `AnalyzeReadAPI` interface + the `investigations: AnalyzeReadAPI;` contract member; re-point the 4 `listByInvestigation(investigationId: ProcessHubAnalyze['id'])` annotations (Finding/Scope/CausalLink/Hypothesis Read APIs) → `ImprovementProject['id']`; swap the import (`+ import type { ImprovementProject } from '../improvementProject';`, drop `ProcessHubAnalyze`). `persistence/index.ts`: remove `AnalyzeReadAPI` from the export list.
- [ ] **Step 2:** `cascadeRules.ts` — remove the `'investigation'` EntityKind union member + its `cascadesTo` occurrences + the `investigation: { cascadesTo: [...] }` rules entry; trim any cascadeRules test blocks keyed on `'investigation'` (scope the grep to cascadeRules + its tests — the bare string is common elsewhere).
- [ ] **Step 3:** FK annotation re-points (type-only; names stay; plain top-level `import type`): `control.ts` ×4 (`ControlRecord.investigationId`, `ControlReview.investigationId` + `escalatedInvestigationId?`, `ControlHandoff.investigationId`) → `ImprovementProject['id']` (already imported; drop `ProcessHubAnalyze` from the processHub import, keep `ProcessHub`/`ProcessParticipantRef`; refresh the "(soon-dead) analyzeStatus" comment) · `findings/types.ts` ×3 → same (+ top-level import) · `improvementProject/types.ts` `metadata.investigationId?` → `ImprovementProject['id']` (same-file forward ref is legal; drop `ProcessHubAnalyze` from its import) · the 4 action files' `investigationId: ProcessHubAnalyze['id']` → `ImprovementProject['id']` + imports.
- [ ] **Step 4:** `AzureHubRepository.ts` — delete the `investigations: AnalyzeReadAPI` stub member + import; refresh the stale "F3 normalizes" comment. `AzureHubRepository.read.test.ts`: delete the two `investigations.get/listByHub` it() cases (siblings stay).
- [ ] **Step 5:** `PwaHubRepository.ts` — delete the `investigations: AnalyzeReadAPI` member (real Dexie reads) + import; header comment refresh. Surviving `listByInvestigation` impls use inferred params — re-typing flows from core. `PwaHubRepository.test.ts`: delete `db.investigations.clear()` + the `investigations.listByHub returns []` it(). pwa `applyAction.test.ts`: remove the `db.investigations.count()` assertion + fix its comment (the `db.findings.count()` + SCOPE_ADD no-op assertions stay).
- [ ] **Step 6:** `apps/pwa/src/db/schema.ts` — append after the v12 block:

```typescript
// v13 (PO-4): ProcessHubAnalyze dissolved — the never-written
// `investigations` projection table retires (tableName: null; the v1
// store declaration stays per the Dexie monotonic-chain rule, mirroring
// the v10 `questions: null` precedent).
this.version(13).stores({ investigations: null });
```

Delete the `InvestigationRow` alias + the `investigations!: Table<...>` member + `ProcessHubAnalyze` from the `@variscout/core/processHub` import + the header-comment mention. **Leave the v1 `investigations: '&id, hubId, deletedAt'` store declaration intact.** `schema.v7.test.ts`: `LATEST_SCHEMA_VERSION = 12` → `13` + the version comment block.

- [ ] **Step 7: Verify:** `pnpm --filter @variscout/pwa test -- schema PwaHubRepository applyAction App modeA1 && pnpm --filter @variscout/azure-app test -- AzureHubRepository && pnpm --filter @variscout/core test -- control ipReport cascadeRules && pnpm --filter @variscout/hooks test -- useControlPanelModel && pnpm --filter @variscout/core exec tsc --noEmit` → green (App/modeA1 = the legacy v11→v13 upgrade path empirically exercised; useControlPanelModel + ipReport = the Control join-key sentinels).
- [ ] **Step 8: Commit** — `refactor(po-4): delete the AnalyzeReadAPI surface + PWA investigations table (v13 null); re-point all ProcessHubAnalyze['id'] FK annotations → ImprovementProject['id'] (type-only)`

### Commit 5: The type deletion + residual sweep (zero references)

**Files:** Modify `packages/core/src/processHub.ts` · `packages/core/src/index.ts` + residual comment/test files. Trim `packages/core/src/__tests__/processHub.test.ts` · `processHub.nodeMappings.test.ts` · `scopeDetection.test.ts` · `nodeMappingState.test.ts` · `nodeCapability.column.test.ts`.

- [ ] **Step 1:** `processHub.ts` surgery (locate every symbol by name). DELETE: `AnalyzeDepth` · `AnalyzeStatus` · `ProcessHubAnalyzeMetadata` · `ProcessHubAnalyze` · `ProcessHubRollup` · `ACTIVE_STATUSES` · `analyzeStatusFromJourneyPhase` · `newestAnalyze` · `synthesizeOrphanHub` · `buildProcessHubRollups` (whole body incl. the `reviewSignalSource` coalesce + `summarySource` reads). Zero-ref-check then delete `ProcessHubProcessMapSummary` + `ProcessHubSurveyReadinessSummary` (their last readers died in Commit 3). KEEP everything in keep-guard 2 + the carrier + `isProcessHubComplete`.
- [ ] **Step 2:** Barrel prune (`packages/core/src/index.ts`, locate by symbol): remove `buildProcessHubRollups`, `analyzeStatusFromJourneyPhase` (value block) + `AnalyzeDepth`, `AnalyzeStatus`, `ProcessHubAnalyze`, `ProcessHubAnalyzeMetadata`, `ProcessHubRollup` (+ the two summary types if exported) from the type block. KEEP `isProcessHubComplete`, `detectScope`/`detectScopeFromMap`/`Scope`, the carrier exports.
- [ ] **Step 3: Test trims.** `processHub.test.ts`: delete the `buildProcessHubRollups` describe + its `makeMetadata` helper + imports (defaults/id-helper blocks stay). `processHub.nodeMappings.test.ts`: re-point `ProcessHubAnalyzeMetadata` → `ProcessStepCapabilityMemberMetadata` (AnalyzeNodeMapping assertions survive). `scopeDetection.test.ts` / `nodeMappingState.test.ts` / `nodeCapability.column.test.ts`: re-point type imports/factories to the carrier types (assertions survive).
- [ ] **Step 4: Comment + residual sweep** — clean every remaining textual mention so the gate grep reaches zero: `AnalyzeWorkspace.tsx` (azure, comment) · `AnalyzeView.tsx` (pwa, comment) · both `applyAction.ts` comment mentions · `AnalyzeWorkspace.emptyLineage.seam.test.tsx` header comment (the test body pins PO-5's lineage filtering — body untouched) · `useHubProvision.ts`/`stepErrorAggregation.ts` leftovers · any hit the final grep finds. Run `grep -rIn "Pick<ProcessHubAnalyze\|as ProcessHubAnalyze\|as unknown as ProcessHubAnalyze" packages apps` → zero.
- [ ] **Step 5: The acceptance greps (implementer-level, validator re-runs):**

```bash
grep -rIo 'ProcessHubAnalyze' --include='*.ts' --include='*.tsx' packages apps scripts .claude | wc -l   # → 0
grep -rIn 'ProcessHubRollup\|buildProcessHubRollups\|ProcessHubAnalyzeMetadata\|AnalyzeReadAPI\|analyzeStatusFromJourneyPhase' --include='*.ts' --include='*.tsx' packages apps scripts .claude   # → zero hits
grep -rIn '\bAnalyzeStatus\b\|\bAnalyzeDepth\b' --include='*.ts' --include='*.tsx' packages apps | grep -v 'glossary/terms.ts'   # → zero LIVE hits (glossary term strings → PO-7)
```

- [ ] **Step 6: Verify:** `pnpm --filter @variscout/core test && pnpm --filter @variscout/hooks test && pnpm build` → green (full core+hooks suites; the build proves the cascade compiles end-to-end).
- [ ] **Step 7: Commit** — `refactor(po-4): delete ProcessHubAnalyze/Rollup/Metadata + buildProcessHubRollups + the AnalyzeStatus/AnalyzeDepth enums; residual comment sweep to zero references`

### Commit 6: Docs — decision-log entries (Sonnet-sized, same dispatch)

**Files:** Modify `docs/decision-log.md` · `packages/core/CLAUDE.md`.

- [ ] **Step 1: decision-log entries** (house format, date 2026-06-04): (a) **ProcessHubAnalyze dissolved** (PO-4) — the projection entity + rollup engine deleted; surfaces read `ImprovementProject`/`ProjectMetadata`/`ProcessContext`; the typed `ProcessStepCapabilitySource` carrier is the CS-P2 contract; closes the decision-log ProcessHubAnalyze-disposition OQ (locate the OQ row, mark resolved → this PR). (b) **storage.ts reopen-tombstone excised** — trigger provably dead post-PO-2; reopen semantics route to #12 (cite the PO-2 "vestigial branch [#12]" carry). (c) **ProjectMetadata narrative projections shed** (`nextMove`/`currentUnderstandingSummary`/`problemConditionSummary` + the write-only context-summary quartet) — ProjectCard slimmed atomically; logged as input to the Home-launchpad brainstorm. (d) **Minimal hub selector** = the interim B0-reachability affordance; dies at CS-P2's lift. (e) note: `glossary/terms.ts` `analyzeStatus` term + `investigationId` field names ride to PO-7.
- [ ] **Step 2:** `packages/core/CLAUDE.md` — the `/processHub` sub-path example list drops `AnalyzeStatus` (mention the carrier instead).
- [ ] **Step 3: Verify:** `pnpm docs:check` green.
- [ ] **Step 4: Commit** — `docs(po-4): decision-log entries (dissolution + tombstone excise + narrative-projection shed + interim selector); core CLAUDE.md sub-path note`

---

## Controller-level acceptance (Validator phase)

`bash scripts/pr-ready-check.sh` green + **ALL FIVE suites** (`core`, `hooks`, `ui`, `azure-app`, `pwa` — builds alone are NOT the gate, CS-12 lesson) · the Commit-5 acceptance greps ZERO · `coScoutModes.test.ts` green untouched (JourneyPhase sentinel) · Control join sentinels green (`useControlPanelModel` + `ipReport` tests) · i18n untouched (`git diff --stat` shows zero `i18n/` files) · PWA legacy-upgrade path green (`App.test.tsx` + `modeA1.test.tsx` — the v11→v13 `tableName: null` drop exercised against pre-existing data) · `--chrome` verify: Dashboard renders project cards + the hub selector; selecting a hub renders the thin `ProcessHubView` (goal banner + capability tab + B0 banner where applicable); no hub cards, no "Start analyze in" affordance · final adversarial Opus branch review (non-negotiable — caught cross-task seams on PO-1/PO-2/PO-3) · merge `gh pr merge --merge --delete-branch`; DELIVERED flips ride a follow-up commit on main.
