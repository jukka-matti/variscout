import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
  CanvasAnalyzeOverlayModel,
  CanvasLensId,
  CanvasOverlayId,
  CanvasStepCardModel,
} from '@variscout/hooks';
import { useCanvasAnalyzeOverlays, useCanvasStepCards, useSharedWallProps } from '@variscout/hooks';
import {
  getCanvasViewportInitialState,
  useCanvasStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';

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

vi.mock('../../AnalyzeWall', async () => {
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

// `@dnd-kit/core`'s `DndContext` mock fires synthetic chip-drop events to test
// Canvas's chip→step routing. CanvasWorkspace nests TWO DndContexts in author
// mode (EditModeShell's outer column→zone routing + Canvas's inner chip→step
// routing — see EditModeShell.tsx + Canvas/index.tsx). Each context registers
// its onDragEnd here; the inline test buttons fire to ALL registered handlers,
// and each handler filters by id pattern (chip:/column: vs step:/zone:) so the
// double dispatch is safe. Test buttons render only on the outermost mounted
// DndContext, so `getByTestId` stays unambiguous.
const dndMockHandlersRef = vi.hoisted(() => ({
  current: [] as Array<
    ((event: { active: { id: string }; over: { id: string } | null }) => void) | undefined
  >,
}));

const fireDndMockDragEnd = vi.hoisted(
  () => (event: { active: { id: string }; over: { id: string } | null }) => {
    for (const handler of dndMockHandlersRef.current) {
      handler?.(event);
    }
  }
);

vi.mock('@dnd-kit/core', () => {
  const RenderingDndContext = ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
  }) => {
    // Register this context's onDragEnd against a stable per-instance slot.
    const slotRef = React.useRef<number | null>(null);
    if (slotRef.current === null) {
      slotRef.current = dndMockHandlersRef.current.length;
      dndMockHandlersRef.current.push(onDragEnd);
    } else {
      dndMockHandlersRef.current[slotRef.current] = onDragEnd;
    }
    // Render test buttons only inside the FIRST registered DndContext so
    // `getByTestId` is unambiguous; clicks dispatch to every registered
    // handler (each filters by id pattern, so cross-context events no-op).
    if (slotRef.current !== 0) {
      return <div>{children}</div>;
    }
    return (
      <div>
        <button
          type="button"
          data-testid="test-drop-bake-time-on-step-1"
          onClick={() =>
            fireDndMockDragEnd({
              active: { id: 'chip:Bake_Time' },
              over: { id: 'step:step-1' },
            })
          }
        >
          drop Bake_Time on step-1
        </button>
        <button
          type="button"
          data-testid="test-drop-machine-on-empty-canvas"
          onClick={() =>
            fireDndMockDragEnd({
              active: { id: 'chip:Machine' },
              over: { id: 'canvas:empty' },
            })
          }
        >
          drop Machine on empty canvas
        </button>
        {children}
      </div>
    );
  };
  return {
    DndContext: RenderingDndContext,
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
  };
});

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

const mockInvestigationOverlays: CanvasAnalyzeOverlayModel = {
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
  useCanvasAnalyzeOverlays: vi.fn(() => ({ overlays: mockInvestigationOverlays })),
  useHasAnalyzeContent: vi.fn(({ findingsCount }: { findingsCount: number }) => findingsCount > 0),
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
  useCanvasHypothesisDrawing: vi.fn(
    ({
      activeCanvasTool,
      disabled,
      drawTool,
      onCanvasToolChange,
      stepMetricColumns,
    }: {
      activeCanvasTool: string;
      disabled?: boolean;
      drawTool: {
        state: { phase: string; [k: string]: unknown };
        onPointerDown: (endpoint: unknown, at: unknown) => void;
        onPointerMove: (at: unknown, hover: unknown) => void;
        onPointerUp: (endpoint: unknown, at: unknown) => void;
        cancel: () => void;
      };
      cardSurfaceRef: { current: HTMLElement | null };
      onCanvasToolChange?: (next: string) => void;
      stepMetricColumns: Record<string, string | undefined>;
    }) => ({
      handlers: {
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
          if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
          const el =
            event.target instanceof Element ? event.target.closest('[data-arrow-endpoint]') : null;
          if (!el) return;
          const attr = el.getAttribute('data-arrow-endpoint') ?? '';
          const sep = attr.indexOf(':');
          if (sep < 0) return;
          const kind = attr.slice(0, sep);
          const id = attr.slice(sep + 1);
          const endpoint =
            kind === 'step' ? { kind: 'step', id } : { kind: 'column', name: id, hostStepId: id };
          event.preventDefault();
          drawTool.onPointerDown(endpoint, { x: event.clientX, y: event.clientY });
        },
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          if (drawTool.state.phase !== 'drawing') return;
          const el =
            event.target instanceof Element ? event.target.closest('[data-arrow-endpoint]') : null;
          let hover = null;
          if (el) {
            const attr = el.getAttribute('data-arrow-endpoint') ?? '';
            const sep = attr.indexOf(':');
            if (sep >= 0) {
              const kind = attr.slice(0, sep);
              const id = attr.slice(sep + 1);
              hover =
                kind === 'step'
                  ? { kind: 'step', id }
                  : { kind: 'column', name: id, hostStepId: id };
            }
          }
          drawTool.onPointerMove({ x: event.clientX, y: event.clientY }, hover);
        },
        onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
          if (drawTool.state.phase !== 'drawing') return;
          const el =
            event.target instanceof Element ? event.target.closest('[data-arrow-endpoint]') : null;
          let endpoint = null;
          if (el) {
            const attr = el.getAttribute('data-arrow-endpoint') ?? '';
            const sep = attr.indexOf(':');
            if (sep >= 0) {
              const kind = attr.slice(0, sep);
              const id = attr.slice(sep + 1);
              endpoint =
                kind === 'step'
                  ? { kind: 'step', id }
                  : { kind: 'column', name: id, hostStepId: id };
            }
          }
          drawTool.onPointerUp(endpoint, { x: event.clientX, y: event.clientY });
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
          if (event.key === 'Escape') {
            drawTool.cancel();
            onCanvasToolChange?.('select');
          }
        },
      },
      endpointLabel: (endpoint: { kind: string; id?: string; name?: string }) => {
        if (endpoint.kind === 'column') return endpoint.name ?? '';
        return (endpoint.id ? stepMetricColumns[endpoint.id] : undefined) ?? endpoint.id ?? '';
      },
      parseEndpointElement: () => null,
    })
  ),
  useCanvasHypothesisArrows: vi.fn(() => ({
    arrowSegments: [],
    registerCardElement: vi.fn(),
  })),
}));

import { CanvasWorkspace } from '../CanvasWorkspace';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

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

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof CanvasWorkspace>> = {}) {
  // C3 Task 4: EditModeShell no longer renders the inner Canvas as `children` —
  // it now owns ProcessStructureZone. The state-mode branch in CanvasWorkspace
  // still mounts the inner Canvas. Default to `canEditCanvas: false` here so
  // tests that exercise inner-Canvas behavior (URL routing, lens/overlay
  // changes, spec callbacks, Wall props, etc.) keep rendering Canvas instead
  // of falling into the EditModeShell branch (which would mount
  // ProcessStructureZone, not Canvas). Tests that specifically need
  // author-mode authoring can override `canEditCanvas: true`.
  const props: React.ComponentProps<typeof CanvasWorkspace> = {
    rawData,
    outcome: 'Fill_Weight',
    factors: [],
    measureSpecs: {},
    processContext: null,
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setMeasureSpec: vi.fn(),
    setProcessContext: vi.fn(),
    onSeeData: vi.fn(),
    canEditCanvas: false,
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
    dndMockHandlersRef.current = [];
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
    vi.mocked(useCanvasAnalyzeOverlays).mockImplementation(() => ({
      overlays: mockInvestigationOverlays,
    }));
  });

  it('renders b0 with the lightweight picker and collapsed canvas expander', () => {
    renderWorkspace({ processContext: { processMap: emptyMap() } });

    expect(screen.getByTestId('frame-view-b0')).toBeInTheDocument();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();
    expect(screen.queryByTestId('layered-process-view')).toBeNull();
  });

  // C3 Task 4: this test specifically asserts `canvas-authoring-map` which is
  // the L2 chip-rail authoring surface inside the inner Canvas. With author
  // mode now routed to EditModeShell + ProcessStructureZone (column→process
  // drop journey), the inner Canvas's chip-rail authoring is being retired.
  // Re-render here in read mode (`canEditCanvas: false`) so the inner Canvas
  // still mounts; assertion on `canvas-authoring-map` is retained because the
  // L2 authoring map still renders in read mode for state-mode card surface.
  it('renders b1/b2 directly with the card surface and authoring map', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() }, canEditCanvas: false });

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
    vi.mocked(useCanvasAnalyzeOverlays).mockReturnValue({
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
});

// ---------------------------------------------------------------------------
// D1 step timings end-to-end (Task 10)
// ---------------------------------------------------------------------------
//
// Exercises the full step-timings flow inside Edit mode:
//   drop categorical column → toolbar button enabled → click → modal opens →
//   pre-fill auto-detects pairs → Save → derived chips appear in palette →
//   timing badges render on step boxes.
//
// Uses paired date columns (`Prep_start`/`Prep_end`, etc.) that
// `detectPairedTimingColumns` should match by suffix-stripped step name.
// ---------------------------------------------------------------------------

describe('CanvasWorkspace — D1 step timings end-to-end', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    wallIsMobileRef.current = false;
    localMechanismPropsRef.current = null;
    dndMockHandlersRef.current = [];
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
    vi.mocked(useCanvasStepCards).mockImplementation(() => ({ cards: mockStepCards }));
    vi.mocked(useCanvasAnalyzeOverlays).mockImplementation(() => ({
      overlays: mockInvestigationOverlays,
    }));
  });

  // Sample dataset: 3 categorical Step values (`Prep` / `Mix` / `Pack`) + 3
  // paired start/end date columns. Step values repeat across rows so
  // detectColumns classifies it as categorical with `hasVariation: true`.
  //
  // Date columns use YYYY-MM-DD literals so the parser classifies them as
  // `kind: 'date'` (the parser only accepts that ISO subset; full ISO
  // datetimes fall through to text). The engine's parseTimeValue accepts
  // the same format and resolves them to per-row epoch ms for the
  // computeLeadTimeColumn / Total / Wait helpers.
  const pairedTimingRows = [
    {
      Step: 'Prep',
      Prep_start: '2026-01-01',
      Prep_end: '2026-01-02',
      Mix_start: '2026-01-03',
      Mix_end: '2026-01-05',
      Pack_start: '2026-01-06',
      Pack_end: '2026-01-08',
    },
    {
      Step: 'Mix',
      Prep_start: '2026-02-01',
      Prep_end: '2026-02-02',
      Mix_start: '2026-02-03',
      Mix_end: '2026-02-05',
      Pack_start: '2026-02-06',
      Pack_end: '2026-02-08',
    },
    {
      Step: 'Pack',
      Prep_start: '2026-03-01',
      Prep_end: '2026-03-02',
      Mix_start: '2026-03-03',
      Mix_end: '2026-03-05',
      Pack_start: '2026-03-06',
      Pack_end: '2026-03-08',
    },
  ];

  // Process map: one step is enough to make `detectScopeFromMap` return b2/b1
  // (anything other than b0), so CanvasWorkspace renders the b1/b2 branch with
  // EditModeShell instead of the b0 FrameViewB0 picker. The processSteps that
  // drive the toolbar + timing-badge flow live in CanvasWorkspace local state,
  // not in processMap.nodes.
  const stepTimingsMap = (): ProcessMap => ({
    version: 1,
    nodes: [{ id: 'seed-step', name: 'Seed', order: 0 }],
    tributaries: [],
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z',
  });

  function renderEditWorkspace(
    rows: ReadonlyArray<Record<string, unknown>> = pairedTimingRows
  ): void {
    render(
      <CanvasWorkspace
        rawData={rows as ReadonlyArray<import('@variscout/core').DataRow>}
        outcome={null}
        factors={[]}
        measureSpecs={{}}
        processContext={{ processMap: stepTimingsMap() }}
        setOutcome={vi.fn()}
        setFactors={vi.fn()}
        setMeasureSpec={vi.fn()}
        setProcessContext={vi.fn()}
        onSeeData={vi.fn()}
        canEditCanvas={true}
      />
    );
  }

  function dropStepColumnOnProcessZone(): void {
    act(() => {
      fireDndMockDragEnd({
        active: { id: 'column:Step' },
        over: { id: 'process-zone:singleton' },
      });
    });
  }

  it('happy path — drop categorical → toolbar enabled → modal pre-fills → save → derived chips + badges appear', () => {
    renderEditWorkspace();

    // Edit mode shell is mounted (canEditCanvas:true + b1/b2 scope).
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();

    // Toolbar's "Capture step timings" button is disabled before steps exist.
    const toolbarButton = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(toolbarButton).toBeDisabled();

    // Drop the `Step` categorical column on the process zone — materializes
    // 3 emergent steps (Prep / Mix / Pack) into CanvasWorkspace local state.
    dropStepColumnOnProcessZone();

    // Toolbar button is now enabled.
    expect(toolbarButton).not.toBeDisabled();

    // No derived chips yet (Save hasn't been called).
    expect(screen.queryByTestId('palette-group-derived')).toBeNull();

    // Click the toolbar button → modal opens.
    fireEvent.click(toolbarButton);
    expect(screen.getByTestId('step-timings-backdrop')).toBeInTheDocument();

    // Modal auto-detection pre-filled the three step rows. Verify the
    // `Prep` row has its Start picker bound to `Prep_start` (the
    // `detectPairedTimingColumns` engine matches by suffix-stripped step name).
    const prepRowStart = screen.getByLabelText(/Start column for Prep/i) as HTMLSelectElement;
    expect(prepRowStart.value).toBe('Prep_start');
    const mixRowEnd = screen.getByLabelText(/End column for Mix/i) as HTMLSelectElement;
    expect(mixRowEnd.value).toBe('Mix_end');

    // Save the modal — fires `onSave(bindings)` with 3 paired bindings.
    const saveButton = screen.getByTestId('step-timings-save');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    // Modal closes.
    expect(screen.queryByTestId('step-timings-backdrop')).toBeNull();

    // Derived palette group now appears with the DERIVED FROM TIMINGS header.
    const derivedGroup = screen.getByTestId('palette-group-derived');
    expect(derivedGroup).toBeInTheDocument();
    expect(derivedGroup).toHaveTextContent('DERIVED FROM TIMINGS');

    // The 3 derived columns are present (all-paired ⇒ all 3 contribute).
    expect(derivedGroup).toHaveTextContent('Lead_time');
    expect(derivedGroup).toHaveTextContent('Total_work_time');
    expect(derivedGroup).toHaveTextContent('Wait_time');

    // Timing badges appear on each step box (`⏱ ~ …`).
    // detectPairedTimingColumns matches step name → column suffix, so step ids
    // are `step-Step-0` (Prep) / `step-Step-1` (Mix) / `step-Step-2` (Pack).
    const prepBox = screen.getByTestId('step-box-step-Step-0');
    const mixBox = screen.getByTestId('step-box-step-Step-1');
    const packBox = screen.getByTestId('step-box-step-Step-2');
    expect(prepBox.textContent).toMatch(/⏱/);
    expect(mixBox.textContent).toMatch(/⏱/);
    expect(packBox.textContent).toMatch(/⏱/);
  });

  it('all-duration case excludes Lead_time but keeps Total_work_time', () => {
    // Same dataset, but we bind all three steps via duration columns instead
    // of paired start/end. Lead_time requires ≥ 1 paired binding (spec §3.4)
    // so it must NOT appear; Total_work_time spans both kinds so it DOES.
    const durationRows = pairedTimingRows.map(row => ({
      Step: row.Step,
      Prep_duration_ms: 600_000, // 10 min
      Mix_duration_ms: 1_200_000, // 20 min
      Pack_duration_ms: 900_000, // 15 min
    }));
    renderEditWorkspace(durationRows);

    dropStepColumnOnProcessZone();

    const toolbarButton = screen.getByRole('button', { name: /\+ Capture step timings/i });
    fireEvent.click(toolbarButton);

    // Bind each step to its duration column via the duration alternative section.
    fireEvent.change(screen.getByTestId('step-duration-row-step-Step-0-picker'), {
      target: { value: 'Prep_duration_ms' },
    });
    fireEvent.change(screen.getByTestId('step-duration-row-step-Step-1-picker'), {
      target: { value: 'Mix_duration_ms' },
    });
    fireEvent.change(screen.getByTestId('step-duration-row-step-Step-2-picker'), {
      target: { value: 'Pack_duration_ms' },
    });

    fireEvent.click(screen.getByTestId('step-timings-save'));

    const derivedGroup = screen.getByTestId('palette-group-derived');
    expect(derivedGroup).toBeInTheDocument();
    expect(derivedGroup).not.toHaveTextContent('Lead_time');
    expect(derivedGroup).not.toHaveTextContent('Wait_time');
    expect(derivedGroup).toHaveTextContent('Total_work_time');
  });

  it('empty state — no derived chips appear before Save is called', () => {
    renderEditWorkspace();
    dropStepColumnOnProcessZone();

    // Steps materialized; modal not opened yet. No derived chips.
    expect(screen.queryByTestId('palette-group-derived')).toBeNull();

    // Open the modal — derived chips still should not appear (Save not clicked).
    fireEvent.click(screen.getByRole('button', { name: /\+ Capture step timings/i }));
    expect(screen.queryByTestId('palette-group-derived')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// D2 Task 10 — kebab calculate-from dispatch
// ---------------------------------------------------------------------------
//
// Exercises the end-to-end calculate-from flow inside Edit mode:
//   chip kebab → context menu → "Calculate from this column…" →
//   CalculatedColumnModal opens pre-populated with sourceColumn →
//   Cancel/Escape closes it → Custom tab Save adds binding + closes.
//
// The test dataset keeps Fill_Weight + Bake_Time as numeric columns so the
// palette renders them in the "Numeric" group and the context menu for numeric
// chips includes the "Calculate from this column…" item.
// ---------------------------------------------------------------------------

describe('Task 10 — kebab calculate-from dispatch', () => {
  const calcWorkspaceMap = (): ProcessMap => ({
    version: 1,
    nodes: [{ id: 'seed-step', name: 'Seed', order: 0 }],
    tributaries: [],
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z',
  });

  function renderCalcWorkspace(): void {
    render(
      <CanvasWorkspace
        rawData={rawData as ReadonlyArray<import('@variscout/core').DataRow>}
        outcome={null}
        factors={[]}
        measureSpecs={{}}
        processContext={{ processMap: calcWorkspaceMap() }}
        setOutcome={vi.fn()}
        setFactors={vi.fn()}
        setMeasureSpec={vi.fn()}
        setProcessContext={vi.fn()}
        onSeeData={vi.fn()}
        canEditCanvas={true}
      />
    );
  }

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    wallIsMobileRef.current = false;
    localMechanismPropsRef.current = null;
    dndMockHandlersRef.current = [];
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
    vi.mocked(useCanvasStepCards).mockImplementation(() => ({ cards: mockStepCards }));
    vi.mocked(useCanvasAnalyzeOverlays).mockImplementation(() => ({
      overlays: mockInvestigationOverlays,
    }));
  });

  it('clicking calculate-from on a numeric chip opens CalculatedColumnModal with sourceColumn set', () => {
    renderCalcWorkspace();

    // Edit mode shell is mounted (canEditCanvas:true + b1/b2 scope).
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();

    // No modal yet.
    expect(screen.queryByTestId('calc-column-backdrop')).toBeNull();

    // Click the kebab (⋮) on the Fill_Weight chip.
    fireEvent.click(screen.getByRole('button', { name: 'Open context menu for Fill_Weight' }));

    // Menu is open — the "Calculate from this column…" item is visible.
    const calcItem = screen.getByRole('menuitem', { name: 'Calculate from this column…' });
    expect(calcItem).toBeInTheDocument();

    // Click the item.
    fireEvent.click(calcItem);

    // Modal is open with the correct dialog role.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('calc-column-backdrop')).toBeInTheDocument();

    // The modal heading "Calculate a new column" is present.
    expect(screen.getByText('Calculate a new column')).toBeInTheDocument();
  });

  it('modal onSave adds a FormulaBinding to local state and closes the modal', () => {
    renderCalcWorkspace();

    // Open the modal via the Fill_Weight kebab.
    fireEvent.click(screen.getByRole('button', { name: 'Open context menu for Fill_Weight' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Calculate from this column…' }));

    // Modal is open.
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Switch to the Custom tab.
    fireEvent.click(screen.getByTestId('calc-column-tab-custom'));

    // Type a column name. The input has aria-label="Calculated column name".
    const nameInput = screen.getByRole('textbox', { name: 'Calculated column name' });
    fireEvent.change(nameInput, { target: { value: 'Fill_ratio' } });

    // Add a numeric column to the numerator so Save is enabled.
    // PaletteChips inside the modal's custom palette have aria-label={column}.
    // Scope lookup to within the dialog to avoid ambiguity with main palette chips.
    const paletteChip = within(dialog).getByRole('button', { name: 'Fill_Weight' });
    fireEvent.click(paletteChip);

    // Save the binding.
    const saveBtn = screen.getByTestId('calc-column-custom-save');
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    // Modal closes.
    expect(screen.queryByTestId('calc-column-backdrop')).toBeNull();
  });

  it('modal Cancel button closes the modal', () => {
    renderCalcWorkspace();

    // Open the modal.
    fireEvent.click(screen.getByRole('button', { name: 'Open context menu for Fill_Weight' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Calculate from this column…' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click Cancel.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Modal is gone.
    expect(screen.queryByTestId('calc-column-backdrop')).toBeNull();
  });

  it('Escape key closes the modal', () => {
    renderCalcWorkspace();

    // Open the modal.
    fireEvent.click(screen.getByRole('button', { name: 'Open context menu for Fill_Weight' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Calculate from this column…' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape.
    fireEvent.keyDown(document, { key: 'Escape' });

    // Modal is gone.
    expect(screen.queryByTestId('calc-column-backdrop')).toBeNull();
  });

  it('the context menu for a categorical chip does not include calculate-from', () => {
    renderCalcWorkspace();

    // Machine is categorical in the test dataset.
    fireEvent.click(screen.getByRole('button', { name: 'Open context menu for Machine' }));

    // "Calculate from this column…" should NOT be in the menu.
    expect(screen.queryByRole('menuitem', { name: 'Calculate from this column…' })).toBeNull();

    // But "Use as factor" IS present (categorical menu item).
    expect(screen.getByRole('menuitem', { name: 'Use as factor' })).toBeInTheDocument();
  });

  it('modal is closed by default (calcModalOpen = null) before any interaction', () => {
    renderCalcWorkspace();

    expect(screen.queryByTestId('calc-column-backdrop')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
