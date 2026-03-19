import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const msgs: Record<string, string> = {
          'stats.summary': 'Summary Statistics',
          'stats.histogram': 'Histogram',
          'stats.probPlot': 'Probability Plot',
          'stats.mean': 'Mean',
          'stats.median': 'Median',
          'stats.stdDev': 'Std Dev',
          'stats.samples': 'Samples',
          'stats.passRate': 'Pass Rate',
          'stats.editSpecs': 'Edit specifications',
          'empty.noData': 'No data',
        };
        return msgs[key] ?? key;
      },
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en' as const,
      formatNumber: (v: number) => v.toFixed(2),
      formatStat: (v: number, d = 2) => v.toFixed(d),
      formatPct: (v: number) => `${(v * 100).toFixed(1)}%`,
    }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import StatsPanel from '../StatsPanel';

// Mock the CapabilityHistogram component
vi.mock('../charts/CapabilityHistogram', () => ({
  default: () => <div data-testid="capability-histogram">Histogram Mock</div>,
}));

describe('StatsPanel', () => {
  const mockStats = {
    mean: 10.5,
    median: 10.4,
    stdDev: 1.2,
    sigmaWithin: 1.1,
    mrBar: 1.24,
    ucl: 14.1,
    lcl: 6.9,
    cp: 1.5,
    cpk: 1.2,
    outOfSpecPercentage: 5.5,
  };

  const mockSpecs = {
    usl: 15,
    lsl: 5,
  };

  const mockFilteredData = [{ value: 10 }, { value: 11 }, { value: 9 }];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Summary tab by default', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Summary tab should be active
    const summaryTab = screen.getByText('Summary Statistics');
    expect(summaryTab).toHaveClass('bg-surface-tertiary');

    // Should show pass rate (use getAllByText since HelpTooltip may also contain the term)
    expect(screen.getAllByText('Pass Rate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('94.5%')).toBeInTheDocument(); // 100 - 5.5
  });

  it('switches to Histogram tab on click', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Click Histogram tab
    fireEvent.click(screen.getByText('Histogram'));

    // Histogram tab should now be active
    const histogramTab = screen.getByText('Histogram');
    expect(histogramTab).toHaveClass('bg-surface-tertiary');

    // Should show histogram component
    expect(screen.getByTestId('capability-histogram')).toBeInTheDocument();
  });

  it('displays Cp in the card grid', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Cp label appears multiple times due to HelpTooltip
    expect(screen.getAllByText('Cp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('always shows Cp in the card grid', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Cp is always shown in the new card grid
    expect(screen.getAllByText('Cp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('displays Cpk in the card grid', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Cpk label appears multiple times due to HelpTooltip
    expect(screen.getAllByText('Cpk').length).toBeGreaterThanOrEqual(1);
    // Cpk value (1.20) may appear multiple times if Std Dev is same, use getAllByText
    expect(screen.getAllByText('1.20').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Mean, Median, and Std Dev in the card grid', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Mean, Median, and Std Dev are always shown
    expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10.50')).toBeInTheDocument();
    expect(screen.getAllByText('Median').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10.40')).toBeInTheDocument();
    expect(screen.getAllByText('Std Dev').length).toBeGreaterThanOrEqual(1);
    // Std Dev value (1.20) may appear multiple times if Cpk is same, use getAllByText
    expect(screen.getAllByText('1.20').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Samples count in the card grid', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByText('Samples')).toBeInTheDocument();
    expect(screen.getByText('n=3')).toBeInTheDocument(); // 3 items in mockFilteredData
  });

  it('hides capability metrics when no specs provided', () => {
    render(
      <StatsPanel stats={mockStats} specs={{}} filteredData={mockFilteredData} outcome="value" />
    );

    // Capability metrics should not be shown without specs
    expect(screen.queryByText('Pass Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Cp')).not.toBeInTheDocument();
    expect(screen.queryByText('Cpk')).not.toBeInTheDocument();

    // Basic stats should still be shown
    expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Std Dev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Samples')).toBeInTheDocument();
  });

  it('shows "Edit specifications" pencil link when onSaveSpecs provided and no specs', () => {
    const onSaveSpecs = vi.fn();
    render(
      <StatsPanel
        stats={mockStats}
        specs={{}}
        filteredData={mockFilteredData}
        outcome="value"
        onSaveSpecs={onSaveSpecs}
      />
    );

    expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });

  it('shows "Edit specifications" pencil link when specs exist and onSaveSpecs provided', () => {
    const onSaveSpecs = vi.fn();
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
        onSaveSpecs={onSaveSpecs}
      />
    );

    expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });

  it('does not show pencil link when onSaveSpecs not provided', () => {
    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.queryByTestId('edit-specs-link')).not.toBeInTheDocument();
  });
});
