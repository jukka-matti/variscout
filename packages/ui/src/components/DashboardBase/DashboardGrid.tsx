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
 * - Top: I-Chart (full width)
 * - Bottom: [Boxplot + Pareto] side-by-side | StatsPanel
 *
 * Responsive breakpoints:
 * - Mobile: stacked vertically
 * - md: Boxplot + Pareto side-by-side
 * - lg: Secondary charts + StatsPanel side-by-side
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
}) => (
  <div className="flex flex-col gap-4 p-4 lg:grid lg:grid-rows-[55fr_45fr] lg:h-full lg:min-h-0">
    {ichartCard}
    <div className="flex flex-col lg:flex-row gap-4 min-h-0">
      <div className="flex flex-1 flex-col md:flex-row gap-4 min-h-0">
        {boxplotCard}
        {paretoCard}
      </div>
      {statsPanel}
    </div>
  </div>
);

export default DashboardGrid;
