import type { ColumnParsingProfile } from '@variscout/core/parser';

export function createTestColumnParsingProfile(
  overrides: Partial<ColumnParsingProfile> = {}
): ColumnParsingProfile {
  return {
    columnName: 'Column',
    status: 'ok',
    confidence: 100,
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
    alternatives: [],
    transformedSamples: [],
    ...overrides,
  };
}
