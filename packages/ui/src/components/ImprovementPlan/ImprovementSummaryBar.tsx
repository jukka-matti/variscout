import React from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@variscout/hooks';
import type { ComputedRiskLevel, MessageCatalog } from '@variscout/core';

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

  // --- Lean mode props (yamazumi) ---

  /** Analysis mode — when 'yamazumi', shows lean metrics */
  analysisMode?: 'standard' | 'capability' | 'yamazumi' | 'performance';
  /** Projected cycle time in seconds (yamazumi mode) */
  projectedCycleTime?: number;
  /** Whether projected CT meets takt time (yamazumi mode) */
  meetsTakt?: boolean;
}

type SummaryMode = NonNullable<ImprovementSummaryBarProps['mode']>;

interface RenderProps extends ImprovementSummaryBarProps {
  t: (key: keyof MessageCatalog) => string;
  tf: (key: keyof MessageCatalog, params: Record<string, string | number>) => string;
  delta: number | undefined;
  isYamazumi: boolean;
}

/** Mode-dispatched summary bar renderers (ADR-047 pattern). */

function renderTrackVerified({
  actionsDone,
  actionsTotal,
  verificationCpk,
  verificationYield,
  onAssessOutcome,
  t,
}: RenderProps): ReactElement {
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
          ? `${actionsDone}/${actionsTotal} ${t('improve.actionsDone')}`
          : null}
      </span>

      {/* Center: Cpk and yield deltas */}
      <div className="flex items-center gap-3 text-sm text-content/60">
        {verificationCpk != null && (
          <span data-testid="summary-verification-cpk">
            {'Cpk '}
            <span className="text-content">
              {Number.isFinite(verificationCpk.before) ? verificationCpk.before.toFixed(2) : '—'}
            </span>
            {' \u2192 '}
            <span className="text-green-400 font-medium">
              {Number.isFinite(verificationCpk.after) ? verificationCpk.after.toFixed(2) : '—'}
            </span>
            {cpkImprovement != null && Number.isFinite(cpkImprovement) && (
              <span data-testid="summary-cpk-improvement" className="ml-1 text-green-400">
                {/* eslint-disable-next-line variscout/no-tofixed-on-stats -- guarded on line 98 via Number.isFinite(cpkImprovement) */}
                {`(+${cpkImprovement.toFixed(0)}%)`}
              </span>
            )}
          </span>
        )}

        {verificationYield != null && (
          <span data-testid="summary-verification-yield">
            {'Yield '}
            <span className="text-content">{`${Number.isFinite(verificationYield.before) ? verificationYield.before.toFixed(0) : '—'}%`}</span>
            {' \u2192 '}
            <span className="text-green-400 font-medium">{`${Number.isFinite(verificationYield.after) ? verificationYield.after.toFixed(0) : '—'}%`}</span>
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
            {t('improve.assessOutcome')}
          </button>
        )}
      </div>
    </div>
  );
}

function renderTrack({
  actionsDone,
  actionsTotal,
  overdueCount,
  projectedCpk,
  targetCpk,
  onAddVerification,
  t,
}: RenderProps): ReactElement {
  return (
    <div
      data-testid="improvement-summary-bar"
      className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-edge bg-surface px-4 py-3"
    >
      {/* Left: action progress */}
      <div className="flex items-center gap-3 text-sm">
        {actionsDone != null && actionsTotal != null && (
          <span data-testid="summary-actions-done" className="font-medium text-content">
            {`${actionsDone}/${actionsTotal} ${t('improve.actionsDone')}`}
          </span>
        )}

        {overdueCount != null && overdueCount > 0 && (
          <span data-testid="summary-overdue" className="text-red-400 font-semibold">
            {`\u26A0 ${overdueCount} ${t('improve.overdue')}`}
          </span>
        )}
      </div>

      {/* Center: Cpk target */}
      <div className="flex items-center gap-2 text-sm text-content/60">
        {projectedCpk != null && (
          <span data-testid="summary-projected-cpk">
            {'Cpk '}
            <span className="text-content">
              {Number.isFinite(projectedCpk) ? projectedCpk.toFixed(2) : '—'}
            </span>
            {targetCpk != null && (
              <>
                {' \u2192 target '}
                <span className="text-content">
                  {Number.isFinite(targetCpk) ? targetCpk.toFixed(2) : '—'}
                </span>
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
            {`+ ${t('improve.addVerification')}`}
          </button>
        )}
      </div>
    </div>
  );
}

function renderPlanMixed({
  selectedCount,
  actionsDone,
  actionsTotal,
  overdueCount,
  projectedCpk,
  delta,
  onViewActions,
  onConvertToActions,
  convertDisabled = false,
  isYamazumi,
  projectedCycleTime,
  meetsTakt,
  t,
  tf,
}: RenderProps): ReactElement {
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
            {`${actionsTotal} ${t('improve.actions')}`}
            {' ('}
            <span className="text-content">{`${actionsDone}/${actionsTotal} ${t('improve.done')}`}</span>
            {overdueCount != null && overdueCount > 0 && (
              <span data-testid="summary-overdue" className="text-red-400 font-semibold">
                {` \u00B7 \u26A0 ${overdueCount} ${t('improve.overdue')}`}
              </span>
            )}
            {')'}
          </span>
        )}
      </div>

      {/* Center: projected metric */}
      <div className="flex items-center gap-2">
        {isYamazumi && projectedCycleTime != null ? (
          <span data-testid="summary-projected-ct" className="text-sm text-content">
            {'Projected CT '}
            <span className="font-mono font-medium">
              {Number.isFinite(projectedCycleTime) ? projectedCycleTime.toFixed(1) : '—'}s
            </span>
            {meetsTakt != null && (
              <span
                data-testid="summary-takt-compliance"
                className={`ml-1.5 ${meetsTakt ? 'text-green-500' : 'text-red-400'}`}
              >
                {meetsTakt ? 'Takt \u2713' : 'Takt \u2717'}
              </span>
            )}
          </span>
        ) : (
          projectedCpk != null && (
            <span data-testid="summary-projected-cpk" className="text-sm text-content">
              {tf('improve.projectedCpk', {
                value: Number.isFinite(projectedCpk) ? projectedCpk.toFixed(2) : '—',
              })}
              {delta != null && (
                <span
                  data-testid="summary-cpk-delta"
                  className={`ml-1.5 text-xs ${delta >= 0 ? 'text-green-500' : 'text-red-400'}`}
                >
                  {tf('improve.targetDelta', {
                    delta: `${delta >= 0 ? '+' : ''}${Number.isFinite(delta) ? delta.toFixed(2) : '—'}`,
                  })}
                </span>
              )}
            </span>
          )
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
            {t('improve.viewActions')}
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

function renderPlan({
  selectedCount,
  timeframeBreakdown,
  maxRisk,
  totalCost,
  budget,
  projectedCpk,
  delta,
  onConvertToActions,
  convertDisabled = false,
  isYamazumi,
  projectedCycleTime,
  meetsTakt,
  t,
  tf,
}: RenderProps): ReactElement {
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

      {/* Right: projected metric + convert button */}
      <div className="flex items-center gap-4">
        {isYamazumi && projectedCycleTime != null ? (
          <span data-testid="summary-projected-ct" className="text-sm text-content">
            {'Projected CT '}
            <span className="font-mono font-medium">
              {Number.isFinite(projectedCycleTime) ? projectedCycleTime.toFixed(1) : '—'}s
            </span>
            {meetsTakt != null && (
              <span
                data-testid="summary-takt-compliance"
                className={`ml-1.5 ${meetsTakt ? 'text-green-500' : 'text-red-400'}`}
              >
                {meetsTakt ? 'Takt \u2713' : 'Takt \u2717'}
              </span>
            )}
          </span>
        ) : (
          projectedCpk != null && (
            <span data-testid="summary-projected-cpk" className="text-sm text-content">
              {tf('improve.projectedCpk', {
                value: Number.isFinite(projectedCpk) ? projectedCpk.toFixed(2) : '—',
              })}
              {delta != null && (
                <span
                  data-testid="summary-cpk-delta"
                  className={`ml-1.5 text-xs ${delta >= 0 ? 'text-green-500' : 'text-red-400'}`}
                >
                  {tf('improve.targetDelta', {
                    delta: `${delta >= 0 ? '+' : ''}${Number.isFinite(delta) ? delta.toFixed(2) : '—'}`,
                  })}
                </span>
              )}
            </span>
          )
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

const modeRenderers: Record<SummaryMode, (props: RenderProps) => ReactElement> = {
  'track-verified': renderTrackVerified,
  track: renderTrack,
  'plan-mixed': renderPlanMixed,
  plan: renderPlan,
};

export const ImprovementSummaryBar: React.FC<ImprovementSummaryBarProps> = props => {
  const { t, tf } = useTranslation();
  const { projectedCpk, targetCpk, mode = 'plan', analysisMode } = props;
  const delta = projectedCpk != null && targetCpk != null ? projectedCpk - targetCpk : undefined;
  const isYamazumi = analysisMode === 'yamazumi';

  return modeRenderers[mode]({ ...props, t, tf, delta, isYamazumi });
};
