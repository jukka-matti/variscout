import React, { useMemo } from 'react';
import type { MindmapNode } from '@variscout/charts';
import FactorCard from './FactorCard';

/**
 * Color scheme for StratificationGrid component
 */
export interface StratificationGridColorScheme {
  cardBg: string;
  cardBorder: string;
  cardActiveBg: string;
  cardActiveBorder: string;
  cardExhaustedBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  chipHoverBg: string;
  progressBg: string;
  suggestedBorder: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const stratificationGridDefaultColorScheme: StratificationGridColorScheme = {
  cardBg: 'bg-surface-secondary',
  cardBorder: 'border-edge',
  cardActiveBg: 'bg-blue-500/10',
  cardActiveBorder: 'border-blue-500/40',
  cardExhaustedBg: 'bg-surface',
  textPrimary: 'text-content',
  textSecondary: 'text-content-secondary',
  textMuted: 'text-content-muted',
  chipHoverBg: 'hover:bg-surface-tertiary/50',
  progressBg: 'bg-surface-tertiary',
  suggestedBorder: 'border-green-500/60',
};

export interface StratificationGridProps {
  /** Factor nodes to display */
  nodes: MindmapNode[];
  /** Factor names in drill order */
  drillTrail: string[];
  /** Cumulative variation % isolated so far (0–100) */
  cumulativeVariationPct: number | null;
  /** Target variation % for the progress bar (default 70) */
  targetPct?: number;
  /** Called when a category value is selected */
  onCategorySelect?: (factor: string, value: string | number) => void;
  /** Called when a node header is clicked */
  onNodeClick?: (factor: string) => void;
  /** Column aliases for display names */
  columnAliases?: Record<string, string>;
  /** Color scheme for styling */
  colorScheme?: StratificationGridColorScheme;
}

/**
 * HTML card grid replacing the SVG radial layout for drilldown mode.
 *
 * Each factor becomes a card showing its categories with contribution bars
 * and click-to-filter interaction. Sorted by eta-squared descending.
 *
 * Responsive columns: 1 col < 640px, 2 cols 640-960px, 3 cols 960px+
 */
const StratificationGrid: React.FC<StratificationGridProps> = ({
  nodes,
  drillTrail: _drillTrail,
  cumulativeVariationPct,
  targetPct = 70,
  onCategorySelect,
  onNodeClick,
  columnAliases,
  colorScheme = stratificationGridDefaultColorScheme,
}) => {
  const c = colorScheme;

  // Sort nodes: active first (drill order preserved), then available by eta-squared desc, exhausted last
  const sortedNodes = useMemo(() => {
    const active = nodes.filter(n => n.state === 'active');
    const available = nodes
      .filter(n => n.state === 'available')
      .sort((a, b) => b.etaSquared - a.etaSquared);
    const exhausted = nodes
      .filter(n => n.state === 'exhausted')
      .sort((a, b) => b.etaSquared - a.etaSquared);
    return [...active, ...available, ...exhausted];
  }, [nodes]);

  // Apply column aliases
  const aliasedNodes = useMemo(() => {
    if (!columnAliases || Object.keys(columnAliases).length === 0) return sortedNodes;
    return sortedNodes.map(n => ({
      ...n,
      displayName: columnAliases[n.factor] || n.displayName || n.factor,
    }));
  }, [sortedNodes, columnAliases]);

  const pct = cumulativeVariationPct ?? 0;
  const targetReached = pct >= targetPct;

  return (
    <div className="flex flex-col h-full" data-testid="stratification-grid">
      {/* Card grid — scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {aliasedNodes.map(node => (
            <FactorCard
              key={node.factor}
              node={node}
              onCategorySelect={onCategorySelect}
              onNodeClick={onNodeClick}
              colorScheme={c}
            />
          ))}
        </div>
      </div>

      {/* Progress footer */}
      <div className={`px-3 py-2.5 border-t ${c.cardBorder}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs ${c.textSecondary}`}>
            Focused on {pct > 0 ? `${pct.toFixed(0)}%` : '—'} of variation
          </span>
          <span className={`text-xs ${c.textMuted}`}>{targetPct}% target</span>
        </div>
        <div className={`w-full h-2 ${c.progressBg} rounded-full overflow-hidden relative`}>
          {pct > 0 && (
            <div
              className={`h-full rounded-full transition-all ${targetReached ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          )}
          {/* Target marker */}
          <div
            className="absolute top-0 bottom-0 w-px border-l border-dashed"
            style={{
              left: `${targetPct}%`,
              borderColor: targetReached ? 'rgb(34, 197, 94)' : 'rgb(148, 163, 184)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StratificationGrid;
