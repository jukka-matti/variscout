import { describe, expect, it } from 'vitest';
import type { DataRow } from '../types';
import {
  DATA_PROFILE_REGISTRY,
  detectDataProfiles,
  GENERIC_TABULAR_PROFILE,
} from '../evidenceSources';

const numericRow = (overrides: DataRow = {}): DataRow => ({
  Timestamp: '2026-04-27T00:00:00Z',
  Value: 12.5,
  Channel: 'A',
  ...overrides,
});

describe('GENERIC_TABULAR_PROFILE', () => {
  it('has id, version, label set', () => {
    expect(GENERIC_TABULAR_PROFILE.id).toBe('generic-tabular');
    expect(GENERIC_TABULAR_PROFILE.version).toBe(1);
    expect(GENERIC_TABULAR_PROFILE.label).toMatch(/generic/i);
  });

  it('detect returns null on empty rows', () => {
    expect(GENERIC_TABULAR_PROFILE.detect([])).toBeNull();
  });

  it('detect returns a result for tabular data with at least one numeric column', () => {
    const rows = [numericRow(), numericRow({ Value: 13 }), numericRow({ Value: 14 })];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result).not.toBeNull();
    expect(result?.profileId).toBe('generic-tabular');
    expect(result?.profileVersion).toBe(1);
  });

  it('detect returns medium or high confidence when most columns are numeric', () => {
    const rows = [
      { A: 1, B: 2, C: 3 },
      { A: 4, B: 5, C: 6 },
    ];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result?.confidence === 'medium' || result?.confidence === 'high').toBe(true);
  });

  it('detect returns low confidence when only a small fraction of columns are numeric', () => {
    const rows = [
      { A: 1, B: 'text', C: 'text', D: 'text', E: 'text' },
      { A: 2, B: 'text', C: 'text', D: 'text', E: 'text' },
    ];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result?.confidence).toBe('low');
  });

  it('validate rejects empty rows', () => {
    const result = GENERIC_TABULAR_PROFILE.validate([], {});
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validate accepts non-empty rows', () => {
    const rows = [numericRow()];
    const result = GENERIC_TABULAR_PROFILE.validate(rows, {});
    expect(result.ok).toBe(true);
  });

  it('apply returns identity ProfileApplication', () => {
    const rows = [numericRow(), numericRow({ Value: 99 })];
    const mapping = { outcome: 'Value' };
    const application = GENERIC_TABULAR_PROFILE.apply(rows, mapping);
    expect(application.profileId).toBe('generic-tabular');
    expect(application.profileVersion).toBe(1);
    expect(application.derivedRows).toEqual(rows);
    expect(application.validation.ok).toBe(true);
    expect(application.mapping).toEqual(mapping);
  });
});

describe('DATA_PROFILE_REGISTRY (Phase 3)', () => {
  it('contains both AGENT_REVIEW_LOG_PROFILE and GENERIC_TABULAR_PROFILE', () => {
    const ids = DATA_PROFILE_REGISTRY.map(p => p.id);
    expect(ids).toContain('agent-review-log');
    expect(ids).toContain('generic-tabular');
  });

  it('detectDataProfiles returns generic-tabular for purely numeric data', () => {
    const rows = [
      { Value: 1, Other: 2 },
      { Value: 3, Other: 4 },
    ];
    const matches = detectDataProfiles(rows);
    expect(matches.some(m => m.profileId === 'generic-tabular')).toBe(true);
  });
});
