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

  it('returns new chart terms', () => {
    expect(getEntry('iChart')).toBeDefined();
    expect(getEntry('boxplot')).toBeDefined();
    expect(getEntry('paretoChart')).toBeDefined();
    expect(getEntry('capabilityAnalysis')).toBeDefined();
    expect(getEntry('question')).toBeDefined();
    expect(getEntry('median')).toBeDefined();
  });
});

describe('hasEntry', () => {
  it('returns true for existing terms', () => {
    expect(hasEntry('ucl')).toBe(true);
  });

  it('returns true for existing concepts', () => {
    expect(hasEntry('parallelViews')).toBe(true);
  });

  it('returns false for removed lens concepts', () => {
    expect(hasEntry('changeLens')).toBe(false);
    expect(hasEntry('flowLens')).toBe(false);
    expect(hasEntry('failureLens')).toBe(false);
    expect(hasEntry('valueLens')).toBe(false);
  });

  it('returns false for unknown IDs', () => {
    expect(hasEntry('doesNotExist')).toBe(false);
  });
});

describe('getRelated', () => {
  it('returns related entries for a concept', () => {
    const related = getRelated('fourLenses');
    expect(related.length).toBeGreaterThan(0);
    // fourLenses uses iChart, boxplot, paretoChart, capabilityAnalysis
    const ids = related.map(e => e.id);
    expect(ids).toContain('iChart');
    expect(ids).toContain('boxplot');
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

  it('resolves violinPlot relatedTerms now that boxplot is a term', () => {
    const related = getRelated('violinPlot');
    const ids = related.map(e => e.id);
    expect(ids).toContain('boxplot');
    expect(ids).toContain('stdDev');
  });
});

describe('getReferencedBy', () => {
  it('returns concepts that reference a term', () => {
    const refs = getReferencedBy('specialCause');
    expect(refs.length).toBeGreaterThan(0);
  });

  it('returns terms that reference another term', () => {
    const refs = getReferencedBy('ucl');
    expect(refs.length).toBeGreaterThan(0);
    // lcl has ucl in relatedTerms
    const ids = refs.map(e => e.id);
    expect(ids).toContain('lcl');
  });

  it('returns concepts that reference fourLenses', () => {
    const refs = getReferencedBy('fourLenses');
    expect(refs.length).toBeGreaterThan(0);
    const ids = refs.map(e => e.id);
    // parallelViews uses fourLenses
    expect(ids).toContain('parallelViews');
  });

  it('returns empty array for unknown ID', () => {
    expect(getReferencedBy('nonexistent')).toEqual([]);
  });
});
