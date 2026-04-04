import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquationDisplay, { formatEquation } from '../EquationDisplay';
import type { BestSubsetResult } from '@variscout/core/stats';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSubset(overrides: Partial<BestSubsetResult> = {}): BestSubsetResult {
  return {
    factors: ['Shift', 'Head'],
    factorCount: 2,
    rSquared: 0.4,
    rSquaredAdj: 0.38,
    fStatistic: 15.2,
    pValue: 0.001,
    isSignificant: true,
    dfModel: 3,
    levelEffects: new Map([
      [
        'Shift',
        new Map([
          ['Day', -0.3],
          ['Night', 0.8],
        ]),
      ],
      [
        'Head',
        new Map([
          ['1-4', -0.2],
          ['5-8', 0.5],
        ]),
      ],
    ]),
    cellMeans: new Map([
      ['Day\x001-4', { mean: 11.6, n: 94 }],
      ['Day\x005-8', { mean: 12.4, n: 86 }],
      ['Night\x001-4', { mean: 12.7, n: 72 }],
      ['Night\x005-8', { mean: 13.4, n: 48 }],
    ]),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: formatEquation
// ---------------------------------------------------------------------------

describe('formatEquation', () => {
  it('builds equation string with outcome name and grand mean', () => {
    const eq = formatEquation(makeSubset(), 12.1, 'Fill Weight');

    expect(eq).toContain('Fill Weight = 12.1');
    expect(eq).toContain('Shift(');
    expect(eq).toContain('Head(');
  });
});

// ---------------------------------------------------------------------------
// Tests: EquationDisplay component
// ---------------------------------------------------------------------------

describe('EquationDisplay', () => {
  it('renders equation text with outcome name and grand mean', () => {
    render(<EquationDisplay bestSubset={makeSubset()} grandMean={12.1} outcome="Fill Weight" />);

    const eqText = screen.getByTestId('equation-text');
    expect(eqText.textContent).toContain('Fill Weight = 12.1');
  });

  it('shows R\u00b2adj badge', () => {
    render(<EquationDisplay bestSubset={makeSubset()} grandMean={12.1} outcome="Fill Weight" />);

    expect(screen.getByText(/R\u00b2adj 38%/)).toBeInTheDocument();
  });

  it('shows worst/best case row', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubset()}
        grandMean={12.1}
        outcome="Fill Weight"
        characteristicType="smaller"
      />
    );

    const extremes = screen.getByTestId('equation-extremes');
    expect(extremes.textContent).toContain('Worst:');
    expect(extremes.textContent).toContain('Best:');
    expect(extremes.textContent).toContain('Range:');
  });

  it('shows interaction warning when interactionDetected is true', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubset()}
        grandMean={12.1}
        outcome="Fill Weight"
        interactionDetected
      />
    );

    expect(screen.getByTestId('equation-interaction-warning')).toBeInTheDocument();
    expect(screen.getByText(/Interaction detected/)).toBeInTheDocument();
  });

  it('does not show interaction warning when interactionDetected is falsy', () => {
    render(<EquationDisplay bestSubset={makeSubset()} grandMean={12.1} outcome="Fill Weight" />);

    expect(screen.queryByTestId('equation-interaction-warning')).not.toBeInTheDocument();
  });

  it('flips worst/best correctly for "larger" characteristicType', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubset()}
        grandMean={12.1}
        outcome="Fill Weight"
        characteristicType="larger"
      />
    );

    const extremes = screen.getByTestId('equation-extremes');
    // For larger-is-better: worst = lowest mean (Day+1-4 = 11.6), best = highest (Night+5-8 = 13.4)
    expect(extremes.textContent).toContain('Worst: Day + 1-4');
    expect(extremes.textContent).toContain('Best: Night + 5-8');
  });

  it('expandable section shows cell counts', () => {
    render(<EquationDisplay bestSubset={makeSubset()} grandMean={12.1} outcome="Fill Weight" />);

    // Cell counts should be hidden initially
    expect(screen.queryByTestId('equation-cell-counts')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByTestId('equation-cell-toggle'));
    expect(screen.getByTestId('equation-cell-counts')).toBeInTheDocument();
    // Should show all 4 cells
    expect(screen.getByText(/Day\+1-4=94/)).toBeInTheDocument();
    expect(screen.getByText(/Night\+5-8=48/)).toBeInTheDocument();
  });
});
