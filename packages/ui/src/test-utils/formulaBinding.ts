import type { FormulaBinding } from '@variscout/core';

let counter = 0;

export function createTestFormulaBinding(overrides: Partial<FormulaBinding> = {}): FormulaBinding {
  counter += 1;
  return {
    id: `formula-test-${counter}`,
    name: `Formula_${counter}`,
    numerator: [{ kind: 'column', column: 'A', sign: '+' }],
    denominator: [],
    multiplier: 1,
    family: 'custom',
    ...overrides,
  };
}
