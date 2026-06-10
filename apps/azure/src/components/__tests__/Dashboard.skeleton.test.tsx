/**
 * ER-1 Task 5 — Azure I-Chart skeleton gate (worker-backed stats).
 *
 * Azure's Dashboard passes `ichartLoading={!stats || isComputing}` into the real
 * DashboardLayoutBase, which forwards it to the I-Chart DashboardChartCard's
 * one-rAF skeleton gate. This test exercises that exact seam with the REAL
 * @variscout/ui layout + card (the full Azure Dashboard test mocks the whole ui
 * surface), driving the pending → resolved transition the stats worker produces.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayoutBase } from '@variscout/ui';
import type { DashboardLayoutBaseProps } from '@variscout/ui';
import { flushRaf } from '@variscout/ui/test-utils';

const noop = () => {};
const noopAsync = async () => {};

const mockInsight = {
  chipText: null,
  chipType: 'info' as const,
  isDismissed: false,
  dismiss: noop,
  isLoading: false,
  isAI: false,
  action: null,
};

const baseProps: DashboardLayoutBaseProps = {
  outcome: 'Weight',
  factors: ['Machine'],
  columnAliases: {},
  filters: {},
  showFilterContext: true,
  showViolin: false,
  boxplotSortBy: 'name',
  boxplotSortDirection: 'asc',
  onDisplayOptionChange: noop,
  availableOutcomes: ['Weight'],
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
  annotations: {
    contextMenu: { isOpen: false, position: { x: 0, y: 0 }, categoryKey: '', chartType: 'boxplot' },
    handleContextMenu: noop,
    closeContextMenu: noop,
    boxplotHighlights: {},
    paretoHighlights: {},
    setHighlight: noop,
    hasAnnotations: false,
    clearAnnotations: noop,
  },
  copyFeedback: null,
  onCopyChart: noopAsync,
  onDownloadPng: noopAsync,
  onDownloadSvg: noop,
  ichartInsight: mockInsight,
  boxplotInsight: mockInsight,
  paretoInsight: mockInsight,
  statsInsight: mockInsight,
  renderIChartContent: <div data-testid="azure-ichart">I-Chart</div>,
  renderBoxplotContent: <div data-testid="azure-boxplot">Boxplot</div>,
  renderParetoContent: <div data-testid="azure-pareto">Pareto</div>,
};

describe('Azure Dashboard — I-Chart skeleton gate (ichartLoading seam)', () => {
  it('holds the I-Chart card on a skeleton while stats are pending', async () => {
    // Pending: ichartLoading=true (Azure passes !stats || isComputing).
    render(<DashboardLayoutBase {...baseProps} ichartLoading />);
    await flushRaf();
    // The I-Chart card exists, but its content stays gated behind the skeleton.
    expect(screen.getByTestId('chart-ichart')).toBeDefined();
    expect(screen.queryByTestId('azure-ichart')).toBeNull();
    expect(screen.getAllByTestId('chart-skeleton').length).toBeGreaterThan(0);
  });

  it('paints the I-Chart content once stats resolve (ichartLoading=false)', async () => {
    render(<DashboardLayoutBase {...baseProps} ichartLoading={false} />);
    await flushRaf();
    expect(screen.getByTestId('azure-ichart')).toBeDefined();
  });
});
