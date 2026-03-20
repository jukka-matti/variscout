/**
 * ReportHypothesisSummary — Read-only compact hypothesis tree for report context.
 *
 * Renders a flattened view of the hypothesis tree showing:
 * - Hypothesis text with validation status dot
 * - Cause role badge (primary / contributing)
 * - Factor link if available
 * - Indented sub-hypotheses
 */

import React from 'react';
import type { Hypothesis, HypothesisStatus } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface ReportHypothesisSummaryProps {
  hypotheses: Hypothesis[];
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_DOT_COLORS: Record<HypothesisStatus, string> = {
  supported: 'bg-green-500',
  partial: 'bg-amber-500',
  contradicted: 'bg-red-500',
  untested: 'bg-slate-400 dark:bg-slate-500',
};

const STATUS_LABELS: Record<HypothesisStatus, string> = {
  supported: 'Supported',
  partial: 'Partial',
  contradicted: 'Contradicted',
  untested: 'Untested',
};

const CAUSE_ROLE_COLORS: Record<string, string> = {
  primary: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  contributing: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
};

/** Build a tree structure from flat hypothesis array. */
function buildTree(
  hypotheses: Hypothesis[]
): Array<{ hypothesis: Hypothesis; children: Hypothesis[] }> {
  const roots = hypotheses.filter(h => !h.parentId);
  const childMap = new Map<string, Hypothesis[]>();

  for (const h of hypotheses) {
    if (h.parentId) {
      const children = childMap.get(h.parentId) ?? [];
      children.push(h);
      childMap.set(h.parentId, children);
    }
  }

  return roots.map(root => ({
    hypothesis: root,
    children: childMap.get(root.id) ?? [],
  }));
}

// ============================================================================
// Component
// ============================================================================

const HypothesisRow: React.FC<{
  hypothesis: Hypothesis;
  indent?: boolean;
}> = ({ hypothesis, indent }) => {
  return (
    <div className={`flex items-start gap-2 py-1 ${indent ? 'ml-6' : ''}`}>
      {/* Status dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT_COLORS[hypothesis.status]}`}
        title={STATUS_LABELS[hypothesis.status]}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-800 dark:text-slate-200">{hypothesis.text}</span>

          {/* Cause role badge */}
          {hypothesis.causeRole && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CAUSE_ROLE_COLORS[hypothesis.causeRole]}`}
            >
              {hypothesis.causeRole}
            </span>
          )}

          {/* Factor link */}
          {hypothesis.factor && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({hypothesis.factor}
              {hypothesis.level ? `: ${hypothesis.level}` : ''})
            </span>
          )}

          {/* Status label */}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {STATUS_LABELS[hypothesis.status]}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ReportHypothesisSummary: React.FC<ReportHypothesisSummaryProps> = ({ hypotheses }) => {
  if (hypotheses.length === 0) return null;

  const tree = buildTree(hypotheses);

  return (
    <div
      data-testid="report-hypothesis-summary"
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        Hypothesis Tree
      </p>
      <div className="space-y-0.5">
        {tree.map(({ hypothesis, children }) => (
          <div key={hypothesis.id}>
            <HypothesisRow hypothesis={hypothesis} />
            {children.map(child => (
              <HypothesisRow key={child.id} hypothesis={child} indent />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
