import type { Question } from '../findings/types';
import type { ProcessHubAnalyze } from '../processHub';

export type QuestionAction =
  | { kind: 'QUESTION_ADD'; investigationId: ProcessHubAnalyze['id']; question: Question }
  | { kind: 'QUESTION_UPDATE'; questionId: Question['id']; patch: Partial<Question> }
  | { kind: 'QUESTION_ARCHIVE'; questionId: Question['id'] };
