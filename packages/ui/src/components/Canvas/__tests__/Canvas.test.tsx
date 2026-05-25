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
 *   - 3 response-path CTA rendering + click + hidden-when-no-handler
 *     → `internal/__tests__/CanvasStepOverlay.test.tsx` (unit)
 *     → `internal/__tests__/responsePathCta.test.ts` (state machine)
 *   - Workspace integration of step-overlay callbacks → app shell
 *     → `CanvasWorkspace.test.tsx:1093`
 *
 * This file tests Canvas-direct surface only: smoke render, level routing,
 * chip rail visibility by mode, Wall overlay toggle visibility, and one
 * wedge-V1 integration check (step click → overlay shows 3 CTAs with
 * correct testids per wedge spec §3.3.4).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { Finding, ScopeFilter, TimelineWindow } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type {
  CanvasInvestigationOverlayModel,
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
} from '@variscout/hooks';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';

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

vi.mock('../../InvestigationWall', async () => {
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
    yamazumi: {
      id: 'yamazumi',
      label: 'Yamazumi',
      enabled: false,
      description: 'Future time-study lens.',
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
      description: 'Promoted mechanism branches rendered as step markers.',
    },
    findings: {
      id: 'findings',
      label: 'Findings',
      enabled: true,
      description: 'Recent finding pins anchored to process steps.',
    },
    wall: {
      id: 'wall',
      label: 'Wall',
      enabled: true,
      description: 'Investigation Wall overlay.',
    },
  },
  coerceCanvasOverlays: vi.fn((values: unknown[]) =>
    values.filter(value =>
      ['investigations', 'hypotheses', 'hypothesis-hubs', 'findings', 'wall'].includes(
        String(value)
      )
    )
  ),
  enabledCanvasOverlays: vi.fn(() => [
    { id: 'investigations', label: 'Investigations', enabled: true, description: '' },
    { id: 'hypotheses', label: 'Hypotheses', enabled: true, description: '' },
    { id: 'hypothesis-hubs', label: 'Hypothesis hubs', enabled: true, description: '' },
    { id: 'findings', label: 'Findings', enabled: true, description: '' },
    { id: 'wall', label: 'Wall', enabled: true, description: '' },
  ]),
  CANVAS_EMPTY_DROP_ID: 'canvas:empty',
  coerceCanvasLens: vi.fn((value: unknown) =>
    value === 'capability' || value === 'defect' || value === 'process-flow' ? value : 'default'
  ),
  isCanvasLensValidAtLevel: vi.fn(
    (lens: string, level: string) =>
      !(
        (lens === 'yamazumi' && level === 'l1') ||
        (lens === 'process-flow' && (level === 'l1' || level === 'l3'))
      )
  ),
  suggestCanvasLevelForLens: vi.fn((lens: string, level: string) =>
    (lens === 'yamazumi' && level === 'l1') ||
    (lens === 'process-flow' && (level === 'l1' || level === 'l3'))
      ? 'l2'
      : level
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
  useHasInvestigationContent: vi.fn(() => hasInvestigationContentRef.current),
  useSharedWallProps: vi.fn(
    ({
      findings,
      processMap,
      problemCpk,
      eventsPerWeek,
      activeColumns,
    }: {
      findings: unknown[];
      processMap: unknown;
      problemCpk: number;
      eventsPerWeek: number;
      activeColumns: ReadonlyArray<string> | undefined;
    }) => ({
      findings,
      processMap,
      problemCpk,
      eventsPerWeek,
      activeColumns,
      hubs: [],
      questions: [],
      problemContributionTree: undefined,
    })
  ),
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

const investigationOverlays: CanvasInvestigationOverlayModel = {
  byStep: {
    'step-1': {
      stepId: 'step-1',
      questions: [
        {
          id: 'q-1',
          text: 'Does pressure drive fill?',
          status: 'open',
          factor: 'Pressure',
          focus: { kind: 'question', id: 'q-1', questionId: 'q-1' },
        },
      ],
      findings: [],
      hypotheses: [
        {
          id: h('hub-1'),
          name: 'Pressure setup drift',
          status: 'proposed',
          questionId: 'q-1',
          focus: { kind: 'suspected-cause', id: h('hub-1'), questionId: 'q-1' },
        },
      ],
      causalLinks: [],
      investigationCounts: { open: 2, supported: 0, refuted: 0 },
    },
  },
  arrows: [],
  unresolved: { questions: [], findings: [], hypotheses: [], causalLinks: [] },
};

const wallFinding = {
  id: 'finding-wall-1',
  text: 'Nozzle defects cluster after changeover',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 0,
  investigationId: 'inv-1',
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

  it('opens the step overlay with all three wedge-V1 response-path CTAs on step click', () => {
    const onQuickAction = vi.fn();
    const onFocusedInvestigation = vi.fn();
    const onCharter = vi.fn();
    renderCanvas({ onQuickAction, onFocusedInvestigation, onCharter });

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(screen.getByTestId('canvas-cta-quick-action')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-cta-focused-investigation')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-cta-charter')).toBeInTheDocument();
  });

  it('fires onCharter with the step id when the Charter CTA is clicked (wedge V1 §3.3.4)', () => {
    const onCharter = vi.fn();
    renderCanvas({
      onQuickAction: vi.fn(),
      onFocusedInvestigation: vi.fn(),
      onCharter,
    });

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(screen.getByTestId('canvas-cta-charter'));

    expect(onCharter).toHaveBeenCalledWith('step-1');
  });

  it('hides the Charter CTA when no onCharter handler is provided (hidden, not teased)', () => {
    renderCanvas({ onQuickAction: vi.fn(), onFocusedInvestigation: vi.fn() });

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(screen.queryByTestId('canvas-cta-charter')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-cta-quick-action')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-cta-focused-investigation')).toBeInTheDocument();
  });

  it('renders the mobile Wall shortcut button only when on mobile, investigation content exists, and onOpenWall is wired', () => {
    wallIsMobileRef.current = true;
    hasInvestigationContentRef.current = false;
    const onOpenWall = vi.fn();
    const { unmount } = render(
      <Canvas
        map={mapWithSteps}
        availableColumns={['Pressure', 'Defect']}
        onChange={vi.fn()}
        data={baseData}
        filter={baseFilter}
        stepCards={baseStepCards}
        findings={[]}
        investigationOverlays={investigationOverlays}
        onOpenWall={onOpenWall}
      />
    );
    expect(screen.queryByTestId('canvas-wall-shortcut-button')).not.toBeInTheDocument();
    unmount();

    hasInvestigationContentRef.current = true;
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
    expect(screen.getByTestId('canvas-wall-shortcut-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('canvas-wall-shortcut-button'));
    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });
});
