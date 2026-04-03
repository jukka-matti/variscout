import type { IdeaDirection } from './types';

/**
 * Generate 4 "How Might We" prompts for a suspected cause.
 * Used in the Brainstorm Modal to frame ideation across all 4 directions.
 */
export function generateHMWPrompts(
  causeName: string,
  problemStatement?: string
): Record<IdeaDirection, string> {
  const effect = problemStatement || 'this';
  return {
    prevent: `How might we prevent ${causeName} from causing ${effect}?`,
    detect: `How might we detect ${causeName} problems before they cause defects?`,
    simplify: `How might we simplify the ${causeName} process to reduce variation?`,
    eliminate: `How might we eliminate the ${causeName} dependency entirely?`,
  };
}

/** Client-side brainstorm idea — minimal, no evaluation metadata */
export interface BrainstormIdea {
  id: string;
  text: string;
  direction: IdeaDirection;
  aiGenerated: boolean;
  voteCount: number;
}
