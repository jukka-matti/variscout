/**
 * ER-1 Task 5 — Azure I-Chart skeleton overlay (worker-backed stats).
 *
 * Azure's Dashboard passes `ichartLoading={!stats || isComputing}` into the real
 * DashboardLayoutBase, which forwards it to the I-Chart DashboardChartCard's
 * svg-paint skeleton overlay. This test exercises that exact seam with the REAL
 * @variscout/ui layout + card (the full Azure Dashboard test mocks the whole ui
 * surface), driving the pending → resolved transition the stats worker produces.
 * The I-Chart content carries an `<svg>` so the latch can release the overlay
 * once loading clears (mirrors the real visx chart painting an svg).
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
  renderIChartContent: (
    <div data-testid="azure-ichart">
      <svg />
      I-Chart
    </div>
  ),
  renderBoxplotContent: <div data-testid="azure-boxplot">Boxplot</div>,
  renderParetoContent: <div data-testid="azure-pareto">Pareto</div>,
};

describe('Azure Dashboard — I-Chart skeleton overlay (ichartLoading seam)', () => {
  it('holds the I-Chart card on a skeleton overlay while stats are pending', async () => {
    // Pending: ichartLoading=true (Azure passes !stats || isComputing). The
    // I-Chart content mounts underneath, but the overlay covers it.
    render(<DashboardLayoutBase {...baseProps} ichartLoading />);
    await flushRaf();
    expect(screen.getByTestId('chart-ichart')).toBeDefined();
    expect(screen.getAllByTestId('chart-skeleton').length).toBeGreaterThan(0);
    // The I-Chart card's own slot still carries the overlay even though its svg
    // has painted — ichartLoading holds the latch.
    const ichartCard = screen.getByTestId('chart-ichart');
    expect(ichartCard.querySelector('[data-testid="chart-skeleton"]')).not.toBeNull();
  });

  it('drops the I-Chart overlay once stats resolve (ichartLoading=false)', async () => {
    render(<DashboardLayoutBase {...baseProps} ichartLoading={false} />);
    await flushRaf();
    expect(screen.getByTestId('azure-ichart')).toBeDefined();
    // svg painted + !loading → the I-Chart card's overlay is released.
    const ichartCard = screen.getByTestId('chart-ichart');
    expect(ichartCard.querySelector('[data-testid="chart-skeleton"]')).toBeNull();
  });
});
