import { describe, expect, it } from 'vitest';
import { buildFindingContext } from '../findingCreation';

describe('buildFindingContext', () => {
  it('stamps the active Y column on finding context', () => {
    const context = buildFindingContext(
      {},
      [{ Weight: 10 }, { Weight: 12 }],
      'Weight',
      { lsl: 8, usl: 14 },
      []
    );

    expect(context.yColumn).toBe('Weight');
    expect(context.stats?.samples).toBe(2);
  });
});
