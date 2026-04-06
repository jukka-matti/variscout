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
    useAnalysisStats: () => ({ stats: mockStats }),
    useFilteredData: () => ({ filteredData: mockFilteredData }),
  };
});

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

const mockSpecs = { usl: 15, lsl: 5 };
const mockFilteredData = [{ value: 10 }, { value: 11 }, { value: 9 }];

// Set up projectStore state before import
import { useProjectStore } from '@variscout/stores';

import { render, screen } from '@testing-library/react';
import ProcessIntelligencePanel from '../ProcessIntelligencePanel';

describe('ProcessIntelligencePanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Seed the project store with test data
    useProjectStore.setState({
      specs: mockSpecs,
      outcome: 'value',
      cpkTarget: undefined,
      factors: [],
    });
  });

  it('shows Stats tab content by default', () => {
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Stats tab should be active
    const statsTab = screen.getByTestId('pi-tab-stats');
    expect(statsTab).toHaveClass('bg-surface-tertiary');

    // Should show pass rate
    expect(screen.getAllByText('Pass Rate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('94.5%')).toBeInTheDocument();
  });

  it('displays Cp when specs are set', () => {
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getAllByText('Cp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('shows Mean, Median, and Std Dev in the card grid', () => {
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10.50')).toBeInTheDocument();
    expect(screen.getAllByText('Median').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10.40')).toBeInTheDocument();
    expect(screen.getAllByText('Std Dev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1.20').length).toBeGreaterThanOrEqual(1);
  });

  it('shows sample count', () => {
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByTestId('stat-value-samples')).toBeInTheDocument();
    expect(screen.getByText('n=3')).toBeInTheDocument();
  });

  it('shows "Edit specifications" pencil link', () => {
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });

  it('hides capability metrics when no specs', () => {
    useProjectStore.setState({ specs: {} });
    render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={{}}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.queryByText('Pass Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Cp')).not.toBeInTheDocument();
    expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
  });

  it('renders compact mode', () => {
    const { container } = render(
      <ProcessIntelligencePanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
        compact
      />
    );

    expect(container.querySelector('.scroll-touch')).not.toBeNull();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });
});
