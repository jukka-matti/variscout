import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquationDisplay, { formatEquation } from '../EquationDisplay';
import type { BestSubsetResult } from '@variscout/core/stats';
import type { PredictorInfo } from '@variscout/core/types';

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

// ---------------------------------------------------------------------------
// Helpers for natural language (continuous / mixed) mode
// ---------------------------------------------------------------------------

function makeMixedSubset(): BestSubsetResult {
  return {
    factors: ['Temp', 'Supplier'],
    factorCount: 2,
    rSquared: 0.75,
    rSquaredAdj: 0.74,
    fStatistic: 612.3,
    pValue: 0.00001,
    isSignificant: true,
    dfModel: 4,
    levelEffects: new Map([
      [
        'Supplier',
        new Map([
          ['A', 12.3],
          ['B', -3.1],
        ]),
      ],
    ]),
    cellMeans: new Map(),
    predictors: undefined,
    intercept: 60.1,
    rmse: 2.1,
    factorTypes: new Map([
      ['Temp', 'continuous'],
      ['Supplier', 'categorical'],
    ]),
  };
}

function makeContinuousPredictors(): PredictorInfo[] {
  return [
    {
      name: 'Temp',
      factorName: 'Temp',
      type: 'continuous',
      coefficient: 0.4,
      standardError: 0.02,
      tStatistic: 20,
      pValue: 0.0001,
      isSignificant: true,
    },
    {
      name: 'Supplier',
      factorName: 'Supplier',
      type: 'categorical',
      level: 'A',
      coefficient: 12.3,
      standardError: 0.5,
      tStatistic: 24.6,
      pValue: 0.0001,
      isSignificant: true,
    },
    {
      name: 'Supplier',
      factorName: 'Supplier',
      type: 'categorical',
      level: 'B',
      coefficient: -3.1,
      standardError: 0.5,
      tStatistic: -6.2,
      pValue: 0.0001,
      isSignificant: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Tests: natural language mode (predictors provided)
// ---------------------------------------------------------------------------

describe('EquationDisplay — natural language mode', () => {
  it('renders predicted value header instead of equation text', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('equation-predicted')).toBeInTheDocument();
    expect(screen.queryByTestId('equation-text')).not.toBeInTheDocument();
  });

  it('shows trust badge with correct label for strong model', () => {
    const subset = makeMixedSubset(); // r2Adj = 0.74, isSignificant = true
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    const badge = screen.getByTestId('trust-badge');
    expect(badge.textContent).toContain('Strong model');
  });

  it('shows amber trust badge for moderate model (r2Adj = 0.45)', () => {
    const subset = { ...makeMixedSubset(), rSquaredAdj: 0.45 };
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('trust-badge').textContent).toContain('Moderate model');
  });

  it('shows red trust badge for weak model (r2Adj = 0.15)', () => {
    const subset = { ...makeMixedSubset(), rSquaredAdj: 0.15 };
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('trust-badge').textContent).toContain('Weak model');
  });

  it('renders factor chips for each factor', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('equation-factor-chips')).toBeInTheDocument();
    expect(screen.getByTestId('equation-chip-Temp')).toBeInTheDocument();
    expect(screen.getByTestId('equation-chip-Supplier')).toBeInTheDocument();
  });

  it('calls onFactorClick when chip is clicked', () => {
    const onFactorClick = vi.fn();
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
        onFactorClick={onFactorClick}
      />
    );

    fireEvent.click(screen.getByTestId('equation-chip-Temp'));
    expect(onFactorClick).toHaveBeenCalledWith('Temp');
  });

  it('shows "+N more" pill when there are more than 3 factors', () => {
    const subset: BestSubsetResult = {
      ...makeMixedSubset(),
      factors: ['Temp', 'Supplier', 'Machine', 'Shift'],
      factorTypes: new Map([
        ['Temp', 'continuous'],
        ['Supplier', 'categorical'],
        ['Machine', 'categorical'],
        ['Shift', 'categorical'],
      ]),
      levelEffects: new Map([
        ['Supplier', new Map([['A', 12.3]])],
        ['Machine', new Map([['M1', 5.0]])],
        ['Shift', new Map([['Day', -2.0]])],
      ]),
    };

    const predictors: PredictorInfo[] = [
      ...makeContinuousPredictors(),
      {
        name: 'Machine',
        factorName: 'Machine',
        type: 'categorical',
        level: 'M1',
        coefficient: 5.0,
        standardError: 0.5,
        tStatistic: 10,
        pValue: 0.0001,
        isSignificant: true,
      },
      {
        name: 'Shift',
        factorName: 'Shift',
        type: 'categorical',
        level: 'Day',
        coefficient: -2.0,
        standardError: 0.3,
        tStatistic: -6.7,
        pValue: 0.0001,
        isSignificant: true,
      },
    ];

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('equation-chips-overflow')).toBeInTheDocument();
    expect(screen.getByTestId('equation-chips-overflow').textContent).toContain('+1 more');
  });

  it('expands to show math equation when toggle is clicked', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
        rmse={2.1}
        n={847}
        fStatistic={612.3}
      />
    );

    // Math equation hidden initially
    expect(screen.queryByTestId('equation-math-expanded')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByTestId('equation-expand-toggle'));

    expect(screen.getByTestId('equation-math-expanded')).toBeInTheDocument();
    expect(screen.getByTestId('equation-math-text').textContent).toContain('60.1');
  });

  it('shows model stats line in expanded view', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
        rmse={2.1}
        n={847}
        fStatistic={612.3}
      />
    );

    fireEvent.click(screen.getByTestId('equation-expand-toggle'));

    const statsLine = screen.getByTestId('equation-model-stats');
    expect(statsLine.textContent).toContain('74%'); // R²adj
    expect(statsLine.textContent).toContain('2.10'); // RMSE
  });

  it('shows warnings below the card', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
        warnings={['Multicollinearity detected in Temp and Supplier']}
      />
    );

    expect(screen.getByTestId('equation-warning-0').textContent).toContain('Multicollinearity');
  });

  it('shows quadratic warning when hasQuadraticTerms is true', () => {
    const subset = makeMixedSubset();
    const predictors = makeContinuousPredictors();

    render(
      <EquationDisplay
        bestSubset={subset}
        grandMean={60.1}
        outcome="Moisture"
        predictors={predictors}
        intercept={60.1}
        hasQuadraticTerms
      />
    );

    expect(screen.getByTestId('equation-warning-0').textContent).toContain('Quadratic terms');
  });
});

// ---------------------------------------------------------------------------
// Tests: TrustBadge helper (via component)
// ---------------------------------------------------------------------------

describe('TrustBadge trust thresholds', () => {
  const makeSubsetWithR2 = (r2Adj: number, isSignificant = true): BestSubsetResult => ({
    ...makeMixedSubset(),
    rSquaredAdj: r2Adj,
    isSignificant,
  });

  it('shows Weak model when not significant regardless of r2', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubsetWithR2(0.75, false)}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeContinuousPredictors()}
        intercept={60.1}
      />
    );

    // r2 >= 0.6 but not significant → Weak
    expect(screen.getByTestId('trust-badge').textContent).toContain('Weak model');
  });

  it('boundary: r2Adj exactly 0.60 with significant → Strong', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubsetWithR2(0.6, true)}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeContinuousPredictors()}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('trust-badge').textContent).toContain('Strong model');
  });

  it('boundary: r2Adj exactly 0.30 → Moderate', () => {
    render(
      <EquationDisplay
        bestSubset={makeSubsetWithR2(0.3, true)}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeContinuousPredictors()}
        intercept={60.1}
      />
    );

    expect(screen.getByTestId('trust-badge').textContent).toContain('Moderate model');
  });
});

// ---------------------------------------------------------------------------
// Tests: interaction chip + qualification badge
// ---------------------------------------------------------------------------

function makeInteractionPredictors(): PredictorInfo[] {
  return [
    ...makeContinuousPredictors(),
    {
      name: 'Temp×Supplier',
      factorName: 'Temp×Supplier',
      type: 'interaction',
      sourceFactors: ['Temp', 'Supplier'] as [string, string],
      interactionType: 'cont×cat',
      coefficient: -0.18,
      standardError: 0.04,
      tStatistic: -4.5,
      pValue: 0.0001,
      isSignificant: true,
    },
  ];
}

describe('EquationDisplay — interaction chip + qualification badge', () => {
  it('renders interaction chip with × glyph', () => {
    render(
      <EquationDisplay
        bestSubset={makeMixedSubset()}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeInteractionPredictors()}
        intercept={60.1}
      />
    );

    const chips = screen.getByTestId('equation-factor-chips');
    expect(chips.textContent).toContain('×');
    expect(chips.textContent).toContain('Temp');
    expect(chips.textContent).toContain('Supplier');
  });

  it('shows qualification badge when interaction terms present', () => {
    render(
      <EquationDisplay
        bestSubset={makeMixedSubset()}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeInteractionPredictors()}
        intercept={60.1}
      />
    );

    const note = screen.getByTestId('equation-interaction-note');
    expect(note).toBeInTheDocument();
    expect(note.textContent).toContain('combined effects');
  });

  it('does not show qualification badge when no interaction terms', () => {
    render(
      <EquationDisplay
        bestSubset={makeMixedSubset()}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeContinuousPredictors()}
        intercept={60.1}
      />
    );

    expect(screen.queryByTestId('equation-interaction-note')).not.toBeInTheDocument();
  });

  it('includes interaction term in expanded math equation', () => {
    render(
      <EquationDisplay
        bestSubset={makeMixedSubset()}
        grandMean={60.1}
        outcome="Moisture"
        predictors={makeInteractionPredictors()}
        intercept={60.1}
      />
    );

    fireEvent.click(screen.getByTestId('equation-expand-toggle'));

    const mathText = screen.getByTestId('equation-math-text');
    expect(mathText.textContent).toContain('×');
    expect(mathText.textContent).toContain('Temp');
    expect(mathText.textContent).toContain('Supplier');
  });

  it('groups multiple dummy entries for the same interaction pair into one chip', () => {
    const twoLevelInteraction: PredictorInfo[] = [
      ...makeContinuousPredictors(),
      {
        name: 'Temp×Supplier:A',
        factorName: 'Temp×Supplier:A',
        type: 'interaction',
        sourceFactors: ['Temp', 'Supplier'] as [string, string],
        interactionType: 'cont×cat',
        coefficient: -0.18,
        standardError: 0.04,
        tStatistic: -4.5,
        pValue: 0.0001,
        isSignificant: true,
      },
      {
        name: 'Temp×Supplier:B',
        factorName: 'Temp×Supplier:B',
        type: 'interaction',
        sourceFactors: ['Temp', 'Supplier'] as [string, string],
        interactionType: 'cont×cat',
        coefficient: 0.05,
        standardError: 0.04,
        tStatistic: 1.25,
        pValue: 0.21,
        isSignificant: false,
      },
    ];

    render(
      <EquationDisplay
        bestSubset={makeMixedSubset()}
        grandMean={60.1}
        outcome="Moisture"
        predictors={twoLevelInteraction}
        intercept={60.1}
      />
    );

    // Only one interaction chip should appear (grouped)
    const chips = screen.getByTestId('equation-factor-chips');
    // Count how many buttons contain '×' — should be exactly 1 interaction chip
    const allButtons = chips.querySelectorAll('button');
    const interactionButtons = Array.from(allButtons).filter(b => b.textContent?.includes('×'));
    expect(interactionButtons).toHaveLength(1);
  });
});
