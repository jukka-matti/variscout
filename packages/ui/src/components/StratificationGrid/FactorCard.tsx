import React from 'react';
import type { MindmapNode } from '@variscout/charts';
import type { StratificationGridColorScheme } from './StratificationGrid';
import CategoryChip from './CategoryChip';

/** Max categories before scroll kicks in */
const SCROLL_THRESHOLD = 8;

interface FactorCardProps {
  node: MindmapNode;
  onCategorySelect?: (factor: string, value: string | number) => void;
  onNodeClick?: (factor: string) => void;
  colorScheme: StratificationGridColorScheme;
}

/**
 * Single factor card with three state renderings:
 * - available: full card with categories, green border if suggested
 * - active: compact blue card showing the drilled value
 * - exhausted: greyed-out card with "< 1% variation" label
 */
const FactorCard: React.FC<FactorCardProps> = ({
  node,
  onCategorySelect,
  onNodeClick,
  colorScheme: c,
}) => {
  const displayName = node.displayName || node.factor;
  const etaPct = Math.round(node.etaSquared * 100);

  // Active: compact card showing the drilled value
  if (node.state === 'active') {
    return (
      <div
        className={`rounded-lg border-2 ${c.cardActiveBorder} ${c.cardActiveBg} px-3 py-2.5`}
        data-testid={`factor-card-${node.factor}`}
        data-state="active"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-300">{displayName}</span>
          <span className="text-sm text-blue-200">= {node.filteredValue ?? '?'}</span>
        </div>
      </div>
    );
  }

  // Exhausted: greyed-out card
  if (node.state === 'exhausted') {
    return (
      <div
        className={`rounded-lg border ${c.cardBorder} ${c.cardExhaustedBg} px-3 py-2.5 opacity-60`}
        data-testid={`factor-card-${node.factor}`}
        data-state="exhausted"
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm ${c.textMuted}`}>{displayName}</span>
          <span className={`text-xs ${c.textMuted}`}>&lt; 1% variation</span>
        </div>
      </div>
    );
  }

  // Available: full card with categories
  const categories = node.categoryData ?? [];
  const maxContribution = categories.reduce((max, cat) => Math.max(max, cat.contributionPct), 0);
  const needsScroll = categories.length > SCROLL_THRESHOLD;

  return (
    <div
      className={`rounded-lg border ${node.isSuggested ? `border-2 ${c.suggestedBorder}` : c.cardBorder} ${c.cardBg} overflow-hidden`}
      data-testid={`factor-card-${node.factor}`}
      data-state="available"
    >
      {/* Header */}
      <button
        className={`w-full px-3 py-2.5 flex items-center justify-between ${c.chipHoverBg} transition-colors`}
        onClick={() => onNodeClick?.(node.factor)}
      >
        <span className={`text-sm font-medium ${c.textPrimary}`}>{displayName}</span>
        <span className={`text-xs font-medium ${c.textSecondary} tabular-nums`}>{etaPct}%</span>
      </button>

      {/* Eta bar */}
      <div className="px-3">
        <div className={`w-full h-1.5 ${c.progressBg} rounded-full overflow-hidden`}>
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(etaPct, 100)}%` }}
          />
        </div>
        <div className={`text-[10px] ${c.textMuted} mt-1`}>Explains {etaPct}% of variation</div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className={`mt-1.5 pb-1 ${needsScroll ? 'max-h-56 overflow-y-auto' : ''}`}>
          {categories.map(cat => (
            <CategoryChip
              key={String(cat.value)}
              value={cat.value}
              count={cat.count}
              contributionPct={cat.contributionPct}
              maxContributionPct={maxContribution}
              onClick={() => onCategorySelect?.(node.factor, cat.value)}
              colorScheme={c}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FactorCard;
