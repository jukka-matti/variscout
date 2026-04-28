import { describe, it, expect } from 'vitest';

describe('@variscout/core exports — nodeCapability surface', () => {
  it('exposes calculateNodeCapability via the stats sub-path', async () => {
    const stats = await import('@variscout/core/stats');
    expect(typeof stats.calculateNodeCapability).toBe('function');
    expect(typeof stats.lookupSpecRule).toBe('function');
    expect(typeof stats.sampleConfidenceFor).toBe('function');
    expect(typeof stats.isLegacyInvestigation).toBe('function');
    expect(typeof stats.suggestNodeMappings).toBe('function');
  });

  it('exposes thresholds and the helper surface', async () => {
    const stats = await import('@variscout/core/stats');
    expect(stats.SAMPLE_CONFIDENCE_THRESHOLDS.review).toBe(30);
    expect(typeof stats.ruleMatches).toBe('function');
    expect(typeof stats.ruleSpecificity).toBe('function');
  });
});
