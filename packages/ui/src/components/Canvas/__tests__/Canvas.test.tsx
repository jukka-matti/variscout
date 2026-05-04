import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessMap } from '@variscout/core/frame';
import { Canvas } from '../index';

const map: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const data = {
  cpkTrend: { data: [], stats: null, specs: { target: 1.33 } },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
};

const filter = {
  availableContext: { hubColumns: [] },
  contextValueOptions: {},
  value: {},
  onChange: vi.fn(),
};

describe('Canvas', () => {
  it('delegates to LayeredProcessViewWithCapability without changing behavior', () => {
    const onModeChange = vi.fn();

    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="spatial"
        onModeChange={onModeChange}
      />
    );

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show temporal trends/i }));

    expect(onModeChange).toHaveBeenCalledWith('full');
  });
});
