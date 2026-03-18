/**
 * MobileCoachSheet - Bottom sheet for phone coaching content.
 * Uses the same backdrop + swipe-to-dismiss pattern as MobileCategorySheet.
 */
import React, { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import type {
  JourneyPhase,
  InvestigationPhase,
  Finding,
  Hypothesis,
  EntryScenario,
} from '@variscout/core';
import { DiamondPhaseMap } from './DiamondPhaseMap';
import { PDCAProgress } from './PDCAProgress';
import type { ScoutHint } from './CoachPopover';

export interface MobileCoachSheetProps {
  phase: JourneyPhase;
  entryScenario?: EntryScenario;
  coachingText?: string;
  onClose: () => void;
  // SCOUT props
  scoutHints?: ScoutHint[];
  drillSuggestion?: string;
  // INVESTIGATE props
  investigationPhase?: InvestigationPhase;
  uncoveredFactors?: Array<{ factor: string; role: string }>;
  // IMPROVE props
  findings?: Finding[];
  hypotheses?: Hypothesis[];
  hasStagedData?: boolean;
}

const PHASE_TITLES: Record<JourneyPhase, string> = {
  frame: 'Setting Up',
  scout: 'Exploring Patterns',
  investigate: 'Investigating Causes',
  improve: 'Improving Process',
};

const HINT_ICONS: Record<string, string> = {
  contribution: '\u03B7\u00B2',
  violation: '!',
  capability: 'Cpk',
};

const MobileCoachSheet: React.FC<MobileCoachSheetProps> = ({
  phase,
  coachingText,
  onClose,
  scoutHints,
  drillSuggestion,
  investigationPhase,
  uncoveredFactors,
  findings,
  hypotheses,
  hasStagedData,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartRef.current === null) return;
    const dy = e.touches[0].clientY - dragStartRef.current;
    if (dy > 0) setDragY(dy);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > 60) {
      onClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  }, [dragY, onClose]);

  return (
    <div className="fixed inset-0 z-50" data-testid="mobile-coach-sheet">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-surface-secondary rounded-t-2xl border-t border-edge shadow-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
        style={{ transform: `translateY(${dragY}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-content-muted/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-sm font-semibold text-content">{PHASE_TITLES[phase]}</h3>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-6 space-y-3">
          {coachingText && (
            <p className="text-xs text-content-secondary leading-relaxed">{coachingText}</p>
          )}

          {/* SCOUT */}
          {phase === 'scout' && (
            <>
              {scoutHints && scoutHints.length > 0 && (
                <div className="space-y-1.5">
                  {scoutHints.map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface text-xs text-content-secondary leading-relaxed"
                    >
                      <span className="flex-shrink-0 text-[10px] font-mono text-content-muted mt-0.5 w-5 text-center">
                        {HINT_ICONS[hint.type] ?? '?'}
                      </span>
                      <span>{hint.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {drillSuggestion && (
                <p className="text-xs text-content-secondary leading-relaxed px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  {drillSuggestion}
                </p>
              )}
            </>
          )}

          {/* INVESTIGATE */}
          {phase === 'investigate' && (
            <>
              <DiamondPhaseMap phase={investigationPhase} />
              {uncoveredFactors && uncoveredFactors.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                    Uninvestigated Factors
                  </div>
                  <div className="space-y-1">
                    {uncoveredFactors.map(({ factor, role }) => (
                      <div key={factor} className="flex items-center gap-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                          {role}
                        </span>
                        <span className="text-content-secondary">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* IMPROVE */}
          {phase === 'improve' && (
            <PDCAProgress findings={findings ?? []} hypotheses={hypotheses} />
          )}

          {hasStagedData && phase === 'improve' && (
            <p className="text-[11px] text-content-muted italic">
              Staged data loaded — check Before vs After in the dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { MobileCoachSheet };
