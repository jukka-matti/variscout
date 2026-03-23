# Event-Driven Architecture Transition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all cross-store `.getState()` calls with typed domain events (mitt), replace ~80 mode-branching ternaries with a strategy pattern, and enforce package/feature boundaries via ESLint.

**Architecture:** Three sequential phases. Phase 1 creates a mitt-based event bus in `@variscout/core` with a singleton instance in the Azure app, replacing 17 cross-store calls with 11 typed events. Phase 2 adds `resolveMode()` + strategy lookup in `@variscout/core` to eliminate mode ternaries. Phase 3 adds `eslint-plugin-boundaries` for CI enforcement.

**Tech Stack:** mitt (event bus), eslint-plugin-boundaries, TypeScript strict mode, Vitest, Zustand

**Spec:** `docs/superpowers/specs/2026-03-23-event-driven-architecture-design.md`

---

## File Map

### Phase 1: Event Bus

| Action | File                                                                     | Responsibility                                          |
| ------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Create | `packages/core/src/events.ts`                                            | `DomainEventMap` type + `createEventBus()` factory      |
| Create | `packages/core/src/__tests__/events.test.ts`                             | Event bus type safety + emit/listen tests               |
| Modify | `packages/core/package.json`                                             | Add `./events` sub-path export                          |
| Create | `apps/azure/src/events/bus.ts`                                           | Singleton bus instance + `useEventBus()` hook           |
| Create | `apps/azure/src/events/listeners.ts`                                     | All event listener registrations                        |
| Create | `apps/azure/src/events/__tests__/listeners.test.ts`                      | Listener unit tests                                     |
| Modify | `apps/azure/src/features/findings/useFindingsOrchestration.ts`           | Replace 4 cross-store panelsStore calls with bus.emit() |
| Modify | `apps/azure/src/features/ai/useToolHandlers.ts`                          | Replace navigate_to switch with bus.emit()              |
| Modify | `apps/azure/src/features/investigation/useInvestigationOrchestration.ts` | Replace 2 cross-store panelsStore calls with bus.emit() |

### Phase 2: Strategy Pattern

| Action | File                                                   | Responsibility                                              |
| ------ | ------------------------------------------------------ | ----------------------------------------------------------- |
| Create | `packages/core/src/analysisStrategy.ts`                | `resolveMode()`, `AnalysisModeStrategy`, 4 strategy objects |
| Create | `packages/core/src/__tests__/analysisStrategy.test.ts` | Strategy resolution + completeness tests                    |
| Modify | `packages/core/package.json`                           | Add `./strategy` sub-path export                            |
| Modify | `packages/hooks/src/useReportSections.ts`              | Replace mode ternaries with strategy lookup                 |
| Modify | `apps/azure/src/components/views/ReportView.tsx`       | Replace ~21 ternaries with strategy props                   |

### Phase 3: ESLint Boundaries

| Action | File                  | Responsibility                               |
| ------ | --------------------- | -------------------------------------------- |
| Modify | `package.json` (root) | Add `eslint-plugin-boundaries` devDependency |
| Modify | `eslint.config.js`    | Add boundary rules (package-level)           |

---

## Phase 1: Domain Event Bus

### Task 1: Create Event Type Map

**Files:**

- Create: `packages/core/src/events.ts`
- Create: `packages/core/src/__tests__/events.test.ts`
- Modify: `packages/core/package.json`

- [ ] **Step 1: Write the test file**

```typescript
// packages/core/src/__tests__/events.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../events';
import type { DomainEventMap } from '../events';

describe('createEventBus', () => {
  it('creates a bus with emit and on methods', () => {
    const bus = createEventBus();
    expect(bus.emit).toBeInstanceOf(Function);
    expect(bus.on).toBeInstanceOf(Function);
    expect(bus.off).toBeInstanceOf(Function);
  });

  it('delivers finding:created to listeners', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('finding:created', handler);

    const payload = { finding: { id: 'f1', text: 'test', status: 'observed' } as any };
    bus.emit('finding:created', payload);

    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('delivers navigate:to to listeners', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('navigate:to', handler);

    bus.emit('navigate:to', { target: 'finding' as const, targetId: 'f1' });

    expect(handler).toHaveBeenCalledWith({ target: 'finding', targetId: 'f1' });
  });

  it('removes listener with off', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('finding:created', handler);
    bus.off('finding:created', handler);

    bus.emit('finding:created', { finding: { id: 'f1' } as any });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple listeners for the same event', () => {
    const bus = createEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('finding:created', h1);
    bus.on('finding:created', h2);

    bus.emit('finding:created', { finding: { id: 'f1' } as any });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run src/__tests__/events.test.ts`
Expected: FAIL — `../events` module not found

- [ ] **Step 3: Install mitt**

Run: `pnpm --filter @variscout/core add mitt`

- [ ] **Step 4: Write the event bus module**

```typescript
// packages/core/src/events.ts
import mitt from 'mitt';
import type { Finding, FindingSource, FindingStatus, FindingOutcome, ActionItem } from './findings';

// ── Navigation Types ──────────────────────────────────────────────────

export type NavigationTarget =
  | 'dashboard'
  | 'finding'
  | 'hypothesis'
  | 'chart'
  | 'improvement_workspace'
  | 'report';

export type PanelName = 'findings' | 'whatIf' | 'improvement' | 'coScout' | 'report';

// ── Event Payloads ────────────────────────────────────────────────────

export interface FindingCreatedEvent {
  finding: Finding;
  source?: FindingSource;
}

export interface FindingStatusChangedEvent {
  findingId: string;
  from: FindingStatus;
  to: FindingStatus;
}

export interface FindingResolvedEvent {
  findingId: string;
  outcome: FindingOutcome;
}

export interface HypothesisValidatedEvent {
  hypothesisId: string;
  status: 'supported' | 'contradicted' | 'partial';
  eta2: number;
}

export interface HypothesisCauseAssignedEvent {
  hypothesisId: string;
  role: 'primary' | 'contributing';
  findingId: string;
}

export interface IdeaProjectionAttachedEvent {
  ideaId: string;
  projected: { mean: number; sigma: number; cpk: number; yield?: number };
}

export interface IdeaConvertedToActionsEvent {
  ideaIds: string[];
  findingId: string;
  actions: ActionItem[];
}

export interface NavigateToEvent {
  target: NavigationTarget;
  targetId?: string;
  chartType?: string;
}

export interface PanelVisibilityChangedEvent {
  panel: PanelName;
  visible: boolean;
}

export interface HighlightFindingEvent {
  findingId: string;
  duration?: number;
}

export interface HighlightChartPointEvent {
  point: { x: number; y: number; label?: string };
  duration?: number;
}

// ── Event Map ─────────────────────────────────────────────────────────

export interface DomainEventMap {
  // Domain events
  'finding:created': FindingCreatedEvent;
  'finding:status-changed': FindingStatusChangedEvent;
  'finding:resolved': FindingResolvedEvent;
  'hypothesis:validated': HypothesisValidatedEvent;
  'hypothesis:cause-assigned': HypothesisCauseAssignedEvent;
  'idea:projection-attached': IdeaProjectionAttachedEvent;
  'idea:converted-to-actions': IdeaConvertedToActionsEvent;
  // UI choreography events
  'navigate:to': NavigateToEvent;
  'panel:visibility-changed': PanelVisibilityChangedEvent;
  'highlight:finding': HighlightFindingEvent;
  'highlight:chart-point': HighlightChartPointEvent;
}

// ── Factory ───────────────────────────────────────────────────────────

export type DomainEventBus = ReturnType<typeof createEventBus>;

export function createEventBus() {
  return mitt<DomainEventMap>();
}
```

- [ ] **Step 5: Add sub-path export to package.json**

In `packages/core/package.json`, add to the `"exports"` field:

```json
"./events": "./src/events.ts"
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run src/__tests__/events.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/events.ts packages/core/src/__tests__/events.test.ts packages/core/package.json packages/core/pnpm-lock.yaml
git commit -m "feat: add typed domain event bus (mitt) to @variscout/core"
```

---

### Task 2: Create Azure App Event Bus Singleton + Listeners

**Files:**

- Create: `apps/azure/src/events/bus.ts`
- Create: `apps/azure/src/events/listeners.ts`
- Create: `apps/azure/src/events/__tests__/listeners.test.ts`

**Read first:** `apps/azure/src/features/panels/panelsStore.ts`, `apps/azure/src/features/findings/findingsStore.ts`

- [ ] **Step 1: Write the listener tests**

```typescript
// apps/azure/src/events/__tests__/listeners.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createEventBus } from '@variscout/core/events';
import type { DomainEventBus } from '@variscout/core/events';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { registerListeners } from '../listeners';

describe('event listeners', () => {
  let bus: DomainEventBus;

  beforeEach(() => {
    bus = createEventBus();
    usePanelsStore.setState(usePanelsStore.getInitialState());
    useFindingsStore.setState(useFindingsStore.getInitialState());
    registerListeners(bus);
  });

  it('finding:created opens findings panel and highlights', () => {
    bus.emit('finding:created', {
      finding: { id: 'f1', text: 'test', status: 'observed' } as any,
    });

    expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
    expect(useFindingsStore.getState().highlightedFindingId).toBe('f1');
  });

  it('navigate:to dashboard shows dashboard view', () => {
    // Start in editor view
    usePanelsStore.getState().showEditor();
    expect(usePanelsStore.getState().activeView).toBe('editor');

    bus.emit('navigate:to', { target: 'dashboard' });

    expect(usePanelsStore.getState().activeView).toBe('dashboard');
  });

  it('navigate:to finding shows editor + opens findings + highlights', () => {
    bus.emit('navigate:to', { target: 'finding', targetId: 'f2' });

    expect(usePanelsStore.getState().activeView).toBe('editor');
    expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
    expect(useFindingsStore.getState().highlightedFindingId).toBe('f2');
  });

  it('navigate:to improvement opens improvement panel', () => {
    bus.emit('navigate:to', { target: 'improvement_workspace' });

    expect(usePanelsStore.getState().activeView).toBe('editor');
    expect(usePanelsStore.getState().isImprovementOpen).toBe(true);
  });

  it('navigate:to report opens report', () => {
    bus.emit('navigate:to', { target: 'report' });

    expect(usePanelsStore.getState().activeView).toBe('editor');
    expect(usePanelsStore.getState().isReportOpen).toBe(true);
  });

  it('highlight:finding sets highlighted finding id', () => {
    bus.emit('highlight:finding', { findingId: 'f3' });

    expect(useFindingsStore.getState().highlightedFindingId).toBe('f3');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- --run src/events/__tests__/listeners.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the bus singleton**

```typescript
// apps/azure/src/events/bus.ts
import { createEventBus } from '@variscout/core/events';
import type { DomainEventBus } from '@variscout/core/events';

/** Singleton event bus for the Azure app */
export const bus: DomainEventBus = createEventBus();
```

- [ ] **Step 4: Write the listeners module**

```typescript
// apps/azure/src/events/listeners.ts
import type { DomainEventBus, DomainEventMap } from '@variscout/core/events';
import { usePanelsStore } from '../features/panels/panelsStore';
import { useFindingsStore } from '../features/findings/findingsStore';
import { useInvestigationStore } from '../features/investigation/investigationStore';

/**
 * Register all domain event listeners.
 * Call once at app startup. Returns cleanup function.
 */
export function registerListeners(eventBus: DomainEventBus): () => void {
  // Track all handlers for cleanup (React strict mode / HMR)
  const handlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

  function on<K extends keyof DomainEventMap>(
    event: K,
    handler: (payload: DomainEventMap[K]) => void
  ) {
    eventBus.on(event, handler);
    handlers.push({ event, handler });
  }

  // ── Finding Events ──────────────────────────────────────────────────

  on('finding:created', ({ finding }) => {
    usePanelsStore.getState().setFindingsOpen(true);
    useFindingsStore.getState().setHighlightedFindingId(finding.id);
  });

  on('highlight:finding', ({ findingId }) => {
    useFindingsStore.getState().setHighlightedFindingId(findingId);
  });

  // ── Navigation Events ───────────────────────────────────────────────

  on('navigate:to', ({ target, targetId, chartType }) => {
    const panels = usePanelsStore.getState();

    switch (target) {
      case 'dashboard':
        panels.showDashboard();
        break;
      case 'finding':
        panels.showEditor();
        panels.setFindingsOpen(true);
        if (targetId) {
          useFindingsStore.getState().setHighlightedFindingId(targetId);
        }
        break;
      case 'hypothesis':
        panels.showEditor();
        panels.setFindingsOpen(true);
        if (targetId) {
          useInvestigationStore.getState().expandToHypothesis(targetId);
        }
        break;
      case 'chart':
        panels.showEditor();
        if (chartType) {
          panels.setPendingChartFocus(chartType);
        }
        break;
      case 'improvement_workspace':
        panels.showEditor();
        panels.setImprovementOpen(true);
        break;
      case 'report':
        panels.showEditor();
        panels.openReport();
        break;
    }
  });

  // ── Panel Events ────────────────────────────────────────────────────

  on('idea:projection-attached', () => {
    usePanelsStore.getState().setWhatIfOpen(true);
  });

  return () => {
    handlers.forEach(({ event, handler }) => eventBus.off(event as any, handler as any));
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/azure-app test -- --run src/events/__tests__/listeners.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/events/
git commit -m "feat: add event bus singleton and listeners for Azure app"
```

---

### Task 3: Migrate useFindingsOrchestration to Events

**Files:**

- Modify: `apps/azure/src/features/findings/useFindingsOrchestration.ts`

**Read first:** The full current file (276 lines). Cross-store calls at lines 171, 172, 177, 178, 205, 206, 211, 212.

- [ ] **Step 1: Import the bus at the top of useFindingsOrchestration.ts**

Add after existing imports:

```typescript
import { bus } from '../../events/bus';
```

- [ ] **Step 2: Replace handlePinFinding cross-store calls**

In `handlePinFinding`, replace the two blocks (lines ~171-178) that call `usePanelsStore.getState().setFindingsOpen(true)` and `useFindingsStore.getState().setHighlightedFindingId(...)` with:

```typescript
bus.emit('finding:created', { finding: newFinding });
```

The `registerListeners` handler for `finding:created` will open the findings panel and set the highlight.

- [ ] **Step 3: Replace handleAddChartObservation cross-store calls**

In `handleAddChartObservation`, replace the two blocks (lines ~205-212) that call `usePanelsStore.getState().setFindingsOpen(true)` and `useFindingsStore.getState().setHighlightedFindingId(...)` with:

```typescript
bus.emit('finding:created', { finding: newFinding, source: findingSource });
```

- [ ] **Step 4: Run existing tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS — existing behavior preserved via event listeners

- [ ] **Step 5: Verify no remaining cross-store panelsStore calls**

Run: `grep -n 'usePanelsStore.getState' apps/azure/src/features/findings/useFindingsOrchestration.ts`
Expected: 0 matches

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/features/findings/useFindingsOrchestration.ts
git commit -m "refactor: migrate useFindingsOrchestration to domain events"
```

---

### Task 4: Migrate useToolHandlers to Events

**Files:**

- Modify: `apps/azure/src/features/ai/useToolHandlers.ts`

**Read first:** The full file. The `navigate_to` tool handler (lines ~412-450) contains a switch statement with cross-store calls to panelsStore, findingsStore, and investigationStore.

- [ ] **Step 1: Import the bus**

Add after existing imports:

```typescript
import { bus } from '../../events/bus';
```

- [ ] **Step 2: Replace the navigate_to switch with a single event emit**

Replace the entire `navigate_to` case body (the switch on `target` with multiple `.getState()` calls) with:

```typescript
case 'navigate_to': {
  const target = params.target as NavigationTarget;
  const targetId = params.target_id as string | undefined;
  const chartType = params.chart_type as string | undefined;
  bus.emit('navigate:to', { target, targetId, chartType });
  return { success: true };
}
```

Import `NavigationTarget` from `@variscout/core/events`.

- [ ] **Step 3: Run existing tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS

- [ ] **Step 4: Verify no remaining cross-store calls in useToolHandlers**

Run: `grep -n 'usePanelsStore\|useFindingsStore\|useInvestigationStore' apps/azure/src/features/ai/useToolHandlers.ts`
Expected: Only import statements remain (if any other usages exist outside navigate_to, they stay)

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/ai/useToolHandlers.ts
git commit -m "refactor: migrate useToolHandlers navigate_to to domain events"
```

---

### Task 5: Migrate useInvestigationOrchestration to Events

**Files:**

- Modify: `apps/azure/src/features/investigation/useInvestigationOrchestration.ts`

**Read first:** Lines ~153 and ~170 where `usePanelsStore.getState().setWhatIfOpen()` is called.

- [ ] **Step 1: Import the bus**

```typescript
import { bus } from '../../events/bus';
```

- [ ] **Step 2: Replace handleProjectIdea cross-store call (line ~153)**

Replace `usePanelsStore.getState().setWhatIfOpen(true)` with:

```typescript
bus.emit('idea:projection-attached', {
  ideaId: projectionTarget.ideaId,
  projected: { mean: 0, sigma: 0, cpk: 0 }, // placeholder — actual values set after What-If
});
```

The listener in `listeners.ts` already handles `idea:projection-attached` → `setWhatIfOpen(true)`.

- [ ] **Step 3: Replace handleSaveIdeaProjection cross-store call (line ~170)**

Replace `usePanelsStore.getState().setWhatIfOpen(false)` with:

```typescript
bus.emit('panel:visibility-changed', { panel: 'whatIf', visible: false });
```

Add a listener for `panel:visibility-changed` in `listeners.ts`:

```typescript
eventBus.on('panel:visibility-changed', ({ panel, visible }) => {
  const panels = usePanelsStore.getState();
  switch (panel) {
    case 'whatIf':
      visible ? panels.setWhatIfOpen(true) : panels.setWhatIfOpen(false);
      break;
    case 'findings':
      visible ? panels.setFindingsOpen(true) : panels.setFindingsOpen(false);
      break;
    case 'improvement':
      visible ? panels.setImprovementOpen(true) : panels.setImprovementOpen(false);
      break;
  }
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS

- [ ] **Step 5: Verify no remaining panelsStore cross-store calls**

Run: `grep -n 'usePanelsStore.getState' apps/azure/src/features/investigation/useInvestigationOrchestration.ts`
Expected: 0 matches

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/features/investigation/useInvestigationOrchestration.ts apps/azure/src/events/listeners.ts
git commit -m "refactor: migrate useInvestigationOrchestration to domain events"
```

---

### Task 6: Wire Event Bus at App Startup + Phase 1 Verification

**Files:**

- Modify: `apps/azure/src/App.tsx` (or main entry point)

**Read first:** `apps/azure/src/main.tsx` or `apps/azure/src/App.tsx` to find the app initialization point.

- [ ] **Step 1: Register listeners at startup**

In the Azure app entry point, add:

```typescript
import { bus } from './events/bus';
import { registerListeners } from './events/listeners';

// Register event listeners (once, at app startup)
registerListeners(bus);
```

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: All ~3,844 tests pass

- [ ] **Step 3: Verify cross-store coupling is eliminated**

Run: `grep -rn 'usePanelsStore.getState' apps/azure/src/features/findings/ apps/azure/src/features/investigation/ apps/azure/src/features/ai/useToolHandlers.ts`
Expected: 0 matches (all moved to listeners.ts)

- [ ] **Step 4: Build check**

Run: `pnpm build`
Expected: All packages build successfully

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/App.tsx
git commit -m "feat: wire domain event bus at Azure app startup"
```

---

## Phase 2: Strategy Pattern

### Task 7: Create Analysis Strategy Module

**Files:**

- Create: `packages/core/src/analysisStrategy.ts`
- Create: `packages/core/src/__tests__/analysisStrategy.test.ts`
- Modify: `packages/core/package.json`

- [ ] **Step 1: Write the tests**

```typescript
// packages/core/src/__tests__/analysisStrategy.test.ts
import { describe, it, expect } from 'vitest';
import { resolveMode, getStrategy } from '../analysisStrategy';
import type { ResolvedMode } from '../analysisStrategy';

describe('resolveMode', () => {
  it('returns standard for default state', () => {
    expect(resolveMode('standard')).toBe('standard');
  });

  it('returns capability when standardIChartMetric is capability', () => {
    expect(resolveMode('standard', { standardIChartMetric: 'capability' })).toBe('capability');
  });

  it('returns performance for performance mode', () => {
    expect(resolveMode('performance')).toBe('performance');
  });

  it('returns yamazumi for yamazumi mode', () => {
    expect(resolveMode('yamazumi')).toBe('yamazumi');
  });

  it('ignores standardIChartMetric for non-standard modes', () => {
    expect(resolveMode('performance', { standardIChartMetric: 'capability' })).toBe('performance');
    expect(resolveMode('yamazumi', { standardIChartMetric: 'capability' })).toBe('yamazumi');
  });
});

describe('getStrategy', () => {
  const allModes: ResolvedMode[] = ['standard', 'capability', 'performance', 'yamazumi'];

  it.each(allModes)('returns strategy for %s', mode => {
    const strategy = getStrategy(mode);
    expect(strategy).toBeDefined();
    expect(strategy.chartSlots).toBeDefined();
    expect(strategy.chartSlots.slot1).toBeDefined();
    expect(strategy.chartSlots.slot2).toBeDefined();
    expect(strategy.chartSlots.slot3).toBeDefined();
    expect(strategy.chartSlots.slot4).toBeDefined();
    expect(strategy.kpiComponent).toBe(mode);
    expect(typeof strategy.metricLabel).toBe('function');
  });

  it('standard metricLabel returns Cpk when hasSpecs', () => {
    expect(getStrategy('standard').metricLabel(true)).toBe('Cpk');
  });

  it('standard metricLabel returns σ when no specs', () => {
    expect(getStrategy('standard').metricLabel(false)).toBe('σ');
  });

  it('capability metricLabel returns Mean Cpk', () => {
    expect(getStrategy('capability').metricLabel(true)).toBe('Mean Cpk');
  });

  it('performance metricLabel returns Worst Channel Cpk', () => {
    expect(getStrategy('performance').metricLabel(true)).toBe('Worst Channel Cpk');
  });

  it('yamazumi metricLabel returns VA Ratio', () => {
    expect(getStrategy('yamazumi').metricLabel(true)).toBe('VA Ratio');
  });

  it('yamazumi formatMetricValue formats as percentage', () => {
    const fmt = getStrategy('yamazumi').formatMetricValue;
    expect(fmt).toBeDefined();
    expect(fmt!(0.85)).toBe('85%');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run src/__tests__/analysisStrategy.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the strategy module**

```typescript
// packages/core/src/analysisStrategy.ts
import type { AnalysisMode } from './types';

// ── Types ─────────────────────────────────────────────────────────────

export type ResolvedMode = 'standard' | 'capability' | 'performance' | 'yamazumi';

export type ChartSlotType =
  | 'ichart'
  | 'capability-ichart'
  | 'cpk-scatter'
  | 'yamazumi-chart'
  | 'boxplot'
  | 'distribution-boxplot'
  | 'yamazumi-ichart'
  | 'pareto'
  | 'cpk-pareto'
  | 'yamazumi-pareto'
  | 'stats'
  | 'histogram'
  | 'yamazumi-summary';

export interface AnalysisModeStrategy {
  chartSlots: {
    slot1: ChartSlotType;
    slot2: ChartSlotType;
    slot3: ChartSlotType;
    slot4: ChartSlotType;
  };
  kpiComponent: ResolvedMode;
  reportTitle: string;
  reportSections: string[];
  metricLabel: (hasSpecs: boolean) => string;
  formatMetricValue?: (v: number) => string;
  aiChartInsightKeys: string[];
  aiToolSet: 'standard' | 'performance' | 'yamazumi';
}

// ── Resolver ──────────────────────────────────────────────────────────

export function resolveMode(
  mode: AnalysisMode,
  opts?: { standardIChartMetric?: string }
): ResolvedMode {
  if (mode === 'performance') return 'performance';
  if (mode === 'yamazumi') return 'yamazumi';
  if (opts?.standardIChartMetric === 'capability') return 'capability';
  return 'standard';
}

// ── Strategies ────────────────────────────────────────────────────────

const strategies: Record<ResolvedMode, AnalysisModeStrategy> = {
  standard: {
    chartSlots: { slot1: 'ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'standard',
    reportTitle: 'Variation Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: hasSpecs => (hasSpecs ? 'Cpk' : 'σ'),
    aiChartInsightKeys: ['ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
  },
  capability: {
    chartSlots: { slot1: 'capability-ichart', slot2: 'boxplot', slot3: 'pareto', slot4: 'stats' },
    kpiComponent: 'capability',
    reportTitle: 'Capability Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Mean Cpk',
    aiChartInsightKeys: ['capability-ichart', 'boxplot', 'pareto'],
    aiToolSet: 'standard',
  },
  performance: {
    chartSlots: {
      slot1: 'cpk-scatter',
      slot2: 'distribution-boxplot',
      slot3: 'cpk-pareto',
      slot4: 'histogram',
    },
    kpiComponent: 'performance',
    reportTitle: 'Performance Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'Worst Channel Cpk',
    aiChartInsightKeys: ['cpk-scatter', 'distribution-boxplot', 'cpk-pareto'],
    aiToolSet: 'performance',
  },
  yamazumi: {
    chartSlots: {
      slot1: 'yamazumi-chart',
      slot2: 'yamazumi-ichart',
      slot3: 'yamazumi-pareto',
      slot4: 'yamazumi-summary',
    },
    kpiComponent: 'yamazumi',
    reportTitle: 'Time Study Analysis',
    reportSections: ['current-condition', 'drivers', 'evidence-trail', 'learning-loop'],
    metricLabel: () => 'VA Ratio',
    formatMetricValue: (v: number) => `${Math.round(v * 100)}%`,
    aiChartInsightKeys: ['yamazumi', 'yamazumi-ichart', 'yamazumi-pareto'],
    aiToolSet: 'yamazumi',
  },
};

export function getStrategy(mode: ResolvedMode): AnalysisModeStrategy {
  return strategies[mode];
}
```

- [ ] **Step 4: Add sub-path export**

In `packages/core/package.json`, add:

```json
"./strategy": "./src/analysisStrategy.ts"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run src/__tests__/analysisStrategy.test.ts`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/analysisStrategy.ts packages/core/src/__tests__/analysisStrategy.test.ts packages/core/package.json
git commit -m "feat: add analysis mode strategy pattern to @variscout/core"
```

---

### Task 8: Apply Strategy to useReportSections

**Files:**

- Modify: `packages/hooks/src/useReportSections.ts`

**Read first:** Lines 150-176 where mode ternaries define section titles.

- [ ] **Step 1: Import strategy**

```typescript
import { resolveMode, getStrategy } from '@variscout/core/strategy';
```

- [ ] **Step 2: Replace mode ternaries with strategy lookup**

At the top of the hook, resolve the mode:

```typescript
const resolved = resolveMode(analysisMode, {
  standardIChartMetric: displayOptions?.standardIChartMetric,
});
const strategy = getStrategy(resolved);
```

Then replace the 4-level ternary title logic with the strategy's `metricLabel` and mode-aware titles. The exact replacement depends on the current section title structure — read the file first and replace each ternary block.

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @variscout/hooks test -- --run src/__tests__/useReportSections.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/hooks/src/useReportSections.ts
git commit -m "refactor: apply strategy pattern to useReportSections"
```

---

### Task 9: Apply Strategy to ReportView (largest file)

**Files:**

- Modify: `apps/azure/src/components/views/ReportView.tsx`

**Read first:** Full file. Ternaries at lines 143-145 (boolean derivation), 577-620 (render chain), 963-972 (metric labels).

This is the biggest change (~21 ternaries). Work incrementally:

- [ ] **Step 1: Import strategy and resolve mode at top of component**

```typescript
import { resolveMode, getStrategy } from '@variscout/core/strategy';

// Inside the component:
const resolved = resolveMode(analysisMode, {
  standardIChartMetric: displayOptions?.standardIChartMetric,
});
const strategy = getStrategy(resolved);
```

- [ ] **Step 2: Replace metric label ternaries (lines ~963-972)**

Replace:

```typescript
loopMetricLabel = isYamazumi ? 'VA Ratio' : isCapabilityMode ? 'Mean Cpk' : ...
```

With:

```typescript
loopMetricLabel = strategy.metricLabel(hasSpecs);
loopFormatValue = strategy.formatMetricValue;
```

- [ ] **Step 3: Replace KPI grid ternaries using strategy.kpiComponent**

Create a component lookup map:

```typescript
const KPIGridComponents: Record<ResolvedMode, React.ComponentType<any>> = {
  standard: ReportKPIGrid,
  capability: ReportCapabilityKPIGrid,
  performance: ReportPerformanceKPIGrid,
  yamazumi: ReportYamazumiKPIGrid,
};
const KPIGrid = KPIGridComponents[resolved];
```

Replace each 4-level ternary with `<KPIGrid {...props} />`.

- [ ] **Step 4: Replace remaining isYamazumi/isCapabilityMode checks**

Work through each remaining ternary. Some may need to stay as simple boolean checks (e.g., conditional yamazumi data rendering), but the 4-level cascading patterns should all become strategy lookups.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/views/ReportView.tsx
git commit -m "refactor: apply strategy pattern to ReportView (~21 ternaries removed)"
```

---

### Task 10: Phase 2 Verification + Full Test Suite

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All ~3,844 tests pass

- [ ] **Step 2: Count remaining ternaries**

Run: `grep -rn 'isYamazumi\|isCapabilityMode\|analysisMode ===' apps/ packages/ --include='*.ts' --include='*.tsx' | grep -v '__tests__\|node_modules\|\.test\.' | wc -l`
Expected: Significant reduction from ~80 (some may remain in files not yet migrated — that's OK for phase 2)

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: All packages build

- [ ] **Step 4: Commit (if any remaining fixes)**

---

## Phase 3: ESLint Boundaries

### Task 11: Add Package-Level Boundary Rules

**Files:**

- Modify: `package.json` (root)
- Modify: `eslint.config.js`

- [ ] **Step 1: Install eslint-plugin-boundaries**

Run: `pnpm add -D -w eslint-plugin-boundaries`

- [ ] **Step 2: Add boundary configuration to eslint.config.js**

Read `eslint.config.js` first to understand the existing flat config structure. Add:

```javascript
import boundaries from 'eslint-plugin-boundaries';

// Add to the config array:
{
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'packages/core/src/**' },
      { type: 'charts', pattern: 'packages/charts/src/**' },
      { type: 'hooks', pattern: 'packages/hooks/src/**' },
      { type: 'ui', pattern: 'packages/ui/src/**' },
      { type: 'data', pattern: 'packages/data/src/**' },
      { type: 'pwa', pattern: 'apps/pwa/src/**' },
      { type: 'azure', pattern: 'apps/azure/src/**' },
      { type: 'website', pattern: 'apps/website/src/**' },
      { type: 'docs', pattern: 'apps/docs/src/**' },
    ],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'allow',
      rules: [
        // Core cannot import any other package or app
        { from: 'core', disallow: ['charts', 'hooks', 'ui', 'data', 'pwa', 'azure', 'website', 'docs'] },
        // Charts cannot import hooks, ui, or apps
        { from: 'charts', disallow: ['hooks', 'ui', 'pwa', 'azure', 'website', 'docs'] },
        // Hooks cannot import ui, charts, or apps
        { from: 'hooks', disallow: ['ui', 'charts', 'pwa', 'azure', 'website', 'docs'] },
        // UI cannot import apps
        { from: 'ui', disallow: ['pwa', 'azure', 'website', 'docs'] },
        // Apps cannot import each other
        { from: 'pwa', disallow: ['azure', 'website', 'docs'] },
        { from: 'azure', disallow: ['pwa', 'website', 'docs'] },
        { from: 'website', disallow: ['pwa', 'azure', 'docs'] },
      ],
    }],
  },
},
```

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 boundary violations (all existing boundaries are clean)

- [ ] **Step 4: Verify boundaries catch violations**

Temporarily add `import { something } from '@variscout/hooks'` to a core file, run lint, verify error, then remove.

- [ ] **Step 5: Commit**

```bash
git add package.json eslint.config.js pnpm-lock.yaml
git commit -m "feat: add eslint-plugin-boundaries for package-level enforcement"
```

---

### Task 12: Write ADRs + Update Architecture Docs

**Files:**

- Create: `docs/07-decisions/adr-046-event-driven-architecture.md`
- Create: `docs/07-decisions/adr-047-analysis-mode-strategy.md`
- Create: `docs/07-decisions/adr-048-eslint-boundaries.md`
- Modify: `docs/07-decisions/index.md`
- Modify: `docs/05-technical/architecture/store-interactions.md`

- [ ] **Step 1: Write ADR-046 (Event-Driven Architecture)**

Follow existing ADR format. Key sections: Status (Accepted), Context (12+ cross-store calls), Decision (mitt event bus, 11 typed events), Consequences (decoupled features, testable listeners).

- [ ] **Step 2: Write ADR-047 (Analysis Mode Strategy)**

Key sections: Context (~80 ternaries), Decision (resolveMode hybrid, 3→4 value), Consequences (additive mode support).

- [ ] **Step 3: Write ADR-048 (ESLint Boundaries)**

Key sections: Context (convention-only enforcement), Decision (eslint-plugin-boundaries, two-phase rollout), Consequences (CI catches violations).

- [ ] **Step 4: Update ADR index**

Add 3 new entries to `docs/07-decisions/index.md`.

- [ ] **Step 5: Update store-interactions.md**

Add event bus section showing the new architecture.

- [ ] **Step 6: Commit**

```bash
git add docs/07-decisions/ docs/05-technical/architecture/
git commit -m "docs: ADR-046 events, ADR-047 strategy, ADR-048 boundaries"
```

---

## Final Verification

- [ ] `pnpm test` — all tests pass
- [ ] `pnpm build` — all packages build
- [ ] `pnpm lint` — 0 boundary violations
- [ ] `grep -rn 'usePanelsStore.getState' apps/azure/src/features/findings/ apps/azure/src/features/investigation/ apps/azure/src/features/ai/useToolHandlers.ts` — 0 matches
- [ ] Manual: pin finding → findings panel opens + highlight
- [ ] Manual: CoScout navigate_to → correct panel opens
- [ ] Manual: switch analysis modes → correct charts in all 4 slots
