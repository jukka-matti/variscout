import { useAnalyzeStore } from '@variscout/stores';

export interface UseHasAnalyzeContentArgs {
  findingsCount: number;
}

/**
 * Returns true iff the investigation graph has Wall-renderable content. Used
 * to gate the mobile WallShortcutButton in Canvas/index.tsx: the button is
 * only shown when there is Wall content worth opening.
 *
 * Findings live in app-level feature stores. Callers pass findingsCount from
 * their app's findings selector so this hook stays downward-dependent only.
 * FSJ-8 gives findings-only graphs a Wall arrival state, so findings alone are
 * Wall-renderable content.
 */
export function useHasAnalyzeContent(args: UseHasAnalyzeContentArgs): boolean {
  const hubsCount = useAnalyzeStore(state => state.hypotheses.length);

  return hubsCount > 0 || args.findingsCount > 0;
}
