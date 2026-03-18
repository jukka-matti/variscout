import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { JourneyPhase, EntryScenario } from '@variscout/core';
import { useIsMobile, BREAKPOINTS } from '../../hooks';

export interface JourneyPhaseStripProps {
  phase: JourneyPhase;
  entryScenario?: EntryScenario;
  /** Called when the user opens the coaching popover/sheet */
  onOpenCoach?: () => void;
  /** Render the popover content (injected by app) */
  renderPopover?: (props: { phase: JourneyPhase; onClose: () => void }) => React.ReactNode;
  /** Render the mobile bottom sheet (injected by app) */
  renderMobileSheet?: (props: { phase: JourneyPhase; onClose: () => void }) => React.ReactNode;
}

const PHASES: JourneyPhase[] = ['frame', 'scout', 'investigate', 'improve'];

const PHASE_LABELS: Record<JourneyPhase, string> = {
  frame: 'Frame',
  scout: 'Scout',
  investigate: 'Investigate',
  improve: 'Improve',
};

const PHASE_COLORS: Record<JourneyPhase, { dot: string; text: string }> = {
  frame: { dot: 'bg-blue-500', text: 'text-blue-400' },
  scout: { dot: 'bg-green-500', text: 'text-green-400' },
  investigate: { dot: 'bg-amber-500', text: 'text-amber-400' },
  improve: { dot: 'bg-purple-500', text: 'text-purple-400' },
};

/**
 * Compact journey phase indicator for header integration.
 * Shows dots + current phase label. Click/tap opens popover or bottom sheet.
 */
const JourneyPhaseStrip: React.FC<JourneyPhaseStripProps> = ({
  phase,
  onOpenCoach,
  renderPopover,
  renderMobileSheet,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const stripRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentIndex = PHASES.indexOf(phase);
  const colors = PHASE_COLORS[phase];

  // Close popover on outside click
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        stripRef.current &&
        !stripRef.current.contains(e.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  // Close popover on Escape
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPopoverOpen]);

  const handleClick = useCallback(() => {
    if (isPhone) {
      setIsMobileSheetOpen(true);
    } else {
      setIsPopoverOpen(prev => !prev);
    }
    onOpenCoach?.();
  }, [isPhone, onOpenCoach]);

  const handleClosePopover = useCallback(() => setIsPopoverOpen(false), []);
  const handleCloseMobileSheet = useCallback(() => setIsMobileSheetOpen(false), []);

  // Don't show on FRAME phase
  if (phase === 'frame') return null;

  return (
    <div className="relative flex items-center" data-testid="journey-phase-strip">
      <button
        ref={stripRef}
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-secondary/50 transition-colors group"
        aria-label={`Journey phase: ${PHASE_LABELS[phase]}. Click for coaching.`}
        aria-expanded={isPopoverOpen}
        data-testid="journey-phase-strip-button"
      >
        {/* Phase dots */}
        <div className="flex items-center gap-0.5">
          {PHASES.map((p, i) => {
            const isCurrent = p === phase;
            const isPast = i < currentIndex;
            return (
              <React.Fragment key={p}>
                {i > 0 && (
                  <div className={`w-1.5 h-px ${isPast ? 'bg-content-muted/40' : 'bg-edge'}`} />
                )}
                <div
                  className={`rounded-full transition-all ${
                    isCurrent
                      ? `w-2 h-2 ${PHASE_COLORS[p].dot}`
                      : isPast
                        ? 'w-1.5 h-1.5 bg-content-muted/30'
                        : 'w-1.5 h-1.5 bg-edge'
                  }`}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Phase label (hidden on very small screens) */}
        <span className={`text-xs font-medium ${colors.text} ${isPhone ? '' : 'hidden sm:inline'}`}>
          {PHASE_LABELS[phase]}
        </span>
      </button>

      {/* Desktop popover */}
      {isPopoverOpen && !isPhone && renderPopover && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-50 animate-fade-in"
          role="dialog"
          aria-label="Methodology Coach"
          data-testid="journey-phase-popover"
        >
          {renderPopover({ phase, onClose: handleClosePopover })}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isMobileSheetOpen &&
        isPhone &&
        renderMobileSheet &&
        renderMobileSheet({ phase, onClose: handleCloseMobileSheet })}
    </div>
  );
};

export { JourneyPhaseStrip };
