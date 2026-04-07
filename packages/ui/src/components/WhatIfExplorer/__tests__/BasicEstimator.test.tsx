import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicEstimator from '../BasicEstimator';
import type { SimulatorPreset } from '../types';

// Mock @variscout/hooks
vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'whatif.adjustMean': 'Adjust mean',
    'whatif.reduceVariation': 'Reduce variation',
    'whatif.currentProjected': 'Current vs Projected',
    'whatif.resetAdjustments': 'Reset adjustments',
    'action.reset': 'Reset',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      formatStat: (n: number, decimals?: number) => {
        if (decimals !== undefined) return n.toFixed(decimals);
        return n % 1 === 0 ? String(n) : n.toFixed(2);
      },
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
  };
});

// Mock @variscout/core with deterministic output
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
  simulateOverallImpact: vi.fn(() => ({
    currentOverall: { mean: 10, stdDev: 1, cpk: 1.0, yield: 99.0 },
    projectedOverall: { mean: 10, stdDev: 0.9, cpk: 1.11, yield: 99.5 },
    subsetFraction: 0.35,
    improvements: { cpkChange: 0.11, yieldChange: 0.5 },
  })),
  normalPDF: vi.fn((x: number, mean: number, stdDev: number) => {
    if (stdDev === 0) return 0;
    const z = (x - mean) / stdDev;
    return Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
  }),
}));

// Mock @variscout/charts (used by DistributionPreview)
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

describe('BasicEstimator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    expect(screen.getByTestId('basic-estimator')).toBeDefined();
  });

  it('renders both sliders', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    expect(screen.getByText('Adjust mean')).toBeDefined();
    expect(screen.getByText('Reduce variation')).toBeDefined();
  });

  it('renders preset buttons when presets are provided', () => {
    const presets: SimulatorPreset[] = [
      {
        label: 'Center',
        description: 'Center the process',
        meanShift: 0.5,
        variationReduction: 0,
        icon: 'target',
      },
      {
        label: 'Tighten',
        description: 'Reduce variation by 20%',
        meanShift: 0,
        variationReduction: 0.2,
        icon: 'star',
      },
    ];
    render(<BasicEstimator currentStats={defaultStats} presets={presets} />);
    expect(screen.getByText('Center')).toBeDefined();
    expect(screen.getByText('Tighten')).toBeDefined();
  });

  it('does not render preset section when no presets provided', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    // No preset buttons should be present
    expect(screen.queryByTitle('Center the process')).toBeNull();
  });

  it('renders distribution preview', () => {
    render(<BasicEstimator currentStats={defaultStats} specs={defaultSpecs} />);
    expect(screen.getByTestId('distribution-preview')).toBeDefined();
  });

  it('renders projection panel with current vs projected labels', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    expect(screen.getByTestId('projection-panel')).toBeDefined();
    expect(screen.getByText(/Current/)).toBeDefined();
  });

  it('shows Cpk row when currentStats.cpk and specs are provided', () => {
    render(<BasicEstimator currentStats={defaultStats} specs={defaultSpecs} />);
    expect(screen.getByText('Cpk:')).toBeDefined();
  });

  it('shows Yield row when specs are provided', () => {
    render(<BasicEstimator currentStats={defaultStats} specs={defaultSpecs} />);
    expect(screen.getByText('Yield:')).toBeDefined();
  });

  it('renders save button when onSaveProjection provided', () => {
    const onSave = vi.fn();
    render(<BasicEstimator currentStats={defaultStats} onSaveProjection={onSave} />);
    expect(screen.getByTestId('save-projection-button')).toBeDefined();
    expect(screen.getByText('Save to idea')).toBeDefined();
  });

  it('does not render save button when no onSaveProjection', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    expect(screen.queryByTestId('save-projection-button')).toBeNull();
  });

  it('save button is disabled when no adjustment has been made', () => {
    const onSave = vi.fn();
    render(<BasicEstimator currentStats={defaultStats} onSaveProjection={onSave} />);
    const saveBtn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('calls onProjectionChange on mount with initial values', () => {
    const onProjectionChange = vi.fn();
    render(
      <BasicEstimator
        currentStats={defaultStats}
        specs={defaultSpecs}
        onProjectionChange={onProjectionChange}
      />
    );
    expect(onProjectionChange).toHaveBeenCalledTimes(1);
    const [projection] = onProjectionChange.mock.calls[0];
    expect(projection.baselineMean).toBe(10.0);
    expect(projection.baselineSigma).toBe(1.0);
    expect(projection.simulationParams.meanAdjustment).toBe(0);
    expect(projection.simulationParams.variationReduction).toBe(0);
  });

  it('renders reference markers when references provided', () => {
    const references = [
      { label: 'Best performer', value: 9.5, cpk: 1.67, source: 'empirical' as const },
      { label: 'Model optimum', value: 10.0, source: 'model' as const },
    ];
    render(<BasicEstimator currentStats={defaultStats} references={references} />);
    expect(screen.getByTestId('reference-markers')).toBeDefined();
    expect(screen.getByText('Best performer')).toBeDefined();
    expect(screen.getByText('Model optimum')).toBeDefined();
  });

  it('does not render reference markers when none provided', () => {
    render(<BasicEstimator currentStats={defaultStats} />);
    expect(screen.queryByTestId('reference-markers')).toBeNull();
  });

  describe('preset application', () => {
    it('applying a preset reveals the Reset button', () => {
      const presets: SimulatorPreset[] = [
        {
          label: 'Center',
          description: 'Center the process',
          meanShift: 1.0,
          variationReduction: 0,
        },
      ];
      render(<BasicEstimator currentStats={defaultStats} presets={presets} />);
      // No Reset button before applying preset
      expect(screen.queryByText('Reset')).toBeNull();
      fireEvent.click(screen.getByText('Center'));
      // After applying, hasAdjustment=true → Reset appears
      expect(screen.getByText('Reset')).toBeDefined();
    });

    it('reset button returns sliders to zero (hides Reset button)', () => {
      const presets: SimulatorPreset[] = [
        {
          label: 'Center',
          description: 'Center',
          meanShift: 1.0,
          variationReduction: 0,
        },
      ];
      render(<BasicEstimator currentStats={defaultStats} presets={presets} />);
      fireEvent.click(screen.getByText('Center'));
      expect(screen.getByText('Reset')).toBeDefined();
      fireEvent.click(screen.getByText('Reset'));
      expect(screen.queryByText('Reset')).toBeNull();
    });
  });

  describe('overall impact summary', () => {
    const complementStats = { mean: 10.2, stdDev: 1.1, count: 65 };

    it('shows overall impact when complementStats provided and adjustment active', () => {
      const presets: SimulatorPreset[] = [
        {
          label: 'Test',
          description: 'test',
          meanShift: 1.0,
          variationReduction: 0.1,
        },
      ];
      render(
        <BasicEstimator
          currentStats={defaultStats}
          specs={defaultSpecs}
          complementStats={complementStats}
          presets={presets}
        />
      );
      fireEvent.click(screen.getByText('Test'));
      expect(screen.getByTestId('overall-impact-summary')).toBeDefined();
    });

    it('hides overall impact when no complement stats', () => {
      const presets: SimulatorPreset[] = [
        {
          label: 'Test',
          description: 'test',
          meanShift: 1.0,
          variationReduction: 0,
        },
      ];
      render(<BasicEstimator currentStats={defaultStats} specs={defaultSpecs} presets={presets} />);
      fireEvent.click(screen.getByText('Test'));
      expect(screen.queryByTestId('overall-impact-summary')).toBeNull();
    });
  });

  describe('save callback', () => {
    it('calls onSaveProjection with FindingProjection when save clicked after adjustment', () => {
      const onSave = vi.fn();
      const presets: SimulatorPreset[] = [
        {
          label: 'Center',
          description: 'Center',
          meanShift: 1.0,
          variationReduction: 0,
        },
      ];
      render(
        <BasicEstimator
          currentStats={defaultStats}
          specs={defaultSpecs}
          presets={presets}
          onSaveProjection={onSave}
        />
      );
      // Apply preset to enable save
      fireEvent.click(screen.getByText('Center'));
      fireEvent.click(screen.getByTestId('save-projection-button'));
      expect(onSave).toHaveBeenCalledTimes(1);
      const [saved] = onSave.mock.calls[0];
      expect(saved.baselineMean).toBe(10.0);
      expect(saved.projectedMean).toBe(11.0); // 10 + meanShift 1.0
      expect(saved.simulationParams.meanAdjustment).toBe(1.0);
      expect(saved.createdAt).toMatch(/^\d{4}-/); // ISO date format
    });
  });
});
