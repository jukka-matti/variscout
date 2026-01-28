import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    stdDev: 1.2,
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
      displayOptions: { showCp: true, showCpk: true },
    } as any);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Summary tab should be active (surface-tertiary background)
    const summaryTab = screen.getByText('Summary');
    expect(summaryTab).toHaveClass('bg-surface-tertiary');

    // Should show pass rate (use getAllByText since HelpTooltip may also contain the term)
    expect(screen.getAllByText('Pass Rate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('94.5%')).toBeInTheDocument(); // 100 - 5.5
  });

  it('switches to Histogram tab on click', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: true },
    } as any);

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

  it('displays Cp when showCp is true', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: false },
    } as any);

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

  it('always shows Cp in the card grid (regardless of displayOptions)', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: false, showCpk: true },
    } as any);

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
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: false, showCpk: true },
    } as any);

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

  it('shows Mean and Std Dev in the card grid', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: false },
    } as any);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    // Mean and Std Dev are always shown in the new card grid
    expect(screen.getAllByText('Mean').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10.50')).toBeInTheDocument();
    expect(screen.getAllByText('Std Dev').length).toBeGreaterThanOrEqual(1);
    // Std Dev value (1.20) may appear multiple times if Cpk is same, use getAllByText
    expect(screen.getAllByText('1.20').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Samples count in the card grid', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: false, showCpk: false },
    } as any);

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

  it('shows spec limits in footer', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: true },
    } as any);

    render(
      <StatsPanel
        stats={mockStats}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByText('USL:')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('LSL:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows "Add Specs" prompt when no specs provided', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: true },
    } as any);

    render(
      <StatsPanel stats={mockStats} specs={{}} filteredData={mockFilteredData} outcome="value" />
    );

    expect(screen.getByText('Add Specs')).toBeInTheDocument();
  });

  it('shows grade counts when provided', () => {
    const statsWithGrades = {
      ...mockStats,
      gradeCounts: [
        { label: 'Grade A', count: 50, percentage: 50, color: '#22c55e' },
        { label: 'Grade B', count: 30, percentage: 30, color: '#eab308' },
        { label: 'Grade C', count: 20, percentage: 20, color: '#ef4444' },
      ],
    };

    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      displayOptions: { showCp: true, showCpk: true },
    } as any);

    render(
      <StatsPanel
        stats={statsWithGrades}
        specs={mockSpecs}
        filteredData={mockFilteredData}
        outcome="value"
      />
    );

    expect(screen.getByText('Grade A')).toBeInTheDocument();
    expect(screen.getByText('Grade B')).toBeInTheDocument();
    expect(screen.getByText('Grade C')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });
});
