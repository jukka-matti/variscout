/**
 * EvidenceMapEdgeSheet - Bottom action sheet for mobile Evidence Map relationship edge taps
 *
 * Shows relationship details (type, strength, evidence badge, why-statement)
 * and a "View Details" action. Follows MobileCategorySheet patterns:
 * drag handle, swipe dismiss >60px, overlay backdrop, FocusTrap.
 */
import React, { useCallback, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { strengthLabel } from './utils';

export interface EvidenceMapEdgeSheetProps {
  onClose: () => void;
  factorA: string;
  factorB: string;
  relationshipType: string;
  strength: number;
  evidenceType?: 'data' | 'gemba' | 'expert' | 'unvalidated';
  whyStatement?: string;
  onPromoteToCausal?: (factorA: string, factorB: string) => void;
  onAskCoScout?: (factorA: string, factorB: string) => void;
}

/** Badge styling per evidence type */
const evidenceBadge: Record<
  NonNullable<EvidenceMapEdgeSheetProps['evidenceType']>,
  { label: string; className: string }
> = {
  data: {
    label: 'Data',
    className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  gemba: {
    label: 'Gemba',
    className: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  expert: {
    label: 'Expert',
    className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  unvalidated: {
    label: 'Unvalidated',
    className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
};

export const EvidenceMapEdgeSheet: React.FC<EvidenceMapEdgeSheetProps> = ({
  onClose,
  factorA,
  factorB,
  relationshipType,
  strength,
  evidenceType,
  whyStatement,
  onPromoteToCausal,
  onAskCoScout,
}) => {
  const { t } = useTranslation();
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

  const badge = evidenceType ? evidenceBadge[evidenceType] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="edge-sheet-backdrop"
      />

      {/* Bottom sheet */}
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          onDeactivate: onClose,
          fallbackFocus: '[data-testid="evidence-map-edge-sheet"]',
        }}
      >
        <div
          className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 animate-slide-up border-t border-edge"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="evidence-map-edge-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={`Relationship: ${factorA} and ${factorB}`}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-surface-elevated rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-base font-semibold text-content truncate"
                data-testid="edge-sheet-title"
              >
                {factorA} {'\u00d7'} {factorB}
              </span>
              <span className="text-sm text-content-secondary whitespace-nowrap">
                {relationshipType}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-content-secondary hover:text-content rounded-lg transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={t('action.close')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Strength + Evidence */}
          <div className="px-4 py-3" data-testid="edge-sheet-details">
            <div className="flex items-center gap-3">
              <span className="text-sm text-content">
                <span className="text-content-secondary">Strength: </span>
                <span className="font-medium">{strengthLabel(strength)}</span>
              </span>
              {badge && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${badge.className}`}
                  data-testid="edge-sheet-evidence-badge"
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Why statement */}
          {whyStatement && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3" data-testid="edge-sheet-why">
                <p className="text-sm text-content italic">{whyStatement}</p>
              </div>
            </>
          )}

          {/* Action buttons */}
          {(onPromoteToCausal || onAskCoScout) && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3 flex gap-2">
                {onPromoteToCausal && (
                  <button
                    onClick={() => {
                      onPromoteToCausal(factorA, factorB);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    style={{ minHeight: 48 }}
                    data-testid="edge-sheet-promote"
                  >
                    Promote to causal link
                  </button>
                )}
                {onAskCoScout && (
                  <button
                    onClick={() => {
                      onAskCoScout(factorA, factorB);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-secondary hover:bg-surface-elevated text-content font-medium rounded-xl transition-colors border border-edge"
                    style={{ minHeight: 48 }}
                    data-testid="edge-sheet-coscout"
                  >
                    Ask CoScout
                  </button>
                )}
              </div>
            </>
          )}

          {/* Safe area bottom */}
          <div className="safe-area-bottom" />
        </div>
      </FocusTrap>
    </>
  );
};

export default EvidenceMapEdgeSheet;
