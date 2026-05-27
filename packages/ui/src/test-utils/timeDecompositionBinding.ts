import type { TimeDecompositionBinding } from '@variscout/core';

export function createTestTimeDecompositionBinding(
  overrides: Partial<TimeDecompositionBinding> = {}
): TimeDecompositionBinding {
  return {
    id: 'test-tdb-1',
    sourceColumn: 'Date',
    dimensions: ['year', 'month'],
    ...overrides,
  };
}
