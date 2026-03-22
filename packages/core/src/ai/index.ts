/**
 * AI module exports
 */

export type {
  AITier,
  ProcessContext,
  TargetMetric,
  EntryScenario,
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
export type {
  ChartInsightData,
  BuildCoScoutSystemPromptOptions,
  BuildCoScoutToolsOptions,
} from './promptTemplates';
export {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
} from './promptTemplates';

// Action Tools (ADR-029)
export type {
  ActionToolName,
  ReadToolName,
  CoScoutToolName,
  ProposalStatus,
  ActionProposal,
  ParsedActionMarker,
  FilterPreview,
} from './actionTools';
export {
  parseActionMarkers,
  stripActionMarkers,
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
  isDuplicateProposal,
} from './actionTools';

export type {
  ResponsesApiConfig,
  ToolDefinition,
  ResponsesApiRequest,
  ResponsesApiResponse,
  ResponseOutput,
  TextFormat,
  FunctionCallOutput,
  ToolHandlerMap,
} from './responsesApi';
export {
  ResponsesApiError,
  sendResponsesTurn,
  streamResponsesTurn,
  streamResponsesWithToolLoop,
  extractResponseText,
  ConversationHistory,
} from './responsesApi';

export { narrationResponseSchema, chartInsightResponseSchema } from './schemas';

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

export { getCoScoutReasoningEffort } from './reasoningConfig';

export { djb2Hash } from './hash';
