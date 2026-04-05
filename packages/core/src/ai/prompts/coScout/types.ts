/**
 * Types for the CoScout prompt assembler.
 *
 * Defines the tiered prompt structure and assembler options
 * that will drive the modular prompt pipeline.
 */

import type { ToolDefinition } from '../../responsesApi';
import type { AIContext, InvestigationPhase, JourneyPhase } from '../../types';
import type { AnalysisMode } from '../../../types';

/** Surface where CoScout is rendered — affects prompt length and tone */
export type CoScoutSurface =
  | 'fullPanel'
  | 'quickAsk'
  | 'contextClick'
  | 'chartInsight'
  | 'inlineCoScout'
  | 'narration';

/** Tiered prompt structure optimized for Azure AI Foundry prompt caching */
export interface CoScoutPromptTiers {
  /** Tier 1: Static role + glossary (cacheable prefix, changes rarely) */
  tier1Static: string;
  /** Tier 2: Semi-static context (phase coaching, mode coaching — changes on navigation) */
  tier2SemiStatic: string;
  /** Tier 3: Dynamic context (stats snapshot, filters, findings — changes on every turn) */
  tier3Dynamic: string;
  /** Tool definitions for Responses API function calling */
  tools: ToolDefinition[];
}

/** Options for the unified prompt assembler */
export interface AssembleCoScoutPromptOptions {
  /** Current journey phase (frame/scout/investigate/improve) */
  phase?: JourneyPhase;
  /** Current investigation sub-phase */
  investigationPhase?: InvestigationPhase;
  /** Current analysis mode (standard/performance/yamazumi) */
  mode?: AnalysisMode;
  /** Surface where CoScout is rendered */
  surface?: CoScoutSurface;
  /** Full AI context for dynamic content */
  context?: AIContext;
  /** Whether user is on Team plan */
  isTeamPlan?: boolean;
}
