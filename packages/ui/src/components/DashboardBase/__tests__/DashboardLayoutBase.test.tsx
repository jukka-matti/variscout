/**
 * Tests for DashboardLayoutBase component
 *
 * Validates: chart card rendering, focused view toggle, annotation context menu,
 * spec editor slot, insight chips, and render slot composition.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DashboardLayoutBase from '../DashboardLayoutBase';
import type { DashboardLayoutBaseProps } from '../DashboardLayoutBase';
import type { TimelineWindow } from '@variscout/core';

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
  availableStageColumns: [],
  stageColumn: null,
  setStageColumn: noop,
  stageOrderMode: 'auto',
  setStageOrderMode: noop,
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

  it('renders render slot content', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.getByTestId('ichart-content')).toBeDefined();
    expect(screen.getByTestId('boxplot-content')).toBeDefined();
    expect(screen.getByTestId('pareto-content')).toBeDefined();
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

  it('does not duplicate control stats inside the I-Chart header', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.queryByText(/UCL:/)).toBeNull();
    expect(screen.queryByText(/Mean:/)).toBeNull();
    expect(screen.queryByText(/LCL:/)).toBeNull();
  });

  it('renders staged stats when stageColumn is set', () => {
    render(
      <DashboardLayoutBase
        {...baseProps}
        stageColumn="Batch"
        stagedStats={{ stageOrder: ['A', 'B', 'C'], overallStats: { mean: 9.5 } }}
      />
    );
    expect(screen.getByText('3 stages')).toBeDefined();
    expect(screen.getByText('9.50')).toBeDefined();
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

  it('renders TimelineWindowPicker when window + change handler are provided, and propagates kind changes', () => {
    const onTimelineWindowChange = vi.fn();
    const window: TimelineWindow = { kind: 'cumulative' };
    render(
      <DashboardLayoutBase
        {...baseProps}
        timelineWindow={window}
        onTimelineWindowChange={onTimelineWindowChange}
      />
    );
    expect(screen.getByTestId('timeline-window-picker-host')).toBeDefined();
    // Click "Rolling" chip — switches kind, fires onChange with rolling default.
    fireEvent.click(screen.getByTestId('timeline-window-chip-rolling'));
    expect(onTimelineWindowChange).toHaveBeenCalledTimes(1);
    expect(onTimelineWindowChange.mock.calls[0][0]).toMatchObject({ kind: 'rolling' });
  });

  it('does not render TimelineWindowPicker when timelineWindow prop is omitted', () => {
    render(<DashboardLayoutBase {...baseProps} />);
    expect(screen.queryByTestId('timeline-window-picker-host')).toBeNull();
  });

  it('uses a neutral variation-sources title when no subgroup factor is selected', () => {
    render(
      <DashboardLayoutBase {...baseProps} factors={[]} boxplotFactor="" showParetoPanel={false} />
    );

    expect(screen.getByText('Variation Sources')).toBeDefined();
  });
});
