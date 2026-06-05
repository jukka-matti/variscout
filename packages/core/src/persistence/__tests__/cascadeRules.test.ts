import { describe, it, expect } from 'vitest';
import {
  cascadeRules,
  transitiveCascade,
  type EntityKind,
  type CascadeRuleset,
} from '../cascadeRules';

// ADR-085: 'question' retired → 'scope' (ProblemStatementScope).
// PO-4: the 'investigation' EntityKind retired with the per-step analyze
// projection entity; finding/scope/causalLink/hypothesis tables are PO-6
// territory and no longer cascade from hub deletion in the V1 ruleset.
const ALL_KINDS: EntityKind[] = [
  'hub',
  'outcome',
  'evidenceSnapshot',
  'rowProvenance',
  'evidenceSource',
  'evidenceSourceCursor',
  'finding',
  'scope',
  'causalLink',
  'hypothesis',
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
      'canvasState',
      'rowProvenance',
      'evidenceSourceCursor',
    ];
    for (const kind of expected) {
      expect(resultSet.has(kind)).toBe(true);
    }
    // PO-4: finding/scope/causalLink/hypothesis no longer cascade from hub
    // (the 'investigation' intermediary that linked them retired).
    expect(resultSet.has('finding')).toBe(false);
    // hub itself should not appear in its own cascade
    expect(resultSet.has('hub')).toBe(false);
  });

  it('outcome returns empty (leaf node)', () => {
    expect(transitiveCascade('outcome')).toHaveLength(0);
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
      'scope',
      'causalLink',
      'hypothesis',
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
