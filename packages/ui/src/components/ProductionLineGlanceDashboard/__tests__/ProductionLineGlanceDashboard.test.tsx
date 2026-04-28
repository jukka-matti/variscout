import { describe, it, expect, vi } from 'vitest';

// CRITICAL: vi.mock() BEFORE component imports — see project memory.
vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    IChart: ({ data }: { data: unknown[] }) =>
      React.createElement('div', { 'data-testid': 'mock-cpk-trend' }, `IChart:${data.length}`),
    CapabilityGapTrendChart: ({ gapSeries }: { gapSeries: unknown[] }) =>
      React.createElement('div', { 'data-testid': 'mock-gap-trend' }, `Gap:${gapSeries.length}`),
    CapabilityBoxplot: ({ nodes }: { nodes: unknown[] }) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-capability-boxplot' },
        `Boxplot:${nodes.length}`
      ),
    StepErrorPareto: ({
      steps,
      onStepClick,
    }: {
      steps: { nodeId: string; label: string }[];
      onStepClick?: (id: string) => void;
    }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'mock-step-pareto',
          onClick: () => onStepClick?.(steps[0]?.nodeId ?? 'none'),
        },
        `Pareto:${steps.length}`
      ),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceDashboard } from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../types';

const baseProps: ProductionLineGlanceDashboardProps = {
  cpkTrend: {
    data: [{ x: 0, y: 1.2, originalIndex: 0 }],
    stats: null,
    specs: { target: 1.33 },
  },
  cpkGapTrend: {
    series: [{ x: 0, y: 0.05, originalIndex: 0 }],
    stats: null,
  },
  capabilityNodes: [],
  errorSteps: [{ nodeId: 'n1', label: 'Mix', errorCount: 4 }],
};

describe('ProductionLineGlanceDashboard', () => {
  it('renders all four chart slots', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} />);
    expect(screen.getByTestId('mock-cpk-trend')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gap-trend')).toBeInTheDocument();
    expect(screen.getByTestId('mock-capability-boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-pareto')).toBeInTheDocument();
  });

  it('passes correct data lengths to each slot', () => {
    render(
      <ProductionLineGlanceDashboard
        {...baseProps}
        capabilityNodes={[
          {
            nodeId: 'n1',
            label: 'Mix',
            result: { nodeId: 'n1', n: 100, sampleConfidence: 'trust', source: 'column' },
          },
        ]}
      />
    );
    expect(screen.getByTestId('mock-capability-boxplot').textContent).toBe('Boxplot:1');
    expect(screen.getByTestId('mock-step-pareto').textContent).toBe('Pareto:1');
  });

  it('renders the filter strip when filter prop provided', () => {
    render(
      <ProductionLineGlanceDashboard
        {...baseProps}
        filter={{
          availableContext: { hubColumns: ['product'] },
          contextValueOptions: { product: ['A', 'B'] },
          value: {},
          onChange: vi.fn(),
        }}
      />
    );
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  it('omits the filter strip when filter prop is absent', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} />);
    expect(screen.queryByText('product')).not.toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} title="Plant 1 — Line A" />);
    expect(screen.getByText('Plant 1 — Line A')).toBeInTheDocument();
  });

  it('forwards onStepClick to the Pareto', () => {
    const onStepClick = vi.fn();
    render(<ProductionLineGlanceDashboard {...baseProps} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByTestId('mock-step-pareto'));
    expect(onStepClick).toHaveBeenCalledWith('n1');
  });

  it('shows an empty-state hint when capabilityNodes is empty', () => {
    render(<ProductionLineGlanceDashboard {...baseProps} capabilityNodes={[]} />);
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });

  it('renders both rows when mode is full (default)', () => {
    const { container } = render(<ProductionLineGlanceDashboard {...baseProps} />);
    const temporal = container.querySelector('[data-testid="dashboard-temporal-row"]');
    expect(temporal).toBeTruthy();
    expect(temporal).toHaveAttribute('aria-hidden', 'false');
  });

  it('collapses temporal row to aria-hidden when mode="spatial"', () => {
    const { container } = render(<ProductionLineGlanceDashboard {...baseProps} mode="spatial" />);
    const temporal = container.querySelector('[data-testid="dashboard-temporal-row"]');
    expect(temporal).toBeTruthy();
    expect(temporal).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps both rows mounted across mode changes (no chart re-mount)', () => {
    const { container, rerender } = render(
      <ProductionLineGlanceDashboard {...baseProps} mode="spatial" />
    );
    const initialBoxplot = container.querySelector('[data-testid="mock-capability-boxplot"]');
    expect(initialBoxplot).toBeTruthy();
    rerender(<ProductionLineGlanceDashboard {...baseProps} mode="full" />);
    const afterBoxplot = container.querySelector('[data-testid="mock-capability-boxplot"]');
    expect(afterBoxplot).toBe(initialBoxplot);
  });
});
