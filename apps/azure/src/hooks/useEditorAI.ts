/**
 * useEditorAI - Backward-compatible re-export from features/ai.
 *
 * The implementation has moved to features/ai/useAIOrchestration.ts.
 * This file exists for backward compatibility with existing imports.
 */
export {
  useAIOrchestration as useEditorAI,
  type UseAIOrchestrationOptions as UseEditorAIOptions,
  type UseAIOrchestrationReturn as UseEditorAIReturn,
} from '../features/ai';
export type { AIContextSummary } from '../stores/aiStore';
