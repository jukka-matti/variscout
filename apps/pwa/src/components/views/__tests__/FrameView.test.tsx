import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports (per writing-tests skill / testing.md rule)

vi.mock('@variscout/stores', () => {
  const setProcessContext = vi.fn();
  const setSpecs = vi.fn();
  return {
    useProjectStore: vi.fn((selector: (s: unknown) => unknown) =>
      selector({
        rawData: [],
        outcome: null,
        specs: null,
        setSpecs,
        processContext: null,
        setProcessContext,
      })
    ),
  };
});

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

import FrameView from '../FrameView';

describe('FrameView (PWA)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
  });

  it('renders LayeredProcessViewWithCapability composition (three bands + ops dashboard)', () => {
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();
  });
});
