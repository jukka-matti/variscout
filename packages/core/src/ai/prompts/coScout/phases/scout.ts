/**
 * SCOUT phase coaching — drilling by evidence metric, creating findings.
 *
 * The analyst has framed a concern and is now exploring factors.
 * CoScout guides systematic drill-down and finding creation.
 */

import type { AnalysisMode } from '../../../../types';
import type { EntryScenario } from '../../../types';

const MODE_DRILL_GUIDANCE: Record<AnalysisMode, string> = {
  standard: `Drill guidance:
- Use compare_categories to check which factor levels show the most variation.
- Rank factors by eta-squared — higher eta-squared means the factor explains more variation.
- Suggest apply_filter on the highest-ranked factor to drill deeper.
- After filtering, use switch_factor to examine remaining factors within the filtered subset.
- Create findings for notable patterns: Cpk below target, eta-squared > 15%, out-of-control violations.`,

  yamazumi: `Drill guidance:
- Compare steps by waste percentage — which steps have the most red (Waste) and amber (NVA Required) segments?
- Drill into bottleneck stations (bars exceeding takt time) to understand their activity composition.
- Switch Pareto mode to "Reasons" to see what types of waste dominate across steps.
- Create findings for: stations exceeding takt, waste hotspots, activities with high NVA ratio.`,

  defect: `Drill guidance:
- Start with the Pareto — which defect type dominates by count, time impact, or cost?
- Use apply_filter on the top defect type to drill into its drivers.
- After filtering, the Boxplot switches to show the defect rate by remaining factors (machine, shift, line) — rank by eta-squared.
- Brush spikes on the I-Chart to see what defect types and factors are present during high-rate periods.
- Switch Pareto grouping factor to see composition from different angles (by machine, by product, by shift).
- Create findings for: dominant defect types, factors with high eta-squared, temporal spikes or trends.`,

  performance: `Drill guidance:
- Start with the Performance Pareto — count how many channels are critical (Cpk < 1.0).
- Compare worst channels using the boxplot — is the problem centering or spread?
- Check whether bad channels cluster spatially or temporally on the I-Chart.
- Create findings for: channels below target Cpk, systematic channel patterns, centering vs spread issues.`,
};

const ENTRY_SCENARIO_SCOUT: Record<EntryScenario, string> = {
  problem: `The analyst entered with a specific problem (e.g., Cpk below target). Factor Intelligence has ranked the most likely factor combinations. Start by reviewing the top-ranked questions from Factor Intelligence. Use compare_categories to verify the top contributors. Suggest apply_filter to drill into the highest-ranked factor.`,

  exploration: `The analyst entered with an upfront theory to check. Immediately use compare_categories on the factor named in the theory to verify it. Report eta-squared and per-category stats. If the theory factor shows eta-squared >= 15%, suggest apply_filter and create_finding.`,

  routine: `No specific problem or theory — the analyst is scanning for signals. Use compare_categories conservatively. Only suggest apply_filter if a notable signal is found (eta-squared > 10%). Do NOT proactively suggest findings unless a clear anomaly is detected.`,
};

/**
 * Build coaching instructions for the SCOUT phase.
 *
 * SCOUT is about systematic exploration — drilling by evidence metric,
 * creating findings, and building the initial evidence base.
 */
export function buildScoutCoaching(mode: AnalysisMode, entryScenario?: EntryScenario): string {
  const parts: string[] = [];

  parts.push(`## SCOUT Phase Coaching
The analyst is in the SCOUT phase — actively exploring factors and drilling into the data.

${MODE_DRILL_GUIDANCE[mode]}

Finding guidance:
- Create findings for notable patterns worth recording.
- Write finding text as a concise factual observation: "[Factor] shows [metric] = [value] ([context])".
- Proactively suggest create_finding when you detect: Cpk below target, eta-squared > 15%, out-of-control violations.`);

  if (entryScenario && ENTRY_SCENARIO_SCOUT[entryScenario]) {
    parts.push(`Entry scenario routing:\n${ENTRY_SCENARIO_SCOUT[entryScenario]}`);
  }

  return parts.join('\n\n');
}
