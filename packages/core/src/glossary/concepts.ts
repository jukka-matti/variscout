/**
 * Methodology concepts for the VariScout knowledge model.
 *
 * Concepts define HOW VariScout approaches variation analysis — frameworks,
 * investigation phases, and guiding principles. They complement glossary terms
 * (which define WHAT — vocabulary/statistics).
 */

import type { Concept } from './types';

export const concepts: readonly Concept[] = [
  // ── Frameworks ──────────────────────────────────────────────────────────

  {
    id: 'fourLenses',
    label: 'Four Lenses',
    definition:
      'Four parallel views of the same data — Change, Flow, Failure, Value — each revealing a different aspect of process variation.',
    description:
      "VariScout's core analytical framework. Each chart maps to one lens: I-Chart (Change), Boxplot (Flow), Pareto (Failure), Capability (Value). The lenses are not sequential steps — apply them in any order. Linked filtering means drilling in one lens simultaneously updates all four.",
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'changeLens', type: 'contains' },
      { targetId: 'flowLens', type: 'contains' },
      { targetId: 'failureLens', type: 'contains' },
      { targetId: 'valueLens', type: 'contains' },
      { targetId: 'twoVoices', type: 'contrasts' },
    ],
  },
  {
    id: 'changeLens',
    label: 'Change Lens',
    definition: 'I-Chart view — reveals time-based shifts and trends. "What changed over time?"',
    description:
      'The Change Lens uses the Individuals Chart to detect process instability. Red points signal special cause variation — something unusual happened. Nelson Rule 2 (persistent shift) and Rule 3 (trend) add pattern sensitivity beyond simple limit violations.',
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'specialCause', type: 'uses' },
      { targetId: 'nelsonRule2', type: 'uses' },
      { targetId: 'nelsonRule3', type: 'uses' },
    ],
  },
  {
    id: 'flowLens',
    label: 'Flow Lens',
    definition:
      'Boxplot view — traces variation upstream through factors. "Where does variation come from?"',
    description:
      "The Flow Lens uses the Boxplot to stratify data by factor (machine, shift, operator) and quantify each factor's contribution to total variation via η². The natural entry point for progressive stratification — click a bar to drill down.",
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'stratification', type: 'uses' },
      { targetId: 'etaSquared', type: 'uses' },
    ],
  },
  {
    id: 'failureLens',
    label: 'Failure Lens',
    definition:
      'Pareto view — ranks categories by their contribution to variation. "Where do problems concentrate?"',
    description:
      'The Failure Lens uses the Pareto chart to show which categories within a factor contribute most to total variation. Applies the 80/20 principle — focus improvement on the vital few categories that drive the majority of variation.',
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [{ targetId: 'totalSSContribution', type: 'uses' }],
  },
  {
    id: 'valueLens',
    label: 'Value Lens',
    definition:
      'Capability view — compares process behavior to customer specifications. "Does this variation matter to the customer?"',
    description:
      'The Value Lens brings in an external reference — customer specification limits — to assess whether process variation actually impacts product quality. A factor may explain 40% of variation but Cpk may still be 1.5 — meaning specs are met despite the variation. Conversely, small variation with Cpk below 1.0 is the real priority.',
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'cp', type: 'uses' },
      { targetId: 'cpk', type: 'uses' },
      { targetId: 'passRate', type: 'uses' },
    ],
  },
  {
    id: 'twoVoices',
    label: 'Two Voices',
    definition:
      'The Voice of the Process (control limits) and Voice of the Customer (specification limits) — independent perspectives that must be compared.',
    description:
      'Control limits (UCL/LCL) describe what the process actually does. Specification limits (USL/LSL) describe what the customer needs. The two are independent — a process can be in-control but out-of-spec, or in-spec but unstable. The goal is control limits comfortably within spec limits.',
    conceptCategory: 'framework',
    learnMorePath: '/learn/two-voices',
    relations: [
      { targetId: 'ucl', type: 'uses' },
      { targetId: 'usl', type: 'uses' },
      { targetId: 'fourLenses', type: 'contrasts' },
    ],
  },

  // ── Principles ──────────────────────────────────────────────────────────

  {
    id: 'stabilityBeforeCapability',
    label: 'Stability Before Capability',
    definition:
      'Always assess process stability (Change Lens) before measuring capability (Value Lens). An unstable process produces meaningless Cpk.',
    description:
      'A cornerstone of variation analysis. Capability metrics (Cp, Cpk) assume a stable process — if special causes are present, the calculated capability is unreliable. The investigation sequence: first use the Change Lens to confirm stability, then the Value Lens to assess capability.',
    conceptCategory: 'principle',
    learnMorePath: '/learn/two-voices',
    relations: [
      { targetId: 'changeLens', type: 'uses' },
      { targetId: 'valueLens', type: 'uses' },
    ],
  },
  {
    id: 'progressiveStratification',
    label: 'Progressive Stratification',
    definition:
      'Sequential one-factor-at-a-time drill-down, guided by contribution %, that narrows the search for variation sources.',
    description:
      'The core investigation mechanism. At each step: (1) identify the highest-impact factor via the Boxplot, (2) filter to its most impactful level, (3) see how remaining factors redistribute. The cumulative variation bar shows progress toward explaining total variation. Analogous to binary search applied to a factor space.',
    conceptCategory: 'principle',
    learnMorePath: '/learn/progressive-stratification',
    relations: [
      { targetId: 'stratification', type: 'uses' },
      { targetId: 'flowLens', type: 'uses' },
    ],
  },
  {
    id: 'contributionNotCausation',
    label: 'Contribution, Not Causation',
    definition:
      'VariScout quantifies how much each factor contributes to variation — the "why" requires further investigation (5 Whys, Gemba walks).',
    description:
      'A key distinction: η² and Total SS contribution show WHERE variation concentrates, not WHY it happens. High contribution means "focus here" — not "this is the root cause." The analyst uses VariScout to find where to focus, then applies lean thinking to find the actual cause.',
    conceptCategory: 'principle',
    relations: [
      { targetId: 'etaSquared', type: 'uses' },
      { targetId: 'totalSSContribution', type: 'uses' },
    ],
  },

  // ── Investigation Phases ────────────────────────────────────────────────

  {
    id: 'phaseInitial',
    label: 'Initial Phase',
    definition:
      'Starting point — no hypotheses yet. Examine the Four Lenses to identify patterns and potential causes.',
    conceptCategory: 'phase',
    relations: [
      { targetId: 'fourLenses', type: 'uses' },
      { targetId: 'phaseDiverging', type: 'leads-to' },
    ],
  },
  {
    id: 'phaseDiverging',
    label: 'Diverging Phase',
    definition:
      'Exploring broadly — generating hypotheses across multiple factor categories. Cast a wide net before narrowing.',
    conceptCategory: 'phase',
    relations: [
      { targetId: 'stratification', type: 'uses' },
      { targetId: 'phaseValidating', type: 'leads-to' },
    ],
  },
  {
    id: 'phaseValidating',
    label: 'Validating Phase',
    definition:
      'Testing hypotheses against data, Gemba observations, or expert input. Supported, contradicted, or partial.',
    conceptCategory: 'phase',
    relations: [
      { targetId: 'etaSquared', type: 'uses' },
      { targetId: 'phaseConverging', type: 'leads-to' },
    ],
  },
  {
    id: 'phaseConverging',
    label: 'Converging Phase',
    definition:
      'Root causes identified. Brainstorm improvement ideas, compare effort vs impact, and select actions.',
    conceptCategory: 'phase',
    relations: [{ targetId: 'phaseActing', type: 'leads-to' }],
  },
  {
    id: 'phaseActing',
    label: 'Acting Phase',
    definition: 'Corrective actions underway. Monitor with the Value Lens — is Cpk improving?',
    conceptCategory: 'phase',
    relations: [
      { targetId: 'correctiveAction', type: 'uses' },
      { targetId: 'valueLens', type: 'uses' },
    ],
  },
];

/** Lookup map for O(1) concept access by ID */
export const conceptMap = new Map<string, Concept>(concepts.map(c => [c.id, c]));

/** Get a concept by ID */
export function getConcept(id: string): Concept | undefined {
  return conceptMap.get(id);
}
