import { describe, expect, it } from 'vitest';
import { detectStepTimestampPairs } from '../detectStepTimestampPairs';
import type { ColumnAnalysis } from '../../parser/types';

function col(
  name: string,
  type: ColumnAnalysis['type'] = 'date',
  overrides: Partial<ColumnAnalysis> = {}
): ColumnAnalysis {
  return {
    name,
    type,
    uniqueCount: 3,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['2026-01-01', '2026-01-02'],
    ...overrides,
  };
}

describe('detectStepTimestampPairs', () => {
  it('detects complete date-kind start/end pairs before process steps exist', () => {
    const result = detectStepTimestampPairs([
      col('Prep_start'),
      col('Prep_end'),
      col('Assembly_start'),
      col('Assembly_end'),
      col('QC_start'),
      col('QC_end'),
    ]);

    expect(result).toEqual([
      { stepName: 'Assembly', startColumn: 'Assembly_start', endColumn: 'Assembly_end' },
      { stepName: 'Prep', startColumn: 'Prep_start', endColumn: 'Prep_end' },
      { stepName: 'QC', startColumn: 'QC_start', endColumn: 'QC_end' },
    ]);
  });

  it('supports compact _st/_e suffixes from the step-timings wireframe', () => {
    expect(detectStepTimestampPairs([col('Assembly_st'), col('Assembly_e')])).toEqual([
      { stepName: 'Assembly', startColumn: 'Assembly_st', endColumn: 'Assembly_e' },
    ]);
  });

  it('ignores incomplete pairs', () => {
    expect(detectStepTimestampPairs([col('Prep_start'), col('Assembly_end')])).toEqual([]);
  });

  it('ignores non-date channel columns with start/end-like names', () => {
    expect(
      detectStepTimestampPairs([
        col('Head_1_start', 'numeric'),
        col('Head_1_end', 'numeric'),
        col('Timestamp'),
      ])
    ).toEqual([]);
  });

  it('returns pairs in deterministic step-name order regardless of input order', () => {
    const result = detectStepTimestampPairs([
      col('QC_end'),
      col('Prep_start'),
      col('QC_start'),
      col('Assembly_end'),
      col('Prep_end'),
      col('Assembly_start'),
    ]);

    expect(result.map(pair => pair.stepName)).toEqual(['Assembly', 'Prep', 'QC']);
  });
});
