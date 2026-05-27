---
tier: ephemeral
purpose: build
title: Wedge V1 Nav Vocabulary Rename — Implementation Plan
status: delivered
date: 2026-05-27
layer: spec
---

# Wedge V1 Nav Vocabulary Rename — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with the **atomic-sweep dispatch pattern** (`feedback_atomic_sweep_one_dispatch`). This plan is ONE big Opus implementer dispatch with internal Architect → Migration → Validator phases and per-category commits — NOT a per-task subagent dispatch sequence.

**Goal:** Rename three tab/stage names across all code, tests, canonical docs, ADRs, i18n, and architecture-generated artifacts in a single atomic sweep. Three renames: `Investigation → Analyze` (largest cascade), `Analyze (EDA tab) → Explore` (smaller, sequenced after #1), `Sustainment → Control` (independent, includes IndexedDB schema bump).

**Architecture:** Single PR `feat/wedge-v1-nav-vocabulary-rename` off `main` post-PR-#217. Internal Architect phase enumerates every touchpoint (using the scout report below as ground truth); Migration phase commits per-category; Validator phase grep-audits, builds, tests, and confirms the 7-tab incantation in CLAUDE.md / AGENTS.md / llms.txt is consistent. No back-compat shims, no migration helpers, no compatibility branches (`feedback_wedge_v1_no_migration_no_backcompat`).

**Tech Stack:** TypeScript 5.x, Tailwind v4 semantic tokens, Vitest + happy-dom, Dexie 4 (IndexedDB v6→v7 schema bump for Sustainment table rename), 32-locale i18n via `packages/core/src/i18n/messages/`.

---

## Sequencing rule (the Analyze double-bind)

The grep target "Analyze" goes TWO directions:

- Old `Investigation` tab → becomes the new `Analyze` tab
- Old `Analyze (EDA)` tab → becomes the new `Explore` tab

A naive global find-replace `Analyze → Explore` will break the OTHER half of the rename. **Implementer must sequence Phase 1 BEFORE Phase 2.**

- **Phase 1:** Rename `Investigation → Analyze` FIRST. Use grep targets like `Investigation`, `investigationStore`, `useInvestigation*`, `'investigation'`, etc. The old `Analyze`-the-EDA-tab name is still untouched.
- **Phase 2:** Rename `Analyze (EDA tab) → Explore` SECOND. At this point the surface code uses `Analyze` ONLY for: (a) the new tab name (formerly Investigation, now correct), (b) the EDA-tab leftover strings to rename, and (c) `AnalysisMode`/`AnalysisBrief`/`AnalysisStats`/`AnalysisLensTab` domain types (DO NOT rename — those are statistical domain identifiers, not tab names).
- **Phase 3:** `Sustainment → Control`. Independent. Can run anywhere in the order; the implementer should do it AFTER Phase 1+2 are tsc-green so failures stay isolated.

---

## Scout-verified scope (ground truth)

### Rename 1: Investigation → Analyze

- **packages/core:** ~40 types/interfaces including `InvestigationDepth`, `InvestigationStatus`, `InvestigationNodeMapping`, `ProcessHubInvestigation`, `ProcessHubInvestigationMetadata`, `InvestigationReadAPI`, `SerializedInvestigationState`, `InvestigationCategory`. Files: `processHub.ts`, `persistence/HubRepository.ts`, `survey/`, etc.
- **packages/stores:** `investigationStore.ts` → `analyzeStore.ts`. Action types, selectors, persistence dispatches.
- **packages/hooks:** `useInvestigationOrchestration*`, `useCanvasInvestigationOverlays*`, `CanvasInvestigationFocus`, `CanvasInvestigationOverlayModel` (re-exported via `packages/hooks/src/index.ts:490–500`).
- **packages/ui:** `InvestigationWall*`, `InvestigationSidebar`, `InvestigationConclusion`, `InvestigationPhaseBadge`, `ReportInvestigationSummary`, `InvestigationMapView`, `InvestigationMetadataPanel`. Props types and exports.
- **apps/azure:** `InvestigationWorkspace.tsx`, `InvestigationMapView.tsx`, `useInvestigationFeatureStore`, deep-link mode `'investigation' → 'analyze'` in `services/deepLinks.ts:14,34`, Azure blob path segments `proj-X/investigation/...` in `services/blobClient.ts` and `services/__tests__/investigationSerializer.test.ts`.
- **apps/pwa:** `features/investigation/` directory → `features/analyze/`, `InvestigationView.tsx`, view-key `'investigation'` in `panelsStore.ts` + `useAppPanels.ts` + `App.tsx:770–802,1351–1394`, `phaseToView`/`viewToPhase` mappings.
- **Tests:** ~25 files with string assertions on old names (e.g., `AppHeader.test.tsx` asserts phase IDs, `panelsStore.test.ts`, `App.test.tsx`, `investigationStore.test.ts` x2 (pwa + packages), e2e `bottleneck-investigation.spec.ts`, `hospital-ward-investigation.spec.ts`).
- **i18n:** 32 locales × 1 key (`workspace.investigation`) — rename key to `workspace.analyze` AND update value to "Analyze".
- **CSS / testids / aria:** ~15 testids (`view-toggle-investigation`, `investigation-sidebar`, `investigation-conclusion`, `investigation-map-view`, `investigation-phase-badge`, `canvas-new-investigation`, `stage-five-open-investigation`, `report-investigation-summary`, `kpi-investigation`, `charter-continue-investigation`, `active-investigations-summary`, etc.), `aria-label="Investigation view mode"` (2 places), `aria-label="Escalated investigation ID"`.
- **Sample data:** `packages/data/src/samples/investigation-showcase.ts` (`urlKey: 'investigation-showcase'`) → `analyze-showcase` (URL key changes; tests fixture-rebuild expected).

### Rename 2: Analyze (EDA tab) → Explore

**Do NOT touch:** `AnalysisMode`, `AnalysisBrief`, `AnalysisStats`, `AnalysisModeStrategy`, `AnalysisLensTab` — these are statistical-domain identifiers, NOT tab names. Verify each surface before renaming.

- **packages/core:** `i18n/messages/*` key `workspace.analyze` → `workspace.explore` (value to "Explore"). 32 locales.
- **packages/ui:** No standalone `AnalyzeTab` component; the Analyze-tab body lives in `apps/*/src/components/Dashboard.tsx`. UI surface limited to test-IDs on cross-stage links (`charter-continue-analyze`, `approach-continue-analyze` in `packages/ui/src/components/IPDetail/stages/`).
- **apps/azure:** `Dashboard.tsx` (Analyze-tab body — rename file? — see decision below), `AppHeader.tsx:25` view-key union `'analyze'` → `'explore'`, `AppHeader.tsx:434` `data-testid="view-toggle-analyze"` → `"view-toggle-explore"`, panels-store `showAnalysis()` → `showExplore()`.
- **apps/pwa:** Mirror of azure: `Dashboard.tsx` (or rename file), `AppHeader.tsx:66`, `useAppPanels.ts:21`, `panelsStore.ts:12`, `App.tsx:770–802` phase/view maps.
- **e2e:** `apps/pwa/e2e/analysis-views.spec.ts` — file rename + content updates.
- **Tests:** `AppHeader.test.tsx`, `panelsStore.test.ts`, `Dashboard.tsx` lens-tab tests (only the tab-key assertions; `AnalysisLensTab` sub-tabs untouched).

**File-rename decision:** Keep `Dashboard.tsx` filename (it's the dashboard view, not the tab-name); only rename strings/keys/testids within it. Renaming `Dashboard.tsx` → `ExploreView.tsx` would expand scope without clear benefit.

### Rename 3: Sustainment → Control

- **packages/core:** ~14 types in `sustainment.ts` (`SustainmentCadence`, `SustainmentVerdict`, `SustainmentStatus`, `SustainmentRecord`, `SustainmentReview`, `SustainmentSnapshotEvaluation`, etc.) — file rename `sustainment.ts` → `control.ts`. Plus `HubRepository.ts` `SustainmentRecordReadAPI`/`SustainmentReviewReadAPI` → `ControlRecordReadAPI`/`ControlReviewReadAPI`.
- **packages/ui:** `SustainmentForm`, `SustainmentPanel`, `SustainmentRecordEditor`, `SustainmentReviewLogger`, `ProcessHubSustainmentRegion`, `Editor.sustainment.tsx`, `SustainmentSections`, `SustainmentOverview`, etc. (~15 components).
- **apps/azure:** `Editor.sustainment.tsx` → `Editor.control.tsx`, `apps/azure/src/components/sustainment/` → `apps/azure/src/components/control/`. Panels-store view key `'sustainment'` → `'control'`. Helper functions `sustainmentRecordBlobPath`/`sustainmentReviewBlobPath`/`sustainmentCatalogPath` → `controlRecord*` / `controlReview*` / `controlCatalog*` — AND the storage path string literals from `'sustainment'` → `'control'` (per wedge no-back-compat, no tenant data to preserve).
- **apps/pwa:** Mirror.
- **IndexedDB schema (CRITICAL):** Dexie tables `sustainmentRecords`/`sustainmentReviews` in pwa `db/schema.ts` AND azure `db/schema.ts`. **Bump schema version v6 → v7**, rename tables. Per wedge no-back-compat (`feedback_wedge_v1_no_migration_no_backcompat`): existing local IndexedDB rows go unreachable; users on V1 will see empty stores after upgrade. This is acceptable because wedge V1 has no real customers yet.
- **Stage rename:** The Sustainment STAGE (`Charter → Approach → Sustainment`) becomes (`Charter → Approach → Control`). The `getIPStageLabel()` in `packages/ui/src/components/ActiveIP/activeIPPresentation.ts:21–35` and the `ActiveIPStageLabel = 'Charter' | 'Approach' | 'Sustainment'` type → `'Charter' | 'Approach' | 'Control'`.
- **ADR-080 (sustainment-auto-fire-pattern):** Title + filename + body need amendment to `control-auto-fire-pattern`. Filename rename: `docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md` → `adr-080-control-auto-fire-pattern.md`.
- **Tests:** ~14 files; ~30 mentions in persistence test files (`applyAction.sustainment.test.ts` — rename file + content), `sustainmentStorage.test.ts`, `Editor.sustainment.test.tsx`, `SustainmentPanel.test.tsx`, `SustainmentOverview.test.tsx`, etc.
- **i18n:** 32 locales × 1 key (`workspace.sustainment` → `workspace.control`, value "Sustainment" → "Control").

### Cross-cutting docs (canonical only — skip `docs/archive/`, `docs/ephemeral/`, `docs/cards/`, `docs/decision-log.md`)

- **Top-level:** `docs/USER-JOURNEYS.md` (5 hits), `docs/DATA-FLOW.md` (4), `docs/OVERVIEW.md` (19), `docs/llms.txt` (2), `CLAUDE.md` (2 — the 7-tab nav incantation at line 3), `AGENTS.md` (3+).
- **docs/02-journeys/:** 27 files including `ia-nav-model.md`, `personas/lead.md`, `personas/sponsor.md`, `traceability.md`, `flows/azure-first-analysis.md`, `flows/factor-intelligence.md`, `use-cases/complaint-investigation.md`, `use-cases/bottleneck-analysis.md`, `use-cases/lead-time-variation.md`.
- **docs/03-features/:** 40+ files. Key paths to rename (file + content): `workflows/investigation-wall.md` → `workflows/analyze-wall.md`, `workflows/investigation-to-action.md` → `workflows/analyze-to-action.md`, `workflows/investigation-lifecycle-map.md`, `workflows/question-driven-investigation.md` → `workflows/question-driven-analyze.md`, `workflows/sustainment.md` → `workflows/control.md`, `workflows/timeline-window-investigations.md`. Plus content updates in `analysis/*` (this directory's `pareto.md`, `staged-analysis.md`, `process-hub-capability.md` etc. — content references, NOT directory rename: the `analysis/` dir name refers to statistical analysis, not the Analyze tab).
- **docs/07-decisions/ ADRs needing amendment** (heavier — body edits + cross-refs):
  - ADR-015 investigation-board → analyze-board (filename + body)
  - ADR-020 investigation-workflow → analyze-workflow (filename + body)
  - ADR-053 question-driven-investigation → question-driven-analyze (filename + body)
  - ADR-055 workspace-navigation (the 7-tab nav definition — heavy body amendment; filename stays)
  - ADR-066 evidence-map-investigation-center → evidence-map-analyze-center (filename + body)
  - ADR-080 sustainment-auto-fire-pattern → control-auto-fire-pattern (filename + body)
  - ADR-082 wedge-architecture (heavy body amendment — V1 canonical; filename stays)
  - ADR-083 eight-purpose-doc-taxonomy (light body amendment)
- **ADRs with lighter mentions** (single-line body edits, no filename change): ADR-014, -019, -023, -027, -029, -034, -037, -041, -042, -045, -046, -048, -049, -050, -054, -056, -059, -060, -061, -062, -063, -065, -067, -068, -070, -071, -072, -076, -078, -079, -081.
- **docs/superpowers/specs/:**
  - `2026-05-26-canvas-connection-journey-design.md` (Spec 2 of CCJ) — amend §4 lines 455–518 + §4.6 line 521 + §5 line 609 + §6.2 line 618 + §11 line 660+693 to reflect post-rename vocabulary. Note: Spec 2 §3.1.2 already references "View distribution in Explore →" — now natively coherent.
  - `2026-04-04-investigation-spine-design.md` — body refs (no rename — historical context).
  - `2026-04-03-investigation-workspace-reframing-design.md` — body refs (no rename).
  - `2026-04-26-evidence-sources-data-profiles-design.md` — body refs.
  - `2026-04-26-agent-review-log-process-hub-design.md` — body refs.

### Generated docs

- `docs/05-technical/architecture-generated.md` — regenerate via `pnpm docs:gen-arch` at end of sweep.

### Risk acknowledgments

- **Saved DeepLinks break:** Azure deep links containing `'investigation'` URL segment (e.g., from Teams/Outlook share) become invalid. Per wedge no-back-compat, accepted breakage.
- **Local IndexedDB rows orphan:** V1 testers' local stores for Sustainment data become unreachable after schema v6→v7 bump. Accepted.
- **Azure blob tenant data:** `proj-X/sustainment/...` blob paths become unreachable; new tenant writes use `proj-X/control/...`. Per wedge no real customers yet, accepted.
- **MEMORY.md mentions:** Many memory files reference old vocabulary. The controller (you, post-merge) updates MEMORY.md separately — not in this PR.

---

## Phase plan (per-category commits)

Each phase = one commit on the branch. The implementer drives through all phases in one Opus dispatch. After each commit, run targeted tests for that package; full repo build/test happens in Phase 13 (Validator).

### Phase 1 (Architect): Enumerate touchpoints

**Action:** Implementer runs the following ripgrep queries and saves the output to a local working file `.tmp-rename-touchpoints.md` (gitignored — discarded after the sweep). This is the implementer's working canvas; not committed.

```bash
rg -l '\bInvestigation\b|investigationStore|useInvestigation|InvestigationView|InvestigationWorkspace|InvestigationSidebar|InvestigationConclusion|InvestigationPhaseBadge|InvestigationMapView' --type ts --type tsx packages apps > .tmp-rename-touchpoints.md
rg -l '\bworkspace\.(analyze|investigation|sustainment)\b' packages/core/src/i18n >> .tmp-rename-touchpoints.md
rg -l '\bSustainment\b|sustainmentStore|useSustainment' --type ts --type tsx packages apps >> .tmp-rename-touchpoints.md
rg -l "'investigation'|'sustainment'|view-toggle-(analyze|investigation)" --type ts --type tsx packages apps >> .tmp-rename-touchpoints.md
rg -l 'Investigation|Sustainment' docs/02-journeys docs/03-features docs/07-decisions docs/superpowers/specs docs/USER-JOURNEYS.md docs/OVERVIEW.md docs/DATA-FLOW.md docs/llms.txt CLAUDE.md AGENTS.md >> .tmp-rename-touchpoints.md
```

**Verification:** the implementer reads the deduplicated touchpoint list, cross-checks against the scout report above, and proceeds only if the file counts roughly match (≥95% overlap; deviations get noted). If any major surface from the scout report doesn't appear in the grep (or vice versa), STOP and report `NEEDS_CONTEXT`.

**No commit at this phase** — purely planning.

### Phase 2 (Migration): Rename Investigation → Analyze — `packages/core`

**Scope:** rename types/interfaces in `packages/core/src/processHub.ts`, `packages/core/src/persistence/HubRepository.ts`, `packages/core/src/survey/`, plus any consumer types in the package. Use IDE-grade rename if available (the implementer can use multi-file Edit ops); fall back to careful per-file edits otherwise.

**Key identifier renames** (non-exhaustive):

- `InvestigationDepth` → `AnalyzeDepth`
- `InvestigationStatus` → `AnalyzeStatus`
- `InvestigationNodeMapping` → `AnalyzeNodeMapping`
- `ProcessHubInvestigation` → `ProcessHubAnalyze`
- `ProcessHubInvestigationMetadata` → `ProcessHubAnalyzeMetadata`
- `InvestigationReadAPI` → `AnalyzeReadAPI`
- `SerializedInvestigationState` → `SerializedAnalyzeState`
- `InvestigationCategory` → `AnalyzeCategory`

**Verification:** `pnpm --filter @variscout/core test && pnpm --filter @variscout/core build`. Expected: PASS.

**Commit:** `refactor(core): rename Investigation → Analyze (types + persistence read-APIs)`

### Phase 3 (Migration): Investigation → Analyze — `packages/stores`

**Scope:** Rename `packages/stores/src/investigationStore.ts` → `analyzeStore.ts`. Update store exports in `packages/stores/src/index.ts`. Rename hook name `useInvestigationStore` → `useAnalyzeStore`. Update internal action types if they contain "investigation".

**Verification:** `pnpm --filter @variscout/stores test && pnpm --filter @variscout/stores build`. Expected: PASS.

**Commit:** `refactor(stores): rename investigationStore → analyzeStore + useInvestigationStore → useAnalyzeStore`

### Phase 4 (Migration): Investigation → Analyze — `packages/hooks`

**Scope:** Rename `useInvestigationOrchestration*` → `useAnalyzeOrchestration*`, `useCanvasInvestigationOverlays*` → `useCanvasAnalyzeOverlays*`, types `CanvasInvestigationFocus` → `CanvasAnalyzeFocus`, `CanvasInvestigationOverlayModel` → `CanvasAnalyzeOverlayModel`. Update re-exports in `packages/hooks/src/index.ts:490–500`.

**Verification:** `pnpm --filter @variscout/hooks test && pnpm --filter @variscout/hooks build`. Expected: PASS.

**Commit:** `refactor(hooks): rename Investigation → Analyze in orchestration + overlay hooks`

### Phase 5 (Migration): Investigation → Analyze — `packages/ui`

**Scope:** Rename component files + their `__tests__`:

- `InvestigationWall/` → `AnalyzeWall/`
- `InvestigationSidebar.tsx` → `AnalyzeSidebar.tsx`
- `InvestigationConclusion.tsx` → `AnalyzeConclusion.tsx`
- `InvestigationPhaseBadge/` → `AnalyzePhaseBadge/`
- `InvestigationMapView/` → `AnalyzeMapView/`
- `InvestigationMetadataPanel.tsx` → `AnalyzeMetadataPanel.tsx`
- `ReportInvestigationSummary.tsx` → `ReportAnalyzeSummary.tsx`

Update prop type names: `InvestigationSidebarProps` → `AnalyzeSidebarProps`, etc. Update barrel exports in `packages/ui/src/index.ts`. Update test-IDs inside components from `investigation-*` to `analyze-*`. Update aria-labels (e.g., `"Investigation view mode"` → `"Analyze view mode"`, `"Escalated investigation ID"` → `"Escalated analyze ID"`).

**Verification:** `pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build`. Expected: PASS.

**Commit:** `refactor(ui): rename Investigation → Analyze (components + props + testids + aria)`

### Phase 6 (Migration): Investigation → Analyze — `apps/azure`

**Scope:** Rename:

- `apps/azure/src/components/editor/InvestigationWorkspace.tsx` → `AnalyzeWorkspace.tsx`
- `apps/azure/src/components/editor/InvestigationMapView.tsx` → `AnalyzeMapView.tsx`
- `apps/azure/src/features/investigation/` → `apps/azure/src/features/analyze/`
- `apps/azure/src/features/analyze/useInvestigationFeatureStore.ts` → `useAnalyzeFeatureStore.ts`

Update:

- `services/deepLinks.ts`: `DeepLinkMode = 'dashboard' | 'report' | 'improvement' | 'investigation'` → `... | 'analyze'`. Rename URL-segment constant from `'investigation'` to `'analyze'`.
- `services/blobClient.ts`: blob path segments — KEEP `'investigation'` literal in storage paths to preserve any tenant test data, OR rename to `'analyze'`. **Decision: rename to `'analyze'`** per wedge no-back-compat (no real tenants yet).
- `services/investigationSerializer.ts` → `analyzeSerializer.ts` if a file by that name exists; else just internal rename.
- `pages/Editor.tsx`: panel routing logic that switches on `'investigation'` strings — update all to `'analyze'`. View-key unions in component prop types.
- `components/AppHeader.tsx:25` view-key union `'investigation'` → `'analyze'`. Test-IDs `view-toggle-investigation` → `view-toggle-analyze`.
- Panels store action `showInvestigation()` → `showAnalyze()` in `apps/azure/src/features/panels/panelsStore.ts`.
- All test files under `apps/azure/src/` referencing the old names.

**Verification:** `pnpm --filter @variscout/azure-app test && pnpm --filter @variscout/azure-app build`. Expected: PASS.

**Commit:** `refactor(azure-app): rename Investigation → Analyze (features, deeplinks, blob paths, panels, header)`

### Phase 7 (Migration): Investigation → Analyze — `apps/pwa`

**Scope:** Mirror Phase 6 for PWA:

- `apps/pwa/src/features/investigation/` → `apps/pwa/src/features/analyze/`
- `apps/pwa/src/components/views/InvestigationView.tsx` → `AnalyzeView.tsx`
- `apps/pwa/src/components/views/InvestigationWorkspace.tsx` → `AnalyzeWorkspace.tsx` (if present)
- `panelsStore.ts:12` view-key `'investigation'` → `'analyze'`
- `useAppPanels.ts:21` view-key
- `App.tsx:770–802, 1351–1394`: `phaseToView`/`viewToPhase` maps and panel-routing switch statements
- `AppHeader.tsx:66` view-key + label
- `ProjectsTabView.tsx:23` target union `'investigation' | 'analyze' | ...` — note: post-rename, `'analyze'` (from Investigation) AND the old `'analyze'` (the EDA tab) would collide temporarily. The implementer must rename the OLD `'analyze'` entry in this union to a placeholder (e.g., `'analyze-eda-placeholder'`) BEFORE renaming the OLD `'investigation'` to `'analyze'`. Phase 9 then renames `'analyze-eda-placeholder'` → `'explore'`. Document this in the commit message.
- All test files under `apps/pwa/src/` referencing old names.

**Verification:** `pnpm --filter @variscout/pwa test && pnpm --filter @variscout/pwa build`. Expected: PASS.

**Commit:** `refactor(pwa): rename Investigation → Analyze (features, views, panels, App routing)`

### Phase 8 (Migration): Investigation → Analyze — e2e + sample data

**Scope:**

- Rename `apps/pwa/e2e/bottleneck-investigation.spec.ts` → `bottleneck-analyze.spec.ts`
- Rename `apps/pwa/e2e/hospital-ward-investigation.spec.ts` → `hospital-ward-analyze.spec.ts`
- Update spec content (test names, selectors, navigations) inside these files.
- `packages/data/src/samples/investigation-showcase.ts` → `analyze-showcase.ts`; `urlKey: 'investigation-showcase'` → `'analyze-showcase'`.

**Verification:** `pnpm --filter @variscout/data test && pnpm --filter @variscout/data build`. E2E tests run in CI; locally check via `pnpm --filter @variscout/pwa test` for any unit tests that mock the sample.

**Commit:** `refactor(e2e+data): rename investigation-* sample + e2e specs to analyze-*`

### Phase 9 (Migration): Rename Analyze (EDA tab) → Explore

**Pre-flight check:** at this point all "Analyze" references in code should point to the NEW Analyze tab (formerly Investigation). The ONLY remaining "Analyze" surfaces should be:

1. The EDA-tab strings being renamed (`'analyze'` view-key, `view-toggle-analyze` testid, etc.) — these become `'explore'`.
2. `AnalysisMode`/`AnalysisBrief`/`AnalysisStats`/`AnalysisModeStrategy`/`AnalysisLensTab` domain types — LEAVE ALONE.
3. The `apps/pwa/src/components/ProjectsTabView.tsx:23` placeholder `'analyze-eda-placeholder'` (or whatever was used) → rename to `'explore'`.

**Scope:**

- `packages/core/src/i18n/messages/*` (32 locales): rename key `workspace.analyze` → `workspace.explore`, update value "Analyze" → "Explore".
- `apps/azure/src/components/AppHeader.tsx:25`: view-key `'analyze'` → `'explore'`, test-ID `view-toggle-analyze` → `view-toggle-explore`.
- `apps/pwa/src/components/layout/AppHeader.tsx:66`: same.
- `apps/azure/src/features/panels/panelsStore.ts` + `apps/pwa/src/features/panels/panelsStore.ts`: view-key `'analyze'` → `'explore'`, action `showAnalysis()` → `showExplore()`.
- `apps/pwa/src/hooks/useAppPanels.ts:21`: view-key.
- `apps/pwa/src/App.tsx:770–802`: `phaseToView`/`viewToPhase` maps — the `'analyze' → 'analyze'` self-mapping becomes `'explore' → 'explore'`.
- `apps/azure/src/pages/Editor.tsx`: same routing logic.
- `apps/pwa/src/components/Dashboard.tsx` + `apps/azure/src/components/Dashboard.tsx`: internal references to the tab name (in comments, headings, `data-testid`s if any). DO NOT rename the file.
- Cross-package test-IDs: `charter-continue-analyze` → `charter-continue-explore` (`packages/ui/src/components/IPDetail/stages/CharterOverview.tsx:130`), `approach-continue-analyze` → `approach-continue-explore` (`packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx:102`).
- `apps/pwa/e2e/analysis-views.spec.ts` → `apps/pwa/e2e/explore-views.spec.ts`; update content.
- All test files asserting on `'analyze'` as a view-key.

**Verification:** `pnpm test && pnpm build`. Expected: full repo green.

**Commit:** `refactor(*): rename Analyze (EDA tab) → Explore — view-keys, i18n, testids (preserves AnalysisMode/Brief/Stats domain types)`

### Phase 10 (Migration): Rename Sustainment → Control — core + IndexedDB schema bump

**Scope:**

- `packages/core/src/sustainment.ts` → `packages/core/src/control.ts`. All exported types: `SustainmentCadence` → `ControlCadence`, etc. (~14 types).
- `packages/core/src/persistence/HubRepository.ts`: `SustainmentRecordReadAPI` → `ControlRecordReadAPI`, `SustainmentReviewReadAPI` → `ControlReviewReadAPI`.
- `packages/core/src/survey/__tests__/sustainment.test.ts` → `control.test.ts`; update content.
- `packages/core/src/__tests__/sustainment.test.ts` → `control.test.ts`.
- `packages/core/src/i18n/messages/*` (32 locales): rename `workspace.sustainment` → `workspace.control` (if such a key exists — most stage labels are inside the stage progression label set; check `packages/core/src/i18n/messages/en.ts` first to see the exact key structure).

**IndexedDB schema bump (apps/pwa/src/db/schema.ts + apps/azure/src/db/schema.ts):**

```typescript
// In each db/schema.ts file:
// 1. Bump current version (v6 → v7).
// 2. Rename Dexie tables: 'sustainmentRecords' → 'controlRecords', 'sustainmentReviews' → 'controlReviews'.
// 3. Rename row interface types: SustainmentRecordRow → ControlRecordRow, SustainmentReviewRow → ControlReviewRow.
// 4. DO NOT add a Dexie migration callback. Per feedback_wedge_v1_no_migration_no_backcompat,
//    existing rows in v6 stores become orphaned and unreachable. This is intentional.
```

**ActiveIPStageLabel type** (`packages/ui/src/components/ActiveIP/activeIPPresentation.ts:8`):

- `'Charter' | 'Approach' | 'Sustainment'` → `'Charter' | 'Approach' | 'Control'`
- All consumers updated.
- `getIPStageLabel()` body returns `'Control'` instead of `'Sustainment'`.

**Verification:** `pnpm --filter @variscout/core test && pnpm --filter @variscout/core build`. Plus `pnpm --filter @variscout/ui test -- --run ActiveIP` to catch stage-label assertion failures.

**Commit:** `refactor(core+ui): rename Sustainment → Control (types + i18n + ActiveIPStageLabel) + IDB schema v6→v7 (no migration per wedge no-back-compat)`

### Phase 11 (Migration): Sustainment → Control — UI components + apps

**Scope:**

- `packages/ui/src/components/SustainmentForm/` → `ControlForm/`
- `packages/ui/src/components/SustainmentPanel/` → `ControlPanel/`
- `packages/ui/src/components/SustainmentRecordEditor/` → `ControlRecordEditor/`
- `packages/ui/src/components/SustainmentReviewLogger/` → `ControlReviewLogger/`
- `packages/ui/src/components/ProcessHubSustainmentRegion/` → `ProcessHubControlRegion/`
- `packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx` → `ControlOverview.tsx`
- `apps/azure/src/components/sustainment/` → `apps/azure/src/components/control/`
- `apps/azure/src/pages/Editor.sustainment.tsx` → `Editor.control.tsx`
- `apps/pwa/src/components/SustainmentPanel.tsx` (if present) → `ControlPanel.tsx`

Update all prop types: `SustainmentFormProps` → `ControlFormProps`, etc.

Helper functions in `apps/azure/src/services/blobClient.ts`:

- `sustainmentRecordBlobPath` → `controlRecordBlobPath`
- `sustainmentReviewBlobPath` → `controlReviewBlobPath`
- `sustainmentCatalogPath` → `controlCatalogPath`
- Storage-path string literals `'sustainment'` → `'control'` (per no-back-compat).

Panels-store action `showSustainment()` → `showControl()` in both apps.

Test-IDs and aria-labels:

- `sustainment-region` → `control-region`
- `sustainment-setup` → `control-setup`
- `sustainment-record-editor` → `control-record-editor`
- `sustainment-open-legacy`, `sustainment-closure-open-legacy`, `sustainment-closure-nudge-owner`, `sustainment-start-handoff` — rename each to `control-*` equivalents
- `aria-label="Sustainment region"` → `"Control region"`
- `aria-label="Retain sustainment review"` → `"Retain control review"`

Test files under `apps/pwa/src/`, `apps/azure/src/`, `packages/ui/src/` matching `*sustainment*` — rename + content update.

**Verification:** `pnpm test && pnpm build`. Expected: full repo green.

**Commit:** `refactor(ui+apps): rename Sustainment → Control (components + panels + blob paths + testids)`

### Phase 12 (Migration): Cross-cutting docs + ADR amendments

**Scope:**

**Top-level docs** (content updates only, no file renames):

- `CLAUDE.md` — line 3: 7-tab incantation `Home · Project · Process · Analyze · Investigation · Improve · Report` → `Home · Project · Process · Explore · Analyze · Improve · Report`.
- `AGENTS.md` — same incantation + any other references.
- `docs/llms.txt` — agent manifest reference updates.
- `docs/USER-JOURNEYS.md`, `docs/OVERVIEW.md`, `docs/DATA-FLOW.md` — content sweep.

**docs/02-journeys/**:

- `ia-nav-model.md` — heavy: nav definition.
- `personas/lead.md`, `personas/sponsor.md`, `personas/member.md`, `personas/index.md` — references.
- `traceability.md` — references.
- `flows/azure-first-analysis.md`, `flows/factor-intelligence.md` — references.
- `use-cases/complaint-investigation.md` → rename + content.
- `use-cases/bottleneck-analysis.md`, `use-cases/lead-time-variation.md` — content (filenames stay; "analysis" in filename means statistical work, not the Analyze tab).

**docs/03-features/**:
File renames + content:

- `workflows/investigation-wall.md` → `workflows/analyze-wall.md`
- `workflows/investigation-to-action.md` → `workflows/analyze-to-action.md`
- `workflows/investigation-lifecycle-map.md` → `workflows/analyze-lifecycle-map.md`
- `workflows/question-driven-investigation.md` → `workflows/question-driven-analyze.md`
- `workflows/sustainment.md` → `workflows/control.md`
- `workflows/timeline-window-investigations.md` → `workflows/timeline-window-analyzes.md` (or `timeline-window-analysis.md` — implementer's call on what reads better)

Content-only updates in the `analysis/` subdirectory (`pareto.md`, `staged-analysis.md`, `process-hub-capability.md`, `index.md`) — KEEP `analysis/` directory name; it refers to statistical work.

**docs/07-decisions/ ADRs** (filename + body):

- `adr-015-investigation-board.md` → `adr-015-analyze-board.md`
- `adr-020-investigation-workflow.md` → `adr-020-analyze-workflow.md`
- `adr-053-question-driven-investigation.md` → `adr-053-question-driven-analyze.md`
- `adr-066-evidence-map-investigation-center.md` → `adr-066-evidence-map-analyze-center.md`
- `adr-080-sustainment-auto-fire-pattern.md` → `adr-080-control-auto-fire-pattern.md`

**ADRs with body-only amendments** (filenames stay):

- `adr-055-workspace-navigation.md` — heavy: defines the 7-tab nav.
- `adr-082-wedge-architecture.md` — heavy: V1 canonical.
- `adr-083-eight-purpose-doc-taxonomy.md` — light.
- ~30 ADRs with single-line mentions (`adr-014`, `-019`, `-023`, `-027`, `-029`, `-034`, `-037`, `-041`, `-042`, `-045`, `-046`, `-048`, `-049`, `-050`, `-054`, `-056`, `-059`, `-060`, `-061`, `-062`, `-063`, `-065`, `-067`, `-068`, `-070`, `-071`, `-072`, `-076`, `-078`, `-079`, `-081`). The implementer does a global ripgrep over `docs/07-decisions/`, opens each match, updates in place.

**docs/superpowers/specs/**:

- `2026-05-26-canvas-connection-journey-design.md` (Spec 2) — amend:
  - §4 lines ~455–518: "Investigation" references → "Analyze".
  - §4.6 line ~521: "Sustainment" → "Control".
  - §5 line ~609: "Sustainment" → "Control".
  - §6.2 line ~618: "Sustainment" → "Control".
  - §11 lines ~660+693: vocabulary closure notes — update to "rename completed in PR-WV1-NAV (2026-05-27)".
  - §3.1.2: leave existing "Explore" references intact (now natively coherent).
- `2026-04-04-investigation-spine-design.md` — body-only; historical context but spec is still surfaced. Update vocabulary.
- `2026-04-03-investigation-workspace-reframing-design.md` — body-only.
- `2026-04-26-evidence-sources-data-profiles-design.md` — body-only.
- `2026-04-26-agent-review-log-process-hub-design.md` — body-only.

**Frontmatter cross-refs** (`scripts/check-doc-frontmatter.mjs` validates these):

- Any `implements:` / `serves:` / `related:` frontmatter pointing to renamed ADRs / specs must update. The implementer runs `pnpm docs:validate` (or whatever the canonical script is — check `package.json`) after the sweep and fixes broken cross-refs.

**Verification:** `bash scripts/pr-ready-check.sh` partial (just doc validation): the `Broken Cross-Reference Checks` and `Frontmatter Checks` sections should pass.

**Commit:** `docs(*): rename Investigation/Analyze/Sustainment vocabulary across canonical docs + ADRs + specs`

### Phase 13 (Validator): Full-repo build + test + grep audit

**Pre-validation:** regenerate any generated docs.

```bash
pnpm docs:gen-arch 2>&1 | tail -5
```

If `docs/05-technical/architecture-generated.md` changed, commit it:

```bash
git add docs/05-technical/architecture-generated.md
git commit -m "chore: regenerate architecture-generated.md after vocabulary rename"
```

**Full-repo verification:**

```bash
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -30
bash scripts/pr-ready-check.sh 2>&1 | tail -20
```

All three must be green.

**Grep audit (strict — zero hits expected in product code):**

```bash
# Old names that must no longer appear in product code / canonical docs:
git grep -nE "\bInvestigation\b|investigationStore|useInvestigation|InvestigationView|InvestigationWorkspace|InvestigationSidebar|InvestigationConclusion|InvestigationPhaseBadge|InvestigationMapView|InvestigationMetadata|ReportInvestigationSummary" -- 'packages' 'apps' | head -20
git grep -nE "\bSustainment\b|sustainmentStore|useSustainment|SustainmentForm|SustainmentPanel|SustainmentRecord|SustainmentReview|ProcessHubSustainmentRegion" -- 'packages' 'apps' | head -20
git grep -nE "view-toggle-analyze|view-toggle-investigation|view-toggle-sustainment" -- 'packages' 'apps' | head -10
git grep -nE "workspace\.investigation|workspace\.sustainment" -- 'packages/core/src/i18n' | head -10
```

Expected: each query returns **zero matches**.

```bash
# 7-tab incantation should now be the new vocabulary:
grep "Home · Project · " CLAUDE.md AGENTS.md docs/llms.txt 2>&1
```

Expected: each file shows `Home · Project · Process · Explore · Analyze · Improve · Report`.

**Docs grep (canonical surfaces only):**

```bash
git grep -nE "\bInvestigation\b|\bSustainment\b" -- 'docs/02-journeys' 'docs/03-features' 'docs/07-decisions' 'docs/superpowers/specs' 'docs/USER-JOURNEYS.md' 'docs/OVERVIEW.md' 'docs/DATA-FLOW.md' 'docs/llms.txt' 'CLAUDE.md' 'AGENTS.md' | head -10
```

Expected: zero matches. Historical references under `docs/archive/`, `docs/ephemeral/`, `docs/cards/`, `docs/decision-log.md` are out-of-scope and acceptable.

**Optional browser smoke (use Claude for Chrome):**

- Launch Azure dev: `pnpm --filter @variscout/azure-app dev` (if MSAL setup), navigate to the new Explore tab, the new Analyze tab, and a project's Control stage. Confirm UI labels match the new vocabulary.

**No new commit at validator phase** unless `architecture-generated.md` regeneration produced a diff.

### Phase 14: Update task list + push branch + open PR

The implementer should NOT do this — the controller handles it. The implementer's atomic-sweep ends after Phase 13.

---

## Self-review

**Spec coverage:** the scout report enumerated A.1–A.3 (code surfaces), B (docs), C (tests), D (double-bind), E (risks), F (Spec 2 alignment), plus the "suggested PR scoping" recommendation. This plan covers all of those:

- A.1 Analyze → Explore: Phase 9.
- A.2 Investigation → Analyze: Phases 2–8.
- A.3 Sustainment → Control: Phases 10–11.
- B Docs: Phase 12.
- C Tests: bundled per phase (Phases 5–11).
- D Double-bind: explicitly addressed in the Sequencing Rule section + Phase 9 pre-flight check.
- E Risks: all 4 risks (saved deeplinks, local IndexedDB, blob tenant data, MEMORY.md) flagged in the Risk Acknowledgments section.
- F Spec 2 alignment: §3.1.2 left intact (already correct); §4/§4.6/§5/§6.2/§11 amended in Phase 12.

**Placeholder scan:** No "TBD" / "implement later" / "add appropriate error handling" / abstract test references. Concrete commands and concrete identifier lists per phase. The implementer is expected to drive the Architect phase to enumerate full file paths from the touchpoint grep, which is the standard atomic-sweep pattern.

**Type consistency:** Identifier rename pairs are stated once and used consistently across phases. The double-bind placeholder pattern (`'analyze-eda-placeholder'`) in Phase 7 → renamed in Phase 9 is the only sequencing wrinkle and is called out explicitly in both phases.

---

## Out of scope (deferred)

- **Mode 1 journey doc** (task #37 — pre-Project journey for `docs/02-journeys/`) — folds into a later doc-only PR after this rename lands.
- **Lead JTBD restructure** (task #39 — activity-framed vs lifecycle-framed) — separate design session.
- **Project = IP terminology cleanup** (task #40) — separate sweep.
- **MEMORY.md updates** for canvas-connection-journey + wedge-v1 entries — controller handles post-merge.
- **The two-Done UX seam** (`docs/ephemeral/investigations.md` entry from PR #217) — deferred to PR-CCJ-H1 polish; this PR doesn't touch.
- **Master plan continuation** (PR-CCJ-B2 → H1) — starts after this rename merges.

---

## Out of scope (NEVER):

- Migration helpers / back-compat shims / deprecation aliases (`feedback_wedge_v1_no_migration_no_backcompat`).
- Splitting into multiple PRs (`feedback_atomic_sweep_one_dispatch` — the public-API tsc cascade demands atomic landing).
- `--no-verify` on commits (`feedback_subagent_no_verify`).
- Speculative API additions during the rename. Identifier rename only.
