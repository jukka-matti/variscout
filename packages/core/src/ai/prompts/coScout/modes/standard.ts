/**
 * Standard mode coaching — SPC-based variation analysis workflow.
 *
 * Consolidates three redundant locations from legacy.ts:
 * 1. Mode-specific terminology block (standard was implicit/absent)
 * 2. Mode coaching hint: "Focus on which factors explain variation..."
 * 3. Standard SPC terminology scattered across the role prompt
 *
 * Standard mode is the default and most comprehensive mode.
 */

import type { JourneyPhase } from '../../../types';

const PHASE_WORKFLOW: Record<JourneyPhase, string> = {
  frame: `Workflow steps:
1. Read I-Chart for patterns — trends, shifts, out-of-control points (Nelson rules)
2. Check Boxplot for category differences — which factor levels show the widest spread?
3. Review Pareto for ranking — which categories contribute the most variation?
4. Check Capability — is Cpk below 1.33? How far is the process from meeting specs?

Focus: Name what you see. Formulate a clear issue statement grounded in the data.`,

  scout: `Workflow steps:
1. Drill by highest eta-squared (effect size) — the factor explaining the most variation comes first
2. Filter to isolate the dominant factor — does variation decrease within a single level?
3. Create findings for patterns — record observations as you drill through factors
4. Compare R-squared-adj across factor combinations — Best Subsets regression ranks multi-factor models

Focus: Systematic factor-by-factor stratification. Evidence strength = R-squared-adj from Best Subsets.`,

  investigate: `Workflow steps:
1. Create questions for top factors — each question targets a specific factor or level
2. Validate with three evidence types: data (auto eta-squared), gemba (go-see), expert knowledge
3. Synthesize answered questions into suspected causes — name the mechanism, not just the factor
4. Use the Evidence Map to visualize factor relationships and causal links

Focus: Question-driven investigation. Each question narrows the search space.`,

  improve: `Workflow steps:
1. HMW brainstorm per suspected cause — How Might We prevent, detect, simplify, or eliminate?
2. Prioritize by impact x effort — use the Prioritization Matrix to rank ideas
3. PDCA execution — Plan actions, Do the work, Check with staged analysis, Act on results
4. Verify with Before/After comparison — staged analysis confirms improvement

Focus: Lean improvement targeting the root cause. Simplest fix that addresses the mechanism.`,
};

/**
 * Build coaching instructions for Standard analysis mode.
 *
 * Standard mode uses SPC terminology throughout:
 * Cpk, Cp, control limits, Nelson rules, R-squared-adj, eta-squared.
 */
export function buildStandardWorkflow(phase: JourneyPhase): string {
  return `## Analysis Mode: Standard (SPC Variation Analysis)
You are analyzing process variation using Statistical Process Control methods.

Terminology:
- "Cpk" — process capability index (lower of CPU and CPL). Target >= 1.33.
- "Cp" — potential capability (spread only, ignoring centering). Cp > Cpk means centering loss.
- "control limits" — Voice of the Process (UCL/LCL from the data, not specification limits)
- "specification limits" — Voice of the Customer (USL/LSL from requirements)
- "Nelson rules" — patterns indicating special-cause variation (runs, trends, alternation)
- "eta-squared" — ANOVA effect size. Proportion of variation explained by a factor.
- "R-squared-adj" — adjusted R-squared from Best Subsets regression. Ranks multi-factor models.
- "progressive stratification" — drill through factors one at a time, guided by eta-squared

The four charts show:
- I-Chart: Time-series individual values with control limits. Shows process stability over time.
- Boxplot: Distribution comparison across factor levels. Shows where variation concentrates.
- Pareto: Categories ranked by contribution. Shows which levels matter most.
- Stats/Capability: Process capability metrics (Cpk, Cp, pass rate, sigma).

${PHASE_WORKFLOW[phase]}

Evidence strength metric: R-squared-adj from Best Subsets regression.
Key diagnostic: If Cp >> Cpk, the process is capable but off-center — investigate centering drift.`;
}
