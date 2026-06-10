/**
 * ER-0 Task 4: PWA IChart per-measure spec resolution.
 *
 * The thin IChart wrapper prefers measureSpecs[outcome] over the global `specs`
 * store field when an outcome is set (FRAME b0 / Dashboard / PIPanel all write
 * measureSpecs[outcome]). This is the in-repo precedent for the Azure fix; the
 * PWA path previously had no test.
 *
 * Captures the `specs` prop forwarded to IChartWrapperBase. The store is REAL —
 * only IChartWrapperBase + the heavy data hooks are stubbed.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import type { SpecLimits } from '@variscout/core';

const capturedSpecs: { value: SpecLimits | undefined } = { value: undefined };

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    IChartWrapperBase: ({ specs }: { specs: SpecLimits }) => {
      capturedSpecs.value = specs;
      return <div data-testid="ichart-wrapper-base" />;
    },
  };
});

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: [], filteredIndexMap: new Map() }),
    useAnalysisStats: () => ({ stats: null, kde: null, isComputing: false }),
    useStagedAnalysis: () => ({ stagedData: [], stagedStats: null }),
    useCapabilityIChartData: () => ({
      cpkData: [],
      cpData: [],
      cpkStats: null,
      cpStats: null,
      subgroupResults: [],
      subgroupsMeetingTarget: 0,
    }),
  };
});

vi.mock('../../../hooks/useChartScale', () => ({
  useChartScale: () => ({ min: 0, max: 100 }),
}));

// Worker is not available in jsdom; the singleton hook returns null in tests.
vi.mock('../../../workers/useStatsWorker', () => ({
  useStatsWorker: () => null,
}));

vi.mock('@variscout/core/capability', () => ({
  resolveCpkTarget: () => ({ value: 1.33 }),
}));

vi.mock('@visx/responsive', () => ({
  withParentSize: (Component: React.ComponentType<unknown>) => Component,
}));

import IChart from '../IChart';

// withParentSize is mocked to pass through (above), so at runtime the inner
// component receives parentWidth/parentHeight directly. The static type is
// still the wrapped type (which injects those props), so cast for the test.
const IChartUnderTest = IChart as unknown as React.ComponentType<{
  parentWidth: number;
  parentHeight: number;
}>;

beforeEach(() => {
  capturedSpecs.value = undefined;
  useProjectStore.setState(getProjectInitialState());
});

describe('PWA IChart per-measure spec resolution', () => {
  it('forwards measureSpecs[outcome] when global specs are empty', () => {
    useProjectStore.setState({
      outcome: 'Result',
      specs: {}, // global specs empty
      measureSpecs: { Result: { lsl: 9, usl: 11 } },
    });

    render(<IChartUnderTest parentWidth={400} parentHeight={300} />);

    expect(capturedSpecs.value).toEqual({ lsl: 9, usl: 11 });
  });

  it('falls back to global specs when no per-measure override exists', () => {
    useProjectStore.setState({
      outcome: 'Result',
      specs: { lsl: 5, usl: 15 },
      measureSpecs: {},
    });

    render(<IChartUnderTest parentWidth={400} parentHeight={300} />);

    expect(capturedSpecs.value).toEqual({ lsl: 5, usl: 15 });
  });
});
