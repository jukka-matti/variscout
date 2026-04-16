import React from 'react';

export interface DefectSummaryProps {
  totalDefects: number;
  defectRate: number;
  rateLabel: string;
  topDefectType?: string;
  topDefectPercent?: number;
  topFactor?: string;
  topFactorEtaSquared?: number;
  paretoCount80?: number;
  totalTypes?: number;
  trendDirection?: 'up' | 'stable' | 'down';
  showBranding?: boolean;
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const CARD_BG = 'bg-surface-secondary/50 border border-edge/50 rounded-lg p-3';
const LABEL = 'text-xs text-content-secondary mb-1';
const VALUE = 'text-xl font-bold font-mono text-content';
const VALUE_SM = 'text-lg font-bold font-mono text-content';

// ─── Trend Arrow ─────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  up: { symbol: '\u2191', className: 'text-red-400' },
  stable: { symbol: '\u2192', className: 'text-slate-400' },
  down: { symbol: '\u2193', className: 'text-green-500' },
} as const;

interface TrendArrowProps {
  direction: 'up' | 'stable' | 'down';
}

const TrendArrow: React.FC<TrendArrowProps> = ({ direction }) => {
  const { symbol, className } = TREND_CONFIG[direction];
  return (
    <span className={`${className} text-lg font-bold ml-1`} aria-label={`Trend ${direction}`}>
      {symbol}
    </span>
  );
};

// ─── DefectSummary ───────────────────────────────────────────────────────────

/**
 * DefectSummary — Slot 4 panel for defect analysis mode.
 *
 * Pure presentational component: receives pre-computed defect KPIs via props.
 * Compact grid layout matching the visual density of the Stats panel.
 */
const DefectSummary: React.FC<DefectSummaryProps> = ({
  totalDefects,
  defectRate,
  rateLabel,
  topDefectType,
  topDefectPercent,
  topFactor,
  topFactorEtaSquared,
  paretoCount80,
  totalTypes,
  trendDirection,
  showBranding,
}) => {
  return (
    <div
      className="w-full h-full bg-surface-secondary rounded-2xl border border-edge p-4 shadow-xl shadow-black/20 flex flex-col"
      data-testid="defect-summary"
    >
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
        Defect Summary
      </h3>

      <div className="grid grid-cols-2 gap-2 flex-1 content-start">
        {/* Total Defects */}
        <div className={CARD_BG} data-testid="stat-total-defects">
          <div className={LABEL}>Total Defects</div>
          <div className={VALUE}>{totalDefects.toLocaleString()}</div>
        </div>

        {/* Defect Rate */}
        <div className={CARD_BG} data-testid="stat-defect-rate">
          <div className={LABEL}>Defect Rate</div>
          <div className="flex items-baseline">
            <span className={VALUE} data-testid="stat-value-defect-rate">
              {Number.isFinite(defectRate)
                ? defectRate.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '--'}
            </span>
            <span className="text-xs text-content-secondary ml-1">/{rateLabel}</span>
            {trendDirection && <TrendArrow direction={trendDirection} />}
          </div>
        </div>

        {/* Top Defect Type */}
        {topDefectType !== undefined && (
          <div className={`${CARD_BG} col-span-2`} data-testid="stat-top-defect-type">
            <div className={LABEL}>Top Defect Type</div>
            <div className="flex items-center gap-2">
              <span className={VALUE_SM}>{topDefectType}</span>
              {topDefectPercent !== undefined && (
                <span className="text-xs text-content-secondary">
                  {Number.isFinite(topDefectPercent)
                    ? `${Math.round(topDefectPercent * 10) / 10}`
                    : '--'}
                  %
                </span>
              )}
            </div>
            {topDefectPercent !== undefined && Number.isFinite(topDefectPercent) && (
              <div className="mt-1.5 h-1.5 rounded-full bg-edge/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-300"
                  style={{ width: `${Math.min(topDefectPercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Top Factor */}
        {topFactor !== undefined && (
          <div className={CARD_BG} data-testid="stat-top-factor">
            <div className={LABEL}>Top Factor</div>
            <div className={VALUE_SM}>{topFactor}</div>
            {topFactorEtaSquared !== undefined && (
              <div className="text-xs text-content-secondary mt-0.5">
                {'\u03B7\u00B2'} ={' '}
                {Number.isFinite(topFactorEtaSquared)
                  ? `${Math.round(topFactorEtaSquared * 1000) / 1000}`
                  : '--'}
              </div>
            )}
          </div>
        )}

        {/* 80/20 Pareto indicator */}
        {paretoCount80 !== undefined && totalTypes !== undefined && (
          <div className={CARD_BG} data-testid="stat-pareto-8020">
            <div className={LABEL}>80/20 Rule</div>
            <div className="flex items-baseline gap-1">
              <span className={VALUE_SM}>{paretoCount80}</span>
              <span className="text-xs text-content-secondary">of {totalTypes} types = 80%</span>
            </div>
          </div>
        )}
      </div>

      {showBranding && (
        <div className="mt-2 text-[0.625rem] text-content-secondary/50 text-center">VariScout</div>
      )}
    </div>
  );
};

export { DefectSummary };
export default DefectSummary;
