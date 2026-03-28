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
import * as DataContextModule from '../../context/DataContext';

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
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Summary tab should be active (surface-tertiary background)
    const summaryTab = screen.getByText('Summary Statistics');
    expect(summaryTab).toHaveClass('bg-surface-tertiary');

    // Should show pass rate (use getAllByText since HelpTooltip may also contain the term)
    expect(screen.getAllByText('Pass Rate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('94.5%')).toBeInTheDocument(); // 100 - 5.5
  });

  it('switches to Data tab on click', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Click Data tab
    fireEvent.click(screen.getByText('Data'));

    // Data tab should now be active
    const dataTab = screen.getByText('Data');
    expect(dataTab).toHaveClass('bg-surface-tertiary');
  });

  it('displays Cp when specs are set', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

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

  it('always shows Cp and Cpk in the card grid when specs are set', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Both Cp and Cpk always shown when specs exist
    expect(screen.getAllByText('Cp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.50')).toBeInTheDocument();
    expect(screen.getAllByText('Cpk').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1.20').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Mean, Median, and Std Dev in the card grid', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

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
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

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

  it('shows "Edit specifications" pencil link when no specs provided', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(
      <StatsPanel stats={mockStats} specs={{}} filteredData={mockFilteredData} outcome="value" />
    );

    // Should show pencil link to set specs
    expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });

  it('shows "Edit specifications" pencil link when specs are set', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
    expect(screen.getByText('Edit specifications')).toBeInTheDocument();
  });

  describe('compact mode', () => {
    it('shows pencil link in compact mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as unknown as ReturnType<typeof DataContextModule.useData>);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
          compact
        />
      );

      expect(screen.getByTestId('edit-specs-link')).toBeInTheDocument();
      expect(screen.getByText('Edit specifications')).toBeInTheDocument();
    });

    it('shows metrics in compact mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as unknown as ReturnType<typeof DataContextModule.useData>);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
          compact
        />
      );

      expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('10.50')).toBeInTheDocument();
      expect(screen.getByText('n=3')).toBeInTheDocument();
    });

    it('switches tabs in compact mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as unknown as ReturnType<typeof DataContextModule.useData>);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
          compact
        />
      );

      fireEvent.click(screen.getByText('Data'));
      // Data tab shows empty state since no renderDataTable is passed
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
