import React, { useMemo, useState, useCallback } from 'react';
import {
  findOptimalFactors,
  getCategoryStats,
  calculateProjectedStats,
  calculateStats,
  toNumericValue,
  type OptimalFactorResult,
  type CategoryStats,
  type ProjectedStats,
  getVariationImpactLevel,
  VARIATION_THRESHOLDS,
} from '@variscout/core';
import {
  Filter,
  Target,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  X,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

interface VariationFunnelProps {
  /** Raw data for variation analysis */
  data: any[];
  /** Available factor columns */
  factors: string[];
  /** Outcome column name */
  outcome: string;
  /** Column aliases for display */
  columnAliases?: Record<string, string>;
  /** Specification limits for Cpk projection */
  specs?: { usl?: number; lsl?: number; target?: number };
  /** Target percentage to explain (default: 70) */
  targetPct?: number;
  /** Called when user applies selected filters */
  onApplyFilters?: (filters: Record<string, (string | number)[]>) => void;
  /** Called when user clicks a factor to drill into it */
  onDrillFactor?: (factor: string, value: string | number) => void;
  /** Called when user wants to open in popout window */
  onOpenPopout?: () => void;
  /** Called when user closes the panel */
  onClose?: () => void;
  /** Whether this is rendered in a popout window */
  isPopout?: boolean;
}

/**
 * Get color for factor bar based on its contribution
 */
function getFactorBarColor(variationPct: number): string {
  const level = getVariationImpactLevel(variationPct);
  switch (level) {
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
 * Get text color for factor based on its contribution
 */
function getFactorTextColor(variationPct: number): string {
  const level = getVariationImpactLevel(variationPct);
  switch (level) {
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
 * Variation Funnel Panel
 *
 * Helps users identify the optimal 1-3 filter settings that explain ~70% of variation.
 * Shows a ranked list of factors by η² with visual bars and cumulative tracking.
 *
 * Features:
 * - Ranked factors sorted by η² (highest first)
 * - Cumulative tracking showing product of η² as factors are added
 * - 70% target line indicator
 * - Click to select factors
 * - Apply button to set selected filters in main view
 */
const VariationFunnel: React.FC<VariationFunnelProps> = ({
  data,
  factors,
  outcome,
  columnAliases = {},
  specs,
  targetPct = 70,
  onApplyFilters,
  onDrillFactor,
  onOpenPopout,
  onClose,
  isPopout = false,
}) => {
  // Calculate optimal factors
  const optimalFactors = useMemo(() => {
    return findOptimalFactors(data, factors, outcome, targetPct, 5);
  }, [data, factors, outcome, targetPct]);

  // Track selected factors
  const [selectedFactors, setSelectedFactors] = useState<Set<string>>(() => {
    // Auto-select optimal factors by default
    return new Set(optimalFactors.map(f => f.factor));
  });

  // Track expanded factors for category breakdown
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());

  // Track excluded categories per factor (for what-if projections)
  const [excludedCategories, setExcludedCategories] = useState<Map<string, Set<string | number>>>(
    new Map()
  );

  // Calculate current overall stats (for comparison with projections)
  const currentStats = useMemo(() => {
    const values = data
      .map(d => toNumericValue(d[outcome]))
      .filter((v): v is number => v !== undefined);

    if (values.length < 2) return null;

    const result = calculateStats(values, specs?.usl, specs?.lsl);
    return {
      mean: result.mean,
      stdDev: result.stdDev,
      cpk: result.cpk,
    };
  }, [data, outcome, specs]);

  // Calculate projected stats for each factor with exclusions
  const factorProjections = useMemo(() => {
    const projections = new Map<string, ProjectedStats | null>();

    for (const [factor, excluded] of excludedCategories) {
      if (excluded.size === 0) continue;

      const projected = calculateProjectedStats(
        data,
        factor,
        outcome,
        excluded,
        specs,
        currentStats ?? undefined
      );
      projections.set(factor, projected);
    }

    return projections;
  }, [data, outcome, excludedCategories, specs, currentStats]);

  // Calculate category stats for each factor (memoized)
  const factorCategoryStats = useMemo(() => {
    const statsMap = new Map<string, CategoryStats[] | null>();
    for (const factor of optimalFactors) {
      statsMap.set(factor.factor, getCategoryStats(data, factor.factor, outcome));
    }
    return statsMap;
  }, [data, optimalFactors, outcome]);

  // Calculate cumulative for selected factors only
  const selectedStats = useMemo(() => {
    const selected = optimalFactors.filter(f => selectedFactors.has(f.factor));
    let cumulativeRemaining = 100;

    const withCumulative = selected.map(f => {
      const contribution = (cumulativeRemaining * f.variationPct) / 100;
      cumulativeRemaining = cumulativeRemaining - contribution;
      return {
        ...f,
        selectedCumulativePct: 100 - cumulativeRemaining,
      };
    });

    return {
      factors: withCumulative,
      totalExplained: 100 - cumulativeRemaining,
    };
  }, [optimalFactors, selectedFactors]);

  // Toggle factor selection
  const handleToggleFactor = useCallback((factor: string) => {
    setSelectedFactors(prev => {
      const next = new Set(prev);
      if (next.has(factor)) {
        next.delete(factor);
      } else {
        next.add(factor);
      }
      return next;
    });
  }, []);

  // Toggle category breakdown expansion
  const handleToggleExpand = useCallback((factor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFactors(prev => {
      const next = new Set(prev);
      if (next.has(factor)) {
        next.delete(factor);
      } else {
        next.add(factor);
      }
      return next;
    });
  }, []);

  // Toggle category exclusion for what-if projections
  const handleToggleCategoryExclusion = useCallback(
    (factor: string, categoryValue: string | number, e: React.MouseEvent) => {
      e.stopPropagation();
      setExcludedCategories(prev => {
        const next = new Map(prev);
        const factorExclusions = new Set(prev.get(factor) || []);

        if (factorExclusions.has(categoryValue)) {
          factorExclusions.delete(categoryValue);
        } else {
          factorExclusions.add(categoryValue);
        }

        if (factorExclusions.size === 0) {
          next.delete(factor);
        } else {
          next.set(factor, factorExclusions);
        }

        return next;
      });
    },
    []
  );

  // Reset all exclusions for a factor
  const handleResetExclusions = useCallback((factor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExcludedCategories(prev => {
      const next = new Map(prev);
      next.delete(factor);
      return next;
    });
  }, []);

  // Apply selected filters
  const handleApplyFilters = useCallback(() => {
    if (!onApplyFilters) return;

    const filters: Record<string, (string | number)[]> = {};
    for (const f of optimalFactors) {
      if (selectedFactors.has(f.factor) && f.bestValue !== undefined) {
        filters[f.factor] = [f.bestValue];
      }
    }
    onApplyFilters(filters);
  }, [optimalFactors, selectedFactors, onApplyFilters]);

  // Handle direct drill on factor
  const handleDrillFactor = useCallback(
    (factor: string, value: string | number | undefined) => {
      if (onDrillFactor && value !== undefined) {
        onDrillFactor(factor, value);
      }
    },
    [onDrillFactor]
  );

  // Get display name for factor
  const getFactorName = (factor: string) => columnAliases[factor] || factor;

  // Check if we've reached the target
  const meetsTarget = selectedStats.totalExplained >= targetPct;

  if (optimalFactors.length === 0) {
    return (
      <div className="flex flex-col h-full bg-surface-secondary">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Variation Funnel</h2>
          </div>
          <div className="flex items-center gap-1">
            {!isPopout && onOpenPopout && (
              <button
                onClick={onOpenPopout}
                className="p-1.5 text-content-muted hover:text-white hover:bg-surface-tertiary rounded transition-colors"
                title="Open in new window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-content-muted hover:text-white hover:bg-surface-tertiary rounded transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-content-secondary text-sm text-center">
            No variation data available.
            <br />
            Load data with categorical factors to analyze.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Variation Funnel</h2>
        </div>
        <div className="flex items-center gap-1">
          {!isPopout && onOpenPopout && (
            <button
              onClick={onOpenPopout}
              className="p-1.5 text-content-muted hover:text-white hover:bg-surface-tertiary rounded transition-colors"
              title="Open in new window"
            >
              <ExternalLink size={14} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-content-muted hover:text-white hover:bg-surface-tertiary rounded transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Total variation baseline */}
        <div className="mb-4">
          <div className="text-xs text-content-secondary mb-1">Total Variation (100%)</div>
          <div className="h-3 w-full bg-surface-tertiary rounded-full" />
        </div>

        {/* Factor list */}
        <div className="space-y-3">
          {optimalFactors.map((factor, index) => {
            const isSelected = selectedFactors.has(factor.factor);
            const barColor = getFactorBarColor(factor.variationPct);
            const textColor = getFactorTextColor(factor.variationPct);

            return (
              <div
                key={factor.factor}
                className={`
                  p-3 rounded-lg border transition-all cursor-pointer
                  ${
                    isSelected
                      ? 'bg-surface-tertiary/50 border-blue-500/50'
                      : 'bg-surface/50 border-edge hover:border-edge-secondary'
                  }
                `}
                onClick={() => handleToggleFactor(factor.factor)}
              >
                {/* Factor header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Checkbox */}
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center
                        ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-content-muted'}
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Factor name */}
                    <span className="text-sm font-medium text-white">
                      {getFactorName(factor.factor)}
                    </span>
                  </div>

                  {/* Variation percentage */}
                  <span className={`text-sm font-mono ${textColor}`}>
                    {Math.round(factor.variationPct)}%
                  </span>
                </div>

                {/* Bar */}
                <div className="h-2 w-full bg-surface-tertiary/50 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${factor.variationPct}%` }}
                  />
                </div>

                {/* Best value suggestion */}
                {factor.bestValue !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-muted">
                      Highest impact:{' '}
                      <span className="text-content">{String(factor.bestValue)}</span>
                    </span>
                    {onDrillFactor && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDrillFactor(factor.factor, factor.bestValue);
                        }}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Drill <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Category breakdown toggle */}
                {(() => {
                  const categoryStats = factorCategoryStats.get(factor.factor);
                  const isExpanded = expandedFactors.has(factor.factor);
                  const hasCategories = categoryStats && categoryStats.length > 1;
                  const factorExclusions = excludedCategories.get(factor.factor) || new Set();
                  const hasExclusions = factorExclusions.size > 0;
                  const projection = factorProjections.get(factor.factor);

                  if (!hasCategories) return null;

                  return (
                    <>
                      <button
                        onClick={e => handleToggleExpand(factor.factor, e)}
                        className="mt-2 flex items-center gap-1 text-xs text-content-secondary hover:text-content transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>
                          {isExpanded ? 'Hide' : 'Show'} categories ({categoryStats!.length})
                        </span>
                        {hasExclusions && (
                          <span className="ml-1 text-amber-400">
                            ({factorExclusions.size} excluded)
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 border-t border-edge/50 pt-2">
                          {categoryStats!.map((cat, catIndex) => {
                            const isWorst = catIndex === 0 && cat.contributionPct > 20;
                            const isExcluded = factorExclusions.has(cat.value);
                            return (
                              <div
                                key={String(cat.value)}
                                className={`
                                  flex items-center justify-between text-xs py-1 px-2 rounded cursor-pointer transition-colors
                                  ${isExcluded ? 'bg-amber-500/10 opacity-60' : isWorst ? 'bg-red-500/10' : 'bg-surface/30'}
                                  hover:bg-surface/50
                                `}
                                onClick={e =>
                                  handleToggleCategoryExclusion(factor.factor, cat.value, e)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  {/* Inclusion checkbox */}
                                  <div
                                    className={`
                                      w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                                      ${isExcluded ? 'border-amber-500 bg-transparent' : 'bg-blue-500 border-blue-500'}
                                    `}
                                  >
                                    {!isExcluded && (
                                      <svg
                                        className="w-2.5 h-2.5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={3}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <span
                                    className={`${isExcluded ? 'line-through text-content-muted' : isWorst ? 'text-red-400 font-medium' : 'text-content'}`}
                                  >
                                    {String(cat.value)}
                                  </span>
                                  {isWorst && !isExcluded && (
                                    <span className="text-[10px] text-red-400/80 uppercase tracking-wide">
                                      worst
                                    </span>
                                  )}
                                  {isExcluded && (
                                    <span className="text-[10px] text-amber-400/80 uppercase tracking-wide">
                                      excluded
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-content-muted font-mono">
                                  <span title="Mean" className={isExcluded ? 'opacity-50' : ''}>
                                    μ: {cat.mean.toFixed(1)}
                                  </span>
                                  <span
                                    title="Standard Deviation"
                                    className={isExcluded ? 'opacity-50' : ''}
                                  >
                                    σ: {cat.stdDev.toFixed(2)}
                                  </span>
                                  <span
                                    className={`w-10 text-right ${isExcluded ? 'opacity-50' : isWorst ? 'text-red-400' : ''}`}
                                    title="Contribution to variation"
                                  >
                                    ({Math.round(cat.contributionPct)}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Projection summary panel */}
                          {hasExclusions && projection && currentStats && (
                            <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                                  <TrendingUp size={12} />
                                  <span>Projected if excluded</span>
                                </div>
                                <button
                                  onClick={e => handleResetExclusions(factor.factor, e)}
                                  className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors"
                                  title="Reset exclusions"
                                >
                                  <RotateCcw size={10} />
                                  Reset
                                </button>
                              </div>

                              <div className="space-y-1.5 text-xs font-mono">
                                {/* Mean comparison */}
                                <div className="flex items-center justify-between">
                                  <span className="text-content-secondary">Mean:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-content-muted">
                                      {currentStats.mean.toFixed(1)}
                                    </span>
                                    <span className="text-content-muted">→</span>
                                    <span className="text-content">
                                      {projection.mean.toFixed(1)}
                                    </span>
                                    {projection.meanImprovementPct !== undefined && (
                                      <span
                                        className={`${projection.meanImprovementPct >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                      >
                                        ({projection.meanImprovementPct >= 0 ? '+' : ''}
                                        {Math.round(projection.meanImprovementPct)}% centered)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* StdDev comparison */}
                                <div className="flex items-center justify-between">
                                  <span className="text-content-secondary">σ:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-content-muted">
                                      {currentStats.stdDev.toFixed(2)}
                                    </span>
                                    <span className="text-content-muted">→</span>
                                    <span className="text-content">
                                      {projection.stdDev.toFixed(2)}
                                    </span>
                                    {projection.stdDevReductionPct !== undefined && (
                                      <span
                                        className={`${projection.stdDevReductionPct >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                      >
                                        ({projection.stdDevReductionPct >= 0 ? '-' : '+'}
                                        {Math.abs(Math.round(projection.stdDevReductionPct))}%)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Cpk comparison (only if specs available) */}
                                {currentStats.cpk !== undefined && projection.cpk !== undefined && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-content-secondary">Cpk:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-content-muted">
                                        {currentStats.cpk.toFixed(2)}
                                      </span>
                                      <span className="text-content-muted">→</span>
                                      <span
                                        className={`${projection.cpk >= 1.33 ? 'text-green-400' : projection.cpk >= 1.0 ? 'text-amber-400' : 'text-red-400'}`}
                                      >
                                        {projection.cpk.toFixed(2)}
                                      </span>
                                      {projection.cpkImprovementPct !== undefined && (
                                        <span
                                          className={`${projection.cpkImprovementPct >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                        >
                                          ({projection.cpkImprovementPct >= 0 ? '+' : ''}
                                          {Math.round(projection.cpkImprovementPct)}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Sample count */}
                                <div className="flex items-center justify-between text-content-muted">
                                  <span>Samples:</span>
                                  <span>
                                    {data.length} → {projection.remainingCount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Target line indicator */}
        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 border-t border-dashed border-amber-500/50" />
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <Target size={12} />
            <span>{targetPct}% Target</span>
          </div>
          <div className="flex-1 border-t border-dashed border-amber-500/50" />
        </div>

        {/* Cumulative summary */}
        <div
          className={`
            p-3 rounded-lg border
            ${meetsTarget ? 'bg-green-500/10 border-green-500/30' : 'bg-surface/50 border-edge'}
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-content-secondary">Combined Explained</span>
            <span
              className={`text-sm font-mono font-semibold ${meetsTarget ? 'text-green-400' : 'text-content'}`}
            >
              {Math.round(selectedStats.totalExplained)}%
            </span>
          </div>

          {/* Summary bar */}
          <div className="h-3 w-full bg-surface-tertiary/50 rounded-full overflow-hidden relative">
            {/* Target marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500/50 z-10"
              style={{ left: `${targetPct}%` }}
            />
            {/* Fill */}
            <div
              className={`h-full ${meetsTarget ? 'bg-green-500' : 'bg-blue-500'} rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(selectedStats.totalExplained, 100)}%` }}
            />
          </div>

          <p className="text-xs text-content-muted mt-2">
            {selectedFactors.size === 0
              ? 'Select factors above to calculate combined variation'
              : meetsTarget
                ? `These ${selectedFactors.size} factor${selectedFactors.size > 1 ? 's' : ''} explain ${Math.round(selectedStats.totalExplained)}% of your variation`
                : `Need ${Math.round(targetPct - selectedStats.totalExplained)}% more to reach target`}
          </p>
        </div>
      </div>

      {/* Footer with Apply button */}
      {onApplyFilters && selectedFactors.size > 0 && (
        <div className="px-4 py-3 border-t border-edge">
          <button
            onClick={handleApplyFilters}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter size={14} />
            Apply {selectedFactors.size} Filter{selectedFactors.size > 1 ? 's' : ''}
          </button>
          <p className="text-xs text-content-muted text-center mt-2">
            Filters to highest-impact values for selected factors
          </p>
        </div>
      )}
    </div>
  );
};

export default VariationFunnel;
