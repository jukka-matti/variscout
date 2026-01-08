import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnovaResults from '../AnovaResults';
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

  it('should render significant result correctly', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    expect(screen.getByText('ANOVA: Machine')).toBeInTheDocument();
    expect(screen.getByText(/F = 5.42/)).toBeInTheDocument();
    expect(screen.getByText(/p = 0.003/)).toBeInTheDocument();
  });

  it('should render group statistics', () => {
    render(<AnovaResults result={mockResult} factorLabel="Machine" />);

    expect(screen.getByText('Group A:')).toBeInTheDocument();
    expect(screen.getByText('10.0')).toBeInTheDocument();

    expect(screen.getByText('Group B:')).toBeInTheDocument();
    expect(screen.getByText('15.0')).toBeInTheDocument();

    // Both groups have n=5, so we use getAllByText
    const nLabels = screen.getAllByText('(n=5)');
    expect(nLabels).toHaveLength(2);
  });

  it('should render non-significant result correctly', () => {
    const nonSigResult: AnovaResult = {
      ...mockResult,
      isSignificant: false,
      pValue: 0.45,
      fStatistic: 0.8,
      insight: 'No significant difference between groups',
    };

    render(<AnovaResults result={nonSigResult} factorLabel="Machine" />);

    expect(screen.getByText('ANOVA: Machine')).toBeInTheDocument();
    expect(screen.getByText(/F = 0.80/)).toBeInTheDocument();
    expect(screen.getByText(/p = 0.45/)).toBeInTheDocument();
  });

  it('should format very small p-values correctly', () => {
    const smallPResult = {
      ...mockResult,
      pValue: 0.00001,
    };

    render(<AnovaResults result={smallPResult} factorLabel="Machine" />);
    expect(screen.getByText(/p = < 0.001/)).toBeInTheDocument();
  });
});
