import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports (per writing-tests skill / testing.md rule)

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const storeStateRef: { current: Record<string, unknown> } = {
  current: {
    rawData: [],
    outcome: null,
    measureSpecs: {},
    setMeasureSpec: setMeasureSpecMock,
    processContext: null,
    setProcessContext: setProcessContextMock,
  },
};

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
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

describe('FrameView (PWA)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
    setProcessContextMock.mockClear();
    setMeasureSpecMock.mockClear();
    storeStateRef.current = {
      rawData: [],
      outcome: null,
      measureSpecs: {},
      setMeasureSpec: setMeasureSpecMock,
      processContext: null,
      setProcessContext: setProcessContextMock,
    };
  });

  it('renders LayeredProcessViewWithCapability composition (three bands + ops dashboard)', () => {
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();
  });

  it('writes per-column to measureSpecs[ctsColumn] when Cpk target changes (Phase D)', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      rawData: [{ Fill_Weight: 12, Machine: 'A' }],
      processContext: {
        processMap: {
          version: 1,
          nodes: [],
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
