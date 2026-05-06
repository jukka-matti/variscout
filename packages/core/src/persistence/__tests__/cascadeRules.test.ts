import { describe, it, expect } from 'vitest';
import {
  cascadeRules,
  transitiveCascade,
  type EntityKind,
  type CascadeRuleset,
} from '../cascadeRules';

const ALL_KINDS: EntityKind[] = [
  'hub',
  'outcome',
  'evidenceSnapshot',
  'rowProvenance',
  'evidenceSource',
  'evidenceSourceCursor',
  'investigation',
  'finding',
  'question',
  'causalLink',
  'suspectedCause',
  'canvasState',
];

describe('cascadeRules', () => {
  it('covers all EntityKind members', () => {
    for (const kind of ALL_KINDS) {
      expect(cascadeRules).toHaveProperty(kind);
    }
  });

  it('has no self-loops', () => {
    for (const kind of ALL_KINDS) {
      expect(cascadeRules[kind].cascadesTo).not.toContain(kind);
    }
  });

  it('every cascade target is a known EntityKind', () => {
    const kindSet = new Set<string>(ALL_KINDS);
    for (const kind of ALL_KINDS) {
      for (const target of cascadeRules[kind].cascadesTo) {
        expect(kindSet.has(target)).toBe(true);
      }
    }
  });
});

describe('transitiveCascade', () => {
  it('hub returns full descendant set', () => {
    const result = transitiveCascade('hub');
    const resultSet = new Set(result);
    const expected: EntityKind[] = [
      'outcome',
      'evidenceSnapshot',
      'evidenceSource',
      'investigation',
      'canvasState',
      'rowProvenance',
      'evidenceSourceCursor',
      'finding',
      'question',
      'causalLink',
      'suspectedCause',
    ];
    for (const kind of expected) {
      expect(resultSet.has(kind)).toBe(true);
    }
    // hub itself should not appear in its own cascade
    expect(resultSet.has('hub')).toBe(false);
  });

  it('outcome returns empty (leaf node)', () => {
    expect(transitiveCascade('outcome')).toHaveLength(0);
  });

  it('investigation returns its 4 direct children (all leaves)', () => {
    const result = transitiveCascade('investigation');
    const resultSet = new Set(result);
    expect(resultSet.has('finding')).toBe(true);
    expect(resultSet.has('question')).toBe(true);
    expect(resultSet.has('causalLink')).toBe(true);
    expect(resultSet.has('suspectedCause')).toBe(true);
    expect(result).toHaveLength(4);
  });

  it('evidenceSnapshot returns rowProvenance only', () => {
    const result = transitiveCascade('evidenceSnapshot');
    expect(result).toEqual(['rowProvenance']);
  });

  it('evidenceSource returns evidenceSourceCursor only', () => {
    const result = transitiveCascade('evidenceSource');
    expect(result).toEqual(['evidenceSourceCursor']);
  });

  it('leaf nodes all return empty arrays', () => {
    const leaves: EntityKind[] = [
      'outcome',
      'rowProvenance',
      'evidenceSourceCursor',
      'finding',
      'question',
      'causalLink',
      'suspectedCause',
      'canvasState',
    ];
    for (const leaf of leaves) {
      expect(transitiveCascade(leaf)).toHaveLength(0);
    }
  });

  it('result contains no duplicates', () => {
    const result = transitiveCascade('hub');
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });
});

// Compile-time check: cascadeRuleset is exhaustive over EntityKind
// If EntityKind gains a new member, this assignment will type-error.
const _typecheck: CascadeRuleset = cascadeRules;
void _typecheck;
