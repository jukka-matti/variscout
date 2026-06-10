// vi.mock() calls MUST be placed before component imports to avoid infinite re-render loops.
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { StatsResult } from '@variscout/core';

// Stats fixture with a defined Cpk — the Stats panel only renders the Cpk card
// when the resolved spec has limits AND stats carries cpk.
const mockStats: StatsResult = {
  mean: 10,
  stdDev: 0.5,
  median: 10,
  sigmaWithin: 0.4,
  mrBar: 0.45,
  ucl: 11.2,
  lcl: 8.8,
  cp: 1.4,
  cpk: 1.2,
  outOfSpecPercentage: 0.3,
};

vi.mock('@variscout/hooks', () => ({
  useAnalysisStats: () => ({ stats: mockStats, kde: null, isComputing: false }),
  useFilteredData: () => ({ filteredData: [{ Result: 10 }], filteredIndexMap: new Map() }),
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (v: unknown) => String(v),
  }),
}));

// HelpTooltip is a leaf (depends on useTooltipPosition from @variscout/hooks,
// which we've mocked away). Stub it out — it's not under test here.
vi.mock('../../HelpTooltip', () => ({
  HelpTooltip: () => null,
}));

import { render, screen } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import StatsTabContent from '../StatsTabContent';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
});

describe('StatsTabContent', () => {
  it('renders the Cpk card from measureSpecs[outcome] when global specs are empty', () => {
    useProjectStore.setState({
      outcome: 'Result',
      specs: {}, // global specs empty
      measureSpecs: { Result: { lsl: 9, usl: 11 } },
      factors: [],
    });

    render(<StatsTabContent />);

    // The Cpk card (and its value) only mount when hasSpecs && showCpk.
    expect(screen.getByTestId('stat-cpk')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-cpk')).toHaveTextContent('1.2');
  });

  it('does not render the Cpk card when neither global nor per-measure specs exist', () => {
    useProjectStore.setState({
      outcome: 'Result',
      specs: {},
      measureSpecs: {},
      factors: [],
    });

    render(<StatsTabContent />);

    expect(screen.queryByTestId('stat-cpk')).not.toBeInTheDocument();
  });

  it('renders the Cpk card from global specs when no per-measure override exists', () => {
    useProjectStore.setState({
      outcome: 'Result',
      specs: { lsl: 9, usl: 11 },
      measureSpecs: {},
      factors: [],
    });

    render(<StatsTabContent />);

    expect(screen.getByTestId('stat-cpk')).toBeInTheDocument();
  });
});
