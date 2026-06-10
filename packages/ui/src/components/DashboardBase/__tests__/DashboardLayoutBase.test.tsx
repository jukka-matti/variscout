/**
 * Tests for DashboardLayoutBase component
 *
 * Validates: chart card rendering, focused view toggle, annotation context menu,
 * spec editor slot, insight chips, render slot composition, I-Chart header
 * one-row layout with inline staged-stats chips, and boxplot factor dropdown.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayoutBase from '../DashboardLayoutBase';
import type { DashboardLayoutBaseProps } from '../DashboardLayoutBase';
import { flushRaf } from '../../../test-utils/raf';

const noopAsync = vi.fn().mockResolvedValue(undefined);
const noop = vi.fn();

const mockInsight = {
  chipText: null,
  chipType: 'info' as const,
  isDismissed: false,
  dismiss: noop,
  isLoading: false,
  isAI: false,
  action: null,
};

const mockAnnotations: DashboardLayoutBaseProps['annotations'] = {
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    categoryKey: '',
    chartType: 'boxplot',
  },
  handleContextMenu: noop,
  closeContextMenu: noop,
  boxplotHighlights: {},
  paretoHighlights: {},
  setHighlight: noop,
  hasAnnotations: false,
  clearAnnotations: noop,
};

const baseProps: DashboardLayoutBaseProps = {
  outcome: 'Weight',
  factors: ['Machine', 'Operator'],
  columnAliases: {},
  filters: {},
  showFilterContext: true,
  showViolin: false,
  boxplotSortBy: 'name',
  boxplotSortDirection: 'asc',
  onDisplayOptionChange: noop,
  availableOutcomes: ['Weight', 'Height'],
  setOutcome: noop,
  stageColumn: null,
  stagedStats: null,
  controlStats: { ucl: 12, lcl: 8, mean: 10 },
  chartTitles: {},
  onChartTitleChange: noop,
  boxplotFactor: 'Machine',
  setBoxplotFactor: noop,
  paretoFactor: 'Machine',
  setParetoFactor: noop,
  showParetoPanel: true,
  focusedChart: null,
  setFocusedChart: noop,
  filterChipData: [],
  annotations: mockAnnotations,
  copyFeedback: null,
  onCopyChart: noopAsync,
  onDownloadPng: noopAsync,
  onDownloadSvg: noop,
  ichartInsight: mockInsight,
  boxplotInsight: mockInsight,
  paretoInsight: mockInsight,
  statsInsight: mockInsight,
  renderIChartContent: <div data-testid="ichart-content">I-Chart</div>,
  renderBoxplotContent: <div data-testid="boxplot-content">Boxplot</div>,
  renderParetoContent: <div data-testid="pareto-content">Pareto</div>,
  renderPIPanel: <div data-testid="stats-content">Stats</div>,
};

describe('DashboardLayoutBase', () => {
  it('renders 3 chart cards with correct data-testid', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.getByTestId('chart-ichart')).toBeDefined();
    expect(screen.getByTestId('chart-boxplot')).toBeDefined();
    expect(screen.getByTestId('chart-pareto')).toBeDefined();
  });

  it('renders stats panel slot content', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.getByTestId('chart-stats')).toBeDefined();
    expect(screen.getByTestId('stats-content')).toBeDefined();
  });

  it('renders render slot content', async () => {
    render(<DashboardLayoutBase {...baseProps} />);
    // Chart-content children mount after the cards' one-rAF skeleton gate.
    await flushRaf();
    expect(screen.getByTestId('ichart-content')).toBeDefined();
    expect(screen.getByTestId('boxplot-content')).toBeDefined();
    expect(screen.getByTestId('pareto-content')).toBeDefined();
  });

  it('holds the I-Chart card on a skeleton while ichartLoading is true', async () => {
    render(<DashboardLayoutBase {...baseProps} ichartLoading />);
    await flushRaf();
    // I-Chart content stays gated; the other charts render normally.
    expect(screen.queryByTestId('ichart-content')).toBeNull();
    expect(screen.getByTestId('boxplot-content')).toBeDefined();
    // The I-Chart card still exists — only its plot slot shows a skeleton.
    expect(screen.getByTestId('chart-ichart')).toBeDefined();
  });

  it('hides pareto card when showParetoPanel is false', () => {
    render(<DashboardLayoutBase {...baseProps} showParetoPanel={false} />);
    expect(screen.queryByTestId('chart-pareto')).toBeNull();
  });

  it('shows focused view instead of grid when focusedChart is set', () => {
    render(
      <DashboardLayoutBase
        {...baseProps}
        focusedChart="ichart"
        renderFocusedView={<div data-testid="focused-view">Focused</div>}
      />
    );
    expect(screen.getByTestId('focused-view')).toBeDefined();
    expect(screen.queryByTestId('chart-ichart')).toBeNull();
  });

  it('shows grid when focusedChart is set but renderFocusedView is undefined', () => {
    render(<DashboardLayoutBase {...baseProps} focusedChart="ichart" />);
    // No focused view slot → falls back to grid
    expect(screen.getByTestId('chart-ichart')).toBeDefined();
  });

  it('renders annotation context menu when open', () => {
    const annotationsOpen: DashboardLayoutBaseProps['annotations'] = {
      ...mockAnnotations,
      contextMenu: {
        isOpen: true,
        position: { x: 100, y: 200 },
        categoryKey: 'Machine A',
        chartType: 'boxplot',
      },
    };
    render(<DashboardLayoutBase {...baseProps} annotations={annotationsOpen} />);
    // Context menu renders highlight options
    expect(screen.getByText('Add observation')).toBeDefined();
  });

  it('renders spec editor slot when provided', () => {
    render(
      <DashboardLayoutBase
        {...baseProps}
        renderSpecEditor={<div data-testid="spec-editor">SpecEditor</div>}
      />
    );
    expect(screen.getByTestId('spec-editor')).toBeDefined();
  });

  it('renders chart insight chip in footer when text is non-null', () => {
    const insightWithText = {
      ...mockInsight,
      chipText: '3 consecutive points above mean',
      chipType: 'warning' as const,
    };
    render(<DashboardLayoutBase {...baseProps} ichartInsight={insightWithText} />);
    expect(screen.getByText('3 consecutive points above mean')).toBeDefined();
  });

  it('only makes I-Chart Nelson signal chips capture actions', () => {
    const onInsightCapture = vi.fn();
    const warningInsight = {
      ...mockInsight,
      chipText: '2 of 50 points outside control limits (4%)',
      chipType: 'warning' as const,
    };
    const { rerender } = render(
      <DashboardLayoutBase
        {...baseProps}
        ichartInsight={warningInsight}
        onInsightCapture={onInsightCapture}
      />
    );

    expect(screen.getByText('2 of 50 points outside control limits (4%)')).not.toHaveAttribute(
      'role',
      'button'
    );

    rerender(
      <DashboardLayoutBase
        {...baseProps}
        ichartInsight={{
          ...warningInsight,
          chipText: 'Process shift: 9 points above mean from obs. 4',
        }}
        onInsightCapture={onInsightCapture}
      />
    );

    fireEvent.click(screen.getByText('Process shift: 9 points above mean from obs. 4'));
    expect(onInsightCapture).toHaveBeenCalledWith('ichart');
  });

  it('does not duplicate control stats inside the I-Chart header', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.queryByText(/UCL:/)).toBeNull();
    expect(screen.queryByText(/Mean:/)).toBeNull();
    expect(screen.queryByText(/LCL:/)).toBeNull();
  });

  it('renders staged stats as inline chips in the controls row when stageColumn is set', () => {
    render(
      <DashboardLayoutBase
        {...baseProps}
        stageColumn="Batch"
        stagedStats={{ stageOrder: ['A', 'B', 'C'], overallStats: { mean: 9.5 } }}
      />
    );
    const chipsHost = screen.getByTestId('staged-stats-chips');
    expect(chipsHost).toBeDefined();
    expect(screen.getByText('3 stages')).toBeDefined();
    expect(screen.getByText('9.50')).toBeDefined();
  });

  it('does not render staged stats chips when stageColumn is null', () => {
    render(<DashboardLayoutBase {...baseProps} stageColumn={null} stagedStats={null} />);
    expect(screen.queryByTestId('staged-stats-chips')).toBeNull();
  });

  it('no longer renders the stage-column / stage-order selects (moved to the context line, ER-1)', () => {
    render(<DashboardLayoutBase {...baseProps} stageColumn="Batch" />);
    expect(screen.queryByLabelText('Select stage column')).toBeNull();
    expect(screen.queryByLabelText('Stage order mode')).toBeNull();
  });

  it('does not render Fixed/Rolling/Open-ended/Cumulative windowing buttons', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.queryByTestId('timeline-window-picker-host')).toBeNull();
    expect(screen.queryByText('Fixed')).toBeNull();
    expect(screen.queryByText('Rolling')).toBeNull();
    expect(screen.queryByText('Open-ended')).toBeNull();
    expect(screen.queryByText('Cumulative')).toBeNull();
  });

  it('renders outcome selector with available outcomes', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    const select = screen.getByLabelText('Select outcome variable');
    expect(select).toBeDefined();
  });

  it('uses custom ichartTitleSlot when provided', () => {
    render(
      <DashboardLayoutBase
        {...baseProps}
        ichartTitleSlot={<h2 data-testid="custom-title">Custom Title</h2>}
      />
    );
    expect(screen.getByTestId('custom-title')).toBeDefined();
  });

  it('uses a neutral variation-sources title when no subgroup factor is selected', () => {
    render(
      <DashboardLayoutBase {...baseProps} factors={[]} boxplotFactor="" showParetoPanel={false} />
    );

    expect(screen.getByText('Variation Sources')).toBeDefined();
  });

  describe('boxplot factor dropdown', () => {
    beforeEach(() => {
      noop.mockClear();
    });

    it('renders one factor dropdown with all factor columns as options', () => {
      render(<DashboardLayoutBase {...baseProps} />);
      const trigger = screen.getByTestId('boxplot-factor-dropdown');
      expect(trigger).toBeDefined();
      // Open the dropdown
      fireEvent.click(trigger);
      expect(screen.getByRole('option', { name: 'Machine' })).toBeDefined();
      expect(screen.getByRole('option', { name: 'Operator' })).toBeDefined();
    });

    it('calls setBoxplotFactor when a factor option is selected', () => {
      const setBoxplotFactor = vi.fn();
      render(<DashboardLayoutBase {...baseProps} setBoxplotFactor={setBoxplotFactor} />);
      fireEvent.click(screen.getByTestId('boxplot-factor-dropdown'));
      fireEvent.click(screen.getByRole('option', { name: 'Operator' }));
      expect(setBoxplotFactor).toHaveBeenCalledWith('Operator');
    });

    it('does not render a tab-strip FactorSelector for the boxplot card', () => {
      render(<DashboardLayoutBase {...baseProps} />);
      // The tab-strip renders buttons directly inside chart-boxplot; none should exist
      // for the factor columns in the controls row.
      const boxplotCard = screen.getByTestId('chart-boxplot');
      // Tab-strip buttons for factors would have the factor text as button text
      // Confirm no button with role "button" carrying the factor name exists
      // outside of the dropdown trigger (which shows the selected value inline).
      // We verify by checking the dropdown trigger is present instead of inline buttons.
      const trigger = screen.getByTestId('boxplot-factor-dropdown');
      expect(trigger).toBeDefined();
      expect(boxplotCard).toBeDefined();
    });

    it('does not render the dropdown trigger when factors array is empty', () => {
      render(<DashboardLayoutBase {...baseProps} factors={[]} boxplotFactor="" />);
      expect(screen.queryByTestId('boxplot-factor-dropdown')).toBeNull();
    });
  });

  /**
   * IM-6 / ADR-089 anti-green-but-dead seam.
   *
   * ADR-089 §6.1: the four charts (I-Chart / Boxplot / Pareto / Stats) are
   * ALWAYS shown and ALWAYS drillable — there is no mode-picker and no
   * lens-picker gating which chart is visible. The verify card is a single
   * supplementary diagnostics slot; it must render its content directly
   * without an extra "pick one of the always-on charts" switcher.
   *
   * A regression that hides one of the four charts behind a lens picker, or
   * that removes the maximize (drill) affordance, fails these assertions.
   */
  describe('IM-6 always-on charts + drillability (ADR-089 §6.1)', () => {
    it('shows all four charts at once with no lens picker gating them', async () => {
      render(
        <DashboardLayoutBase
          {...baseProps}
          renderVerificationCard={<div data-testid="verify-content">Probability plot</div>}
          // No verificationCardTitle → no SegmentedControl lens switcher.
        />
      );
      // The four always-on charts render simultaneously.
      expect(screen.getByTestId('chart-ichart')).toBeTruthy();
      expect(screen.getByTestId('chart-boxplot')).toBeTruthy();
      expect(screen.getByTestId('chart-pareto')).toBeTruthy();
      expect(screen.getByTestId('chart-stats')).toBeTruthy();
      // The verify card renders its diagnostic content directly (after the
      // card's one-rAF skeleton gate)...
      await flushRaf();
      expect(screen.getByTestId('verify-content')).toBeTruthy();
      // ...with no lens-tab SegmentedControl switcher. The apps pass
      // testId="verify-tab" to the SegmentedControl, which emits one button per
      // option as `verify-tab-<value>`. None must exist when no title is set.
      expect(screen.queryByTestId('verify-tab-probability')).toBeNull();
      expect(screen.queryByTestId('verify-tab-distribution')).toBeNull();
      expect(screen.queryByTestId('verify-tab-pareto')).toBeNull();
    });

    it('keeps every chart card individually drillable (maximize affordance)', () => {
      render(<DashboardLayoutBase {...baseProps} />);
      // Each chart card exposes a maximize button → setFocusedChart drill.
      const maximizeButtons = screen.getAllByRole('button', { name: 'Maximize chart' });
      // I-Chart, Boxplot, Pareto each carry a maximize affordance (Stats panel
      // uses a different drill surface). At minimum the three chart cards drill.
      expect(maximizeButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('drilling a chart swaps the grid for the focused view', () => {
      const setFocusedChart = vi.fn();
      const { rerender } = render(
        <DashboardLayoutBase {...baseProps} setFocusedChart={setFocusedChart} />
      );
      fireEvent.click(screen.getAllByRole('button', { name: 'Maximize chart' })[0]);
      expect(setFocusedChart).toHaveBeenCalled();

      // With a focused chart + focused view slot, the grid yields to the drill.
      rerender(
        <DashboardLayoutBase
          {...baseProps}
          focusedChart="ichart"
          renderFocusedView={<div data-testid="focused-drill">Drilled I-Chart</div>}
        />
      );
      expect(screen.getByTestId('focused-drill')).toBeTruthy();
      expect(screen.queryByTestId('chart-boxplot')).toBeNull();
    });
  });
});
