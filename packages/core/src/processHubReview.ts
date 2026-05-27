import type {
  ProcessHubAttentionReason,
  ProcessHubAnalyze,
  ProcessHubReadinessReason,
  ProcessHubReviewItem,
} from './processHub';

/**
 * Construct a canonical ProcessHubReviewItem with all fields populated.
 *
 * Lives in a leaf module so both processHub.ts and control.ts can
 * value-import it without creating a runtime cycle. The type imports
 * back to processHub.ts above are erased at compile time.
 */
export function buildReviewItem<TAnalyze extends ProcessHubAnalyze>(
  analyze: TAnalyze,
  reasons: ProcessHubAttentionReason[],
  readinessReasons: ProcessHubReadinessReason[] = []
): ProcessHubReviewItem<TAnalyze> {
  const signal = analyze.metadata?.reviewSignal;
  const cpk = signal?.capability?.cpk;
  const target = signal?.capability?.cpkTarget;
  let cpkGap: number | undefined;
  if (cpk !== undefined && target !== undefined) {
    const gap = target - cpk;
    cpkGap = gap > 0 ? Math.round(gap * 100) / 100 : undefined;
  }

  return {
    analyze,
    reasons,
    changeSignalCount: signal?.changeSignals.total ?? 0,
    cpkGap,
    topFocusVariationPct: signal?.topFocus?.variationPct,
    overdueActionCount: analyze.metadata?.actionCounts?.overdue ?? 0,
    nextMove: analyze.metadata?.nextMove,
    readinessReasons,
  };
}
