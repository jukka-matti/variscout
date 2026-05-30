/**
 * parseMentions — extract resolved userId strings from @-tag text.
 *
 * Pure utility: no side effects, no wall-clock dependency. Resolves each
 * "@Display Name" token against the provided member roster (case-insensitive).
 * Unknown @-tags are silently ignored. The result is deduplicated.
 *
 * Strategy: scan the text for every `@`-prefixed word sequence that matches
 * a member's `displayName`. Member display names may contain spaces
 * (e.g. "Alice Lead") so we test each member's full name as a regex fragment
 * anchored to an `@` prefix.
 */

import type { ProjectMember } from '../projectMembership/types';

/**
 * Parse @mentions in `text` and return the resolved userId strings.
 *
 * @param text - Comment text (may be empty).
 * @param members - Project member roster to resolve against.
 * @returns Deduplicated array of userId strings for matched members.
 */
export function parseMentions(text: string, members: ReadonlyArray<ProjectMember>): string[] {
  if (!text || members.length === 0) return [];

  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const member of members) {
    const name = member.displayName.toLowerCase();
    // Match "@<displayName>" — the @ must immediately precede the name.
    // We search in the lowercased text so matching is case-insensitive.
    const token = '@' + name;
    let idx = lower.indexOf(token);
    while (idx !== -1) {
      // Ensure the character after the matched name is not a word character
      // (prevents "@Alice Lead" matching inside "@Alice Leadbetter", etc.).
      const afterIdx = idx + token.length;
      const nextChar = lower[afterIdx];
      if (nextChar === undefined || !/[a-z0-9_-]/.test(nextChar)) {
        found.add(member.userId);
      }
      idx = lower.indexOf(token, afterIdx);
    }
  }

  return Array.from(found);
}
