/**
 * ReportImprovementSummary — Read-only improvement plan summary for report context.
 *
 * Renders improvement ideas grouped by question with:
 * - Direction badges (Prevent/Detect/Simplify/Eliminate)
 * - Timeframe/cost/risk indicators
 * - Projected Cpk from What-If
 * - Summary bar with totals
 */

import React, { useMemo } from 'react';
import { useTranslation } from '@variscout/hooks';
import type {
  ImprovementIdea,
  IdeaTimeframe,
  IdeaDirection,
  MessageCatalog,
} from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface ReportImprovementSummaryProps {
  questions: Array<{
    id: string;
    text: string;
    causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
    ideas: ImprovementIdea[];
  }>;
  /** Show only the summary bar (for summary audience mode) */
  summaryOnly?: boolean;
  targetCpk?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DIRECTION_COLORS: Record<IdeaDirection, string> = {
  prevent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  detect: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  simplify: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  eliminate: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const DIRECTION_I18N_KEYS: Record<IdeaDirection, keyof MessageCatalog> = {
  prevent: 'idea.prevent',
  detect: 'idea.detect',
  simplify: 'idea.simplify',
  eliminate: 'idea.eliminate',
};

const TIMEFRAME_COLORS: Record<IdeaTimeframe, string> = {
  'just-do': 'text-green-600 dark:text-green-400',
  days: 'text-cyan-600 dark:text-cyan-400',
  weeks: 'text-amber-600 dark:text-amber-400',
  months: 'text-red-600 dark:text-red-400',
};

const TIMEFRAME_I18N_KEYS: Record<IdeaTimeframe, keyof MessageCatalog> = {
  'just-do': 'timeframe.justDo',
  days: 'timeframe.days',
  weeks: 'timeframe.weeks',
  months: 'timeframe.months',
};

// ============================================================================
// Component
// ============================================================================

const IdeaRow: React.FC<{ idea: ImprovementIdea }> = ({ idea }) => {
  const { t, tf } = useTranslation();
  return (
    <div className="flex items-start gap-2 py-1.5 px-2">
      {/* Selection indicator */}
      <span
        className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${
          idea.selected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {idea.selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-800 dark:text-slate-200">{idea.text}</span>

          {/* Direction badge */}
          {idea.direction && (
            <span
              className={`px-1.5 py-0.5 rounded text-[0.625rem] font-medium ${DIRECTION_COLORS[idea.direction]}`}
            >
              {t(DIRECTION_I18N_KEYS[idea.direction])}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-0.5 text-xs">
          {idea.timeframe && (
            <span className={TIMEFRAME_COLORS[idea.timeframe]}>
              {t(TIMEFRAME_I18N_KEYS[idea.timeframe])}
            </span>
          )}
          {idea.cost && (
            <span className="text-slate-500 dark:text-slate-400">
              {idea.cost.amount != null
                ? `€${idea.cost.amount.toLocaleString()}`
                : idea.cost.category !== 'none'
                  ? tf('report.costCategory', { category: idea.cost.category })
                  : t('report.noCost')}
            </span>
          )}
          {idea.risk && (
            <span
              className={`${
                idea.risk.computed === 'low'
                  ? 'text-green-500'
                  : idea.risk.computed === 'medium'
                    ? 'text-amber-500'
                    : 'text-red-500'
              }`}
            >
              {tf('report.riskLevel', { level: idea.risk.computed })}
            </span>
          )}
          {idea.projection?.projectedCpk != null && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Cpk {idea.projection.projectedCpk.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReportImprovementSummary: React.FC<ReportImprovementSummaryProps> = ({
  questions,
  summaryOnly,
  targetCpk,
}) => {
  const { t, tf } = useTranslation();
  const allIdeas = useMemo(() => questions.flatMap(h => h.ideas), [questions]);
  const selectedIdeas = useMemo(() => allIdeas.filter(i => i.selected), [allIdeas]);

  const timeframeBreakdown = useMemo(() => {
    const breakdown: Record<IdeaTimeframe, number> = {
      'just-do': 0,
      days: 0,
      weeks: 0,
      months: 0,
    };
    for (const idea of selectedIdeas) {
      if (idea.timeframe) breakdown[idea.timeframe]++;
    }
    return breakdown;
  }, [selectedIdeas]);

  const bestProjectedCpk = useMemo(() => {
    const projections = selectedIdeas
      .filter(i => i.projection?.projectedCpk != null)
      .map(i => i.projection!.projectedCpk!);
    return projections.length > 0 ? Math.max(...projections) : undefined;
  }, [selectedIdeas]);

  const summaryBar = (
    <div
      data-testid="report-improvement-summary-bar"
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3"
    >
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {tf('report.selectedCount', { count: selectedIdeas.length })}
        </span>

        {/* Timeframe breakdown */}
        <div className="flex items-center gap-2 text-xs">
          {(Object.entries(timeframeBreakdown) as [IdeaTimeframe, number][])
            .filter(([, count]) => count > 0)
            .map(([tf, count]) => (
              <span key={tf} className={TIMEFRAME_COLORS[tf]}>
                {count} {t(TIMEFRAME_I18N_KEYS[tf]).toLowerCase()}
              </span>
            ))}
        </div>

        {/* Projected Cpk */}
        {bestProjectedCpk != null && (
          <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">
            {tf('report.bestProjectedCpk', { value: bestProjectedCpk.toFixed(2) })}
            {targetCpk != null && bestProjectedCpk >= targetCpk && (
              <span className="text-green-500 ml-1">{t('report.meetsTarget')}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );

  if (summaryOnly) return summaryBar;

  const questionsWithIdeas = questions.filter(h => h.ideas.length > 0);
  if (questionsWithIdeas.length === 0) return null;

  return (
    <div data-testid="report-improvement-summary" className="space-y-3">
      {questionsWithIdeas.map(h => (
        <div
          key={h.id}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
        >
          {/* Question header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {h.text}
              </span>
              {h.causeRole && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[0.625rem] font-medium ${
                    h.causeRole === 'suspected-cause'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : h.causeRole === 'ruled-out'
                        ? 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {h.causeRole}
                </span>
              )}
            </div>
          </div>

          {/* Ideas */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {h.ideas.map(idea => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      ))}

      {/* Summary bar */}
      {selectedIdeas.length > 0 && summaryBar}
    </div>
  );
};
