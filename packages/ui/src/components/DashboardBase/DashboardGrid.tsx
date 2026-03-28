import React from 'react';

export interface DashboardGridProps {
  /** The I-Chart card (full width, top row) */
  ichartCard: React.ReactNode;
  /** The Boxplot card */
  boxplotCard: React.ReactNode;
  /** The Pareto card (optional — PWA can hide it) */
  paretoCard?: React.ReactNode;
  /** The Stats panel (optional — omit when stats render in a sidebar instead) */
  statsPanel?: React.ReactNode;
  /** The Histogram card (optional — when provided, enables 3-row grid) */
  histogramCard?: React.ReactNode;
  /** The Probability Plot card (optional — when provided, enables 3-row grid) */
  probabilityPlotCard?: React.ReactNode;
  /** Layout mode: 'grid' (viewport-fit) or 'scroll' (stacked full-width) */
  layout?: 'grid' | 'scroll';
}

/**
 * DashboardGrid — Shared chart grid layout for the analysis dashboard.
 *
 * Three layout modes:
 *
 * **3-row Grid**: When histogramCard + probabilityPlotCard are provided.
 * 40fr/35fr/25fr with Probability Plot (left) + Histogram (right) in row 3.
 *
 * **2-row Grid** (legacy): When histogram/probability slots are absent.
 * 55fr/45fr with stats in bottom-right (340px).
 *
 * **Scroll**: Charts stack vertically at comfortable fixed heights.
 *
 * Mobile/tablet: always flex-col with natural scroll (layout prop ignored).
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
  histogramCard,
  probabilityPlotCard,
  layout = 'grid',
}) => {
  const has3rdRow = !!(histogramCard && probabilityPlotCard);

  // Scroll mode: stacked full-width with fixed heights
  if (layout === 'scroll') {
    return (
      <div className="flex flex-col gap-4 p-3 overflow-y-auto">
        <div className="min-h-[500px] rounded-2xl">{ichartCard}</div>
        <div className="min-h-[400px] rounded-2xl">{boxplotCard}</div>
        {paretoCard && <div className="min-h-[400px] rounded-2xl">{paretoCard}</div>}
        {statsPanel && <div className="rounded-2xl">{statsPanel}</div>}
        {probabilityPlotCard && (
          <div className="min-h-[400px] rounded-2xl">{probabilityPlotCard}</div>
        )}
        {histogramCard && <div className="min-h-[400px] rounded-2xl">{histogramCard}</div>}
      </div>
    );
  }

  // 3-row grid mode: I-Chart / Boxplot+Pareto+Stats / ProbPlot+Histogram
  if (has3rdRow) {
    return (
      <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:h-full lg:grid lg:grid-rows-[40fr_35fr_25fr] lg:overflow-hidden">
        <div className="min-h-0 overflow-hidden lg:rounded-2xl">{ichartCard}</div>
        <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
          <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
            {boxplotCard}
            {paretoCard}
          </div>
          {statsPanel && (
            <div className="min-h-0 overflow-hidden lg:w-[280px] lg:flex-shrink-0">
              {statsPanel}
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">{probabilityPlotCard}</div>
          <div className="flex-1 min-h-0 overflow-hidden">{histogramCard}</div>
        </div>
      </div>
    );
  }

  // 2-row grid mode (legacy): viewport-fit
  return (
    <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:h-full lg:grid lg:grid-rows-[55fr_45fr] lg:overflow-hidden">
      <div className="min-h-0 overflow-hidden lg:rounded-2xl">{ichartCard}</div>
      <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
          {boxplotCard}
          {paretoCard}
        </div>
        {statsPanel && (
          <div className="min-h-0 overflow-hidden lg:w-[340px] lg:flex-shrink-0">{statsPanel}</div>
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;
