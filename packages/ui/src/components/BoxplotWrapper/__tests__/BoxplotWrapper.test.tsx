/**
 * BoxplotWrapperBase tests
 *
 * ER-4 (D6/Principle 6) — click semantics change: a box click no longer commits
 * a drill or toggles a filter when the host supplies `onGroupClick`. It fires the
 * NEUTRAL `onGroupClick(factor, level)` so the host sets a transient highlight +
 * shows the condition pill (commit is explicit, via the pill). The legacy
 * filter-toggle / drill path is preserved ONLY when `onGroupClick` is absent
 * (focused views / mobile / embed). The old `onScopeAccumulate` prop was DELETED
 * (the pill is the only scope writer — see the ER-4 sub-plan §"PWA chart scope-store
 * TODO stubs … RESOLVED BY DELETION").
 *
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
      selectedGroups,
    }: {
      data: Array<{ key: string }>;
      onBoxClick?: (key: string) => void;
      selectedGroups?: string[];
    }) => (
      <div>
        <div data-testid="selected-groups">{(selectedGroups ?? []).join(',')}</div>
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
    boxplotSortBy: 'name' as const,
    boxplotSortDirection: 'asc' as const,
    showViolin: false,
  },
  yDomainMin: 0,
  yDomainMax: 100,
};

describe('BoxplotWrapper click semantics (ER-4 D6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires the NEUTRAL onGroupClick(factor, level) on box click — no commit', () => {
    const onGroupClick = vi.fn();
    const onFiltersChange = vi.fn();
    const onDrillDown = vi.fn();
    render(
      <BoxplotWrapperBase
        {...baseProps}
        onGroupClick={onGroupClick}
        onFiltersChange={onFiltersChange}
        onDrillDown={onDrillDown}
      />
    );
    fireEvent.click(screen.getByTestId('box-A'));
    expect(onGroupClick).toHaveBeenCalledWith('vessel', 'A');
    // ER-4: onGroupClick takes precedence — NO filter toggle, NO drill commit.
    expect(onFiltersChange).not.toHaveBeenCalled();
    expect(onDrillDown).not.toHaveBeenCalled();
  });

  it('preserves the legacy filter-toggle path when onGroupClick is absent', () => {
    const onFiltersChange = vi.fn();
    render(<BoxplotWrapperBase {...baseProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByTestId('box-A'));
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('preserves the legacy onDrillDown path when onGroupClick is absent', () => {
    const onDrillDown = vi.fn();
    render(<BoxplotWrapperBase {...baseProps} onDrillDown={onDrillDown} />);
    fireEvent.click(screen.getByTestId('box-A'));
    expect(onDrillDown).toHaveBeenCalledWith('vessel', 'A');
  });
});

describe('BoxplotWrapper transient highlight dim (ER-4 tier 2)', () => {
  it('merges transientHighlightLevel into the dim channel (selectedGroups)', () => {
    render(<BoxplotWrapperBase {...baseProps} transientHighlightLevel="B" />);
    // With a selection present, BoxplotBase dims every non-selected category.
    expect(screen.getByTestId('selected-groups')).toHaveTextContent('B');
  });

  it('does not duplicate a level already selected via filters', () => {
    render(
      <BoxplotWrapperBase {...baseProps} filters={{ vessel: ['A'] }} transientHighlightLevel="A" />
    );
    expect(screen.getByTestId('selected-groups')).toHaveTextContent(/^A$/);
  });

  it('passes no selection when the transient highlight is absent', () => {
    render(<BoxplotWrapperBase {...baseProps} />);
    expect(screen.getByTestId('selected-groups')).toHaveTextContent(/^$/);
  });
});
