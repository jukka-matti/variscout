import React, { useMemo } from 'react';
import { ArrowLeft, Beaker } from 'lucide-react';
import {
  calculateStats,
  toNumericValue,
  type DataRow,
  type SpecLimits,
  type FindingProjection,
  type AnalysisMode,
  type BestSubsetResult,
  type ChannelResult,
} from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import type { YamazumiBarData } from '@variscout/core/yamazumi';
import type { ModelScope, WhatIfReference } from '@variscout/hooks';
import { WhatIfExplorer } from './WhatIfExplorer';
import { computePresets } from './computePresets';
import type { WhatIfProcessStats, WhatIfProjectionContext, SimulatorPreset } from './types';

// ============================================================================
// Types
// ============================================================================

/** Reference context for subset vs complement comparison */
export interface WhatIfExplorerReferenceContext {
  subsetLabel: string;
  subsetCount: number;
  subsetCpk?: number;
  referenceLabel: string;
  referenceCount: number;
  referenceCpk?: number;
}

export interface WhatIfExplorerPageProps {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Raw (unfiltered) data rows */
  rawData: DataRow[];
  /** Outcome variable name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;

  /** Callback to navigate back */
  onBack: () => void;
  /** Number of active filters */
  filterCount: number;
  /** Active filter descriptions */
  filterNames?: string[];

  /** Context for idea projection round-trip */
  projectionContext?: WhatIfProjectionContext;
  /** Save projection back to idea */
  onSaveProjection?: (projection: FindingProjection) => void;

  /** Reference context for subset vs reference stats */
  referenceContext?: WhatIfExplorerReferenceContext;

  /** Cpk target for color thresholds (default 1.33) */
  cpkTarget?: number;
  /** Active factor from boxplot (enables category-based presets) */
  activeFactor?: string | null;
  /** Analysis mode */
  mode?: AnalysisMode;

  /** Best subsets regression model */
  model?: BestSubsetResult;
  /** Available model scopes */
  availableScopes?: ModelScope[];
  /** Called when analyst switches model scope */
  onScopeChange?: (scope: ModelScope) => void;
  /** Reference points for benchmarking */
  references?: WhatIfReference[];

  /** Yamazumi mode: activities */
  leanActivities?: YamazumiBarData[];
  /** Yamazumi mode: takt time */
  leanTaktTime?: number;
  /** Yamazumi mode: best reference */
  leanBestReference?: { name: string; time: number };

  /** Performance mode: channel results */
  channels?: ChannelResult[];
  /** Performance mode: currently selected channel */
  selectedChannel?: string;

  /** Optional CSS class */
  className?: string;
}

// ============================================================================
// WhatIfExplorerPage
// ============================================================================

/**
 * Page-level wrapper that adds header chrome, context banners, and data
 * computation around the unified WhatIfExplorer component.
 *
 * Computes currentStats, complementStats, and presets from raw data,
 * then delegates all simulation rendering to WhatIfExplorer.
 */
export function WhatIfExplorerPage({
  filteredData,
  rawData,
  outcome,
  specs,
  onBack,
  filterCount,
  filterNames,
  projectionContext,
  onSaveProjection,
  referenceContext,
  cpkTarget: _cpkTarget,
  activeFactor,
  mode = 'standard',
  model,
  availableScopes,
  onScopeChange,
  references,
  leanActivities,
  leanTaktTime,
  leanBestReference,
  channels,
  selectedChannel,
  className,
}: WhatIfExplorerPageProps): React.ReactElement {
  const { formatStat } = useTranslation();

  // ── Current stats from filtered data ──────────────────────────────────
  const currentStats = useMemo((): WhatIfProcessStats | null => {
    if (!outcome || filteredData.length === 0) return null;

    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return null;
    const stats = calculateStats(values, specs.usl, specs.lsl);
    return {
      mean: stats.mean,
      stdDev: stats.stdDev,
      median: stats.median,
      cpk: stats.cpk,
      n: values.length,
    };
  }, [filteredData, outcome, specs]);

  // ── Complement stats (rawData minus filteredData) ─────────────────────
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

  // ── Smart presets ─────────────────────────────────────────────────────
  const presets = useMemo((): SimulatorPreset[] | undefined => {
    if (!currentStats || !outcome) return undefined;
    const result = computePresets(
      {
        mean: currentStats.mean,
        stdDev: currentStats.stdDev,
        median: currentStats.median ?? currentStats.mean,
      },
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

  // ── Lean mode detection ───────────────────────────────────────────────
  const isLeanMode = mode === 'yamazumi' && leanActivities != null && leanActivities.length > 0;

  // ── Empty state guard ─────────────────────────────────────────────────
  if (!isLeanMode && (!outcome || rawData.length === 0)) {
    return (
      <div className={`flex flex-col h-full bg-surface text-content ${className ?? ''}`}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-edge">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors"
            data-testid="whatif-back-btn"
          >
            <ArrowLeft size={18} className="text-content-secondary" />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-content">What-If Explorer</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-content-muted text-center">
            Load data and set specification limits first.
          </p>
        </div>
      </div>
    );
  }

  // ── Build explorer projection context ─────────────────────────────────
  const explorerContext: WhatIfProjectionContext | undefined = projectionContext
    ? {
        ideaText: projectionContext.ideaText,
        questionText: projectionContext.questionText,
        linkedFactor: projectionContext.linkedFactor,
        linkedFactorGap: projectionContext.linkedFactorGap,
      }
    : undefined;

  return (
    <div
      className={`flex flex-col h-full bg-surface text-content ${className ?? ''}`}
      data-testid="whatif-explorer-page"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors"
            title="Back to Dashboard"
            data-testid="whatif-back-btn"
          >
            <ArrowLeft size={18} className="text-content-secondary" />
          </button>
          <Beaker size={18} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-content">What-If Explorer</h1>
        </div>
        <div className="flex items-center flex-wrap gap-3 text-xs text-content-muted">
          <span data-testid="whatif-outcome-label">{outcome}</span>
          <span className="text-content-secondary" data-testid="whatif-sample-count">
            n = {filteredData.length}
          </span>
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
          className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/30"
          data-testid="projection-context-banner"
        >
          <div className="text-xs text-blue-400">
            <span className="font-medium">Projecting:</span>{' '}
            <span className="text-content-secondary">{projectionContext.ideaText}</span>
            {projectionContext.questionText && (
              <>
                <span className="text-content-muted"> for </span>
                <span className="text-content-secondary">{projectionContext.questionText}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reference context header */}
      {referenceContext && (
        <div
          className="px-4 py-2 border-b border-edge text-xs space-y-1"
          data-testid="reference-context-banner"
        >
          <div className="font-medium text-content-secondary">Context</div>
          <div className="flex justify-between gap-2">
            <div className="text-content-muted">
              <span className="font-medium">Problem:</span> {referenceContext.subsetLabel} (n=
              {referenceContext.subsetCount}
              {referenceContext.subsetCpk != null &&
                `, Cpk ${formatStat(referenceContext.subsetCpk, 2)}`}
              )
            </div>
            <div className="text-content-muted">
              <span className="font-medium">Reference:</span> {referenceContext.referenceLabel} (n=
              {referenceContext.referenceCount}
              {referenceContext.referenceCpk != null &&
                `, Cpk ${formatStat(referenceContext.referenceCpk, 2)}`}
              )
            </div>
          </div>
        </div>
      )}

      {/* Explorer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto">
          {currentStats ? (
            <WhatIfExplorer
              mode={mode}
              currentStats={currentStats}
              specs={specs}
              model={model}
              availableScopes={availableScopes}
              onScopeChange={onScopeChange}
              references={references}
              presets={presets}
              complementStats={complementStats}
              projectionContext={explorerContext}
              activities={leanActivities}
              taktTime={leanTaktTime}
              bestReference={leanBestReference}
              channels={channels}
              selectedChannel={selectedChannel}
              onSaveProjection={onSaveProjection}
            />
          ) : isLeanMode ? (
            <WhatIfExplorer
              mode={mode}
              currentStats={{ mean: 0, stdDev: 0 }}
              specs={specs}
              activities={leanActivities}
              taktTime={leanTaktTime}
              bestReference={leanBestReference}
              projectionContext={explorerContext}
              onSaveProjection={onSaveProjection}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
