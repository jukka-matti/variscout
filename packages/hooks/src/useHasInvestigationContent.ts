import { useInvestigationStore } from '@variscout/stores';

export interface UseHasInvestigationContentArgs {
  findingsCount: number;
}

/**
 * Returns true iff the investigation graph has at least one hub, question, or
 * finding. Used to gate the canvas Wall overlay toggle: when this is false,
 * 'wall' is filtered out of CanvasOverlayPicker.availableOverlays.
 *
 * Findings live in app-level feature stores. Callers pass findingsCount from
 * their app's findings selector so this hook stays downward-dependent only.
 */
export function useHasInvestigationContent(args: UseHasInvestigationContentArgs): boolean {
  const hubsCount = useInvestigationStore(state => state.suspectedCauses.length);
  const questionsCount = useInvestigationStore(state => state.questions.length);

  return hubsCount + questionsCount + args.findingsCount > 0;
}
