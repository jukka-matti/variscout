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
  /** Display mode */
  mode?: 'plan' | 'plan-mixed' | 'track' | 'track-verified';
  /** Action completion stats (for plan-mixed and track modes) */
  actionsDone?: number;
  actionsTotal?: number;
  /** Overdue count */
  overdueCount?: number;
  /** Verification Cpk (for track-verified mode) */
  verificationCpk?: { before: number; after: number };
  /** Verification yield (for track-verified mode) */
  verificationYield?: { before: number; after: number };
  /** Callbacks for track modes */
  onViewActions?: () => void;
  onAddVerification?: () => void;
  onAssessOutcome?: () => void;
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
  mode = 'plan',
  actionsDone,
  actionsTotal,
  overdueCount,
  verificationCpk,
  verificationYield,
  onViewActions,
  onAddVerification,
  onAssessOutcome,
}) => {
  const { t, tf } = useTranslation();

  const delta = projectedCpk != null && targetCpk != null ? projectedCpk - targetCpk : undefined;

  if (mode === 'track-verified') {
    const cpkImprovement =
      verificationCpk != null && verificationCpk.before > 0
        ? ((verificationCpk.after - verificationCpk.before) / verificationCpk.before) * 100
        : undefined;

    return (
      <div
        data-testid="improvement-summary-bar"
        className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-edge bg-surface px-4 py-3"
      >
        {/* Left: actions done */}
        <span data-testid="summary-actions-done" className="text-sm font-medium text-content">
          {actionsDone != null && actionsTotal != null
            ? `${actionsDone}/${actionsTotal} ${'actions done'}`
            : null}
        </span>

        {/* Center: Cpk and yield deltas */}
        <div className="flex items-center gap-3 text-sm text-content/60">
          {verificationCpk != null && (
            <span data-testid="summary-verification-cpk">
              {'Cpk '}
              <span className="text-content">{verificationCpk.before.toFixed(2)}</span>
              {' \u2192 '}
              <span className="text-green-400 font-medium">{verificationCpk.after.toFixed(2)}</span>
              {cpkImprovement != null && (
                <span data-testid="summary-cpk-improvement" className="ml-1 text-green-400">
                  {`(+${cpkImprovement.toFixed(0)}%)`}
                </span>
              )}
            </span>
          )}

          {verificationYield != null && (
            <span data-testid="summary-verification-yield">
              {'Yield '}
              <span className="text-content">{`${verificationYield.before.toFixed(0)}%`}</span>
              {' \u2192 '}
              <span className="text-green-400 font-medium">{`${verificationYield.after.toFixed(0)}%`}</span>
            </span>
          )}
        </div>

        {/* Right: assess outcome button */}
        <div className="flex items-center gap-2">
          {onAssessOutcome && (
            <button
              data-testid="summary-assess-outcome-btn"
              onClick={onAssessOutcome}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              {'Assess outcome'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'track') {
    return (
      <div
        data-testid="improvement-summary-bar"
        className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-edge bg-surface px-4 py-3"
      >
        {/* Left: action progress */}
        <div className="flex items-center gap-3 text-sm">
          {actionsDone != null && actionsTotal != null && (
            <span data-testid="summary-actions-done" className="font-medium text-content">
              {`${actionsDone}/${actionsTotal} ${'actions done'}`}
            </span>
          )}

          {overdueCount != null && overdueCount > 0 && (
            <span data-testid="summary-overdue" className="text-red-400 font-semibold">
              {`\u26A0 ${overdueCount} ${'overdue'}`}
            </span>
          )}
        </div>

        {/* Center: Cpk target */}
        <div className="flex items-center gap-2 text-sm text-content/60">
          {projectedCpk != null && (
            <span data-testid="summary-projected-cpk">
              {'Cpk '}
              <span className="text-content">{projectedCpk.toFixed(2)}</span>
              {targetCpk != null && (
                <>
                  {' \u2192 target '}
                  <span className="text-content">{targetCpk.toFixed(2)}</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Right: add verification button */}
        <div className="flex items-center gap-2">
          {onAddVerification && (
            <button
              data-testid="summary-add-verification-btn"
              onClick={onAddVerification}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content hover:bg-surface-secondary transition-colors"
            >
              {`+ ${'Add verification'}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'plan-mixed') {
    return (
      <div
        data-testid="improvement-summary-bar"
        className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-edge bg-surface px-4 py-3"
      >
        {/* Left: ideas + actions counts */}
        <div className="flex items-center gap-3 text-sm">
          <span data-testid="summary-selected-count" className="font-medium text-content">
            {tf('improve.selectedCount', { count: selectedCount })}
          </span>

          {actionsDone != null && actionsTotal != null && (
            <span data-testid="summary-actions-count" className="text-content/60">
              {`${actionsTotal} ${'actions'}`}
              {' ('}
              <span className="text-content">{`${actionsDone}/${actionsTotal} ${'done'}`}</span>
              {overdueCount != null && overdueCount > 0 && (
                <span data-testid="summary-overdue" className="text-red-400 font-semibold">
                  {` \u00B7 \u26A0 ${overdueCount} ${'overdue'}`}
                </span>
              )}
              {')'}
            </span>
          )}
        </div>

        {/* Center: projected Cpk */}
        <div className="flex items-center gap-2">
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
        </div>

        {/* Right: view actions + convert buttons */}
        <div className="flex items-center gap-2">
          {onViewActions && (
            <button
              data-testid="summary-view-actions-btn"
              onClick={onViewActions}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content hover:bg-surface-secondary transition-colors"
            >
              {'View Actions'}
            </button>
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
  }

  // Default: plan mode
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
