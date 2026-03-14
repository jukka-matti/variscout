/**
 * Tests for glossary terms and buildGlossaryPrompt
 */
import { describe, it, expect } from 'vitest';
import {
  glossaryTerms,
  glossaryMap,
  getTerm,
  getTermsByCategory,
  hasTerm,
  buildGlossaryPrompt,
} from '../glossary';
import type { GlossaryCategory } from '../glossary';

describe('glossary terms', () => {
  it('has at least 40 terms (26 original + 15 new)', () => {
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(40);
  });

  it('all terms have required fields', () => {
    for (const term of glossaryTerms) {
      expect(term.id).toBeTruthy();
      expect(term.label).toBeTruthy();
      expect(term.definition).toBeTruthy();
      expect(term.category).toBeTruthy();
    }
  });

  it('all term IDs are unique', () => {
    const ids = glossaryTerms.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('glossaryMap matches glossaryTerms', () => {
    expect(glossaryMap.size).toBe(glossaryTerms.length);
    for (const term of glossaryTerms) {
      expect(glossaryMap.get(term.id)).toBe(term);
    }
  });
});

describe('investigation terms', () => {
  const investigationTerms = glossaryTerms.filter(t => t.category === 'investigation');

  it('has investigation category terms', () => {
    expect(investigationTerms.length).toBeGreaterThanOrEqual(8);
  });

  it('includes key investigation terms', () => {
    const ids = investigationTerms.map(t => t.id);
    expect(ids).toContain('finding');
    expect(ids).toContain('investigationStatus');
    expect(ids).toContain('keyDriver');
    expect(ids).toContain('actionItem');
    expect(ids).toContain('findingOutcome');
    expect(ids).toContain('rootCauseAnalysis');
    expect(ids).toContain('correctiveAction');
    expect(ids).toContain('preventiveAction');
  });
});

describe('new methodology terms', () => {
  it('includes stratification and rationalSubgrouping', () => {
    expect(hasTerm('stratification')).toBe(true);
    expect(hasTerm('rationalSubgrouping')).toBe(true);
    expect(hasTerm('processStability')).toBe(true);
    expect(hasTerm('outOfControl')).toBe(true);
    expect(hasTerm('naturalVariation')).toBe(true);
    expect(hasTerm('controlVsSpec')).toBe(true);
  });
});

describe('getTerm', () => {
  it('returns a term by ID', () => {
    const term = getTerm('finding');
    expect(term).toBeDefined();
    expect(term!.label).toBe('Finding');
    expect(term!.category).toBe('investigation');
  });

  it('returns undefined for unknown ID', () => {
    expect(getTerm('nonexistent')).toBeUndefined();
  });
});

describe('getTermsByCategory', () => {
  it('returns investigation terms', () => {
    const terms = getTermsByCategory('investigation');
    expect(terms.length).toBeGreaterThanOrEqual(8);
    expect(terms.every(t => t.category === 'investigation')).toBe(true);
  });

  it('returns methodology terms (existing + new)', () => {
    const terms = getTermsByCategory('methodology');
    expect(terms.length).toBeGreaterThanOrEqual(12);
  });
});

describe('buildGlossaryPrompt', () => {
  it('returns a formatted prompt with all terms when no categories specified', () => {
    const prompt = buildGlossaryPrompt();
    expect(prompt).toContain('## Terminology');
    expect(prompt).toContain('**Cpk**');
    expect(prompt).toContain('**Finding**');
  });

  it('filters by category', () => {
    const prompt = buildGlossaryPrompt(['investigation']);
    expect(prompt).toContain('**Finding**');
    expect(prompt).toContain('**Action Item**');
    expect(prompt).not.toContain('**Cp**:'); // capability term
  });

  it('filters by multiple categories', () => {
    const prompt = buildGlossaryPrompt(['investigation', 'capability']);
    expect(prompt).toContain('**Finding**');
    expect(prompt).toContain('**Cpk**');
  });

  it('respects maxTerms limit', () => {
    const prompt = buildGlossaryPrompt(undefined, 3);
    const lines = prompt.split('\n').filter(l => l.startsWith('- **'));
    expect(lines).toHaveLength(3);
  });

  it('returns empty string for empty category', () => {
    // Cast to test edge case
    const prompt = buildGlossaryPrompt(['nonexistent' as GlossaryCategory]);
    expect(prompt).toBe('');
  });
});
