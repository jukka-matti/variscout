import type { Question } from '../findings/types';
import type { ProcessHubInvestigation } from '../processHub';

export type QuestionAction =
  | { kind: 'QUESTION_ADD'; investigationId: ProcessHubInvestigation['id']; question: Question }
  | { kind: 'QUESTION_UPDATE'; questionId: Question['id']; patch: Partial<Question> }
  | { kind: 'QUESTION_ARCHIVE'; questionId: Question['id'] };
