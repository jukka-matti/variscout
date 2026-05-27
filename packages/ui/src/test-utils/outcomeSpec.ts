import type { OutcomeSpec } from '@variscout/core';

let counter = 0;

/**
 * Test factory for `OutcomeSpec` with deterministic defaults.
 *
 * Defaults model a nominal-is-best diameter outcome (target 10, ±0.5 spec
 * window, Cpk target 1.33 — literature standard). Override any field via the
 * partial argument; the factory merges shallowly.
 *
 * `createdAt` is a fixed Unix-ms timestamp (2026-05-27T00:00:00Z) so tests
 * that snapshot serialized state stay stable. `deletedAt` is `null` (live).
 * `id` is `outcome-test-<n>` with a module-level counter so multiple specs
 * in a single test get distinct identifiers without random bytes.
 */
export function createTestOutcomeSpec(overrides: Partial<OutcomeSpec> = {}): OutcomeSpec {
  counter += 1;
  return {
    id: `outcome-test-${counter}`,
    createdAt: Date.UTC(2026, 4, 27, 0, 0, 0),
    deletedAt: null,
    hubId: 'hub-test',
    columnName: 'Diameter',
    characteristicType: 'nominalIsBest',
    target: 10,
    lsl: 9.5,
    usl: 10.5,
    cpkTarget: 1.33,
    ...overrides,
  };
}
