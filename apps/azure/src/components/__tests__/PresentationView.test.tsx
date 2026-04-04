import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PresentationView from '../views/PresentationView';
import { useProjectStore } from '@variscout/stores';

// Mock chart components
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
vi.mock('../charts/Boxplot', () => ({
  default: ({ factor }: { factor: string }) => <div data-testid="boxplot">Boxplot: {factor}</div>,
}));
vi.mock('../charts/ParetoChart', () => ({
  default: ({ factor }: { factor: string }) => (
    <div data-testid="pareto-chart">Pareto: {factor}</div>
  ),
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-panel">Process Intelligence Panel</div>,
}));

describe('PresentationView', () => {
  const onExit = vi.fn();
  const defaultProps = {
    onExit,
    boxplotFactor: 'Machine',
    paretoFactor: 'Machine',
    showParetoComparison: false,
    onToggleParetoComparison: vi.fn(),
    paretoAggregation: 'count' as const,
    onToggleParetoAggregation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState({
      outcome: 'Result',
      factors: ['Machine'],
      specs: {},
      chartTitles: {},
      rawData: [],
      filters: {},
    } as unknown as Partial<ReturnType<typeof useProjectStore.getState>>);
  });

  it('renders all charts in static grid', () => {
    render(<PresentationView {...defaultProps} />);

    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('pareto-chart')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('shows escape hint text', () => {
    render(<PresentationView {...defaultProps} />);

    expect(screen.getByText(/Press Escape to exit/)).toBeInTheDocument();
  });

  it('passes correct factor to boxplot and pareto', () => {
    render(<PresentationView {...defaultProps} boxplotFactor="Operator" paretoFactor="Shift" />);

    expect(screen.getByTestId('boxplot')).toHaveTextContent('Boxplot: Operator');
    expect(screen.getByTestId('pareto-chart')).toHaveTextContent('Pareto: Shift');
  });

  it('returns null when no outcome', () => {
    useProjectStore.setState({ outcome: null });

    const { container } = render(<PresentationView {...defaultProps} />);

    expect(container).toBeEmptyDOMElement();
  });
});
