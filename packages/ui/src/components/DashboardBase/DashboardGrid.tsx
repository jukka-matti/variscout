import React from 'react';

export interface DashboardGridProps {
  /** The I-Chart card (full width, top row) */
  ichartCard: React.ReactNode;
  /** The Boxplot card */
  boxplotCard: React.ReactNode;
  /** The Pareto card (optional — PWA can hide it) */
  paretoCard?: React.ReactNode;
  /** The Stats panel (right column on large screens) */
  statsPanel: React.ReactNode;
  /** Layout mode: 'grid' (2x2 viewport-fit) or 'scroll' (stacked full-width) */
  layout?: 'grid' | 'scroll';
}

/**
 * DashboardGrid — Shared chart grid layout for the analysis dashboard.
 *
 * Two layout modes:
 *
 * **Grid** (default): All 4 charts fit viewport in a 55fr/45fr CSS Grid.
 * Height chain: h-screen → flex-1 → h-full → **h-full grid**
 * Grid items use overflow-hidden so withParentSize measures constrained size.
 *
 * **Scroll**: Charts stack vertically at comfortable fixed heights.
 * Natural overflow-y-auto scroll. Each chart gets full width.
 *
 * Mobile/tablet: always flex-col with natural scroll (layout prop ignored).
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
  layout = 'grid',
}) => {
  // Scroll mode: stacked full-width with fixed heights
  if (layout === 'scroll') {
    return (
      <div className="flex flex-col gap-4 p-3 overflow-y-auto">
        <div className="min-h-[500px] rounded-2xl">{ichartCard}</div>
        <div className="min-h-[400px] rounded-2xl">{boxplotCard}</div>
        {paretoCard && <div className="min-h-[400px] rounded-2xl">{paretoCard}</div>}
        <div className="rounded-2xl">{statsPanel}</div>
      </div>
    );
  }

  // Grid mode (default): 2x2 viewport-fit
  return (
    <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:h-full lg:grid lg:grid-rows-[55fr_45fr] lg:overflow-hidden">
      <div className="min-h-0 overflow-hidden lg:rounded-2xl">{ichartCard}</div>
      <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
          {boxplotCard}
          {paretoCard}
        </div>
        <div className="min-h-0 overflow-hidden lg:w-[340px] lg:flex-shrink-0">{statsPanel}</div>
      </div>
    </div>
  );
};

export default DashboardGrid;
