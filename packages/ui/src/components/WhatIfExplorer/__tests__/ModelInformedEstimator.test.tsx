import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelInformedEstimator from '../ModelInformedEstimator';
import type { ModelInformedEstimatorProps } from '../types';

// Mock @variscout/hooks
vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (n: number, decimals?: number) => {
      if (decimals !== undefined) return n.toFixed(decimals);
      return n % 1 === 0 ? String(n) : n.toFixed(2);
    },
    formatPct: (n: number) => `${n}%`,
    locale: 'en',
  }),
}));

// Mock @variscout/core
vi.mock('@variscout/core', () => ({
  simulateDirectAdjustment: vi.fn(
    (
      stats: { mean: number; stdDev: number; cpk?: number },
      adj: { meanShift: number; variationReduction: number },
      specs?: { usl?: number; lsl?: number }
    ) => {
      const projectedMean = stats.mean + adj.meanShift;
      const projectedStdDev = stats.stdDev * (1 - adj.variationReduction);
      let projectedCpk: number | undefined;
      let projectedYield: number | undefined;

      if (specs?.usl !== undefined && specs?.lsl !== undefined && projectedStdDev > 0) {
        projectedCpk = Math.min(
          (specs.usl - projectedMean) / (3 * projectedStdDev),
          (projectedMean - specs.lsl) / (3 * projectedStdDev)
        );
        projectedYield = projectedCpk > 1 ? 99.7 : 95.0;
      }

      return {
        projectedMean,
        projectedStdDev,
        projectedCpk,
        projectedYield,
        improvements: {
          cpkImprovementPct:
            stats.cpk !== undefined && projectedCpk !== undefined
              ? ((projectedCpk - stats.cpk) / stats.cpk) * 100
              : undefined,
          yieldImprovementPct: undefined,
        },
      };
    }
  ),
}));

// Mock @variscout/charts (used indirectly)
vi.mock('@variscout/charts', () => ({
  chartColors: {
    pass: '#22c55e',
    fail: '#ef4444',
    mean: '#3b82f6',
    spec: '#ef4444',
  },
  chromeColors: {
    labelSecondary: '#94a3b8',
    tooltipBg: '#1e293b',
  },
}));

const defaultStats = { mean: 10.0, stdDev: 1.0, cpk: 1.2 };
const defaultSpecs = { lsl: 7, usl: 13, target: 10 };

const defaultModel: ModelInformedEstimatorProps['model'] = {
  factors: ['Shift'],
  factorCount: 1,
  rSquared: 0.15,
  rSquaredAdj: 0.12,
  fStatistic: 5.2,
  pValue: 0.02,
  isSignificant: true,
  dfModel: 1,
  levelEffects: new Map([
    [
      'Shift',
      new Map([
        ['Day', -0.95],
        ['Night', 0.95],
      ]),
    ],
  ]),
  cellMeans: new Map([
    ['Day', { mean: 9.05, n: 50 }],
    ['Night', { mean: 10.95, n: 50 }],
  ]),
};

const defaultContext = {
  ideaText: 'Add calibration check to shift handover',
  questionText: 'Why does Night shift have higher moisture?',
  linkedFactor: 'Shift',
  linkedFactorGap: 1.9,
};

describe('ModelInformedEstimator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(<ModelInformedEstimator currentStats={defaultStats} model={defaultModel} />);
    expect(screen.getByTestId('model-informed-estimator')).toBeDefined();
  });

  it('renders gap context when linkedFactor is provided', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByTestId('gap-context')).toBeDefined();
    expect(screen.getByText(/Shift/)).toBeDefined();
    expect(screen.getByText('1.9')).toBeDefined();
    // R²adj shown
    expect(screen.getByText(/R²adj 12%/)).toBeDefined();
  });

  it('renders idea context header', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByTestId('idea-context')).toBeDefined();
    expect(screen.getByText('Add calibration check to shift handover')).toBeDefined();
    expect(screen.getByText('Why does Night shift have higher moisture?')).toBeDefined();
  });

  it('shows "no factor linked" message when linkedFactor is missing', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={{
          ideaText: 'General improvement idea',
        }}
      />
    );
    expect(screen.getByTestId('no-factor-message')).toBeDefined();
    expect(screen.getByText(/No factor linked/)).toBeDefined();
    // Gap context should not be rendered
    expect(screen.queryByTestId('gap-context')).toBeNull();
  });

  it('shows "no factor linked" when no projectionContext at all', () => {
    render(<ModelInformedEstimator currentStats={defaultStats} model={defaultModel} />);
    expect(screen.getByTestId('no-factor-message')).toBeDefined();
  });

  it('renders gap closure slider', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByText('How much of this gap will your action close?')).toBeDefined();
  });

  it('renders variation reduction slider', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByText('Additional variation reduction')).toBeDefined();
  });

  it('renders tick mark labels for gap closure', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByText(/25% Minor/)).toBeDefined();
    expect(screen.getByText(/50% Half/)).toBeDefined();
    expect(screen.getByText(/75% Most/)).toBeDefined();
    expect(screen.getByText(/100% All/)).toBeDefined();
  });

  it('shows interaction warning when model.hasInteractionTerms is true', () => {
    const modelWithInteractions = {
      ...defaultModel,
      hasInteractionTerms: true,
    };
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={modelWithInteractions}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByTestId('interaction-warning')).toBeDefined();
    expect(screen.getByText(/Factor interactions detected/)).toBeDefined();
  });

  it('does not show interaction warning when hasInteractionTerms is false', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.queryByTestId('interaction-warning')).toBeNull();
  });

  it('renders reference markers with source-typed icons', () => {
    const references = [
      { label: 'Best performer', value: 9.5, cpk: 1.67, source: 'empirical' as const },
      { label: 'Model optimum', value: 10.0, source: 'model' as const },
      { label: 'Current', value: 10.5, source: 'statistical' as const },
    ];
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        references={references}
      />
    );
    expect(screen.getByTestId('reference-markers')).toBeDefined();
    expect(screen.getByText('Best performer')).toBeDefined();
    expect(screen.getByText('Model optimum')).toBeDefined();
    expect(screen.getByText('Current')).toBeDefined();
  });

  it('renders projection panel', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        specs={defaultSpecs}
        model={defaultModel}
        projectionContext={defaultContext}
      />
    );
    expect(screen.getByTestId('projection-panel')).toBeDefined();
    expect(screen.getByText('Projected outcome')).toBeDefined();
    expect(screen.getByText('Mean:')).toBeDefined();
  });

  it('shows Cpk in projection panel when specs are provided', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        specs={defaultSpecs}
        model={defaultModel}
      />
    );
    expect(screen.getByText('Cpk:')).toBeDefined();
  });

  it('shows Yield in projection panel when specs are provided', () => {
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        specs={defaultSpecs}
        model={defaultModel}
      />
    );
    expect(screen.getByText('Yield:')).toBeDefined();
  });

  it('renders save button when onSaveProjection provided', () => {
    const onSave = vi.fn();
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        onSaveProjection={onSave}
      />
    );
    expect(screen.getByTestId('save-projection-button')).toBeDefined();
    expect(screen.getByText('Save to idea')).toBeDefined();
  });

  it('save button is disabled when no adjustment has been made', () => {
    const onSave = vi.fn();
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        onSaveProjection={onSave}
      />
    );
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('does not render save button when no onSaveProjection', () => {
    render(<ModelInformedEstimator currentStats={defaultStats} model={defaultModel} />);
    expect(screen.queryByTestId('save-projection-button')).toBeNull();
  });

  it('calls onProjectionChange on mount with initial values', () => {
    const onProjectionChange = vi.fn();
    render(
      <ModelInformedEstimator
        currentStats={defaultStats}
        model={defaultModel}
        projectionContext={defaultContext}
        onProjectionChange={onProjectionChange}
      />
    );
    expect(onProjectionChange).toHaveBeenCalledTimes(1);
    const [projection] = onProjectionChange.mock.calls[0];
    expect(projection.baselineMean).toBe(10.0);
    expect(projection.baselineSigma).toBe(1.0);
    expect(projection.meanDelta).toBe(0);
    expect(projection.modelContext).toBeDefined();
    expect(projection.modelContext.linkedFactor).toBe('Shift');
    expect(projection.modelContext.rSquaredAdj).toBe(0.12);
    expect(projection.modelContext.gapClosure).toBe(0);
    expect(projection.modelContext.factorGap).toBe(1.9);
  });

  describe('gap closure slider updates projection', () => {
    it('changing gap closure updates the projected mean delta', () => {
      const onProjectionChange = vi.fn();
      render(
        <ModelInformedEstimator
          currentStats={defaultStats}
          specs={defaultSpecs}
          model={defaultModel}
          projectionContext={defaultContext}
          onProjectionChange={onProjectionChange}
        />
      );

      // Find the gap closure slider input and change it
      const sliders = screen.getAllByRole('slider');
      // First slider is gap closure, second is variation reduction
      const gapSlider = sliders[0];
      fireEvent.change(gapSlider, { target: { value: '0.5' } });

      // Should have been called again with updated projection
      const lastCall = onProjectionChange.mock.calls[onProjectionChange.mock.calls.length - 1];
      const projection = lastCall[0];
      // meanDelta = 0.5 * 1.9 = 0.95
      expect(projection.meanDelta).toBeCloseTo(0.95, 1);
      expect(projection.modelContext.gapClosure).toBeCloseTo(0.5, 1);
    });
  });

  describe('variation slider works', () => {
    it('changing variation reduction updates projected sigma', () => {
      const onProjectionChange = vi.fn();
      render(
        <ModelInformedEstimator
          currentStats={defaultStats}
          specs={defaultSpecs}
          model={defaultModel}
          projectionContext={defaultContext}
          onProjectionChange={onProjectionChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const variationSlider = sliders[1];
      fireEvent.change(variationSlider, { target: { value: '0.2' } });

      const lastCall = onProjectionChange.mock.calls[onProjectionChange.mock.calls.length - 1];
      const projection = lastCall[0];
      // projectedSigma = 1.0 * (1 - 0.2) = 0.8
      expect(projection.projectedSigma).toBeCloseTo(0.8, 2);
    });
  });

  describe('save produces FindingProjection with modelContext', () => {
    it('calls onSaveProjection with modelContext when save clicked after adjustment', () => {
      const onSave = vi.fn();
      render(
        <ModelInformedEstimator
          currentStats={defaultStats}
          specs={defaultSpecs}
          model={defaultModel}
          projectionContext={defaultContext}
          onSaveProjection={onSave}
        />
      );

      // Adjust gap closure to enable save
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '0.5' } });

      // Click save
      fireEvent.click(screen.getByTestId('save-projection-button'));

      expect(onSave).toHaveBeenCalledTimes(1);
      const [saved] = onSave.mock.calls[0];
      expect(saved.baselineMean).toBe(10.0);
      expect(saved.projectedMean).toBeCloseTo(10.95, 1); // 10 + 0.5 * 1.9
      expect(saved.createdAt).toMatch(/^\d{4}-/);
      expect(saved.modelContext).toBeDefined();
      expect(saved.modelContext.linkedFactor).toBe('Shift');
      expect(saved.modelContext.gapClosure).toBeCloseTo(0.5, 1);
      expect(saved.modelContext.factorGap).toBe(1.9);
      expect(saved.modelContext.rSquaredAdj).toBe(0.12);
    });
  });
});
