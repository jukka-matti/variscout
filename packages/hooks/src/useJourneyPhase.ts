import { useMemo } from 'react';
import type { Finding, JourneyPhase, EntryScenario } from '@variscout/core';

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

/** Coaching hint per phase × entry scenario */
const COACHING_TEXT: Record<EntryScenario, Record<JourneyPhase, string>> = {
  problem: {
    frame: 'Set up your data to start investigating the problem.',
    scout: 'Look for variation patterns that could explain the problem.',
    investigate: 'Build evidence linking factors to the problem.',
    improve: 'Plan and execute improvements using the PDCA cycle.',
  },
  hypothesis: {
    frame: 'Set up your data to test your hypothesis.',
    scout: 'Look for evidence that supports or refutes your hypothesis.',
    investigate: 'Gather statistical evidence to confirm the suspected cause.',
    improve: 'Confirmed cause — plan corrective actions via PDCA.',
  },
  routine: {
    frame: 'Set up your data for a routine process check.',
    scout: 'Scan for new signals, drift, or unexpected patterns.',
    investigate: 'A signal was found — drill into potential causes.',
    improve: 'Cause identified — plan corrective actions via PDCA.',
  },
};

/**
 * Get coaching text for the current phase and entry scenario.
 */
export function getCoachingText(
  phase: JourneyPhase,
  entryScenario: EntryScenario = 'problem'
): string {
  return COACHING_TEXT[entryScenario][phase];
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
