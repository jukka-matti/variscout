import { useInvestigationStore } from '@variscout/stores';

export interface UseHasInvestigationContentArgs {
  findingsCount: number;
}

/**
 * Returns true iff the investigation graph has Wall-renderable content. Used
 * to gate the canvas Wall overlay toggle: when this is false, 'wall' is
 * filtered out of CanvasOverlayPicker.availableOverlays.
 *
 * Findings live in app-level feature stores. Callers pass findingsCount from
 * their app's findings selector so this hook stays downward-dependent only.
 * V1 findings render as hub evidence, not standalone Wall nodes, so a
 * findings-only graph should not advertise the Wall overlay yet.
 */
export function useHasInvestigationContent(args: UseHasInvestigationContentArgs): boolean {
  const hubsCount = useInvestigationStore(state => state.hypotheses.length);
  const openQuestionsCount = useInvestigationStore(
    state => state.questions.filter(question => question.status === 'open').length
  );
  const hasHubBackedFindings = hubsCount > 0 && args.findingsCount > 0;

  return hubsCount > 0 || openQuestionsCount > 0 || hasHubBackedFindings;
}
