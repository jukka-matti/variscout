import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';

/**
 * Test factory for `ImprovementProjectFactorControl` with sensible defaults.
 *
 * Defaults model a temperature factor with a target window (literature standard
 * "120 ± 5°C"). `linkedHypothesisId` and `stepId` are undefined by default —
 * controls are global until a step is bound. Override any field via the
 * partial argument; the factory merges shallowly.
 */
export function createTestFactorControl(
  overrides: Partial<ImprovementProjectFactorControl> = {}
): ImprovementProjectFactorControl {
  return {
    factor: 'Temperature',
    targetCondition: '120 ± 5°C',
    ...overrides,
  };
}
