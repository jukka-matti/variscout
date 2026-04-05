/**
 * FRAME phase coaching — chart reading guidance and issue formulation.
 *
 * The analyst has just loaded data and is seeing charts for the first time.
 * CoScout helps them read what the charts show and name their concern.
 */

import type { AnalysisMode } from '../../../../types';

const MODE_FRAMING: Record<AnalysisMode, string> = {
  standard: `Chart reading guidance:
- I-Chart: Look for trends, shifts, or out-of-control points in the time series. Are there patterns, or is the process stable?
- Boxplot: Which factor levels show the widest spread or most extreme medians? This hints at where variation concentrates.
- Pareto: Which categories contribute most to variation? The top bars are the first suspects.
- Capability: Does the process meet specifications? A Cpk below 1.33 signals a gap between process and customer needs.

Help the analyst name what they are seeing. A good issue statement is specific:
- Bad: "Quality is poor"
- Good: "Fill weight Cpk is 0.85, below the 1.33 target — variation concentrates in the night shift"`,

  yamazumi: `Chart reading guidance:
- Yamazumi Chart: Which stacked bars exceed the takt time line? Those are bottleneck stations.
- I-Chart: Is total cycle time trending up or stable? Switch metric to Waste-only to see if waste is growing.
- Pareto: Which steps or activities contribute the most total time? Start with steps-total mode.
- Summary Bar: What is the VA ratio? Below 70% suggests significant waste opportunity.

Help the analyst name the concern in lean terms:
- Bad: "The line is slow"
- Good: "Station 3 exceeds takt by 12 seconds — 40% of its cycle is NVA Required (changeover)"`,

  performance: `Chart reading guidance:
- Performance Pareto: How many channels are critical (Cpk < 1.0) vs capable (>= 1.33)?
- Performance I-Chart: Are bad channels clustered or scattered? Clustering suggests a systematic root cause.
- Performance Boxplot: For the worst channels — is the problem centering (mean off-target) or spread (too much variation)?
- Performance Capability: Drill into the worst channel to see its histogram shape.

Help the analyst frame the concern around channel health:
- Bad: "Some channels are bad"
- Good: "3 of 12 fill heads show Cpk below 1.0 — all are on the left side of the machine"`,
};

/**
 * Build coaching instructions for the FRAME phase.
 *
 * FRAME is about first impressions — reading charts and formulating an issue statement.
 * The analyst has not yet drilled or filtered. CoScout should help them articulate
 * what they see and sharpen it into a clear concern.
 */
export function buildFrameCoaching(mode: AnalysisMode): string {
  return `## FRAME Phase Coaching
The analyst is in the FRAME phase — first look at the data. They have not started investigating yet.

${MODE_FRAMING[mode]}

Your role: Help the analyst read the charts and formulate a clear issue statement. Do not suggest drilling or filtering yet — that belongs in SCOUT. Focus on "What do the charts tell us?" and "What concern does this raise?"`;
}
