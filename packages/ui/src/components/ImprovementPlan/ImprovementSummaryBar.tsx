import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { ComputedRiskLevel } from '@variscout/core';

const RISK_COLORS: Record<ComputedRiskLevel, string> = {
  low: 'text-green-500',
  medium: 'text-amber-500',
  high: 'text-red-400',
  'very-high': 'text-red-600',
};

export interface ImprovementSummaryBarProps {
  selectedCount: number;
  timeframeBreakdown: { 'just-do': number; days: number; weeks: number; months: number };
  maxRisk?: ComputedRiskLevel;
  totalCost?: number;
  costBreakdown?: { none: number; low: number; medium: number; high: number };
  budget?: number;
  projectedCpk?: number;
  targetCpk?: number;
  onConvertToActions?: () => void;
  convertDisabled?: boolean;
}

export const ImprovementSummaryBar: React.FC<ImprovementSummaryBarProps> = ({
  selectedCount,
  timeframeBreakdown,
  maxRisk,
  totalCost,
  budget,
  projectedCpk,
  targetCpk,
  onConvertToActions,
  convertDisabled = false,
}) => {
  const { t, tf } = useTranslation();

  const delta = projectedCpk != null && targetCpk != null ? projectedCpk - targetCpk : undefined;

  return (
    <div
      data-testid="improvement-summary-bar"
      className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-edge bg-surface px-4 py-3"
    >
      {/* Left: selected count */}
      <span data-testid="summary-selected-count" className="text-sm font-medium text-content">
        {tf('improve.selectedCount', { count: selectedCount })}
      </span>

      {/* Center: timeframe breakdown + risk + cost */}
      <div className="flex items-center gap-3 text-xs text-content/60">
        <span data-testid="summary-timeframe-breakdown">
          <span className="text-green-500">{timeframeBreakdown['just-do']}</span>
          {' just do · '}
          <span className="text-cyan-500">{timeframeBreakdown.days}</span>
          {' days · '}
          <span className="text-amber-500">{timeframeBreakdown.weeks}</span>
          {' wks · '}
          <span className="text-red-400">{timeframeBreakdown.months}</span>
          {' mo'}
        </span>

        {maxRisk && (
          <span data-testid="summary-max-risk" className={RISK_COLORS[maxRisk]}>
            {'\u26A0'}{' '}
            {tf('improve.maxRisk', {
              level: t(`risk.${maxRisk === 'very-high' ? 'veryHigh' : maxRisk}`),
            })}
          </span>
        )}

        {totalCost != null && totalCost > 0 && (
          <span data-testid="summary-cost">
            {budget != null
              ? tf('improve.budgetStatus', {
                  spent: totalCost.toLocaleString(),
                  budget: budget.toLocaleString(),
                })
              : tf('improve.totalCost', { amount: totalCost.toLocaleString() })}
          </span>
        )}
      </div>

      {/* Right: projected Cpk + convert button */}
      <div className="flex items-center gap-4">
        {projectedCpk != null && (
          <span data-testid="summary-projected-cpk" className="text-sm text-content">
            {tf('improve.projectedCpk', { value: projectedCpk.toFixed(2) })}
            {delta != null && (
              <span
                data-testid="summary-cpk-delta"
                className={`ml-1.5 text-xs ${delta >= 0 ? 'text-green-500' : 'text-red-400'}`}
              >
                {tf('improve.targetDelta', {
                  delta: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
                })}
              </span>
            )}
          </span>
        )}

        {onConvertToActions && (
          <button
            data-testid="summary-convert-btn"
            onClick={onConvertToActions}
            disabled={convertDisabled || selectedCount === 0}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('improve.convertToActions')}
          </button>
        )}
      </div>
    </div>
  );
};
