import React from 'react';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export interface NarrativeBarProps {
  /** Narrative text to display */
  narrative: string | null;
  /** Whether narration is loading */
  isLoading: boolean;
  /** Whether the narrative is from cache */
  isCached: boolean;
  /** Error message */
  error: string | null;
  /** Callback when user clicks "Ask" */
  onAsk?: () => void;
  /** Callback to retry after error */
  onRetry?: () => void;
}

/**
 * Fixed bottom bar showing AI-generated narration of the current analysis state.
 * Shows shimmer during loading, narrative text when ready, and error with retry.
 */
const NarrativeBar: React.FC<NarrativeBarProps> = ({
  narrative,
  isLoading,
  isCached,
  error,
  onAsk,
  onRetry,
}) => {
  // Loading shimmer
  if (isLoading) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 bg-surface-secondary border-t border-edge"
        data-testid="narrative-bar"
      >
        <div className="flex-1 space-y-1.5" data-testid="narrative-shimmer">
          <div className="h-3 bg-surface-tertiary rounded animate-pulse w-3/4" />
          <div className="h-3 bg-surface-tertiary rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 bg-surface-secondary border-t border-edge"
        data-testid="narrative-bar"
      >
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <span className="flex-1 text-xs text-red-400 truncate">{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-content-secondary hover:text-content rounded hover:bg-surface-tertiary transition-colors flex-shrink-0"
            title="Retry"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
      </div>
    );
  }

  // No narrative yet
  if (!narrative) return null;

  // Ready state
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-surface-secondary border-t border-edge"
      data-testid="narrative-bar"
    >
      <p className="flex-1 text-xs text-content-secondary leading-relaxed truncate">
        {narrative}
        {isCached ? (
          <span className="ml-1.5 text-[10px] text-content-muted">(cached)</span>
        ) : (
          <span className="ml-1.5 text-[10px] text-purple-400 font-medium">AI</span>
        )}
      </p>
      {onAsk && (
        <button
          onClick={onAsk}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors flex-shrink-0"
          data-testid="narrative-ask-button"
          title="Ask about this analysis"
        >
          Ask
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};

export default NarrativeBar;
