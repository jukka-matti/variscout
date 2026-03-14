/**
 * AI module exports
 */

export type {
  FactorRole,
  ProcessContext,
  AIContext,
  NarrationRequest,
  NarrationResponse,
} from './types';

export { buildAIContext, type BuildAIContextOptions, type AIStatsInput } from './buildAIContext';
export { buildNarrationSystemPrompt, buildSummaryPrompt } from './promptTemplates';
