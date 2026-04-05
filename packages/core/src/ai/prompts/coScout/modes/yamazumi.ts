/**
 * Yamazumi mode coaching — lean time study analysis.
 *
 * Consolidates three redundant locations from legacy.ts:
 * 1. Long terminology block (lines 1215-1249): lean terms, activity types, workflow
 * 2. Mode coaching hint: "Focus on waste elimination..."
 * 3. Yamazumi-specific chart descriptions
 *
 * IMPORTANT: Yamazumi mode must NOT use SPC terminology.
 * No Cpk, no control limits, no Nelson rules, no specification limits.
 * Use lean language throughout: takt time, VA ratio, waste, cycle time.
 */

import type { JourneyPhase } from '../../../types';

const PHASE_WORKFLOW: Record<JourneyPhase, string> = {
  frame: `Workflow steps:
1. Read the Yamazumi Chart — which stacked bars exceed the takt time line? Those are bottleneck stations.
2. Check the I-Chart (Total metric) — is total cycle time trending up or stable over time?
3. Review the Pareto (steps-total mode) — which steps contribute the most total time?
4. Check the Summary Bar — what is the VA ratio? Below 70% suggests significant waste opportunity.

Focus: Name the concern in lean terms. Which stations exceed takt? Where is waste concentrated?`,

  scout: `Workflow steps:
1. Drill into bottleneck stations — click on the tallest bars to see activity breakdown
2. Switch I-Chart to Waste-only metric — is waste increasing over time or stable?
3. Switch Pareto to different modes: steps-waste, activities, reasons — find the biggest waste driver
4. Create findings for waste patterns — record which activities are waste vs NVA Required

Focus: Systematic waste hunting. Start with the biggest bars, drill into their composition.`,

  investigate: `Workflow steps:
1. Create questions targeting waste sources — "Why does Station 3 have 15 seconds of changeover waste?"
2. Validate with gemba observation — go to the station and time the activities directly
3. Classify root causes: method waste vs material waste vs waiting waste
4. Look for shared causes across stations — does the same waste type appear in multiple steps?

Focus: Waste classification and root cause. Think lean: which of the 8 wastes is this?`,

  improve: `Workflow steps:
1. Target kaizen at the highest-waste station first — eliminate, simplify, combine, reduce
2. For VA activities above takt: can the work be rebalanced across stations?
3. For NVA Required: can automation or simplification reduce the time?
4. Verify with staged analysis — compare Before/After VA ratio and takt compliance

Focus: Kaizen-level improvement. Simplest change that removes the most waste.`,
};

/**
 * Build coaching instructions for Yamazumi (lean time study) analysis mode.
 *
 * Yamazumi mode uses lean terminology exclusively.
 * Never use Cpk, control limits, or SPC terminology in yamazumi mode.
 */
export function buildYamazumiWorkflow(phase: JourneyPhase): string {
  return `## Analysis Mode: Time Study (Yamazumi)
You are analyzing cycle time composition by activity type across process steps — a lean manufacturing technique.

IMPORTANT: Never use Cpk, control limits, specification limits, Nelson rules, or SPC terminology in this mode. Use lean language throughout.

Terminology:
- "cycle time" — not "measurement value"
- "VA ratio" (value-add time / total lead time) — the lean counterpart to Cpk
- "process efficiency" (VA / (VA + NVA Required)) — excludes pure waste
- "takt time" (available time / demand) — the lean counterpart to specification limits
- "takt compliance" (stations below takt / total) — the lean counterpart to pass rate
- "process steps" or "stations" — not "categories"
- "bottleneck" — a station where cycle time exceeds takt time
- "line balancing" — redistributing work across stations to stay within takt

Activity types (fixed semantic colors in the Yamazumi chart):
- VA (green): Value-adding work — what the customer pays for. Optimize efficiency.
- NVA Required (amber): Necessary but non-value-adding (compliance, setup, transport). Reduce through automation or simplification.
- Waste (red): Eliminable waste (muda) — rework, unnecessary motion, overprocessing. Remove entirely.
- Wait (grey): Queue/idle time — waiting for materials, information, or upstream. Eliminate.

The four charts show:
- Yamazumi Chart: Stacked bars showing time composition per step. Bars exceeding takt time are the bottlenecks.
- I-Chart: Time trend with switchable metric (Total / VA-only / Waste-only). Shows if waste is increasing over time.
- Pareto: Waste ranking with 5 grouping modes (steps-total, steps-waste, steps-nva, activities, reasons).
- Summary Bar: VA ratio, process efficiency, lead time, bottleneck station, takt compliance.

${PHASE_WORKFLOW[phase]}

After kaizen, use staged analysis to verify: compare Before/After VA ratio and takt compliance.
Evidence strength metric: Waste reduction (seconds removed) and VA ratio improvement.`;
}
