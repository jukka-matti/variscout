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

describe('profileColumns — skeleton contract', () => {
  it('returns empty array for empty data', () => {
    expect(profileColumns([])).toEqual([]);
  });

  it('returns one profile per column from the union of all row keys', () => {
    const rows = [
      { Speed: '100', Operator: 'A' },
      { Speed: '102', Operator: 'B' },
    ];
    const profiles = profileColumns(rows);
    expect(profiles.map(p => p.columnName).sort()).toEqual(['Operator', 'Speed']);
  });

  it('all profiles have the required fields populated', () => {
    const rows = [{ Speed: '100' }];
    const [profile] = profileColumns(rows);
    expect(profile.columnName).toBe('Speed');
    expect(['ok', 'warning', 'error']).toContain(profile.status);
    expect(typeof profile.confidence).toBe('number');
    expect(profile.confidence).toBeGreaterThanOrEqual(0);
    expect(profile.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(profile.alternatives)).toBe(true);
    expect(Array.isArray(profile.transformedSamples)).toBe(true);
  });

  it('produces an error-status profile for an all-null column', () => {
    const rows = [
      { Empty: null, Real: '100' },
      { Empty: null, Real: '200' },
    ];
    const profiles = profileColumns(rows);
    const empty = profiles.find(p => p.columnName === 'Empty');
    expect(empty?.status).toBe('error');
    expect(empty?.primary).toBeNull();
    expect(empty?.confidence).toBe(0);
  });
});

describe('profileColumns — numeric format detection', () => {
  it('detects plain integers', () => {
    const rows = [{ N: '100' }, { N: '203' }, { N: '198' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('integer');
    expect(profile.status).toBe('ok');
    expect(profile.confidence).toBe(100);
  });

  it('detects EU decimal (consistent comma, 1–2 trailing digits)', () => {
    const rows = [{ Speed: '182,5' }, { Speed: '203,1' }, { Speed: '198,7' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('EU decimal');
    expect(profile.primary?.detail).toMatchObject({ decimalSeparator: ',' });
    expect(profile.transformedSamples).toEqual([
      { raw: '182,5', transformed: '182.5' },
      { raw: '203,1', transformed: '203.1' },
      { raw: '198,7', transformed: '198.7' },
    ]);
  });

  it('detects US format (thousands "," + decimal ".")', () => {
    const rows = [{ Sales: '1,234.5' }, { Sales: '2,001.0' }, { Sales: '987.6' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('US');
    expect(profile.transformedSamples[0]).toEqual({ raw: '1,234.5', transformed: '1234.5' });
  });

  it('handles already-numeric Excel cells as plain numeric', () => {
    const rows = [{ Pre: 182.5 }, { Pre: 203.1 }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.confidence).toBe(100);
  });

  it('prefers US thousands over EU decimal when comma-only column is ambiguous', () => {
    // ['1,234', '5,678', '9,012'] parses under both EU (→ 1.234) and US (→ 1234).
    // No decimal-point or sub-3-digit group disambiguates. Real-world: this is
    // overwhelmingly US thousands. Tie-break must favor US to avoid silently
    // shifting values by 3 orders of magnitude.
    const rows = [{ N: '1,234' }, { N: '5,678' }, { N: '9,012' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('US');
    expect(profile.transformedSamples[0]).toEqual({ raw: '1,234', transformed: '1234' });
  });
});

describe('profileColumns — date format detection', () => {
  it('detects ISO dates (YYYY-MM-DD)', () => {
    const rows = [{ D: '2024-01-15' }, { D: '2024-02-20' }, { D: '2024-03-10' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('ISO');
    expect(profile.status).toBe('ok');
  });

  it('detects DD/MM/YYYY when at least one value has day > 12', () => {
    const rows = [{ D: '25/01/2024' }, { D: '15/02/2024' }, { D: '03/03/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('DD/MM/YYYY');
    expect(profile.status).toBe('ok');
  });

  it('detects MM/DD/YYYY when at least one value has month-position > 12', () => {
    const rows = [{ D: '01/25/2024' }, { D: '02/15/2024' }, { D: '03/03/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('MM/DD/YYYY');
    expect(profile.status).toBe('ok');
  });

  it('flags ambiguous dates as warning when neither position disambiguates', () => {
    const rows = [{ D: '01/02/2024' }, { D: '03/04/2024' }, { D: '05/06/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.status).toBe('warning');
  });

  it('rejects ISO dates with out-of-range fields (month 13)', () => {
    // '2024-13-01' overflows to Jan 1, 2025 via the Date constructor; round-trip
    // check must reject it so it doesn't inflate parseCount.
    const rows = [{ D: '2024-01-15' }, { D: '2024-02-20' }, { D: '2024-13-01' }];
    const [profile] = profileColumns(rows);
    // Only 2 of 3 parse as ISO → ISO does not hit 100% → falls through to
    // either lower-confidence date format or text fallback. Either way, the
    // column must NOT be classified as a clean ISO date column.
    if (profile.primary?.kind === 'date') {
      expect(profile.status).toBe('warning');
    } else {
      expect(profile.primary?.kind).not.toBe('date');
    }
  });

  it('rejects ISO dates with invalid day-of-month (Feb 30)', () => {
    const rows = [{ D: '2024-01-15' }, { D: '2024-02-20' }, { D: '2024-02-30' }];
    const [profile] = profileColumns(rows);
    if (profile.primary?.kind === 'date') {
      expect(profile.status).toBe('warning');
    } else {
      expect(profile.primary?.kind).not.toBe('date');
    }
  });

  it('rejects slash dates with invalid day-of-month (Feb 30)', () => {
    const rows = [{ D: '15/01/2024' }, { D: '20/02/2024' }, { D: '30/02/2024' }];
    const [profile] = profileColumns(rows);
    // 15/01/2024 and 20/02/2024 disambiguate DD/MM; 30/02 should fail round-trip.
    if (profile.primary?.kind === 'date') {
      expect(profile.status).toBe('warning');
    } else {
      expect(profile.primary?.kind).not.toBe('date');
    }
  });
});

describe('profileColumns — affix stripping', () => {
  it('strips currency prefix ($)', () => {
    const rows = [{ Price: '$45.20' }, { Price: '$67.10' }, { Price: '$1,234.50' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ stripPrefix: '$' });
    expect(profile.transformedSamples[0]).toEqual({ raw: '$45.20', transformed: '45.2' });
  });

  it('strips percent suffix (%)', () => {
    const rows = [{ Rate: '12%' }, { Rate: '34%' }, { Rate: '56%' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ stripSuffix: '%' });
  });

  it('strips accounting parens for negatives', () => {
    const rows = [{ Net: '(45)' }, { Net: '(67)' }, { Net: '100' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ parensNegative: true });
    expect(profile.transformedSamples[0]).toEqual({ raw: '(45)', transformed: '-45' });
  });
});

describe('profileColumns — ID heuristic', () => {
  it('detects ID columns with leading zeros + fixed width', () => {
    const rows = [{ Code: '001' }, { Code: '002' }, { Code: '003' }, { Code: '004' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('id');
    expect(profile.primary?.label).toContain('id');
  });

  it('detects alphanumeric IDs (fixed-width prefix + numeric suffix)', () => {
    const rows = [{ Code: 'A123' }, { Code: 'A124' }, { Code: 'A125' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('id');
  });
});
