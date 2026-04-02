import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '@variscout/hooks';
import { ArrowLeft, Beaker, Save } from 'lucide-react';
import {
  calculateStats,
  toNumericValue,
  inferCharacteristicType,
  getCategoryStats,
  normalQuantile,
  normalCDF,
  type DataRow,
  type SpecLimits,
  type FindingProjection,
} from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import WhatIfSimulator from '../WhatIfSimulator/WhatIfSimulator';
import type {
  SimulatorPreset,
  WhatIfSimulatorColorScheme,
} from '../WhatIfSimulator/WhatIfSimulator';
/**
 * Color scheme for WhatIfPage
 */
export interface WhatIfPageColorScheme {
  /** Page background */
  pageBg: string;
  /** Page text color */
  pageText: string;
  /** Border color */
  border: string;
  /** Back button hover background */
  backHoverBg: string;
  /** Secondary text (back arrow, count) */
  secondaryText: string;
  /** Heading text */
  headingText: string;
  /** Muted text (outcome label, empty state) */
  mutedText: string;
}

export const whatIfPageDefaultColorScheme: WhatIfPageColorScheme = {
  pageBg: 'bg-surface',
  pageText: 'text-content',
  border: 'border-edge',
  backHoverBg: 'hover:bg-surface-tertiary',
  secondaryText: 'text-content-secondary',
  headingText: 'text-content',
  mutedText: 'text-content-muted',
};

/** Reference context for contextual preset labels and context header */
export interface WhatIfReferenceContext {
  /** Label for the problem subset (e.g., "Head 5-8") */
  subsetLabel: string;
  /** Number of rows in the problem subset */
  subsetCount: number;
  /** Cpk for the problem subset */
  subsetCpk?: number;
  /** Label for the reference subset (e.g., "Head 1-4") */
  referenceLabel: string;
  /** Number of rows in the reference subset */
  referenceCount: number;
  /** Cpk for the reference subset */
  referenceCpk?: number;
}

export interface WhatIfPageBaseProps {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Raw (unfiltered) data rows */
  rawData: DataRow[];
  /** Outcome variable name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Number of active filters */
  filterCount: number;
  /** Active filter descriptions (e.g., "Machine = A", "Shift = Day") */
  filterNames?: string[];
  /** Callback to navigate back */
  onBack: () => void;
  /** Color scheme for the page */
  colorScheme?: WhatIfPageColorScheme;
  /** Color scheme to pass to WhatIfSimulator */
  simulatorColorScheme?: WhatIfSimulatorColorScheme;
  /** Cpk target for color thresholds (default 1.33) */
  cpkTarget?: number;
  /** Active factor from boxplot (enables category-based presets) */
  activeFactor?: string | null;
  /** Context for idea→What-If round-trip (shows banner + save button) */
  projectionContext?: { ideaText: string; questionText: string };
  /** Save projection back to idea */
  onSaveProjection?: (projection: FindingProjection) => void;
  /** Reference context for subset vs reference stats and contextual presets */
  referenceContext?: WhatIfReferenceContext;
}

/**
 * Compute smart presets based on current stats, specs, and category data
 */
export function computePresets(
  currentStats: { mean: number; stdDev: number; median: number },
  specs: SpecLimits,
  filteredData: DataRow[],
  outcome: string,
  activeFactor?: string | null,
  fmt: (v: number, d?: number) => string = (v, d = 2) => formatStatistic(v, 'en', d),
  referenceLabel?: string
): SimulatorPreset[] {
  const presets: SimulatorPreset[] = [];
  const type = inferCharacteristicType(specs);

  // --- Spec-based presets (always available when specs set) ---

  // 1. Shift to target
  const target =
    specs.target ??
    (specs.usl !== undefined && specs.lsl !== undefined ? (specs.usl + specs.lsl) / 2 : undefined);

  if (target !== undefined) {
    const shift = target - currentStats.mean;
    if (Math.abs(shift) > currentStats.stdDev * 0.05) {
      presets.push({
        label: 'Shift to target',
        description: `Move mean to ${fmt(target, 1)} (shift ${shift >= 0 ? '+' : ''}${fmt(shift, 1)})`,
        meanShift: shift,
        variationReduction: 0,
        icon: 'target',
      });
    }
  }

  // 2. Shift to median (useful for skewed distributions)
  if (Math.abs(currentStats.median - currentStats.mean) > currentStats.stdDev * 0.1) {
    const shift = currentStats.median - currentStats.mean;
    presets.push({
      label: 'Shift to median',
      description: `Move mean to median ${fmt(currentStats.median, 1)} (corrects skew)`,
      meanShift: shift,
      variationReduction: 0,
    });
  }

  // 5. Reach 95% yield
  if (specs.usl !== undefined || specs.lsl !== undefined) {
    const z95 = normalQuantile(0.95); // ~1.645

    // Calculate current yield
    let currentYield = 100;
    if (currentStats.stdDev > 0) {
      if (specs.usl !== undefined && specs.lsl !== undefined) {
        currentYield =
          (normalCDF((specs.usl - currentStats.mean) / currentStats.stdDev) -
            normalCDF((specs.lsl - currentStats.mean) / currentStats.stdDev)) *
          100;
      } else if (specs.usl !== undefined) {
        currentYield = normalCDF((specs.usl - currentStats.mean) / currentStats.stdDev) * 100;
      } else if (specs.lsl !== undefined) {
        currentYield = (1 - normalCDF((specs.lsl - currentStats.mean) / currentStats.stdDev)) * 100;
      }
    }

    if (currentYield < 95 && currentStats.stdDev > 0) {
      let yieldShift = 0;
      let yieldReduction = 0;

      if (type === 'smaller' && specs.usl !== undefined) {
        // Shift mean down: need mean <= USL - z * sigma
        yieldShift = specs.usl - z95 * currentStats.stdDev - currentStats.mean;
        if (yieldShift > 0) {
          // Already centered enough, reduce spread instead
          const sigmaNeeded = (specs.usl - currentStats.mean) / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
          yieldShift = 0;
        }
      } else if (type === 'larger' && specs.lsl !== undefined) {
        // Shift mean up: need mean >= LSL + z * sigma
        yieldShift = specs.lsl + z95 * currentStats.stdDev - currentStats.mean;
        if (yieldShift < 0) {
          const sigmaNeeded = (currentStats.mean - specs.lsl) / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
          yieldShift = 0;
        }
      } else if (specs.usl !== undefined && specs.lsl !== undefined) {
        // Nominal: center first, then reduce spread if needed
        const midpoint = (specs.usl + specs.lsl) / 2;
        yieldShift = midpoint - currentStats.mean;
        // Check if centering achieves 95%
        const centeredYield =
          (normalCDF((specs.usl - midpoint) / currentStats.stdDev) -
            normalCDF((specs.lsl - midpoint) / currentStats.stdDev)) *
          100;
        if (centeredYield < 95) {
          // Also need spread reduction
          const halfRange = (specs.usl - specs.lsl) / 2;
          const sigmaNeeded = halfRange / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
        }
      }

      if (Math.abs(yieldShift) > 0.001 || yieldReduction > 0.001) {
        presets.push({
          label: 'Reach 95% yield',
          description: 'Minimum adjustment to achieve 95% in-spec yield',
          meanShift: yieldShift,
          variationReduction: Math.max(0, yieldReduction),
          icon: 'star',
        });
      }
    }
  }

  // --- Category-based presets (need activeFactor + category data) ---

  if (activeFactor && filteredData.length > 0) {
    const categoryStats = getCategoryStats(filteredData, activeFactor, outcome);

    if (categoryStats && categoryStats.length >= 2) {
      // 3. Match best category
      let bestCategory = categoryStats[0]; // sorted by contribution (highest first)
      if (type === 'smaller') {
        bestCategory = categoryStats.reduce((best, cat) => (cat.mean < best.mean ? cat : best));
      } else if (type === 'larger') {
        bestCategory = categoryStats.reduce((best, cat) => (cat.mean > best.mean ? cat : best));
      } else {
        // Nominal: closest to target
        const tgt =
          target ??
          (specs.usl !== undefined && specs.lsl !== undefined
            ? (specs.usl + specs.lsl) / 2
            : currentStats.mean);
        bestCategory = categoryStats.reduce((best, cat) =>
          Math.abs(cat.mean - tgt) < Math.abs(best.mean - tgt) ? cat : best
        );
      }

      const matchBestShift = bestCategory.mean - currentStats.mean;
      if (Math.abs(matchBestShift) > currentStats.stdDev * 0.05) {
        const bestLabel = referenceLabel ?? bestCategory.value;
        presets.push({
          label: `Match ${bestLabel} mean`,
          description: `Shift mean to match "${bestCategory.value}" (mean ${fmt(bestCategory.mean, 1)})`,
          meanShift: matchBestShift,
          variationReduction: 0,
        });
      }

      // 4. Tighten spread (match tightest category)
      const tightestCategory = categoryStats.reduce((best, cat) =>
        cat.stdDev < best.stdDev && cat.stdDev > 0 ? cat : best
      );
      if (tightestCategory.stdDev > 0 && tightestCategory.stdDev < currentStats.stdDev) {
        const reduction = Math.min(1 - tightestCategory.stdDev / currentStats.stdDev, 0.5);
        if (reduction > 0.02) {
          const tightenLabel = referenceLabel ?? tightestCategory.value;
          presets.push({
            label: `Match ${tightenLabel} spread`,
            description: `Reduce variation to match "${tightestCategory.value}" (sigma ${fmt(tightestCategory.stdDev)})`,
            meanShift: 0,
            variationReduction: reduction,
          });
        }
      }

      // 6. Best of both (combine match best + tighten spread)
      if (
        Math.abs(matchBestShift) > currentStats.stdDev * 0.05 &&
        tightestCategory.stdDev > 0 &&
        tightestCategory.stdDev < currentStats.stdDev
      ) {
        const reduction = Math.min(1 - tightestCategory.stdDev / currentStats.stdDev, 0.5);
        if (reduction > 0.02) {
          const bothLabel = referenceLabel ?? 'best';
          presets.push({
            label: `Match ${bothLabel} fully`,
            description: `Combine best mean ("${bestCategory.value}") + tightest spread ("${tightestCategory.value}")`,
            meanShift: matchBestShift,
            variationReduction: reduction,
            icon: 'star',
          });
        }
      }
    }
  }

  return presets;
}

const WhatIfPageBase: React.FC<WhatIfPageBaseProps> = ({
  filteredData,
  rawData,
  outcome,
  specs,
  filterCount,
  filterNames,
  onBack,
  colorScheme = whatIfPageDefaultColorScheme,
  simulatorColorScheme,
  cpkTarget,
  activeFactor,
  projectionContext,
  onSaveProjection,
  referenceContext,
}) => {
  const { formatStat } = useTranslation();
  const c = colorScheme;

  const currentStats = useMemo(() => {
    if (!outcome || filteredData.length === 0) return null;

    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return null;
    return calculateStats(values, specs.usl, specs.lsl);
  }, [filteredData, outcome, specs]);

  // Complement stats (rawData minus filteredData) for overall impact
  const complementStats = useMemo(() => {
    if (!outcome || filteredData.length === 0 || filteredData.length === rawData.length)
      return undefined;
    const filteredSet = new Set(filteredData);
    const complement = rawData.filter(row => !filteredSet.has(row));
    if (complement.length === 0) return undefined;
    const values = complement
      .map(row => toNumericValue(row[outcome]))
      .filter((v): v is number => v !== undefined);
    if (values.length < 2) return undefined;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance), count: values.length };
  }, [rawData, filteredData, outcome]);

  // Compute smart presets
  const presets = useMemo(() => {
    if (!currentStats || !outcome) return undefined;
    const result = computePresets(
      currentStats,
      specs,
      filteredData,
      outcome,
      activeFactor,
      formatStat,
      referenceContext?.referenceLabel
    );
    return result.length > 0 ? result : undefined;
  }, [
    currentStats,
    specs,
    filteredData,
    outcome,
    activeFactor,
    formatStat,
    referenceContext?.referenceLabel,
  ]);

  // Track simulation parameters for save-to-idea (must be before early return)
  const [simParams, setSimParams] = useState<{ meanShift: number; variationReduction: number }>({
    meanShift: 0,
    variationReduction: 0,
  });

  const handleSimulationChange = useCallback(
    (params: { meanShift: number; variationReduction: number }) => {
      setSimParams(params);
    },
    []
  );

  const handleSaveProjection = useCallback(() => {
    if (!onSaveProjection || !currentStats) return;
    const projectedMean = currentStats.mean + simParams.meanShift;
    const projectedSigma = currentStats.stdDev * (1 - simParams.variationReduction);

    let projectedCpk: number | undefined;
    let baselineCpk: number | undefined;
    if (specs.usl !== undefined && specs.lsl !== undefined && projectedSigma > 0) {
      projectedCpk = Math.min(
        (specs.usl - projectedMean) / (3 * projectedSigma),
        (projectedMean - specs.lsl) / (3 * projectedSigma)
      );
      if (currentStats.stdDev > 0) {
        baselineCpk = Math.min(
          (specs.usl - currentStats.mean) / (3 * currentStats.stdDev),
          (currentStats.mean - specs.lsl) / (3 * currentStats.stdDev)
        );
      }
    }

    const projection: FindingProjection = {
      baselineMean: currentStats.mean,
      baselineSigma: currentStats.stdDev,
      baselineCpk,
      projectedMean,
      projectedSigma,
      projectedCpk,
      meanDelta: simParams.meanShift,
      sigmaDelta: projectedSigma - currentStats.stdDev,
      simulationParams: {
        meanAdjustment: simParams.meanShift,
        variationReduction: simParams.variationReduction * 100,
      },
      createdAt: new Date().toISOString(),
    };
    onSaveProjection(projection);
  }, [onSaveProjection, currentStats, simParams, specs]);

  // Guard: no data or no outcome
  if (!outcome || rawData.length === 0) {
    return (
      <div className={`flex flex-col h-full ${c.pageBg} ${c.pageText}`}>
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${c.border}`}>
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg ${c.backHoverBg} transition-colors`}
          >
            <ArrowLeft size={18} className={c.secondaryText} />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className={`text-sm font-semibold ${c.headingText}`}>What-If Simulator</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className={`text-sm ${c.mutedText} text-center`}>
            Load data and set specification limits first.
          </p>
        </div>
      </div>
    );
  }

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  return (
    <div className={`flex flex-col h-full ${c.pageBg} ${c.pageText}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg ${c.backHoverBg} transition-colors`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} className={c.secondaryText} />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className={`text-sm font-semibold ${c.headingText}`}>What-If Simulator</h1>
        </div>
        <div className={`flex items-center flex-wrap gap-3 text-xs ${c.mutedText}`}>
          <span>{outcome}</span>
          <span className={c.secondaryText}>n = {filteredData.length}</span>
          {filterCount > 0 && (
            <span
              className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded"
              title={filterNames?.join(', ')}
            >
              {filterNames && filterNames.length > 0
                ? filterNames.join(', ')
                : `${filterCount} filter${filterCount !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>

      {/* Projection context banner */}
      {projectionContext && (
        <div
          className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/30 flex items-center justify-between gap-2"
          data-testid="projection-context-banner"
        >
          <div className="text-xs text-blue-400 flex-1 min-w-0">
            <span className="font-medium">Projecting:</span>{' '}
            <span className="text-content-secondary">{projectionContext.ideaText}</span>
            <span className="text-content-muted"> for </span>
            <span className="text-content-secondary">{projectionContext.questionText}</span>
          </div>
          {onSaveProjection && (
            <button
              onClick={handleSaveProjection}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-medium transition-colors flex-shrink-0"
              disabled={simParams.meanShift === 0 && simParams.variationReduction === 0}
              data-testid="save-projection-btn"
            >
              <Save size={12} />
              Save to idea
            </button>
          )}
        </div>
      )}

      {/* Reference context header */}
      {referenceContext && (
        <div className={`px-4 py-2 border-b ${c.border} text-xs space-y-1`}>
          <div className={`font-medium ${c.secondaryText}`}>Context</div>
          <div className="flex justify-between gap-2">
            <div className={c.mutedText}>
              <span className="font-medium">Problem:</span> {referenceContext.subsetLabel} (n=
              {referenceContext.subsetCount}
              {referenceContext.subsetCpk != null &&
                `, Cpk ${formatStat(referenceContext.subsetCpk, 2)}`}
              )
            </div>
            <div className={c.mutedText}>
              <span className="font-medium">Reference:</span> {referenceContext.referenceLabel} (n=
              {referenceContext.referenceCount}
              {referenceContext.referenceCpk != null &&
                `, Cpk ${formatStat(referenceContext.referenceCpk, 2)}`}
              )
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {!hasSpecs && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              Set specification limits (USL/LSL) to see Cpk and yield projections.
            </div>
          )}

          {currentStats && (
            <WhatIfSimulator
              currentStats={currentStats}
              specs={specs}
              defaultExpanded={true}
              presets={presets}
              colorScheme={simulatorColorScheme}
              cpkTarget={cpkTarget}
              complementStats={complementStats}
              subsetCount={filteredData.length}
              onSimulationChange={onSaveProjection ? handleSimulationChange : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfPageBase;
