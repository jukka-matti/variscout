import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StagedComparisonCard } from '../StagedComparisonCard';
import type { StagedComparison } from '@variscout/core';
import type { StatsResult } from '@variscout/core';

function makeStats(overrides: Partial<StatsResult> = {}): StatsResult {
  return {
    mean: 50,
    median: 50,
    stdDev: 5,
    sigmaWithin: 4.5,
    mrBar: 5.3,
    ucl: 63.5,
    lcl: 36.5,
    outOfSpecPercentage: 0,
    ...overrides,
  };
}

const twoStageComparison: StagedComparison = {
  stages: [
    {
      name: 'Before',
      stats: makeStats({ mean: 50, stdDev: 5, cpk: 0.89, outOfSpecPercentage: 12 }),
      index: 0,
    },
    {
      name: 'After',
      stats: makeStats({ mean: 48, stdDev: 3.5, cpk: 1.32, outOfSpecPercentage: 2 }),
      index: 1,
    },
  ],
  deltas: {
    meanShift: -2,
    variationRatio: 0.7,
    cpkDelta: 0.43,
    passRateDelta: 10,
    outOfSpecReduction: 10,
  },
  colorCoding: {
    meanShift: 'green',
    variationRatio: 'green',
    cpkDelta: 'green',
    passRateDelta: 'green',
    outOfSpecReduction: 'green',
  },
};

const threeStageComparison: StagedComparison = {
  stages: [
    { name: 'Phase 1', stats: makeStats({ mean: 50, stdDev: 6, cpk: 0.7 }), index: 0 },
    { name: 'Phase 2', stats: makeStats({ mean: 49, stdDev: 5, cpk: 0.9 }), index: 1 },
    { name: 'Phase 3', stats: makeStats({ mean: 48, stdDev: 3, cpk: 1.4 }), index: 2 },
  ],
  deltas: {
    meanShift: -2,
    variationRatio: 0.5,
    cpkDelta: 0.7,
    passRateDelta: null,
    outOfSpecReduction: 0,
  },
  colorCoding: {
    meanShift: 'green',
    variationRatio: 'green',
    cpkDelta: 'green',
    passRateDelta: 'amber',
    outOfSpecReduction: 'amber',
  },
};

describe('StagedComparisonCard', () => {
  it('renders 2-stage compact layout', () => {
    render(<StagedComparisonCard comparison={twoStageComparison} />);
    expect(screen.getByTestId('staged-comparison-card')).toBeDefined();
    expect(screen.getByText('Before')).toBeDefined();
    expect(screen.getByText('After')).toBeDefined();
    expect(screen.getByText('Stage Comparison')).toBeDefined();
  });

  it('renders 3+ stage table layout', () => {
    render(<StagedComparisonCard comparison={threeStageComparison} />);
    expect(screen.getByTestId('staged-comparison-card')).toBeDefined();
    expect(screen.getByText('Phase 1')).toBeDefined();
    expect(screen.getByText('Phase 2')).toBeDefined();
    expect(screen.getByText('Phase 3')).toBeDefined();
  });

  it('applies color coding to delta cells', () => {
    render(<StagedComparisonCard comparison={twoStageComparison} />);
    const cpkDelta = screen.getByTestId('delta-cpkDelta');
    expect(cpkDelta.className).toContain('text-green-400');
  });

  it('handles missing Cpk gracefully (no specs)', () => {
    const noSpecsComparison: StagedComparison = {
      stages: [
        { name: 'Before', stats: makeStats(), index: 0 },
        { name: 'After', stats: makeStats({ mean: 48 }), index: 1 },
      ],
      deltas: {
        meanShift: -2,
        variationRatio: 1,
        cpkDelta: null,
        passRateDelta: null,
        outOfSpecReduction: 0,
      },
      colorCoding: {
        meanShift: 'amber',
        variationRatio: 'amber',
        cpkDelta: 'amber',
        passRateDelta: 'amber',
        outOfSpecReduction: 'amber',
      },
    };

    render(<StagedComparisonCard comparison={noSpecsComparison} />);
    // Should render without Cpk and In Spec rows
    expect(screen.queryByText('Cpk')).toBeNull();
    expect(screen.queryByText('In Spec %')).toBeNull();
    // But still show Mean and Std Dev
    expect(screen.getByText('Mean')).toBeDefined();
    expect(screen.getByText('Std Dev')).toBeDefined();
  });

  it('shows Cpk target when provided', () => {
    render(<StagedComparisonCard comparison={twoStageComparison} cpkTarget={1.33} />);
    expect(screen.getByText(/Target Cpk: 1.33/)).toBeDefined();
  });
});
