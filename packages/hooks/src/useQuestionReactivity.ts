import { useMemo } from 'react';
import type { Question } from '@variscout/core';

interface UseQuestionReactivityOptions {
  questions: Question[];
  activeFactor: string | null;
}

interface UseQuestionReactivityReturn {
  activeQuestionId: string | null;
}

export function useQuestionReactivity({
  questions,
  activeFactor,
}: UseQuestionReactivityOptions): UseQuestionReactivityReturn {
  const activeQuestionId = useMemo(() => {
    if (!activeFactor) return null;
    const match = questions.find(q => q.factor === activeFactor);
    return match?.id ?? null;
  }, [questions, activeFactor]);

  return { activeQuestionId };
}
