import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import type { ScopeFilter, SpecLimits, TimelineWindow } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

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
});
