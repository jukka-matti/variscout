/**
 * AI module exports
 */

export type {
  ProcessContext,
  TargetMetric,
  InvestigationPhase,
  AIContext,
  NarrationRequest,
  NarrationResponse,
  AIErrorType,
  CoScoutMessage,
  CoScoutError,
} from './types';

export {
  buildAIContext,
  detectInvestigationPhase,
  type BuildAIContextOptions,
  type AIStatsInput,
} from './buildAIContext';
export type { ChartInsightData } from './promptTemplates';
export {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
} from './promptTemplates';

export type { InsightChartType, ChipType, DeterministicInsight } from './chartInsights';
export {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
} from './chartInsights';

export { buildSuggestedQuestions, formatForMobile } from './suggestedQuestions';
