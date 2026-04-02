import type { Finding, Question } from '@variscout/core';

interface SerializerOptions {
  projectId: string;
  uploadBlob: (path: string, content: string) => Promise<void>;
}

/** Serialize findings to JSONL for Foundry IQ indexing */
export function serializeFindings(findings: Finding[]): string {
  return findings
    .map(f =>
      JSON.stringify({
        id: f.id,
        type: 'finding',
        text: f.text,
        status: f.status,
        comments: f.comments?.map(c => c.text).filter(Boolean),
        outcome: f.outcome
          ? {
              effective: f.outcome.effective,
              cpkBefore: f.outcome.cpkBefore,
              cpkAfter: f.outcome.cpkAfter,
              notes: f.outcome.notes,
            }
          : undefined,
        actions: f.actions?.map(a => ({
          text: a.text,
          assignee: a.assignee?.displayName,
          completed: !!a.completedAt,
        })),
        questionId: f.questionId,
        createdAt: f.createdAt,
      })
    )
    .join('\n');
}

/** Serialize answered/ruled-out questions to JSONL */
export function serializeQuestions(questions: Question[]): string {
  return questions
    .filter(q => q.status === 'answered' || q.status === 'ruled-out')
    .map(q =>
      JSON.stringify({
        id: q.id,
        type: q.status === 'answered' ? 'answer' : 'ruled-out',
        text: q.text,
        status: q.status,
        factor: q.factor,
        manualNote: q.manualNote,
        causeRole: q.causeRole,
        evidence: q.evidence,
        linkedFindingIds: q.linkedFindingIds,
        ideas: q.ideas
          ?.filter(i => i.selected)
          .map(i => ({
            text: i.text,
            direction: i.direction,
            timeframe: i.timeframe,
          })),
      })
    )
    .join('\n');
}

/** Debounced serialization — call after findings/questions change */
export function createInvestigationSerializer(options: SerializerOptions) {
  let findingsTimer: ReturnType<typeof setTimeout> | null = null;
  let questionsTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 5000;

  return {
    onFindingsChange(findings: Finding[]) {
      if (findingsTimer) clearTimeout(findingsTimer);
      findingsTimer = setTimeout(async () => {
        try {
          const jsonl = serializeFindings(findings);
          await options.uploadBlob(`${options.projectId}/investigation/findings.jsonl`, jsonl);
        } catch (err) {
          console.warn('[KB] Failed to serialize findings:', err);
        }
      }, DEBOUNCE_MS);
    },

    onQuestionsChange(questions: Question[]) {
      if (questionsTimer) clearTimeout(questionsTimer);
      questionsTimer = setTimeout(async () => {
        try {
          const jsonl = serializeQuestions(questions);
          await options.uploadBlob(`${options.projectId}/investigation/questions.jsonl`, jsonl);
        } catch (err) {
          console.warn('[KB] Failed to serialize questions:', err);
        }
      }, DEBOUNCE_MS);
    },

    dispose() {
      if (findingsTimer) clearTimeout(findingsTimer);
      if (questionsTimer) clearTimeout(questionsTimer);
    },
  };
}
