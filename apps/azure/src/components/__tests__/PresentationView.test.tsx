import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as DataContextModule from '../../context/DataContext';
import PresentationView from '../views/PresentationView';

// Mock DataContext
vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(() => ({
    outcome: 'Result',
    factors: ['Machine'],
    stats: null,
    specs: {},
    filteredData: [],
    chartTitles: {},
    setChartTitles: vi.fn(),
  })),
}));

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
vi.mock('../StatsPanel', () => ({
  default: () => <div data-testid="stats-panel">Stats Panel</div>,
}));

describe('PresentationView', () => {
  const onExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all charts in static grid', () => {
    render(<PresentationView onExit={onExit} />);

    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('pareto-chart')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('shows escape hint text', () => {
    render(<PresentationView onExit={onExit} />);

    expect(screen.getByText(/Press Escape to exit/)).toBeInTheDocument();
  });

  it('returns null when no outcome', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: null,
      factors: [],
      stats: null,
      specs: {},
      filteredData: [],
      chartTitles: {},
      setChartTitles: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    const { container } = render(<PresentationView onExit={onExit} />);

    expect(container).toBeEmptyDOMElement();
  });
});
