import { useMemo } from 'react';
import { generateHMWPrompts } from '@variscout/core/findings';
import type { IdeaDirection } from '@variscout/core';

/**
 * Generate 4 HMW prompts for a suspected cause.
 * Memoized — stable reference when inputs unchanged.
 */
export function useHMWPrompts(
  causeName: string,
  problemStatement?: string
): Record<IdeaDirection, string> {
  return useMemo(
    () => generateHMWPrompts(causeName, problemStatement),
    [causeName, problemStatement]
  );
}
