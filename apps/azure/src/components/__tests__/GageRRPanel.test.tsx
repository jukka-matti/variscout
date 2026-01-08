import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GageRRPanel from '../GageRRPanel';
import * as DataContextModule from '../../context/DataContext';
import * as CoreModule from '@variscout/core';

// Mock charts
vi.mock('@variscout/charts', () => ({
  GageRRChart: () => <div data-testid="gagerr-chart">Gage R&R Chart Mock</div>,
  InteractionPlot: () => <div data-testid="interaction-plot">Interaction Plot Mock</div>,
}));

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateGageRR: vi.fn(),
  };
});

describe('GageRRPanel', () => {
  const mockGageResult = {
    pctGRR: 8.5,
    verdict: 'excellent',
    verdictText: 'Measurement system is acceptable.',
    pctPart: 95,
    pctRepeatability: 5,
    pctReproducibility: 3,
    varGRR: 0.1,
    varTotal: 1.0,
    partCount: 5,
    operatorCount: 3,
    replicates: 2,
    totalMeasurements: 30,
    interactionData: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows warning when columns are insufficient', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      filteredData: [],
      outcome: null,
      factors: [],
    } as any);

    render(<GageRRPanel />);
    expect(
      screen.getByText('Gage R&R requires at least 2 categorical columns')
    ).toBeInTheDocument();
  });

  it('renders results when valid data is present', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      filteredData: [
        { Part: 'P1', Op: 'A', Measure: 10 },
        { Part: 'P1', Op: 'B', Measure: 10 },
      ],
      outcome: 'Measure',
      factors: ['Part', 'Op'],
    } as any);

    vi.spyOn(CoreModule, 'calculateGageRR').mockReturnValue(mockGageResult as any);

    render(<GageRRPanel />);

    // Check selectors exist
    expect(screen.getByText('Part:')).toBeInTheDocument();
    expect(screen.getByText('Operator:')).toBeInTheDocument();

    // Check results
    expect(screen.getByText('8.5%')).toBeInTheDocument();
    expect(screen.getByText('excellent')).toBeInTheDocument();
    expect(screen.getByTestId('gagerr-chart')).toBeInTheDocument();
    expect(screen.getByTestId('interaction-plot')).toBeInTheDocument();
  });

  it('shows error state when calculation fails (returns null)', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      filteredData: [
        { Part: 'P1', Op: 'A', Measure: 10 },
        { Part: 'P1', Op: 'B', Measure: 10 },
      ],
      outcome: 'Measure',
      factors: ['Part', 'Op'],
    } as any);

    vi.spyOn(CoreModule, 'calculateGageRR').mockReturnValue(null);

    render(<GageRRPanel />);

    expect(screen.getByText('Unable to calculate Gage R&R')).toBeInTheDocument();
  });

  it('updates selectors when changed', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      filteredData: [{ Part: 'P1', Op: 'A', Measure: 10, Other: 'X' }],
      outcome: 'Measure',
      factors: ['Part', 'Op', 'Other'],
    } as any);

    vi.spyOn(CoreModule, 'calculateGageRR').mockReturnValue(mockGageResult as any);

    render(<GageRRPanel />);

    // Find the Part selector
    const partSelect = screen.getAllByRole('combobox')[0]; // Assuming Part is first
    fireEvent.change(partSelect, { target: { value: 'Other' } });

    expect(partSelect).toHaveValue('Other');
  });
});
