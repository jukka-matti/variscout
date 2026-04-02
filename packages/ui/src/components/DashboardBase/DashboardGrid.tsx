import React from 'react';

export interface DashboardGridProps {
  ichartCard: React.ReactNode;
  boxplotCard: React.ReactNode;
  paretoCard?: React.ReactNode;
  /** Tabbed Histogram/ProbPlot card (replaces separate histogram/probability slots) */
  verificationCard?: React.ReactNode;
  /** Stats panel (only when sidebar is closed) */
  piPanel?: React.ReactNode;
  layout?: 'grid' | 'scroll';
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  verificationCard,
  piPanel,
  layout = 'grid',
}) => {
  if (layout === 'scroll') {
    return (
      <div className="flex flex-col gap-4 p-3 overflow-y-auto">
        <div className="min-h-[500px] rounded-2xl">{ichartCard}</div>
        <div className="min-h-[400px] rounded-2xl">{boxplotCard}</div>
        {paretoCard && <div className="min-h-[400px] rounded-2xl">{paretoCard}</div>}
        {verificationCard && <div className="min-h-[400px] rounded-2xl">{verificationCard}</div>}
        {piPanel && <div className="rounded-2xl">{piPanel}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 flex-1 min-h-0 lg:h-full lg:grid lg:grid-rows-[55fr_45fr] lg:overflow-hidden">
      <div className="min-h-0 overflow-hidden lg:rounded-2xl">{ichartCard}</div>
      <div className="flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
          {boxplotCard}
          {paretoCard}
          {verificationCard}
        </div>
        {piPanel && (
          <div className="min-h-0 overflow-hidden lg:w-[280px] lg:flex-shrink-0">{piPanel}</div>
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;
