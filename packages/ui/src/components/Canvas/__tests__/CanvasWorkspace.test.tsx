import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type {
  Finding,
  ScopeFilter,
  SpecLimits,
  StepCapabilityStamp,
  TimelineWindow,
} from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type {
  CanvasInvestigationOverlayModel,
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
} from '@variscout/hooks';
import {
  useCanvasInvestigationOverlays,
  useCanvasStepCards,
  useSharedWallProps,
} from '@variscout/hooks';
import {
  getCanvasViewportInitialState,
  useCanvasStore,
  useCanvasViewportStore,
  type ProcessHubId,
} from '@variscout/stores';

const wallIsMobileRef = vi.hoisted(() => ({ current: false }));
const localMechanismPropsRef = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

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
    WallCanvas: ({
      findings,
      problemCpk,
      eventsPerWeek,
      activeColumns,
    }: {
      findings?: unknown[];
      problemCpk?: unknown;
      eventsPerWeek?: unknown;
      activeColumns?: ReadonlyArray<string>;
    }) =>
      React.createElement('div', {
        'data-testid': 'wall-canvas',
        'data-findings-count': String(findings?.length ?? 0),
        'data-problem-cpk': String(problemCpk),
        'data-events-per-week': String(eventsPerWeek),
        'data-active-columns': (activeColumns ?? []).join(','),
      }),
  };
});

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
  }) => (
    <div>
      <button
        type="button"
        data-testid="test-drop-bake-time-on-step-1"
        onClick={() =>
          onDragEnd?.({ active: { id: 'chip:Bake_Time' }, over: { id: 'step:step-1' } })
        }
      >
        drop Bake_Time on step-1
      </button>
      <button
        type="button"
        data-testid="test-drop-machine-on-empty-canvas"
        onClick={() =>
          onDragEnd?.({ active: { id: 'chip:Machine' }, over: { id: 'canvas:empty' } })
        }
      >
        drop Machine on empty canvas
      </button>
      {children}
    </div>
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

const opsToggleStateRef: {
  current: {
    mode: 'spatial' | 'full';
    setMode: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    mode: 'spatial',
    setMode: vi.fn(),
    toggle: vi.fn(),
  },
};

const mockStepCards: CanvasStepCardModel[] = [
  {
    stepId: 'step-1',
    stepName: 'Bake',
    assignedColumns: ['Bake_Time'],
    metricColumn: 'Bake_Time',
    metricKind: 'numeric',
    values: [29, 30, 31],
    distribution: [],
    stats: {
      mean: 30,
      median: 30,
      stdDev: 1,
      sigmaWithin: 1,
      mrBar: 1,
      ucl: 33,
      lcl: 27,
      cp: 0.67,
      cpk: 0.67,
      outOfSpecPercentage: 0,
    },
    specs: { target: 30, lsl: 28, usl: 32 },
    capability: {
      state: 'suppressed',
      n: 3,
      confidence: 'insufficient',
      target: 1.33,
      canAddSpecs: false,
    },
    defectCount: 2,
  },
];

const mockTwoStepCards: CanvasStepCardModel[] = [
  mockStepCards[0],
  {
    stepId: 'step-2',
    stepName: 'Fill',
    assignedColumns: ['Fill_Defect'],
    metricColumn: 'Fill_Defect',
    metricKind: 'categorical',
    values: [],
    distribution: [{ label: 'Scratch', count: 2 }],
    capability: {
      state: 'no-specs',
      n: 0,
      canAddSpecs: true,
    },
    defectCount: 2,
  },
];

const mockInvestigationOverlays: CanvasInvestigationOverlayModel = {
  byStep: {
    'step-1': {
      stepId: 'step-1',
      questions: [
        {
          id: 'q-1',
          text: 'Does bake time drive fill weight?',
          status: 'open',
          factor: 'Bake_Time',
          focus: { kind: 'question', id: 'q-1', questionId: 'q-1' },
        },
      ],
      findings: [],
      hypotheses: [],
      causalLinks: [],
      investigationCounts: { open: 1, supported: 0, refuted: 0 },
    },
  },
  arrows: [],
  unresolved: { questions: [], findings: [], hypotheses: [], causalLinks: [] },
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
    {
      id: 'investigations',
      label: 'Investigations',
      enabled: true,
      description: 'Question and investigation activity projected onto process steps.',
    },
    {
      id: 'hypotheses',
      label: 'Hypotheses',
      enabled: true,
      description: 'Draft causal links rendered as faint step-to-step arrows.',
    },
    {
      id: 'hypothesis-hubs',
      label: 'Hypothesis hubs',
      enabled: true,
      description: 'Promoted mechanism branches rendered as step markers.',
    },
    {
      id: 'findings',
      label: 'Findings',
      enabled: true,
      description: 'Recent finding pins anchored to process steps.',
    },
    {
      id: 'wall',
      label: 'Wall',
      enabled: true,
      description: 'Investigation Wall overlay.',
    },
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
  useHypothesisDrawTool: vi.fn(({ active }: { active: boolean }) => {
    const [state, setState] = React.useState<{ phase: string; [key: string]: unknown }>({
      phase: 'idle',
    });
    const reset = React.useCallback(() => setState({ phase: 'idle' }), []);
    return {
      state,
      onPointerDown: vi.fn((endpoint: unknown, at: unknown) => {
        if (!active) return;
        setState({ phase: 'drawing', source: endpoint, anchorAt: at, cursorAt: at, hover: null });
      }),
      onPointerMove: vi.fn((at: unknown, hover: unknown) => {
        if (!active) return;
        setState(current =>
          current.phase === 'drawing' ? { ...current, cursorAt: at, hover } : current
        );
      }),
      onPointerUp: vi.fn((endpoint: unknown, at: unknown) => {
        if (!active) return;
        setState(current =>
          current.phase === 'drawing' && endpoint
            ? {
                phase: 'awaitingForm',
                source: current.source,
                target: endpoint,
                releaseAt: at,
              }
            : current
        );
      }),
      onPointerCancel: reset,
      cancel: reset,
      reset,
    };
  }),
  resolveEndpointToFactor: vi.fn(
    (
      endpoint: { kind: 'step'; id: string } | { kind: 'column'; name: string },
      stepMetricColumns: Record<string, string | undefined>
    ) => (endpoint.kind === 'column' ? endpoint.name : stepMetricColumns[endpoint.id])
  ),
  useCanvasKeyboard: ({
    onUndo,
    onRedo,
    onToggleMode,
    onExitAuthorMode,
  }: {
    onUndo: () => void;
    onRedo: () => void;
    onToggleMode: () => void;
    onExitAuthorMode: () => void;
  }) => {
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if ((event.metaKey || event.ctrlKey) && key === 'z') {
          if (event.shiftKey) onRedo();
          else onUndo();
        } else if (event.ctrlKey && key === 'y') {
          onRedo();
        } else if (key === 'e') {
          onToggleMode();
        } else if (event.key === 'Escape') {
          onExitAuthorMode();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo, onToggleMode, onExitAuthorMode]);
  },
  useCanvasViewportShortcuts: vi.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${Object.values(values).join(' ')}` : key,
  }),
  useProductionLineGlanceFilter: vi.fn(() => ({
    value: {},
    onChange: vi.fn(),
  })),
  useProductionLineGlanceOpsToggle: vi.fn(() => ({
    mode: opsToggleStateRef.current.mode,
    setMode: opsToggleStateRef.current.setMode,
    toggle: opsToggleStateRef.current.toggle,
  })),
  useProductionLineGlanceData: vi.fn(() => ({
    cpkTrend: { data: [], stats: null, specs: {} },
    cpkGapTrend: { series: [], stats: null },
    capabilityNodes: [],
    errorSteps: [],
    availableContext: { hubColumns: [], tributaryGroups: [] },
    contextValueOptions: {},
  })),
  useCanvasStepCards: vi.fn(() => ({ cards: mockStepCards })),
  useCanvasInvestigationOverlays: vi.fn(() => ({ overlays: mockInvestigationOverlays })),
  useHasInvestigationContent: vi.fn(
    ({ findingsCount }: { findingsCount: number }) => findingsCount > 0
  ),
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
  useSessionCanvasFilters: vi.fn(() => canvasFiltersStateRef.current),
  useCanvasViewportInput: vi.fn(),
}));

import { CanvasWorkspace } from '../CanvasWorkspace';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

const SIGNALS = { hasIntervention: false, sustainmentConfirmed: false };

const rawData = [
  { Fill_Weight: 12, Bake_Time: 30, Machine: 'A' },
  { Fill_Weight: 13, Bake_Time: 31, Machine: 'B' },
  { Fill_Weight: 11, Bake_Time: 29, Machine: 'A' },
];

const wallFinding = {
  id: 'finding-wall-1',
  text: 'Bake defects cluster after changeover',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 0,
  investigationId: 'inv-1',
  createdAt: 0,
  deletedAt: null,
} satisfies Finding;

const emptyMap = (): ProcessMap => ({
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
});

const mapWithStep = (): ProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Bake', order: 0, ctqColumn: 'Bake_Time' }],
  tributaries: [],
  ctsColumn: 'Fill_Weight',
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
});

const readModeMapWithStep = (): ProcessMap => ({
  ...mapWithStep(),
  assignments: { Bake_Time: 'step-1', Machine: 'step-1' },
});

const mapWithSecondStep = (): ProcessMap => ({
  ...mapWithStep(),
  nodes: [
    { id: 'step-1', name: 'Bake', order: 0, ctqColumn: 'Bake_Time' },
    { id: 'step-2', name: 'Pack', order: 1 },
  ],
  updatedAt: '2026-05-04T00:01:00.000Z',
});

const readModeMapWithSecondStep = (): ProcessMap => ({
  ...mapWithSecondStep(),
  assignments: { Bake_Time: 'step-1', Machine: 'step-2' },
});

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof CanvasWorkspace>> = {}) {
  const props: React.ComponentProps<typeof CanvasWorkspace> = {
    rawData,
    outcome: 'Fill_Weight',
    factors: [],
    measureSpecs: {},
    processContext: null,
    signals: SIGNALS,
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setMeasureSpec: vi.fn(),
    setProcessContext: vi.fn(),
    onSeeData: vi.fn(),
    ...overrides,
  };
  render(<CanvasWorkspace {...props} />);
  return props;
}

describe('CanvasWorkspace', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    wallIsMobileRef.current = false;
    localMechanismPropsRef.current = null;
    useCanvasStore.setState(useCanvasStore.getInitialState());
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    vi.mocked(useSharedWallProps).mockClear();
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
    opsToggleStateRef.current = {
      mode: 'spatial',
      setMode: vi.fn(),
      toggle: vi.fn(),
    };
    vi.mocked(useCanvasStepCards).mockImplementation(() => ({ cards: mockStepCards }));
    vi.mocked(useCanvasInvestigationOverlays).mockImplementation(() => ({
      overlays: mockInvestigationOverlays,
    }));
  });

  it('renders b0 with the lightweight picker and collapsed canvas expander', () => {
    renderWorkspace({ processContext: { processMap: emptyMap() } });

    expect(screen.getByTestId('frame-view-b0')).toBeInTheDocument();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();
    expect(screen.queryByTestId('layered-process-view')).toBeNull();
  });

  it('renders b1/b2 directly with the card surface and authoring map', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-card-surface')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-authoring-map')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-card-step-1')).toBeInTheDocument();
    expect(screen.queryByTestId('band-operations')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ops-band-dashboard')).not.toBeInTheDocument();
  });

  it('opens at the URL level when ?level is present', () => {
    window.history.replaceState(null, '', '/?level=l1');

    renderWorkspace({
      canvasViewportHubId: h('hub-url-level'),
      processContext: { processMap: mapWithStep() },
    });

    expect(useCanvasViewportStore.getState().getViewport(h('hub-url-level')).currentLevel).toBe(
      'l1'
    );
    expect(screen.getByTestId('outcome-distribution')).toBeInTheDocument();
  });

  it('redirects a bare L3 URL level back to L2 when no focal step exists', () => {
    window.history.replaceState(null, '', '/?level=l3');

    renderWorkspace({
      canvasViewportHubId: h('hub-url-l3-bare'),
      processContext: { processMap: mapWithStep() },
    });

    expect(useCanvasViewportStore.getState().getViewport(h('hub-url-l3-bare')).currentLevel).toBe(
      'l2'
    );
    expect(window.location.search).toBe('?level=l2');
  });

  it('opens an L3 URL level when a focalStep query points to a process step', () => {
    window.history.replaceState(null, '', '/?level=l3&focalStep=step-1');

    renderWorkspace({
      canvasViewportHubId: h('hub-url-l3-focal'),
      processContext: { processMap: mapWithStep() },
    });

    expect(useCanvasViewportStore.getState().getViewport(h('hub-url-l3-focal'))).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });
    expect(window.location.search).toBe('?level=l3&focalStep=step-1');
  });

  it('waits for a loaded process map before resolving an L3 focalStep URL', () => {
    window.history.replaceState(null, '', '/?level=l3&focalStep=step-1');

    const Harness = () => {
      const [processContext, setProcessContext] =
        React.useState<React.ComponentProps<typeof CanvasWorkspace>['processContext']>(null);

      return (
        <>
          <button
            type="button"
            data-testid="load-process-map"
            onClick={() => setProcessContext({ processMap: mapWithStep() })}
          >
            load process map
          </button>
          <CanvasWorkspace
            canvasViewportHubId="hub-url-l3-async-focal"
            rawData={rawData}
            outcome="Fill_Weight"
            factors={[]}
            measureSpecs={{}}
            processContext={processContext}
            signals={SIGNALS}
            setOutcome={vi.fn()}
            setFactors={vi.fn()}
            setMeasureSpec={vi.fn()}
            setProcessContext={next => setProcessContext(next)}
            onSeeData={vi.fn()}
          />
        </>
      );
    };

    render(<Harness />);

    expect(
      useCanvasViewportStore.getState().getViewport(h('hub-url-l3-async-focal'))
    ).toMatchObject({
      currentLevel: 'l2',
    });
    expect(window.location.search).toBe('?level=l3&focalStep=step-1');

    fireEvent.click(screen.getByTestId('load-process-map'));

    expect(
      useCanvasViewportStore.getState().getViewport(h('hub-url-l3-async-focal'))
    ).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });
    expect(window.location.search).toBe('?level=l3&focalStep=step-1');
  });

  it('passes priorStepStats into useCanvasStepCards', () => {
    const priorStepStats = new Map<string, StepCapabilityStamp>([
      ['step-1', { stepId: 'step-1', n: 30, mean: 30, cpk: 0.8 }],
    ]);

    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      priorStepStats,
    });

    expect(useCanvasStepCards).toHaveBeenCalledWith(
      expect.objectContaining({
        priorStepStats,
      })
    );
  });

  it('threads raw rows from CanvasWorkspace into the read-mode L3 local mechanism view', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-workspace-l3'), 'l3', 'step-1');

    renderWorkspace({
      canvasViewportHubId: h('hub-workspace-l3'),
      processContext: { processMap: readModeMapWithStep() },
    });

    expect(screen.getByTestId('local-mechanism-view')).toBeInTheDocument();
    expect(localMechanismPropsRef.current).toMatchObject({
      rows: rawData,
      outcomeColumn: 'Fill_Weight',
    });
  });

  it('routes author-mode L3 away from the local mechanism view', () => {
    useCanvasViewportStore.getState().setLevel(h('hub-workspace-l3-author'), 'l3', 'step-1');

    renderWorkspace({
      canvasViewportHubId: h('hub-workspace-l3-author'),
      processContext: { processMap: mapWithStep() },
    });

    expect(screen.queryByTestId('local-mechanism-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('author-l3-view')).toBeInTheDocument();
    expect(localMechanismPropsRef.current).toBeNull();
  });

  it('keeps the same focal step while switching author/read modes in L3', () => {
    const hubId = h('hub-workspace-l3-mode-switch');
    useCanvasViewportStore.getState().setLevel(hubId, 'l3', 'step-2');

    renderWorkspace({
      canvasViewportHubId: hubId,
      processContext: { processMap: readModeMapWithSecondStep() },
    });

    expect(localMechanismPropsRef.current).toMatchObject({ focalStepId: 'step-2' });
    expect(useCanvasViewportStore.getState().getViewport(hubId).focalStepId).toBe('step-2');

    fireEvent.click(screen.getByRole('button', { name: /edit canvas/i }));

    expect(screen.getByTestId('author-l3-view')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pack' })).toBeInTheDocument();
    expect(useCanvasViewportStore.getState().getViewport(hubId).focalStepId).toBe('step-2');

    fireEvent.click(screen.getByRole('button', { name: /lock canvas/i }));

    expect(screen.getByTestId('local-mechanism-view')).toBeInTheDocument();
    expect(localMechanismPropsRef.current).toMatchObject({ focalStepId: 'step-2' });
    expect(useCanvasViewportStore.getState().getViewport(hubId).focalStepId).toBe('step-2');
  });

  it('wires lens changes through session canvas filters', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    fireEvent.click(screen.getByRole('button', { name: /capability lens/i }));

    expect(canvasFiltersStateRef.current.setActiveCanvasLens).toHaveBeenCalledWith('capability');
  });

  it('wires overlay changes through session canvas filters', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    fireEvent.click(screen.getByRole('button', { name: /investigations overlay/i }));

    expect(canvasFiltersStateRef.current.toggleCanvasOverlay).toHaveBeenCalledWith(
      'investigations'
    );
  });

  it('threads Wall overlay data props into Canvas', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      activeCanvasOverlays: ['wall'],
    };

    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      findings: [wallFinding],
      problemCpk: 0.74,
      eventsPerWeek: 12,
      activeColumns: ['Bake_Time', 'Machine'],
      onOpenWall: vi.fn(),
    });

    expect(screen.getByTestId('canvas-wall-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-findings-count', '1');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-problem-cpk', '0.74');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-events-per-week', '12');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute(
      'data-active-columns',
      'Bake_Time,Machine'
    );
  });

  it('threads process hub id into Canvas Wall props', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      activeCanvasOverlays: ['wall'],
    };

    renderWorkspace({
      processContext: { processHubId: h('hub-frame-2'), processMap: mapWithStep() },
      findings: [wallFinding],
      onOpenWall: vi.fn(),
    });

    expect(useSharedWallProps).toHaveBeenCalledWith(
      expect.objectContaining({
        hubId: h('hub-frame-2'),
      })
    );
  });

  it('uses explicit canvas viewport hub id when process context has no hub id', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      activeCanvasOverlays: ['wall'],
    };

    renderWorkspace({
      canvasViewportHubId: 'session-hub-1',
      processContext: { processMap: mapWithStep() },
      findings: [wallFinding],
      onOpenWall: vi.fn(),
    });

    expect(useSharedWallProps).toHaveBeenCalledWith(
      expect.objectContaining({
        hubId: 'session-hub-1',
      })
    );
  });

  it('wires hypothesis draw tool changes through session canvas filters', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    expect(canvasFiltersStateRef.current.setActiveCanvasTool).toHaveBeenCalledWith(
      'draw-hypothesis'
    );
  });

  it('forwards saved draw-flow hypotheses to the app shell callback with the selected question id', () => {
    const onAddCausalLink = vi.fn();
    vi.mocked(useCanvasStepCards).mockReturnValue({ cards: mockTwoStepCards });
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      activeCanvasTool: 'draw-hypothesis',
    };

    renderWorkspace({
      processContext: { processMap: mapWithSecondStep() },
      questions: [
        {
          id: 'q-1',
          text: 'Does bake time drive fill defects?',
          status: 'open',
          linkedFindingIds: [],
          createdAt: 0,
          updatedAt: 0,
          deletedAt: null,
          investigationId: 'inv-1',
        },
      ],
      onAddCausalLink,
    });

    fireEvent.pointerDown(screen.getByTestId('canvas-step-card-step-1'), {
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });
    fireEvent.pointerUp(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });
    fireEvent.change(screen.getByLabelText(/because/i), {
      target: { value: 'bake time variation creates fill defects' },
    });
    fireEvent.change(screen.getByLabelText(/link to question/i), { target: { value: 'q-1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onAddCausalLink).toHaveBeenCalledWith(
      'Bake_Time',
      'Fill_Defect',
      'bake time variation creates fill defects',
      { questionIds: ['q-1'] }
    );
  });

  it('forwards causal link removal from the step overlay to the app shell callback', () => {
    const onRemoveCausalLink = vi.fn();
    vi.mocked(useCanvasInvestigationOverlays).mockReturnValue({
      overlays: {
        ...mockInvestigationOverlays,
        byStep: {
          ...mockInvestigationOverlays.byStep,
          'step-1': {
            ...mockInvestigationOverlays.byStep['step-1'],
            causalLinks: [
              {
                id: 'link-1',
                fromStepId: 'step-1',
                toStepId: 'step-2',
                label: 'Bake time drives fill defects',
                questionId: 'q-1',
                focus: { kind: 'causal-link', id: 'link-1', questionId: 'q-1' },
              },
            ],
          },
        },
      },
    });

    renderWorkspace({
      processContext: { processMap: mapWithSecondStep() },
      onRemoveCausalLink,
    });

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(
      screen.getByRole('button', { name: /remove hypothesis bake time drives fill defects/i })
    );

    expect(onRemoveCausalLink).toHaveBeenCalledWith('link-1');
  });

  it('forwards step overlay response paths to app shell callbacks', () => {
    const onQuickAction = vi.fn();
    const onFocusedInvestigation = vi.fn();
    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      onQuickAction,
      onFocusedInvestigation,
    });

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(screen.getByRole('button', { name: /quick action/i }));
    fireEvent.click(screen.getByRole('button', { name: /focused investigation/i }));

    expect(onQuickAction).toHaveBeenCalledWith('step-1');
    expect(onFocusedInvestigation).toHaveBeenCalledWith('step-1');
  });

  it('writes per-step CTQ specs through the provided spec callback', () => {
    const setMeasureSpec = vi.fn();
    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      measureSpecs: { Bake_Time: { target: 30, lsl: 28, usl: 32 } },
      setMeasureSpec,
    });

    fireEvent.change(screen.getByTestId('process-map-step-specs-step-1-usl'), {
      target: { value: '34' },
    });

    expect(setMeasureSpec).toHaveBeenCalledWith(
      'Bake_Time',
      expect.objectContaining({ target: 30, lsl: 28, usl: 34 })
    );
  });

  it('writes CTS specs through the provided spec callback', () => {
    const setMeasureSpec = vi.fn();
    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      measureSpecs: { Fill_Weight: { target: 12, lsl: 11, usl: 13 } },
      setMeasureSpec,
    });

    fireEvent.change(screen.getByTestId('process-map-ocean-cpk-target'), {
      target: { value: '1.67' },
    });

    expect(setMeasureSpec).toHaveBeenCalledWith('Fill_Weight', {
      target: 12,
      lsl: 11,
      usl: 13,
      cpkTarget: 1.67,
    } satisfies Partial<SpecLimits>);
  });

  it('does not seed sigma-derived spec suggestions in b0', () => {
    renderWorkspace({ processContext: { processMap: emptyMap() } });

    expect(screen.queryByText(/suggested/i)).not.toBeInTheDocument();
  });

  it('fires the See Data callback from b0', () => {
    const onSeeData = vi.fn();
    renderWorkspace({ processContext: { processMap: emptyMap() }, onSeeData });

    fireEvent.click(screen.getByTestId('see-the-data-cta'));

    expect(onSeeData).toHaveBeenCalledTimes(1);
  });

  it('renders and clears session canvas filter chips', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      timelineWindow: { kind: 'rolling', windowDays: 7 },
    };
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    expect(screen.getByTestId('filter-chip-window')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Clear Last 7d/i));

    expect(canvasFiltersStateRef.current.setTimelineWindow).toHaveBeenCalledWith({
      kind: 'cumulative',
    });
  });

  it('derives unassigned chips from detected columns excluding outcome, run-order, and assigned columns', () => {
    renderWorkspace({
      rawData: Array.from({ length: 51 }, (_, index) => ({
        Fill_Weight: 12 + (index % 3),
        Bake_Time: 30 + (index % 5),
        Oven_Temp: 180 + index,
        Machine: index % 2 === 0 ? 'A' : 'B',
        Operator_Note: `batch note ${index}`,
        Timestamp: `2026-05-01T00:${String(index).padStart(2, '0')}:00.000Z`,
      })),
      outcome: 'Fill_Weight',
      processContext: {
        processMap: {
          ...mapWithStep(),
          assignments: { Machine: 'step-1' },
        },
      },
    });

    expect(screen.getByTestId('chip-rail-item-Oven_Temp')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-Bake_Time')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-Oven_Temp')).toHaveTextContent('factor');
    expect(screen.queryByTestId('chip-rail-item-Fill_Weight')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-rail-item-Timestamp')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-rail-item-Machine')).not.toBeInTheDocument();
  });

  it('persists store-backed chip placement and empty-canvas step creation through setProcessContext', () => {
    const setProcessContext = vi.fn();
    renderWorkspace({
      processContext: { processMap: mapWithStep() },
      setProcessContext,
    });

    fireEvent.click(screen.getByTestId('test-drop-bake-time-on-step-1'));

    expect(setProcessContext).toHaveBeenLastCalledWith(
      expect.objectContaining({
        processMap: expect.objectContaining({
          assignments: expect.objectContaining({ Bake_Time: 'step-1' }),
        }),
      })
    );

    fireEvent.click(screen.getByTestId('test-drop-machine-on-empty-canvas'));
    fireEvent.click(screen.getByRole('button', { name: /create step/i }));

    expect(setProcessContext).toHaveBeenLastCalledWith(
      expect.objectContaining({
        processMap: expect.objectContaining({
          assignments: expect.objectContaining({
            Machine: expect.stringMatching(/^step-machine-/),
          }),
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringMatching(/^step-machine-/),
              name: 'Machine',
            }),
          ]),
        }),
      })
    );
  });

  it('keeps canvasStore undo history after the persisted map rerenders from the parent', () => {
    const Harness = () => {
      const [processContext, setProcessContext] = React.useState<
        NonNullable<React.ComponentProps<typeof CanvasWorkspace>['processContext']>
      >({ processMap: mapWithStep() });

      return (
        <CanvasWorkspace
          rawData={rawData}
          outcome="Fill_Weight"
          factors={[]}
          measureSpecs={{}}
          processContext={processContext}
          signals={SIGNALS}
          setOutcome={vi.fn()}
          setFactors={vi.fn()}
          setMeasureSpec={vi.fn()}
          setProcessContext={next => setProcessContext(next ?? { processMap: mapWithStep() })}
          onSeeData={vi.fn()}
        />
      );
    };

    render(<Harness />);

    fireEvent.click(screen.getByTestId('test-drop-bake-time-on-step-1'));

    expect(useCanvasStore.getState().historyDepth()).toBe(1);
  });

  it('does not rehydrate or clear history when an equal-signature parent map rerenders', () => {
    const originalHydrate = useCanvasStore.getState().hydrateCanvasDocument;
    const hydrateCanvasDocument = vi.fn(originalHydrate);
    useCanvasStore.setState({ hydrateCanvasDocument });

    const cloneMap = (map: ProcessMap): ProcessMap => JSON.parse(JSON.stringify(map));

    const readActualCanvasState = useCanvasStore.getState;

    const Harness = () => {
      const [processContext, setProcessContext] = React.useState<
        NonNullable<React.ComponentProps<typeof CanvasWorkspace>['processContext']>
      >({ processMap: mapWithStep() });

      return (
        <>
          <button
            type="button"
            data-testid="sync-parent-to-store-map"
            onClick={() => {
              setProcessContext({ processMap: cloneMap(readActualCanvasState().canonicalMap) });
            }}
          >
            sync parent to store map
          </button>
          <CanvasWorkspace
            rawData={rawData}
            outcome="Fill_Weight"
            factors={[]}
            measureSpecs={{}}
            processContext={processContext}
            signals={SIGNALS}
            setOutcome={vi.fn()}
            setFactors={vi.fn()}
            setMeasureSpec={vi.fn()}
            setProcessContext={next => setProcessContext(next ?? { processMap: mapWithStep() })}
            onSeeData={vi.fn()}
          />
        </>
      );
    };

    render(<Harness />);

    act(() => {
      useCanvasStore.getState().placeChipOnStep('Bake_Time', 'step-1');
    });

    expect(useCanvasStore.getState().historyDepth()).toBe(1);

    const getState = vi.spyOn(useCanvasStore, 'getState').mockImplementation(() => ({
      ...readActualCanvasState(),
      canonicalMap: mapWithStep(),
    }));

    try {
      fireEvent.click(screen.getByTestId('sync-parent-to-store-map'));

      expect(hydrateCanvasDocument).toHaveBeenCalledTimes(1);
      expect(readActualCanvasState().historyDepth()).toBe(1);
    } finally {
      getState.mockRestore();
    }
  });

  it('hydrates an unequal-signature parent map after initial hydration', () => {
    useCanvasStore.getState().hydrateCanvasDocument({ canonicalMap: mapWithStep() });
    const initialParentMap = useCanvasStore.getState().canonicalMap;
    const originalHydrate = useCanvasStore.getState().hydrateCanvasDocument;
    const hydrateCanvasDocument = vi.fn(originalHydrate);
    useCanvasStore.setState({ hydrateCanvasDocument });

    const Harness = () => {
      const [processContext, setProcessContext] = React.useState<
        NonNullable<React.ComponentProps<typeof CanvasWorkspace>['processContext']>
      >({ processMap: initialParentMap });

      return (
        <>
          <button
            type="button"
            data-testid="replace-parent-map"
            onClick={() => setProcessContext({ processMap: mapWithSecondStep() })}
          >
            replace parent map
          </button>
          <CanvasWorkspace
            rawData={rawData}
            outcome="Fill_Weight"
            factors={[]}
            measureSpecs={{}}
            processContext={processContext}
            signals={SIGNALS}
            setOutcome={vi.fn()}
            setFactors={vi.fn()}
            setMeasureSpec={vi.fn()}
            setProcessContext={next => setProcessContext(next ?? { processMap: initialParentMap })}
            onSeeData={vi.fn()}
          />
        </>
      );
    };

    render(<Harness />);

    const callsAfterInitialHydration = hydrateCanvasDocument.mock.calls.length;

    fireEvent.click(screen.getByTestId('replace-parent-map'));

    expect(hydrateCanvasDocument).toHaveBeenCalledTimes(callsAfterInitialHydration + 1);
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual(mapWithSecondStep().nodes);
  });

  it('wires authoring mode keyboard toggle and undo through canvasStore', () => {
    const Harness = () => {
      const [processContext, setProcessContext] = React.useState<
        NonNullable<React.ComponentProps<typeof CanvasWorkspace>['processContext']>
      >({ processMap: mapWithStep() });

      return (
        <CanvasWorkspace
          rawData={rawData}
          outcome="Fill_Weight"
          factors={[]}
          measureSpecs={{}}
          processContext={processContext}
          signals={SIGNALS}
          setOutcome={vi.fn()}
          setFactors={vi.fn()}
          setMeasureSpec={vi.fn()}
          setProcessContext={next => setProcessContext(next ?? { processMap: mapWithStep() })}
          onSeeData={vi.fn()}
        />
      );
    };

    render(<Harness />);

    fireEvent.click(screen.getByTestId('test-drop-bake-time-on-step-1'));
    expect(useCanvasStore.getState().historyDepth()).toBe(1);

    fireEvent.keyDown(window, { key: 'z', metaKey: true });

    expect(useCanvasStore.getState().historyDepth()).toBe(0);
  });
});
