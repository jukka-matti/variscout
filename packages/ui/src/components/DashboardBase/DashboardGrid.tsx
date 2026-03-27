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
 * Height chain (desktop): h-screen → flex-1 → h-full → flex-1 → **h-full grid**
 * Every container must have DEFINITE height for CSS Grid fr units to work.
 * Grid items use overflow-hidden so withParentSize measures the constrained
 * size, not the SVG intrinsic size (which would create circular expansion).
 *
 * Layout:
 * - Top: I-Chart (full width, 55fr)
 * - Bottom: [Boxplot + Pareto] side-by-side | StatsPanel (45fr)
 *
 * Mobile/tablet: flex-col with natural scroll (no grid).
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  statsPanel,
}) => (
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

export default DashboardGrid;
