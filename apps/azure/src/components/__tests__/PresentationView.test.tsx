import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as DataContextModule from '../../context/DataContext';
import PresentationView from '../views/PresentationView';

// Mock DataContext
vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(() => ({
    outcome: 'Result',
    factors: ['Machine'],
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
vi.mock('../ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PresentationView', () => {
  const onExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all charts in overview mode', () => {
    render(<PresentationView onExit={onExit} />);

    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('pareto-chart')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('shows overview hint text', () => {
    render(<PresentationView onExit={onExit} />);

    expect(screen.getByText(/Click a chart to focus/)).toBeInTheDocument();
    expect(screen.getByText(/Press Escape to exit/)).toBeInTheDocument();
  });

  it('exits on Escape in overview mode', () => {
    render(<PresentationView onExit={onExit} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onExit).toHaveBeenCalled();
  });

  it('focuses a chart when clicked', () => {
    render(<PresentationView onExit={onExit} />);

    fireEvent.click(screen.getByLabelText('Focus I-Chart'));

    // Should now show focused hint (not overview hint)
    expect(screen.getByText(/Press Escape to return to overview/)).toBeInTheDocument();
  });

  it('returns to overview on Escape from focused mode', () => {
    render(<PresentationView onExit={onExit} />);

    // Focus a chart
    fireEvent.click(screen.getByLabelText('Focus I-Chart'));

    // First Escape returns to overview
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByText(/Click a chart to focus/)).toBeInTheDocument();
  });

  it('navigates between focused charts with arrow keys', () => {
    render(<PresentationView onExit={onExit} />);

    // Focus I-Chart (index 0)
    fireEvent.click(screen.getByLabelText('Focus I-Chart'));
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();

    // Arrow right to boxplot (index 1)
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();

    // Arrow right to pareto (index 2)
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('pareto-chart')).toBeInTheDocument();

    // Arrow left back to boxplot
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
  });

  it('shows navigation arrows in focused mode', () => {
    render(<PresentationView onExit={onExit} />);

    fireEvent.click(screen.getByLabelText('Focus I-Chart'));

    expect(screen.getByLabelText('Previous chart')).toBeInTheDocument();
    expect(screen.getByLabelText('Next chart')).toBeInTheDocument();
  });

  it('returns null when no outcome', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: null,
      factors: [],
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    const { container } = render(<PresentationView onExit={onExit} />);

    expect(container).toBeEmptyDOMElement();
  });
});
