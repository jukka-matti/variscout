# Zustand-First Architecture — Phase 1: Create @variscout/stores

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new `@variscout/stores` package with 4 Zustand domain stores (project, investigation, improvement, session) and IndexedDB persistence, replacing React Context as the source of truth.

**Architecture:** Each store is a Zustand bounded context owning its domain's state + CRUD actions. Stores use `zustand/middleware` persist with a custom IndexedDB adapter via `idb-keyval`. No React Context, no orchestration hooks, no useEffect sync chains. CRUD logic from `useFindings`/`useQuestions`/`useSuspectedCauses` moves directly into store actions.

**Tech Stack:** Zustand 5.x, idb-keyval, Vitest, @variscout/core (types + factories)

**Spec:** `docs/superpowers/specs/2026-04-04-zustand-first-state-architecture-design.md`

**Scope:** This is Phase 1 of 4. Creates the stores package only — no app wiring yet. Phases 2-4 (wire Azure, wire PWA, cleanup) follow in separate plans.

---

## File Structure

```
packages/stores/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                          # Barrel export
│   ├── projectStore.ts                   # Dataset + config + project lifecycle
│   ├── investigationStore.ts             # Findings + questions + hubs + categories
│   ├── improvementStore.ts               # Improvement UI state
│   ├── sessionStore.ts                   # Panels + AI + highlights
│   ├── persistence/
│   │   └── idbAdapter.ts                 # IndexedDB storage adapter for persist middleware
│   └── __tests__/
│       ├── projectStore.test.ts
│       ├── investigationStore.test.ts
│       ├── improvementStore.test.ts
│       └── sessionStore.test.ts
```

---

### Task 1: Package scaffold

**Files:**

- Create: `packages/stores/package.json`
- Create: `packages/stores/tsconfig.json`
- Create: `packages/stores/vitest.config.ts`
- Create: `packages/stores/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@variscout/stores",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "@variscout/core": "workspace:*",
    "zustand": "^5.0.0",
    "idb-keyval": "^6.2.1"
  },
  "devDependencies": {
    "vitest": "^4.1.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 4: Create empty barrel export**

```typescript
// packages/stores/src/index.ts
export { useProjectStore } from './projectStore';
export { useInvestigationStore } from './investigationStore';
export { useImprovementStore } from './improvementStore';
export { useSessionStore } from './sessionStore';
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add packages/stores/
git commit -m "chore: scaffold @variscout/stores package"
```

---

### Task 2: IndexedDB persistence adapter

**Files:**

- Create: `packages/stores/src/persistence/idbAdapter.ts`

- [ ] **Step 1: Create the adapter**

This wraps `idb-keyval` to conform to Zustand's `StateStorage` interface with project-scoped keys.

```typescript
// packages/stores/src/persistence/idbAdapter.ts
import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * IndexedDB storage adapter for Zustand persist middleware.
 * Uses idb-keyval for simple key-value storage.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
```

- [ ] **Step 2: Export from barrel**

Add to `packages/stores/src/index.ts`:

```typescript
export { idbStorage } from './persistence/idbAdapter';
```

- [ ] **Step 3: Commit**

```bash
git add packages/stores/src/persistence/
git commit -m "feat(stores): add IndexedDB persistence adapter"
```

---

### Task 3: projectStore — dataset + config + project lifecycle

**Files:**

- Create: `packages/stores/src/projectStore.ts`
- Create: `packages/stores/src/__tests__/projectStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/stores/src/__tests__/projectStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../projectStore';

beforeEach(() => {
  useProjectStore.setState(useProjectStore.getInitialState());
});

describe('projectStore', () => {
  it('initializes with empty state', () => {
    const s = useProjectStore.getState();
    expect(s.rawData).toEqual([]);
    expect(s.outcome).toBeNull();
    expect(s.factors).toEqual([]);
    expect(s.analysisMode).toBe('standard');
    expect(s.projectId).toBeNull();
  });

  it('sets raw data', () => {
    useProjectStore.getState().setRawData([{ x: 1 }, { x: 2 }]);
    expect(useProjectStore.getState().rawData).toHaveLength(2);
  });

  it('sets outcome and factors', () => {
    useProjectStore.getState().setOutcome('Weight');
    useProjectStore.getState().setFactors(['Line', 'Shift']);
    expect(useProjectStore.getState().outcome).toBe('Weight');
    expect(useProjectStore.getState().factors).toEqual(['Line', 'Shift']);
  });

  it('sets specs', () => {
    useProjectStore.getState().setSpecs({ lsl: 495, usl: 505, target: 500 });
    expect(useProjectStore.getState().specs).toEqual({ lsl: 495, usl: 505, target: 500 });
  });

  it('sets filters', () => {
    useProjectStore.getState().setFilters({ Line: ['Line 1'] });
    expect(useProjectStore.getState().filters).toEqual({ Line: ['Line 1'] });
  });

  it('sets analysis mode', () => {
    useProjectStore.getState().setAnalysisMode('performance');
    expect(useProjectStore.getState().analysisMode).toBe('performance');
  });

  it('resets on newProject', () => {
    useProjectStore.getState().setRawData([{ x: 1 }]);
    useProjectStore.getState().setOutcome('Y');
    useProjectStore.getState().newProject();
    expect(useProjectStore.getState().rawData).toEqual([]);
    expect(useProjectStore.getState().outcome).toBeNull();
  });

  it('loadProject hydrates state', () => {
    useProjectStore.getState().loadProject({
      rawData: [{ a: 1 }],
      outcome: 'Fill',
      factors: ['Line'],
      specs: { usl: 10 },
      analysisMode: 'standard',
    });
    expect(useProjectStore.getState().rawData).toEqual([{ a: 1 }]);
    expect(useProjectStore.getState().outcome).toBe('Fill');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/stores test -- --run
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write projectStore implementation**

```typescript
// packages/stores/src/projectStore.ts
import { create } from 'zustand';
import type {
  DataRow,
  SpecLimits,
  AnalysisMode,
  YamazumiColumnMapping,
  DataQualityReport,
  ParetoRow,
  SubgroupConfig,
  ProcessContext,
  EntryScenario,
} from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

type ParetoMode = 'derived' | 'separate';
type StageOrderMode = 'auto' | 'data-order';
type ScaleMode = 'auto' | 'fixed';

interface FilterAction {
  factor: string;
  values: (string | number)[];
  timestamp: number;
}

interface AxisSettings {
  min?: number;
  max?: number;
  scaleMode?: ScaleMode;
}

interface DisplayOptions {
  lockYAxisToFullData: boolean;
  showControlLimits: boolean;
  showViolin: boolean;
  showFilterContext: boolean;
  showAnnotations?: boolean;
  boxplotSortBy?: string;
  boxplotSortDirection?: string;
}

interface ChartTitles {
  ichart?: string;
  boxplot?: string;
  pareto?: string;
}

/** Minimal serialized project for loadProject */
export interface SerializedProject {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  analysisMode: AnalysisMode;
  // Optional fields — loaded if present
  projectId?: string;
  projectName?: string;
  dataFilename?: string;
  timeColumn?: string;
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  measureSpecs?: Record<string, SpecLimits>;
  stageColumn?: string;
  stageOrderMode?: StageOrderMode;
  measureColumns?: string[];
  measureLabel?: string;
  selectedMeasure?: string;
  cpkTarget?: number;
  yamazumiMapping?: YamazumiColumnMapping;
  subgroupConfig?: SubgroupConfig;
  filters?: Record<string, (string | number)[]>;
  filterStack?: FilterAction[];
  axisSettings?: AxisSettings;
  displayOptions?: DisplayOptions;
  chartTitles?: ChartTitles;
  paretoMode?: ParetoMode;
  paretoAggregation?: 'count' | 'value';
  separateParetoData?: ParetoRow[];
  processContext?: ProcessContext;
  entryScenario?: EntryScenario;
}

// ============================================================================
// State + Actions
// ============================================================================

interface ProjectState {
  // Project identity
  projectId: string | null;
  projectName: string | null;
  hasUnsavedChanges: boolean;

  // Dataset
  rawData: DataRow[];
  dataFilename: string | null;
  dataQualityReport: DataQualityReport | null;

  // Column mapping
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;

  // Analysis config
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

  // Filters
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  axisSettings: AxisSettings;
  displayOptions: DisplayOptions;
  chartTitles: ChartTitles;

  // Pareto
  paretoMode: ParetoMode;
  paretoAggregation: 'count' | 'value';
  separateParetoData: ParetoRow[] | null;
  separateParetoFilename: string | null;

  // Process context
  processContext: ProcessContext | null;
  entryScenario: EntryScenario | null;
}

interface ProjectActions {
  // Setters
  setRawData: (data: DataRow[]) => void;
  setOutcome: (col: string | null) => void;
  setFactors: (cols: string[]) => void;
  setSpecs: (specs: SpecLimits) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setFilterStack: (stack: FilterAction[]) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setDataFilename: (name: string | null) => void;
  setDataQualityReport: (report: DataQualityReport | null) => void;
  setTimeColumn: (col: string | null) => void;
  setColumnAliases: (aliases: Record<string, string>) => void;
  setValueLabels: (labels: Record<string, Record<string, string>>) => void;
  setAxisSettings: (settings: AxisSettings) => void;
  setDisplayOptions: (options: DisplayOptions) => void;
  setChartTitles: (titles: ChartTitles) => void;
  setMeasureColumns: (cols: string[]) => void;
  setMeasureLabel: (label: string) => void;
  setSelectedMeasure: (id: string | null) => void;
  setMeasureSpecs: (specs: Record<string, SpecLimits>) => void;
  setMeasureSpec: (id: string, specs: SpecLimits) => void;
  setCpkTarget: (target: number | undefined) => void;
  setStageColumn: (col: string | null) => void;
  setStageOrderMode: (mode: StageOrderMode) => void;
  setYamazumiMapping: (mapping: YamazumiColumnMapping | null) => void;
  setSubgroupConfig: (config: SubgroupConfig) => void;
  setParetoMode: (mode: ParetoMode) => void;
  setParetoAggregation: (mode: 'count' | 'value') => void;
  setSeparateParetoData: (data: ParetoRow[] | null) => void;
  setSeparateParetoFilename: (name: string | null) => void;
  setProcessContext: (ctx: ProcessContext | null) => void;
  setEntryScenario: (scenario: EntryScenario | null) => void;

  // Project lifecycle
  newProject: () => void;
  loadProject: (state: SerializedProject) => void;
  markSaved: () => void;
  markUnsaved: () => void;
}

// ============================================================================
// Initial state
// ============================================================================

const initialState: ProjectState = {
  projectId: null,
  projectName: null,
  hasUnsavedChanges: false,
  rawData: [],
  dataFilename: null,
  dataQualityReport: null,
  outcome: null,
  factors: [],
  timeColumn: null,
  columnAliases: {},
  valueLabels: {},
  analysisMode: 'standard',
  specs: {},
  measureSpecs: {},
  stageColumn: null,
  stageOrderMode: 'auto',
  measureColumns: [],
  measureLabel: 'Channel',
  selectedMeasure: null,
  cpkTarget: undefined,
  yamazumiMapping: null,
  subgroupConfig: { method: 'individual', size: 1 },
  filters: {},
  filterStack: [],
  axisSettings: {},
  displayOptions: {
    lockYAxisToFullData: true,
    showControlLimits: true,
    showViolin: false,
    showFilterContext: true,
  },
  chartTitles: {},
  paretoMode: 'derived',
  paretoAggregation: 'count',
  separateParetoData: null,
  separateParetoFilename: null,
  processContext: null,
  entryScenario: null,
};

// ============================================================================
// Store
// ============================================================================

export const useProjectStore = create<ProjectState & ProjectActions>()(set => ({
  ...initialState,

  // --- Setters (each marks unsaved) ---
  setRawData: data => set({ rawData: data, hasUnsavedChanges: true }),
  setOutcome: col => set({ outcome: col, hasUnsavedChanges: true }),
  setFactors: cols => set({ factors: cols, hasUnsavedChanges: true }),
  setSpecs: specs => set({ specs, hasUnsavedChanges: true }),
  setFilters: filters => set({ filters, hasUnsavedChanges: true }),
  setFilterStack: stack => set({ filterStack: stack }),
  setAnalysisMode: mode => set({ analysisMode: mode, hasUnsavedChanges: true }),
  setDataFilename: name => set({ dataFilename: name }),
  setDataQualityReport: report => set({ dataQualityReport: report }),
  setTimeColumn: col => set({ timeColumn: col, hasUnsavedChanges: true }),
  setColumnAliases: aliases => set({ columnAliases: aliases, hasUnsavedChanges: true }),
  setValueLabels: labels => set({ valueLabels: labels, hasUnsavedChanges: true }),
  setAxisSettings: settings => set({ axisSettings: settings }),
  setDisplayOptions: options => set({ displayOptions: options }),
  setChartTitles: titles => set({ chartTitles: titles, hasUnsavedChanges: true }),
  setMeasureColumns: cols => set({ measureColumns: cols, hasUnsavedChanges: true }),
  setMeasureLabel: label => set({ measureLabel: label }),
  setSelectedMeasure: id => set({ selectedMeasure: id }),
  setMeasureSpecs: specs => set({ measureSpecs: specs, hasUnsavedChanges: true }),
  setMeasureSpec: (id, specs) =>
    set(s => ({ measureSpecs: { ...s.measureSpecs, [id]: specs }, hasUnsavedChanges: true })),
  setCpkTarget: target => set({ cpkTarget: target, hasUnsavedChanges: true }),
  setStageColumn: col => set({ stageColumn: col, hasUnsavedChanges: true }),
  setStageOrderMode: mode => set({ stageOrderMode: mode }),
  setYamazumiMapping: mapping => set({ yamazumiMapping: mapping, hasUnsavedChanges: true }),
  setSubgroupConfig: config => set({ subgroupConfig: config, hasUnsavedChanges: true }),
  setParetoMode: mode => set({ paretoMode: mode }),
  setParetoAggregation: mode => set({ paretoAggregation: mode }),
  setSeparateParetoData: data => set({ separateParetoData: data }),
  setSeparateParetoFilename: name => set({ separateParetoFilename: name }),
  setProcessContext: ctx => set({ processContext: ctx, hasUnsavedChanges: true }),
  setEntryScenario: scenario => set({ entryScenario: scenario }),

  // --- Project lifecycle ---
  newProject: () => set({ ...initialState }),

  loadProject: state =>
    set({
      ...initialState,
      rawData: state.rawData,
      outcome: state.outcome,
      factors: state.factors,
      specs: state.specs,
      analysisMode: state.analysisMode ?? 'standard',
      projectId: state.projectId ?? null,
      projectName: state.projectName ?? null,
      dataFilename: state.dataFilename ?? null,
      timeColumn: state.timeColumn ?? null,
      columnAliases: state.columnAliases ?? {},
      valueLabels: state.valueLabels ?? {},
      measureSpecs: state.measureSpecs ?? {},
      stageColumn: state.stageColumn ?? null,
      stageOrderMode: state.stageOrderMode ?? 'auto',
      measureColumns: state.measureColumns ?? [],
      measureLabel: state.measureLabel ?? 'Channel',
      selectedMeasure: state.selectedMeasure ?? null,
      cpkTarget: state.cpkTarget,
      yamazumiMapping: state.yamazumiMapping ?? null,
      subgroupConfig: state.subgroupConfig ?? { method: 'individual', size: 1 },
      filters: state.filters ?? {},
      filterStack: state.filterStack ?? [],
      axisSettings: state.axisSettings ?? {},
      displayOptions: state.displayOptions ?? initialState.displayOptions,
      chartTitles: state.chartTitles ?? {},
      paretoMode: state.paretoMode ?? 'derived',
      paretoAggregation: state.paretoAggregation ?? 'count',
      separateParetoData: state.separateParetoData ?? null,
      processContext: state.processContext ?? null,
      entryScenario: state.entryScenario ?? null,
      hasUnsavedChanges: false,
    }),

  markSaved: () => set({ hasUnsavedChanges: false }),
  markUnsaved: () => set({ hasUnsavedChanges: true }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/stores test -- --run
```

Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/projectStore.ts packages/stores/src/__tests__/projectStore.test.ts
git commit -m "feat(stores): add projectStore with dataset + config + lifecycle"
```

---

### Task 4: investigationStore — findings + questions + hubs CRUD

**Files:**

- Create: `packages/stores/src/investigationStore.ts`
- Create: `packages/stores/src/__tests__/investigationStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/stores/src/__tests__/investigationStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';

beforeEach(() => {
  useInvestigationStore.setState(useInvestigationStore.getInitialState());
});

describe('investigationStore', () => {
  describe('findings CRUD', () => {
    it('adds a finding', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('Line 2 runs high', {
          activeFilters: { Line: ['Line 2'] },
          cumulativeScope: null,
          stats: { mean: 502, samples: 72 },
        });
      expect(f.id).toBeDefined();
      expect(f.text).toBe('Line 2 runs high');
      expect(f.status).toBe('observed');
      expect(useInvestigationStore.getState().findings).toHaveLength(1);
    });

    it('edits a finding', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('draft', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().editFinding(f.id, 'updated text');
      expect(useInvestigationStore.getState().findings[0].text).toBe('updated text');
    });

    it('deletes a finding', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('temp', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().deleteFinding(f.id);
      expect(useInvestigationStore.getState().findings).toHaveLength(0);
    });

    it('sets finding status', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('test', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().setFindingStatus(f.id, 'investigating');
      expect(useInvestigationStore.getState().findings[0].status).toBe('investigating');
    });

    it('links finding to question', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('test', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().linkFindingToQuestion(f.id, 'q-1');
      expect(useInvestigationStore.getState().findings[0].questionId).toBe('q-1');
    });

    it('adds action with auto-transition', () => {
      const f = useInvestigationStore
        .getState()
        .addFinding('test', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().setFindingStatus(f.id, 'analyzed');
      useInvestigationStore.getState().addFindingAction(f.id, 'Fix nozzle');
      const updated = useInvestigationStore.getState().findings[0];
      expect(updated.actions).toHaveLength(1);
      expect(updated.status).toBe('improving'); // auto-transition
    });
  });

  describe('questions CRUD', () => {
    it('adds a root question', () => {
      const q = useInvestigationStore.getState().addQuestion('Does Line affect weight?', 'Line');
      expect(q.id).toBeDefined();
      expect(q.status).toBe('open');
      expect(useInvestigationStore.getState().questions).toHaveLength(1);
    });

    it('adds a sub-question', () => {
      const parent = useInvestigationStore.getState().addQuestion('Root?');
      const child = useInvestigationStore
        .getState()
        .addSubQuestion(parent.id, 'Sub?', 'Line', 'Line 2');
      expect(child).not.toBeNull();
      expect(child!.parentId).toBe(parent.id);
    });

    it('sets question status', () => {
      const q = useInvestigationStore.getState().addQuestion('Test?');
      useInvestigationStore.getState().setQuestionStatus(q.id, 'answered');
      expect(useInvestigationStore.getState().questions[0].status).toBe('answered');
    });

    it('deletes question and descendants', () => {
      const parent = useInvestigationStore.getState().addQuestion('Root?');
      useInvestigationStore.getState().addSubQuestion(parent.id, 'Child?');
      useInvestigationStore.getState().deleteQuestion(parent.id);
      expect(useInvestigationStore.getState().questions).toHaveLength(0);
    });
  });

  describe('suspected cause hubs', () => {
    it('creates a hub', () => {
      const hub = useInvestigationStore.getState().createHub('Nozzle wear', 'Line 2 overfills');
      expect(hub.id).toBeDefined();
      expect(hub.status).toBe('suspected');
      expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(1);
    });

    it('connects questions and findings to hub', () => {
      const hub = useInvestigationStore.getState().createHub('Test hub', 'synthesis');
      useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-1');
      useInvestigationStore.getState().connectFindingToHub(hub.id, 'f-1');
      const updated = useInvestigationStore.getState().suspectedCauses[0];
      expect(updated.questionIds).toContain('q-1');
      expect(updated.findingIds).toContain('f-1');
    });

    it('deletes a hub', () => {
      const hub = useInvestigationStore.getState().createHub('Temp', 'test');
      useInvestigationStore.getState().deleteHub(hub.id);
      expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(0);
    });
  });

  describe('bulk operations', () => {
    it('loads investigation state', () => {
      useInvestigationStore.getState().loadInvestigationState({
        findings: [
          {
            id: 'f-1',
            text: 'test',
            createdAt: Date.now(),
            context: { activeFilters: {}, cumulativeScope: null },
            status: 'observed',
            comments: [],
            statusChangedAt: Date.now(),
          },
        ],
        questions: [
          {
            id: 'q-1',
            text: 'test?',
            status: 'open',
            linkedFindingIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        suspectedCauses: [],
      });
      expect(useInvestigationStore.getState().findings).toHaveLength(1);
      expect(useInvestigationStore.getState().questions).toHaveLength(1);
    });

    it('resets all', () => {
      useInvestigationStore
        .getState()
        .addFinding('test', { activeFilters: {}, cumulativeScope: null });
      useInvestigationStore.getState().addQuestion('test?');
      useInvestigationStore.getState().resetAll();
      expect(useInvestigationStore.getState().findings).toHaveLength(0);
      expect(useInvestigationStore.getState().questions).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/stores test -- --run
```

Expected: FAIL

- [ ] **Step 3: Write investigationStore implementation**

This is the largest store — it absorbs CRUD from `useFindings` (30+ actions), `useQuestions` (15+ actions), and `useSuspectedCauses` (10+ actions). Port the logic from those hooks, replacing `setState(prev => ...)` with Zustand `set(state => ...)`.

Create `packages/stores/src/investigationStore.ts` with:

- State: `findings`, `questions`, `suspectedCauses`, `categories`, `focusedQuestionId`
- Finding actions: `addFinding`, `editFinding`, `deleteFinding`, `setFindingStatus`, `setFindingTag`, `setFindingAssignee`, `addFindingComment`, `editFindingComment`, `deleteFindingComment`, `addPhotoToComment`, `updatePhotoStatus`, `addAttachmentToComment`, `updateAttachmentStatus`, `linkFindingToQuestion`, `unlinkFindingFromQuestion`, `setFindingProjection`, `clearFindingProjection`, `addFindingAction`, `updateFindingAction`, `completeFindingAction`, `toggleFindingActionComplete`, `deleteFindingAction`, `setFindingOutcome`, `setBenchmark`, `clearBenchmark`, `toggleScope`
- Question actions: `addQuestion`, `addSubQuestion`, `editQuestion`, `deleteQuestion`, `setQuestionStatus`, `linkFindingToQuestionList`, `unlinkFindingFromQuestionList`, `addIdea`, `updateIdea`, `deleteIdea`, `setFocusedQuestion`
- Hub actions: `createHub`, `updateHub`, `deleteHub`, `connectQuestionToHub`, `disconnectQuestionFromHub`, `connectFindingToHub`, `disconnectFindingFromHub`, `setHubStatus`, `setHubEvidence`, `resetHubs`
- Category actions: `setCategories`
- Bulk: `loadInvestigationState`, `resetAll`

The implementation follows the exact same patterns as `useFindings.ts` and `useQuestions.ts`, but uses `set(state => ({ findings: state.findings.map(...) }))` instead of `setState(prev => ...)`.

**Key difference: NO `onFindingsChange` callback.** This eliminates the render-loop source at line 169. Persistence happens via `store.subscribe()`, not callbacks.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/stores test -- --run
```

Expected: PASS (all 12 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/investigationStore.ts packages/stores/src/__tests__/investigationStore.test.ts
git commit -m "feat(stores): add investigationStore with findings/questions/hubs CRUD"
```

---

### Task 5: improvementStore + sessionStore

**Files:**

- Create: `packages/stores/src/improvementStore.ts`
- Create: `packages/stores/src/sessionStore.ts`
- Create: `packages/stores/src/__tests__/improvementStore.test.ts`
- Create: `packages/stores/src/__tests__/sessionStore.test.ts`

- [ ] **Step 1: Write improvementStore tests**

```typescript
// packages/stores/src/__tests__/improvementStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useImprovementStore } from '../improvementStore';

beforeEach(() => {
  useImprovementStore.setState(useImprovementStore.getInitialState());
});

describe('improvementStore', () => {
  it('toggles active view', () => {
    useImprovementStore.getState().setActiveView('track');
    expect(useImprovementStore.getState().activeView).toBe('track');
  });

  it('sets highlighted idea', () => {
    useImprovementStore.getState().setHighlightedIdeaId('idea-1');
    expect(useImprovementStore.getState().highlightedIdeaId).toBe('idea-1');
  });
});
```

- [ ] **Step 2: Write sessionStore tests**

```typescript
// packages/stores/src/__tests__/sessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

beforeEach(() => {
  useSessionStore.setState(useSessionStore.getInitialState());
});

describe('sessionStore', () => {
  it('toggles PI sidebar', () => {
    useSessionStore.getState().togglePISidebar();
    expect(useSessionStore.getState().isPISidebarOpen).toBe(true);
  });

  it('shows workspace views', () => {
    useSessionStore.getState().showInvestigation();
    expect(useSessionStore.getState().activeView).toBe('investigation');
  });

  it('handles point click', () => {
    useSessionStore.getState().handlePointClick(42);
    expect(useSessionStore.getState().highlightRowIndex).toBe(42);
    expect(useSessionStore.getState().isPISidebarOpen).toBe(true);
  });

  it('initializes from viewState', () => {
    useSessionStore.getState().initFromViewState({
      activeView: 'improvement',
      isFindingsOpen: true,
    });
    expect(useSessionStore.getState().activeView).toBe('improvement');
  });
});
```

- [ ] **Step 3: Write improvementStore**

```typescript
// packages/stores/src/improvementStore.ts
import { create } from 'zustand';
import type { RiskAxisConfig, BudgetConfig } from '@variscout/core';

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

const initialState: ImprovementState = {
  activeView: 'plan',
  highlightedIdeaId: null,
  riskAxisConfig: { axis1: 'process', axis2: 'safety' },
  budgetConfig: {},
};

export const useImprovementStore = create<ImprovementState & ImprovementActions>()(set => ({
  ...initialState,
  setActiveView: view => set({ activeView: view }),
  setHighlightedIdeaId: id => set({ highlightedIdeaId: id }),
  setRiskAxisConfig: config => set({ riskAxisConfig: config }),
  setBudgetConfig: config => set({ budgetConfig: config }),
}));
```

- [ ] **Step 4: Write sessionStore**

Port the existing `panelsStore` logic into `sessionStore`, consolidating panel state + AI state + highlights.

```typescript
// packages/stores/src/sessionStore.ts
import { create } from 'zustand';

type WorkspaceView = 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
type PITab = 'stats' | 'questions' | 'journal';

interface ViewState {
  activeView?: WorkspaceView;
  isFindingsOpen?: boolean;
  isWhatIfOpen?: boolean;
  isCoScoutOpen?: boolean;
  focusedChart?: string | null;
  findingsViewMode?: string;
}

interface SessionState {
  // Panel layout
  activeView: WorkspaceView;
  isPISidebarOpen: boolean;
  piActiveTab: PITab;
  piOverflowView: 'data' | 'whatif' | null;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;

  // Highlights
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
  highlightedFindingId: string | null;
  expandedQuestionId: string | null;
  pendingChartFocus: string | null;
}

interface SessionActions {
  // Workspace navigation
  showDashboard: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;

  // Panel toggles
  togglePISidebar: () => void;
  setPIActiveTab: (tab: PITab) => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  toggleCoScout: () => void;
  toggleWhatIf: () => void;
  toggleDataTable: () => void;
  toggleFindings: () => void;

  // Highlights
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setHighlightPoint: (index: number | null) => void;
  setHighlightedFindingId: (id: string | null) => void;
  setExpandedQuestionId: (id: string | null) => void;
  setPendingChartFocus: (chart: string | null) => void;

  // Persistence
  initFromViewState: (viewState: ViewState | null | undefined) => void;
  toViewState: () => ViewState;
}

const initialState: SessionState = {
  activeView: 'analysis',
  isPISidebarOpen: false,
  piActiveTab: 'stats',
  piOverflowView: null,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isDataTableOpen: false,
  isFindingsOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
  highlightedFindingId: null,
  expandedQuestionId: null,
  pendingChartFocus: null,
};

export const useSessionStore = create<SessionState & SessionActions>()((set, get) => ({
  ...initialState,

  showDashboard: () => set({ activeView: 'dashboard' }),
  showAnalysis: () => set({ activeView: 'analysis' }),
  showInvestigation: () =>
    set({ activeView: 'investigation', isPISidebarOpen: true, piActiveTab: 'questions' }),
  showImprovement: () => set({ activeView: 'improvement' }),
  showReport: () => set({ activeView: 'report' }),

  togglePISidebar: () => set(s => ({ isPISidebarOpen: !s.isPISidebarOpen })),
  setPIActiveTab: tab => set({ piActiveTab: tab }),
  setPIOverflowView: view => set({ piOverflowView: view }),
  toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),
  toggleWhatIf: () => set(s => ({ isWhatIfOpen: !s.isWhatIfOpen })),
  toggleDataTable: () => set(s => ({ isDataTableOpen: !s.isDataTableOpen })),
  toggleFindings: () => set(s => ({ isFindingsOpen: !s.isFindingsOpen })),

  handlePointClick: index => set({ highlightRowIndex: index, isPISidebarOpen: true }),
  handleRowClick: index => set({ highlightedChartPoint: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),
  setHighlightedFindingId: id => set({ highlightedFindingId: id }),
  setExpandedQuestionId: id => set({ expandedQuestionId: id }),
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),

  initFromViewState: viewState => {
    if (!viewState) return;
    let activeView = viewState.activeView ?? 'analysis';
    if ((activeView as string) === 'editor') activeView = 'analysis';
    set({
      activeView,
      isFindingsOpen: viewState.isFindingsOpen ?? false,
      isWhatIfOpen: viewState.isWhatIfOpen ?? false,
      isCoScoutOpen: viewState.isCoScoutOpen ?? false,
    });
  },

  toViewState: () => {
    const s = get();
    return {
      activeView: s.activeView,
      isFindingsOpen: s.isFindingsOpen,
      isWhatIfOpen: s.isWhatIfOpen,
      isCoScoutOpen: s.isCoScoutOpen,
    };
  },
}));
```

- [ ] **Step 5: Run all tests**

```bash
pnpm --filter @variscout/stores test -- --run
```

Expected: PASS (all tests across 4 files)

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/improvementStore.ts packages/stores/src/sessionStore.ts packages/stores/src/__tests__/
git commit -m "feat(stores): add improvementStore + sessionStore"
```

---

### Task 6: Update barrel export + verify full build

**Files:**

- Modify: `packages/stores/src/index.ts`

- [ ] **Step 1: Update barrel export with all exports**

```typescript
// packages/stores/src/index.ts

// Stores
export { useProjectStore, type SerializedProject } from './projectStore';
export { useInvestigationStore } from './investigationStore';
export { useImprovementStore } from './improvementStore';
export { useSessionStore } from './sessionStore';

// Persistence
export { idbStorage } from './persistence/idbAdapter';
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: All packages build successfully, including @variscout/stores

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: All tests pass (stores + existing tests unchanged)

- [ ] **Step 4: Commit**

```bash
git add packages/stores/src/index.ts
git commit -m "feat(stores): finalize barrel exports and verify build"
```

---

## Notes for Phase 2 (Wire Azure App)

Phase 2 will be a separate plan that:

1. Replaces `useData()` calls with store selectors (39 Azure files)
2. Removes `DataProvider` from App.tsx
3. Removes 3 orchestration hooks
4. Wires `useComputedAnalysis` for stats
5. Wires cloud sync subscriber
6. Updates `useDataIngestion` to write to stores
7. Migrates Editor.tsx (the complexity hotspot)

Phase 2 depends on Phase 1 being complete and tested.
