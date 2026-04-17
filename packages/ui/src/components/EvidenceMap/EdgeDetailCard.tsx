import React, { useEffect, useRef } from 'react';
import { X, Link, Bot, MessageCircleQuestion } from 'lucide-react';
import type { RelationshipType } from '@variscout/core/evidenceMap';
import { mapRelationshipType } from '@variscout/core/stats';

export interface EdgeDetailCardProps {
  factorA: string;
  factorB: string;
  relationshipType: RelationshipType;
  rSquaredAdj: number;
  strength: number;
  deltaRSquared?: number;
  x: number;
  y: number;
  onPromoteToCausal: (factorA: string, factorB: string) => void;
  onAskCoScout: (factorA: string, factorB: string) => void;
  onAskQuestion: (factorA: string, factorB: string) => void;
  onClose: () => void;
  /** Optional mini chart slot — rendered between stats and actions */
  children?: React.ReactNode;
  /** Interaction pattern classification (ordinal = gap changes, disordinal = ranking reverses) */
  interactionPattern?: 'ordinal' | 'disordinal';
  /** Cell sample counts for the interaction */
  cellCounts?: Array<{ levelA: string; levelB: string; n: number }>;
}

function strengthLabel(s: number): string {
  if (s >= 0.7) return 'Strong';
  if (s >= 0.3) return 'Moderate';
  return 'Weak';
}

const typeBadgeColors: Record<string, string> = {
  interact: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  overlap: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  independent: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export const EdgeDetailCard: React.FC<EdgeDetailCardProps> = ({
  factorA,
  factorB,
  relationshipType,
  rSquaredAdj,
  strength,
  deltaRSquared,
  x,
  y,
  onPromoteToCausal,
  onAskCoScout,
  onAskQuestion,
  onClose,
  children,
  interactionPattern,
  cellCounts,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const uiType = mapRelationshipType(relationshipType);
  const uiInfo = mapRelationshipType(relationshipType, true);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Smart position: clamp to viewport
  const cardWidth = 300;
  const left = Math.min(x - cardWidth / 2, window.innerWidth - cardWidth - 16);
  const clampedLeft = Math.max(16, left);
  const top = y + 20;

  return (
    <div
      ref={cardRef}
      className="fixed z-50 bg-surface border border-edge rounded-xl shadow-xl"
      style={{ left: clampedLeft, top, width: cardWidth }}
      data-testid="edge-detail-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-content truncate">
            {factorA} {'\u2194'} {factorB}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border ${typeBadgeColors[uiType]}`}
          >
            {uiInfo.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-content-secondary hover:text-content rounded transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats row */}
      <div className="px-3 pb-2 flex items-center gap-3 text-xs text-content-secondary">
        <span>
          R²adj ={' '}
          <span className="font-medium text-content">
            {Number.isFinite(rSquaredAdj) ? rSquaredAdj.toFixed(2) : '—'}
          </span>
        </span>
        {deltaRSquared !== undefined && Number.isFinite(deltaRSquared) && deltaRSquared > 0 && (
          <span>
            ΔR² ={' '}
            {/* eslint-disable-next-line variscout/no-tofixed-on-stats -- guarded on line 111 via Number.isFinite(deltaRSquared) */}
            <span className="font-medium text-content">{(deltaRSquared * 100).toFixed(0)}%</span>
          </span>
        )}
        <span className="font-medium text-content">{strengthLabel(strength)}</span>
      </div>

      {/* Mini chart slot */}
      {children && <div className="px-3 pb-2">{children}</div>}

      {/* Cell counts (Dr. Makela's caveat) */}
      {cellCounts && cellCounts.length > 0 && (
        <div className="px-3 pb-2 text-xs">
          <div className="text-content-secondary mb-1">Cell sizes:</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {cellCounts.map(cell => (
              <span
                key={`${cell.levelA}-${cell.levelB}`}
                className={cell.n < 5 ? 'text-amber-500' : 'text-content-secondary'}
              >
                {cell.levelA}×{cell.levelB}: n={cell.n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guidance */}
      <div className="px-3 pb-2">
        <p className="text-xs text-content-secondary italic">
          {relationshipType === 'interactive' && interactionPattern === 'ordinal'
            ? `The gap between ${factorB} levels changes across ${factorA} values.`
            : relationshipType === 'interactive' && interactionPattern === 'disordinal'
              ? `The ranking of ${factorB} levels reverses across ${factorA} values.`
              : uiInfo.guidance}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-edge" />

      {/* Action buttons */}
      <div className="p-2 flex flex-col gap-1">
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onPromoteToCausal(factorA, factorB)}
          data-testid="edge-card-promote"
        >
          <Link size={14} className="text-content-secondary" />
          Promote to causal link
        </button>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onAskCoScout(factorA, factorB)}
          data-testid="edge-card-coscout"
        >
          <Bot size={14} className="text-content-secondary" />
          Ask CoScout
        </button>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onAskQuestion(factorA, factorB)}
          data-testid="edge-card-question"
        >
          <MessageCircleQuestion size={14} className="text-content-secondary" />
          Ask question
        </button>
      </div>
    </div>
  );
};
