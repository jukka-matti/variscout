import { describe, it, expect } from 'vitest';
import { concepts, getConcept } from '../concepts';
import { hasTerm, getTerm } from '../terms';
import { hasEntry } from '../knowledge';
import { isConcept, isGlossaryTerm } from '../types';

describe('concepts', () => {
  it('has exactly 12 concepts (3 frameworks + 4 principles + 5 phases)', () => {
    expect(concepts.length).toBe(12);
  });

  it('all concepts have unique IDs', () => {
    const ids = concepts.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all concepts have required fields', () => {
    for (const concept of concepts) {
      expect(concept.id).toBeTruthy();
      expect(concept.label).toBeTruthy();
      expect(concept.definition).toBeTruthy();
      expect(concept.conceptCategory).toBeTruthy();
      expect(['framework', 'phase', 'principle']).toContain(concept.conceptCategory);
      expect(Array.isArray(concept.relations)).toBe(true);
    }
  });

  it('all relation targets exist in the knowledge base', () => {
    for (const concept of concepts) {
      for (const relation of concept.relations) {
        expect(
          hasEntry(relation.targetId),
          `Concept "${concept.id}" has relation to unknown target "${relation.targetId}"`
        ).toBe(true);
      }
    }
  });

  it('all relation types are valid', () => {
    const validTypes = ['uses', 'leads-to', 'contains', 'contrasts'];
    for (const concept of concepts) {
      for (const relation of concept.relations) {
        expect(
          validTypes,
          `Invalid relation type "${relation.type}" in concept "${concept.id}"`
        ).toContain(relation.type);
      }
    }
  });

  it('getConcept returns a concept by ID', () => {
    const result = getConcept('fourLenses');
    expect(result).toBeDefined();
    expect(result!.label).toBe('Four Lenses');
    expect(result!.conceptCategory).toBe('framework');
  });

  it('getConcept returns undefined for unknown ID', () => {
    expect(getConcept('nonexistent')).toBeUndefined();
  });

  it('no concept IDs collide with term IDs', () => {
    for (const concept of concepts) {
      expect(hasTerm(concept.id), `Concept ID "${concept.id}" collides with a glossary term`).toBe(
        false
      );
    }
  });

  it('does not contain individual lens concepts', () => {
    expect(getConcept('changeLens')).toBeUndefined();
    expect(getConcept('flowLens')).toBeUndefined();
    expect(getConcept('failureLens')).toBeUndefined();
    expect(getConcept('valueLens')).toBeUndefined();
  });

  it('does not contain stabilityBeforeCapability', () => {
    expect(getConcept('stabilityBeforeCapability')).toBeUndefined();
  });

  it('contains parallelViews and iterativeExploration', () => {
    expect(getConcept('parallelViews')).toBeDefined();
    expect(getConcept('parallelViews')!.conceptCategory).toBe('framework');
    expect(getConcept('iterativeExploration')).toBeDefined();
    expect(getConcept('iterativeExploration')!.conceptCategory).toBe('principle');
  });

  it('fourLenses relates to chart terms, not lens concepts', () => {
    const fl = getConcept('fourLenses')!;
    const targetIds = fl.relations.map(r => r.targetId);
    expect(targetIds).toContain('iChart');
    expect(targetIds).toContain('boxplot');
    expect(targetIds).toContain('paretoChart');
    expect(targetIds).toContain('capabilityAnalysis');
    expect(targetIds).not.toContain('changeLens');
    expect(targetIds).not.toContain('flowLens');
  });
});

describe('type guards', () => {
  it('isConcept returns true for concepts', () => {
    const concept = getConcept('fourLenses')!;
    expect(isConcept(concept)).toBe(true);
    expect(isGlossaryTerm(concept)).toBe(false);
  });

  it('isGlossaryTerm returns true for terms', () => {
    const term = getTerm('cpk')!;
    expect(isGlossaryTerm(term)).toBe(true);
    expect(isConcept(term)).toBe(false);
  });
});
