import React, { useMemo } from 'react';
import type {
  Finding,
  FindingStatus,
  Hypothesis,
  FilterAction,
  HypothesisStatus,
} from '@variscout/core';
import { FINDING_STATUSES, FINDING_STATUS_LABELS } from '@variscout/core';
import type { ViewState } from '@variscout/hooks';
import { filterStackToBreadcrumbs } from '@variscout/core';
import { PHASE_CONFIG } from '../lib/journeyPhaseConfig';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectStatusCardProps {
  projectName: string;
  lastEdited?: string;
  journeyPhase: 'frame' | 'scout' | 'investigate' | 'improve';
  findings: Finding[];
  hypotheses: Hypothesis[];
  filterStack: FilterAction[];
  viewState?: ViewState | null;
  onNavigateToFindings: (status?: string) => void;
  onNavigateToHypothesis: (id: string) => void;
  onNavigateToActions: () => void;
  onResumeAnalysis: () => void;
}

const PHASE_ORDER = ['frame', 'scout', 'investigate', 'improve'] as const;

// ── Finding status color dots ────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<FindingStatus, string> = {
  observed: 'bg-amber-500',
  investigating: 'bg-blue-500',
  analyzed: 'bg-purple-500',
  improving: 'bg-indigo-500',
  resolved: 'bg-green-500',
};

// ── Hypothesis status icons ──────────────────────────────────────────────────

const HYPOTHESIS_STATUS_ICONS: Record<HypothesisStatus, string> = {
  supported: '\u2713',
  contradicted: '\u2717',
  untested: '?',
  partial: '\u25D0',
};

// ── Component ────────────────────────────────────────────────────────────────

const ProjectStatusCard: React.FC<ProjectStatusCardProps> = ({
  projectName,
  lastEdited,
  journeyPhase,
  findings,
  hypotheses,
  filterStack,
  onNavigateToFindings,
  onNavigateToHypothesis,
  onNavigateToActions,
  onResumeAnalysis,
}) => {
  // Count findings by status
  const findingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of FINDING_STATUSES) {
      counts[status] = 0;
    }
    for (const f of findings) {
      counts[f.status] = (counts[f.status] || 0) + 1;
    }
    return counts;
  }, [findings]);

  // Root hypotheses (no parentId)
  const rootHypotheses = useMemo(() => hypotheses.filter(h => !h.parentId), [hypotheses]);

  // Action progress across all findings
  const actionProgress = useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const f of findings) {
      if (f.actions) {
        total += f.actions.length;
        completed += f.actions.filter(a => a.completedAt != null).length;
      }
    }
    return { total, completed };
  }, [findings]);

  // Current focus text from filter stack
  const currentFocus = useMemo(() => {
    if (filterStack.length === 0) return null;
    const breadcrumbs = filterStackToBreadcrumbs(filterStack);
    // filterStackToBreadcrumbs always prepends a root item — skip it
    const filterBreadcrumbs = breadcrumbs.filter(b => b.id !== 'root');
    if (filterBreadcrumbs.length === 0) return null;
    return filterBreadcrumbs.map(b => b.label).join(' > ');
  }, [filterStack]);

  // Phase index for segment rendering
  const activePhaseIndex = PHASE_ORDER.indexOf(journeyPhase);

  return (
    <div
      className="rounded-lg border border-edge bg-surface-secondary p-5 space-y-5"
      data-testid="project-status-card"
    >
      {/* Header: project name + last edited */}
      <div>
        <h2 className="text-lg font-semibold text-content">{projectName}</h2>
        {lastEdited && (
          <p className="text-sm text-content-secondary mt-0.5">Last edited {lastEdited}</p>
        )}
      </div>

      {/* Phase indicator */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          {PHASE_ORDER.map((phase, index) => {
            const config = PHASE_CONFIG[phase];
            const isActive = index <= activePhaseIndex;
            return (
              <div key={phase} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full ${
                    isActive ? config.solidBgColor : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span
                  className={`text-[0.625rem] font-medium ${
                    phase === journeyPhase ? config.textColor : 'text-content-secondary'
                  }`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current focus */}
      {currentFocus && (
        <div>
          <p className="text-xs text-content-secondary mb-1">Current focus</p>
          <button
            onClick={onResumeAnalysis}
            className="text-sm text-blue-500 hover:text-blue-600 hover:underline cursor-pointer text-left"
          >
            {currentFocus}
          </button>
        </div>
      )}

      {/* Findings by status */}
      {findings.length > 0 && (
        <div>
          <p className="text-xs text-content-secondary mb-2">Findings</p>
          <div className="flex flex-wrap gap-2">
            {FINDING_STATUSES.map(status => {
              const count = findingCounts[status];
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  onClick={() => onNavigateToFindings(status)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-primary hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-sm"
                  data-testid={`finding-status-${status}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status]}`}
                  />
                  <span className="text-content">{count}</span>
                  <span className="text-content-secondary">{FINDING_STATUS_LABELS[status]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Root hypotheses */}
      {rootHypotheses.length > 0 && (
        <div>
          <p className="text-xs text-content-secondary mb-2">Hypotheses</p>
          <ul className="space-y-1">
            {rootHypotheses.map(h => (
              <li key={h.id}>
                <button
                  onClick={() => onNavigateToHypothesis(h.id)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-sm"
                  data-testid={`hypothesis-${h.id}`}
                >
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-xs font-mono"
                    title={h.status}
                  >
                    {HYPOTHESIS_STATUS_ICONS[h.status]}
                  </span>
                  <span className="text-content flex-1 truncate">{h.text}</span>
                  {h.factor && (
                    <span className="text-xs text-content-secondary shrink-0">{h.factor}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action progress */}
      {actionProgress.total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-content-secondary">Actions</p>
            <button
              onClick={onNavigateToActions}
              className="text-xs text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
            >
              {actionProgress.completed}/{actionProgress.total} completed
            </button>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-600">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all"
              style={{
                width: `${
                  actionProgress.total > 0
                    ? (actionProgress.completed / actionProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusCard;
