/**
 * Barrel re-export for all prompt modules.
 *
 * Import from here for clean access:
 *   import { assembleCoScoutPrompt } from './prompts';
 *
 * Or import specific modules for smaller bundles:
 *   import { assembleCoScoutPrompt } from './prompts/coScout';
 */

// Shared utilities
export { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';

// Narration prompts
export { buildNarrationSystemPrompt, buildSummaryPrompt } from './narration';

// Chart insight prompts
export type { ChartInsightData } from './chartInsights';
export { buildChartInsightSystemPrompt, buildChartInsightPrompt } from './chartInsights';

// CoScout conversational prompts — new assembler API
export type {
  BuildCoScoutSystemPromptOptions,
  BuildCoScoutToolsOptions,
  CoScoutSurface,
  CoScoutPromptTiers,
  AssembleCoScoutPromptOptions,
} from './coScout';
export { formatKnowledgeContext, assembleCoScoutPrompt, buildCoScoutMessageInput } from './coScout';

// Report generation prompts
export { buildReportSystemPrompt, buildReportPrompt } from './reports';

// Dashboard summary prompt
export { buildDashboardSummaryPrompt } from './dashboardSummary';
