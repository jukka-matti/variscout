/**
 * LV1-F integration test: chart-click categorical accumulate (Azure thin wrappers).
 *
 * Tests that ParetoChart + Boxplot dispatch to analysisScopeStore via
 * onScopeAccumulate. Stubs the WrapperBase components to expose the callback
 * directly — avoids mocking the full project-store / hooks data chain.
 *
 * Spec §5.4.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';

// Stub WrapperBase components — exposes onScopeAccumulate as a clickable button
// so we can trigger it without needing full chart rendering infrastructure.
vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    ParetoChartWrapperBase: ({
      onScopeAccumulate,
      factor,
    }: {
      onScopeAccumulate?: (f: string, k: string | number) => void;
      factor: string;
    }) => (
      <button
        data-testid="pareto-accumulate-trigger"
        onClick={() => onScopeAccumulate?.(factor, 'A')}
      >
        Pareto trigger
      </button>
    ),
    BoxplotWrapperBase: ({
      onScopeAccumulate,
      factor,
    }: {
      onScopeAccumulate?: (f: string, k: string | number) => void;
      factor: string;
    }) => (
      <button
        data-testid="boxplot-accumulate-trigger"
        onClick={() => onScopeAccumulate?.(factor, 'A')}
      >
        Boxplot trigger
      </button>
    ),
  };
});

// Mock project-store selectors used by the thin wrappers before they render
// WrapperBase. Only the fields actually destructured are provided.
vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    useProjectStore: (selector: (s: Record<string, unknown>) => unknown) => {
      const defaults: Record<string, unknown> = {
        rawData: [],
        outcome: 'y',
        filters: {},
        setFilters: () => {},
        columnAliases: {},
        setColumnAliases: () => {},
        paretoMode: 'defect',
        separateParetoData: false,
        specs: {},
        valueLabels: {},
        setValueLabels: () => {},
        displayOptions: { standardIChartMetric: 'value' },
        subgroupConfig: { type: 'fixed', n: 5 },
        cpkTarget: undefined,
        measureSpecs: {},
      };
      return selector(defaults);
    },
  };
});

// Mock hooks that run data derivation
vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: [] }),
    useCapabilityBoxplotData: () => [],
  };
});

// Mock useChartScale (azure-local hook — path relative to the tested modules,
// resolved by Vitest as the canonical module path)
vi.mock('../../../hooks/useChartScale', () => ({
  useChartScale: () => ({ min: 0, max: 100 }),
}));

// Mock resolveCpkTarget
vi.mock('@variscout/core/capability', () => ({
  resolveCpkTarget: () => ({ value: 1.33 }),
}));

// withParentSize from @visx/responsive wraps the default export — mock it to
// pass through so render receives { factor, parentWidth, parentHeight } directly.
vi.mock('@visx/responsive', () => ({
  withParentSize: (Component: React.ComponentType<unknown>) => Component,
}));

import ParetoChart from '../ParetoChart';
import Boxplot from '../Boxplot';

describe('LV1-F: chart-click categorical accumulate (Azure)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(
      (useAnalysisScopeStore as unknown as { getInitialState: () => object }).getInitialState()
    );
  });

  it('Pareto onScopeAccumulate dispatches to scope store with accumulate semantics', () => {
    render(<ParetoChart factor="vessel" />);
    fireEvent.click(screen.getByTestId('pareto-accumulate-trigger'));
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
    // Idempotent: second click on same value still yields ['A']
    fireEvent.click(screen.getByTestId('pareto-accumulate-trigger'));
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });

  it('Boxplot onScopeAccumulate dispatches to scope store', () => {
    render(<Boxplot factor="vessel" />);
    fireEvent.click(screen.getByTestId('boxplot-accumulate-trigger'));
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'vessel', values: ['A'] },
    ]);
  });
});
