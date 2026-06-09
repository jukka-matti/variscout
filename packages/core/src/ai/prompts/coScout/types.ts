/**
 * Types for the CoScout prompt assembler.
 *
 * Defines the tiered prompt structure and assembler options
 * that will drive the modular prompt pipeline.
 */

import type { ToolDefinition } from '../../responsesApi';
import type { AIContext } from '../../types';
import type { AnalysisMode } from '../../../types';
import type { ProblemStatementScope } from '../../../findings/types';

/** Deterministic product surface where CoScout is rendered. */
export type CoScoutSurface = 'process' | 'explore' | 'analyze' | 'report';

/** Scope facts used by the agent API; mode is an Analyze-surface property. */
export interface CoScoutScope {
  analysisMode?: AnalysisMode;
  activeScope?: Pick<
    ProblemStatementScope,
    'id' | 'projectId' | 'outcome' | 'predicates' | 'hypothesisIds' | 'whatIfProjection'
  >;
  activeScopeLabel?: string;
}

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
  /** Deterministic product surface where CoScout is rendered */
  surface?: CoScoutSurface;
  /** Current analysis scope and Analyze-surface mode */
  scope?: CoScoutScope;
  /** @deprecated Use scope.analysisMode. Accepted for transitional callers. */
  mode?: AnalysisMode;
  /** Full AI context for dynamic content */
  context?: AIContext;
}
