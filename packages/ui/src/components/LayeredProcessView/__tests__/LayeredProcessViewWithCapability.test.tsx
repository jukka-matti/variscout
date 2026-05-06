import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    chartColors: {
      mean: '#3b82f6',
      warning: '#f59e0b',
    },
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import { LayeredProcessViewWithCapability } from '../LayeredProcessViewWithCapability';
import type { ProcessMap } from '@variscout/core/frame';
import type { CanvasStepCardModel } from '@variscout/hooks';

const map: ProcessMap = {
  version: 1,
  nodes: [{ id: 'step-1', name: 'Bake', order: 0, ctqColumn: 'Bake_Time' }],
  tributaries: [],
  createdAt: '2026-04-28T00:00:00.000Z',
  updatedAt: '2026-04-28T00:00:00.000Z',
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

const stepCards: CanvasStepCardModel[] = [
  {
    stepId: 'step-1',
    stepName: 'Bake',
    assignedColumns: ['Bake_Time'],
    metricColumn: 'Bake_Time',
    metricKind: 'numeric',
    values: [29, 30, 31],
    distribution: [],
    capability: { state: 'suppressed', n: 3, canAddSpecs: false },
    defectCount: 2,
  },
];

describe('LayeredProcessViewWithCapability', () => {
  it('renders the Canvas card surface instead of a dedicated Operations dashboard', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
      />
    );
    expect(screen.getByTestId('canvas-card-surface')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-card-step-1')).toBeInTheDocument();
    expect(screen.queryByTestId('ops-band-dashboard')).not.toBeInTheDocument();
  });

  it('shows the Default lens as active by default', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
      />
    );
    expect(screen.getByRole('button', { name: /default lens/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('fires onLensChange when changing lens', () => {
    const onLensChange = vi.fn();
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
        onLensChange={onLensChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /capability lens/i }));
    expect(onLensChange).toHaveBeenCalledWith('capability');
  });

  it('passes canvasFilterChips through to LayeredProcessView', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
        canvasFilterChips={<span data-testid="passthrough-chips">CHIPS</span>}
      />
    );
    expect(screen.getByTestId('layered-canvas-filter-chips')).toBeInTheDocument();
    expect(screen.getByTestId('passthrough-chips')).toBeInTheDocument();
  });

  it('renders filter strip above the Outcome band', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={{
          ...filter,
          availableContext: { hubColumns: ['product'] },
          contextValueOptions: { product: ['A'] },
        }}
        stepCards={stepCards}
      />
    );
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  it('keeps authoring mode separate from lens selection', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="read"
        activeLens="defect"
        stepCards={stepCards}
      />
    );

    expect(screen.queryByTestId('structural-toolbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /defect lens/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
