import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FocusedViewOverlayProps {
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}

/**
 * FocusedViewOverlay — Navigation overlay for focused (maximized) chart mode.
 *
 * Renders prev/next arrows that appear on hover, wrapping the focused chart card.
 * Used by both PWA and Azure dashboards.
 */
const FocusedViewOverlay: React.FC<FocusedViewOverlayProps> = ({ onPrev, onNext, children }) => (
  <div className="flex-1 flex p-4 h-full relative group/focus">
    <button
      onClick={onPrev}
      className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-content rounded-full shadow-lg border border-edge opacity-0 group-hover/focus:opacity-100 transition-opacity"
      aria-label="Previous chart"
      title="Previous Chart (Left Arrow)"
    >
      <ChevronLeft size={24} />
    </button>
    <button
      onClick={onNext}
      className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-content rounded-full shadow-lg border border-edge opacity-0 group-hover/focus:opacity-100 transition-opacity"
      aria-label="Next chart"
      title="Next Chart (Right Arrow)"
    >
      <ChevronRight size={24} />
    </button>
    {children}
  </div>
);

export default FocusedViewOverlay;
