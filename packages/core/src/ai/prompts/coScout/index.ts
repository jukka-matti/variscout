/**
 * CoScout prompt module — modular directory with legacy backward compatibility.
 *
 * This barrel re-exports everything from the legacy monolithic module
 * for backward compatibility, and provides the new tiered assembler
 * that composes from extracted modules (role, phases, modes, context, tools).
 *
 * Strangler fig pattern: legacy.ts is the original coScout.ts renamed;
 * assembleCoScoutPrompt now uses extracted modules instead of delegating.
 */

// ── Backward-compatible re-exports ──────────────────────────────────────
// These legacy functions are still used by useAICoScout.ts and tests.
// Phase 2 will migrate consumers to the new assembler API.
/** @deprecated Use `assembleCoScoutPrompt` instead. */
export {
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
} from './legacy';
export type { BuildCoScoutSystemPromptOptions, BuildCoScoutToolsOptions } from './legacy';

// New formatKnowledgeContext — single source of truth
export { formatKnowledgeContext } from './context';

// ── New types ───────────────────────────────────────────────────────────
export type { CoScoutSurface, CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';

// ── Tool registry ──────────────────────────────────────────────────────
export { TOOL_REGISTRY, getToolsForPhase } from './tools';
export type { ToolRegistryEntry, ToolName } from './tools';

// ── Assembler ───────────────────────────────────────────────────────────
import type { CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';
import { buildRole } from './role';
import { buildPhaseCoaching } from './phases';
import { buildModeWorkflow } from './modes';
import { formatInvestigationContext, formatDataContext, formatKnowledgeContext } from './context';
import { getToolsForPhase } from './tools';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from '../shared';
import type { SuspectedCause } from '../../../findings/types';

/**
 * Unified prompt assembler — builds a tiered prompt from modular modules.
 *
 * Tier 1 (Static): Role definition + glossary + terminology rules.
 *   Completely session-invariant — forms the cacheable prefix for
 *   Azure AI Foundry prompt caching (≥1,024 tokens).
 *
 * Tier 2 (Semi-static): Phase coaching + mode workflow + investigation/data/knowledge context.
 *   Changes on navigation (phase transition, mode switch, drill path change).
 *
 * Tier 3 (Dynamic): Reserved for Phase 2 — surface-specific context
 *   (e.g., chart-specific data for contextClick surface).
 *
 * Tools: Phase/mode/tier-gated tool definitions from the typed registry.
 */
export function assembleCoScoutPrompt(
  options: AssembleCoScoutPromptOptions = {}
): CoScoutPromptTiers {
  const { phase = 'frame', investigationPhase, mode = 'standard', context, isTeamPlan } = options;

  // ── Tier 1: Static (cacheable prefix) ──────────────────────────────
  const tier1Parts: string[] = [];

  // Locale hint goes first if non-English
  const localeHint = buildLocaleHint(context?.locale);
  if (localeHint) tier1Parts.push(localeHint);

  // Core role definition
  tier1Parts.push(buildRole());

  // Terminology enforcement (always present)
  tier1Parts.push(TERMINOLOGY_INSTRUCTION);

  // Glossary fragment — passed through from AIContext, built by the app layer
  if (context?.glossaryFragment) {
    tier1Parts.push(context.glossaryFragment);
  }

  // ── Tier 2: Semi-static (changes on navigation) ───────────────────
  const tier2Parts: string[] = [];

  // Phase-specific coaching
  tier2Parts.push(
    buildPhaseCoaching({
      phase,
      mode,
      investigationPhase,
      entryScenario: context?.entryScenario,
    })
  );

  // Mode-specific workflow guidance
  tier2Parts.push(buildModeWorkflow(mode, phase));

  // Investigation context (problem statement, questions, hubs, causal links)
  const investigationBlock = formatInvestigationContext(context?.investigation);
  if (investigationBlock) tier2Parts.push(investigationBlock);

  // Data context (active chart, drill scope, top factors, stats)
  if (context) {
    const dataBlock = formatDataContext(context);
    if (dataBlock) tier2Parts.push(dataBlock);
  }

  // Knowledge context (KB documents, findings from other projects)
  if (context?.knowledgeResults) {
    const knowledgeBlock = formatKnowledgeContext(
      context.knowledgeResults,
      context.knowledgeDocuments
    );
    if (knowledgeBlock) tier2Parts.push(knowledgeBlock);
  }

  // ── Tier 3: Dynamic (Phase 2 — surface-specific context) ──────────
  // Reserved for future: chart-specific data for contextClick,
  // conversation history summary for quickAsk, etc.

  // ── Tools ──────────────────────────────────────────────────────────
  const tools = getToolsForPhase(phase, mode, {
    isTeamPlan,
    investigationPhase,
    existingHubs: context?.investigation?.suspectedCauseHubs as SuspectedCause[] | undefined,
  });

  return {
    tier1Static: tier1Parts.filter(Boolean).join('\n\n'),
    tier2SemiStatic: tier2Parts.filter(Boolean).join('\n\n'),
    tier3Dynamic: '',
    tools,
  };
}
