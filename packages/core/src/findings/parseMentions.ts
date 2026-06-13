/**
 * parseMentions — extract resolved userId strings from @-tag text.
 *
 * Pure utility: no side effects, no wall-clock dependency. Resolves each
 * "@Display Name" token against the provided member roster (case-insensitive).
 * Unknown @-tags are silently ignored. The result is deduplicated.
 *
 * Strategy: scan the text for every `@`-prefixed word sequence that matches
 * a member's `displayName`. Member display names may contain spaces
 * (e.g. "Alice Lead") so we test each member's full name as a token anchored
 * to an `@` prefix.
 *
 * Resolution policy: LONGEST-MATCH-WINS. When two member names share a prefix
 * (e.g. "Bob" and "Bob Member"), "@Bob Member" resolves ONLY to "Bob Member"
 * — the shorter "Bob" does not also claim the same `@`-span. This is enforced
 * by sorting candidates longest-first and marking each matched character span
 * as consumed before a shorter prefix can match the same start position.
 */

import type { ProjectContributor } from '../improvementProject/types';

/**
 * Parse @mentions in `text` and return the resolved userId strings.
 *
 * @param text - Comment text (may be empty).
 * @param contributors - Local contributor labels to resolve against.
 * @returns Deduplicated array of userId strings for matched members.
 */
export function parseMentions(
  text: string,
  contributors: ReadonlyArray<ProjectContributor>
): string[] {
  if (!text || contributors.length === 0) return [];

  const lower = text.toLowerCase();
  const found = new Set<string>();

  // Longest-match-wins: process the longest display names first so a longer
  // name claims its `@`-span before any shorter prefix can match the same
  // start index. `consumed[i] === true` means index `i` already belongs to a
  // resolved (longer) mention's token span.
  const consumed = new Array<boolean>(lower.length).fill(false);
  const ordered = [...contributors].sort((a, b) => b.displayName.length - a.displayName.length);

  for (const member of ordered) {
    const name = member.displayName.toLowerCase();
    // Match "@<displayName>" — the @ must immediately precede the name.
    const token = '@' + name;
    let idx = lower.indexOf(token);
    while (idx !== -1) {
      const afterIdx = idx + token.length;
      const nextChar = lower[afterIdx];
      // Reject when the matched start was already consumed by a longer name
      // (the shorter prefix loses), and when the char after the name is a word
      // char (prevents "@Alice Lead" matching inside "@Alice Leadbetter").
      const startConsumed = consumed[idx];
      const boundaryOk = nextChar === undefined || !/[a-z0-9_-]/.test(nextChar);
      if (!startConsumed && boundaryOk) {
        found.add(member.userId);
        for (let i = idx; i < afterIdx; i++) consumed[i] = true;
      }
      idx = lower.indexOf(token, afterIdx);
    }
  }

  return Array.from(found);
}
