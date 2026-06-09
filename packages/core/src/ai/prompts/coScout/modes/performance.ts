/**
 * Performance mode coaching — multi-channel equipment analysis.
 *
 * Consolidates three redundant locations from legacy.ts:
 * 1. Long terminology block (lines 1250-1274): channel terminology, chart layout, workflow
 * 2. Mode coaching hint: "Focus on channel health..."
 * 3. Performance-specific chart descriptions
 *
 * Performance mode analyzes equipment with multiple measurement channels.
 */

import type { CoScoutScope, CoScoutSurface } from '../types';

const ANALYZE_WORKFLOW = `Workflow steps:
1. Create hypotheses per worst channel — "Why does Channel 5 show Cpk 0.72?"
2. Look for common contributions across bad channels — shared upstream factor (e.g., supply pressure)
3. Validate with gemba — physical inspection of the worst-performing channels
4. Check if the same factors affect multiple channels — interaction effects in the Evidence Map

Focus: Equipment-specific analysis. Same contribution across channels vs independent problems.`;

/**
 * Build coaching instructions for Performance (multi-channel) analysis mode.
 *
 * Performance mode uses channel-specific terminology and focuses on
 * worst-channel Cpk, cross-channel correlation, and equipment diagnostics.
 */
export function buildPerformanceWorkflow(surface: CoScoutSurface, _scope?: CoScoutScope): string {
  if (surface !== 'analyze') return '';

  return `## Analysis Mode: Multi-Channel Performance
You are analyzing equipment with multiple measurement channels (e.g., fill heads, cavities, spindles, lanes).
Each channel is an independent measurement point with its own Cpk.

Terminology:
- "channels" or "measures" — not "factors" or "categories"
- "worst-channel Cpk" — the key metric (equipment is only as good as its worst channel)
- "channel health" — critical (< 1.0), warning (1.0-1.33), capable (1.33-1.67), excellent (>= 1.67)
- "cross-channel correlation" — whether bad channels share physical location or upstream cause
- "channel position" — physical location on the equipment (left/right, top/bottom, slot number)

The four charts show:
- Performance Pareto: All channels ranked by Cpk, worst first. Start here to prioritize.
- Performance I-Chart: Cpk scatter across channels. Out-of-control points = systematically worse channels (not random).
- Performance Boxplot: Distribution comparison of worst 5. Shows centering vs spread per channel.
- Performance Capability: Single-channel histogram. Deep-dive on the selected channel.

${ANALYZE_WORKFLOW}

Never use standard SPC terminology (control limits, Nelson rules) for the channel comparison view. Those apply after drilling into a single channel.
Evidence strength metric: Worst-channel Cpk improvement. Raising the floor matters more than raising the ceiling.`;
}
