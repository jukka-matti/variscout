/**
 * AI module exports
 */

export type {
  ProcessContext,
  TargetMetric,
  InvestigationPhase,
  JourneyPhase,
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
  buildCoScoutTools,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
} from './promptTemplates';

export type {
  ResponsesApiConfig,
  ToolDefinition,
  ResponsesApiRequest,
  ResponsesApiResponse,
  ResponseOutput,
} from './responsesApi';
export { sendResponsesTurn, streamResponsesTurn, extractResponseText } from './responsesApi';

export type { AIFeature, TraceMetadata, TokenUsage, TraceRecord, TraceStats } from './tracing';
export { traceAICall, getRecentTraces, clearTraces, getTraceStats } from './tracing';

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
