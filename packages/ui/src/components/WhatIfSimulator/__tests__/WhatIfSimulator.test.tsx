import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import WhatIfSimulator from '../WhatIfSimulator';
import type { WhatIfSimulatorHandle, SimulatorPreset } from '../WhatIfSimulator';

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

      if (specs?.usl !== undefined && specs?.lsl !== undefined) {
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
            stats.cpk && projectedCpk ? ((projectedCpk - stats.cpk) / stats.cpk) * 100 : undefined,
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

const defaultStats = { mean: 10.0, stdDev: 1.0, cpk: 1.2 };
const defaultSpecs = { lsl: 7, usl: 13, target: 10 };

describe('WhatIfSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collapsed header by default', () => {
    render(<WhatIfSimulator currentStats={defaultStats} />);
    expect(screen.getByText('What-If Simulator')).toBeDefined();
    // Sliders should not be visible when collapsed
    expect(screen.queryByText('Adjust mean')).toBeNull();
  });

  it('expands when header is clicked', () => {
    render(<WhatIfSimulator currentStats={defaultStats} />);
    fireEvent.click(screen.getByText('What-If Simulator'));
    expect(screen.getByText('Adjust mean')).toBeDefined();
    expect(screen.getByText('Reduce variation')).toBeDefined();
  });

  it('renders expanded when defaultExpanded=true', () => {
    render(<WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} />);
    expect(screen.getByText('Adjust mean')).toBeDefined();
    expect(screen.getByText('Reduce variation')).toBeDefined();
  });

  it('shows projection panel with current values', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    // Should show "Current → Projected" heading
    expect(screen.getByText(/Current/)).toBeDefined();
  });

  it('shows Reset button when adjustments are made', () => {
    render(
      <WhatIfSimulator
        currentStats={defaultStats}
        specs={defaultSpecs}
        defaultExpanded={true}
        initialPreset={{ label: 'Test', description: 'test', meanShift: 1, variationReduction: 0 }}
      />
    );
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('renders preset buttons when presets provided', () => {
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
        description: 'Reduce variation',
        meanShift: 0,
        variationReduction: 0.2,
        icon: 'star',
      },
    ];
    render(
      <WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} presets={presets} />
    );
    expect(screen.getByText('Center')).toBeDefined();
    expect(screen.getByText('Tighten')).toBeDefined();
  });

  it('shows Cpk row when specs and cpk are provided', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    // Cpk label should be present
    expect(screen.getByText('Cpk:')).toBeDefined();
  });

  it('shows yield row when specs are provided', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    expect(screen.getByText('Yield:')).toBeDefined();
  });

  it('collapses when expanded header is clicked', () => {
    render(<WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} />);
    expect(screen.getByText('Adjust mean')).toBeDefined();

    fireEvent.click(screen.getByText('What-If Simulator'));
    expect(screen.queryByText('Adjust mean')).toBeNull();
  });

  describe('imperative handle', () => {
    it('applyPreset sets slider values', () => {
      const ref = createRef<WhatIfSimulatorHandle>();
      render(
        <WhatIfSimulator
          ref={ref}
          currentStats={defaultStats}
          specs={defaultSpecs}
          defaultExpanded={true}
        />
      );

      act(() => {
        ref.current?.applyPreset({
          label: 'Test',
          description: 'test preset',
          meanShift: 2.0,
          variationReduction: 0.3,
        });
      });

      // The "Active" indicator or slider values should reflect the change
      // After preset, Reset button should appear
      expect(screen.getByText('Reset')).toBeDefined();
    });

    it('expand() expands the panel', () => {
      const ref = createRef<WhatIfSimulatorHandle>();
      render(<WhatIfSimulator ref={ref} currentStats={defaultStats} />);

      // Should be collapsed initially
      expect(screen.queryByText('Adjust mean')).toBeNull();

      act(() => {
        ref.current?.expand();
      });

      expect(screen.getByText('Adjust mean')).toBeDefined();
    });
  });

  it('shows "Active" badge when collapsed with adjustments', () => {
    render(
      <WhatIfSimulator
        currentStats={defaultStats}
        initialPreset={{ label: 'Test', description: 'test', meanShift: 1, variationReduction: 0 }}
      />
    );
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('calls onExpandChange when controlled', () => {
    const onExpandChange = vi.fn();
    render(
      <WhatIfSimulator
        currentStats={defaultStats}
        isExpanded={false}
        onExpandChange={onExpandChange}
      />
    );
    fireEvent.click(screen.getByText('What-If Simulator'));
    expect(onExpandChange).toHaveBeenCalledWith(true);
  });

  it('displays helper text when expanded', () => {
    render(<WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} />);
    expect(screen.getByText(/Explore process improvement/)).toBeDefined();
  });

  describe('DistributionPreview', () => {
    it('renders SVG when expanded', () => {
      render(
        <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
      );
      expect(screen.getByTestId('distribution-preview')).toBeDefined();
      // Should contain an SVG element
      const preview = screen.getByTestId('distribution-preview');
      expect(preview.querySelector('svg')).not.toBeNull();
    });

    it('is not visible when collapsed', () => {
      render(<WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} />);
      expect(screen.queryByTestId('distribution-preview')).toBeNull();
    });
  });

  describe('OverallImpactSummary', () => {
    const complementStats = { mean: 10, stdDev: 1, count: 65 };

    it('appears when complementStats provided and adjustment active', () => {
      render(
        <WhatIfSimulator
          currentStats={defaultStats}
          specs={defaultSpecs}
          defaultExpanded={true}
          complementStats={complementStats}
          subsetCount={35}
          initialPreset={{
            label: 'Test',
            description: 'test',
            meanShift: 1,
            variationReduction: 0.1,
          }}
        />
      );
      expect(screen.getByTestId('overall-impact-summary')).toBeDefined();
      expect(screen.getByText('Overall Impact')).toBeDefined();
      expect(screen.getByText('35% of data')).toBeDefined();
    });

    it('hidden when no complement stats', () => {
      render(
        <WhatIfSimulator
          currentStats={defaultStats}
          specs={defaultSpecs}
          defaultExpanded={true}
          initialPreset={{
            label: 'Test',
            description: 'test',
            meanShift: 1,
            variationReduction: 0,
          }}
        />
      );
      expect(screen.queryByTestId('overall-impact-summary')).toBeNull();
    });

    it('hidden when no adjustment (sliders at zero)', () => {
      render(
        <WhatIfSimulator
          currentStats={defaultStats}
          specs={defaultSpecs}
          defaultExpanded={true}
          complementStats={complementStats}
          subsetCount={35}
        />
      );
      // No adjustment → OverallImpactSummary returns null
      expect(screen.queryByTestId('overall-impact-summary')).toBeNull();
    });
  });
});
