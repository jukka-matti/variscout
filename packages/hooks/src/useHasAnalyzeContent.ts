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
 * V1 findings render as hub evidence, not standalone Wall nodes, so a
 * findings-only graph should not advertise the Wall shortcut yet.
 */
export function useHasAnalyzeContent(args: UseHasAnalyzeContentArgs): boolean {
  const hubsCount = useAnalyzeStore(state => state.hypotheses.length);
  const hasHubBackedFindings = hubsCount > 0 && args.findingsCount > 0;

  return hubsCount > 0 || hasHubBackedFindings;
}
