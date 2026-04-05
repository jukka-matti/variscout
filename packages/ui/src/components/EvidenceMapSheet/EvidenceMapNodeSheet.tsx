/**
 * EvidenceMapNodeSheet - Bottom action sheet for mobile Evidence Map factor node taps
 *
 * Shows factor details (R²adj, best/worst levels, relationships) and actions
 * (drill down, ask CoScout). Follows MobileCategorySheet patterns:
 * drag handle, swipe dismiss >60px, overlay backdrop, FocusTrap.
 */
import React, { useCallback, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, ChevronRight, MessageCircle } from 'lucide-react';

export interface EvidenceMapNodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  factor: string;
  rSquaredAdj: number;
  levelEffects: Array<{ level: string; effect: number }>;
  relationships: Array<{
    otherFactor: string;
    type: string; // 'INTERACTIVE', 'OVERLAPPING', etc.
    strength: number;
  }>;
  onDrillDown?: (factor: string) => void;
  onAskCoScout?: (factor: string) => void;
}

/** Format a number for display: integers as-is, floats to 3 decimal places */
const fmt = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(3));

/** Format effect with sign prefix */
const fmtEffect = (v: number): string => (v >= 0 ? `+${fmt(v)}` : fmt(v));

/** Map relationship strength (0-1) to a human-readable label */
const strengthLabel = (s: number): string => {
  if (s >= 0.7) return 'Strong';
  if (s >= 0.3) return 'Moderate';
  return 'Weak';
};

export const EvidenceMapNodeSheet: React.FC<EvidenceMapNodeSheetProps> = ({
  isOpen,
  onClose,
  factor,
  rSquaredAdj,
  levelEffects,
  relationships,
  onDrillDown,
  onAskCoScout,
}) => {
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      touchStartY.current = null;
      if (deltaY > 60) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDrillDown = useCallback(() => {
    onDrillDown?.(factor);
    onClose();
  }, [onDrillDown, factor, onClose]);

  const handleAskCoScout = useCallback(() => {
    onAskCoScout?.(factor);
    onClose();
  }, [onAskCoScout, factor, onClose]);

  if (!isOpen) return null;

  // Sort effects descending to find best/worst
  const sorted = [...levelEffects].sort((a, b) => b.effect - a.effect);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="node-sheet-backdrop"
      />

      {/* Bottom sheet */}
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          onDeactivate: onClose,
          fallbackFocus: '[data-testid="evidence-map-node-sheet"]',
        }}
      >
        <div
          className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 animate-slide-up border-t border-edge"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="evidence-map-node-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={`Factor details: ${factor}`}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-surface-elevated rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="text-base font-semibold text-content truncate"
                data-testid="node-sheet-title"
              >
                {factor}
              </span>
              <span className="text-sm text-content-secondary whitespace-nowrap">
                R²adj = {fmt(rSquaredAdj)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-content-secondary hover:text-content rounded-lg transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Level effects */}
          {best && worst && levelEffects.length > 0 && (
            <div className="px-4 py-3" data-testid="node-sheet-levels">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-content-secondary">Best level: </span>
                  <span className="text-content font-medium">
                    {best.level} <span className="text-green-500">({fmtEffect(best.effect)})</span>
                  </span>
                </div>
                <div>
                  <span className="text-content-secondary">Worst level: </span>
                  <span className="text-content font-medium">
                    {worst.level} <span className="text-red-400">({fmtEffect(worst.effect)})</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3" data-testid="node-sheet-relationships">
                <span className="text-sm font-medium text-content-secondary">Relationships</span>
                <div className="mt-2 space-y-1.5">
                  {relationships.map(rel => (
                    <div
                      key={rel.otherFactor}
                      className="flex items-center gap-2 text-sm text-content"
                    >
                      <span className="text-content-secondary">{'\u2194'}</span>
                      <span className="font-medium truncate">{rel.otherFactor}</span>
                      <span className="text-content-secondary text-xs">{rel.type}</span>
                      <span className="text-content-secondary text-xs ml-auto whitespace-nowrap">
                        {strengthLabel(rel.strength)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Action buttons */}
          <div className="px-4 py-3 flex gap-3">
            {onDrillDown && (
              <button
                onClick={handleDrillDown}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors touch-feedback"
                style={{ minHeight: 48 }}
                data-testid="node-sheet-drill-down"
              >
                Drill Down
                <ChevronRight size={16} />
              </button>
            )}
            {onAskCoScout && (
              <button
                onClick={handleAskCoScout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-colors touch-feedback"
                style={{ minHeight: 48 }}
                data-testid="node-sheet-ask-coscout"
              >
                <MessageCircle size={16} />
                Ask CoScout
              </button>
            )}
          </div>

          {/* Safe area bottom */}
          <div className="safe-area-bottom" />
        </div>
      </FocusTrap>
    </>
  );
};

export default EvidenceMapNodeSheet;
