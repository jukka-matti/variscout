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
export { isFactorRole } from './types';

export { buildAIContext, type BuildAIContextOptions, type AIStatsInput } from './buildAIContext';
export type { ChartInsightData } from './promptTemplates';
export {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
} from './promptTemplates';

export type { InsightChartType, ChipType, DeterministicInsight } from './chartInsights';
export {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
} from './chartInsights';
