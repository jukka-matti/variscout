/**
 * Build context-aware suggested questions for the CopilotPanel.
 * Deterministic — no AI call. Examines AIContext and returns 3-5 questions.
 */

import type { AIContext } from './types';

const FALLBACK_QUESTIONS = [
  'What does this analysis tell me?',
  'What should I look at next?',
  'How do I interpret the control chart?',
];

export function buildSuggestedQuestions(context: AIContext): string[] {
  const questions: string[] = [];

  // Out-of-control points
  if (context.violations && context.violations.outOfControl > 0) {
    const n = context.violations.outOfControl;
    questions.push(`Why are there ${n} out-of-control point${n > 1 ? 's' : ''}?`);
  }

  // Low Cpk
  if (context.stats?.cpk !== undefined && context.stats.cpk < 1.33) {
    questions.push(`How can I improve Cpk from ${context.stats.cpk.toFixed(2)}?`);
  }

  // Active filters
  if (context.filters.length > 0) {
    const filterValue = context.filters[0].values[0];
    if (filterValue !== undefined) {
      questions.push(`What makes ${String(filterValue)} different from others?`);
    }
  }

  // Findings with key drivers
  if (context.findings && context.findings.total > 0 && context.findings.keyDrivers.length > 0) {
    const driver = context.findings.keyDrivers[0];
    questions.push(`What should I investigate about ${driver}?`);
  }

  // Stable process
  if (context.stats?.cpk !== undefined && context.stats.cpk >= 1.33) {
    questions.push('Is this process stable enough to reduce inspection?');
  }

  // Cap at 5, pad with fallbacks to minimum 3
  const capped = questions.slice(0, 5);
  let fallbackIdx = 0;
  while (capped.length < 3 && fallbackIdx < FALLBACK_QUESTIONS.length) {
    const fb = FALLBACK_QUESTIONS[fallbackIdx];
    if (!capped.includes(fb)) {
      capped.push(fb);
    }
    fallbackIdx++;
  }

  return capped.slice(0, 5);
}
