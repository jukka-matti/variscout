/**
 * critiqueAnalyzeState — Diagnostic gap-finder for investigation state.
 *
 * Pure function that inspects findings and hypotheses to surface gaps an analyst
 * (or CoScout) should address: hypotheses with no evidence, orphan findings, etc.
 *
 * Used by the deterministic AI-assist surface — no LLM call here, just
 * structured heuristics over the current investigation graph.
 */

import type { Hypothesis, Finding } from '../..';

export interface AnalyzeStateCritique {
  /** Hypotheses with no linked findings (untested theories) */
  hypothesesWithoutEvidence: string[];
  /** Findings not linked to any hypothesis (orphan observations) */
  orphanFindings: Array<{ kind: 'orphan-finding'; findingId: string; findingText: string }>;
  /** Findings open too long (stale) */
  staleFindings: Array<{
    kind: 'stale-finding';
    findingId: string;
    findingText: string;
    daysOpen: number;
  }>;
}

interface CritiqueInput {
  hubs: Hypothesis[];
  findings: Finding[];
  now?: number;
}

const STALE_DAYS_THRESHOLD = 14;

export function critiqueAnalyzeState(input: CritiqueInput): AnalyzeStateCritique {
  const orphanFindings: AnalyzeStateCritique['orphanFindings'] = [];
  const staleFindings: AnalyzeStateCritique['staleFindings'] = [];
  const hypothesesWithoutEvidence: string[] = [];

  // Hypotheses with no linked findings
  for (const hub of input.hubs) {
    if (hub.findingIds.length === 0) {
      hypothesesWithoutEvidence.push(hub.id);
    }
  }

  // Orphan + stale findings
  const hubFindingIds = new Set(input.hubs.flatMap(h => h.findingIds));
  const now = input.now ?? Date.now();

  for (const f of input.findings) {
    if (!hubFindingIds.has(f.id)) {
      orphanFindings.push({ kind: 'orphan-finding', findingId: f.id, findingText: f.text });
    }
    const daysOpen = (now - f.createdAt) / (1000 * 60 * 60 * 24);
    if (
      (f.status === 'observed' || f.status === 'investigating') &&
      daysOpen > STALE_DAYS_THRESHOLD
    ) {
      staleFindings.push({
        kind: 'stale-finding',
        findingId: f.id,
        findingText: f.text,
        daysOpen: Math.floor(daysOpen),
      });
    }
  }

  return {
    hypothesesWithoutEvidence,
    orphanFindings,
    staleFindings,
  };
}
