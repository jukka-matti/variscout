import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegressionPanel from '../RegressionPanel';
import * as DataContextModule from '../../context/DataContext';
import * as CoreModule from '@variscout/core';

// Mock charts
vi.mock('@variscout/charts', () => ({
  ScatterPlot: () => <div data-testid="scatter-plot">Scatter Plot Mock</div>,
}));

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateRegression: vi.fn(),
  };
});

describe('RegressionPanel', () => {
  const mockRegressionResult = {
    xColumn: 'Speed',
    yColumn: 'Output',
    n: 10,
    linear: {
      slope: 2,
      intercept: 1,
      rSquared: 0.95,
      pValue: 0.001,
      isSignificant: true,
    },
    recommendedFit: 'linear',
    strengthRating: 5,
    insight: 'Strong positive relationship',
    points: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when no outcome selected', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: null,
      filteredData: [],
      specs: {},
    } as any);

    render(<RegressionPanel />);
    expect(
      screen.getByText('Select an outcome variable to view regression analysis')
    ).toBeInTheDocument();
  });

  it('shows empty state when no numeric columns available', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: 'Result',
      filteredData: [{ Result: 10, Category: 'A' }], // Only outcome is numeric
      specs: {},
    } as any);

    render(<RegressionPanel />);
    expect(screen.getByText('No numeric columns available for regression')).toBeInTheDocument();
  });

  it('renders regression plots when data is available', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: 'Output',
      filteredData: [
        { Output: 10, Speed: 5 },
        { Output: 20, Speed: 10 },
        { Output: 30, Speed: 15 },
      ],
      specs: {},
    } as any);

    vi.spyOn(CoreModule, 'calculateRegression').mockReturnValue(mockRegressionResult as any);

    render(<RegressionPanel />);

    // Should auto-select 'Speed'
    expect(screen.getByText('Speed vs Output')).toBeInTheDocument();
    expect(screen.getByText(/R²=0.95/)).toBeInTheDocument();
    expect(screen.getByTestId('scatter-plot')).toBeInTheDocument();
  });

  it('allows expanding a chart', async () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: 'Output',
      filteredData: [
        { Output: 10, Speed: 5 },
        { Output: 20, Speed: 10 },
        { Output: 30, Speed: 15 },
      ],
      specs: {},
    } as any);

    vi.spyOn(CoreModule, 'calculateRegression').mockReturnValue(mockRegressionResult as any);

    render(<RegressionPanel />);

    // Click on the chart (event bubbles to container)
    fireEvent.click(screen.getByTestId('scatter-plot'));

    // Check for detailed stats in modal - Slope only appears in the modal
    // This confirms the modal is open
    await waitFor(() => {
      expect(screen.getByText('Slope:')).toBeInTheDocument();
    });

    expect(screen.getByText('2.0000')).toBeInTheDocument();
    expect(screen.getByText('Strong positive relationship')).toBeInTheDocument();
  });

  it('displays ranking when multiple X columns exist', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      outcome: 'Output',
      filteredData: [
        { Output: 10, Speed: 5, Temp: 100 },
        { Output: 20, Speed: 10, Temp: 110 },
        { Output: 30, Speed: 15, Temp: 120 },
      ],
      specs: {},
    } as any);

    // Mock two results with different R²
    vi.spyOn(CoreModule, 'calculateRegression')
      .mockReturnValueOnce(mockRegressionResult as any) // Speed: 0.95
      .mockReturnValueOnce({
        ...mockRegressionResult,
        xColumn: 'Temp',
        linear: { ...mockRegressionResult.linear, rSquared: 0.5 },
        strengthRating: 2,
      } as any); // Temp: 0.5

    render(<RegressionPanel />);

    expect(screen.getByText('Ranking:')).toBeInTheDocument();

    // Check that Speed and Temp appear in the document (multiple times due to selector chips)
    expect(screen.getAllByText('Speed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Temp').length).toBeGreaterThan(0);
  });
});
