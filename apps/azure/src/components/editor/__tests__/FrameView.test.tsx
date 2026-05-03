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

// Azure panelsStore — only the slice FrameView reads (showAnalysis via getState()).
vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({ showAnalysis: showAnalysisMock }),
  }),
}));

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
import FrameView from '../FrameView';

describe('FrameView (Plan C2 wiring)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
    setProcessContextMock.mockClear();
    setMeasureSpecMock.mockClear();
    setOutcomeMock.mockClear();
    setFactorsMock.mockClear();
    showAnalysisMock.mockClear();
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

  it('renders LayeredProcessViewWithCapability composition (three bands + ops dashboard) when scope is b1/b2', () => {
    // Add a step so detectScopeFromMap returns b2 — the b1/b2 path renders
    // the canvas directly (b0 wraps it inside the closed expander).
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
    // Canvas hidden inside the collapsed expander
    expect(screen.queryByTestId('layered-process-view')).toBeNull();
    expect(screen.getByTestId('see-the-data-cta')).toBeInTheDocument();
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

  it('writes per-column to measureSpecs[ctsColumn] when LSL changes (Phase D)', () => {
    // Add a step so we're in b1 scope and the canvas renders directly.
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
    fireEvent.change(screen.getByTestId('process-map-ocean-lsl'), { target: { value: '10.5' } });
    expect(setMeasureSpecMock).toHaveBeenCalledWith('Fill_Weight', {
      target: 12,
      usl: 13,
      lsl: 10.5,
      cpkTarget: undefined,
    });
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
    // Add a step so we're in b1 scope and the canvas renders directly.
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
});
