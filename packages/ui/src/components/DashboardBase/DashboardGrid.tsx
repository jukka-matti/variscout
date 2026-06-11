import React from 'react';

export interface DashboardGridProps {
  ichartCard: React.ReactNode;
  boxplotCard: React.ReactNode;
  paretoCard?: React.ReactNode;
  /** Tabbed Histogram/ProbPlot card (replaces separate histogram/probability slots) */
  verificationCard?: React.ReactNode;
  /** Stats panel (only when sidebar is closed) */
  piPanel?: React.ReactNode;
  /**
   * Optional factor-strip band (ER-2) mounted between the I-Chart and the
   * boxplot. flex-none chrome — never a chart slot. When present the I-Chart
   * wrapper deducts more viewport (the strip eats ~116px under the hero).
   */
  factorStrip?: React.ReactNode;
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
  factorStrip,
}) => {
  // When the ER-2 factor strip is mounted it sits between the hero and the
  // boxplot as flex-none chrome (~116px estimate: ~110px strip + the gap),
  // so the I-Chart wrapper deducts that much more viewport. Without the strip
  // the original 240px deduction is unchanged.
  //
  // NOTE: 324px = the 240px base chrome (see breakdown below) + ~84px strip allowance
  // (measured at the ER-2 browser gate: strip ≈96px tall, band must stay ≥3× the 121px
  // pre-redesign baseline — 324 yields ≈370px ≈ 3.06× at a 932px viewport with the strip
  // fully visible above the fold; 356 measured 338px = 2.79×, failing the acceptance)
  // estimate. The exact strip height is tuned at the `--chrome` browser gate
  // (the strip is content-sized, not a fixed 116px); the floor (min-h-[440px])
  // keeps the hero usable if the estimate runs short.
  const ichartHeightClass = factorStrip
    ? 'h-[calc(100dvh_-_324px)] min-h-[440px] shrink-0 rounded-2xl'
    : 'h-[calc(100dvh_-_240px)] min-h-[500px] shrink-0 rounded-2xl';

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
       * When the factor strip is mounted, add ~84px allowance → 324px (gate-tuned).
       *
       * GoalBanner is conditional (variable height, not included). If it is
       * visible the I-Chart card simply overflows into the scroll area — the
       * min-h floor keeps it usable.
       */}
      {/* shrink-0 is load-bearing: these are flex children of an overflow-y-auto
          column — with the default flex-shrink:1 they compress to their min-h
          floors to fit the container BEFORE overflow scrolls, silently defeating
          the viewport-relative I-Chart height. */}
      <div className={ichartHeightClass}>{ichartCard}</div>
      {factorStrip && (
        <div data-testid="factor-strip-band" className="flex-none shrink-0 rounded-2xl">
          {factorStrip}
        </div>
      )}
      <div className="min-h-[400px] shrink-0 rounded-2xl">{boxplotCard}</div>
      {paretoCard && <div className="min-h-[400px] shrink-0 rounded-2xl">{paretoCard}</div>}
      {verificationCard && (
        <div className="min-h-[400px] shrink-0 rounded-2xl">{verificationCard}</div>
      )}
      {piPanel && <div className="rounded-2xl">{piPanel}</div>}
    </div>
  );
};

export default DashboardGrid;
