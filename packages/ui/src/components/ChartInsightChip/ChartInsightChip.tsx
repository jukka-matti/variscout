import React from 'react';
import { Lightbulb, AlertTriangle, Info, Sparkles, X } from 'lucide-react';

export interface ChartInsightChipProps {
  /** Insight text to display */
  text: string;
  /** Visual style of the chip */
  chipType?: 'suggestion' | 'warning' | 'info';
  /** Shows sparkle icon indicating AI-enhanced insight */
  isAI?: boolean;
  /** Shows shimmer loading state */
  isLoading?: boolean;
  /** Dismiss callback */
  onDismiss: () => void;
  /** Chart type for data-testid */
  chartType: string;
}

const chipStyles = {
  suggestion: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: Lightbulb,
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-slate-500/10',
    text: 'text-content-secondary',
    icon: Info,
  },
};

/**
 * Small dismissable chip rendered below chart cards showing actionable insight.
 * Renders null when text is empty.
 */
const ChartInsightChip: React.FC<ChartInsightChipProps> = ({
  text,
  chipType = 'info',
  isAI = false,
  isLoading = false,
  onDismiss,
  chartType,
}) => {
  // Loading shimmer
  if (isLoading) {
    return (
      <div
        className="mt-2 h-7 bg-surface-tertiary rounded animate-pulse"
        data-testid={`insight-chip-${chartType}`}
      />
    );
  }

  // No text = no chip
  if (!text) return null;

  const style = chipStyles[chipType];
  const Icon = style.icon;

  return (
    <div
      className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${style.bg} max-w-full`}
      data-testid={`insight-chip-${chartType}`}
    >
      <Icon size={12} className={`${style.text} flex-shrink-0`} />
      {isAI && (
        <>
          <Sparkles size={10} className="text-purple-400 flex-shrink-0" />
          <span className="text-[10px] text-purple-400 flex-shrink-0 font-medium">AI</span>
        </>
      )}
      <span
        className={`flex-1 text-xs sm:text-xs text-[11px] ${style.text} truncate leading-tight`}
      >
        {text}
      </span>
      <button
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
        className={`p-0.5 rounded ${style.text} hover:bg-white/10 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-auto sm:h-auto flex items-center justify-center`}
        aria-label="Dismiss insight"
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default ChartInsightChip;
