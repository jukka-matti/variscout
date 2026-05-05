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

import { render, screen, fireEvent } from '@testing-library/react';
import { LayeredProcessViewWithCapability } from '../LayeredProcessViewWithCapability';
import type { ProcessMap } from '@variscout/core/frame';

const map: ProcessMap = {
  version: 1,
  nodes: [],
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

describe('LayeredProcessViewWithCapability', () => {
  it('renders the dashboard inside the Operations band slot', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('mock-capability-boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-pareto')).toBeInTheDocument();
  });

  it('shows "Show temporal trends" affordance when opsMode=spatial', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /show temporal trends/i })).toBeInTheDocument();
  });

  it('shows "Hide temporal trends" affordance when opsMode=full', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="full"
        onOpsModeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /hide temporal trends/i })).toBeInTheDocument();
  });

  it('fires onOpsModeChange("full") when toggling from spatial', () => {
    const onOpsModeChange = vi.fn();
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="spatial"
        onOpsModeChange={onOpsModeChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /show temporal trends/i }));
    expect(onOpsModeChange).toHaveBeenCalledWith('full');
  });

  it('passes canvasFilterChips through to LayeredProcessView', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
      />
    );
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  it('keeps authoring mode separate from Operations reveal mode', () => {
    render(
      <LayeredProcessViewWithCapability
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="read"
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /show temporal trends/i })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-temporal-row')).toHaveAttribute('aria-hidden', 'true');
  });
});
