/**
 * IMPROVE phase coaching — HMW brainstorm, PDCA execution, staged verification.
 *
 * The analyst has identified suspected causes and is now improving the process.
 * CoScout coaches through the PDCA cycle: Plan, Do, Check, Act.
 */

import type { AnalysisMode } from '../../../../types';
import type { EntryScenario } from '../../../types';

const MODE_IMPROVE_GUIDANCE: Record<AnalysisMode, string> = {
  standard: `Improvement focus:
- Target improvements at the suspected causes identified from answered questions.
- Use R-squared-adj contribution to prioritize which causes to address first.
- Prefer lean improvements — the simplest fix that addresses the root cause.
- After improvement, verify using staged analysis: compare before/after Cpk and variation ratio.`,

  yamazumi: `Improvement focus:
- Target waste elimination at bottleneck stations — stations exceeding takt time.
- Prioritize by waste contribution: eliminate pure waste first, then reduce NVA Required activities.
- Lean improvement directions: eliminate the activity, combine with adjacent step, simplify the procedure, automate.
- After kaizen, verify using staged analysis: compare before/after VA ratio and takt compliance.`,

  performance: `Improvement focus:
- Target worst-performing channels — prioritize by Cpk gap to target.
- Check whether multiple bad channels share a root cause (position, maintenance, operating conditions).
- After fixing channels, verify using staged analysis: compare before/after worst-channel Cpk.
- If the problem is centering (mean off-target), the fix is different from spread (too much variation).`,
};

/**
 * Build coaching instructions for the IMPROVE phase.
 *
 * IMPROVE follows the PDCA cycle. CoScout adapts guidance based on
 * the current PDCA sub-state (Plan/Do/Check/Act) and whether
 * staged verification data is available.
 */
export function buildImproveCoaching(mode: AnalysisMode, entryScenario?: EntryScenario): string {
  const parts: string[] = [];

  parts.push(`## IMPROVE Phase Coaching
The analyst is in the IMPROVE phase — executing improvements and verifying outcomes.

${MODE_IMPROVE_GUIDANCE[mode]}`);

  // HMW brainstorm coaching
  parts.push(`HMW brainstorm coaching:
- Use suggest_improvement_idea when a question is answered and the analyst needs ideas for what to try.
- Classify each idea using the Four Ideation Directions:
  - prevent: stop the cause from occurring (poka-yoke, maintenance schedule, SOP update)
  - detect: catch it sooner before defects (sensor, alarm, control chart alert)
  - simplify: reduce complexity to reduce error opportunities (fewer steps, visual guides)
  - eliminate: remove the step or factor entirely (automate, redesign)
- Suggest just-do and days timeframe ideas first — lean improvements over capital projects.
- If Knowledge Base search reveals a past fix for a similar cause, suggest it with the source cited.`);

  // PDCA execution coaching
  parts.push(`PDCA execution coaching:
- PLAN (no actions yet): Help brainstorm improvement ideas. Search Knowledge Base for similar past fixes. Convert selected ideas into executable action items with clear owners and deadlines.
- DO (actions in progress): Track progress, flag overdue items. Do NOT suggest new actions unless asked. Acknowledge progress: "N of M actions complete."
- CHECK (staged comparison data available): Interpret staged deltas quantitatively:
  - Cpk delta > 0 AND Cpk after >= target: strong evidence of improvement
  - Cpk delta > 0 BUT Cpk after < target: partial improvement, more work needed
  - Variation ratio < 0.8: meaningful variation reduction
  - Variation ratio > 1.0: variation INCREASED — flag as concern
  - Recommend compare_categories on the addressed factor to verify IT specifically improved.
- ACT (all actions complete): Propose outcome assessment:
  - Effective: Cpk after >= target AND variation ratio < 1.0 — suggest sustaining controls (update SOPs, set control chart limits, schedule 30-day follow-up)
  - Partial: Cpk improved but still below target — suggest which factors to re-investigate
  - Not effective: Cpk unchanged or degraded — suggest whether the root cause was actually addressed`);

  // Action tracking
  parts.push(`Action tracking:
- Write action text as a clear, executable task: "[Verb] [what] [where/when] — [rationale or source]".
- suggest_action only works on findings at "analyzed" or "improving" status.
- If overdue actions exist, flag them. Suggest notify_action_owners (Team plan) if actions have assignees but are not progressing.
- For effective outcomes, suggest sustaining controls — update SOPs, set control chart limits, schedule follow-up.`);

  // Entry scenario routing for IMPROVE
  if (entryScenario === 'problem') {
    parts.push(
      `Entry scenario (problem): Check whether Cpk has reached the original target. In CHECK, compare before/after Cpk against the stated problem threshold. In ACT, assess whether the original problem is resolved.`
    );
  } else if (entryScenario === 'exploration') {
    parts.push(
      `Entry scenario (exploration): Compare before/after on the metric linked to the original theory. Search KB for fixes to the confirmed factor. Verify whether the theory-specific metric improved.`
    );
  } else if (entryScenario === 'routine') {
    parts.push(
      `Entry scenario (routine): Signal has been addressed — help evaluate whether sustaining controls prevent recurrence. Suggest preventive actions and SOP updates. Recommend scheduling a follow-up check in 30 days.`
    );
  }

  return parts.join('\n\n');
}
