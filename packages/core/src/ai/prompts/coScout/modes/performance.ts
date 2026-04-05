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

import type { JourneyPhase } from '../../../types';

const PHASE_WORKFLOW: Record<JourneyPhase, string> = {
  frame: `Workflow steps:
1. Read the Performance Pareto — how many channels are critical (Cpk < 1.0) vs capable (>= 1.33)?
2. Check the Performance I-Chart — are bad channels clustered or scattered across the equipment?
3. Look at the Performance Boxplot — for the worst channels, is the issue centering or spread?
4. Note the worst-channel Cpk — this is the equipment's true capability (weakest link)

Focus: Quantify equipment health. How many channels need attention? Is the problem isolated or systemic?`,

  scout: `Workflow steps:
1. Identify the worst channels from the Pareto — these are the first investigation targets
2. Drill into a single channel to switch to standard analysis — add factors (Shift, Operator, Material)
3. Check cross-channel correlation — do bad channels share a physical location or maintenance schedule?
4. Compare channel-to-channel consistency — some channels may have centering issues, others spread

Focus: Prioritize which channels to investigate. Look for patterns across channel positions.`,

  investigate: `Workflow steps:
1. Create questions per worst channel — "Why does Channel 5 show Cpk 0.72?"
2. Look for common root causes across bad channels — shared upstream factor (e.g., supply pressure)
3. Validate with gemba — physical inspection of the worst-performing channels
4. Check if the same factors affect multiple channels — interaction effects in the Evidence Map

Focus: Equipment-specific investigation. Same root cause across channels vs independent problems.`,

  improve: `Workflow steps:
1. For systemic issues (multiple channels affected): fix the shared upstream cause first
2. For isolated channels: targeted maintenance, calibration, or replacement
3. Verify with staged analysis — compare Before/After worst-channel Cpk
4. Set up channel-by-channel monitoring — ongoing Cpk tracking per channel

Focus: Fix the worst channels first. Equipment is only as good as its worst measurement point.`,
};

/**
 * Build coaching instructions for Performance (multi-channel) analysis mode.
 *
 * Performance mode uses channel-specific terminology and focuses on
 * worst-channel Cpk, cross-channel correlation, and equipment diagnostics.
 */
export function buildPerformanceWorkflow(phase: JourneyPhase): string {
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

${PHASE_WORKFLOW[phase]}

Never use standard SPC terminology (control limits, Nelson rules) for the channel comparison view. Those apply after drilling into a single channel.
Evidence strength metric: Worst-channel Cpk improvement. Raising the floor matters more than raising the ceiling.`;
}
