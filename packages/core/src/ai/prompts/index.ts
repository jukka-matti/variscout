/**
 * Barrel re-export for all prompt modules.
 *
 * Import from here for clean access:
 *   import { buildCoScoutSystemPrompt } from './prompts';
 *
 * Or import specific modules for smaller bundles:
 *   import { buildCoScoutSystemPrompt } from './prompts/coScout';
 */

// Shared utilities
export { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';

// Narration prompts
export { buildNarrationSystemPrompt, buildSummaryPrompt } from './narration';

// Chart insight prompts
export type { ChartInsightData } from './chartInsights';
export { buildChartInsightSystemPrompt, buildChartInsightPrompt } from './chartInsights';

// CoScout conversational prompts
export type { BuildCoScoutSystemPromptOptions } from './coScout';
export {
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutTools,
  formatKnowledgeContext,
} from './coScout';

// Report generation prompts
export { buildReportSystemPrompt, buildReportPrompt } from './reports';
