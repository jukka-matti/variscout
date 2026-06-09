/**
 * Capability mode coaching — centering vs spread diagnostics.
 *
 * Consolidates three redundant locations from legacy.ts:
 * 1. capabilityStability section (lines 1174-1208) — subgroup stability analysis
 * 2. Mode coaching hint: "Frame questions around Cpk impact..."
 * 3. Capability-specific terminology (implicit in standard mode)
 *
 * Capability mode extends standard SPC with subgroup-level capability tracking.
 */

import type { CoScoutScope, CoScoutSurface } from '../types';

const ANALYZE_WORKFLOW = `Workflow steps:
1. Create hypotheses targeting factors that affect Cpk — "Does Machine X explain the centering shift?"
2. Distinguish centering vs spread in each question — they have different contributing mechanisms
3. Validate with subgroup data — which subgroups meet the Cpk target and which do not?
4. Look for interaction effects — does the centering problem depend on another factor?

Focus: Separate centering drift (mean shift) from spread increase (inconsistency). They need different fixes.`;

/**
 * Build coaching instructions for Capability analysis mode.
 *
 * Capability mode focuses on centering vs spread diagnostics,
 * Cpk vs Cp interpretation, and subgroup stability analysis.
 */
export function buildCapabilityWorkflow(surface: CoScoutSurface, _scope?: CoScoutScope): string {
  if (surface !== 'analyze') return '';

  return `## Analysis Mode: Capability (Centering vs Spread Diagnostics)
You are analyzing process capability — whether the process meets customer specifications consistently.

Terminology:
- "Cpk" — realized capability. Accounts for both centering and spread. Target >= 1.33.
- "Cp" — potential capability. Measures spread only, assuming perfect centering.
- "centering loss" — gap between Cp and Cpk. Caused by mean being off-target.
- "subgroup Cpk" — capability calculated per subgroup (batch, shift, time period).
- "Cpk stability" — whether subgroup Cpk values are in statistical control.
- "Cpk target line" — horizontal reference at the desired Cpk level (typically 1.33).

Centering vs spread diagnostics:
- Cp high, Cpk low: Process spread is fine, but the mean is off-center. Fix: recenter.
- Cp low, Cpk low: Process has too much variation. Fix: reduce spread first.
- Cpk varies across subgroups: Capability is unstable — investigate WHICH subgroups and WHEN.
- All subgroups in control: Overall Cpk is representative. Capability is stable.
- Subgroups out of control: Capability is shifting. Look for assignable causes.

When to investigate shifts vs consistency:
- Sudden Cpk drops in specific subgroups: investigate what changed (material lot, operator, setup)
- Gradual Cpk decline: investigate wear, drift, or environmental changes
- Random Cpk variation: investigate within-subgroup consistency (operator technique, measurement)

${ANALYZE_WORKFLOW}

Evidence strength metric: Cpk improvement per factor level. A factor that moves Cpk from 0.8 to 1.4 is more impactful than one that moves it from 1.3 to 1.35.`;
}
