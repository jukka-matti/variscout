/**
 * Prompt templates for AI narration.
 *
 * DEPRECATED: This file is now a re-export barrel.
 * Import from './prompts' or specific modules (e.g., './prompts/coScout') instead.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Read the AIX Design System before modifying any prompt template.
 */

// Re-export everything from the prompts/ modules for backward compatibility
export {
  // Shared
  buildLocaleHint,
  TERMINOLOGY_INSTRUCTION,
  // Narration
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  // Chart Insights
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  // CoScout
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  formatKnowledgeContext,
  // Reports
  buildReportSystemPrompt,
  buildReportPrompt,
} from './prompts';

export type { ChartInsightData, BuildCoScoutSystemPromptOptions } from './prompts';
