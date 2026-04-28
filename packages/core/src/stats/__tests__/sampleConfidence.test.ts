import { describe, it, expect } from 'vitest';
import { sampleConfidenceFor, SAMPLE_CONFIDENCE_THRESHOLDS } from '../sampleConfidence';

describe('sampleConfidenceFor', () => {
  it('returns "insufficient" for n < 10', () => {
    expect(sampleConfidenceFor(0)).toBe('insufficient');
    expect(sampleConfidenceFor(1)).toBe('insufficient');
    expect(sampleConfidenceFor(9)).toBe('insufficient');
  });

  it('returns "review" for 10 <= n < 30', () => {
    expect(sampleConfidenceFor(10)).toBe('review');
    expect(sampleConfidenceFor(20)).toBe('review');
    expect(sampleConfidenceFor(29)).toBe('review');
  });

  it('returns "trust" for n >= 30', () => {
    expect(sampleConfidenceFor(30)).toBe('trust');
    expect(sampleConfidenceFor(100)).toBe('trust');
    expect(sampleConfidenceFor(10_000)).toBe('trust');
  });

  it('handles fractional n by flooring (defensive — should not occur in practice)', () => {
    expect(sampleConfidenceFor(29.9)).toBe('review');
    expect(sampleConfidenceFor(30.0)).toBe('trust');
  });

  it('exports thresholds for UI badge use', () => {
    expect(SAMPLE_CONFIDENCE_THRESHOLDS.insufficient).toBe(10);
    expect(SAMPLE_CONFIDENCE_THRESHOLDS.review).toBe(30);
  });
});
