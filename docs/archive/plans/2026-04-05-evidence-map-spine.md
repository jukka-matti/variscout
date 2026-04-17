---
status: archived
title: 'Evidence Map as Analysis Spine — Implementation Plan'
---

# Evidence Map as Analysis Spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Evidence Map from a pop-out-only visualization into the persistent analysis spine that grows through FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT, with deep PI Panel linking and graph-aware CoScout context.

**Architecture:** The Evidence Map component (`@variscout/charts`) is unchanged. The hook (`useEvidenceMapData`) gains `exploredFactors` tracking. The Investigation workspace (`apps/azure`) is restructured: Evidence Map center, PI Panel left, CoScout right. `panelsStore` gains `highlightedFactor` for bidirectional linking. `buildAIContext` gains `evidenceMapTopology` for graph-aware CoScout reasoning. New `FactorPreviewOverlay` component in `@variscout/ui` for FRAME → SCOUT transition.

**Tech Stack:** React 19, Zustand, visx, @variscout/charts (EvidenceMap), @variscout/hooks (useEvidenceMapData, useEvidenceMapTimeline), @variscout/core (buildAIContext, causalGraph), Vitest

**Spec:** `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md`

**Phases:** 5 phases (0-4). Each phase produces working, testable software. Phases can be delivered independently.

---

## File Structure

### New Files

```
packages/ui/src/components/FactorPreviewOverlay/
├── FactorPreviewOverlay.tsx      # Post-FRAME overlay wrapping EvidenceMapBase (Layer 1)
└── index.ts                      # Barrel export

apps/azure/src/components/editor/
├── InvestigationMapView.tsx       # Evidence Map center view for Investigation workspace

packages/ui/src/components/EvidenceMapContextMenu/
├── NodeContextMenu.tsx            # Right-click menu for factor nodes
├── EdgeContextMenu.tsx            # Right-click menu for relationship edges
└── index.ts

packages/ui/src/components/CausalLinkCreator/
├── CausalLinkCreator.tsx          # Modal for why-statement + direction on edge creation
└── index.ts

packages/ui/src/components/ReportEvidenceMap/
├── ReportEvidenceMap.tsx           # Timeline-animated Evidence Map for Report view
└── index.ts
```

### Modified Files

```
packages/hooks/src/useEvidenceMapData.ts         # Add exploredFactors computation
packages/core/src/ai/types.ts                    # Add EvidenceMapTopology to AIContext
packages/core/src/ai/buildAIContext.ts            # Build evidenceMapTopology from bestSubsets
apps/azure/src/features/panels/panelsStore.ts     # Add highlightedFactor, investigation view mode
apps/azure/src/components/editor/InvestigationWorkspace.tsx  # New layout: PI Panel + Map + CoScout
apps/azure/src/components/Dashboard.tsx           # Wire focused factor to probability plot
packages/ui/src/components/VerificationCard/VerificationCard.tsx  # Accept factorColumn prop
docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md  # Status → delivered
docs/05-technical/architecture/mental-model-hierarchy.md  # Update Investigation workspace description
```

---

## Phase 0: Quick Wins (leverage existing code)

### Task 1: Wire probability plot factor grouping

**Files:**

- Modify: `packages/ui/src/components/VerificationCard/VerificationCard.tsx`
- Modify: `apps/azure/src/components/Dashboard.tsx`
- Test: `packages/hooks/src/__tests__/useProbabilityPlotData.test.ts` (existing, verify multi-series)

The `useProbabilityPlotData` hook already supports `factorColumn` parameter but the dashboard never passes it. Wire the focused factor through.

- [ ] **Step 1: Read existing VerificationCard props**

Read `packages/ui/src/components/VerificationCard/VerificationCard.tsx` to understand the current prop interface. The probability plot data is passed as a rendered JSX `probabilityPlot` prop. We need to add `factorColumn` to the underlying hook call in the dashboard.

- [ ] **Step 2: Update Dashboard probability plot data**

In `apps/azure/src/components/Dashboard.tsx`, find where `useProbabilityPlotData` is called. Add the focused factor from the current drill path:

```typescript
// In Dashboard.tsx, where probability plot data is prepared:
const focusedFactor = drillPath.length > 0 ? drillPath[0].factor : undefined;

const probabilityPlotData = useProbabilityPlotData({
  values: histogramData,
  factorColumn: focusedFactor, // NEW: pass current factor for multi-series
  rows: filteredData ?? [],
});
```

- [ ] **Step 3: Verify multi-series rendering**

Run: `pnpm --filter @variscout/hooks test -- --grep "useProbabilityPlotData"`

The existing tests for `useProbabilityPlotData` should validate that passing a `factorColumn` produces multiple series. If not, add a test:

```typescript
it('should group by factor when factorColumn is provided', () => {
  const result = renderHook(() =>
    useProbabilityPlotData({
      values: [10, 12, 11, 20, 22, 21],
      factorColumn: 'Machine',
      rows: [
        { Machine: 'A', val: 10 },
        { Machine: 'A', val: 12 },
        { Machine: 'A', val: 11 },
        { Machine: 'B', val: 20 },
        { Machine: 'B', val: 22 },
        { Machine: 'B', val: 21 },
      ],
    })
  );
  expect(result.current.series).toHaveLength(2);
  expect(result.current.series[0].key).toBe('A');
  expect(result.current.series[1].key).toBe('B');
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/VerificationCard/ apps/azure/src/components/Dashboard.tsx
git commit -m "feat(charts): wire probability plot multi-series factor grouping"
```

---

### Task 2: Add exploredFactors to useEvidenceMapData

**Files:**

- Modify: `packages/hooks/src/useEvidenceMapData.ts`
- Test: Create `packages/hooks/src/__tests__/useEvidenceMapData.test.ts`

Add `exploredFactors: Set<string>` to the hook return — factors that have at least one answered or ruled-out question. This drives node color on the Evidence Map (grey = unexplored, colored = explored).

- [ ] **Step 1: Write the failing test**

Create `packages/hooks/src/__tests__/useEvidenceMapData.test.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { useEvidenceMapData } from '../useEvidenceMapData';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { Question } from '@variscout/core/findings';

// Minimal bestSubsets fixture with 2 factors
const mockBestSubsets: BestSubsetsResult = {
  subsets: [
    {
      factors: ['Machine', 'Shift'],
      rSquared: 0.45,
      rSquaredAdj: 0.42,
      fStatistic: 12.3,
      pValue: 0.001,
      n: 100,
      levelEffects: new Map([
        [
          'Machine',
          new Map([
            ['M1', -0.3],
            ['M2', 0.3],
          ]),
        ],
        [
          'Shift',
          new Map([
            ['Day', -0.5],
            ['Night', 0.5],
          ]),
        ],
      ]),
      cellMeans: new Map(),
    },
  ],
  outcomeLabel: 'Weight',
  grandMean: 12.1,
};

describe('useEvidenceMapData', () => {
  it('should compute exploredFactors from answered questions', () => {
    const answeredQuestion: Question = {
      id: 'q1',
      text: 'Does Machine matter?',
      factor: 'Machine',
      status: 'answered',
      questionSource: 'factor-intel',
      createdAt: Date.now(),
    } as Question;

    const openQuestion: Question = {
      id: 'q2',
      text: 'Does Shift matter?',
      factor: 'Shift',
      status: 'open',
      questionSource: 'factor-intel',
      createdAt: Date.now(),
    } as Question;

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: mockBestSubsets,
        mainEffects: null,
        interactions: null,
        containerSize: { width: 600, height: 400 },
        mode: 'standard',
        questions: [answeredQuestion, openQuestion],
      })
    );

    expect(result.current.exploredFactors).toContain('Machine');
    expect(result.current.exploredFactors).not.toContain('Shift');
  });

  it('should include ruled-out factors as explored', () => {
    const ruledOutQuestion: Question = {
      id: 'q1',
      text: 'Does Machine matter?',
      factor: 'Machine',
      status: 'answered',
      causeRole: 'ruled-out',
      questionSource: 'factor-intel',
      createdAt: Date.now(),
    } as Question;

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: mockBestSubsets,
        mainEffects: null,
        interactions: null,
        containerSize: { width: 600, height: 400 },
        mode: 'standard',
        questions: [ruledOutQuestion],
      })
    );

    expect(result.current.exploredFactors).toContain('Machine');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test -- --grep "exploredFactors"`
Expected: FAIL — `exploredFactors` does not exist on return type.

- [ ] **Step 3: Add exploredFactors to hook**

In `packages/hooks/src/useEvidenceMapData.ts`:

Add to `UseEvidenceMapDataReturn` interface:

```typescript
/** Factors with at least one answered or ruled-out question */
exploredFactors: Set<string>;
```

Add computation inside the `useMemo` before the `return`:

```typescript
// Compute explored factors from answered/ruled-out questions
const exploredFactors = new Set<string>();
for (const q of questions) {
  if (q.factor && (q.status === 'answered' || q.causeRole === 'ruled-out')) {
    exploredFactors.add(q.factor);
  }
}
```

Add `exploredFactors` to both return statements (empty state returns `new Set()`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/hooks test -- --grep "exploredFactors"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useEvidenceMapData.ts packages/hooks/src/__tests__/useEvidenceMapData.test.ts
git commit -m "feat(hooks): add exploredFactors to useEvidenceMapData"
```

---

### Task 3: Add evidenceMapTopology to CoScout AI context

**Files:**

- Modify: `packages/core/src/ai/types.ts`
- Modify: `packages/core/src/ai/buildAIContext.ts`
- Test: `packages/core/src/ai/__tests__/buildAIContext.test.ts` (existing, add new test)

- [ ] **Step 1: Add EvidenceMapTopology type to AIContext**

In `packages/core/src/ai/types.ts`, add inside the `investigation` object (after the existing `interactionEffects` field around line 237):

```typescript
/** Evidence Map topology for graph-aware CoScout reasoning */
evidenceMapTopology?: {
  factorNodes: Array<{
    factor: string;
    rSquaredAdj: number;
    explored: boolean;
    questionCount: number;
    findingCount: number;
  }>;
  relationships: Array<{
    factorA: string;
    factorB: string;
    type: string; // RelationshipType
    strength: number;
  }>;
  convergencePoints: Array<{
    factor: string;
    incomingCount: number;
    hubName?: string;
    hubStatus?: string;
  }>;
};
```

- [ ] **Step 2: Write the failing test**

In `packages/core/src/ai/__tests__/buildAIContext.test.ts`, add:

```typescript
it('should include evidenceMapTopology when provided', () => {
  const context = buildAIContext({
    outcome: 'Weight',
    factors: ['Machine', 'Shift'],
    data: [],
    evidenceMapTopology: {
      factorNodes: [
        { factor: 'Machine', rSquaredAdj: 0.34, explored: true, questionCount: 3, findingCount: 1 },
        { factor: 'Shift', rSquaredAdj: 0.22, explored: false, questionCount: 0, findingCount: 0 },
      ],
      relationships: [
        { factorA: 'Machine', factorB: 'Shift', type: 'interactive', strength: 0.04 },
      ],
      convergencePoints: [],
    },
  });

  expect(context.investigation?.evidenceMapTopology).toBeDefined();
  expect(context.investigation?.evidenceMapTopology?.factorNodes).toHaveLength(2);
  expect(context.investigation?.evidenceMapTopology?.relationships).toHaveLength(1);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --grep "evidenceMapTopology"`
Expected: FAIL

- [ ] **Step 4: Add evidenceMapTopology to buildAIContext**

In `packages/core/src/ai/buildAIContext.ts`, add the `evidenceMapTopology` option to the `BuildAIContextOptions` interface, then add the passthrough in the investigation section (after the coverage/progress metrics, around line 523):

```typescript
// In BuildAIContextOptions:
evidenceMapTopology?: AIContext['investigation']['evidenceMapTopology'];

// In buildAIContext function body, investigation section:
if (options.evidenceMapTopology) {
  context.investigation.evidenceMapTopology = options.evidenceMapTopology;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --grep "evidenceMapTopology"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/types.ts packages/core/src/ai/buildAIContext.ts packages/core/src/ai/__tests__/buildAIContext.test.ts
git commit -m "feat(core): add evidenceMapTopology to CoScout AI context"
```

---

### Task 4: Add highlightedFactor to panelsStore

**Files:**

- Modify: `apps/azure/src/features/panels/panelsStore.ts`
- Test: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`

- [ ] **Step 1: Write the failing test**

In `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`, add:

```typescript
describe('highlightedFactor', () => {
  it('should set highlighted factor and switch PI tab to questions', () => {
    usePanelsStore.getState().setHighlightedFactor('Machine');
    const state = usePanelsStore.getState();
    expect(state.highlightedFactor).toBe('Machine');
    expect(state.piActiveTab).toBe('questions');
    expect(state.isPISidebarOpen).toBe(true);
  });

  it('should clear highlighted factor', () => {
    usePanelsStore.getState().setHighlightedFactor('Machine');
    usePanelsStore.getState().setHighlightedFactor(null);
    expect(usePanelsStore.getState().highlightedFactor).toBeNull();
  });
});

describe('investigationViewMode', () => {
  it('should default to map', () => {
    expect(usePanelsStore.getState().investigationViewMode).toBe('map');
  });

  it('should toggle between map and findings', () => {
    usePanelsStore.getState().setInvestigationViewMode('findings');
    expect(usePanelsStore.getState().investigationViewMode).toBe('findings');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- --grep "highlightedFactor"`
Expected: FAIL

- [ ] **Step 3: Add state and actions to panelsStore**

In `apps/azure/src/features/panels/panelsStore.ts`:

Add to `PanelsState`:

```typescript
/** Factor highlighted from Evidence Map node click (for PI panel scroll-to) */
highlightedFactor: string | null;
/** Investigation workspace center view: 'map' (Evidence Map) or 'findings' (FindingsLog) */
investigationViewMode: 'map' | 'findings';
```

Add to `PanelsActions`:

```typescript
setHighlightedFactor: (factor: string | null) => void;
setInvestigationViewMode: (mode: 'map' | 'findings') => void;
```

Add initial state:

```typescript
highlightedFactor: null,
investigationViewMode: 'map',
```

Add action implementations:

```typescript
setHighlightedFactor: (factor) =>
  set(() =>
    factor
      ? { highlightedFactor: factor, piActiveTab: 'questions', isPISidebarOpen: true }
      : { highlightedFactor: null }
  ),
setInvestigationViewMode: (mode) => set(() => ({ investigationViewMode: mode })),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/azure-app test -- --grep "highlightedFactor"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/panels/panelsStore.ts apps/azure/src/features/panels/__tests__/panelsStore.test.ts
git commit -m "feat(panels): add highlightedFactor and investigationViewMode to panelsStore"
```

---

## Phase 1: Factor Preview

### Task 5: Create FactorPreviewOverlay component

**Files:**

- Create: `packages/ui/src/components/FactorPreviewOverlay/FactorPreviewOverlay.tsx`
- Create: `packages/ui/src/components/FactorPreviewOverlay/index.ts`
- Modify: `packages/ui/src/index.ts` (add export)

The overlay shows the embryonic Evidence Map (Layer 1 only) with a "Start with [top factor]" recommendation and a "Skip" button. It's a centered modal over the dashboard.

- [ ] **Step 1: Create component**

Create `packages/ui/src/components/FactorPreviewOverlay/FactorPreviewOverlay.tsx`:

```tsx
import React from 'react';
import { X, ArrowRight } from 'lucide-react';

interface FactorPreviewOverlayProps {
  /** Rendered Evidence Map (Layer 1 only) — parent provides via EvidenceMapBase */
  evidenceMap: React.ReactNode;
  /** Top factor name (highest R²adj) for recommendation */
  topFactor: string;
  /** R²adj of the top factor for display */
  topFactorR2: number;
  /** Total R²adj explained by the best model */
  modelR2: number;
  /** Number of factors in the model */
  factorCount: number;
  /** Called when "Start with [factor]" is clicked */
  onStartWithFactor: (factor: string) => void;
  /** Called when "Skip" or close is clicked */
  onDismiss: () => void;
}

export const FactorPreviewOverlay: React.FC<FactorPreviewOverlayProps> = ({
  evidenceMap,
  topFactor,
  topFactorR2,
  modelR2,
  factorCount,
  onStartWithFactor,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-surface border border-edge rounded-xl shadow-2xl w-[min(90vw,720px)] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <div>
            <h2 className="text-base font-semibold text-content">Factor Intelligence Preview</h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Best subsets analyzed {factorCount} factors — model explains{' '}
              {(modelR2 * 100).toFixed(0)}% of variation
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-md text-content-tertiary hover:text-content hover:bg-surface-secondary transition-colors"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        {/* Evidence Map */}
        <div className="flex-1 min-h-0 p-4">
          <div className="w-full h-[min(50vh,400px)]">{evidenceMap}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-edge">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onStartWithFactor(topFactor)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start with {topFactor}
            <span className="text-blue-200 text-xs">R\u00B2adj={topFactorR2.toFixed(2)}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create barrel export**

Create `packages/ui/src/components/FactorPreviewOverlay/index.ts`:

```typescript
export { FactorPreviewOverlay } from './FactorPreviewOverlay';
```

- [ ] **Step 3: Add to package exports**

In `packages/ui/src/index.ts`, add:

```typescript
export { FactorPreviewOverlay } from './components/FactorPreviewOverlay';
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/FactorPreviewOverlay/ packages/ui/src/index.ts
git commit -m "feat(ui): add FactorPreviewOverlay component"
```

---

### Task 6: Wire Factor Preview to Azure Dashboard

**Files:**

- Modify: `apps/azure/src/components/Dashboard.tsx` (or EditorDashboardView)
- Modify: `apps/azure/src/features/panels/panelsStore.ts` (add factorPreviewDismissed)

The overlay shows once per project when Factor Intelligence first completes (≥2 factors, bestSubsets available). Dismissing persists in sessionStore.

- [ ] **Step 1: Add dismiss state to panelsStore**

In `apps/azure/src/features/panels/panelsStore.ts`:

Add to state: `factorPreviewDismissed: boolean;`
Add initial: `factorPreviewDismissed: false,`
Add action: `dismissFactorPreview: () => set({ factorPreviewDismissed: true }),`
Add to `PanelsActions`: `dismissFactorPreview: () => void;`

- [ ] **Step 2: Wire overlay in Dashboard/Editor**

In the Azure Dashboard component, add the overlay render:

```tsx
import { FactorPreviewOverlay } from '@variscout/ui';

// Inside the component:
const factorPreviewDismissed = usePanelsStore(s => s.factorPreviewDismissed);
const dismissFactorPreview = usePanelsStore(s => s.dismissFactorPreview);

const showFactorPreview =
  !factorPreviewDismissed &&
  bestSubsets !== null &&
  factors.length >= 2 &&
  journeyPhase === 'scout';

// Top factor from bestSubsets
const topSubset = bestSubsets?.subsets[0];
const topFactorName = topSubset?.factors[0];
const topFactorR2 = topSubset?.rSquaredAdj ?? 0;

// In JSX, after the main dashboard content:
{
  showFactorPreview && topFactorName && (
    <FactorPreviewOverlay
      evidenceMap={<EvidenceMap {...evidenceMapData} enableZoom={false} compact={false} />}
      topFactor={topFactorName}
      topFactorR2={topFactorR2}
      modelR2={topSubset?.rSquaredAdj ?? 0}
      factorCount={factors.length}
      onStartWithFactor={factor => {
        // Navigate to Analysis workspace with factor focused
        usePanelsStore.getState().setHighlightedFactor(factor);
        dismissFactorPreview();
      }}
      onDismiss={dismissFactorPreview}
    />
  );
}
```

- [ ] **Step 3: Verify visually**

Run: `pnpm --filter @variscout/azure-app dev`
Load a project with 2+ factors. After column mapping completes and Factor Intelligence runs, the Factor Preview overlay should appear.

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/components/ apps/azure/src/features/panels/panelsStore.ts
git commit -m "feat(azure): wire FactorPreviewOverlay to dashboard on FRAME→SCOUT transition"
```

---

## Phase 2: Investigation Workspace Redesign

### Task 7: Create InvestigationMapView component

**Files:**

- Create: `apps/azure/src/components/editor/InvestigationMapView.tsx`

This is the Evidence Map center view for the Investigation workspace. It wraps `EvidenceMapBase` with all 3 layers and handles node/edge click callbacks to dispatch to panelsStore.

- [ ] **Step 1: Create component**

Create `apps/azure/src/components/editor/InvestigationMapView.tsx`:

```tsx
import React, { useCallback, useRef, useState } from 'react';
import { EvidenceMap } from '@variscout/charts';
import { useEvidenceMapData } from '@variscout/hooks';
import type { UseEvidenceMapDataOptions } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';

interface InvestigationMapViewProps {
  /** All options for useEvidenceMapData — caller provides statistical + investigation data */
  mapOptions: Omit<UseEvidenceMapDataOptions, 'containerSize'>;
}

export const InvestigationMapView: React.FC<InvestigationMapViewProps> = ({ mapOptions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  // Observe container size for responsive layout
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mapData = useEvidenceMapData({ ...mapOptions, containerSize });

  const handleFactorClick = useCallback((factor: string) => {
    usePanelsStore.getState().setHighlightedFactor(factor);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 bg-surface-secondary relative">
      {mapData.isEmpty ? (
        <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
          Select at least 2 factors to see the Evidence Map
        </div>
      ) : (
        <EvidenceMap
          outcomeNode={mapData.outcomeNode}
          factorNodes={mapData.factorNodes}
          relationshipEdges={mapData.relationshipEdges}
          equation={mapData.equation}
          causalEdges={mapData.causalEdges}
          convergencePoints={mapData.convergencePoints}
          exploredFactors={mapData.exploredFactors}
          enableZoom
          onFactorClick={handleFactorClick}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/azure/src/components/editor/InvestigationMapView.tsx
git commit -m "feat(azure): add InvestigationMapView center component"
```

---

### Task 8: Restructure InvestigationWorkspace layout

**Files:**

- Modify: `apps/azure/src/components/editor/InvestigationWorkspace.tsx`

Replace the current layout (QuestionChecklist left, FindingsLog center) with (PI Panel left, Evidence Map center, FindingsLog as toggle). This is the largest task — restructures the 519-line component.

- [ ] **Step 1: Read and understand the current InvestigationWorkspace**

Read `apps/azure/src/components/editor/InvestigationWorkspace.tsx` fully. Understand:

- Left panel: QuestionChecklist + InvestigationPhaseBadge + InvestigationConclusion
- Center: FindingsLog with view mode toggle (list/board/tree)
- Right: CoScoutPanelBase (existing)
- All the hub model computations and callbacks

- [ ] **Step 2: Add view mode toggle to center area**

Replace the center panel with a conditional: when `investigationViewMode === 'map'`, show `InvestigationMapView`. When `'findings'`, show the existing FindingsLog. Add a toggle bar at the top.

The left panel changes from QuestionChecklist to the full PI Panel pattern. For now, keep the existing left panel content — the PI Panel integration can be refined in a follow-up step. The key change is the center area.

At the top of the center area, replace the list/board/tree toggle with:

```tsx
const investigationViewMode = usePanelsStore(s => s.investigationViewMode);
const setInvestigationViewMode = usePanelsStore(s => s.setInvestigationViewMode);

// In JSX center area:
<div className="flex-1 flex flex-col min-w-0 min-h-0">
  {/* View mode toggle */}
  <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-surface flex-shrink-0">
    {(['map', 'findings'] as const).map(mode => (
      <button
        key={mode}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          investigationViewMode === mode
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
        }`}
        onClick={() => setInvestigationViewMode(mode)}
      >
        {mode === 'map' ? 'Evidence Map' : 'Findings'}
      </button>
    ))}
    {investigationViewMode === 'findings' && (
      <>
        <div className="w-px h-4 bg-edge mx-1" />
        {(['list', 'board', 'tree'] as const).map(mode => (
          <button key={mode} /* existing sub-mode toggle */ />
        ))}
      </>
    )}
    <span className="ml-auto text-xs text-content-tertiary">
      {findingsState.findings.length} finding{findingsState.findings.length !== 1 ? 's' : ''}
    </span>
  </div>

  {/* Content */}
  {investigationViewMode === 'map' ? (
    <InvestigationMapView mapOptions={{
      bestSubsets,
      mainEffects: null, // Pass mainEffects when available
      interactions: null, // Pass interactions when available
      mode: resolved,
      causalLinks: /* from investigationStore */,
      questions: questionsState.questions,
      findings: findingsState.findings,
      suspectedCauses: hubs,
    }} />
  ) : (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      <FindingsLog /* existing props */ />
    </div>
  )}
</div>
```

- [ ] **Step 3: Import InvestigationMapView and wire data**

Add import at top:

```typescript
import { InvestigationMapView } from './InvestigationMapView';
```

Wire the causal links from the investigation store. The `useInvestigationStore` is already imported — read `causalLinks`:

```typescript
const causalLinks = useInvestigationStore(s => s.causalLinks);
```

- [ ] **Step 4: Verify visually**

Run: `pnpm --filter @variscout/azure-app dev`
Navigate to Investigation workspace. Should see "Evidence Map" and "Findings" toggle at top. Default view is Evidence Map showing factor nodes.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/editor/InvestigationWorkspace.tsx
git commit -m "feat(azure): restructure Investigation workspace with Evidence Map center + Findings toggle"
```

---

### Task 9: Evidence Map node → PI panel scroll-to

**Files:**

- Modify: PI panel components in `packages/ui/src/components/ProcessIntelligencePanel/` (or equivalent)
- Modify: Question list components to respond to `highlightedFactor`

When `panelsStore.highlightedFactor` changes, the Questions tab in the PI panel should scroll to and highlight questions related to that factor.

- [ ] **Step 1: Read the PI panel Question list components**

Read the QuestionsTabView and QuestionRow components to understand how questions render and how to add scroll-to behavior.

- [ ] **Step 2: Add highlightedFactor awareness to question rendering**

In the questions list component, read `highlightedFactor` from panelsStore and:

1. Add a `data-factor` attribute to each question row
2. When `highlightedFactor` changes, scroll to the first matching question
3. Add a highlight ring animation (blue pulse, fades after 2s)

```tsx
const highlightedFactor = usePanelsStore(s => s.highlightedFactor);

useEffect(() => {
  if (!highlightedFactor) return;
  const el = document.querySelector(`[data-factor="${highlightedFactor}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('ring-2', 'ring-blue-400', 'animate-pulse');
    const timer = setTimeout(() => {
      el.classList.remove('ring-2', 'ring-blue-400', 'animate-pulse');
      usePanelsStore.getState().setHighlightedFactor(null);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [highlightedFactor]);
```

- [ ] **Step 3: Verify the flow**

Click a factor node on the Evidence Map → PI panel Questions tab activates → scrolls to related questions with highlight animation.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/
git commit -m "feat(ui): PI panel scroll-to on Evidence Map factor click"
```

---

## Phase 3: Direct Map Interactions

### Task 10: Right-click context menu for factor nodes

**Files:**

- Create: `packages/ui/src/components/EvidenceMapContextMenu/NodeContextMenu.tsx`
- Create: `packages/ui/src/components/EvidenceMapContextMenu/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create NodeContextMenu**

```tsx
import React from 'react';
import { MessageCircleQuestion, FileText, Bot, ArrowRight } from 'lucide-react';

interface NodeContextMenuProps {
  factor: string;
  x: number;
  y: number;
  onAskQuestion: (factor: string) => void;
  onCreateFinding: (factor: string) => void;
  onAskCoScout: (factor: string) => void;
  onDrillDown: (factor: string) => void;
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  factor,
  x,
  y,
  onAskQuestion,
  onCreateFinding,
  onAskCoScout,
  onDrillDown,
  onClose,
}) => {
  const items = [
    {
      icon: MessageCircleQuestion,
      label: `Ask about ${factor}`,
      action: () => onAskQuestion(factor),
    },
    {
      icon: FileText,
      label: `Create finding for ${factor}`,
      action: () => onCreateFinding(factor),
    },
    { icon: Bot, label: `Ask CoScout about ${factor}`, action: () => onAskCoScout(factor) },
    { icon: ArrowRight, label: `Drill down to ${factor}`, action: () => onDrillDown(factor) },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[200px]"
        style={{ left: x, top: y }}
      >
        {items.map(item => (
          <button
            key={item.label}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-content hover:bg-surface-secondary transition-colors text-left"
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <item.icon size={14} className="text-content-secondary" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
```

- [ ] **Step 2: Export and commit**

```bash
git add packages/ui/src/components/EvidenceMapContextMenu/ packages/ui/src/index.ts
git commit -m "feat(ui): add NodeContextMenu for Evidence Map right-click actions"
```

---

### Task 11: Create CausalLinkCreator modal

**Files:**

- Create: `packages/ui/src/components/CausalLinkCreator/CausalLinkCreator.tsx`
- Create: `packages/ui/src/components/CausalLinkCreator/index.ts`

Modal for creating a causal link after edge drawing. The analyst enters why-statement, selects direction, and evidence type.

- [ ] **Step 1: Create component**

```tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CausalLinkCreatorProps {
  fromFactor: string;
  toFactor: string;
  onConfirm: (params: {
    whyStatement: string;
    direction: 'drives' | 'modulates' | 'confounds';
    evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  }) => void;
  onCancel: () => void;
  cycleWarning?: boolean;
}

export const CausalLinkCreator: React.FC<CausalLinkCreatorProps> = ({
  fromFactor,
  toFactor,
  onConfirm,
  onCancel,
  cycleWarning,
}) => {
  const [whyStatement, setWhyStatement] = useState('');
  const [direction, setDirection] = useState<'drives' | 'modulates' | 'confounds'>('drives');
  const [evidenceType, setEvidenceType] = useState<'data' | 'gemba' | 'expert' | 'unvalidated'>(
    'unvalidated'
  );

  const handleConfirm = () => {
    if (!whyStatement.trim()) return;
    onConfirm({ whyStatement: whyStatement.trim(), direction, evidenceType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-edge rounded-xl shadow-2xl w-[min(90vw,480px)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-content">Create Causal Link</h3>
          <button onClick={onCancel} className="p-1 text-content-tertiary hover:text-content">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-content-secondary mb-3">
          Why does <span className="font-medium text-content">{fromFactor}</span>{' '}
          {direction === 'drives' ? 'drive' : direction === 'modulates' ? 'modulate' : 'confound'}{' '}
          <span className="font-medium text-content">{toFactor}</span>?
        </p>

        {cycleWarning && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
            This link would create a cycle in the causal graph and cannot be added.
          </div>
        )}

        <textarea
          value={whyStatement}
          onChange={e => setWhyStatement(e.target.value)}
          placeholder="Describe the mechanism..."
          className="w-full px-3 py-2 text-sm border border-edge rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 mb-3"
          autoFocus
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-content-secondary block mb-1">
              Direction
            </label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value as typeof direction)}
              className="w-full px-2 py-1.5 text-xs border border-edge rounded bg-surface"
            >
              <option value="drives">Drives</option>
              <option value="modulates">Modulates</option>
              <option value="confounds">Confounds</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-content-secondary block mb-1">
              Evidence
            </label>
            <select
              value={evidenceType}
              onChange={e => setEvidenceType(e.target.value as typeof evidenceType)}
              className="w-full px-2 py-1.5 text-xs border border-edge rounded bg-surface"
            >
              <option value="data">Data</option>
              <option value="gemba">Gemba</option>
              <option value="expert">Expert</option>
              <option value="unvalidated">Unvalidated</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs text-content-secondary hover:text-content transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!whyStatement.trim() || cycleWarning}
            className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Export and commit**

```bash
git add packages/ui/src/components/CausalLinkCreator/ packages/ui/src/index.ts
git commit -m "feat(ui): add CausalLinkCreator modal for edge drawing"
```

---

## Phase 4: Report Timeline + Documentation

### Task 12: Wire timeline animation to Report view

**Files:**

- Create: `packages/ui/src/components/ReportEvidenceMap/ReportEvidenceMap.tsx`
- Create: `packages/ui/src/components/ReportEvidenceMap/index.ts`
- Modify: `packages/ui/src/components/ReportView/ReportViewBase.tsx` (add map section)

- [ ] **Step 1: Create ReportEvidenceMap component**

This wraps the Evidence Map with timeline playback controls using the existing `useEvidenceMapTimeline` hook.

```tsx
import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { UseEvidenceMapTimelineReturn } from '@variscout/hooks';

interface ReportEvidenceMapProps {
  /** Evidence Map rendered element */
  evidenceMap: React.ReactNode;
  /** Timeline controls from useEvidenceMapTimeline */
  timeline: UseEvidenceMapTimelineReturn;
}

export const ReportEvidenceMap: React.FC<ReportEvidenceMapProps> = ({ evidenceMap, timeline }) => {
  if (timeline.frames.length === 0) return null;

  return (
    <div className="border border-edge rounded-lg overflow-hidden">
      {/* Map */}
      <div className="h-[400px] bg-surface-secondary">{evidenceMap}</div>

      {/* Playback controls */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface border-t border-edge">
        <button
          onClick={timeline.isPlaying ? timeline.pause : timeline.play}
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors"
          aria-label={timeline.isPlaying ? 'Pause' : 'Play'}
        >
          {timeline.isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => timeline.seek(0)}
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors"
          aria-label="Restart"
        >
          <RotateCcw size={14} />
        </button>

        {/* Progress bar */}
        <div className="flex-1 relative h-1.5 bg-surface-secondary rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${timeline.progress * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={timeline.frames.length - 1}
            value={timeline.currentFrame}
            onChange={e => timeline.seek(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Frame label */}
        <span className="text-xs text-content-secondary min-w-[60px] text-right">
          {timeline.frames[timeline.currentFrame]?.label ?? ''}
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Export and integrate with ReportView**

Add export to `packages/ui/src/index.ts`. Then read the existing `ReportViewBase` to understand where to add the Evidence Map section.

The Evidence Map timeline should appear as a new section in the report, after the investigation summary. The parent app provides the rendered Evidence Map + timeline controls.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/ReportEvidenceMap/ packages/ui/src/index.ts
git commit -m "feat(ui): add ReportEvidenceMap with timeline playback controls"
```

---

### Task 13: Update documentation

**Files:**

- Modify: `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md` (status → delivered)
- Modify: `docs/05-technical/architecture/mental-model-hierarchy.md`
- Modify: `docs/superpowers/specs/2026-04-05-evidence-map-design.md` (add cross-reference)
- Modify: `CLAUDE.md` (update key entry points table)

- [ ] **Step 1: Update spec status**

In `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md`, change `status: draft` to `status: delivered`.

In `docs/superpowers/specs/index.md`, update the status column for the spine spec from `Draft` to `Delivered`.

- [ ] **Step 2: Update mental-model-hierarchy.md**

In `docs/05-technical/architecture/mental-model-hierarchy.md`, update the INVESTIGATE phase description to reflect the new layout:

```markdown
### INVESTIGATE

| Aspect   | Detail                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Goal     | Build understanding through structured learning                                 |
| Method   | Investigation Diamond (4 phases) + Evidence Map as primary workspace            |
| Layout   | PI Panel (left) + Evidence Map center + CoScout (right); FindingsLog via toggle |
| AI       | Phase-aware diamond prompts in CoScout with graph-aware topology context        |
| Key Code | `InvestigationMapView`, `useEvidenceMapData`, Evidence Map 3-layer chart        |
| Exit     | Suspected causes identified, Problem Statement formulated                       |
```

- [ ] **Step 3: Update CLAUDE.md**

In the Task → Documentation table, update the Evidence Map row:

```
| Evidence Map / Causal graph     | docs/superpowers/specs/2026-04-05-evidence-map-design.md, docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md, packages/charts/src/EvidenceMap/, packages/core/src/causalGraph.ts, packages/core/src/evidenceMapLayout.ts |
```

In the Key Entry Points table, add:

```
| `apps/azure/src/components/editor/InvestigationMapView.tsx` | Evidence Map center view in Investigation workspace |
| `packages/ui/src/components/FactorPreviewOverlay/` | Factor Intelligence preview overlay (FRAME→SCOUT) |
```

- [ ] **Step 4: Update evidence-map-design.md**

Add a cross-reference at the top of the original Evidence Map spec:

```markdown
> **See also:** [Evidence Map as Analysis Spine](2026-04-05-evidence-map-spine-design.md) — extends this spec with phase-by-phase integration, PI Panel deep linking, and Investigation workspace redesign.
```

- [ ] **Step 5: Commit documentation**

```bash
git add docs/ CLAUDE.md
git commit -m "docs: update documentation for Evidence Map spine integration"
```

---

## Summary

| Phase                     | Tasks | What It Delivers                                                                                   |
| ------------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| 0: Quick Wins             | 1-4   | Probability plot multi-series, exploredFactors hook, CoScout graph context, panelsStore extensions |
| 1: Factor Preview         | 5-6   | FactorPreviewOverlay at FRAME→SCOUT transition                                                     |
| 2: Investigation Redesign | 7-9   | Evidence Map as Investigation workspace center, PI Panel deep linking                              |
| 3: Direct Interactions    | 10-11 | Right-click context menu, CausalLinkCreator modal                                                  |
| 4: Report + Docs          | 12-13 | Timeline replay in Report view, documentation updates                                              |

Each phase produces a working commit. Phase 0 is the fastest (pure data wiring). Phase 2 is the most impactful (the Investigation workspace redesign).
