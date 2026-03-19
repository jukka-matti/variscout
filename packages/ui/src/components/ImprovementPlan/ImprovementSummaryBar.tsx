import React from 'react';
import { useTranslation } from '@variscout/hooks';

export interface ImprovementSummaryBarProps {
  selectedCount: number;
  effortBreakdown: { low: number; medium: number; high: number };
  projectedCpk?: number;
  targetCpk?: number;
  onConvertToActions?: () => void;
  convertDisabled?: boolean;
}

export const ImprovementSummaryBar: React.FC<ImprovementSummaryBarProps> = ({
  selectedCount,
  effortBreakdown,
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

      {/* Center: effort breakdown */}
      <span data-testid="summary-effort-breakdown" className="text-xs text-content/60">
        <span className="text-green-500">{effortBreakdown.low}</span>
        {' low · '}
        <span className="text-amber-500">{effortBreakdown.medium}</span>
        {' med · '}
        <span className="text-red-400">{effortBreakdown.high}</span>
        {' high'}
      </span>

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
