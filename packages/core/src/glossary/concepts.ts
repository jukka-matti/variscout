/**
 * Methodology concepts for the VariScout knowledge model.
 *
 * Concepts define HOW VariScout approaches variation analysis — frameworks,
 * investigation phases, and guiding principles. They complement glossary terms
 * (which define WHAT — vocabulary/statistics).
 *
 * Grounded in Watson's EDA methodology (Turtiainen, 2019) with three
 * VariScout-original contributions: parallel views, progressive stratification,
 * and hypothesis investigation.
 */

import type { Concept } from './types';

export const concepts: readonly Concept[] = [
  // ── Frameworks ──────────────────────────────────────────────────────────

  {
    id: 'fourLenses',
    label: 'Four Lenses',
    definition:
      'Teaching shorthand for "four tools, four questions" — I-Chart, Boxplot, Pareto, Capability. A communication aid, not a methodology.',
    description:
      'The Four Lenses label maps Watson\'s four analytical tools to memorable question types: I-Chart ("What changed?"), Boxplot ("Where does variation come from?"), Pareto ("Where do problems concentrate?"), Capability ("Does it meet specs?"). The tools are standard quality instruments — the "lens" metaphor is a pedagogical layer.',
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'iChart', type: 'uses' },
      { targetId: 'boxplot', type: 'uses' },
      { targetId: 'paretoChart', type: 'uses' },
      { targetId: 'capabilityAnalysis', type: 'uses' },
      { targetId: 'twoVoices', type: 'contrasts' },
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
  {
    id: 'parallelViews',
    label: 'Parallel Views',
    definition:
      'All analytical tools visible simultaneously with linked filtering — drill in one chart, all charts update.',
    description:
      "VariScout's distinguishing design: the I-Chart, Boxplot, Pareto, and Capability are shown together on a single dashboard. Clicking a category in the Boxplot simultaneously updates all other charts. This is how VariScout differs from sequential tool usage — the analyst sees every perspective at once and the charts form a coordinated investigation team.",
    conceptCategory: 'framework',
    learnMorePath: '/learn/four-lenses',
    relations: [
      { targetId: 'fourLenses', type: 'uses' },
      { targetId: 'iChart', type: 'uses' },
      { targetId: 'boxplot', type: 'uses' },
    ],
  },

  // ── Principles ──────────────────────────────────────────────────────────

  {
    id: 'progressiveStratification',
    label: 'Progressive Stratification',
    definition:
      'Sequential one-factor-at-a-time drill-down, guided by contribution %, that narrows the search for variation sources.',
    description:
      "VariScout's core drill-down mechanism. At each step: (1) identify the highest-impact factor via the Boxplot and Pareto, (2) filter to its most impactful level, (3) see how remaining factors redistribute. The cumulative variation bar shows progress toward explaining total variation. Analogous to binary search applied to a factor space.",
    conceptCategory: 'principle',
    learnMorePath: '/learn/progressive-stratification',
    relations: [
      { targetId: 'stratification', type: 'uses' },
      { targetId: 'totalSSContribution', type: 'uses' },
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
  {
    id: 'iterativeExploration',
    label: 'Iterative Exploration',
    definition:
      'Each analysis cycle reveals new questions. A finding triggers a sub-hypothesis, which may need new data or a Gemba visit.',
    description:
      "EDA is inherently iterative. VariScout's investigation workflow formalizes this: findings spawn hypotheses, hypotheses require validation (data, Gemba, expert), validation results spawn new questions. The loop continues until the solution space is bounded and actionable improvements are identified.",
    conceptCategory: 'principle',
    relations: [
      { targetId: 'hypothesis', type: 'uses' },
      { targetId: 'finding', type: 'uses' },
    ],
  },

  // ── Investigation Phases ────────────────────────────────────────────────

  {
    id: 'phaseInitial',
    label: 'Initial Phase',
    definition:
      'Starting point — no hypotheses yet. Examine the charts to identify patterns and potential causes.',
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
      'Suspected root cause identified. Brainstorm improvement ideas, compare effort vs impact, and select actions.',
    conceptCategory: 'phase',
    relations: [{ targetId: 'phaseImproving', type: 'leads-to' }],
  },
  {
    id: 'phaseImproving',
    label: 'Improvement Phase (PDCA)',
    definition:
      'IMPROVE phase: corrective actions underway (PDCA). Monitor capability — is Cpk improving?',
    conceptCategory: 'phase',
    relations: [
      { targetId: 'correctiveAction', type: 'uses' },
      { targetId: 'cpk', type: 'uses' },
    ],
  },
];

/** Lookup map for O(1) concept access by ID */
export const conceptMap = new Map<string, Concept>(concepts.map(c => [c.id, c]));

/** Get a concept by ID */
export function getConcept(id: string): Concept | undefined {
  return conceptMap.get(id);
}
