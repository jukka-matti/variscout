/**
 * AI module exports
 */

export type {
  ProcessContext,
  TargetMetric,
  InvestigationPhase,
  AIContext,
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
export type { ChartInsightData, BuildCoScoutSystemPromptOptions } from './promptTemplates';
export {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
} from './promptTemplates';

export type {
  InsightChartType,
  ChipType,
  DeterministicInsight,
  InsightAction,
} from './chartInsights';
export {
  buildIChartInsight,
  buildBoxplotInsight,
  buildParetoInsight,
  buildStatsInsight,
  buildStagedComparisonInsight,
} from './chartInsights';

export { buildSuggestedQuestions, formatForMobile } from './suggestedQuestions';

export { djb2Hash } from './hash';
