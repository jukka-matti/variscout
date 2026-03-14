/**
 * useAIContext - Assembles AI context from current analysis state.
 * Memoized to avoid excessive recomputation.
 */

import { useMemo } from 'react';
import { buildAIContext } from '@variscout/core';
import type { AIContext, ProcessContext, FactorRole, BuildAIContextOptions } from '@variscout/core';
import type { StatsResult, SpecLimits, Finding } from '@variscout/core';

export interface UseAIContextOptions {
  /** Whether AI is enabled */
  enabled: boolean;
  /** Process context from user settings */
  process?: ProcessContext;
  /** Current stats */
  stats?: StatsResult;
  /** Number of samples in current filtered dataset */
  sampleCount?: number;
  /** Current spec limits */
  specs?: SpecLimits;
  /** Active filters */
  filters?: Record<string, (string | number)[]>;
  /** Inferred factor roles */
  factorRoles?: Record<string, FactorRole>;
  /** Control/spec violations */
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
    nelsonRule2Count?: number;
    nelsonRule3Count?: number;
  };
  /** Current findings */
  findings?: Finding[];
}

export interface UseAIContextReturn {
  /** The assembled AI context, or null if AI is disabled */
  context: AIContext | null;
}

/**
 * Assembles a structured AI context from current analysis state.
 * Returns null when AI is disabled.
 */
export function useAIContext(options: UseAIContextOptions): UseAIContextReturn {
  const { enabled, process, stats, sampleCount, filters, factorRoles, violations, findings } =
    options;

  const context = useMemo<AIContext | null>(() => {
    if (!enabled) return null;

    const buildOptions: BuildAIContextOptions = {
      process,
      filters,
      factorRoles,
      violations,
      findings,
    };

    // Map StatsResult to AIStatsInput
    if (stats) {
      buildOptions.stats = {
        mean: stats.mean,
        stdDev: stats.stdDev,
        count: sampleCount ?? 0,
        cp: stats.cp,
        cpk: stats.cpk,
        outOfSpecPercentage: stats.outOfSpecPercentage,
      };
    }

    return buildAIContext(buildOptions);
  }, [enabled, process, stats, sampleCount, filters, factorRoles, violations, findings]);

  return { context };
}
