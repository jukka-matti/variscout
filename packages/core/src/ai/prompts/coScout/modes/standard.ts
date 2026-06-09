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

import type { CoScoutScope, CoScoutSurface } from '../types';

const ANALYZE_WORKFLOW = `Workflow steps:
1. Open a line of inquiry for each top factor — target a specific factor or level
2. Validate with three evidence types: data (auto eta-squared), gemba (go-see), expert knowledge
3. Synthesize validated evidence into hypotheses — name the mechanism, not just the factor
4. Use the Evidence Map to visualize factor relationships and causal links

Focus: Evidence-driven analysis. Each line of inquiry narrows the search space.`;

/**
 * Build coaching instructions for Standard analysis mode.
 *
 * Standard mode uses SPC terminology throughout:
 * Cpk, Cp, control limits, Nelson rules, R-squared-adj, eta-squared.
 */
export function buildStandardWorkflow(surface: CoScoutSurface, _scope?: CoScoutScope): string {
  if (surface !== 'analyze') return '';

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

${ANALYZE_WORKFLOW}

Evidence strength metric: R-squared-adj from Best Subsets regression.
Key diagnostic: If Cp >> Cpk, the process is capable but off-center — investigate centering drift.`;
}
