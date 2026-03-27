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
 * Desktop (lg+): CSS Grid with percentage rows + overflow-hidden ensures
 * all 4 panels fit within the viewport. Percentage rows (not fr units)
 * prevent content intrinsic size from expanding rows beyond their allocation.
 *
 * Mobile/tablet: flex-col with natural scroll.
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
}) => (
  <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:grid lg:grid-rows-[55%_calc(45%-12px)] lg:overflow-hidden">
    <div className="min-h-0 overflow-hidden">{ichartCard}</div>
    <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
      <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0">
        {boxplotCard}
        {paretoCard}
      </div>
      {statsPanel}
    </div>
  </div>
);

export default DashboardGrid;
