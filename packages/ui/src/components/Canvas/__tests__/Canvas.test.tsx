/**
 * Canvas.test.tsx — fresh wedge V1 surface coverage.
 *
 * Replaces the pre-wedge 1500-line legacy file (quarantined 2026-05-25,
 * docs/ephemeral/investigations.md §29). The legacy file deadlocked vitest's
 * mock resolution because it imported the real `@variscout/hooks` package;
 * this file mirrors `CanvasWorkspace.test.tsx`'s full hooks mock (the proven
 * non-hang pattern).
 *
 * Coverage is intentionally focused — most behavior is covered elsewhere:
 *   - Step-overlay capture-as-Finding + recent-activity surfaces
 *     → `internal/__tests__/CanvasStepOverlay.test.tsx` (unit)
 *
 * Note: the legacy 3-CTA canvas-drill "response paths" (Quick action /
 * Focused investigation / Improvement-Project charter) were retired in
 * PR-CS-2 (superseded by Click-to-Explore + inline capture-as-Finding,
 * connective-surface spec §7.3). The L3 mechanism view (`LocalMechanismView`)
 * was trimmed to step-local content in PR-CS-12 (§7.1): its glued WallCanvas +
 * EvidenceMapBase stack and the per-column response-path CTAs are gone, and the
 * canvas L2 'wall' overlay (CanvasWallOverlay) was deleted — the Analyze-tab
 * WallCanvas is the single Wall home (ADR-086). The surviving Wall affordance
 * here is the mobile WallShortcutButton.
 *
 * This file tests Canvas-direct surface only: smoke render, level routing,
 * chip rail visibility by mode, and the mobile Wall shortcut button.
 *
 * Note: the `useHypothesisDrawTool`, `useCanvasKeyboard`, and
 * `useCanvasHypothesisDrawing` mocks below are intentional no-op stubs — none
 * of the tests here exercise hypothesis drawing or canvas keyboard
 * shortcuts. If you add coverage for those flows, copy the richer stateful
 * implementations from `CanvasWorkspace.test.tsx` instead of expanding the
 * stubs in place.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { Finding, ScopeFilter, TimelineWindow } from '@variscout/core';
import { calculateNodeCapability } from '@variscout/core/stats';
import type { ProcessMap } from '@variscout/core/frame';
import type {
  CanvasAnalyzeOverlayModel,
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
} from '@variscout/hooks';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { createTestStepTiming } from '../../../test-utils/stepTiming';

const wallIsMobileRef = vi.hoisted(() => ({ current: false }));
const localMechanismPropsRef = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));
const hasInvestigationContentRef = vi.hoisted(() => ({ current: false }));

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  const React = await import('react');
  return {
    ...actual,
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

vi.mock('../../AnalyzeWall', async () => {
  const React = await import('react');
  return {
    useWallIsMobile: () => wallIsMobileRef.current,
    WallCanvas: () => React.createElement('div', { 'data-testid': 'wall-canvas' }),
  };
});

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-dnd-context">{children}</div>
  ),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock('../internal/LocalMechanismView', async () => {
  const React = await import('react');
  return {
    LocalMechanismView: (props: Record<string, unknown>) => {
      localMechanismPropsRef.current = props;
      return React.createElement('div', { 'data-testid': 'local-mechanism-view' });
    },
  };
});

const canvasFiltersStateRef: {
  current: {
    timelineWindow: TimelineWindow;
    scopeFilter: ScopeFilter | undefined;
    paretoGroupBy: string | undefined;
    activeCanvasLens: CanvasLensId;
    activeCanvasOverlays: CanvasOverlayId[];
    setTimelineWindow: ReturnType<typeof vi.fn>;
    setScopeFilter: ReturnType<typeof vi.fn>;
    setParetoGroupBy: ReturnType<typeof vi.fn>;
    setActiveCanvasLens: ReturnType<typeof vi.fn>;
    setActiveCanvasOverlays: ReturnType<typeof vi.fn>;
    toggleCanvasOverlay: ReturnType<typeof vi.fn>;
    activeCanvasTool: 'select' | 'draw-hypothesis';
    setActiveCanvasTool: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    timelineWindow: { kind: 'cumulative' },
    scopeFilter: undefined,
    paretoGroupBy: undefined,
    activeCanvasLens: 'default',
    activeCanvasOverlays: [],
    setTimelineWindow: vi.fn(),
    setScopeFilter: vi.fn(),
    setParetoGroupBy: vi.fn(),
    setActiveCanvasLens: vi.fn(),
    setActiveCanvasOverlays: vi.fn(),
    toggleCanvasOverlay: vi.fn(),
    activeCanvasTool: 'select',
    setActiveCanvasTool: vi.fn(),
  },
};

vi.mock('@variscout/hooks', () => ({
  CANVAS_LENS_REGISTRY: {
    default: {
      id: 'default',
      label: 'Default',
      enabled: true,
      description: 'Step metrics, specs, and current card state.',
    },
    capability: {
      id: 'capability',
      label: 'Capability',
      enabled: true,
      description: 'Capability, Cpk trust, and step health.',
    },
    defect: {
      id: 'defect',
      label: 'Defect',
      enabled: true,
      description: 'Defect counts projected onto process steps.',
    },
    'process-flow': {
      id: 'process-flow',
      label: 'Process flow',
      enabled: true,
      description: 'Plain process structure without per-card analytics.',
    },
    performance: {
      id: 'performance',
      label: 'Performance',
      enabled: false,
      description: 'Future within-step channel lens.',
    },
  },
  CANVAS_OVERLAY_REGISTRY: {
    investigations: {
      id: 'investigations',
      label: 'Investigations',
      enabled: true,
      description: 'Question and investigation activity projected onto process steps.',
    },
    hypotheses: {
      id: 'hypotheses',
      label: 'Hypotheses',
      enabled: true,
      description: 'Draft causal links rendered as faint step-to-step arrows.',
    },
    'hypothesis-hubs': {
      id: 'hypothesis-hubs',
      label: 'Hypothesis hubs',
      enabled: true,
      description: 'Promoted suspected causes rendered as step markers.',
    },
    findings: {
      id: 'findings',
      label: 'Findings',
      enabled: true,
      description: 'Recent finding pins anchored to process steps.',
    },
  },
  coerceCanvasOverlays: vi.fn((values: unknown[]) =>
    values.filter(value =>
      ['investigations', 'hypotheses', 'hypothesis-hubs', 'findings'].includes(String(value))
    )
  ),
  enabledCanvasOverlays: vi.fn(() => [
    { id: 'investigations', label: 'Investigations', enabled: true, description: '' },
    { id: 'hypotheses', label: 'Hypotheses', enabled: true, description: '' },
    { id: 'hypothesis-hubs', label: 'Hypothesis hubs', enabled: true, description: '' },
    { id: 'findings', label: 'Findings', enabled: true, description: '' },
  ]),
  CANVAS_EMPTY_DROP_ID: 'canvas:empty',
  coerceCanvasLens: vi.fn((value: unknown) =>
    value === 'capability' || value === 'defect' || value === 'process-flow' ? value : 'default'
  ),
  isCanvasLensValidAtLevel: vi.fn(
    (lens: string, level: string) =>
      !(lens === 'process-flow' && (level === 'l1' || level === 'l3'))
  ),
  suggestCanvasLevelForLens: vi.fn((lens: string, level: string) =>
    lens === 'process-flow' && (level === 'l1' || level === 'l3') ? 'l2' : level
  ),
  encodeChipDragId: (chipId: string) => `chip:${chipId}`,
  encodeStepDropId: (stepId: string) => `step:${stepId}`,
  useChipDragAndDrop: ({
    onPlace,
    onCreateStep,
  }: {
    onPlace: (chipId: string, stepId: string) => void;
    onCreateStep: (chipId: string) => void;
  }) => ({
    handleDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => {
      const chipId = String(event.active.id).replace(/^chip:/, '');
      const overId = event.over?.id;
      if (!overId) return;
      if (overId === 'canvas:empty') {
        onCreateStep(chipId);
        return;
      }
      onPlace(chipId, String(overId).replace(/^step:/, ''));
    },
  }),
  useHypothesisDrawTool: vi.fn(() => ({
    state: { phase: 'idle' },
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerCancel: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
  })),
  resolveEndpointToFactor: vi.fn(
    (
      endpoint: { kind: 'step'; id: string } | { kind: 'column'; name: string },
      stepMetricColumns: Record<string, string | undefined>
    ) => (endpoint.kind === 'column' ? endpoint.name : stepMetricColumns[endpoint.id])
  ),
  useCanvasKeyboard: vi.fn(),
  useCanvasViewportShortcuts: vi.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${Object.values(values).join(' ')}` : key,
  }),
  useHasAnalyzeContent: vi.fn(() => hasInvestigationContentRef.current),
  useEvidenceMapData: vi.fn(() => ({
    nodes: [],
    edges: [],
    columnTypeMap: {},
  })),
  useSessionCanvasFilters: vi.fn(() => canvasFiltersStateRef.current),
  useCanvasViewportInput: vi.fn(),
  useCanvasHypothesisDrawing: vi.fn(() => ({
    handlers: {
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onKeyDown: vi.fn(),
    },
    endpointLabel: () => '',
    parseEndpointElement: () => null,
  })),
  useCanvasHypothesisArrows: vi.fn(() => ({
    arrowSegments: [],
    registerCardElement: vi.fn(),
  })),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import { Canvas } from '../index';

const h = (id: string) => id as ProcessHubId;

const emptyMap: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const mapWithSteps: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Mix', order: 0 },
    { id: 'step-2', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const baseStepCards: CanvasStepCardModel[] = [
  {
    stepId: 'step-1',
    stepName: 'Mix',
    assignedColumns: ['Pressure'],
    metricColumn: 'Pressure',
    metricKind: 'numeric',
    values: [10, 11, 12, 13],
    distribution: [],
    stats: {
      mean: 11.5,
      median: 11.5,
      stdDev: 1.29,
      sigmaWithin: 0.89,
      mrBar: 1,
      ucl: 14.17,
      lcl: 8.83,
      outOfSpecPercentage: 0,
    },
    capability: { state: 'no-specs', n: 4, canAddSpecs: true },
  },
  {
    stepId: 'step-2',
    stepName: 'Fill',
    assignedColumns: ['Defect'],
    metricColumn: 'Defect',
    metricKind: 'categorical',
    values: [],
    distribution: [{ label: 'Scratch', count: 7 }],
    capability: { state: 'no-specs', n: 0, canAddSpecs: true },
    defectCount: 7,
  },
];

const investigationOverlays: CanvasAnalyzeOverlayModel = {
  byStep: {
    'step-1': {
      stepId: 'step-1',
      findings: [],
      hypotheses: [
        {
          id: h('hub-1'),
          name: 'Pressure setup drift',
          status: 'proposed',
          focus: { kind: 'suspected-cause', id: h('hub-1') },
        },
      ],
      causalLinks: [],
      investigationCounts: { open: 2, supported: 0, refuted: 0 },
    },
  },
  arrows: [],
  unresolved: { findings: [], hypotheses: [], causalLinks: [] },
};

const wallFinding = {
  id: 'finding-wall-1',
  text: 'Nozzle defects cluster after changeover',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 0,
  createdAt: 0,
  deletedAt: null,
} satisfies Finding;

const baseData = {
  cpkTrend: { data: [], stats: null, specs: { target: 1.33 } },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
};

const baseFilter = {
  availableContext: { hubColumns: [] },
  contextValueOptions: {},
  value: {},
  onChange: vi.fn(),
};

function renderCanvas(overrides: Partial<React.ComponentProps<typeof Canvas>> = {}) {
  const props: React.ComponentProps<typeof Canvas> = {
    map: mapWithSteps,
    availableColumns: ['Pressure', 'Defect'],
    onChange: vi.fn(),
    data: baseData,
    filter: baseFilter,
    stepCards: baseStepCards,
    ...overrides,
  };
  render(<Canvas {...props} />);
  return props;
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('Canvas', () => {
  beforeEach(() => {
    setViewport(1024, 768);
    wallIsMobileRef.current = false;
    localMechanismPropsRef.current = null;
    hasInvestigationContentRef.current = false;
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    canvasFiltersStateRef.current = {
      timelineWindow: { kind: 'cumulative' },
      scopeFilter: undefined,
      paretoGroupBy: undefined,
      activeCanvasLens: 'default',
      activeCanvasOverlays: [],
      setTimelineWindow: vi.fn(),
      setScopeFilter: vi.fn(),
      setParetoGroupBy: vi.fn(),
      setActiveCanvasLens: vi.fn(),
      setActiveCanvasOverlays: vi.fn(),
      toggleCanvasOverlay: vi.fn(),
      activeCanvasTool: 'select',
      setActiveCanvasTool: vi.fn(),
    };
  });

  it('mounts with an empty map without crashing (smoke)', () => {
    renderCanvas({ map: emptyMap, stepCards: [] });
    expect(screen.getByTestId('mock-dnd-context')).toBeInTheDocument();
  });

  it('renders L2 step cards when the viewport is at the process level', () => {
    renderCanvas();
    expect(screen.getByTestId('canvas-step-card-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-card-step-2')).toBeInTheDocument();
  });

  it('renders the connected per-step capability band at the process level', () => {
    renderCanvas({
      data: {
        ...baseData,
        errorSteps: [{ nodeId: 'step-2', label: 'Fill', errorCount: 7 }],
      },
    });
    expect(screen.getByTestId('connected-step-capability-view')).toBeInTheDocument();
    expect(screen.getByTestId('connected-step-node-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('connected-step-box-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-pareto')).toBeInTheDocument();
  });

  it('shows numeric per-step Cpk when authored capabilityScope specs feed the engine', () => {
    const processMap: ProcessMap = {
      ...mapWithSteps,
      nodes: [
        {
          id: 'step-1',
          name: 'Mix',
          order: 0,
          ctqColumn: 'Pressure',
          capabilityScope: { specRules: [{ specs: { lsl: 8, usl: 14, cpkTarget: 1.33 } }] },
        },
        { id: 'step-2', name: 'Fill', order: 1 },
      ],
    };
    const result = calculateNodeCapability('step-1', {
      kind: 'column',
      processMap,
      investigationMeta: {
        nodeMappings: [{ nodeId: 'step-1', measurementColumn: 'Pressure' }],
      },
      data: [{ Pressure: 10 }, { Pressure: 11 }, { Pressure: 12 }, { Pressure: 13 }],
    });

    renderCanvas({
      map: processMap,
      data: {
        ...baseData,
        capabilityNodes: [{ nodeId: 'step-1', label: 'Mix', targetCpk: 1.33, result }],
      },
    });

    expect(screen.getByTestId('connected-step-box-step-1')).toHaveTextContent(/Cpk/);
    expect(screen.getByTestId('connected-step-box-step-1')).not.toHaveTextContent(
      'Cpk unavailable'
    );
  });

  it('passes time value roles into the connected capability band for zero-baseline Values scaling', () => {
    renderCanvas({
      valueRolesByStepId: { 'step-1': 'time' },
      stepCards: [
        {
          ...baseStepCards[0],
          values: [10, 20, 30],
          specs: { lsl: 12, usl: 28, target: 20 },
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Values' }));

    expect(screen.getByTestId('connected-step-box-step-1')).toHaveTextContent('zero baseline');
  });

  it('passes step timings and rows into the connected capability band for the Time axis', () => {
    renderCanvas({
      rows: [
        {
          Mix_start: '2026-06-08T08:00:00.000Z',
          Mix_end: '2026-06-08T08:10:00.000Z',
        },
      ],
      stepTimings: [
        createTestStepTiming({
          stepId: 'step-1',
          startColumn: 'Mix_start',
          endColumn: 'Mix_end',
        }),
      ],
    });

    expect(screen.getByRole('button', { name: 'Time' })).toBeInTheDocument();
  });

  it('does not render the removed wall shortcut button', () => {
    wallIsMobileRef.current = true;
    hasInvestigationContentRef.current = true;
    const onOpenWall = vi.fn();
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={['Pressure', 'Defect']}
        onChange={vi.fn()}
        data={baseData}
        filter={baseFilter}
        stepCards={baseStepCards}
        findings={[wallFinding]}
        investigationOverlays={investigationOverlays}
        onOpenWall={onOpenWall}
      />
    );
    expect(screen.queryByTestId('canvas-wall-shortcut-button')).not.toBeInTheDocument();
    expect(onOpenWall).not.toHaveBeenCalled();
  });
});
