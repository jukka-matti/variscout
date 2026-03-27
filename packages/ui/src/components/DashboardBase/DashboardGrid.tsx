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
}

/**
 * DashboardGrid — Shared chart grid layout for the analysis dashboard.
 *
 * Layout:
 * - Top: I-Chart (full width, ~55% height)
 * - Bottom: [Boxplot + Pareto] side-by-side | StatsPanel (~45% height)
 *
 * Desktop (lg+): CSS Grid with fr rows + overflow-hidden on grid items.
 * Grid items have min-h-0 + overflow-hidden so their intrinsic content
 * size cannot expand the rows beyond the fr allocation.
 *
 * Mobile/tablet: flex-col with natural scroll.
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
}) => (
  <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:grid lg:grid-rows-[55fr_45fr]">
    <div className="min-h-0 overflow-hidden rounded-2xl">{ichartCard}</div>
    <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
      <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
        {boxplotCard}
        {paretoCard}
      </div>
      <div className="min-h-0 overflow-hidden lg:w-[340px] lg:flex-shrink-0">{statsPanel}</div>
    </div>
  </div>
);

export default DashboardGrid;
