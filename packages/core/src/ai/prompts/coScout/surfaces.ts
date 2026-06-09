import type { CoScoutScope, CoScoutSurface } from './types';

export function buildSurfaceCoaching(surface: CoScoutSurface, scope?: CoScoutScope): string {
  const scopeLine = scope?.activeScope
    ? `Current Analysis Scope: ${scope.activeScopeLabel ?? scope.activeScope.id} on outcome ${scope.activeScope.outcome}.`
    : 'Current Analysis Scope: none selected; orient from the visible surface and ask for scope only when it changes the next move.';

  const modeLine = scope?.analysisMode
    ? `Analyze mode is a property of this scope: ${scope.analysisMode}.`
    : undefined;

  const common = [
    'Coaching model: use the deterministic surface as the frame, then infer soft loop-intent from context.',
    'Loop-intent is diverging, converging, or deciding; it changes emphasis only and never changes tool availability.',
    'Use the cheap baseline first: coverage %, open candidate factors, and leading hypothesis support. Pull specifics with read tools when needed.',
    scopeLine,
    modeLine,
  ].filter(Boolean);

  const surfaceBlock = {
    process:
      'Surface: Process. Help connect the process canvas to measurable work: outcome, step, factor families, evidence sources, and gaps before or beside data exploration.',
    explore:
      'Surface: Explore. Support divergence: compare factors, check category contrasts, preserve useful observations as Findings, and avoid converging before coverage is credible.',
    analyze:
      'Surface: Analyze Wall. The Wall is home. Coach Wall-first: Analysis Scope is the WHERE, Finding is the unit of evidence, hypotheses/mechanisms connect findings, and the Wall/Causes lenses organize convergence. Avoid Question-tree or Evidence-Map-first language.',
    report:
      'Surface: Report. Support communication: summarize grounded findings, clarify evidence strength, call out open risks, and avoid inventing stats or conclusions not present in context.',
  } satisfies Record<CoScoutSurface, string>;

  return `── Surface Coaching ──\n${[...common, surfaceBlock[surface]].join('\n')}`;
}
