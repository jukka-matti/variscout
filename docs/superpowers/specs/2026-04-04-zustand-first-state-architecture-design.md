---
title: 'Zustand-First State Architecture'
status: draft
date: 2026-04-04
audience: [developer, architect]
category: architecture
related: [state-management, zustand, persistence, collaboration, DDD]
---

# Zustand-First State Architecture

## Problem

The current 3-layer state architecture (DataContext + Orchestration hooks + Zustand stores) has structural issues:

1. **DataContext is a god object** — 50+ state fields, 70+ actions in one `useDataState` hook (700+ lines). Every state change re-runs memoization across all fields.
2. **Orchestration hooks are glue code** — 3 hooks (`useFindingsOrchestration`, `useInvestigationOrchestration`, `useImprovementOrchestration`) exist solely to sync Context→Zustand via `useEffect`. Each effect is a potential render loop source.
3. **Render loops** — calling `onFindingsChange` inside a `setState` updater (`useFindings.ts:169`) triggers DataContext updates during React's commit phase, causing "Cannot update DataProvider while rendering Editor" errors.
4. **Persistence is coupled to React state** — save/load goes through `useState`, meaning every project load triggers cascading `setState` calls.
5. **Incomplete cross-device sync** — only findings and rawData have union merge; questions, categories, and suspected causes use last-write-wins.
6. **No real-time collaboration** — investigation state doesn't sync between simultaneous users; only brainstorm ideas do (via SSE).

## Decision

Replace the DataContext + Orchestration + Zustand architecture with a **Zustand-first** approach:

- **4 domain Zustand stores** as the single source of truth (no React Context)
- **Zustand persist middleware** for IndexedDB auto-save
- **Store subscribers** for cloud sync (Blob Storage)
- **Yjs CRDT layer** designed in from the start for collaborative editing
- **Derived selectors** for computed state; Web Workers for heavy computation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (@variscout/core) — unchanged                  │
��� Pure functions: calculateStats, parseText, createFinding     │
│ Types: Finding, Question, SuspectedCause, SpecLimits         │
│ No React, no Zustand, no side effects                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ imports types + factories
┌───────────────────────────▼─────────────────────────────────┐
│ APPLICATION LAYER (new: @variscout/stores)                   │
│                                                              │
│ projectStore       — dataset, config, project lifecycle      │
│ investigationStore — findings, questions, hubs, categories   │
│ improvementStore   — ideas, actions, outcomes, projections   │
│ sessionStore       — UI panels, AI state, highlights         │
│                                                              │
│ Each store:                                                  │
│   • Imports domain factories from @variscout/core            │
│   • Owns its actions (commands)                              │
│   • Exposes selectors (queries)                              │
│   • Persist middleware → IndexedDB                           ���
│   • Optional: Yjs sync provider for collaboration            │
│                                                              │
│ useComputedAnalysis() — derived stats from store state       │
│ (replaces useDataComputation, still uses Web Workers)        │
└───────────────────────────┬─────────────────────────────────┘
                            │ components use selectors
┌───────────────────────────▼─────────────────────────────────┐
│ PRESENTATION LAYER (@variscout/ui, @variscout/charts)        │
│ Props-based components — unchanged                           │
│ App wrappers read from stores via selectors                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ INFRASTRUCTURE LAYER (apps/azure/src/services/)              │
│ cloudSyncSubscriber — store.subscribe → Blob Storage         │
│ yjsProvider — SSE-based Yjs sync (Team plan)                 │
│ server.js — Express endpoints (auth, KB, sync)               │
└─────────────────────────────────────────────────────────────┘
```

## Store Design

### 1. projectStore (Bounded Context: Data & Configuration)

Owns the raw dataset, analysis configuration, and project lifecycle.

```typescript
interface ProjectState {
  // Project identity
  projectId: string | null;
  projectName: string | null;
  hasUnsavedChanges: boolean;

  // Dataset (immutable after import)
  rawData: DataRow[];
  dataFilename: string | null;
  dataQualityReport: DataQualityReport | null;

  // Column mapping
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;

  // Analysis configuration
  analysisMode: AnalysisMode;
  specs: SpecLimits;
  measureSpecs: Record<string, SpecLimits>;
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;
  measureColumns: string[];
  measureLabel: string;
  selectedMeasure: string | null;
  cpkTarget: number | undefined;
  yamazumiMapping: YamazumiColumnMapping | null;
  subgroupConfig: SubgroupConfig;

  // Filters & view
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  axisSettings: AxisSettings;
  displayOptions: DisplayOptions;
  chartTitles: ChartTitles;

  // Pareto
  paretoMode: ParetoMode;
  paretoAggregation: 'count' | 'value';
  separateParetoData: ParetoRow[] | null;

  // Process context (AI grounding)
  processContext: ProcessContext | null;
  entryScenario: EntryScenario | null;
}

interface ProjectActions {
  // Data import
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  // ... all existing setters

  // Project lifecycle
  newProject: () => void;
  loadProject: (state: SerializedProject) => void;
  markSaved: () => void;
}
```

### 2. investigationStore (Bounded Context: Investigation Workflow)

Owns the entire investigation lifecycle: findings, questions, suspected cause hubs, and categories. Replaces `useFindings`, `useQuestions`, `useSuspectedCauses`, and all 3 orchestration hooks.

```typescript
interface InvestigationState {
  // Findings (observation log)
  findings: Finding[];

  // Questions (investigation tree)
  questions: Question[];
  focusedQuestionId: string | null;

  // Suspected cause hubs
  suspectedCauses: SuspectedCause[];

  // Investigation categories (factor grouping)
  categories: InvestigationCategory[];
}

interface InvestigationActions {
  // Finding CRUD
  addFinding: (
    text: string,
    context: FindingContext,
    source?: FindingSource,
    questionId?: string
  ) => Finding;
  editFinding: (id: string, text: string) => void;
  deleteFinding: (id: string) => void;
  setFindingStatus: (id: string, status: FindingStatus) => void;
  addFindingComment: (id: string, text: string, author?: string) => void;
  addAction: (
    findingId: string,
    text: string,
    assignee?: FindingAssignee,
    dueDate?: string
  ) => void;
  setOutcome: (findingId: string, outcome: FindingOutcome) => void;
  setBenchmark: (findingId: string, stats: BenchmarkStats) => void;

  // Question CRUD
  addQuestion: (text: string, factor?: string, level?: string, parentId?: string) => Question;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  setQuestionStatus: (id: string, status: QuestionStatus) => void;
  linkFinding: (findingId: string, questionId: string) => void;
  setFocusedQuestion: (id: string | null) => void;

  // Suspected cause hub CRUD
  createHub: (name: string, synthesis: string) => SuspectedCause;
  updateHub: (id: string, updates: Partial<SuspectedCause>) => void;
  deleteHub: (id: string) => void;
  connectQuestion: (hubId: string, questionId: string) => void;
  connectFinding: (hubId: string, findingId: string) => void;

  // Categories
  setCategories: (categories: InvestigationCategory[]) => void;

  // Bulk operations (for project load)
  loadInvestigationState: (state: SerializedInvestigationState) => void;
  resetAll: () => void;
}
```

**Key difference from current architecture:** All CRUD logic lives _inside_ the store actions. No external hooks (`useFindings`, `useQuestions`) needed. No orchestration layer. No `onFindingsChange` callbacks. No render-time setState.

### 3. improvementStore (Bounded Context: Improvement Workflow)

Owns improvement planning state. Currently partially exists as a Zustand store.

```typescript
interface ImprovementState {
  activeView: 'plan' | 'track';
  highlightedIdeaId: string | null;
  riskAxisConfig: RiskAxisConfig;
  budgetConfig: BudgetConfig;
}

interface ImprovementActions {
  setActiveView: (view: 'plan' | 'track') => void;
  setHighlightedIdeaId: (id: string | null) => void;
  setRiskAxisConfig: (config: RiskAxisConfig) => void;
  setBudgetConfig: (config: BudgetConfig) => void;
}
```

**Note:** Ideas and actions live on `Question` and `Finding` objects in `investigationStore`. `improvementStore` holds only the UI state for the improvement workspace. Derived data (matrixIdeas, aggregatedActions, projectedCpk) are computed via selectors.

### 4. sessionStore (Bounded Context: UI Session)

Owns transient UI state that doesn't persist across sessions (or persists partially via viewState).

```typescript
interface SessionState {
  // Panel layout
  activeView: WorkspaceView;
  isPISidebarOpen: boolean;
  piActiveTab: PITab;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isDataTableOpen: boolean;

  // Highlights (transient)
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
  highlightedFindingId: string | null;
  expandedQuestionId: string | null;

  // AI state
  narration: NarrationState;
  coScoutMessages: CoScoutMessage[];
  suggestedQuestions: string[];
  actionProposals: ActionProposal[];
  kbDocuments: KBDocument[];

  // Session engagement
  turnCount: number;
  findingsCreatedThisSession: boolean;
}
```

**Persistence:** `activeView`, `isPISidebarOpen`, `isCoScoutOpen`, `isWhatIfOpen` persist as `viewState` in project data. Everything else is session-only.

## Computed State (Replaces useDataComputation)

**Principle:** Compute on read, not on write. Light computations are derived selectors; heavy computations use Web Workers.

### Light: Inline Selectors

```typescript
// In component or custom hook
const filteredData = useProjectStore(s => filterRows(s.rawData, s.filters));
const factorLevels = useProjectStore(s => getUniqueLevels(s.rawData, s.factors));
```

### Heavy: useComputedAnalysis Hook

```typescript
// Replaces useDataComputation — same Web Worker, different input source
function useComputedAnalysis() {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const filters = useProjectStore(s => s.filters);
  const specs = useProjectStore(s => s.specs);

  const filteredData = useMemo(() => filterRows(rawData, filters), [rawData, filters]);

  // Heavy stats via Web Worker (same pattern as useAsyncStats today)
  const { stats, isComputing } = useAsyncStats(filteredData, outcome, specs);

  return { filteredData, stats, isComputing };
}
```

The Web Worker pipeline (`useAsyncStats`, `useStatsWorker`) is unchanged — it just reads from store selectors instead of Context state.

## Persistence Architecture

### Layer 1: IndexedDB (via Zustand persist middleware)

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const idbStorage = createJSONStorage(() => ({
  getItem: async name => await get(name),
  setItem: async (name, value) => await set(name, value),
  removeItem: async name => await del(name),
}));

const useProjectStore = create(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'variscout-project',
      storage: idbStorage,
      partialize: state => ({
        // Only persist data fields, not derived/transient state
        rawData: state.rawData,
        outcome: state.outcome,
        factors: state.factors,
        specs: state.specs,
        // ... other persisted fields
      }),
    }
  )
);
```

### Layer 2: Blob Storage Cloud Sync (via store.subscribe)

```typescript
// In apps/azure/src/services/cloudSyncSubscriber.ts
function setupCloudSync(stores: {
  project: typeof useProjectStore;
  investigation: typeof useInvestigationStore;
}) {
  const debouncedSave = debounce(async () => {
    const projectState = stores.project.getState();
    const investigationState = stores.investigation.getState();
    const serialized = serializeProject(projectState, investigationState);
    await uploadToBlob(serialized);
  }, 2000);

  // Subscribe to changes in both stores
  stores.project.subscribe(debouncedSave);
  stores.investigation.subscribe(debouncedSave);
}
```

### Layer 3: Merge Strategy (Simplified)

Replace 3-way merge with simple union merge:

| Data Type        | Merge Strategy               |
| ---------------- | ---------------------------- |
| Findings         | Union by ID (no data loss)   |
| Questions        | Union by ID                  |
| Suspected causes | Union by ID                  |
| rawData          | Take larger array (additive) |
| Scalar fields    | Last-write-wins (timestamp)  |

No base state tracking needed. Simpler than current 3-way merge.

## Collaboration Architecture (Yjs Integration)

### Phase 1: Foundation (build now)

Design stores so data is structured for CRDT sync:

- All entities have stable string IDs (already the case)
- All mutations go through store actions (single entry point)
- Store actions are idempotent where possible

### Phase 2: Yjs Layer (build when Team collab ships)

```
┌─────────────────────────────────────────────────┐
│ Zustand Store (local state)                     │
│   ← reads from Y.Doc                            │
│   → writes to Y.Doc (which syncs)               │
├─────────────────────────────────────────────────┤
│ Yjs Y.Doc (shared document)                     │
│   findings: Y.Array<Y.Map>                       │
│   questions: Y.Array<Y.Map>                      │
│   suspectedCauses: Y.Array<Y.Map>                │
├─────────────────────────────────────────────────┤
│ Yjs Provider (SSE-based, reuses existing infra) │
│   Server: /api/collab/stream → broadcasts updates│
│   Client: EventSource → applies remote changes   │
└─────────────────────────────────────────────────┘
```

**Reuse from existing brainstorm SSE:**

- Same SSE endpoint pattern (`/api/collab/stream?projectId=X`)
- Same session model (participants, phases)
- Same EventSource connection management (`useBrainstormSession` pattern)

**Key design:** Yjs Y.Doc is the sync layer; Zustand store is the React-facing read model. Y.Doc changes → store update (no React reconciliation involved in sync). Store action → Y.Doc mutation → broadcasts to other clients.

## What Gets Deleted

| File                                                                     | Lines      | Reason                             |
| ------------------------------------------------------------------------ | ---------- | ---------------------------------- |
| `packages/hooks/src/useDataState.ts`                                     | ~700       | Replaced by 4 Zustand stores       |
| `packages/hooks/src/useFindings.ts`                                      | ~400       | CRUD moves into investigationStore |
| `packages/hooks/src/useQuestions.ts`                                     | ~300       | CRUD moves into investigationStore |
| `packages/hooks/src/useSuspectedCauses.ts`                               | ~150       | CRUD moves into investigationStore |
| `apps/azure/src/context/DataContext.tsx`                                 | ~250       | No more React Context              |
| `apps/pwa/src/context/DataContext.tsx`                                   | ~80        | No more React Context              |
| `apps/azure/src/features/findings/useFindingsOrchestration.ts`           | ~250       | No orchestration needed            |
| `apps/azure/src/features/investigation/useInvestigationOrchestration.ts` | ~260       | No orchestration needed            |
| `apps/azure/src/features/improvement/useImprovementOrchestration.ts`     | ~500       | Simplified; derived selectors      |
| **Total removed**                                                        | **~2,900** |                                    |

## What Gets Created

| File                                                  | Purpose                           |
| ----------------------------------------------------- | --------------------------------- |
| `packages/stores/src/projectStore.ts`                 | Data + config store               |
| `packages/stores/src/investigationStore.ts`           | Findings + questions + hubs store |
| `packages/stores/src/improvementStore.ts`             | Improvement UI state              |
| `packages/stores/src/sessionStore.ts`                 | Panels + AI + highlights          |
| `packages/stores/src/persistence/idbAdapter.ts`       | IndexedDB persist adapter         |
| `packages/stores/src/persistence/cloudSync.ts`        | Blob Storage subscriber           |
| `packages/stores/src/computed/useComputedAnalysis.ts` | Stats computation hook            |
| `packages/stores/src/index.ts`                        | Barrel export                     |

## What Stays in @variscout/hooks

Hooks that don't manage state — only compute or compose:

- `useChartScale`, `useResponsiveChartMargins`, `useResponsiveFonts`, `useResponsiveTickCount`
- `useBoxplotData`, `useIChartData`, `useParetoChartData` (chart data transforms)
- `useChartCopy`, `useAnnotations`, `useHighlightFade`
- `useKeyboardNavigation`, `useFocusedChartNav`
- `useLocaleState`, `useTranslation`, `useThemeState`
- `useAsyncStats` (Web Worker bridge)
- `useDataIngestion` (file parsing — reads from `projectStore` instead of Context)

## Package Structure

```
packages/
├── core/       # @variscout/core — unchanged (pure domain)
├── stores/     # @variscout/stores — NEW
│   ├── src/
│   │   ├── projectStore.ts
│   │   ├── investigationStore.ts
│   │   ├── improvementStore.ts
│   │   ├── sessionStore.ts
│   │   ├── persistence/
│   │   │   ├── idbAdapter.ts
│   │   │   └── cloudSync.ts
│   │   ├── computed/
│   │   │   └── useComputedAnalysis.ts
│   │   └── index.ts
│   └── package.json
├── hooks/      # @variscout/hooks — slimmed (UI-only hooks)
├── charts/     # @variscout/charts — unchanged
├── ui/         # @variscout/ui — unchanged
└── data/       # @variscout/data — unchanged
```

## Migration Sequence

Since there are no production users, migration is a clean replacement:

### Phase 1: Create stores + persistence (1 week)

1. Create `@variscout/stores` package
2. Implement `projectStore` with all state fields from `useDataState`
3. Implement `investigationStore` with CRUD from `useFindings`/`useQuestions`/`useSuspectedCauses`
4. Add IndexedDB persist middleware
5. Write unit tests for store actions

### Phase 2: Wire Azure app (1 week)

1. Replace `useData()` calls with store selectors
2. Replace `DataProvider` with store initialization
3. Remove orchestration hooks
4. Wire `useComputedAnalysis` for stats
5. Wire cloud sync subscriber
6. Fix `useDataIngestion` to write to stores

### Phase 3: Wire PWA app (3 days)

1. Same store selectors, no-persist adapter for PWA
2. Remove PWA DataContext

### Phase 4: Cleanup + test (3 days)

1. Delete old files (~2,900 lines)
2. Run full test suite
3. E2E verification
4. Update CLAUDE.md and docs

### Phase 5: Yjs collaboration (future, when Team collab ships)

1. Add Yjs Y.Doc as sync layer for investigationStore
2. SSE provider reusing brainstorm endpoint pattern
3. Presence awareness (who's viewing what)

## DDD Alignment

| DDD Concept             | Implementation                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| **Bounded Context**     | Each store = one bounded context                                        |
| **Aggregate Root**      | `projectStore` for data/config, `investigationStore` for investigation  |
| **Domain Events**       | Store actions are the events (addFinding, answerQuestion)               |
| **Repository**          | Persist middleware = repository pattern                                 |
| **Application Service** | `useComputedAnalysis` = application service (orchestrates domain logic) |
| **Ubiquitous Language** | Store actions use domain terms from the constitution                    |

## Render Loop Elimination

The current render loop chain:

```
setState in useFindings → onFindingsChange → DataContext.setFindings
→ DataProvider re-render → Editor re-render → hooks re-run → loop
```

With Zustand-first:

```
investigationStore.addFinding() → synchronous state update → done.
Components that select findings re-render. Nothing else cascades.
```

No `useEffect` sync chains. No `onFindingsChange` callbacks. No React Context re-renders. The entire class of bugs is eliminated by architecture.

## CSP frame-ancestors Warning

The `frame-ancestors` CSP warning in console is benign — it's from a `<meta>` tag CSP directive in the HTML. `frame-ancestors` only works as an HTTP header, not in `<meta>`. Fix: move the directive to `server.js` response headers and remove from HTML `<meta>`.

## Success Criteria

1. Zero "Cannot update component while rendering" errors in console
2. Zero render loop errors on any user interaction
3. Project save/load works across browser sessions (IndexedDB)
4. Cloud sync works across devices (Blob Storage, Team plan)
5. Investigation state (findings, questions, hubs) fully persisted
6. PWA loads showcase sample with pre-populated investigation state
7. `pnpm test` passes with equivalent coverage
8. CoScout action tools call store actions directly (no hooks needed)
