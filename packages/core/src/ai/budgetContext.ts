/**
 * Token budget pipeline for CoScout context assembly (ADR-049).
 *
 * Uses a word-count heuristic (1.3 tokens/word) to estimate token usage,
 * then trims lowest-priority components when the total exceeds the budget.
 * Components with priority 0-2 (system, static context, current turn) are
 * never trimmed regardless of budget pressure.
 */

export interface ContextComponent {
  /** Identifier for this component (e.g., 'system', 'investigation', 'images') */
  name: string;
  /** The text/content of this component */
  content: string;
  /** 0 = highest priority (never trim), 8 = lowest. Components <= 2 are never trimmed. */
  priority: number;
}

export interface BudgetResult {
  /** Components kept (in priority order) */
  components: ContextComponent[];
  /** Names of components that were trimmed */
  trimmedComponents: string[];
  /** Estimated total token count of kept components */
  estimatedTokens: number;
}

/** Estimate tokens from text using word-count heuristic (1.3 tokens/word) */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

/**
 * Assemble context components within a token budget.
 * Trims lowest-priority components first. Never trims priority 0-2.
 */
export function budgetContext(
  components: ContextComponent[],
  maxTokens: number = 12000
): BudgetResult {
  // Sort by priority (ascending = most important first)
  const sorted = [...components].sort((a, b) => a.priority - b.priority);
  let totalTokens = sorted.reduce((sum, c) => sum + estimateTokens(c.content), 0);

  if (totalTokens <= maxTokens) {
    return { components: sorted, trimmedComponents: [], estimatedTokens: totalTokens };
  }

  // Trim from lowest priority up, but never priority 0-2
  const trimmed: string[] = [];
  const trimmable = [...sorted].reverse().filter(c => c.priority > 2);

  for (const comp of trimmable) {
    if (totalTokens <= maxTokens) break;
    totalTokens -= estimateTokens(comp.content);
    trimmed.push(comp.name);
  }

  const kept = sorted.filter(c => !trimmed.includes(c.name));
  return {
    components: kept,
    trimmedComponents: trimmed,
    estimatedTokens: kept.reduce((sum, c) => sum + estimateTokens(c.content), 0),
  };
}
