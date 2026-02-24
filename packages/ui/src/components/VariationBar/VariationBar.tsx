import React from 'react';
import { getVariationImpactLevel, getVariationInsight } from '@variscout/core';

/**
 * Color scheme for VariationBar component
 */
export interface VariationBarColorScheme {
  /** Background bar color (e.g., 'bg-surface-tertiary/50' or 'bg-slate-700/50') */
  barBg: string;
  /** Tooltip background (e.g., 'bg-surface-secondary' or 'bg-slate-800') */
  tooltipBg: string;
  /** Tooltip border (e.g., 'border-edge' or 'border-slate-700') */
  tooltipBorder: string;
  /** Content text (e.g., 'text-content' or 'text-slate-300') */
  contentText: string;
  /** Muted text (e.g., 'text-content-muted' or 'text-slate-500') */
  mutedText: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: VariationBarColorScheme = {
  barBg: 'bg-surface-tertiary/50',
  tooltipBg: 'bg-surface-secondary',
  tooltipBorder: 'border-edge',
  contentText: 'text-content',
  mutedText: 'text-content-muted',
};

/**
 * Azure color scheme using Tailwind Slate palette
 */
export const azureColorScheme: VariationBarColorScheme = {
  barBg: 'bg-slate-700/50',
  tooltipBg: 'bg-slate-800',
  tooltipBorder: 'border-slate-700',
  contentText: 'text-slate-300',
  mutedText: 'text-slate-500',
};

export interface VariationBarProps {
  /** Current isolated variation percentage (0-100) */
  isolatedPct: number;
  /** Whether to show labels below the bar (hidden on mobile) */
  showLabels?: boolean;
  /** Custom class name for container */
  className?: string;
  /** Color scheme for styling */
  colorScheme?: VariationBarColorScheme;
  /** Optional click handler (e.g., to open the investigation panel) */
  onClick?: () => void;
}

/**
 * Get color for variation bar based on impact level
 * - Green (>= 50%): High impact - more than half the problem isolated
 * - Amber (30-50%): Moderate impact - significant chunk
 * - Blue (< 30%): Low impact - one of several factors
 */
function getBarColor(impactLevel: 'high' | 'moderate' | 'low'): string {
  switch (impactLevel) {
    case 'high':
      return 'bg-green-500';
    case 'moderate':
      return 'bg-amber-500';
    case 'low':
    default:
      return 'bg-blue-500';
  }
}

/**
 * Get text color for variation labels based on impact level
 */
function getTextColor(impactLevel: 'high' | 'moderate' | 'low'): string {
  switch (impactLevel) {
    case 'high':
      return 'text-green-400';
    case 'moderate':
      return 'text-amber-400';
    case 'low':
    default:
      return 'text-blue-400';
  }
}

/**
 * Stacked bar showing focused vs outside-scope variation
 *
 * Design:
 * [||||||||░░░░░░░░░░░░] 30% in focus | 70% outside scope
 *
 * The bar provides visual context for the cumulative scope percentage:
 * - Left segment (colored): variation in focus
 * - Right segment (gray): variation outside current scope
 *
 * Color coding based on impact:
 * - Green (>= 50%): "More than half your total variation in focus"
 * - Amber (30-50%): "Significant slice of variation in focus"
 * - Blue (< 30%): "Deep investigation — concentrated slice"
 *
 * @example
 * ```tsx
 * // Using PWA semantic tokens (default)
 * <VariationBar isolatedPct={45} showLabels={true} />
 *
 * // Using Azure color scheme
 * <VariationBar
 *   isolatedPct={45}
 *   showLabels={true}
 *   colorScheme={azureColorScheme}
 * />
 * ```
 */
const VariationBar: React.FC<VariationBarProps> = ({
  isolatedPct,
  showLabels = true,
  className = '',
  colorScheme = defaultColorScheme,
  onClick,
}) => {
  const impactLevel = getVariationImpactLevel(isolatedPct);
  const barColor = getBarColor(impactLevel);
  const textColor = getTextColor(impactLevel);
  const insightText = getVariationInsight(isolatedPct);
  const unexplainedPct = 100 - isolatedPct;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Bar container */}
      <div
        className={`relative group${onClick ? ' cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? 'Open investigation panel' : undefined}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {/* Background bar */}
        <div className={`h-2 w-full ${colorScheme.barBg} rounded-full overflow-hidden`}>
          {/* Isolated segment */}
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.max(isolatedPct, 1)}%` }}
          />
        </div>

        {/* Tooltip */}
        <div
          className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg
            ${colorScheme.tooltipBg} border ${colorScheme.tooltipBorder} shadow-xl
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 z-50
            text-xs pointer-events-none
          `}
        >
          <div className={`font-semibold ${textColor} mb-1`}>
            Focused on {Math.round(isolatedPct)}% of total variation
          </div>
          <p className={colorScheme.contentText}>{insightText}</p>
          <div
            className={`mt-2 pt-2 border-t ${colorScheme.tooltipBorder} ${colorScheme.mutedText}`}
          >
            {impactLevel === 'high' && 'High impact - strong case for action'}
            {impactLevel === 'moderate' && 'Moderate impact - worth investigating'}
            {impactLevel === 'low' && 'One of several contributing factors'}
          </div>
          {/* Tooltip arrow */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 ${colorScheme.tooltipBg} border-r border-b ${colorScheme.tooltipBorder}`}
          />
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={`flex justify-between text-[10px] ${colorScheme.mutedText}`}>
          <span className={textColor}>{Math.round(isolatedPct)}% in focus</span>
          <span>{Math.round(unexplainedPct)}% outside scope</span>
        </div>
      )}
    </div>
  );
};

export default VariationBar;
