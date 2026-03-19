import { describe, it, expect } from 'vitest';
import { interpretEvidence, generateAnovaInsightLine } from '../evidence';

describe('interpretEvidence', () => {
  it('returns strong evidence for p < 0.01', () => {
    const result = interpretEvidence({
      etaSquared: 0.2,
      pValue: 0.005,
      totalN: 100,
      groupCount: 3,
    });
    expect(result.evidenceLevel).toBe('strong');
  });

  it('returns moderate evidence for 0.01 <= p < 0.05', () => {
    const result = interpretEvidence({ etaSquared: 0.1, pValue: 0.03, totalN: 50, groupCount: 4 });
    expect(result.evidenceLevel).toBe('moderate');
  });

  it('returns weak evidence for 0.05 <= p < 0.10', () => {
    const result = interpretEvidence({ etaSquared: 0.2, pValue: 0.07, totalN: 30, groupCount: 3 });
    expect(result.evidenceLevel).toBe('weak');
  });

  it('returns insufficient evidence for p >= 0.10', () => {
    const result = interpretEvidence({ etaSquared: 0.02, pValue: 0.5, totalN: 20, groupCount: 2 });
    expect(result.evidenceLevel).toBe('insufficient');
  });

  it('includes a message with {topCategory} placeholder', () => {
    const result = interpretEvidence({ etaSquared: 0.2, pValue: 0.01, totalN: 100, groupCount: 3 });
    expect(result.message).toContain('{topCategory}');
  });
});

describe('generateAnovaInsightLine', () => {
  it('high η² + strong p: names category and suggests selection', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.25,
      pValue: 0.001,
      topCategoryName: 'Machine A',
    });
    expect(text).toBe('Machine A stands out — select it to see how other factors behave');
  });

  it('high η² + weak p: names category, suggests gemba/expert', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.2,
      pValue: 0.07,
      topCategoryName: 'Shift B',
    });
    expect(text).toBe('Shift B shows a pattern — strengthen with gemba or expert evidence');
  });

  it('high η² + insufficient p: generic pattern message', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.18,
      pValue: 0.15,
      topCategoryName: 'Line 3',
    });
    expect(text).toBe('Data shows a pattern — strengthen with gemba or expert evidence');
  });

  it('medium η² + strong p: contributing cause', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.1,
      pValue: 0.02,
      topCategoryName: 'Operator X',
    });
    expect(text).toBe(
      "Operator X contributes but isn't the primary driver — could be a contributing cause"
    );
  });

  it('medium η² + insufficient p: no clear pattern', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.08,
      pValue: 0.12,
      topCategoryName: 'Shift',
    });
    expect(text).toBe('No clear pattern for this factor');
  });

  it('small η² + very strong p: detectable but small', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.03,
      pValue: 0.0005,
      topCategoryName: 'Day',
    });
    expect(text).toBe('Detectable but small — other factors explain more');
  });

  it('small η² + weak p: no clear pattern', () => {
    const text = generateAnovaInsightLine({
      etaSquared: 0.02,
      pValue: 0.3,
      topCategoryName: 'Tool',
    });
    expect(text).toBe('No clear pattern for this factor');
  });
});
