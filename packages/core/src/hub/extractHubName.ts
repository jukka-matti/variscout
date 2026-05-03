const MAX_LEN = 50;
const SENTENCE_BREAK = /[.!?]/;

/**
 * Extract a short Hub name from the first sentence of a goal narrative.
 * Strips trailing punctuation; truncates to 50 chars at word boundary.
 */
export function extractHubName(goalNarrative: string): string {
  if (!goalNarrative.trim()) return '';
  const firstSentence = goalNarrative.split(SENTENCE_BREAK)[0]?.trim() ?? '';
  if (firstSentence.length <= MAX_LEN) return firstSentence;
  const slice = firstSentence.slice(0, MAX_LEN).trimEnd();
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim();
}
