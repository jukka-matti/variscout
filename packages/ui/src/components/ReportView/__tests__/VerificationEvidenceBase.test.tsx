import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VerificationEvidenceBase } from '../VerificationEvidenceBase';
import type { VerificationChartOption, VerificationChartId } from '../VerificationEvidenceBase';

function makeCharts(
  overrides: Partial<Record<VerificationChartId, boolean>> = {}
): VerificationChartOption[] {
  const defaults: Record<VerificationChartId, boolean> = {
    stats: true,
    ichart: true,
    boxplot: true,
    histogram: false,
    pareto: true,
    ...overrides,
  };
  return [
    { id: 'stats', label: 'Stats', available: defaults.stats },
    { id: 'ichart', label: 'I-Chart', available: defaults.ichart },
    { id: 'boxplot', label: 'Boxplot', available: defaults.boxplot },
    { id: 'histogram', label: 'Histogram', available: defaults.histogram },
    { id: 'pareto', label: 'Pareto', available: defaults.pareto },
  ];
}

describe('VerificationEvidenceBase', () => {
  it('renders all 5 chips', () => {
    const charts = makeCharts();
    const active = new Set<VerificationChartId>(['stats', 'ichart', 'boxplot', 'pareto']);

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={() => <div>chart</div>}
      />
    );

    expect(screen.getByTestId('verification-chip-stats')).toBeDefined();
    expect(screen.getByTestId('verification-chip-ichart')).toBeDefined();
    expect(screen.getByTestId('verification-chip-boxplot')).toBeDefined();
    expect(screen.getByTestId('verification-chip-histogram')).toBeDefined();
    expect(screen.getByTestId('verification-chip-pareto')).toBeDefined();
  });

  it('unavailable chips are disabled', () => {
    const charts = makeCharts({ histogram: false });
    const active = new Set<VerificationChartId>(['stats']);

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={() => <div>chart</div>}
      />
    );

    const histogramChip = screen.getByTestId('verification-chip-histogram') as HTMLButtonElement;
    expect(histogramChip.disabled).toBe(true);
  });

  it('calls onToggleChart when chip clicked', () => {
    const charts = makeCharts();
    const active = new Set<VerificationChartId>(['stats', 'ichart']);
    const onToggle = vi.fn();

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={onToggle}
        renderChart={() => <div>chart</div>}
      />
    );

    fireEvent.click(screen.getByTestId('verification-chip-boxplot'));
    expect(onToggle).toHaveBeenCalledWith('boxplot');
  });

  it('renders charts only for active + available ids', () => {
    const charts = makeCharts({ histogram: false });
    const active = new Set<VerificationChartId>(['stats', 'boxplot']);
    const renderChart = vi.fn((id: VerificationChartId) => <div>Chart: {id}</div>);

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={renderChart}
      />
    );

    // Should render stats and boxplot
    expect(screen.getByTestId('verification-chart-stats')).toBeDefined();
    expect(screen.getByTestId('verification-chart-boxplot')).toBeDefined();

    // Should NOT render ichart (not active), histogram (not available), pareto (not active)
    expect(screen.queryByTestId('verification-chart-ichart')).toBeNull();
    expect(screen.queryByTestId('verification-chart-histogram')).toBeNull();
    expect(screen.queryByTestId('verification-chart-pareto')).toBeNull();
  });

  it('renders nothing when no charts active', () => {
    const charts = makeCharts();
    const active = new Set<VerificationChartId>();

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={() => <div>chart</div>}
      />
    );

    // Chip bar still rendered, but no chart containers
    expect(screen.getByTestId('verification-chip-bar')).toBeDefined();
    expect(screen.queryByTestId('verification-chart-stats')).toBeNull();
  });

  it('does not render chart wrapper when renderChart returns null', () => {
    const charts = makeCharts();
    const active = new Set<VerificationChartId>(['stats', 'ichart']);

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={id => (id === 'stats' ? <div>Stats content</div> : null)}
      />
    );

    expect(screen.getByTestId('verification-chart-stats')).toBeDefined();
    expect(screen.queryByTestId('verification-chart-ichart')).toBeNull();
  });

  it('active chips have aria-pressed=true', () => {
    const charts = makeCharts();
    const active = new Set<VerificationChartId>(['stats']);

    render(
      <VerificationEvidenceBase
        charts={charts}
        activeCharts={active}
        onToggleChart={vi.fn()}
        renderChart={() => <div>chart</div>}
      />
    );

    expect(screen.getByTestId('verification-chip-stats').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('verification-chip-ichart').getAttribute('aria-pressed')).toBe(
      'false'
    );
  });
});
