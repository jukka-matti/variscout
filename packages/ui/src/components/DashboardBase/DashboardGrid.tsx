import React from 'react';

export interface DashboardGridProps {
  ichartCard: React.ReactNode;
  boxplotCard: React.ReactNode;
  paretoCard?: React.ReactNode;
  /** Tabbed Histogram/ProbPlot card (replaces separate histogram/probability slots) */
  verificationCard?: React.ReactNode;
  /** Stats panel (only when sidebar is closed) */
  piPanel?: React.ReactNode;
}

/**
 * DashboardGrid — the chart-generous scroll layout (ER-1 Task 4 retired the
 * grid/scroll toggle; scroll is the only layout). The I-Chart block is
 * viewport-relative so it consumes the viewport remainder under the two-row
 * chrome (compact header + context line); the other cards keep a fixed minimum.
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  ichartCard,
  boxplotCard,
  paretoCard,
  verificationCard,
  piPanel,
}) => {
  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto">
      {/*
       * 240px chrome deduction breakdown (verified against static heights):
       *   AppHeader            h-12          = 48px
       *   ProcessHealthBar     h-[34px]      = 34px
       *   AppFooter            h-8           = 32px
       *   DashboardGrid p-3    top + bottom  = 24px  (12px × 2)
       *   Subtotal of measured chrome        = 138px
       *   Scroll-invitation buffer           ≈ 102px (keeps the card top just
       *     below the fold so the Boxplot card peeks below the I-Chart, signaling
       *     there is more content to scroll to)
       *   Total                              = 240px
       *
       * GoalBanner is conditional (variable height, not included). If it is
       * visible the I-Chart card simply overflows into the scroll area — the
       * min-h-[500px] floor keeps it usable.
       */}
      <div className="h-[calc(100dvh-240px)] min-h-[500px] rounded-2xl">{ichartCard}</div>
      <div className="min-h-[400px] rounded-2xl">{boxplotCard}</div>
      {paretoCard && <div className="min-h-[400px] rounded-2xl">{paretoCard}</div>}
      {verificationCard && <div className="min-h-[400px] rounded-2xl">{verificationCard}</div>}
      {piPanel && <div className="rounded-2xl">{piPanel}</div>}
    </div>
  );
};

export default DashboardGrid;
