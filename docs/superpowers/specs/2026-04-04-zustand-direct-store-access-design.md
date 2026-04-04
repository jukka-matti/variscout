---
title: 'Zustand Direct Store Access — Full DataContext Replacement'
status: delivered
date: 2026-04-04
audience: [developer, architect]
category: architecture
related: [state-management, zustand, DDD, CQRS, persistence]
---

# Zustand Direct Store Access — Full DataContext Replacement

## Problem

The Zustand-first migration (Phases 1-4) established 4 domain stores in `@variscout/stores` with 119 tests, but only `investigationStore` is wired (3 fields via `useStoreSync` shim). The 700-line `useDataState` god object still owns all project state. `useStoreSync` adds bidirectional sync glue code. All 40 consumer files still call `useData()` from DataContext, defeating Zustand's selective re-rendering advantage.

**Impact:** Every new feature touches useDataState. Render loops are architectural. The stores exist but aren't wired — the god object remains the bottleneck.

## Decision

Replace DataContext + useDataState + useStoreSync entirely with direct store selectors. Consumers import from stores + derived hooks. No facade layer. This is the Zustand-native "School B" approach, chosen over a compatibility facade because:

1. **Selective re-rendering** — Zustand's core value; a facade defeats it
2. **No facade tech debt** — no intermediate layer to maintain or eventually remove
3. **Independently testable** — each derived hook is a unit
4. **No production users** — low risk for the 40-file consumer migration
5. **Greenfield quality** — architecture that a new project would use from day 1

## Architecture

### Layer Diagram

```
DOMAIN LAYER (@variscout/core) — unchanged
  Pure functions, types, factories

STORE LAYER (@variscout/stores) — wire to consumers
  useProjectStore       → data, config, project lifecycle
  useInvestigationStore  → findings, questions, hubs, categories
  useSessionStore        → UI prefs, AI config (auto-persist)
  useImprovementStore    → ephemeral workspace state

DERIVED HOOKS (@variscout/hooks) — replace useDataComputation
  useFilteredData()       → rawData + filters → DataRow[]
  useAnalysisStats()      → filteredData + specs → StatsResult (Web Worker)
  useStagedAnalysis()     → filteredData + stageColumn → stagedData/stagedStats
  usePerformanceAnalysis()→ filteredData + measures → ChannelPerformanceData
  useYDomain()            → rawData + axisSettings → yDomainForCharts
  useSpecsForMeasure()    → specs + measureSpecs → lookup function

PERSISTENCE (@variscout/hooks or apps/) — reads/writes stores
  useProjectPersistence   → serialize stores → storage adapter
  cloudSyncSubscriber     → store.subscribe → Blob Storage (Azure only)

COMPONENTS (apps/) — compose what they need
  Each imports specific stores + derived hooks
```

### Consumer Migration Pattern

```typescript
// ❌ Before: DataContext facade (re-renders on all 45+ fields)
function BoxplotWrapper() {
  const { filteredData, outcome, specs, displayOptions, factors,
          findings, rawData, stats, ... } = useData();
}

// ✅ After: Direct store selectors (re-renders only on used fields)
function BoxplotWrapper() {
  const filteredData = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const findings = useInvestigationStore(s => s.findings);
}
```

## Store Field Mapping

### useProjectStore (Document Persist)

All fields from current `DataState` that represent project data and analysis configuration:

**Project identity:**

- `projectId`, `projectName`, `hasUnsavedChanges`, `dataFilename`

**Dataset:**

- `rawData`, `dataQualityReport`

**Column mapping:**

- `outcome`, `factors`, `timeColumn`, `columnAliases`, `valueLabels`

**Analysis configuration:**

- `analysisMode`, `specs`, `measureSpecs`, `stageColumn`, `stageOrderMode`
- `measureColumns`, `measureLabel`, `selectedMeasure`, `cpkTarget`
- `yamazumiMapping`, `subgroupConfig`

**Filters & view:**

- `filters`, `filterStack`, `axisSettings`, `displayOptions`, `chartTitles`

**Pareto:**

- `paretoMode`, `paretoAggregation`, `separateParetoData`, `separateParetoFilename`

**Process context:**

- `processContext`, `entryScenario`

**Selection (ephemeral, not persisted):**

- `selectedPoints`, `selectionIndexMap`

**Actions:** All current setters map 1:1 to store actions (already defined in projectStore).

### useInvestigationStore (Document Persist)

Already wired for 3 fields. Full scope:

- `findings`, `questions`, `suspectedCauses`, `categories`, `focusedQuestionId`
- Full CRUD actions (addFinding, editFinding, addQuestion, createHub, etc.)

### useSessionStore (Auto-Persist via Middleware)

UI preferences that persist across projects:

- `activeView`, `isPISidebarOpen`, `piActiveTab`, `isCoScoutOpen`, `isWhatIfOpen`, `isDataTableOpen`, `isFindingsOpen`
- `highlightRowIndex`, `highlightedChartPoint`, `highlightedFindingId`
- `expandedQuestionId`, `pendingChartFocus`, `piOverflowView`
- Azure-specific: `aiEnabled`, `aiPreferences`, `knowledgeSearchFolder`

### useImprovementStore (No Persist)

Ephemeral workspace state:

- `activeView`, `highlightedIdeaId`, `riskAxisConfig`, `budgetConfig`

## Derived Hooks

Replace `useDataComputation` (180 lines) with focused, composable hooks:

### useFilteredData()

```typescript
export function useFilteredData(): DataRow[] {
  const rawData = useProjectStore(s => s.rawData);
  const filters = useProjectStore(s => s.filters);
  return useMemo(() => filterRows(rawData, filters), [rawData, filters]);
}
```

### useAnalysisStats()

```typescript
export function useAnalysisStats(): { stats: StatsResult | null; isComputing: boolean } {
  const filteredData = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  // Reuses existing useAsyncStats (Web Worker bridge)
  return useAsyncStats(filteredData, outcome, specs);
}
```

### useStagedAnalysis()

```typescript
export function useStagedAnalysis() {
  const filteredData = useFilteredData();
  const stageColumn = useProjectStore(s => s.stageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  // Same logic as current useDataComputation staged section
  const stagedData = useMemo(() => sortByStage(filteredData, stageColumn, stageOrderMode), [...]);
  const stagedStats = useMemo(() => computeStagedStats(stagedData, stageColumn), [...]);
  return { stagedData, stagedStats };
}
```

### usePerformanceAnalysis()

```typescript
export function usePerformanceAnalysis() {
  const filteredData = useFilteredData();
  const measureColumns = useProjectStore(s => s.measureColumns);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const specs = useProjectStore(s => s.specs);
  // Same logic as current performance section in useDataComputation
  return useMemo(() => analyzePerformance(filteredData, measureColumns, specs, measureSpecs), [...]);
}
```

### useYDomain()

```typescript
export function useYDomain() {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const axisSettings = useProjectStore(s => s.axisSettings);
  const displayOptions = useProjectStore(s => s.displayOptions);
  // Same lock-to-full-data logic
  const fullDataYDomain = useMemo(() => computeYDomain(rawData, outcome), [...]);
  const yDomainForCharts = displayOptions.lockYAxisToFullData ? fullDataYDomain : undefined;
  return { fullDataYDomain, yDomainForCharts };
}
```

### useSpecsForMeasure()

```typescript
export function useSpecsForMeasure() {
  const specs = useProjectStore(s => s.specs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  return useCallback(
    (measureId: string) => measureSpecs[measureId] ?? specs,
    [specs, measureSpecs]
  );
}
```

## Persistence Architecture

### Document Persist (Project Save/Load)

`useProjectPersistence` is refactored to read from stores instead of 34 individual state getters:

```typescript
// Save: snapshot both stores → serialize → storage
function saveProject(name: string): Promise<SavedProject> {
  const project = useProjectStore.getState();
  const investigation = useInvestigationStore.getState();
  const serialized: AnalysisState = {
    version: '2',
    rawData: project.rawData,
    outcome: project.outcome,
    factors: project.factors,
    // ... all project fields
    findings: investigation.findings,
    questions: investigation.questions,
    categories: investigation.categories,
    // ... all investigation fields
  };
  return persistence.save(name, serialized);
}

// Load: storage → hydrate both stores (2 calls, not 34)
async function loadProject(id: string): Promise<void> {
  const data = await persistence.load(id);
  useProjectStore.getState().loadProject(data);
  useInvestigationStore.getState().loadInvestigationState(data);
}
```

### Auto-Persist (Session Preferences)

`useSessionStore` uses Zustand persist middleware with `idb-keyval`:

```typescript
const useSessionStore = create(
  persist(
    set => ({
      isPISidebarOpen: true,
      isCoScoutOpen: false,
      // ...
    }),
    {
      name: 'variscout-session',
      storage: idbStorage,
      partialize: state => ({
        // Only persist user preferences, not transient highlights
        isPISidebarOpen: state.isPISidebarOpen,
        isCoScoutOpen: state.isCoScoutOpen,
        activeView: state.activeView,
        aiEnabled: state.aiEnabled,
        // ... prefs only
      }),
    }
  )
);
```

### Cloud Sync (Azure Team Plan)

Replace auto-save + Context-based sync with store subscription:

```typescript
// apps/azure/src/services/cloudSyncSubscriber.ts
function setupCloudSync(storage: StorageContextValue) {
  const debouncedSave = debounce(async () => {
    const project = useProjectStore.getState();
    const investigation = useInvestigationStore.getState();
    const serialized = serializeProject(project, investigation);
    await storage.saveProject(serialized, project.projectName, location);
  }, 2000);

  // Subscribe to both stores
  useProjectStore.subscribe(debouncedSave);
  useInvestigationStore.subscribe(debouncedSave);
}
```

## What Gets Deleted

| File                                       | Lines      | Reason                                  |
| ------------------------------------------ | ---------- | --------------------------------------- |
| `packages/hooks/src/useDataState.ts`       | ~700       | Replaced by stores + derived hooks      |
| `packages/hooks/src/useDataComputation.ts` | ~180       | Replaced by focused derived hooks       |
| `apps/azure/src/context/useStoreSync.ts`   | ~187       | No longer needed — stores ARE the state |
| `apps/pwa/src/context/useStoreSync.ts`     | ~187       | Same                                    |
| `apps/azure/src/context/DataContext.tsx`   | ~401       | Replaced by store initialization        |
| `apps/pwa/src/context/DataContext.tsx`     | ~120       | Same                                    |
| **Total**                                  | **~1,775** |                                         |

## What Gets Created

| File                                             | Purpose                                          |
| ------------------------------------------------ | ------------------------------------------------ |
| `packages/hooks/src/useFilteredData.ts`          | Derived: rawData + filters → filteredData        |
| `packages/hooks/src/useAnalysisStats.ts`         | Derived: filteredData + specs → stats (Worker)   |
| `packages/hooks/src/useStagedAnalysis.ts`        | Derived: filteredData + stage → stagedData/stats |
| `packages/hooks/src/usePerformanceAnalysis.ts`   | Derived: filteredData + measures → channels      |
| `packages/hooks/src/useYDomain.ts`               | Derived: rawData + axis settings → Y domain      |
| `packages/hooks/src/useSpecsForMeasure.ts`       | Derived: specs + measureSpecs → lookup           |
| `packages/hooks/src/useProjectActions.ts`        | Persistence: save/load/export/import/new         |
| `apps/azure/src/services/cloudSyncSubscriber.ts` | Cloud: store.subscribe → Blob Storage            |

## What Gets Modified

| File                                          | Change                                           |
| --------------------------------------------- | ------------------------------------------------ |
| `packages/stores/src/sessionStore.ts`         | Add persist middleware + Azure fields            |
| `packages/stores/src/projectStore.ts`         | Add selectedPoints, selectionIndexMap, viewState |
| `packages/hooks/src/useProjectPersistence.ts` | Read from stores instead of 34 getters           |
| 26 Azure consumer files                       | Replace `useData()` with store imports           |
| 12 PWA consumer files                         | Same                                             |
| `apps/azure/src/pages/Editor.tsx`             | Remove DataProvider, wire stores + persistence   |
| `apps/pwa/src/App.tsx`                        | Same for PWA                                     |

## Migration Sequence

### Phase A: Extend Stores (Low Risk)

1. Add missing fields to `projectStore` (selectedPoints, selectionIndexMap, viewState)
2. Add persist middleware to `sessionStore` + Azure fields
3. Add tests for new fields

### Phase B: Create Derived Hooks (Low Risk)

1. Extract `useFilteredData`, `useAnalysisStats`, etc. from `useDataComputation` logic
2. Create `useProjectActions` (persistence wrapper that reads/writes stores)
3. Add tests for derived hooks

### Phase C: Wire Persistence (Medium Risk — must work before consumers migrate)

1. Refactor `useProjectPersistence` to read from `getState()` and load via store actions
2. Wire `cloudSyncSubscriber` in Azure (store.subscribe → debounced Blob Storage)
3. Replace `useAutoSave` with store subscription
4. Verify save/load/export/import roundtrip with stores as source of truth

### Phase D: Migrate Consumers (Mechanical, Medium Risk)

1. For each of 40 consumer files:
   - Replace `useData()` destructure with store imports + derived hooks
   - Map each setter to the corresponding store action
2. Migrate in batches: charts → hooks → pages → Editor/App root
3. Keep DataContext temporarily as a thin pass-through during batch migration

### Phase E: Delete Legacy (High Satisfaction)

1. Delete useDataState, useDataComputation, useStoreSync, DataContext
2. Update barrel exports in `@variscout/hooks`
3. Full test suite + build verification

## Consumer Batch Plan

### Batch 1: Chart Wrappers (8 files, lowest risk)

These only need filteredData, specs, displayOptions, outcome. Purely read-only.

- `apps/azure/src/components/charts/` — IChartWrapper, BoxplotWrapper, ParetoWrapper, etc.
- `apps/pwa/src/components/charts/` — Same

### Batch 2: Hooks that read from useData (12 files)

These consume state and return derived values.

- Chart data hooks in `packages/hooks/src/` — already mostly using props, but some read from useData

### Batch 3: Panel Components (10 files)

Read state + dispatch actions.

- PI Panel, Findings Panel, Settings, Filter context bar

### Batch 4: Page Roots (4 files, highest risk)

Editor.tsx, App.tsx — orchestrate everything. These are the final migration targets.

## Testing Strategy

1. **Derived hooks**: Unit test each with mocked store state
2. **Store extensions**: Add tests for new fields (selectedPoints, viewState, persist)
3. **Persistence roundtrip**: Test save → load cycle with store serialization
4. **Existing tests**: All 895+ tests must pass (regression gate)
5. **Build verification**: `pnpm build` clean
6. **Dev server**: Both apps start without errors

## Success Criteria

1. Zero `useData()` calls remaining in codebase
2. Zero DataContext / useDataState / useStoreSync files
3. All 895+ existing tests pass
4. Build clean across all 5 packages
5. Save/load/export/import roundtrip works
6. Cloud sync works (Azure Team)
7. No "Cannot update component while rendering" errors
8. Selective re-rendering verified (React DevTools Profiler)
