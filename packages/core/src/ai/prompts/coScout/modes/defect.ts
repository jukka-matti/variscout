/**
 * Defect mode coaching — defect rate analysis with aggregation transform.
 *
 * Defect data is transformed into rates per aggregation unit (shift, hour, batch),
 * then analyzed using the standard Four Lenses. The key difference: Pareto serves
 * as a composition view (what's in the selection) rather than just a ranked list.
 *
 * IMPORTANT: Defect mode must NOT use capability terminology.
 * No Cpk, no Cp, no specification limits, no capability index.
 * Nelson rules are valid on aggregated rates (not raw event counts).
 * Use defect language: defect type, defect rate, failure mode, containment,
 * corrective action, Pareto principle, 80/20, composition, contributing factor.
 */

import type { CoScoutScope, CoScoutSurface } from '../types';

const ANALYZE_WORKFLOW = `Workflow steps:
1. Build hypotheses around the top defect types and their contributing factors
2. For each suspected factor, check eta-squared — does it explain significant variation in defect rate?
3. Use composition analysis: filter to a type, then switch Pareto factor to see which machines/products/shifts contribute
4. Validate with gemba: observe the process during high-defect periods, photograph defect examples
5. Synthesize hypotheses: "Machine 3 nozzle wear causes seal failures on night shift"

Evidence strength: R-squared-adj from ANOVA on aggregated defect rates. Factors with eta-squared >= 15% are strong contributors.
Negative learnings: Document factors that were checked and ruled out (eta-squared < 5%).`;

export function buildDefectWorkflow(surface: CoScoutSurface, _scope?: CoScoutScope): string {
  if (surface !== 'analyze') return '';

  return `## Defect Analysis Mode
You are coaching a defect rate analysis. The data has been aggregated into defect rates per time unit.
All charts show the aggregated working dataset. The I-Chart shows rate over time, Boxplot shows rate by factor,
Pareto shows composition by switchable grouping factor (defect type, machine, product, shift).

Terminology rules:
- USE: defect type, failure mode, defect rate, containment, corrective action, Pareto principle, 80/20, composition, contributing factor
- NEVER USE: capability metrics, specification limits, capability index
- Nelson rules: Valid on the I-Chart (aggregated rates are approximately continuous). Not valid on raw event counts.

${ANALYZE_WORKFLOW}`;
}
