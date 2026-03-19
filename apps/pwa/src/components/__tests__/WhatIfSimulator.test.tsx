import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const msgs: Record<string, string> = {
          'whatif.adjustMean': 'Adjust mean',
          'whatif.reduceVariation': 'Reduce variation',
          'whatif.currentProjected': 'Current vs Projected',
          'whatif.resetAdjustments': 'Reset adjustments',
          'action.reset': 'Reset',
        };
        return msgs[key] ?? key;
      },
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en' as const,
      formatNumber: (v: number) => v.toFixed(2),
      formatStat: (v: number, d = 2) => v.toFixed(d),
      formatPct: (v: number) => `${(v * 100).toFixed(1)}%`,
    }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import { WhatIfSimulator } from '@variscout/ui';
import type { SimulatorPreset } from '@variscout/ui';

// Mock simulateDirectAdjustment
const mockProjection = {
  projectedMean: 10.0,
  projectedStdDev: 1.5,
  projectedCpk: 1.5,
  projectedCp: 1.8,
  projectedYield: 99.9,
  projectedPPM: 100,
  improvements: {
    cpkImprovementPct: 25,
    yieldImprovementPct: 1.5,
  },
};

vi.mock('@variscout/core', () => ({
  simulateDirectAdjustment: vi.fn(() => mockProjection),
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

const defaultStats = { mean: 10.5, stdDev: 2.0, cpk: 1.2 };
const defaultSpecs = { usl: 20, lsl: 5 };

describe('WhatIfSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collapsed by default (shows header, no sliders)', () => {
    render(<WhatIfSimulator currentStats={defaultStats} />);
    expect(screen.getByText('What-If Simulator')).toBeInTheDocument();
    // Sliders should not be visible when collapsed
    expect(screen.queryByLabelText('Adjust mean')).not.toBeInTheDocument();
  });

  it('renders expanded when defaultExpanded={true}', () => {
    render(<WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} />);
    expect(screen.getByLabelText('Adjust mean')).toBeInTheDocument();
    expect(screen.getByLabelText('Reduce variation')).toBeInTheDocument();
  });

  it('expands/collapses on header click', () => {
    render(<WhatIfSimulator currentStats={defaultStats} />);

    // Initially collapsed
    expect(screen.queryByLabelText('Adjust mean')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('What-If Simulator'));
    expect(screen.getByLabelText('Adjust mean')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('What-If Simulator'));
    expect(screen.queryByLabelText('Adjust mean')).not.toBeInTheDocument();
  });

  it('displays current stats (mean, sigma)', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    expect(screen.getByText('Mean:')).toBeInTheDocument();
    // Current mean displayed
    expect(screen.getByText('10.5')).toBeInTheDocument();
  });

  it('shows Cpk when specs provided and cpk available', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    expect(screen.getByText('Cpk:')).toBeInTheDocument();
    // Current Cpk
    expect(screen.getByText('1.20')).toBeInTheDocument();
  });

  it('hides Cpk row when cpk is undefined', () => {
    const statsWithoutCpk = { mean: 10.5, stdDev: 2.0 };
    render(<WhatIfSimulator currentStats={statsWithoutCpk} defaultExpanded={true} />);
    expect(screen.queryByText('Cpk:')).not.toBeInTheDocument();
  });

  it('shows projected values in expanded state', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );
    // The arrow separator should be present (projected values)
    const arrows = screen.getAllByText('\u2192');
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('shows Reset button when adjustment is active then clears on click', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );

    // Initially no Reset button (no adjustments)
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();

    // Adjust the mean slider
    const meanSlider = screen.getByLabelText('Adjust mean');
    fireEvent.change(meanSlider, { target: { value: '2' } });

    // Reset button should appear
    expect(screen.getByText('Reset')).toBeInTheDocument();

    // Click reset
    fireEvent.click(screen.getByText('Reset'));

    // Reset button should disappear
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });

  it('renders preset buttons and applies their values on click', () => {
    const presets: SimulatorPreset[] = [
      {
        label: 'Center Process',
        description: 'Move mean to target',
        meanShift: 2.0,
        variationReduction: 0,
        icon: 'target',
      },
      {
        label: 'Tighten Control',
        description: 'Reduce variation by 30%',
        meanShift: 0,
        variationReduction: 0.3,
        icon: 'star',
      },
    ];

    render(
      <WhatIfSimulator
        currentStats={defaultStats}
        specs={defaultSpecs}
        defaultExpanded={true}
        presets={presets}
      />
    );

    expect(screen.getByText('Center Process')).toBeInTheDocument();
    expect(screen.getByText('Tighten Control')).toBeInTheDocument();

    // Click a preset
    fireEvent.click(screen.getByText('Center Process'));

    // After clicking a preset, the Reset button should appear (adjustment is active)
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows Active indicator when collapsed with non-zero adjustments', () => {
    render(
      <WhatIfSimulator currentStats={defaultStats} specs={defaultSpecs} defaultExpanded={true} />
    );

    // Adjust the mean slider
    const meanSlider = screen.getByLabelText('Adjust mean');
    fireEvent.change(meanSlider, { target: { value: '2' } });

    // Collapse
    fireEvent.click(screen.getByText('What-If Simulator'));

    // Should show "Active" indicator when collapsed
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows helper text explaining the simulator', () => {
    render(<WhatIfSimulator currentStats={defaultStats} defaultExpanded={true} />);
    expect(screen.getByText(/Explore process improvement by adjusting mean/)).toBeInTheDocument();
  });
});
