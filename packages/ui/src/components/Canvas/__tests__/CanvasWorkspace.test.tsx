import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { ScopeFilter, SpecLimits, TimelineWindow } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import { useCanvasStore } from '@variscout/stores';

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

const canvasFiltersStateRef: {
  current: {
    timelineWindow: TimelineWindow;
    scopeFilter: ScopeFilter | undefined;
    paretoGroupBy: string | undefined;
    setTimelineWindow: ReturnType<typeof vi.fn>;
    setScopeFilter: ReturnType<typeof vi.fn>;
    setParetoGroupBy: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    timelineWindow: { kind: 'cumulative' },
    scopeFilter: undefined,
    paretoGroupBy: undefined,
    setTimelineWindow: vi.fn(),
    setScopeFilter: vi.fn(),
    setParetoGroupBy: vi.fn(),
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

vi.mock('@variscout/hooks', () => ({
  CANVAS_EMPTY_DROP_ID: 'canvas:empty',
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
  useSessionCanvasFilters: vi.fn(() => canvasFiltersStateRef.current),
}));

import { CanvasWorkspace } from '../CanvasWorkspace';

const rawData = [
  { Fill_Weight: 12, Bake_Time: 30, Machine: 'A' },
  { Fill_Weight: 13, Bake_Time: 31, Machine: 'B' },
  { Fill_Weight: 11, Bake_Time: 29, Machine: 'A' },
];

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

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof CanvasWorkspace>> = {}) {
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
    ...overrides,
  };
  render(<CanvasWorkspace {...props} />);
  return props;
}

describe('CanvasWorkspace', () => {
  beforeEach(() => {
    useCanvasStore.setState(useCanvasStore.getInitialState());
    canvasFiltersStateRef.current = {
      timelineWindow: { kind: 'cumulative' },
      scopeFilter: undefined,
      paretoGroupBy: undefined,
      setTimelineWindow: vi.fn(),
      setScopeFilter: vi.fn(),
      setParetoGroupBy: vi.fn(),
    };
    opsToggleStateRef.current = {
      mode: 'spatial',
      setMode: vi.fn(),
      toggle: vi.fn(),
    };
  });

  it('renders b0 with the lightweight picker and collapsed canvas expander', () => {
    renderWorkspace({ processContext: { processMap: emptyMap() } });

    expect(screen.getByTestId('frame-view-b0')).toBeInTheDocument();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();
    expect(screen.queryByTestId('layered-process-view')).toBeNull();
  });

  it('renders b1/b2 directly with three bands and the operations dashboard', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();
  });

  it('wires the operations reveal mode toggle into Canvas', () => {
    opsToggleStateRef.current = {
      mode: 'full',
      setMode: vi.fn(),
      toggle: vi.fn(),
    };
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    fireEvent.click(screen.getByRole('button', { name: /hide temporal trends/i }));

    expect(opsToggleStateRef.current.setMode).toHaveBeenCalledWith('spatial');
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

  it('wires authoring mode keyboard toggle and undo through canvasStore', () => {
    renderWorkspace({ processContext: { processMap: mapWithStep() } });

    fireEvent.click(screen.getByTestId('test-drop-bake-time-on-step-1'));
    expect(useCanvasStore.getState().historyDepth()).toBe(1);

    fireEvent.keyDown(window, { key: 'z', metaKey: true });

    expect(useCanvasStore.getState().historyDepth()).toBe(0);
  });
});
