---
title: F4 implementation plan — three-layer state codification
audience: [engineer]
category: implementation-plan
status: draft
last-reviewed: 2026-05-07
related:
  - docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
---

# F4 — three-layer state codification (Document / Annotation / View) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize Data-Flow Foundation §3 D5 by giving each state layer (Document / Annotation / View) a physical Zustand-store home, a top-of-file `STORE_LAYER` const, and a Vitest boundary test that prevents drift.

**Architecture:** Split `useSessionStore` into `useViewStore` (transient, no persist) + `usePreferencesStore` (per-user durable, persist via idb-keyval). Delete `useImprovementStore` (zero production consumers — riskAxisConfig/budgetConfig → preferences; activeView/highlightedIdeaId → view). Relocate misfiled view fields out of `projectStore` (`selectedPoints`, `selectionIndexMap`) and `investigationStore` (`focusedQuestionId`). Add `STORE_LAYER` constants to all stores + a single layer-boundary Vitest. Pre-position `DocumentSnapshot` type alias for future `.vrs` export. Update `packages/stores/CLAUDE.md` and root `CLAUDE.md`.

**Tech Stack:** Zustand (with `persist` middleware + `idb-keyval` adapter), Vitest, TypeScript, React. Existing repo: `packages/stores/`, `packages/hooks/`, `packages/ui/`, `apps/pwa/`, `apps/azure/`.

**Spec reference:** `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` — locked decisions D1–D8.

**Branch:** `f4-three-layer-state` off `main`. Single PR.

**Pre-flight (run before Task 1):**

```bash
git fetch && git log HEAD..origin/main --oneline | head -20
# If ≥10 commits ahead on origin/main, merge main first per CLAUDE.md workflow.
git checkout -b f4-three-layer-state
```

---

## Pre-condition: locked field-to-store mapping

These tables drive every relocation task below. They are the single source of truth — any task that reclassifies a field is a spec amendment, not a plan adjustment.

**`useViewStore` final fields (transient, NO persist):**

| Field                          | Origin                      | Type                         |
| ------------------------------ | --------------------------- | ---------------------------- |
| `highlightRowIndex`            | sessionStore                | `number \| null`             |
| `highlightedChartPoint`        | sessionStore                | `number \| null`             |
| `highlightedFindingId`         | sessionStore                | `string \| null`             |
| `expandedQuestionId`           | sessionStore                | `string \| null`             |
| `pendingChartFocus`            | sessionStore                | `string \| null`             |
| `piOverflowView`               | sessionStore                | `'data' \| 'whatif' \| null` |
| `isDataTableOpen`              | sessionStore                | `boolean`                    |
| `selectedPoints`               | projectStore (Task 5)       | `Set<number>`                |
| `selectionIndexMap`            | projectStore (Task 5)       | `Map<number, number>`        |
| `focusedQuestionId`            | investigationStore (Task 7) | `string \| null`             |
| `highlightedImprovementIdeaId` | improvementStore (Task 6)   | `string \| null`             |
| `improvementActiveView`        | improvementStore (Task 6)   | `'plan' \| 'track'`          |

**`usePreferencesStore` final fields (per-user durable, persist via idb-keyval, partialize allowlist):**

| Field                    | Origin                    | Type                      | Default                    |
| ------------------------ | ------------------------- | ------------------------- | -------------------------- |
| `activeView`             | sessionStore              | `WorkspaceView`           | `'analysis'`               |
| `piActiveTab`            | sessionStore              | `PITab`                   | `'stats'`                  |
| `isPISidebarOpen`        | sessionStore              | `boolean`                 | `false`                    |
| `isCoScoutOpen`          | sessionStore              | `boolean`                 | `false`                    |
| `isWhatIfOpen`           | sessionStore              | `boolean`                 | `false`                    |
| `isFindingsOpen`         | sessionStore              | `boolean`                 | `false`                    |
| `aiEnabled`              | sessionStore              | `boolean`                 | `true`                     |
| `aiPreferences`          | sessionStore              | `Record<string, boolean>` | `{}`                       |
| `knowledgeSearchFolder`  | sessionStore              | `string \| null`          | `null`                     |
| `skipQuestionLinkPrompt` | sessionStore              | `boolean`                 | `false`                    |
| `timeLens`               | sessionStore              | `TimeLens`                | `DEFAULT_TIME_LENS`        |
| `riskAxisConfig`         | improvementStore (Task 6) | `RiskAxisConfig`          | `DEFAULT_RISK_AXIS_CONFIG` |
| `budgetConfig`           | improvementStore (Task 6) | `BudgetConfig`            | `{}`                       |

**Storage key:** `'variscout-preferences'`. Legacy `'variscout-session'` IDB blob is dropped on first load post-deploy per spec D2.

**Touch-surface counts (verified 2026-05-07):**

- `useSessionStore` consumers: 31 files total from canonical grep; 29 external consumers (14 apps + 15 packages, excluding `sessionStore.ts` + `index.ts`). `apps/azure/src/App.tsx` confirmed absent from consumer list (T1 audit 2026-05-07).
- `useImprovementStore`: 0 production consumers; only `packages/stores/src/improvementStore.ts` + `__tests__/improvementStore.test.ts` + `index.ts` re-export.
- `useProjectStore.selectedPoints` real consumers: 4 production files (`apps/azure/src/components/{Dashboard.tsx, charts/IChart.tsx}`, `apps/pwa/src/components/{Dashboard.tsx, charts/IChart.tsx}`) + `projectStore.test.ts`.
- `useInvestigationStore.focusedQuestionId` real consumers: 0 outside the store itself + its test.

---

## Task 1: P0 — Audit replay (verify touch surface)

**Files:** No writes. Read-only audit.

- [ ] **Step 1: Produce the canonical `useSessionStore` consumer count**

The spec §10 reports 48 (Explore agent audit) and the plan was authored against a grep that found 31. Both are valid under different filters; F4 needs ONE authoritative number to size the P2 batches. Run the canonical command and reconcile:

```bash
git checkout main && git pull
grep -rn "useSessionStore" apps packages --include="*.ts" --include="*.tsx" -l 2>/dev/null | sort > /tmp/f4-session-consumers.txt
wc -l /tmp/f4-session-consumers.txt
cat /tmp/f4-session-consumers.txt
```

The full path list IS the source of truth for Task 4. Whatever count emerges (likely 30-50), record it in the audit doc (Step 5) and update both:

- `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` §10 verification line.
- `docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-three-layer-state.md` Task 4 file list.

If any consumer file is NOT already in Task 4's file list, add it before continuing. P2 batch boundaries (1-10 / 11-20 / 21-N) re-balance to keep batches roughly equal.

- [ ] **Step 2: Confirm improvementStore is unused outside the package**

```bash
grep -rn "useImprovementStore" apps packages --include="*.ts" --include="*.tsx" 2>/dev/null | grep -vE "packages/stores/src/" | head
```

Expected: empty output. If anything appears, P6 (improvementStore deletion) needs to grow consumer-update sub-steps.

- [ ] **Step 3: Confirm focusedQuestionId is unused outside the store**

```bash
grep -rn "useInvestigationStore.*focusedQuestionId\|investigationStore\\.focusedQuestionId" apps packages --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: empty (or only `packages/stores/src/__tests__/investigationStore.test.ts` matches).

- [ ] **Step 4: Confirm selectedPoints production consumers are exactly 4 files**

```bash
grep -rn "useProjectStore.*selectedPoints\|useProjectStore.*selectionIndexMap" apps packages --include="*.ts" --include="*.tsx" -l 2>/dev/null | sort -u
```

Expected list (sort order): two `apps/azure/src/components/`, two `apps/pwa/src/components/`, plus `packages/stores/src/__tests__/projectStore.test.ts`.

- [ ] **Step 5: Branch + commit audit notes**

```bash
git checkout -b f4-three-layer-state
mkdir -p docs/superpowers/plans
# Write audit results to a sibling note file:
cat > docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-audit.md <<'EOF'
---
title: F4 audit — touch surface verified pre-implementation
audience: [engineer]
category: implementation-plan
status: draft
last-reviewed: 2026-05-07
---

# F4 audit replay — 2026-05-07

- sessionStore consumer count: <fill from Step 1>
- improvementStore production consumers outside stores package: <Step 2>
- investigationStore.focusedQuestionId external consumers: <Step 3>
- projectStore.selectedPoints production consumers: <Step 4>

Plan touch-surface assumptions confirmed.
EOF
# Edit with actual numbers, then:
git add docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-audit.md
git commit -m "docs(F4): audit replay — touch surface confirmed"
```

---

## Task 2: P1 — Create `useViewStore` (no consumer changes yet)

**Files:**

- Create: `packages/stores/src/viewStore.ts`
- Create: `packages/stores/src/__tests__/viewStore.test.ts`
- Modify: `packages/stores/src/index.ts` (add re-export)

- [ ] **Step 1: Write failing test**

Create `packages/stores/src/__tests__/viewStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useViewStore, getViewInitialState } from '../viewStore';

beforeEach(() => {
  useViewStore.setState(getViewInitialState());
});

describe('useViewStore', () => {
  it('declares STORE_LAYER as view', async () => {
    const mod = await import('../viewStore');
    expect(mod.STORE_LAYER).toBe('view');
  });

  it('initialises all fields to null/empty', () => {
    const s = useViewStore.getState();
    expect(s.highlightRowIndex).toBeNull();
    expect(s.highlightedChartPoint).toBeNull();
    expect(s.highlightedFindingId).toBeNull();
    expect(s.expandedQuestionId).toBeNull();
    expect(s.pendingChartFocus).toBeNull();
    expect(s.piOverflowView).toBeNull();
    expect(s.isDataTableOpen).toBe(false);
    expect(s.focusedQuestionId).toBeNull();
    expect(s.highlightedImprovementIdeaId).toBeNull();
    expect(s.improvementActiveView).toBe('plan');
    expect(s.selectedPoints.size).toBe(0);
    expect(s.selectionIndexMap.size).toBe(0);
  });

  it('setHighlightPoint updates highlightedChartPoint', () => {
    useViewStore.getState().setHighlightPoint(5);
    expect(useViewStore.getState().highlightedChartPoint).toBe(5);
  });

  it('clearTransientSelections empties selectedPoints and selectionIndexMap', () => {
    useViewStore.setState({
      selectedPoints: new Set([1, 2, 3]),
      selectionIndexMap: new Map([[1, 0]]),
    });
    useViewStore.getState().clearTransientSelections();
    expect(useViewStore.getState().selectedPoints.size).toBe(0);
    expect(useViewStore.getState().selectionIndexMap.size).toBe(0);
  });

  it('toggleDataTable flips isDataTableOpen', () => {
    expect(useViewStore.getState().isDataTableOpen).toBe(false);
    useViewStore.getState().toggleDataTable();
    expect(useViewStore.getState().isDataTableOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — verify it fails (module not found)**

```bash
pnpm --filter @variscout/stores test src/__tests__/viewStore.test.ts
```

Expected: FAIL — `Cannot find module '../viewStore'`.

- [ ] **Step 3: Implement `viewStore.ts`**

Create `packages/stores/src/viewStore.ts`:

```ts
/**
 * useViewStore — transient view state.
 *
 * Layer: View — state that does NOT survive browser reload. NO persist middleware.
 * See docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
 */
import { create } from 'zustand';

export const STORE_LAYER = 'view' as const;

export interface ViewState {
  /** Row index highlighted in the data table (synced from chart point click). */
  highlightRowIndex: number | null;
  /** Chart point index highlighted (synced from data table row click). */
  highlightedChartPoint: number | null;
  /** Finding ID highlighted for bidirectional navigation. */
  highlightedFindingId: string | null;
  /** Question ID expanded in the PI panel questions tab. */
  expandedQuestionId: string | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  /** Secondary overflow view within the PI panel. */
  piOverflowView: 'data' | 'whatif' | null;
  /** Modal open/close — closes on reload by intent. */
  isDataTableOpen: boolean;

  /** Question id focused in investigation Wall (relocated from investigationStore). */
  focusedQuestionId: string | null;

  /** Idea highlighted in the prioritization matrix (relocated from improvementStore). */
  highlightedImprovementIdeaId: string | null;
  /** 'plan' | 'track' tab toggle in the IMPROVE workspace (relocated from improvementStore). */
  improvementActiveView: 'plan' | 'track';

  /** Multi-point selection — Minitab brushing (relocated from projectStore). */
  selectedPoints: Set<number>;
  /** Mapping from data row index → display point index (relocated from projectStore). */
  selectionIndexMap: Map<number, number>;
}

export interface ViewActions {
  // Highlights
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setHighlightPoint: (index: number | null) => void;
  setHighlightedFindingId: (id: string | null) => void;
  setExpandedQuestionId: (id: string | null) => void;
  setPendingChartFocus: (chart: string | null) => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  toggleDataTable: () => void;

  // Investigation
  setFocusedQuestionId: (id: string | null) => void;

  // Improvement
  setHighlightedImprovementIdeaId: (id: string | null) => void;
  setImprovementActiveView: (view: 'plan' | 'track') => void;

  // Selection (brushing)
  setSelectedPoints: (points: Set<number>) => void;
  setSelectionIndexMap: (map: Map<number, number>) => void;
  /** Clear brushing selection. Called by projectStore on loadProject / newProject. */
  clearTransientSelections: () => void;
}

export type ViewStore = ViewState & ViewActions;

export const getViewInitialState = (): ViewState => ({
  highlightRowIndex: null,
  highlightedChartPoint: null,
  highlightedFindingId: null,
  expandedQuestionId: null,
  pendingChartFocus: null,
  piOverflowView: null,
  isDataTableOpen: false,
  focusedQuestionId: null,
  highlightedImprovementIdeaId: null,
  improvementActiveView: 'plan',
  selectedPoints: new Set(),
  selectionIndexMap: new Map(),
});

export const useViewStore = create<ViewStore>(set => ({
  ...getViewInitialState(),

  handlePointClick: index => set({ highlightRowIndex: index }),
  handleRowClick: index => set({ highlightedChartPoint: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),
  setHighlightedFindingId: id => set({ highlightedFindingId: id }),
  setExpandedQuestionId: id => set({ expandedQuestionId: id }),
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),
  setPIOverflowView: view => set({ piOverflowView: view }),
  toggleDataTable: () => set(s => ({ isDataTableOpen: !s.isDataTableOpen })),

  setFocusedQuestionId: id => set({ focusedQuestionId: id }),

  setHighlightedImprovementIdeaId: id => set({ highlightedImprovementIdeaId: id }),
  setImprovementActiveView: view => set({ improvementActiveView: view }),

  setSelectedPoints: points => set({ selectedPoints: points }),
  setSelectionIndexMap: map => set({ selectionIndexMap: map }),
  clearTransientSelections: () => set({ selectedPoints: new Set(), selectionIndexMap: new Map() }),
}));
```

Note: `handlePointClick` here ONLY sets `highlightRowIndex`; the `isPISidebarOpen: true` side-effect from the legacy sessionStore version moves to `usePreferencesStore` consumers (Task 4) which compose `useViewStore.handlePointClick()` + `usePreferencesStore.setPISidebarOpen(true)` at the call site. Cross-store side-effects are NOT auto-wired; consumers compose explicitly.

- [ ] **Step 4: Re-export from index**

Modify `packages/stores/src/index.ts` — add after the existing exports:

```ts
export {
  useViewStore,
  getViewInitialState,
  STORE_LAYER as VIEW_STORE_LAYER,
  type ViewState,
  type ViewActions,
  type ViewStore,
} from './viewStore';
```

- [ ] **Step 5: Run test — expect pass**

```bash
pnpm --filter @variscout/stores test src/__tests__/viewStore.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 6: Run full stores test suite — expect existing tests still pass**

```bash
pnpm --filter @variscout/stores test
```

Expected: all existing tests still green; no regressions.

- [ ] **Step 7: Commit**

```bash
git add packages/stores/src/viewStore.ts packages/stores/src/__tests__/viewStore.test.ts packages/stores/src/index.ts
git commit -m "feat(F4): add useViewStore — layer=view, transient state only"
```

---

## Task 3: P1 — Create `usePreferencesStore` (no consumer changes yet)

**Files:**

- Create: `packages/stores/src/preferencesStore.ts`
- Create: `packages/stores/src/__tests__/preferencesStore.test.ts`
- Modify: `packages/stores/src/index.ts` (add re-export)

- [ ] **Step 1: Write failing test**

Create `packages/stores/src/__tests__/preferencesStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore, getPreferencesInitialState } from '../preferencesStore';
import { DEFAULT_TIME_LENS, DEFAULT_RISK_AXIS_CONFIG } from '@variscout/core';

beforeEach(() => {
  usePreferencesStore.setState(getPreferencesInitialState());
});

describe('usePreferencesStore', () => {
  it('declares STORE_LAYER as annotation-per-user', async () => {
    const mod = await import('../preferencesStore');
    expect(mod.STORE_LAYER).toBe('annotation-per-user');
  });

  it('initialises all fields to documented defaults', () => {
    const s = usePreferencesStore.getState();
    expect(s.activeView).toBe('analysis');
    expect(s.piActiveTab).toBe('stats');
    expect(s.isPISidebarOpen).toBe(false);
    expect(s.isCoScoutOpen).toBe(false);
    expect(s.isWhatIfOpen).toBe(false);
    expect(s.isFindingsOpen).toBe(false);
    expect(s.aiEnabled).toBe(true);
    expect(s.aiPreferences).toEqual({});
    expect(s.knowledgeSearchFolder).toBeNull();
    expect(s.skipQuestionLinkPrompt).toBe(false);
    expect(s.timeLens).toEqual(DEFAULT_TIME_LENS);
    expect(s.riskAxisConfig).toEqual(DEFAULT_RISK_AXIS_CONFIG);
    expect(s.budgetConfig).toEqual({});
  });

  it('togglePISidebar flips isPISidebarOpen', () => {
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(true);
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(false);
  });

  it('showInvestigation sets workspace to investigation and opens PI sidebar', () => {
    usePreferencesStore.getState().showInvestigation();
    const s = usePreferencesStore.getState();
    expect(s.activeView).toBe('investigation');
    expect(s.isPISidebarOpen).toBe(true);
    expect(s.piActiveTab).toBe('questions');
  });

  it('setRiskAxisConfig updates riskAxisConfig', () => {
    usePreferencesStore.getState().setRiskAxisConfig({ x: 'cost', y: 'effort' });
    expect(usePreferencesStore.getState().riskAxisConfig).toEqual({ x: 'cost', y: 'effort' });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm --filter @variscout/stores test src/__tests__/preferencesStore.test.ts
```

Expected: FAIL — `Cannot find module '../preferencesStore'`.

- [ ] **Step 3: Implement `preferencesStore.ts`**

Create `packages/stores/src/preferencesStore.ts`:

```ts
/**
 * usePreferencesStore — durable per-user preferences.
 *
 * Layer: Annotation (per-user axis). Persists to IndexedDB via idb-keyval under
 * the 'variscout-preferences' key. Replaces the legacy useSessionStore which
 * mixed transient view state with per-user preferences.
 *
 * See docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_TIME_LENS,
  DEFAULT_RISK_AXIS_CONFIG,
  type TimeLens,
  type RiskAxisConfig,
  type BudgetConfig,
} from '@variscout/core';
import { idbStorage } from './persistence/idbAdapter';

export const STORE_LAYER = 'annotation-per-user' as const;

export type WorkspaceView =
  | 'dashboard'
  | 'frame'
  | 'analysis'
  | 'investigation'
  | 'improvement'
  | 'report';
export type PITab = 'stats' | 'questions' | 'journal';

export interface PreferencesState {
  // Workspace
  activeView: WorkspaceView;
  piActiveTab: PITab;
  isPISidebarOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  /**
   * @deprecated Findings are moving to the Investigation workspace.
   * Kept for backward compat; always false in investigation view.
   */
  isFindingsOpen: boolean;

  // AI
  aiEnabled: boolean;
  aiPreferences: Record<string, boolean>;
  knowledgeSearchFolder: string | null;
  skipQuestionLinkPrompt: boolean;

  // Analysis lens
  timeLens: TimeLens;

  // Improvement (relocated from improvementStore — see Task 6)
  riskAxisConfig: RiskAxisConfig;
  budgetConfig: BudgetConfig;
}

export interface PreferencesActions {
  // Workspace navigation (parity with legacy sessionStore actions)
  showDashboard: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;

  // Panel toggles
  togglePISidebar: () => void;
  setPIActiveTab: (tab: PITab) => void;
  toggleCoScout: () => void;
  toggleWhatIf: () => void;
  toggleFindings: () => void;

  // AI
  setAIEnabled: (enabled: boolean) => void;
  setAIPreferences: (prefs: Record<string, boolean>) => void;
  setKnowledgeSearchFolder: (folder: string | null) => void;
  setSkipQuestionLinkPrompt: (value: boolean) => void;

  // Lens
  setTimeLens: (lens: TimeLens) => void;

  // Improvement
  setRiskAxisConfig: (config: RiskAxisConfig) => void;
  setBudgetConfig: (config: BudgetConfig) => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

export const getPreferencesInitialState = (): PreferencesState => ({
  activeView: 'analysis',
  piActiveTab: 'stats',
  isPISidebarOpen: false,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isFindingsOpen: false,
  aiEnabled: true,
  aiPreferences: {},
  knowledgeSearchFolder: null,
  skipQuestionLinkPrompt: false,
  timeLens: DEFAULT_TIME_LENS,
  riskAxisConfig: DEFAULT_RISK_AXIS_CONFIG,
  budgetConfig: {},
});

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    set => ({
      ...getPreferencesInitialState(),

      // Workspace navigation
      showDashboard: () => set({ activeView: 'dashboard' }),
      showAnalysis: () => set({ activeView: 'analysis' }),
      showInvestigation: () =>
        set({
          activeView: 'investigation',
          isPISidebarOpen: true,
          piActiveTab: 'questions',
        }),
      showImprovement: () =>
        set({
          activeView: 'improvement',
          isWhatIfOpen: false,
        }),
      showReport: () => set({ activeView: 'report' }),

      // Panel toggles
      togglePISidebar: () => set(s => ({ isPISidebarOpen: !s.isPISidebarOpen })),
      setPIActiveTab: tab => set({ piActiveTab: tab }),
      toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),
      toggleWhatIf: () => set(s => ({ isWhatIfOpen: !s.isWhatIfOpen })),
      toggleFindings: () =>
        set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: !s.isFindingsOpen })),

      // AI
      setAIEnabled: enabled => set({ aiEnabled: enabled }),
      setAIPreferences: prefs => set({ aiPreferences: prefs }),
      setKnowledgeSearchFolder: folder => set({ knowledgeSearchFolder: folder }),
      setSkipQuestionLinkPrompt: value => set({ skipQuestionLinkPrompt: value }),

      // Lens
      setTimeLens: lens => set({ timeLens: lens }),

      // Improvement
      setRiskAxisConfig: config => set({ riskAxisConfig: config }),
      setBudgetConfig: config => set({ budgetConfig: config }),
    }),
    {
      name: 'variscout-preferences',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: state => ({
        // Explicit allowlist — every persisted field listed.
        activeView: state.activeView,
        piActiveTab: state.piActiveTab,
        isPISidebarOpen: state.isPISidebarOpen,
        isCoScoutOpen: state.isCoScoutOpen,
        isWhatIfOpen: state.isWhatIfOpen,
        isFindingsOpen: state.isFindingsOpen,
        aiEnabled: state.aiEnabled,
        aiPreferences: state.aiPreferences,
        knowledgeSearchFolder: state.knowledgeSearchFolder,
        skipQuestionLinkPrompt: state.skipQuestionLinkPrompt,
        timeLens: state.timeLens,
        riskAxisConfig: state.riskAxisConfig,
        budgetConfig: state.budgetConfig,
      }),
    }
  )
);
```

Note: `setPIActiveTab` here does NOT clear `piOverflowView` (which legacy sessionStore did). The reason: `piOverflowView` lives in `useViewStore` after F4. Consumers calling `setPIActiveTab` who also need the overflow cleared call `useViewStore.getState().setPIOverflowView(null)` explicitly. The two cross-store invocations belong at consumer sites; this is the explicit-side-effect pattern from spec D2.

- [ ] **Step 4: Add re-export to `index.ts`**

```ts
export {
  usePreferencesStore,
  getPreferencesInitialState,
  STORE_LAYER as PREFERENCES_STORE_LAYER,
  type PreferencesState,
  type PreferencesActions,
  type PreferencesStore,
  type WorkspaceView,
  type PITab,
} from './preferencesStore';
```

- [ ] **Step 5: Run test — expect pass**

```bash
pnpm --filter @variscout/stores test src/__tests__/preferencesStore.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 6: Run full stores test suite**

```bash
pnpm --filter @variscout/stores test
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add packages/stores/src/preferencesStore.ts packages/stores/src/__tests__/preferencesStore.test.ts packages/stores/src/index.ts
git commit -m "feat(F4): add usePreferencesStore — layer=annotation-per-user, persisted"
```

---

## Task 4: P2 — Migrate `useSessionStore` consumers

**Goal:** Every consumer of `useSessionStore` rewires to either `useViewStore` or `usePreferencesStore`. After this task, `useSessionStore` is unused (deletion happens in Task 9).

**Strategy:** Single mechanical sweep. Most call-sites read one or two fields and follow a deterministic mapping (table below). Complex sites (panel toggles, the `handlePointClick`-like compounds) get inline notes.

> **Pre-requisite:** Step 0 (below) adds `setPISidebarOpen` to `usePreferencesStore` — one of the cheat-sheet rows depends on it. Run Step 0 first.

**Field → store mapping cheat-sheet:**

| sessionStore field                                                                                            | New store                                                                                                        | Notes                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeView`, `showDashboard()`, `showAnalysis()`, `showInvestigation()`, `showImprovement()`, `showReport()` | `usePreferencesStore`                                                                                            | direct rename                                                                                                                                                                                                                                 |
| `piActiveTab`, `setPIActiveTab`                                                                               | `usePreferencesStore`                                                                                            | NOTE: legacy version cleared `piOverflowView`; new version doesn't. Sites that need both clear must call `useViewStore.getState().setPIOverflowView(null)` after `setPIActiveTab`.                                                            |
| `isPISidebarOpen`, `togglePISidebar`                                                                          | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `isCoScoutOpen`, `toggleCoScout`                                                                              | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `isWhatIfOpen`, `toggleWhatIf`                                                                                | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `isFindingsOpen`, `toggleFindings`                                                                            | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `aiEnabled`, `setAIEnabled`                                                                                   | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `aiPreferences`, `setAIPreferences`                                                                           | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `knowledgeSearchFolder`, `setKnowledgeSearchFolder`                                                           | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `skipQuestionLinkPrompt`, `setSkipQuestionLinkPrompt`                                                         | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `timeLens`, `setTimeLens`                                                                                     | `usePreferencesStore`                                                                                            | direct                                                                                                                                                                                                                                        |
| `highlightRowIndex`                                                                                           | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `highlightedChartPoint`, `setHighlightPoint`                                                                  | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `highlightedFindingId`, `setHighlightedFindingId`                                                             | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `expandedQuestionId`, `setExpandedQuestionId`                                                                 | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `pendingChartFocus`, `setPendingChartFocus`                                                                   | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `piOverflowView`, `setPIOverflowView`                                                                         | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `isDataTableOpen`, `toggleDataTable`                                                                          | `useViewStore`                                                                                                   | direct                                                                                                                                                                                                                                        |
| `handlePointClick(idx)`                                                                                       | composed: `useViewStore.getState().handlePointClick(idx); usePreferencesStore.getState().setPISidebarOpen(true)` | wait — `usePreferencesStore` exposes `togglePISidebar`, not `setPISidebarOpen`. **Add `setPISidebarOpen(open: boolean)` action in Task 3.** See **Step 0** below before Step 1.                                                               |
| `handleRowClick(idx)`                                                                                         | `useViewStore.getState().handleRowClick(idx)`                                                                    | direct                                                                                                                                                                                                                                        |
| `initFromViewState`, `toViewState`                                                                            | DELETED — no replacement                                                                                         | These were used only by Editor's project-load path to restore tab + isFindingsOpen + isWhatIfOpen. After F4, those fields persist via `usePreferencesStore`'s `persist` middleware automatically — no consumer code needed. Delete the calls. |

**Files to modify (29 external consumers):**

Apps (14 — `apps/azure/src/App.tsx` confirmed absent in T1 audit):

- `apps/azure/src/App.tsx` (if present — verify in Step 1)
- `apps/azure/src/components/ProjectDashboard.tsx`
- `apps/azure/src/components/__tests__/ProjectDashboard.test.tsx`
- `apps/azure/src/components/editor/CoScoutSection.tsx`
- `apps/azure/src/components/editor/EditorDashboardView.tsx`
- `apps/azure/src/components/editor/InvestigationWorkspace.tsx`
- `apps/azure/src/components/settings/SettingsPanel.tsx`
- `apps/azure/src/components/settings/__tests__/SettingsPanel.test.tsx`
- `apps/azure/src/features/ai/useActionProposals.ts`
- `apps/azure/src/features/findings/useFindingsOrchestration.ts`
- `apps/azure/src/pages/Editor.tsx`
- `apps/azure/src/pages/__tests__/Editor.test.tsx`
- `apps/pwa/src/App.tsx`
- `apps/pwa/src/components/__tests__/Dashboard.lensedSampleCount.test.tsx`
- `apps/pwa/src/features/findings/__tests__/findingRestore.test.ts`

Packages (16):

- `packages/hooks/src/__tests__/findingSourceLensCapture.test.ts`
- `packages/hooks/src/__tests__/setup.ts`
- `packages/hooks/src/__tests__/timeLensWiring.test.ts`
- `packages/hooks/src/__tests__/useLensedSampleCount.test.ts`
- `packages/hooks/src/findingCreation.ts`
- `packages/hooks/src/useAnalysisStats.ts`
- `packages/hooks/src/useBoxplotData.ts`
- `packages/hooks/src/useCoScoutProps.ts`
- `packages/hooks/src/useIChartData.ts`
- `packages/hooks/src/useLensedSampleCount.ts`
- `packages/hooks/src/useParetoChartData.ts`
- `packages/hooks/src/useProbabilityPlotData.ts`
- `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`
- `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx`
- `packages/stores/src/__tests__/sessionStore.test.ts` (KEEP for now — deleted in Task 9)

- [ ] **Step 0: Add `setPISidebarOpen` action to `preferencesStore.ts`**

(Required for the `handlePointClick` compound case below.) Edit `packages/stores/src/preferencesStore.ts`:

In `PreferencesActions`:

```ts
  setPISidebarOpen: (open: boolean) => void;
```

In the store body:

```ts
  setPISidebarOpen: open => set({ isPISidebarOpen: open }),
```

Run `pnpm --filter @variscout/stores test` to confirm green; commit:

```bash
git add packages/stores/src/preferencesStore.ts
git commit -m "feat(F4): add usePreferencesStore.setPISidebarOpen for handlePointClick compound"
```

- [ ] **Step 1: Catalogue each consumer's read/write fields**

For each file in the list above, run:

```bash
grep -n "useSessionStore" <file>
```

Note in a scratch file: which fields it reads, which actions it calls, and whether any compound side-effects (showInvestigation auto-opens sidebar, handlePointClick auto-opens sidebar, setPIActiveTab clears overflow) need preservation.

Output: a per-file rewrite plan. Most files are 1-3 line changes.

- [ ] **Step 2: Apply the mechanical rewrites — files 1-10**

For each consumer file, replace per the cheat-sheet:

- `import { useSessionStore } from '@variscout/stores'` → `import { useViewStore, usePreferencesStore } from '@variscout/stores'` (drop one if unused).
- **Type-import note (Task 2 deviation):** the View-layer state type is exported from `@variscout/stores` as `ViewStoreState` (NOT `ViewState`). This is because `ViewState` is already taken by the legacy chart-UI type re-exported from `@variscout/core`. Internal to `viewStore.ts` the interface is named `ViewState` (per plan code), but consumers import the alias: `import { useViewStore, type ViewStoreState } from '@variscout/stores'`. This rarely matters in practice — most consumers use the hook only, not the type — but if a consumer references the type, use the aliased name.
- Each `useSessionStore(s => s.<field>)` → either `useViewStore(s => s.<field>)` or `usePreferencesStore(s => s.<field>)` per the cheat-sheet.
- `useSessionStore.getState().<action>()` → corresponding `getState()` on the new store.
- For `handlePointClick`: replace
  ```ts
  useSessionStore.getState().handlePointClick(idx);
  ```
  with:
  ```ts
  useViewStore.getState().handlePointClick(idx);
  usePreferencesStore.getState().setPISidebarOpen(true);
  ```
- Remove any `initFromViewState` / `toViewState` calls (Editor.tsx, App.tsx). Persistence happens automatically.
- For test files: update `vi.mock('@variscout/stores', ...)` mocks if any reference `useSessionStore` — replace with mocks of `useViewStore` and/or `usePreferencesStore`.

After each file: save, run `pnpm --filter <impacted-package> test --run <test-file>` if a co-located test exists.

- [ ] **Step 3: Apply mechanical rewrites — files 11-20**

Same pattern. After this batch, run:

```bash
pnpm --filter @variscout/hooks test
```

Expected: green.

- [ ] **Step 4: Apply mechanical rewrites — files 21-30**

Same pattern. After this batch, run:

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
```

Expected: all green.

- [ ] **Step 5: Confirm only the legacy sessionStore + its own test + index re-export still reference `useSessionStore`**

```bash
grep -rn "useSessionStore" apps packages --include="*.ts" --include="*.tsx" -l 2>/dev/null
```

Expected output: exactly three paths:

```
packages/stores/src/sessionStore.ts
packages/stores/src/__tests__/sessionStore.test.ts
packages/stores/src/index.ts
```

(Also possibly the new viewStore.ts / preferencesStore.ts if you added migration comments — that's fine.)

If anything else appears, return to Step 2 for the missed file.

- [ ] **Step 6: Type-check the monorepo**

```bash
pnpm build
```

Expected: green. If `tsc --noEmit` fails, the consumer-rewrite missed a type — fix, rerun.

- [ ] **Step 7: Commit**

```bash
git add apps packages
git commit -m "refactor(F4): migrate useSessionStore consumers to view/preferences stores"
```

---

## Task 5: P3 — Relocate `selectedPoints` + `selectionIndexMap` from `projectStore`

**Files:**

- Modify: `packages/stores/src/projectStore.ts`
- Modify: `packages/stores/src/__tests__/projectStore.test.ts`
- Modify: `apps/azure/src/components/Dashboard.tsx`
- Modify: `apps/azure/src/components/__tests__/Dashboard.test.tsx`
- Modify: `apps/azure/src/components/charts/IChart.tsx`
- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/pwa/src/components/charts/IChart.tsx`
- Modify: `packages/hooks/src/useCreateFactorModal.ts` (verify in Step 1 it actually consumes the store)
- Modify: `packages/hooks/src/__tests__/useCreateFactorModal.test.ts`

- [ ] **Step 1: Verify true consumer list**

```bash
grep -rn "useProjectStore.*selectedPoints\|useProjectStore.*selectionIndexMap\|setSelectedPoints\|setSelectionIndexMap" apps packages --include="*.ts" --include="*.tsx" -l 2>/dev/null | grep -v "stores/src/projectStore.ts" | sort -u
```

Confirmed list will be the basis for Step 4 rewrites. Update the file list above if the grep surfaces files I missed.

- [ ] **Step 2: Update `projectStore.test.ts` — move selectedPoints assertions to viewStore.test.ts**

In `packages/stores/src/__tests__/projectStore.test.ts`:

- Remove the `describe('selectedPoints')` (or equivalent) block — lines around 290-320 per audit.
- Keep an assertion that `useProjectStore` no longer has `selectedPoints` in its state shape:

```ts
it('does not own selectedPoints (relocated to useViewStore in F4)', () => {
  const state = useProjectStore.getState() as Record<string, unknown>;
  expect('selectedPoints' in state).toBe(false);
  expect('selectionIndexMap' in state).toBe(false);
});
```

In `packages/stores/src/__tests__/viewStore.test.ts`, add the relocated test cases (these match the projectStore originals modulo store name):

```ts
describe('useViewStore.selectedPoints (relocated from projectStore in F4)', () => {
  it('setSelectedPoints stores the set', () => {
    useViewStore.getState().setSelectedPoints(new Set([1, 2, 3]));
    expect(useViewStore.getState().selectedPoints).toEqual(new Set([1, 2, 3]));
  });

  it('clearTransientSelections empties the set and map', () => {
    useViewStore.setState({
      selectedPoints: new Set([1, 2, 3]),
      selectionIndexMap: new Map([
        [1, 0],
        [2, 1],
      ]),
    });
    useViewStore.getState().clearTransientSelections();
    expect(useViewStore.getState().selectedPoints.size).toBe(0);
    expect(useViewStore.getState().selectionIndexMap.size).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests — verify projectStore tests fail (selectedPoints still in state)**

```bash
pnpm --filter @variscout/stores test src/__tests__/projectStore.test.ts
```

Expected: FAIL — the new "does not own selectedPoints" test fails because state still has these fields.

- [ ] **Step 4: Remove `selectedPoints` + `selectionIndexMap` from `projectStore`**

In `packages/stores/src/projectStore.ts`:

Delete from `ProjectState`:

```ts
// Multi-point selection (ephemeral, not persisted — Minitab-style brushing)
selectedPoints: Set<number>;
selectionIndexMap: Map<number, number>;
```

Delete from `ProjectActions`:

```ts
  setSelectedPoints: (points: Set<number>) => void;
  setSelectionIndexMap: (map: Map<number, number>) => void;
```

(Or whichever names exist — confirm via grep.)

Delete from initial-state factory and `loadProject`:

```ts
  selectedPoints: new Set(),
  selectionIndexMap: new Map(),
```

Delete the action handlers (`setSelectedPoints`, etc.) at lines around 452-476.

In `loadProject` and `newProject`, ADD the cross-store call:

```ts
import { useViewStore } from './viewStore';
// ...
loadProject: serialized => {
  set({ /* existing project state */ });
  useViewStore.getState().clearTransientSelections();
},
newProject: () => {
  set({ /* existing reset */ });
  useViewStore.getState().clearTransientSelections();
},
```

Note the import is INSIDE `packages/stores/src/`, peer-to-peer between domain stores. This is allowed per `packages/stores/CLAUDE.md` "Cross-store reads" rule.

- [ ] **Step 5: Update consumer files — replace `useProjectStore` selector with `useViewStore`**

For each file in the verified list:

```diff
- const selectedPoints = useProjectStore(s => s.selectedPoints);
+ const selectedPoints = useViewStore(s => s.selectedPoints);
```

Same for `selectionIndexMap` and the setters.

Imports:

```diff
- import { useProjectStore } from '@variscout/stores';
+ import { useProjectStore, useViewStore } from '@variscout/stores';
```

(Drop `useProjectStore` if unused after the rewrite.)

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @variscout/stores test
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/hooks test
```

Expected: all green.

- [ ] **Step 7: Run full build**

```bash
pnpm build
```

Expected: green.

- [ ] **Step 8: Commit**

```bash
git add packages/stores apps/azure apps/pwa packages/hooks
git commit -m "refactor(F4): relocate selectedPoints + selectionIndexMap from projectStore to viewStore"
```

---

## Task 6: P4 — Split + delete `useImprovementStore`

**Files:**

- Delete: `packages/stores/src/improvementStore.ts`
- Delete: `packages/stores/src/__tests__/improvementStore.test.ts`
- Modify: `packages/stores/src/index.ts` (remove re-export)
- Modify: `packages/stores/src/__tests__/preferencesStore.test.ts` (already covered — Task 3 Step 1 included `riskAxisConfig` test)
- Modify: `packages/stores/src/__tests__/viewStore.test.ts` (already covered — Task 2 Step 1 included `improvementActiveView` and `highlightedImprovementIdeaId` defaults)

(Production-consumer count: zero per Task 1 audit. If the audit surfaced any, add them as additional file modifications here.)

**Rename note for any surfaced consumers:** the relocated improvement fields are renamed in their new homes — `improvementStore.activeView` → `useViewStore.improvementActiveView` (collision-avoidance with `usePreferencesStore.activeView` workspace tab), and `improvementStore.highlightedIdeaId` → `useViewStore.highlightedImprovementIdeaId` (namespace clarity). Any consumer rewrite touches BOTH the selector source AND the field name in the same line:

```diff
- const v = useImprovementStore(s => s.activeView);
+ const v = useViewStore(s => s.improvementActiveView);
- const id = useImprovementStore(s => s.highlightedIdeaId);
+ const id = useViewStore(s => s.highlightedImprovementIdeaId);
```

Same for setters (`setActiveView` → `setImprovementActiveView`, `setHighlightedIdeaId` → `setHighlightedImprovementIdeaId`).

- [ ] **Step 1: Confirm zero production consumers**

```bash
grep -rn "useImprovementStore\|getImprovementInitialState" apps packages --include="*.ts" --include="*.tsx" 2>/dev/null | grep -vE "packages/stores/src/(improvementStore\.ts|__tests__/improvementStore\.test\.ts|index\.ts)"
```

Expected: empty output. If anything appears, add per-file rewrites before Step 2.

- [ ] **Step 2: Delete `improvementStore.ts` and its test**

```bash
git rm packages/stores/src/improvementStore.ts packages/stores/src/__tests__/improvementStore.test.ts
```

- [ ] **Step 3: Remove `useImprovementStore` re-export from `index.ts`**

In `packages/stores/src/index.ts`, delete:

```ts
export { useImprovementStore, getImprovementInitialState } from './improvementStore';
```

(Or whichever exact line — confirm by grep.)

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/stores test
```

Expected: green. Test count drops by however many `improvementStore.test.ts` had (the riskAxisConfig + highlightedIdeaId + activeView assertions are now covered by `preferencesStore.test.ts` and `viewStore.test.ts`).

- [ ] **Step 5: Run full build**

```bash
pnpm build
```

Expected: green. Any consumer that quietly imported `useImprovementStore` will surface as a TypeScript error here.

- [ ] **Step 6: Commit**

```bash
git add packages/stores
git commit -m "refactor(F4): delete useImprovementStore — riskAxis/budget moved to preferences, activeView/highlightedIdea moved to view"
```

---

## Task 7: P5 — Relocate `focusedQuestionId` from `investigationStore`

**Files:**

- Modify: `packages/stores/src/investigationStore.ts`
- Modify: `packages/stores/src/__tests__/investigationStore.test.ts`

(Per Task 1 audit: zero production consumers. If audit surfaced any, add file rewrites here.)

- [ ] **Step 1: Confirm zero external consumers**

```bash
grep -rn "useInvestigationStore.*focusedQuestionId\|investigationStore\.focusedQuestionId\|setFocusedQuestionId\|setFocusedQuestion" apps packages --include="*.ts" --include="*.tsx" 2>/dev/null | grep -vE "packages/stores/src/(investigationStore\.ts|__tests__/investigationStore\.test\.ts|viewStore\.ts|__tests__/viewStore\.test\.ts)"
```

Expected: empty.

- [ ] **Step 2: Update investigationStore test — move focusedQuestionId assertions to viewStore.test.ts**

In `packages/stores/src/__tests__/investigationStore.test.ts`, find the `focusedQuestionId` test (around line 481):

```ts
it('focusedQuestionId starts as null and updates via setFocusedQuestionId', () => {
  // ... existing assertions ...
});
```

Move it OUT to `packages/stores/src/__tests__/viewStore.test.ts`, renaming references to `useViewStore`:

```ts
describe('useViewStore.focusedQuestionId (relocated from investigationStore in F4)', () => {
  it('starts as null', () => {
    expect(useViewStore.getState().focusedQuestionId).toBeNull();
  });

  it('setFocusedQuestionId updates focused id', () => {
    useViewStore.getState().setFocusedQuestionId('q-1');
    expect(useViewStore.getState().focusedQuestionId).toBe('q-1');
    useViewStore.getState().setFocusedQuestionId(null);
    expect(useViewStore.getState().focusedQuestionId).toBeNull();
  });
});
```

Add a new investigationStore.test.ts assertion confirming the relocation:

```ts
it('does not own focusedQuestionId (relocated to useViewStore in F4)', () => {
  const state = useInvestigationStore.getState() as Record<string, unknown>;
  expect('focusedQuestionId' in state).toBe(false);
});
```

- [ ] **Step 3: Run test — verify investigationStore tests fail**

```bash
pnpm --filter @variscout/stores test src/__tests__/investigationStore.test.ts
```

Expected: FAIL on the new relocation-confirmation test.

- [ ] **Step 4: Remove `focusedQuestionId` from `investigationStore.ts`**

In `packages/stores/src/investigationStore.ts`:

Delete from `InvestigationState` (around line 82):

```ts
focusedQuestionId: string | null;
```

Delete from initial-state factory (around line 314).

Delete the `setFocusedQuestionId` action and its handler (around line 844).

If `InvestigationActions` defines `setFocusedQuestionId`, delete that too.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @variscout/stores test
```

Expected: green.

- [ ] **Step 6: Run full build**

```bash
pnpm build
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add packages/stores
git commit -m "refactor(F4): relocate focusedQuestionId from investigationStore to viewStore"
```

---

## Task 8: P6 — Add `STORE_LAYER` constants to remaining stores + boundary test

**Files:**

- Modify: `packages/stores/src/projectStore.ts` (add `STORE_LAYER`)
- Modify: `packages/stores/src/investigationStore.ts` (add `STORE_LAYER`)
- Modify: `packages/stores/src/canvasStore.ts` (add `STORE_LAYER`)
- Modify: `packages/stores/src/wallLayoutStore.ts` (add `STORE_LAYER`)
- Modify: `packages/stores/src/index.ts` (re-export per-store layer consts)
- Create: `packages/stores/src/__tests__/layerBoundary.test.ts`

- [ ] **Step 1: Add `STORE_LAYER` exports to existing stores**

`projectStore.ts` (top of file, near other exports):

```ts
export const STORE_LAYER = 'document' as const;
```

`investigationStore.ts`:

```ts
export const STORE_LAYER = 'document' as const;
```

`canvasStore.ts`:

```ts
export const STORE_LAYER = 'document' as const;
```

`wallLayoutStore.ts`:

```ts
export const STORE_LAYER = 'annotation-per-project' as const;
```

(`viewStore.ts` and `preferencesStore.ts` already have `STORE_LAYER` from Tasks 2 + 3.)

- [ ] **Step 2: Re-export per-store layer aliases from `index.ts`**

In `packages/stores/src/index.ts`, near each store re-export, add a layer alias:

```ts
export { STORE_LAYER as PROJECT_STORE_LAYER } from './projectStore';
export { STORE_LAYER as INVESTIGATION_STORE_LAYER } from './investigationStore';
export { STORE_LAYER as CANVAS_STORE_LAYER } from './canvasStore';
export { STORE_LAYER as WALL_LAYOUT_STORE_LAYER } from './wallLayoutStore';
```

(`VIEW_STORE_LAYER` and `PREFERENCES_STORE_LAYER` were added in Tasks 2 + 3.)

- [ ] **Step 3: Author the boundary test**

Create `packages/stores/src/__tests__/layerBoundary.test.ts`:

```ts
/**
 * Layer-boundary test for `packages/stores/src/`.
 *
 * Scope (locked per F4 spec D7): this test ONLY covers store files in
 * `packages/stores/src/`. Per-app feature stores under `apps/azure/src/features/`
 * and `apps/pwa/src/features/` are explicitly out of F4 scope and NOT enforced
 * here — those stores are allowed to mix layers per current architecture.
 *
 * STORE_LAYER enum has 6 values; today 4 are realised in code:
 *   - 'document' (projectStore, investigationStore, canvasStore)
 *   - 'annotation-per-project' (wallLayoutStore)
 *   - 'annotation-per-user' (preferencesStore)
 *   - 'view' (viewStore)
 * Reserved for future use (no test coverage today, intentional):
 *   - 'annotation-per-hub'
 *   - 'annotation-per-investigation'
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..');

const ALLOWED_LAYERS = [
  'document',
  'annotation-per-user',
  'annotation-per-project',
  'annotation-per-hub',
  'annotation-per-investigation',
  'view',
] as const;

interface StoreFile {
  filename: string;
  layer: (typeof ALLOWED_LAYERS)[number];
  source: string;
}

function loadStoreFiles(): StoreFile[] {
  const filenames = [
    'projectStore.ts',
    'investigationStore.ts',
    'canvasStore.ts',
    'wallLayoutStore.ts',
    'preferencesStore.ts',
    'viewStore.ts',
  ];
  return filenames.map(filename => {
    const path = resolve(SRC, filename);
    const source = readFileSync(path, 'utf-8');
    const match = source.match(/export\s+const\s+STORE_LAYER\s*=\s*'([^']+)'\s*as\s+const/);
    if (!match) throw new Error(`${filename}: missing STORE_LAYER export`);
    const layer = match[1] as (typeof ALLOWED_LAYERS)[number];
    if (!ALLOWED_LAYERS.includes(layer)) {
      throw new Error(`${filename}: STORE_LAYER='${layer}' not in allowed set`);
    }
    return { filename, layer, source };
  });
}

describe('layer boundary', () => {
  const files = loadStoreFiles();

  it('every store file declares STORE_LAYER from the allowed enum', () => {
    expect(files.length).toBeGreaterThan(0);
    files.forEach(f => {
      expect(ALLOWED_LAYERS).toContain(f.layer);
    });
  });

  it('view stores do NOT import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'view')
      .forEach(f => {
        expect(f.source).not.toMatch(/from\s+['"]zustand\/middleware['"]/);
      });
  });

  it('annotation-per-user stores DO import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'annotation-per-user')
      .forEach(f => {
        expect(f.source).toMatch(
          /import\s+\{[^}]*\bpersist\b[^}]*\}\s+from\s+['"]zustand\/middleware['"]/
        );
      });
  });

  it('document stores do NOT import persist from zustand/middleware', () => {
    files
      .filter(f => f.layer === 'document')
      .forEach(f => {
        expect(f.source).not.toMatch(/from\s+['"]zustand\/middleware['"]/);
      });
  });

  it('wallLayoutStore is the only annotation-per-project store and uses Dexie', () => {
    const annotationPerProject = files.filter(f => f.layer === 'annotation-per-project');
    expect(annotationPerProject).toHaveLength(1);
    expect(annotationPerProject[0].filename).toBe('wallLayoutStore.ts');
    expect(annotationPerProject[0].source).toMatch(/from\s+['"]dexie['"]/);
  });
});
```

- [ ] **Step 4: Run boundary test**

```bash
pnpm --filter @variscout/stores test src/__tests__/layerBoundary.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Run full stores test suite**

```bash
pnpm --filter @variscout/stores test
```

Expected: green.

- [ ] **Step 6: Commit**

```bash
git add packages/stores
git commit -m "feat(F4): STORE_LAYER constants + layerBoundary.test.ts"
```

---

## Task 9: P7 + P8 — Add `DocumentSnapshot` type alias, delete `useSessionStore`, update CLAUDE.mds

**Files:**

- Create: `packages/stores/src/documentSnapshot.ts`
- Modify: `packages/stores/src/index.ts` (re-export DocumentSnapshot; remove sessionStore re-export)
- Delete: `packages/stores/src/sessionStore.ts`
- Delete: `packages/stores/src/__tests__/sessionStore.test.ts`
- Modify: `packages/stores/CLAUDE.md`
- Modify: `CLAUDE.md` (root — invariant line)
- Modify: `docs/llms.txt` (if it lists stores)

- [ ] **Step 1: Add `DocumentSnapshot` type alias (intersection — locked per F4 spec D5)**

Create `packages/stores/src/documentSnapshot.ts`:

```ts
/**
 * DocumentSnapshot — type-only intersection of all Document-layer store state shapes.
 *
 * Pre-positioned for future `.vrs` export envelope (see data-flow foundation
 * spec §7). When `exportDocument()` ships, its parameter type will be
 * `DocumentSnapshot`, and Annotation/View store state will fail to typecheck
 * if accidentally passed in.
 *
 * Shape: intersection (`A & B & C`), NOT a record `{ project, investigation, canvas }`
 * and NOT a union (`A | B | C`). Rationale (F4 spec D5): a `.vrs` export carries
 * ONE snapshot containing all document slices — flat is the right shape, the
 * future export consumer reads `(snap.outcomes, snap.findings, snap.canonicalMap)`
 * without needing to reach through namespacing nesting. If property names
 * collide across Document stores in the future, the intersection forces explicit
 * resolution at type-eval time — desirable, not a hazard.
 *
 * F4 ships only the type. F5+ wires the runtime function.
 */
import type { ProjectState } from './projectStore';
import type { InvestigationState } from './investigationStore';
import type { CanvasStoreState } from './canvasStore';

export type DocumentSnapshot = ProjectState & InvestigationState & CanvasStoreState;
```

- [ ] **Step 2: Re-export from `index.ts` and remove sessionStore re-export**

In `packages/stores/src/index.ts`:

- DELETE: `export { useSessionStore, getSessionInitialState, ... } from './sessionStore';` (whichever lines exist).
- ADD: `export type { DocumentSnapshot } from './documentSnapshot';`

- [ ] **Step 3: Delete `sessionStore.ts` + its test**

```bash
git rm packages/stores/src/sessionStore.ts packages/stores/src/__tests__/sessionStore.test.ts
```

- [ ] **Step 4: Verify no stragglers**

```bash
grep -rn "useSessionStore\|from\\s\\+['\"].*sessionStore['\"]\\|getSessionInitialState" apps packages --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: empty output. If anything appears (Task 4 missed a consumer), update it now.

- [ ] **Step 5: Update `packages/stores/CLAUDE.md`**

Replace the current Hard rules + Invariants sections with:

````markdown
# @variscout/stores

7 Zustand stores split across three layers per ADR-078 + F4 (data-flow foundation 2026-05-07):

| Layer                    | Store                   | Persistence                                                                    | Notes                                                                                         |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Document                 | `useProjectStore`       | via `useProjectActions` consumer-side serialisation                            | analyst-authored config + dataset                                                             |
| Document                 | `useInvestigationStore` | session-only today (F3 narrow coverage); future via `HubRepository.dispatch`   | findings, questions, suspectedCauses, causalLinks, problemContributionTree                    |
| Document                 | `useCanvasStore`        | via `dispatch(action: CanvasAction)` + `pwaHubRepository`/`azureHubRepository` | canonical map, outcomes, scope dimensions                                                     |
| Annotation (per-project) | `useWallLayoutStore`    | dedicated Dexie DB `variscout-wall-layout`, R12 ESLint exception               | wall node positions, zoom, pan                                                                |
| Annotation (per-user)    | `usePreferencesStore`   | `persist` middleware, idb-keyval, key `'variscout-preferences'`                | workspace tab, panel toggles, AI prefs, time lens, riskAxisConfig, budgetConfig               |
| View                     | `useViewStore`          | NONE — transient                                                               | highlights, expanded ids, selectedPoints brushing, focusedQuestionId, improvement view toggle |

## Boundary rule

The portability test: would another analyst importing this hub need this field?

- Yes → **Document**.
- No, but it survives reload → **Annotation**.
- No, doesn't survive reload → **View**.

`packages/stores/src/__tests__/layerBoundary.test.ts` enforces:

- View stores do NOT use `persist` middleware.
- Annotation-per-user stores DO use `persist` middleware.
- Document stores do NOT use `persist` middleware (they persist via dispatch / consumer-side serialisation).
- `wallLayoutStore` is the documented R12 exception (Dexie direct).

## Hard rules

- Stores are the source of truth. Components read via selectors: `useProjectStore(s => s.field)`. Never `useStore()` without a selector.
- `investigationStore` owns the `CausalLink` entity and `problemContributionTree`. View highlights live in `useViewStore`.
- UI-scoped state (filters, panels, highlights) generally belongs in app feature stores (`apps/*/src/features/`). Cross-app UI state lives here — `wallLayoutStore` is the established pattern.
- Do not introduce a DataContext — Zustand-first architecture is deliberate (ADR-041).
- **Cross-store action calls (imperative, one-way triggers)** are allowed — e.g., `projectStore.loadProject` calls `useViewStore.getState().clearTransientSelections()`. **Cross-store state subscriptions (reactive coupling)** are NOT — never have store A subscribe to store B's state; that creates a render-cascade and inverts the "stores are independent sources of truth" principle. Mock cross-store calls in tests.
- **Layer boundary enforcement scope:** `packages/stores/src/__tests__/layerBoundary.test.ts` covers `packages/stores/src/` ONLY. Per-app feature stores under `apps/*/src/features/` are NOT enforced (per F4 spec D7).

## Invariants

- Domain stores (project/investigation/canvas) NEVER import `dexie` directly; persistence access is via `HubRepository` / `pwaHubRepository.dispatch` / `azureHubRepository.dispatch`. ESLint `no-restricted-imports` rule (P7.2 of F1+F2) enforces.
- `canvasStore` exposes its own `dispatch(action: CanvasAction)`.
- `wallLayoutStore` persists per-project to `variscout-wall-layout` Dexie DB. R12 exception ESLint allow-listed.
- `usePreferencesStore` persists to idb-keyval under `'variscout-preferences'`. Legacy `'variscout-session'` key is dropped on first F4 deploy per `feedback_no_backcompat_clean_architecture` (pre-production policy).
- `useViewStore` has NO persistence middleware. Brushing selection cleared by `projectStore.loadProject` / `newProject` via `useViewStore.getState().clearTransientSelections()`.
- Testing pattern: `beforeEach(() => useStore.setState(useStore.getInitialState()))` to reset between tests.
- Cross-store imperative action calls (`otherStore.getState().<action>()`) inside an action are allowed — see Hard rules above for the action-vs-subscription distinction. Mock cross-store calls in tests.

## Test command

```bash
pnpm --filter @variscout/stores test
```
````

## Skills to consult

- `editing-investigation-workflow` — investigationStore / CausalLinks / problemContributionTree
- `writing-tests` — Zustand store test pattern

## Related

- ADR-041 Zustand feature stores
- ADR-078 PWA + Azure architecture alignment
- docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md (F-series parent)
- docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md (F4)
- docs/superpowers/specs/2026-04-19-investigation-wall-design.md (wallLayoutStore)

````

- [ ] **Step 6: Update root `CLAUDE.md` invariant line**

In `/CLAUDE.md`, find the line:
```markdown
- 5 domain Zustand stores are source of truth (project, investigation, improvement, session, canvas) + 1 cross-app feature store (wallLayout); no DataContext per ADR-078.
````

Replace with:

```markdown
- 6 Zustand stores are source of truth split across 3 layers per ADR-078 + F4: 3 Document (project, investigation, canvas) + 2 Annotation (preferences per-user, wallLayout per-project) + 1 View (view); no DataContext per ADR-078.
```

- [ ] **Step 7: Update `docs/llms.txt` if it lists stores**

```bash
grep -n "session\|improvement\|sessionStore\|improvementStore" docs/llms.txt 2>/dev/null
```

If matches, update accordingly. If no matches, skip.

- [ ] **Step 8: Run full test suite**

```bash
pnpm --filter @variscout/stores test
pnpm test
```

Expected: green across all packages.

- [ ] **Step 9: Run docs health**

```bash
pnpm docs:check
```

Expected: green (or only pre-existing warnings unrelated to F4).

- [ ] **Step 10: Commit**

```bash
git add packages/stores CLAUDE.md docs
git commit -m "feat(F4): delete useSessionStore, add DocumentSnapshot type, update CLAUDE.md"
```

---

## Task 10: P9 — Monorepo verify (`pnpm build`)

**Files:** No writes. Verification only.

- [ ] **Step 1: Full monorepo build**

```bash
pnpm build
```

Expected: every package + app builds clean. `tsc --noEmit` exits 0 for all.

If any package fails:

- Read the error.
- The most likely cause is a missed selector rename in Task 4 — find via `grep -rn "useSessionStore" .` (excluding node_modules).
- Fix at the call-site, re-run `pnpm build`. Do NOT proceed until green.

- [ ] **Step 2: Full test suite**

```bash
pnpm test
```

Expected: every package's vitest run is green.

- [ ] **Step 3: Pre-merge sanity**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green (`pnpm test` + lint + docs:check all green per the script).

- [ ] **Step 4: Commit if any verification artefacts changed**

(Usually nothing — `pnpm build` doesn't write source files. If `pnpm test` updated a snapshot, review and commit.)

```bash
git status
# If clean, no commit. Otherwise:
git add -A
git commit -m "chore(F4): verify build artefacts"
```

---

## Task 11: P10 — Decision log + investigations.md + ADR amendment + final review

**Files:**

- Modify: `docs/decision-log.md`
- Modify: `docs/investigations.md`
- Modify: `docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md` (§3 D5 amendment)
- Modify: `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` (status → delivered)

- [ ] **Step 1: Add F4 entry to `docs/decision-log.md`**

Append a 2026-05-07 entry per the existing decision-log conventions (read the most recent entry for format). Include:

- F4 shipped: three-layer state codification.
- Behaviour delta: `riskAxisConfig` + `budgetConfig` now persist (previously reset on reload).
- Storage key migration: legacy `'variscout-session'` IDB blob dropped; users see defaults until first interaction populates `'variscout-preferences'`.

- [ ] **Step 2: Add investigation entries to `docs/investigations.md`**

Append two new entries:

1. **Feature-store / preferences overlap.** `apps/azure/src/features/panelsStore.ts` and `apps/pwa/src/features/panelsStore.ts` semantically duplicate `usePreferencesStore` on workspace tab + panel toggles. Decide whether feature stores re-export from preferences or stay independent. Surfaced by F4 D7.

2. **wallLayoutStore.selection Set/JSON round-trip.** `wallLayoutStore.selection: Set<NodeId>` may not survive Dexie's JSON adapter (Sets don't JSON.stringify cleanly). Verify or convert to `string[]`. Surfaced by F4 audit.

- [ ] **Step 3: Amend data-flow foundation spec §3 D5**

In `docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`, append to §3 D5:

```markdown
**Amendment — 2026-05-07 (F4 codification).** F4 codifies D5 by giving each layer a physical Zustand-store home. View state lives in `useViewStore` (no persistence). Per-user Annotation lives in `usePreferencesStore` (idb-keyval persistence, `'variscout-preferences'` key). Document state continues in `projectStore`/`investigationStore`/`canvasStore` (each marked `STORE_LAYER = 'document'`). `useSessionStore` and `useImprovementStore` are deleted. Boundary enforced by `packages/stores/src/__tests__/layerBoundary.test.ts`. See F4 spec at `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`.
```

- [ ] **Step 4: Promote F4 spec status to delivered**

In the F4 spec frontmatter:

```diff
- status: draft
+ status: delivered
```

And update `last-reviewed` to today's date.

- [ ] **Step 5: Commit in-repo docs**

```bash
git add docs CLAUDE.md
git commit -m "docs(F4): decision log + investigations + spec amendment + status to delivered"
```

- [ ] **Step 6: Update `project_data_flow_foundation_fseries.md` memory entry**

This file lives outside the repo at `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/project_data_flow_foundation_fseries.md` and is NOT git-tracked. Use the `Write` tool (or direct edit) to append F4 to the F-series sequence section. Pattern matches the existing F3.5 / F3.6-β entries — short prose summary + key numeric deltas (test count delta, files touched). No git commit needed.

- [ ] **Step 7: Push branch and open PR**

```bash
git push -u origin f4-three-layer-state
gh pr create --title "F4: three-layer state codification (Document / Annotation / View)" --body "$(cat <<'EOF'
## Summary

Operationalizes Data-Flow Foundation §3 D5. After F4, every Zustand store in `packages/stores/` belongs to exactly one layer (Document, Annotation, View) — enforced by a boundary test.

- `useSessionStore` split into `useViewStore` (transient) + `usePreferencesStore` (per-user durable). Old store deleted.
- `useImprovementStore` deleted: riskAxisConfig + budgetConfig → preferences; activeView + highlightedIdeaId → view.
- `selectedPoints` / `selectionIndexMap` relocated from `projectStore` → `useViewStore`.
- `focusedQuestionId` relocated from `investigationStore` → `useViewStore`.
- `STORE_LAYER` constant added to every store.
- `packages/stores/src/__tests__/layerBoundary.test.ts` enforces layer hygiene.
- `DocumentSnapshot` type alias pre-positioned for future `.vrs` export.

**Behaviour delta:** `riskAxisConfig` + `budgetConfig` now persist (previously reset on reload because `improvementStore` had no persist middleware). Intentional UX fix per spec D2.

**Storage migration:** legacy `'variscout-session'` IDB blob dropped per `feedback_no_backcompat_clean_architecture`. Users see defaults until first interaction populates `'variscout-preferences'`. Acceptable per ADR-078 (pre-production).

Spec: `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`.

## Test plan

- [ ] `pnpm --filter @variscout/stores test` green
- [ ] `pnpm test` green across all packages
- [ ] `pnpm build` green
- [ ] `pnpm docs:check` green
- [ ] Layer boundary test fails if a future store omits `STORE_LAYER`

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 8: Final-branch Opus review**

Per user instruction, dispatch an Opus-model code-reviewer subagent against the merged worktree:

```
Agent({
  description: "F4 final-branch code review",
  subagent_type: "feature-dev:code-reviewer",
  model: "opus",
  prompt: "Review F4 (three-layer state codification) on branch f4-three-layer-state. Spec: docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md. Plan: docs/superpowers/plans/2026-05-07-data-flow-foundation-f4-three-layer-state.md. Focus on: (1) any sessionStore consumer left unmigrated (grep should return nothing); (2) layer-boundary test correctly enforces the 4 spec assertions; (3) preferencesStore partialize allowlist matches the spec table exactly (13 fields); (4) viewStore has zero persist middleware; (5) cross-store call (loadProject → clearTransientSelections) wired correctly; (6) any --no-verify in commit history (forbid); (7) the riskAxisConfig/budgetConfig persistence behaviour delta is documented in PR body and is the only behaviour change. Report under 400 words."
})
```

Address any blocker findings before merge.

---

## Verification (whole-plan, runs after Task 11)

- [ ] Spec D1: every store in `packages/stores/` exports `STORE_LAYER` from the allowed enum.
- [ ] Spec D2: `useSessionStore` and `useImprovementStore` no longer exist; `useViewStore` and `usePreferencesStore` do.
- [ ] Spec D3: `improvementStore` deleted; downstream consumer count = 0.
- [ ] Spec D4: `packages/stores/src/__tests__/layerBoundary.test.ts` exists and asserts 5 properties.
- [ ] Spec D5: `DocumentSnapshot` type exported from `@variscout/stores`.
- [ ] Spec D6: `Investigation.metadata.scopeFilter`/`paretoGroupBy`/`timelineWindow` unchanged (type-only).
- [ ] Spec D7: feature-store overlap logged to `docs/investigations.md`.
- [ ] Spec D8: wallLayoutStore.selection Set serialization logged to `docs/investigations.md`.
- [ ] CLAUDE.md root invariant line updated to "6 Zustand stores split across 3 layers."
- [ ] `packages/stores/CLAUDE.md` updated with the 3-layer table.
- [ ] `docs/decision-log.md` has a 2026-05-07 F4 entry.
- [ ] `pnpm build` green.
- [ ] `pnpm test` green.
- [ ] PR description names the `riskAxisConfig`/`budgetConfig` behaviour delta.

## Out of scope (named-future, not in this plan)

- Branded TS types (`DocumentField<T>`/etc.) — deferred unless drift returns.
- `exportDocument()` runtime — F5+.
- `Investigation.metadata.scopeFilter`/`paretoGroupBy`/`timelineWindow` write activation — separate "save view" spec.
- Sustainment / handoff dispatch coverage — F5.
- Investigation entity full persistence via `HubRepository` — F5.
- Per-app feature-store unification with `usePreferencesStore` — investigation only (D7).
- `wallLayoutStore.selection` Set/JSON serialization fix — investigation only (D8).
