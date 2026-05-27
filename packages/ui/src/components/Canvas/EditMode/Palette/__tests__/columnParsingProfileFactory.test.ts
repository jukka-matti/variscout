import { describe, it, expect } from 'vitest';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

describe('createTestColumnParsingProfile', () => {
  it('returns a valid ColumnParsingProfile with defaults', () => {
    const profile: ColumnParsingProfile = createTestColumnParsingProfile();
    expect(profile.columnName).toBe('Column');
    expect(profile.status).toBe('ok');
    expect(profile.confidence).toBe(100);
    expect(profile.primary).toEqual({
      kind: 'numeric',
      label: 'numeric · plain',
      detail: {},
    });
    expect(profile.alternatives).toEqual([]);
    expect(profile.transformedSamples).toHaveLength(0);
  });

  it('applies overrides on top of defaults', () => {
    const profile = createTestColumnParsingProfile({
      columnName: 'Defects',
      status: 'warning',
      confidence: 65,
    });
    expect(profile.columnName).toBe('Defects');
    expect(profile.status).toBe('warning');
    expect(profile.confidence).toBe(65);
    expect(profile.primary?.kind).toBe('numeric');
  });
});
