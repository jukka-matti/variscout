import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnovaResults } from '@variscout/ui';
import type { AnovaResult } from '@variscout/core';

describe('AnovaResults', () => {
  const mockResult: AnovaResult = {
    isSignificant: true,
    pValue: 0.003,
    fStatistic: 5.42,
    groups: [
      { name: 'Group A', mean: 10, n: 5, stdDev: 1 },
      { name: 'Group B', mean: 15, n: 5, stdDev: 1 },
    ],
    etaSquared: 0.45,
    insight: 'Group B is significantly higher than Group A',
    ssb: 62.5,
    ssw: 8,
    dfBetween: 1,
    dfWithin: 8,
    msb: 62.5,
    msw: 1,
  };

  it('should render nothing when result is null', () => {
    const { container } = render(<AnovaResults result={null} factorLabel="Machine" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render the ANOVA table with correct structure', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    // Title
    expect(screen.getByText('One-Way ANOVA')).toBeInTheDocument();

    // Table headers
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('DF')).toBeInTheDocument();
    expect(screen.getByText('SS')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();

    // Factor row: label, DF, SS
    expect(screen.getByText('Machine')).toBeInTheDocument();

    // Error and Total rows
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should display ANOVA table rows correctly', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Factor row: Machine | 1 | 63 | 5.42 | 0.003
    const factorCells = rows[0].querySelectorAll('td');
    expect(factorCells[0].textContent).toBe('Machine');
    expect(factorCells[1].textContent).toBe('1'); // dfBetween
    expect(factorCells[2].textContent).toBe('63'); // ssb rounded

    // Error row: Error | 8 | 8
    const errorCells = rows[1].querySelectorAll('td');
    expect(errorCells[0].textContent).toBe('Error');
    expect(errorCells[1].textContent).toBe('8'); // dfWithin

    // Total row: Total | 9 | 71
    const totalCells = rows[2].querySelectorAll('td');
    expect(totalCells[0].textContent).toBe('Total');
    expect(totalCells[1].textContent).toBe('9'); // dfTotal
  });

  it('should display eta-squared with percentage', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    const etaSquared = screen.getByTestId('anova-eta-squared');
    expect(etaSquared).toBeInTheDocument();
    // Should show "45.0% of variation explained"
    expect(etaSquared.textContent).toMatch(/45\.0%/);
    expect(etaSquared.textContent).toMatch(/variation explained/);
  });

  it('should preserve data-testid attributes for E2E compatibility', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    expect(screen.getByTestId('anova-results')).toBeInTheDocument();
    expect(screen.getByTestId('anova-significance')).toBeInTheDocument();
    expect(screen.getByTestId('anova-eta-squared')).toBeInTheDocument();
  });

  it('should format very small p-values as <0.001', () => {
    const smallPResult: AnovaResult = {
      ...mockResult,
      pValue: 0.00001,
    };

    render(<AnovaResults result={smallPResult} factorLabel="Machine" />);
    expect(screen.getByText('<0.001')).toBeInTheDocument();
  });

  it('should format p-value to 3 decimal places', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);
    expect(screen.getByText('0.003')).toBeInTheDocument();
  });

  it('should render accessible table with aria-label', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'ANOVA table for Machine');
  });

  it('should not show eta-squared when zero', () => {
    const zeroEtaResult: AnovaResult = {
      ...mockResult,
      etaSquared: 0,
    };

    render(<AnovaResults result={zeroEtaResult} factorLabel="Machine" />);
    expect(screen.queryByTestId('anova-eta-squared')).not.toBeInTheDocument();
  });
});
