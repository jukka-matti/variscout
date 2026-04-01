import type { HypothesisStatus, QuestionDisplayStatus } from './types';

export function getQuestionDisplayStatus(status: HypothesisStatus): QuestionDisplayStatus {
  switch (status) {
    case 'untested':
      return 'open';
    case 'partial':
      return 'investigating';
    case 'supported':
      return 'answered';
    case 'contradicted':
      return 'ruled-out';
  }
}

export const QUESTION_STATUS_LABELS: Record<QuestionDisplayStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  answered: 'Answered',
  'ruled-out': 'Ruled out',
};

export const QUESTION_STATUS_COLORS: Record<QuestionDisplayStatus, string> = {
  open: 'text-amber-500',
  investigating: 'text-blue-500',
  answered: 'text-green-500',
  'ruled-out': 'text-red-400',
};
