/**
 * parseMentions — task 2 failing tests (RED).
 *
 * Acceptance:
 *   - Typing "@<member-display-name>" in the comment composer is parsed to a
 *     mention (resolved to the matching ProjectContributor's userId).
 *   - Unresolved @-tags (no member with that display name) are ignored (no crash).
 *   - Multiple mentions in one comment are all parsed.
 *   - Case-insensitive match on display name.
 *   - Returns a deduplicated list of userId strings.
 *
 * The utility lives at packages/core/src/findings/parseMentions.ts and is
 * exported from the findings barrel. It is a pure function — no side effects,
 * deterministic, no wall-clock dependency.
 *
 * NOTE: the companion store-level test (addHubComment stores mentionedUserIds)
 * is in packages/stores/src/__tests__/analyzeStore.test.ts — see the
 * "analyzeStore — addHubComment with @mentions" describe block added there.
 */

import { describe, it, expect } from 'vitest';
import type { ProjectContributor } from '../../improvementProject/types';
// ── The function under test — does NOT exist yet (RED) ───────────────────────
import { parseMentions } from '../parseMentions';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const alice: ProjectContributor = {
  id: 'm1',
  userId: 'user-alice',
  displayName: 'Alice Lead',
  createdAt: 1,
  deletedAt: null,
};

const bob: ProjectContributor = {
  id: 'm2',
  userId: 'user-bob',
  displayName: 'Bob Member',
  createdAt: 1,
  deletedAt: null,
};

const carol: ProjectContributor = {
  id: 'm3',
  userId: 'user-carol',
  displayName: 'Carol Sponsor',
  createdAt: 1,
  deletedAt: null,
};

const members: ReadonlyArray<ProjectContributor> = [alice, bob, carol];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('parseMentions', () => {
  it('returns an empty array when the text has no @-tags', () => {
    const result = parseMentions('No mentions here at all.', members);
    expect(result).toEqual([]);
  });

  it('returns an empty array for an empty member list', () => {
    const result = parseMentions('@Alice Lead can you check this?', []);
    expect(result).toEqual([]);
  });

  it('resolves a single @mention to the matching member userId', () => {
    const result = parseMentions('@Alice Lead — can you check this?', members);
    expect(result).toEqual(['user-alice']);
  });

  it('resolves multiple @mentions in one comment', () => {
    const result = parseMentions('@Alice Lead and @Bob Member — please validate', members);
    expect(result).toContain('user-alice');
    expect(result).toContain('user-bob');
    expect(result).toHaveLength(2);
  });

  it('ignores @-tags that do not match any member display name', () => {
    // "Jane" is not in the member list
    const result = parseMentions('@Jane validate against night-shift data', members);
    expect(result).toEqual([]);
  });

  it('deduplicates when the same member is mentioned twice', () => {
    const result = parseMentions('@Alice Lead look at this — @Alice Lead did you see it?', members);
    expect(result).toEqual(['user-alice']);
  });

  it('is case-insensitive on display name matching', () => {
    const result = parseMentions('@alice lead can you look?', members);
    expect(result).toEqual(['user-alice']);
  });

  it('handles a mention at the start of the text with no surrounding spaces', () => {
    const result = parseMentions('@Bob Member', members);
    expect(result).toEqual(['user-bob']);
  });

  it('returns an empty array for an empty string', () => {
    const result = parseMentions('', members);
    expect(result).toEqual([]);
  });

  it('resolves all three members when all are mentioned', () => {
    const text = '@Alice Lead @Bob Member @Carol Sponsor';
    const result = parseMentions(text, members);
    expect(result).toContain('user-alice');
    expect(result).toContain('user-bob');
    expect(result).toContain('user-carol');
    expect(result).toHaveLength(3);
  });

  // ── Longest-match-wins for prefix-overlapping display names ──────────────────
  describe('longest-match-wins (prefix-overlapping names)', () => {
    const bobShort: ProjectContributor = {
      id: 'm-short',
      userId: 'user-bob-short',
      displayName: 'Bob',
      createdAt: 1,
      deletedAt: null,
    };
    // bob (above) has displayName 'Bob Member' / userId 'user-bob'.
    const overlapping: ReadonlyArray<ProjectContributor> = [bobShort, bob];

    it('resolves "@Bob Member" to the LONGER name only (Bob Member), not the prefix (Bob)', () => {
      const result = parseMentions('@Bob Member please validate', overlapping);
      expect(result).toEqual(['user-bob']);
      expect(result).not.toContain('user-bob-short');
    });

    it('still resolves the SHORT name when only the prefix is @-tagged', () => {
      // "@Bob," — the trailing comma is a boundary so "Bob" matches; "Bob Member"
      // does not (no " member" follows), so only the short member resolves.
      const result = parseMentions('@Bob, can you look?', overlapping);
      expect(result).toEqual(['user-bob-short']);
    });

    it('resolves both when each is @-tagged in its own span', () => {
      const result = parseMentions('@Bob and @Bob Member', overlapping);
      expect(result).toContain('user-bob-short');
      expect(result).toContain('user-bob');
      expect(result).toHaveLength(2);
    });

    it('is order-independent — short member listed first still loses to the longer match', () => {
      // overlapping lists bobShort BEFORE bob; longest-match sorting must still win.
      const result = parseMentions('@Bob Member', [bobShort, bob]);
      expect(result).toEqual(['user-bob']);
    });
  });
});
