/**
 * BoxplotWrapperBase tests
 *
 * Tests the onScopeAccumulate (LV1-F) wiring: fires (factor, key) on every
 * box/whisker click, alongside the existing filter-toggle and onDrillDown paths.
 * The BoxplotBase stub renders <button data-testid="box-{key}"> per group so
 * tests exercise the same dispatch contract as the real chart's
 * <Group onClick={() => onBoxClick?.(d.key)}> at Boxplot.tsx:238.
 */

// ---- vi.mock BEFORE component imports (rule: vi.mock is hoisted) ----

// Minimal fixture data — no createBoxplotGroup factory exists in core
const mockBoxplotData = {
  data: [
    { key: 'A', min: 0, q1: 1, median: 2, q3: 3, max: 4, count: 10, mean: 2 },
    { key: 'B', min: 5, q1: 6, median: 7, q3: 8, max: 9, count: 10, mean: 7 },
  ],
  violinData: undefined,
};

vi.mock('@variscout/hooks', () => ({
  useBoxplotData: () => mockBoxplotData,
  useBoxplotWrapperData: () => ({
    categoryPositions: new Map(),
    effectiveHighlights: undefined,
  }),
}));

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    sortBoxplotData: (data: unknown) => data, // identity — preserve order
  };
});

// Stub BoxplotBase to render simple buttons we can click in tests.
// Mirrors the real chart's Group onClick contract at Boxplot.tsx:238.
vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return {
    ...actual,
    BoxplotBase: ({
      data,
      onBoxClick,
    }: {
      data: Array<{ key: string }>;
      onBoxClick?: (key: string) => void;
    }) => (
      <div>
        {data.map(d => (
          <button key={d.key} data-testid={`box-${d.key}`} onClick={() => onBoxClick?.(d.key)}>
            {d.key}
          </button>
        ))}
      </div>
    ),
    getScaledFonts: () => ({ tickLabel: 10, axisLabel: 11, statLabel: 10, annotation: 9 }),
    chartColors: { target: '#ff0000' },
  };
});

// Stub internal sibling components
vi.mock('../../ChartAnnotationLayer', () => ({
  ChartAnnotationLayer: () => null,
}));
vi.mock('../../AxisEditor', () => ({
  AxisEditor: () => null,
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { BoxplotWrapperBase } from '../index';

const baseProps = {
  parentWidth: 400,
  parentHeight: 300,
  factor: 'vessel',
  filteredData: [],
  outcome: 'rate',
  specs: {},
  filters: {},
  onFiltersChange: () => {},
  columnAliases: {},
  onColumnAliasesChange: () => {},
  valueLabels: {},
  onValueLabelsChange: () => {},
  displayOptions: {
    showSpecs: true,
    boxplotSortBy: 'key' as const,
    boxplotSortDirection: 'asc' as const,
    showViolin: false,
  },
  yDomainMin: 0,
  yDomainMax: 100,
};

describe('onScopeAccumulate (LV1-F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires onScopeAccumulate(factor, key) on box click, alongside legacy filter toggle', () => {
    const onScopeAccumulate = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <BoxplotWrapperBase
        {...baseProps}
        onFiltersChange={onFiltersChange}
        onScopeAccumulate={onScopeAccumulate}
      />
    );
    fireEvent.click(screen.getByTestId('box-A'));
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
    // Legacy filter-toggle ALSO fires (no onDrillDown provided)
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('fires onScopeAccumulate alongside onDrillDown when both provided', () => {
    const onScopeAccumulate = vi.fn();
    const onDrillDown = vi.fn();
    render(
      <BoxplotWrapperBase
        {...baseProps}
        onDrillDown={onDrillDown}
        onScopeAccumulate={onScopeAccumulate}
      />
    );
    fireEvent.click(screen.getByTestId('box-A'));
    expect(onScopeAccumulate).toHaveBeenCalledWith('vessel', 'A');
    expect(onDrillDown).toHaveBeenCalledWith('vessel', 'A');
  });
});
