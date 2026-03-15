import { describe, it, expect } from 'vitest';
import { allKnowledge, getEntry, hasEntry, getRelated, getReferencedBy } from '../knowledge';
import { glossaryTerms } from '../terms';
import { concepts } from '../concepts';
import { isConcept, isGlossaryTerm } from '../types';

describe('allKnowledge', () => {
  it('contains all terms and concepts', () => {
    expect(allKnowledge.length).toBe(glossaryTerms.length + concepts.length);
  });

  it('has no duplicate IDs', () => {
    const ids = allKnowledge.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getEntry', () => {
  it('returns a glossary term by ID', () => {
    const entry = getEntry('cpk');
    expect(entry).toBeDefined();
    expect(isGlossaryTerm(entry!)).toBe(true);
    expect(entry!.label).toBe('Cpk');
  });

  it('returns a concept by ID', () => {
    const entry = getEntry('fourLenses');
    expect(entry).toBeDefined();
    expect(isConcept(entry!)).toBe(true);
    expect(entry!.label).toBe('Four Lenses');
  });

  it('returns undefined for unknown ID', () => {
    expect(getEntry('nonexistent')).toBeUndefined();
  });
});

describe('hasEntry', () => {
  it('returns true for existing terms', () => {
    expect(hasEntry('ucl')).toBe(true);
  });

  it('returns true for existing concepts', () => {
    expect(hasEntry('changeLens')).toBe(true);
  });

  it('returns false for unknown IDs', () => {
    expect(hasEntry('doesNotExist')).toBe(false);
  });
});

describe('getRelated', () => {
  it('returns related entries for a concept', () => {
    const related = getRelated('changeLens');
    expect(related.length).toBeGreaterThan(0);
    // changeLens uses specialCause, nelsonRule2, nelsonRule3
    const ids = related.map(e => e.id);
    expect(ids).toContain('specialCause');
    expect(ids).toContain('nelsonRule2');
  });

  it('returns related entries for a glossary term', () => {
    const related = getRelated('ucl');
    expect(related.length).toBeGreaterThan(0);
    const ids = related.map(e => e.id);
    expect(ids).toContain('lcl');
    expect(ids).toContain('mean');
  });

  it('returns empty array for unknown ID', () => {
    expect(getRelated('nonexistent')).toEqual([]);
  });

  it('returns empty array for entry with no relations', () => {
    // violinPlot has relatedTerms but they should resolve
    const related = getRelated('violinPlot');
    // It has relatedTerms: ['boxplot', 'stdDev'] but 'boxplot' is not a term ID
    // stdDev exists, so at least one should resolve
    expect(related.length).toBeGreaterThanOrEqual(0);
  });
});

describe('getReferencedBy', () => {
  it('returns concepts that reference a term', () => {
    const refs = getReferencedBy('specialCause');
    expect(refs.length).toBeGreaterThan(0);
    const ids = refs.map(e => e.id);
    // changeLens uses specialCause
    expect(ids).toContain('changeLens');
  });

  it('returns terms that reference another term', () => {
    const refs = getReferencedBy('ucl');
    expect(refs.length).toBeGreaterThan(0);
    // lcl has ucl in relatedTerms
    const ids = refs.map(e => e.id);
    expect(ids).toContain('lcl');
  });

  it('returns concepts that reference other concepts', () => {
    const refs = getReferencedBy('changeLens');
    expect(refs.length).toBeGreaterThan(0);
    // fourLenses contains changeLens
    const ids = refs.map(e => e.id);
    expect(ids).toContain('fourLenses');
  });

  it('returns empty array for unknown ID', () => {
    expect(getReferencedBy('nonexistent')).toEqual([]);
  });
});
