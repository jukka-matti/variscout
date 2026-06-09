/**
 * CoScout prompt module — modular directory with tiered assembler.
 *
 * The assembler composes from extracted modules (role, surfaces, modes, context, tools).
 * legacy.ts has been deleted (ADR-068 complete — 2026-05-30).
 *
 * Consumers should use:
 *   - `assembleCoScoutPrompt()` for prompt construction
 *   - `buildCoScoutMessageInput()` for Responses API input array
 *   - `getToolsForSurface()` for tool definitions
 */

// BuildCoScoutToolsOptions relocated from legacy.ts to tools/registry.ts (ADR-068 migration)
export type { BuildCoScoutToolsOptions } from './tools';

// New formatKnowledgeContext — single source of truth
export { formatKnowledgeContext } from './context';

// Message input builder for Responses API
export { buildCoScoutMessageInput } from './messages';

// ── New types ───────────────────────────────────────────────────────────
export type {
  CoScoutScope,
  CoScoutSurface,
  CoScoutPromptTiers,
  AssembleCoScoutPromptOptions,
} from './types';

// ── Tool registry ──────────────────────────────────────────────────────
export { TOOL_REGISTRY, getToolsForSurface } from './tools';
export type { ToolRegistryEntry, ToolName } from './tools';

// ── Assembler ───────────────────────────────────────────────────────────
import type { CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';
import { buildRole } from './role';
import { buildModeWorkflow } from './modes';
import { formatAnalyzeContext, formatDataContext, formatKnowledgeContext } from './context';
import { getToolsForSurface } from './tools';
import { buildSurfaceCoaching } from './surfaces';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from '../shared';
import type { Hypothesis } from '../../../findings/types';
import { analyzeDisciplinePrompt } from './tier2';

/**
 * Unified prompt assembler — builds a tiered prompt from modular modules.
 *
 * Tier 1 (Static): Role definition + glossary + terminology rules.
 *   Completely session-invariant — forms the cacheable prefix for
 *   Azure AI Foundry prompt caching (≥1,024 tokens).
 *
 * Tier 2 (Semi-static): Surface coaching + mode workflow + investigation/data/knowledge context.
 *   Changes on surface, scope, mode, and context changes.
 *
 * Tier 3 (Dynamic): Reserved for Phase 2 — surface-specific context
 *   (e.g., chart-specific data for contextClick surface).
 *
 * Tools: Surface/mode/tier-gated tool definitions from the typed registry.
 */
export function assembleCoScoutPrompt(
  options: AssembleCoScoutPromptOptions = {}
): CoScoutPromptTiers {
  const {
    surface = 'analyze',
    scope,
    mode = scope?.analysisMode ?? options.context?.analysisMode ?? 'standard',
    context,
  } = options;

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

  // Surface-specific coaching
  tier2Parts.push(buildSurfaceCoaching(surface, scope));

  // Mode-specific workflow guidance. Mode is a property of the Analyze scope.
  tier2Parts.push(buildModeWorkflow(mode, surface, scope));

  // Tier 2 discipline coaching — Wall-specific targeted guidance
  if (surface === 'analyze') {
    tier2Parts.push(analyzeDisciplinePrompt);
  }

  // Investigation context (problem statement, questions, hubs, causal links)
  const investigationBlock = formatAnalyzeContext(context?.investigation);
  if (investigationBlock) tier2Parts.push(investigationBlock);

  // Data context (active chart, Analysis Scope, top factors, stats)
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
  const tools = getToolsForSurface(surface, mode, {
    existingHubs: context?.investigation?.hypothesisHubs as Hypothesis[] | undefined,
  });

  return {
    tier1Static: tier1Parts.filter(Boolean).join('\n\n'),
    tier2SemiStatic: tier2Parts.filter(Boolean).join('\n\n'),
    tier3Dynamic: '',
    tools,
  };
}
