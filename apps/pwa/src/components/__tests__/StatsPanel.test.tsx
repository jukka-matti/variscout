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
      setSpecs: vi.fn(),
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

  it('displays Cp when specs are set', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
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

  it('always shows Cp and Cpk in the card grid when specs are set', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as any);

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
    } as any);

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

  it('shows inline spec inputs when no specs provided', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      setSpecs: vi.fn(),
    } as any);

    render(
      <StatsPanel stats={mockStats} specs={{}} filteredData={mockFilteredData} outcome="value" />
    );

    // Should show inline spec inputs instead of capability cards
    expect(screen.getByTestId('inline-spec-inputs')).toBeInTheDocument();
    expect(screen.getByText('What should this measure be?')).toBeInTheDocument();
    // Still shows Edit Specifications button in footer
    expect(screen.getByText('Edit Specifications')).toBeInTheDocument();
  });

  describe('inline spec editing', () => {
    it('shows pencil edit button when specs are set', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
        />
      );

      expect(screen.getByTestId('edit-specs-button')).toBeInTheDocument();
      expect(screen.getByText('Edit spec limits')).toBeInTheDocument();
    });

    it('enters edit mode with pre-populated inputs on click', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={{ ...mockSpecs, target: 10 }}
          filteredData={mockFilteredData}
          outcome="value"
        />
      );

      fireEvent.click(screen.getByTestId('edit-specs-button'));

      // Should show edit mode inputs
      expect(screen.getByTestId('inline-spec-inputs')).toBeInTheDocument();
      expect(screen.getByText('Edit specification limits')).toBeInTheDocument();

      // Target input should be pre-populated
      const targetInput = screen.getByLabelText('Target') as HTMLInputElement;
      expect(targetInput.value).toBe('10');

      // LSL/USL should be expanded and pre-populated
      const lslInput = screen.getByLabelText('LSL (Min)') as HTMLInputElement;
      expect(lslInput.value).toBe('5');
      const uslInput = screen.getByLabelText('USL (Max)') as HTMLInputElement;
      expect(uslInput.value).toBe('15');

      // Capability cards should be hidden during edit
      expect(screen.queryByText('Pass Rate')).not.toBeInTheDocument();
    });

    it('shows Clear specs and Done buttons in edit mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
        />
      );

      fireEvent.click(screen.getByTestId('edit-specs-button'));

      expect(screen.getByTestId('clear-specs-button')).toBeInTheDocument();
      expect(screen.getByText('Clear specs')).toBeInTheDocument();
      expect(screen.getByTestId('done-specs-button')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('clears specs when Clear is clicked', () => {
      const setSpecs = vi.fn();
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs,
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
        />
      );

      fireEvent.click(screen.getByTestId('edit-specs-button'));
      fireEvent.click(screen.getByTestId('clear-specs-button'));

      expect(setSpecs).toHaveBeenCalledWith({});
    });
  });

  describe('compact mode', () => {
    it('hides Edit Specifications button in compact mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
          compact
        />
      );

      expect(screen.queryByText('Edit Specifications')).not.toBeInTheDocument();
    });

    it('shows metrics in compact mode', () => {
      vi.spyOn(DataContextModule, 'useData').mockReturnValue({
        setSpecs: vi.fn(),
      } as any);

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
      } as any);

      render(
        <StatsPanel
          stats={mockStats}
          specs={mockSpecs}
          filteredData={mockFilteredData}
          outcome="value"
          compact
        />
      );

      fireEvent.click(screen.getByText('Histogram'));
      expect(screen.getByTestId('capability-histogram')).toBeInTheDocument();
    });
  });
});
