/**
 * Aggregates investigation-state gaps for the CoScout
 * `critique_investigation_state` tool. Returns a structured array of gap
 * entries. One read tool powers the whole Wall rail critique feed.
 *
 * Gap kinds:
 * - missing-disconfirmation: hub has ≥3 supporting findings and no contradictor
 * - hub-without-question: hub with no linked guiding questions
 * - orphan-question: open question with no hub membership
 * - stale-question: open question older than STALE_DAYS
 */

import type { SuspectedCause, Question, Finding } from '../..';

const MIN_SUPPORTERS_FOR_DISCONFIRMATION_GAP = 3;
const STALE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type InvestigationGap =
  | { kind: 'missing-disconfirmation'; hubId: string; hubName: string }
  | { kind: 'hub-without-question'; hubId: string; hubName: string }
  | { kind: 'orphan-question'; questionId: string; questionText: string }
  | { kind: 'stale-question'; questionId: string; questionText: string; daysOpen: number };

export interface CritiqueInput {
  hubs: SuspectedCause[];
  questions: Question[];
  findings: Finding[];
}

export interface CritiqueResult {
  gaps: InvestigationGap[];
}

export function critiqueInvestigationState(input: CritiqueInput): CritiqueResult {
  const gaps: InvestigationGap[] = [];
  const findingById = new Map(input.findings.map(f => [f.id, f]));

  for (const hub of input.hubs) {
    const supporters = hub.findingIds
      .map(id => findingById.get(id))
      .filter((f): f is Finding => !!f);
    const hasContradictor = supporters.some(f => f.validationStatus === 'contradicts');
    if (supporters.length >= MIN_SUPPORTERS_FOR_DISCONFIRMATION_GAP && !hasContradictor) {
      gaps.push({ kind: 'missing-disconfirmation', hubId: hub.id, hubName: hub.name });
    }
    if (hub.questionIds.length === 0) {
      gaps.push({ kind: 'hub-without-question', hubId: hub.id, hubName: hub.name });
    }
  }

  const hubQuestionIds = new Set(input.hubs.flatMap(h => h.questionIds));
  const now = Date.now();
  for (const q of input.questions) {
    if (q.status !== 'open') continue;
    if (!hubQuestionIds.has(q.id)) {
      gaps.push({ kind: 'orphan-question', questionId: q.id, questionText: q.text });
    }
    const createdMs = Date.parse(q.createdAt);
    if (!Number.isNaN(createdMs)) {
      const daysOpen = Math.floor((now - createdMs) / MS_PER_DAY);
      if (daysOpen > STALE_DAYS) {
        gaps.push({ kind: 'stale-question', questionId: q.id, questionText: q.text, daysOpen });
      }
    }
  }

  return { gaps };
}
