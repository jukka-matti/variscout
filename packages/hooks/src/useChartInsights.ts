/**
 * Hook to orchestrate per-chart deterministic insight + optional AI enhancement.
 *
 * Each chart type gets a deterministic insight computed synchronously from
 * statistical data. When AI is enabled and a fetchInsight function is provided,
 * the hook enhances the deterministic text with AI-generated context after a
 * 3-second debounce. Falls back gracefully to deterministic on AI failure.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type {
  InsightChartType,
  ChipType,
  DeterministicInsight,
  InsightAction,
  AIContext,
  ChartInsightData,
  NelsonRule2Sequence,
  NelsonRule3Sequence,
  StagedComparison,
} from '@variscout/core';
import {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
  buildStagedComparisonInsight,
  buildChartInsightPrompt,
} from '@variscout/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data needed for deterministic insight computation, varies by chart type */
export interface DeterministicData {
  // I-Chart
  nelsonSequences?: NelsonRule2Sequence[];
  nelsonRule3Sequences?: NelsonRule3Sequence[];
  outOfControlCount?: number;
  totalPoints?: number;
  // Boxplot
  factorVariations?: Map<string, number>;
  currentFactor?: string;
  nextDrillFactor?: string | null;
  // Pareto
  categoryContributions?: Map<string, number>;
  categoryCount?: number;
  paretoFactor?: string;
  // Stats
  cpk?: number;
  cp?: number;
  cpkTarget?: number;
  passRate?: number;
  hasSpecs?: boolean;
  // Staged comparison (for I-Chart insight when stages are active)
  stagedComparison?: StagedComparison;
}

export interface UseChartInsightsOptions {
  /** Which chart this insight is for */
  chartType: InsightChartType;
  /** Whether AI enhancement is enabled */
  aiEnabled: boolean;
  /** Current AI context (null when not available) */
  aiContext: AIContext | null;
  /** AI fetch function (injected by app -- Azure provides real impl, PWA passes undefined) */
  fetchInsight?: (userPrompt: string) => Promise<string>;
  /** Data for deterministic computation */
  deterministicData: DeterministicData;
  /** AI debounce delay in ms (default: 3000). Useful for testing. */
  aiDebounceMs?: number;
}

export interface UseChartInsightsReturn {
  /** The insight text to display (null = no chip) */
  chipText: string | null;
  /** Visual style */
  chipType: ChipType;
  /** Whether user dismissed this insight */
  isDismissed: boolean;
  /** Dismiss the current insight */
  dismiss: () => void;
  /** Whether AI is loading */
  isLoading: boolean;
  /** Whether the displayed text is AI-enhanced */
  isAI: boolean;
  /** Optional action for clickable insight chips */
  action: InsightAction | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Debounce delay before triggering AI fetch (ms) */
const AI_DEBOUNCE_MS = 3000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChartInsights({
  chartType,
  aiEnabled,
  aiContext,
  fetchInsight,
  deterministicData,
  aiDebounceMs = AI_DEBOUNCE_MS,
}: UseChartInsightsOptions): UseChartInsightsReturn {
  // -------------------------------------------------------------------------
  // Deterministic insight (synchronous)
  // -------------------------------------------------------------------------
  const deterministicInsight = useMemo((): DeterministicInsight | null => {
    switch (chartType) {
      case 'ichart': {
        // Staged comparison insight takes priority when stages are active
        if (deterministicData.stagedComparison) {
          const stagedInsight = buildStagedComparisonInsight(deterministicData.stagedComparison);
          if (stagedInsight) return stagedInsight;
        }
        return buildIChartInsight(
          deterministicData.nelsonSequences ?? [],
          deterministicData.outOfControlCount ?? 0,
          deterministicData.totalPoints ?? 0,
          deterministicData.nelsonRule3Sequences
        );
      }
      case 'boxplot':
        return buildBoxplotInsight(
          deterministicData.factorVariations ?? new Map(),
          deterministicData.currentFactor ?? '',
          deterministicData.nextDrillFactor ?? null
        );
      case 'pareto':
        return buildParetoInsight(
          deterministicData.categoryContributions ?? new Map(),
          deterministicData.categoryCount ?? 0,
          deterministicData.paretoFactor
        );
      case 'stats':
        return buildStatsInsight(
          deterministicData.cpk,
          deterministicData.cp,
          deterministicData.cpkTarget ?? 1.33,
          deterministicData.passRate,
          deterministicData.hasSpecs ?? false
        );
      default:
        return null;
    }
  }, [chartType, deterministicData]);

  // -------------------------------------------------------------------------
  // AI enhancement state
  // -------------------------------------------------------------------------
  const [aiText, setAiText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Dismiss tracking -- session-only, resets when insight changes
  // -------------------------------------------------------------------------
  const dismissedRef = useRef<Set<string>>(new Set());
  const [isDismissed, setIsDismissed] = useState(false);

  // Stable key for the current insight (used for dismiss tracking)
  const insightKey = deterministicInsight
    ? `${chartType}-${deterministicInsight.priority}-${deterministicInsight.chipType}`
    : null;

  // Reset dismiss state when the insight changes
  useEffect(() => {
    if (insightKey && !dismissedRef.current.has(insightKey)) {
      setIsDismissed(false);
    } else if (insightKey) {
      setIsDismissed(true);
    }
  }, [insightKey]);

  // -------------------------------------------------------------------------
  // AI enhancement -- debounced fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!aiEnabled || !fetchInsight || !deterministicInsight || !aiContext) {
      setAiText(null);
      setIsLoading(false);
      return;
    }

    // Reset AI text when deterministic insight changes
    setAiText(null);

    // Skip AI for low-priority insights (e.g. "Cpk meets target" — priority 1)
    // Saves an API call when the process is healthy and the insight is informational.
    if (deterministicInsight.priority <= 1) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const chartData: ChartInsightData = {
          chartType,
          deterministicInsight: deterministicInsight.text,
        };

        // Add chart-specific context fields
        if (chartType === 'ichart' && deterministicData.nelsonSequences !== undefined) {
          chartData.ichart = {
            nelsonRule2Count: deterministicData.nelsonSequences?.length ?? 0,
            nelsonRule3Count: deterministicData.nelsonRule3Sequences?.length ?? 0,
            outOfControlCount: deterministicData.outOfControlCount ?? 0,
            totalPoints: deterministicData.totalPoints ?? 0,
          };
        }
        if (chartType === 'boxplot' && deterministicData.currentFactor) {
          chartData.boxplot = {
            currentFactor: deterministicData.currentFactor,
            topCategories: [],
            nextDrillFactor: deterministicData.nextDrillFactor ?? undefined,
          };
        }
        if (chartType === 'pareto' && deterministicData.categoryContributions) {
          const sorted = [...deterministicData.categoryContributions.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          chartData.pareto = {
            topCategories: sorted.map(([name, pct]) => ({ name, variationPct: pct })),
            cumulativeTop2Pct: sorted.slice(0, 2).reduce((sum, [, pct]) => sum + pct, 0),
          };
        }
        if (chartType === 'stats') {
          chartData.stats = {
            cpk: deterministicData.cpk,
            cpkTarget: deterministicData.cpkTarget ?? 1.33,
            passRate: deterministicData.passRate,
          };
        }

        const userPrompt = buildChartInsightPrompt(aiContext, chartData);
        // The fetchInsight callback receives a prompt key and user prompt.
        // The AI service layer builds the actual system prompt internally.
        const result = await fetchInsight(userPrompt);
        setAiText(result);
      } catch {
        // Fall back to deterministic -- no error state for chips
        setAiText(null);
      } finally {
        setIsLoading(false);
      }
    }, aiDebounceMs);

    return () => clearTimeout(timer);
    // Using primitive deps from deterministicInsight to avoid refetching
    // when the same insight object reference changes but content is identical
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiEnabled,
    fetchInsight,
    deterministicInsight?.text,
    deterministicInsight?.priority,
    aiContext,
    chartType,
    aiDebounceMs,
  ]);

  // -------------------------------------------------------------------------
  // Dismiss callback
  // -------------------------------------------------------------------------
  const dismiss = useCallback(() => {
    if (insightKey) {
      dismissedRef.current.add(insightKey);
    }
    setIsDismissed(true);
  }, [insightKey]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    chipText: isDismissed ? null : (aiText ?? deterministicInsight?.text ?? null),
    chipType: deterministicInsight?.chipType ?? 'info',
    isDismissed,
    dismiss,
    isLoading: isLoading && !isDismissed,
    isAI: aiText !== null && !isDismissed,
    action: isDismissed ? null : (deterministicInsight?.action ?? null),
  };
}
