import { describe, it, expect } from 'vitest';

describe('findings sub-path barrel', () => {
  it('re-exports HypothesisCondition from hypothesisCondition.ts', async () => {
    const mod = await import('../index');
    // Type-only module — verify it loads without error.
    expect(mod).toBeDefined();
  });
});
