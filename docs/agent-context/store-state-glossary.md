---
title: 'VariScout Store State Glossary'
purpose: agent-context
tier: living
audience: agent
status: active
topic: [ax, stores]
last-verified: 2026-05-16
verified-against-commit: 5ee58dc9
---

# VariScout Store State Glossary

9 Zustand stores across 3 layers (ADR-078 + F4, shipped 2026-05-07; wedge V1 additions 2026-05-16). Read this before reading or mutating any store state.

**Authoritative source**: `packages/stores/CLAUDE.md` + `packages/stores/src/*.ts`.

**Test command**: `pnpm --filter @variscout/stores test` — `__tests__/layerBoundary.test.ts` enforces middleware presence/absence per layer.

---

## Layer Model

| Layer               | Role                                                                | Portability test                       | Middleware                                               |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| **Document** (×4)   | Portable project data — another analyst importing this hub needs it | `Yes → Document`                       | persist middleware (hub repository dispatch)             |
| **Annotation** (×4) | Survives reload but not portable; scoped per-hub or per-user        | `Reload yes, portable no → Annotation` | persist middleware (Dexie or idb-keyval or localStorage) |
| **View** (×1)       | Transient — does not survive reload                                 | `No → View`                            | no persist middleware                                    |

**ADR-074 boundary**: cross-investigation aggregation is forbidden. `investigationStore` never aggregates across multiple hubs.

---

## Document Layer (4 stores)

### `useProjectStore`

**Location**: `packages/stores/src/projectStore.ts`
**Persistence**: consumer-side serialisation via `useProjectActions` → `.vrs` file + Dexie (Azure)

Primary store for the active hub's dataset + configuration. Clearing or loading a project resets the View layer via `useViewStore.clearTransientSelections()`.

| Field               | Type                         | Description                                                                                               |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `rawData`           | `DataRow[]`                  | All parsed rows from the uploaded CSV/paste                                                               |
| `outcome`           | `string \| null`             | Selected Y outcome column name                                                                            |
| `factors`           | `string[]`                   | Selected X factor column names                                                                            |
| `specs`             | `SpecLimits`                 | USL/LSL/target for the primary outcome                                                                    |
| `measureSpecs`      | `Record<string, SpecLimits>` | Per-column spec limits for multi-channel mode                                                             |
| `analysisMode`      | `AnalysisMode`               | `'standard' \| 'performance' \| 'yamazumi' \| 'defect'` — never `'capability'` (that is a `ResolvedMode`) |
| `projectId`         | `string`                     | UUID for the current hub                                                                                  |
| `projectName`       | `string`                     | Display name                                                                                              |
| `dataFilename`      | `string \| null`             | Original file name for display                                                                            |
| `subgroupConfig`    | `SubgroupConfig`             | n for subgrouped I-chart / Xbar-R; default n=5+ for capability                                            |
| `filters`           | `FilterAction[]`             | Active row-level filters                                                                                  |
| `stageColumn`       | `string \| null`             | Column used as categorical stage/group axis                                                               |
| `timeColumn`        | `string \| null`             | Column for chronological ordering                                                                         |
| `dataQualityReport` | `DataQualityReport \| null`  | Parse-time quality report (blank rows, type mismatches)                                                   |

**Key actions**: `loadProject(SerializedProject)`, `newProject()`, `setOutcome()`, `setFactors()`, `setMeasureSpec()`, `addFilter()`, `removeFilter()`.

Note: `isPerformanceMode` was deleted in F4 — never re-introduce. Use `analysisMode === 'performance'` or `getStrategy()` from `@variscout/core`.

---

### `useInvestigationStore`

**Location**: `packages/stores/src/investigationStore.ts`
**Persistence**: session-only today; future `HubRepository.dispatch`

Owns all investigation-domain entities for the active hub. Never aggregates across hubs (ADR-073).

| Field                     | Type                      | Description                                                                                                                                                             |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findings`                | `Finding[]`               | Pinned observations (chart + table + journal types); `FindingSource` is a discriminated union with `chart` discriminant — always narrow before accessing variant fields |
| `questions`               | `Question[]`              | Investigation questions (tree, max depth 3, max 8 children); tree traversal via `wouldCreateCycle()`                                                                    |
| `hypotheses`              | `Hypothesis[]`            | `SuspectedCause` entities (first-class per ADR-064); `selectedForImprovement: true` → triggers HMW brainstorm                                                           |
| `causalLinks`             | `CausalLink[]`            | Directed edges in the causal graph; cycle prevention is mandatory — `addCausalLink` calls `wouldCreateCycle()` internally, never bypass                                 |
| `categories`              | `InvestigationCategory[]` | User-defined groupings for findings/questions                                                                                                                           |
| `problemContributionTree` | `GateNode \| undefined`   | AND-gate tree for the Investigation Wall; highlights live in `useViewStore`                                                                                             |

**Legacy note**: `causeRole: 'primary' | 'contributing'` is deprecated. Multiple hubs can coexist; each `selectedForImprovement: true` hub triggers one HMW brainstorm.

**Persistence**: `findings`, `questions`, `hypotheses`, `causalLinks`, `categories` serialize via `useProjectActions` into `.vrs`. New entities need both `apps/azure/src/db/schema.ts` and `useEditorDataFlow.ts` updates.

---

### `useCanvasStore`

**Location**: `packages/stores/src/canvasStore.ts`
**Persistence**: `dispatch(CanvasAction)` + hub repository

Owns the FRAME / Process Hub canvas document. The canvas is the substrate for the Process tab.

| Field                    | Type                   | Description                                                    |
| ------------------------ | ---------------------- | -------------------------------------------------------------- |
| `canonicalMap`           | `ProcessMap`           | The process map (nodes = steps, edges = connections)           |
| `outcomes`               | `OutcomeSpec[]`        | Outcome specs attached to the hub (from `ProcessHub.outcomes`) |
| `primaryScopeDimensions` | `string[]`             | Primary scope dimensions for the hub                           |
| `canonicalMapVersion`    | `string`               | Version string for optimistic concurrency                      |
| `undoStack`              | `CanvasHistoryEntry[]` | History for undo (cap 50)                                      |
| `redoStack`              | `CanvasHistoryEntry[]` | History for redo (cap 50)                                      |

**Key actions**: `dispatch(CanvasAction)`, `addStep()`, `removeStep()`, `connectSteps()`, `undo()`, `redo()`.

---

### `useImprovementProjectStore`

**Location**: `packages/stores/src/improvementProjectStore.ts`
**Persistence**: per-Project state via hub repository / `.vrs` (Document-layer dispatch)
**`STORE_LAYER`**: `'document'`

Owns the user's **Projects** — the V1 user-facing top-level unit of work (the noun the UI shows in the `[Projects]` tab and Charter ceremony per wedge spec §3.0–3.2). The user creates multiple Projects over time; each Project wraps **one internal `ProcessHub` 1:1**. "Hub" survives as the internal data container but is demoted from user-visible primary concept; **multi-Hub orchestration / Hub portfolios are deferred to VariScout Process (future separate product), NOT V1**.

Renames the deleted `useImprovementStore` from the F4 era with the wedge V1 data shape: `metadata.title` (required), `metadata.members?: ProjectMember[]` (Lead/Member/Sponsor per §4.1), `status: 'draft' | 'active' | 'closed'`, Charter → Approach → Improve → Sustainment lifecycle (§3.2). The code type is `ImprovementProject` (legacy code name kept for the entity type; "Project" is the user-facing label).

| Field           | Type                                         | Description                                                                                                                                                                                                                                                                        |
| --------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectsByHub` | `Record<ProcessHubId, ImprovementProject[]>` | Current shape: Projects grouped by their internal Hub. **Migration-in-progress per wedge spec §6** — store keys are being re-keyed from `ProcessHubId` to `ProjectId` for project-scoped state. In V1 each Hub maps to one Project (1:1); the `Record` shape is a legacy holdover. |

**Key actions**: `setProjectsForHub(hubId, projects)`, `getProjectsForHub(hubId)`, `upsertProject(project)`, `removeProject(projectId)`.

**Wedge V1 link**: this store is the substrate for the top-level Improve tab and the active-Project cascade (every verb tab uses `useActiveIPContext(sessionHub)` to resolve the user's active Project). Membership mutation goes through `upsertProject` after `useProjectMembershipStore.acceptInvite` cascades.

---

## Annotation Layer (4 stores — 1 per-hub + 3 per-user)

### `useCanvasViewportStore`

**Location**: `packages/stores/src/canvasViewportStore.ts`
**Persistence**: Dexie DB `variscout-canvas-viewport` (R12 ESLint exception — this store imports Dexie directly for cross-app UI state)
**`STORE_LAYER`**: `'annotation-per-hub'`

Per-hub canvas viewport state. Call `rehydrateCanvasViewport(hubId)` on hub open; debounced `persistCanvasViewport(hubId)` on mutation.

| Field              | Type                                           | Description                                               |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| `viewMode`         | `'map' \| 'wall'`                              | Whether showing the process map or the Investigation Wall |
| `viewports`        | `Record<ProcessHubId, CanvasViewportSnapshot>` | Per-hub zoom + pan + level state                          |
| `selection`        | `Set<NodeId>`                                  | Currently selected canvas nodes                           |
| `chartClusters`    | `ChartClusterState[]`                          | Positioned chart clusters on the Wall                     |
| `andCheckSnapshot` | `AndCheckSnapshot \| null`                     | Snapshot of the AND-gate hold/total for the Wall          |
| `pendingComments`  | `PendingComment[]`                             | Optimistic comment queue                                  |

**Canvas viewport principle (8f)**: viewport state is a state concept, not a rendering mechanism. Pan/zoom + active level/lens are unified here; each renderer (SVG/DOM) paints in its native medium.

---

### `usePreferencesStore`

**Location**: `packages/stores/src/preferencesStore.ts`
**Persistence**: idb-keyval, key `'variscout-preferences'`
**`STORE_LAYER`**: `'annotation-per-user'`

Durable per-user preferences that survive reload but are not portable to other analysts.

| Field                  | Type             | Description                                                                                                   |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `activeView`           | `WorkspaceView`  | Current workspace tab: `'dashboard' \| 'frame' \| 'analysis' \| 'investigation' \| 'improvement' \| 'report'` |
| `piActiveTab`          | `PITab`          | Active PI panel tab: `'stats' \| 'questions' \| 'journal'`                                                    |
| `isPISidebarOpen`      | `boolean`        | Whether the PI sidebar is open                                                                                |
| `isCoScoutOpen`        | `boolean`        | Whether the CoScout panel is open (Azure only)                                                                |
| `aiEnabled`            | `boolean`        | User preference for AI features                                                                               |
| `timeLens`             | `TimeLens`       | Active time lens selection (default `DEFAULT_TIME_LENS`)                                                      |
| `riskAxisConfig`       | `RiskAxisConfig` | Improvement matrix risk axis configuration                                                                    |
| `budgetConfig`         | `BudgetConfig`   | Improvement budget configuration                                                                              |
| `isIPTeamRailExpanded` | `boolean`        | Whether the IP team rail is expanded                                                                          |

**Renamed / deleted stores**: `useSessionStore` was deleted in F4 (2026-05-07; durable half → `usePreferencesStore`, transient half → `useViewStore`). `useImprovementStore` was renamed to `useImprovementProjectStore` post-wedge-V1 with a per-IP data shape (`projectsByHub`); do not re-introduce the F4 name. Improvement preferences (matrix axis, budget) live in `usePreferencesStore`; the IP records themselves live in the renamed store.

---

### `useActiveIPStore`

**Location**: `packages/stores/src/activeIPStore.ts`
**Persistence**: localStorage, key `variscout:activeIP:{hubId}:{userId}` (with URL-encoded scope parts)
**`STORE_LAYER`**: `'annotation-per-user'`

Tracks the active improvement project per hub per user. Scoped to prevent cross-user bleed.

| Field       | Type                            | Description                            |
| ----------- | ------------------------------- | -------------------------------------- |
| `activeIPs` | `Record<string, ActiveIPState>` | Map of storage key → `{ ipId, setAt }` |

**Key actions**: `getActiveIP(scope)`, `setActiveIP(scope, ipId)`, `clearActiveIP(scope)`, `rehydrateActiveIP(scope)`.

---

### `useProjectMembershipStore`

**Location**: `packages/stores/src/useProjectMembershipStore.ts`
**Persistence**: localStorage (Zustand `persist` middleware), key `'variscout:projectMembership'`
**`STORE_LAYER`**: `'annotation-per-user'`

Per-user pending-invitation queue for the wedge V1 collaboration model (Lead/Member/Sponsor). Holds only invitations that have not yet been accepted; accepted invites cascade into `useImprovementProjectStore` via `MembershipAction` (membership data lives on the IP record, not here).

| Field            | Type           | Description                                                           |
| ---------------- | -------------- | --------------------------------------------------------------------- |
| `pendingInvites` | `Invitation[]` | Invitations awaiting accept/revoke; populated by Lead's invite action |

**Key actions**: `addPendingInvite(inv)`, `acceptInvite(id)` (cascades to `useImprovementProjectStore.upsertProject`), `revokeInvite(id)`.

**Cross-store note**: `acceptInvite` reaches into `useImprovementProjectStore.getState().projectsByHub` to find the target IP and dispatch an `INVITATION_ACCEPT` `MembershipAction`. This is an allowed cross-store imperative call — reactive subscriptions between the two stores remain forbidden.

---

## View Layer (1 store)

### `useViewStore`

**Location**: `packages/stores/src/viewStore.ts`
**Persistence**: NONE — transient, cleared on `projectStore.loadProject()` / `newProject()`
**`STORE_LAYER`**: `'view'`

All state that does not survive browser reload. Test pattern: `beforeEach(() => useViewStore.setState(useViewStore.getInitialState()))`.

| Field                          | Type                         | Description                                            |
| ------------------------------ | ---------------------------- | ------------------------------------------------------ |
| `highlightRowIndex`            | `number \| null`             | Row highlighted in data table (from chart point click) |
| `highlightedChartPoint`        | `number \| null`             | Chart point highlighted (from data table row click)    |
| `highlightedFindingId`         | `string \| null`             | Finding ID highlighted for bidirectional navigation    |
| `expandedQuestionId`           | `string \| null`             | Question expanded in PI panel questions tab            |
| `pendingChartFocus`            | `string \| null`             | Set by `navigate_to` CoScout tool; consumed by Editor  |
| `piOverflowView`               | `'data' \| 'whatif' \| null` | Secondary overflow view in PI panel                    |
| `isDataTableOpen`              | `boolean`                    | Data table modal open state                            |
| `focusedQuestionId`            | `string \| null`             | Question focused on the Investigation Wall             |
| `highlightedImprovementIdeaId` | `string \| null`             | Idea highlighted in prioritization matrix              |
| `improvementActiveView`        | `'plan' \| 'track'`          | Active tab in the IMPROVE workspace                    |
| `selectedPoints`               | `Set<number>`                | Multi-point brushing selection (Minitab-style)         |
| `selectionIndexMap`            | `Map<number, number>`        | Row index → display point index mapping                |

Note: `problemContributionTree` highlights live in this store; the tree itself lives in `useInvestigationStore`.

---

## Usage Rules (enforced by ESLint + tests)

- **Selectors required**: `useProjectStore(s => s.field)` — never bare `useStore()`.
- **No DataContext** — all shared state via stores (ADR-041).
- **Document stores never import `dexie` directly** (ESLint P7.2). Only `apps/*/src/persistence/**` and `apps/*/src/db/**` are whitelisted. R12 exception: `canvasViewportStore.ts`.
- **Cross-store imperative action calls are allowed**; reactive subscriptions between stores are forbidden.
- **Sustainment direct writes**: `sustainmentRecords`, `sustainmentReviews`, `controlHandoffs` are NOT yet hub-domain-dispatched — direct `apps/azure/src/services/localDb.ts` writes (R13 allow-listed). F5 may unify.

---

## Related

- `packages/stores/CLAUDE.md` — authoritative one-page summary with layer table
- `packages/stores/src/__tests__/layerBoundary.test.ts` — enforces middleware presence/absence per layer
- ADR-041, ADR-064, ADR-065, ADR-078, ADR-080
- `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` — F4 three-layer design spec
