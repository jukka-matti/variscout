import { useMemo } from 'react';
import type { Finding, JourneyPhase, EntryScenario } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import type { Locale } from '@variscout/core/i18n';

/**
 * Detect the high-level analysis journey phase from current state.
 * Simple, deterministic, no AI.
 *
 * - frame: no data loaded yet
 * - scout: data loaded, exploring patterns (no findings yet)
 * - investigate: findings exist, drilling into causes
 * - improve: at least one finding has corrective actions
 */
export function useJourneyPhase(hasData: boolean, findings: Finding[]): JourneyPhase {
  return useMemo(() => {
    if (!hasData) return 'frame';
    const hasActions = findings.some(f => f.actions && f.actions.length > 0);
    if (hasActions) return 'improve';
    if (findings.length > 0) return 'investigate';
    return 'scout';
  }, [hasData, findings]);
}

// ---------------------------------------------------------------------------
// Entry-path-aware coaching text
// ---------------------------------------------------------------------------

/** Coaching key mapping per entry scenario × phase */
const COACHING_KEYS: Record<
  EntryScenario,
  Record<JourneyPhase, `coach.${EntryScenario}.${JourneyPhase}`>
> = {
  problem: {
    frame: 'coach.problem.frame',
    scout: 'coach.problem.scout',
    investigate: 'coach.problem.investigate',
    improve: 'coach.problem.improve',
  },
  hypothesis: {
    frame: 'coach.hypothesis.frame',
    scout: 'coach.hypothesis.scout',
    investigate: 'coach.hypothesis.investigate',
    improve: 'coach.hypothesis.improve',
  },
  routine: {
    frame: 'coach.routine.frame',
    scout: 'coach.routine.scout',
    investigate: 'coach.routine.investigate',
    improve: 'coach.routine.improve',
  },
};

/**
 * Get coaching text for the current phase and entry scenario.
 */
export function getCoachingText(
  phase: JourneyPhase,
  entryScenario: EntryScenario = 'problem',
  locale: Locale = 'en'
): string {
  return getMessage(locale, COACHING_KEYS[entryScenario][phase]);
}

/**
 * Detect entry scenario from process context fields.
 * Azure: derive from analysis brief. PWA: defaults to 'problem'.
 */
export function detectEntryScenario(processContext?: {
  problemStatement?: string;
  targetMetric?: string;
  targetValue?: number;
}): EntryScenario {
  if (!processContext) return 'problem';
  const { problemStatement, targetMetric, targetValue } = processContext;
  if (problemStatement && (targetMetric || targetValue !== undefined)) return 'problem';
  if (problemStatement) return 'hypothesis';
  return 'routine';
}
