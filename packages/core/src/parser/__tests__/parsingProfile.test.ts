import { describe, it, expect } from 'vitest';
import { profileColumns } from '../parsingProfile';
import type {
  ColumnParsingProfile,
  ParsingStatus,
  ParsingInterpretation,
  ParsingAlternative,
} from '../types';

describe('parsingProfile — type surface', () => {
  it('exports profileColumns as a callable function', () => {
    expect(typeof profileColumns).toBe('function');
  });

  it('ColumnParsingProfile has required fields', () => {
    const profile: ColumnParsingProfile = {
      columnName: 'Speed',
      status: 'ok',
      confidence: 100,
      primary: { kind: 'numeric', label: 'numeric · plain integer', detail: {} },
      alternatives: [],
      transformedSamples: [],
    };
    expect(profile.columnName).toBe('Speed');
  });

  it('ParsingStatus union has ok / warning / error', () => {
    const s1: ParsingStatus = 'ok';
    const s2: ParsingStatus = 'warning';
    const s3: ParsingStatus = 'error';
    expect([s1, s2, s3]).toEqual(['ok', 'warning', 'error']);
  });

  it('ParsingInterpretation is constructable', () => {
    const interp: ParsingInterpretation = {
      kind: 'numeric',
      label: 'numeric · plain integer',
      detail: {},
    };
    expect(interp.kind).toBe('numeric');
  });

  it('ParsingAlternative is constructable', () => {
    const alt: ParsingAlternative = {
      interpretation: { kind: 'numeric', label: 'numeric · plain integer', detail: {} },
      parseCount: 5,
      totalCount: 5,
    };
    expect(alt.parseCount).toBe(5);
  });
});
