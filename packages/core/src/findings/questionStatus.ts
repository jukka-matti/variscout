import type { QuestionStatus } from './types';

export const QUESTION_STATUS_COLORS: Record<QuestionStatus, string> = {
  open: 'text-amber-500',
  investigating: 'text-blue-500',
  answered: 'text-green-500',
  'ruled-out': 'text-red-400',
};
