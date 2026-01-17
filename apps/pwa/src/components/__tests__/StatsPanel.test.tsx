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

    // Should show pass rate
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
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

    expect(screen.getByText('Cp')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('hides Cp when showCp is false', () => {
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

    expect(screen.queryByText('Cp')).not.toBeInTheDocument();
  });

  it('displays Cpk when showCpk is true', () => {
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

    expect(screen.getByText('Cpk')).toBeInTheDocument();
    expect(screen.getByText('1.20')).toBeInTheDocument();
  });

  it('hides Cpk when showCpk is false', () => {
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

    expect(screen.queryByText('Cpk')).not.toBeInTheDocument();
  });

  it('shows conformance stats (rejected percentage)', () => {
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

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();
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
