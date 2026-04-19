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
  ImageAttachment,
} from './types';

export {
  validateImageFile,
  fileToDataUrl,
  MAGIC_BYTES,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_MESSAGE,
} from './imageValidation';

export {
  validateAttachmentFile,
  sanitizeFilename,
  inferMimeFromExtension,
  FILE_MAGIC_BYTES,
  FILE_SIZE_LIMITS,
  SUPPORTED_ATTACHMENT_TYPES,
} from './fileValidation';
export type { AttachmentValidationResult } from './fileValidation';

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
  CoScoutSurface,
  CoScoutPromptTiers,
  AssembleCoScoutPromptOptions,
} from './prompts';
export {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  formatKnowledgeContext,
  assembleCoScoutPrompt,
  buildCoScoutMessageInput,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
  buildDashboardSummaryPrompt,
} from './prompts';

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
  InputContentPart,
  MessageContent,
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

export { searchProjectArtifacts } from './searchProject';
export type { SearchProjectOptions, SearchResult } from './searchProject';

export { budgetContext } from './budgetContext';
export type { ContextComponent, BudgetResult } from './budgetContext';

export {
  parseRefMarkers,
  stripRefMarkers,
  type RefMarker,
  type RefTargetType,
  type ParseRefResult,
} from './refMarkers';

export type {
  KnowledgeAdapter,
  KnowledgeDocumentEntry,
  KnowledgeSearchResult,
  KnowledgeSearchOptions,
  KnowledgeSourceType,
} from './knowledgeAdapter';

// Wall investigation actions (Phase 3)
export { proposeDisconfirmationMove, critiqueInvestigationState } from './actions';
export type { SuggestedBrush, InvestigationGap, CritiqueInput, CritiqueResult } from './actions';
