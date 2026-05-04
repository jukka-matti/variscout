import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports (per writing-tests skill / testing.md rule)

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showAnalysisMock = vi.fn();
const storeStateRef: { current: Record<string, unknown> } = {
  current: {
    rawData: [],
    outcome: null,
    factors: [],
    setOutcome: setOutcomeMock,
    setFactors: setFactorsMock,
    measureSpecs: {},
    setMeasureSpec: setMeasureSpecMock,
    processContext: null,
    setProcessContext: setProcessContextMock,
  },
};

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
}));

// PWA panelsStore — only the slice FrameView reads (showAnalysis via getState()).
vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({ showAnalysis: showAnalysisMock }),
  }),
}));

// Shared ref for useCanvasFilters state so tests can manipulate it.
const canvasFiltersStateRef: {
  current: {
    timelineWindow: import('@variscout/core').TimelineWindow;
    scopeFilter: import('@variscout/core').ScopeFilter | undefined;
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

vi.mock('@variscout/hooks', async () => {
  const actual = await import('@variscout/hooks');
  return {
    ...actual,
    useProductionLineGlanceFilter: vi.fn(() => ({
      value: {},
      onChange: vi.fn(),
    })),
    useProductionLineGlanceOpsToggle: vi.fn(() => ({
      mode: 'spatial' as const,
      setMode: vi.fn(),
      toggle: vi.fn(),
    })),
    useProductionLineGlanceData: vi.fn(() => ({
      cpkTrend: { data: [], stats: null, specs: {} },
      cpkGapTrend: { series: [], stats: null },
      capabilityNodes: [],
      errorSteps: [],
      availableContext: { hubColumns: [], tributaryGroups: [] },
      contextValueOptions: {},
    })),
    useCanvasFilters: vi.fn(() => canvasFiltersStateRef.current),
  };
});

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

import { fireEvent } from '@testing-library/react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import FrameView from '../FrameView';

describe('FrameView (PWA)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
    setProcessContextMock.mockClear();
    setMeasureSpecMock.mockClear();
    setOutcomeMock.mockClear();
    setFactorsMock.mockClear();
    showAnalysisMock.mockClear();
    // Reset canvas filter state to defaults for each test.
    canvasFiltersStateRef.current = {
      timelineWindow: { kind: 'cumulative' },
      scopeFilter: undefined,
      paretoGroupBy: undefined,
      setTimelineWindow: vi.fn(),
      setScopeFilter: vi.fn(),
      setParetoGroupBy: vi.fn(),
    };
    storeStateRef.current = {
      rawData: [],
      outcome: null,
      factors: [],
      setOutcome: setOutcomeMock,
      setFactors: setFactorsMock,
      measureSpecs: {},
      setMeasureSpec: setMeasureSpecMock,
      processContext: null,
      setProcessContext: setProcessContextMock,
    };
  });

  it('renders Canvas facade composition (three bands + ops dashboard) when scope is b1/b2', () => {
    // Add a step so detectScopeFromMap returns b2 — the b1/b2 path renders
    // the Canvas facade directly (b0 wraps it inside the closed expander).
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Bake', order: 0 }],
          tributaries: [],
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
    };
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();
  });

  it('renders FrameViewB0 when scope is b0 (no process steps)', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      rawData: [{ Fill_Weight: 12, Machine: 'A' }],
      // No processContext → empty map → b0
    };
    render(<FrameView />);
    expect(screen.getByTestId('frame-view-b0')).toBeInTheDocument();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();
    // The canvas is inside the collapsed expander, so layered-process-view is hidden
    expect(screen.queryByTestId('layered-process-view')).toBeNull();
    // CTA exists at the bottom
    expect(screen.getByTestId('see-the-data-cta')).toBeInTheDocument();
  });

  it('writes per-step CTQ specs to measureSpecs[ctqColumn] when a StepCard USL changes (Task B)', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      rawData: [{ Fill_Weight: 12, Bake_Time: 30, Machine: 'A' }],
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Bake', order: 0, ctqColumn: 'Bake_Time' }],
          tributaries: [],
          ctsColumn: 'Fill_Weight',
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
      measureSpecs: { Bake_Time: { target: 30, lsl: 28, usl: 32 } },
    };
    render(<FrameView />);
    fireEvent.change(screen.getByTestId('process-map-step-specs-step-1-usl'), {
      target: { value: '34' },
    });
    expect(setMeasureSpecMock).toHaveBeenCalledWith(
      'Bake_Time',
      expect.objectContaining({
        target: 30,
        lsl: 28,
        usl: 34,
      })
    );
  });

  it('writes per-column to measureSpecs[ctsColumn] when Cpk target changes (Phase D)', () => {
    // Add a step so the canvas is rendered directly (b1 path) instead of
    // hidden inside the b0 expander.
    storeStateRef.current = {
      ...storeStateRef.current,
      rawData: [{ Fill_Weight: 12, Machine: 'A' }],
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
          tributaries: [],
          ctsColumn: 'Fill_Weight',
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
      measureSpecs: { Fill_Weight: { target: 12, usl: 13, lsl: 11 } },
    };
    render(<FrameView />);
    fireEvent.change(screen.getByTestId('process-map-ocean-cpk-target'), {
      target: { value: '1.67' },
    });
    expect(setMeasureSpecMock).toHaveBeenCalledWith('Fill_Weight', {
      target: 12,
      usl: 13,
      lsl: 11,
      cpkTarget: 1.67,
    });
  });

  it('See the data CTA fires panelsStore.showAnalysis() when a Y is picked', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      rawData: [
        { Fill_Weight: 12, Machine: 'A' },
        { Fill_Weight: 13, Machine: 'B' },
        { Fill_Weight: 11, Machine: 'A' },
      ],
      outcome: 'Fill_Weight',
    };
    render(<FrameView />);
    fireEvent.click(screen.getByTestId('see-the-data-cta'));
    expect(showAnalysisMock).toHaveBeenCalledTimes(1);
  });

  // ── P3.6: CanvasFilterChips integration ────────────────────────────────────

  it('renders the canvasFilterChips slot (layered-canvas-filter-chips) in b1/b2 when timelineWindow is non-cumulative', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      timelineWindow: { kind: 'rolling', windowDays: 30 } satisfies TimelineWindow,
    };
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Bake', order: 0 }],
          tributaries: [],
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
    };
    render(<FrameView />);
    // The slot wrapper is always present; the chip inside renders only when active.
    expect(screen.getByTestId('layered-canvas-filter-chips')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-window')).toBeInTheDocument();
  });

  it('renders the scope chip in b1/b2 when scopeFilter is set', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      scopeFilter: { factor: 'Machine', values: ['A'] } satisfies ScopeFilter,
    };
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
          tributaries: [],
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
    };
    render(<FrameView />);
    expect(screen.getByTestId('filter-chip-scope')).toBeInTheDocument();
  });

  it('clear time-window chip calls setTimelineWindow with cumulative', () => {
    canvasFiltersStateRef.current = {
      ...canvasFiltersStateRef.current,
      timelineWindow: { kind: 'rolling', windowDays: 7 } satisfies TimelineWindow,
    };
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: {
        processMap: {
          version: 1,
          nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
          tributaries: [],
          createdAt: '2026-04-29T00:00:00.000Z',
          updatedAt: '2026-04-29T00:00:00.000Z',
        },
      },
    };
    render(<FrameView />);
    fireEvent.click(screen.getByLabelText(/Clear Last 7d/i));
    expect(canvasFiltersStateRef.current.setTimelineWindow).toHaveBeenCalledWith({
      kind: 'cumulative',
    });
  });
});
