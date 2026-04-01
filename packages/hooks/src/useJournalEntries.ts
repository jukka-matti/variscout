import { useMemo, useRef } from 'react';
import type { Finding, Hypothesis } from '@variscout/core';

export interface JournalEntry {
  id: string;
  timestamp: string;
  type:
    | 'finding-created'
    | 'question-answered'
    | 'question-ruled-out'
    | 'question-investigating'
    | 'questions-generated'
    | 'note-added'
    | 'gemba-observation'
    | 'observation-linked'
    | 'problem-statement';
  text: string;
  detail?: string;
  relatedQuestionId?: string;
  relatedFindingId?: string;
}

interface UseJournalEntriesOptions {
  findings: Finding[];
  questions: Hypothesis[];
  issueStatement?: string;
  problemStatement?: string;
}

export function useJournalEntries({
  findings,
  questions,
  problemStatement,
}: UseJournalEntriesOptions): JournalEntry[] {
  const problemTimestampRef = useRef<string | null>(null);
  if (problemStatement && !problemTimestampRef.current) {
    problemTimestampRef.current = new Date().toISOString();
  } else if (!problemStatement) {
    problemTimestampRef.current = null;
  }

  return useMemo(() => {
    const entries: JournalEntry[] = [];

    for (const f of findings) {
      entries.push({
        id: `j-f-${f.id}`,
        timestamp: new Date(f.createdAt).toISOString(),
        type: 'finding-created',
        text: f.text,
        relatedFindingId: f.id,
      });

      for (const c of f.comments) {
        entries.push({
          id: `j-c-${f.id}-${c.id}`,
          timestamp: new Date(c.createdAt).toISOString(),
          type: 'note-added',
          text: c.text,
          detail: `On: ${f.text}`,
          relatedFindingId: f.id,
        });
      }
    }

    if (questions.length > 0) {
      const earliest = questions.reduce(
        (min, q) => (q.createdAt < min ? q.createdAt : min),
        questions[0].createdAt
      );
      entries.push({
        id: 'j-qg',
        timestamp: earliest,
        type: 'questions-generated',
        text: `${questions.length} questions generated`,
        detail: questions
          .slice(0, 3)
          .map(q => q.factor ?? q.text)
          .join(', '),
      });
    }

    for (const q of questions) {
      if (q.status === 'supported') {
        entries.push({
          id: `j-qa-${q.id}`,
          timestamp: q.updatedAt,
          type: 'question-answered',
          text: `${q.factor ?? q.text} → Answered`,
          detail: q.evidence?.rSquaredAdj
            ? `R²adj ${(q.evidence.rSquaredAdj * 100).toFixed(0)}%`
            : undefined,
          relatedQuestionId: q.id,
        });
      } else if (q.status === 'contradicted') {
        entries.push({
          id: `j-qr-${q.id}`,
          timestamp: q.updatedAt,
          type: 'question-ruled-out',
          text: `${q.factor ?? q.text} → Ruled out`,
          relatedQuestionId: q.id,
        });
      } else if (q.status === 'partial') {
        entries.push({
          id: `j-qi-${q.id}`,
          timestamp: q.updatedAt,
          type: 'question-investigating',
          text: `${q.factor ?? q.text} → Investigating`,
          relatedQuestionId: q.id,
        });
      }
    }

    if (problemStatement) {
      entries.push({
        id: 'j-ps',
        timestamp: problemTimestampRef.current ?? new Date().toISOString(),
        type: 'problem-statement',
        text: 'Problem statement formed',
        detail: problemStatement,
      });
    }

    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return entries;
  }, [findings, questions, problemStatement]);
}
