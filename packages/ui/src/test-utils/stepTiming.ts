import type { StepTimingBinding } from '@variscout/core';

let counter = 0;

/**
 * Test factory for `StepTimingBinding`. Defaults to `'paired'` kind.
 *
 * - `'paired'`   : `{ kind, stepId, startColumn, endColumn }`
 * - `'duration'` : `{ kind, stepId, durationColumn }`
 *
 * Pass `{ kind: 'duration' }` to override the discriminant; remaining fields
 * fall through `...overrides`.
 */
export function createTestStepTiming(
  overrides: Partial<StepTimingBinding> & { kind?: 'paired' | 'duration' } = {}
): StepTimingBinding {
  counter += 1;
  const kind = overrides.kind ?? 'paired';
  if (kind === 'paired') {
    return {
      kind: 'paired',
      stepId: `step-test-${counter}`,
      startColumn: 'Start',
      endColumn: 'End',
      ...overrides,
    } as StepTimingBinding;
  }
  return {
    kind: 'duration',
    stepId: `step-test-${counter}`,
    durationColumn: 'Duration',
    ...overrides,
  } as StepTimingBinding;
}
