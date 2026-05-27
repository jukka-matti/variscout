export interface TestStep {
  id: string;
  name: string;
  order: number;
}

let counter = 0;

export function createTestStep(overrides: Partial<TestStep> = {}): TestStep {
  counter += 1;
  return {
    id: `step-test-${counter}`,
    name: `Step ${counter}`,
    order: counter - 1,
    ...overrides,
  };
}
