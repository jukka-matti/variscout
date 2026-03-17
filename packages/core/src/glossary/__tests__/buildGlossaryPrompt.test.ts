import { describe, it, expect } from 'vitest';
import { buildGlossaryPrompt } from '../buildGlossaryPrompt';

describe('buildGlossaryPrompt', () => {
  it('returns a non-empty string with all terms', () => {
    const result = buildGlossaryPrompt();
    expect(result).toContain('## Terminology');
    expect(result.length).toBeGreaterThan(100);
  });

  it('filters by category', () => {
    const result = buildGlossaryPrompt(['capability']);
    expect(result).toContain('Cpk');
    expect(result).not.toContain('UCL');
  });

  it('respects maxTerms', () => {
    const result = buildGlossaryPrompt(undefined, 3);
    const termCount = (result.match(/^- \*\*/gm) || []).length;
    expect(termCount).toBeLessThanOrEqual(3);
  });

  it('returns empty string when no terms match', () => {
    const result = buildGlossaryPrompt([], 0);
    expect(result).toBe('');
  });

  it('includes methodology concepts when includeConcepts is true', () => {
    const result = buildGlossaryPrompt(undefined, 40, { includeConcepts: true });
    expect(result).toContain('## Methodology Concepts');
    expect(result).toContain('Four Lenses');
    expect(result).toContain('Two Voices');
    expect(result).toContain('Progressive Stratification');
  });

  it('does not include concepts by default', () => {
    const result = buildGlossaryPrompt();
    expect(result).not.toContain('## Methodology Concepts');
  });

  it('does not include concepts when includeConcepts is false', () => {
    const result = buildGlossaryPrompt(undefined, 40, { includeConcepts: false });
    expect(result).not.toContain('## Methodology Concepts');
  });

  it('includes both sections when includeConcepts is true', () => {
    const result = buildGlossaryPrompt(['methodology'], 10, { includeConcepts: true });
    expect(result).toContain('## Terminology');
    expect(result).toContain('## Methodology Concepts');
  });

  it('includes German bilingual sub-lines when locale is de', () => {
    const result = buildGlossaryPrompt(['capability'], 5, { locale: 'de' });
    // Should contain English term plus German sub-line
    expect(result).toContain('Cpk');
    // German glossary has OPG or similar for capability terms
    expect(result).toMatch(/DE: \*\*/);
  });

  it('does not include sub-lines when locale is en', () => {
    const result = buildGlossaryPrompt(['capability'], 5, { locale: 'en' });
    expect(result).not.toMatch(/[A-Z]{2}: \*\*/);
  });

  it('does not include sub-lines when locale is undefined', () => {
    const result = buildGlossaryPrompt(['capability'], 5);
    expect(result).not.toMatch(/[A-Z]{2}: \*\*/);
  });

  it('only includes sub-line when localized label differs from English', () => {
    const result = buildGlossaryPrompt(['capability'], 40, { locale: 'de' });
    // Every sub-line should have a DE: prefix
    const subLines = result.split('\n').filter(l => l.trim().startsWith('DE:'));
    expect(subLines.length).toBeGreaterThan(0);
    // English-only terms should not have sub-lines
    for (const line of subLines) {
      expect(line).toContain('DE: **');
    }
  });
});
