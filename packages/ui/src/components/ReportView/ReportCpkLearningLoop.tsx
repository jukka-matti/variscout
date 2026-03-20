/**
 * ReportCpkLearningLoop — Before → Projected → Actual Cpk comparison.
 *
 * Visualizes the PDCA learning loop:
 * - Before Cpk (from FindingOutcome.cpkBefore)
 * - Projected Cpk (best projection from selected ImprovementIdeas)
 * - Actual Cpk (from FindingOutcome.cpkAfter)
 *
 * Color-coded verdict:
 * - Green: actual ≥ projected (or within 5%)
 * - Amber: improved but below projected
 * - Red: not improved from before
 */

import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { MessageCatalog } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface ReportCpkLearningLoopProps {
  cpkBefore?: number;
  projectedCpk?: number;
  cpkAfter?: number;
  /** Overall outcome verdict */
  verdict?: 'yes' | 'no' | 'partial';
}

// ============================================================================
// Helpers
// ============================================================================

function formatCpk(value: number | undefined): string {
  if (value === undefined) return '—';
  return value.toFixed(2);
}

function getDeltaColor(before: number | undefined, after: number | undefined): string {
  if (before === undefined || after === undefined) return 'text-slate-500';
  const delta = after - before;
  if (delta >= 0) return 'text-green-600 dark:text-green-400';
  return 'text-red-600 dark:text-red-400';
}

function formatDelta(from: number | undefined, to: number | undefined): string {
  if (from === undefined || to === undefined) return '';
  const delta = to - from;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}`;
}

function getVerdictKey(verdict?: 'yes' | 'no' | 'partial'): string | null {
  switch (verdict) {
    case 'yes':
      return 'report.verdict.effective';
    case 'partial':
      return 'report.verdict.partiallyEffective';
    case 'no':
      return 'report.verdict.notEffective';
    default:
      return null;
  }
}

function getVerdictColor(verdict?: 'yes' | 'no' | 'partial'): string {
  switch (verdict) {
    case 'yes':
      return 'text-green-600 dark:text-green-400';
    case 'partial':
      return 'text-amber-600 dark:text-amber-400';
    case 'no':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-slate-500';
  }
}

function getVerdictBg(verdict?: 'yes' | 'no' | 'partial'): string {
  switch (verdict) {
    case 'yes':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'partial':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    case 'no':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    default:
      return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  }
}

// ============================================================================
// Component
// ============================================================================

export const ReportCpkLearningLoop: React.FC<ReportCpkLearningLoopProps> = ({
  cpkBefore,
  projectedCpk,
  cpkAfter,
  verdict,
}) => {
  const { t, tf } = useTranslation();
  const hasProjection = projectedCpk !== undefined;
  const hasBefore = cpkBefore !== undefined;
  const hasAfter = cpkAfter !== undefined;

  // Don't render if we have no data at all
  if (!hasBefore && !hasAfter) return null;

  return (
    <div
      data-testid="report-cpk-learning-loop"
      className={`rounded-lg border p-4 ${getVerdictBg(verdict)}`}
    >
      {/* Title */}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        {t('report.cpkLearningLoop')}
      </p>

      {/* Timeline */}
      <div className="flex items-center justify-between gap-2">
        {/* Before */}
        <div className="text-center flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t('report.cpk.before')}
          </p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {formatCpk(cpkBefore)}
          </p>
        </div>

        {/* Arrow to projected */}
        {hasProjection && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-slate-300 dark:text-slate-600 text-lg">→</span>
            </div>

            {/* Projected */}
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('report.cpk.projected')}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCpk(projectedCpk)}
              </p>
            </div>
          </>
        )}

        {/* Arrow to actual */}
        <div className="flex flex-col items-center">
          <span className="text-slate-300 dark:text-slate-600 text-lg">→</span>
        </div>

        {/* Actual */}
        <div className="text-center flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t('report.cpk.actual')}
          </p>
          <p className={`text-2xl font-bold ${getDeltaColor(cpkBefore, cpkAfter)}`}>
            {formatCpk(cpkAfter)}
          </p>
        </div>
      </div>

      {/* Delta and verdict row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
        {/* Overall delta */}
        {hasBefore && hasAfter && (
          <span className={`text-sm font-medium ${getDeltaColor(cpkBefore, cpkAfter)}`}>
            {formatDelta(cpkBefore, cpkAfter)} Cpk
          </span>
        )}

        {/* Projection gap */}
        {hasProjection && hasAfter && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {cpkAfter! >= projectedCpk!
              ? t('report.cpk.metProjection')
              : tf('report.cpk.fromProjection', { delta: formatDelta(projectedCpk, cpkAfter) })}
          </span>
        )}

        {/* Verdict */}
        {verdict && (
          <span className={`text-sm font-semibold ${getVerdictColor(verdict)}`}>
            {getVerdictKey(verdict) ? t(getVerdictKey(verdict)! as keyof MessageCatalog) : ''}
          </span>
        )}
      </div>
    </div>
  );
};
