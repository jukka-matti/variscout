/**
 * CoScout prompt module — modular directory with legacy delegation.
 *
 * This barrel re-exports everything from the legacy monolithic module
 * for backward compatibility, and adds the new tiered assembler.
 *
 * Strangler fig pattern: legacy.ts is the original coScout.ts renamed;
 * assembleCoScoutPrompt delegates to its builders until modules are extracted.
 */

// ── Backward-compatible re-exports ──────────────────────────────────────
export {
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
  formatKnowledgeContext,
} from './legacy';
export type { BuildCoScoutSystemPromptOptions, BuildCoScoutToolsOptions } from './legacy';

// ── New types ───────────────────────────────────────────────────────────
export type { CoScoutSurface, CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';

// ── Assembler ───────────────────────────────────────────────────────────
import type { CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';
import { buildCoScoutSystemPrompt } from './legacy';
import { buildCoScoutTools } from './legacy';

/**
 * Unified prompt assembler — builds a tiered prompt from options.
 *
 * Currently delegates entirely to the legacy builders.
 * Future tasks will replace delegation with extracted modules
 * (role, phase coaching, mode coaching, context formatters, tool registry).
 */
export function assembleCoScoutPrompt(
  options: AssembleCoScoutPromptOptions = {}
): CoScoutPromptTiers {
  const { phase, investigationPhase, mode, context, isTeamPlan } = options;

  // Delegate to legacy system prompt builder
  const systemPrompt = buildCoScoutSystemPrompt({
    glossaryFragment: context?.glossaryFragment,
    investigation: context?.investigation,
    teamContributors: context?.teamContributors,
    sampleCount: context?.stats?.samples,
    stagedComparison: context?.stagedComparison,
    locale: context?.locale,
    entryScenario: context?.entryScenario,
    phase,
    hasActionTools: phase !== 'frame',
    synthesis: context?.process?.problemStatement,
    capabilityStability: context?.capabilityStability,
    analysisMode: mode,
    coscoutInsights: context?.findings?.coscoutInsights,
    findings: context?.findings,
  });

  // Delegate to legacy tools builder
  const tools = buildCoScoutTools({
    phase,
    investigationPhase,
    isTeamPlan,
  });

  return {
    tier1Static: systemPrompt,
    tier2SemiStatic: '',
    tier3Dynamic: '',
    tools,
  };
}
