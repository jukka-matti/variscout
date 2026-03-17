import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportChartSnapshot } from '../ReportChartSnapshot';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportChartSnapshot', () => {
  it('renders the filter label', () => {
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="ichart"
        filterLabel="Machine = A"
        renderChart={() => <svg data-testid="chart" />}
      />
    );
    expect(screen.getByText('Machine = A')).toBeDefined();
  });

  it('renders the chart content via renderChart', () => {
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="boxplot"
        filterLabel="All data"
        renderChart={() => <div data-testid="mock-chart">Chart</div>}
      />
    );
    expect(screen.getByTestId('mock-chart')).toBeDefined();
  });

  it('chart area has pointer-events: none', () => {
    const { container } = render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="pareto"
        filterLabel="All data"
        renderChart={() => <div>Chart content</div>}
      />
    );
    // The wrapping div around the chart should have pointer-events: none
    const chartWrapper = container.querySelector('[style*="pointer-events"]') as HTMLElement;
    expect(chartWrapper).not.toBeNull();
    expect(chartWrapper.style.pointerEvents).toBe('none');
  });

  it('does not render copy button when onCopyChart is not provided', () => {
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="ichart"
        filterLabel="All data"
        renderChart={() => <div>Chart</div>}
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders copy button when onCopyChart is provided', () => {
    const onCopy = vi.fn();
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="ichart"
        filterLabel="All data"
        renderChart={() => <div>Chart</div>}
        onCopyChart={onCopy}
      />
    );
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('copy button is marked with data-export-hide', () => {
    const onCopy = vi.fn();
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="ichart"
        filterLabel="All data"
        renderChart={() => <div>Chart</div>}
        onCopyChart={onCopy}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('data-export-hide')).toBe(true);
  });

  it('copy button has accessible aria-label including chart type', () => {
    const onCopy = vi.fn();
    render(
      <ReportChartSnapshot
        id="snap-1"
        chartType="ichart"
        filterLabel="All data"
        renderChart={() => <div>Chart</div>}
        onCopyChart={onCopy}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toContain('I-Chart');
  });

  it('renders with the container id set correctly', () => {
    render(
      <ReportChartSnapshot
        id="my-snap-id"
        chartType="boxplot"
        filterLabel="All data"
        renderChart={() => <div>Chart</div>}
      />
    );
    const container = document.getElementById('my-snap-id');
    expect(container).not.toBeNull();
  });
});
