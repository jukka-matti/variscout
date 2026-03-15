import React from 'react';
import type { Hypothesis, HypothesisStatus, Finding } from '@variscout/core';
import { HYPOTHESIS_STATUS_LABELS } from '@variscout/core';

/** Status dot colors matching hypothesis statuses */
const STATUS_COLORS: Record<HypothesisStatus, string> = {
  untested: 'bg-gray-400',
  supported: 'bg-green-500',
  contradicted: 'bg-red-400',
  partial: 'bg-amber-500',
};

/** Validation type icons */
const VALIDATION_ICONS: Record<string, string> = {
  data: '\u{1F52C}', // microscope
  gemba: '\u{1F463}', // footprints
  expert: '\u{1F464}', // bust in silhouette
};

export interface HypothesisNodeProps {
  hypothesis: Hypothesis;
  depth: number;
  children: Hypothesis[];
  linkedFindings: Finding[];
  /** Whether this node is expanded */
  isExpanded: boolean;
  /** Toggle expand/collapse */
  onToggle: (id: string) => void;
  /** Click to filter dashboard to this hypothesis's factor+level */
  onSelect?: (hypothesis: Hypothesis) => void;
  /** Add a sub-hypothesis */
  onAddChild?: (parentId: string) => void;
  /** Children summary for display */
  childrenSummary?: {
    supported: number;
    contradicted: number;
    untested: number;
    partial: number;
    total: number;
  };
  /** Whether adding children is allowed (depth/count constraints) */
  canAddChild: boolean;
  /** Whether this hypothesis is contradicted (dims the node) */
  showContradicted: boolean;
}

const HypothesisNode: React.FC<HypothesisNodeProps> = ({
  hypothesis,
  depth,
  children: childHypotheses,
  linkedFindings,
  isExpanded,
  onToggle,
  onSelect,
  onAddChild,
  childrenSummary,
  canAddChild,
  showContradicted,
}) => {
  const isContradicted = hypothesis.status === 'contradicted';
  const dimmed = isContradicted && !showContradicted;

  return (
    <div
      className={`${dimmed ? 'opacity-50' : ''}`}
      style={{ marginLeft: depth * 20 }}
      data-testid={`hypothesis-node-${hypothesis.id}`}
    >
      <div
        className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-surface-secondary cursor-pointer group"
        onClick={() => onSelect?.(hypothesis)}
        role="treeitem"
        aria-expanded={childHypotheses.length > 0 ? isExpanded : undefined}
      >
        {/* Expand/collapse toggle */}
        {childHypotheses.length > 0 ? (
          <button
            className="mt-0.5 text-content-muted hover:text-content text-xs flex-shrink-0 w-4"
            onClick={e => {
              e.stopPropagation();
              onToggle(hypothesis.id);
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span className="mt-0.5 w-4 flex-shrink-0" />
        )}

        {/* Status dot */}
        <span
          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[hypothesis.status]}`}
          title={HYPOTHESIS_STATUS_LABELS[hypothesis.status]}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm text-content ${isContradicted ? 'line-through' : ''}`}>
            {hypothesis.text}
          </span>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Factor badge */}
            {hypothesis.factor && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {hypothesis.factor}
                {hypothesis.level ? `=${hypothesis.level}` : ''}
              </span>
            )}

            {/* Validation type icon */}
            {hypothesis.validationType && (
              <span className="text-[10px]" title={`Validated by: ${hypothesis.validationType}`}>
                {VALIDATION_ICONS[hypothesis.validationType] || ''}
              </span>
            )}

            {/* Task status for gemba/expert */}
            {hypothesis.validationType &&
              hypothesis.validationType !== 'data' &&
              hypothesis.validationTask && (
                <span
                  className={`text-[10px] ${hypothesis.taskCompleted ? 'text-green-400' : 'text-amber-400'}`}
                >
                  {hypothesis.taskCompleted ? 'Done' : 'Pending'}
                </span>
              )}

            {/* Linked findings count */}
            {hypothesis.linkedFindingIds.length > 0 && (
              <span className="text-[10px] text-content-muted">
                {hypothesis.linkedFindingIds.length} finding
                {hypothesis.linkedFindingIds.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Children summary */}
            {childrenSummary && childrenSummary.total > 0 && (
              <span className="text-[10px] text-content-muted">
                {childrenSummary.supported}/{childrenSummary.total} supported
              </span>
            )}
          </div>
        </div>

        {/* Add child button */}
        {canAddChild && onAddChild && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-content-muted hover:text-content mt-0.5"
            onClick={e => {
              e.stopPropagation();
              onAddChild(hypothesis.id);
            }}
            title="Add sub-hypothesis"
            aria-label="Add sub-hypothesis"
          >
            +
          </button>
        )}
      </div>

      {/* Linked findings (compact) */}
      {isExpanded && linkedFindings.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {linkedFindings.map(f => (
            <div
              key={f.id}
              className="text-xs text-content-muted pl-2 border-l-2 border-edge py-0.5"
            >
              {f.text || 'Unnamed finding'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HypothesisNode;
