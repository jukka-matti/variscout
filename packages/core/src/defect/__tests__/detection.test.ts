import { describe, it, expect } from 'vitest';
import { detectDefectFormat, suggestStepRejectedAtColumn } from '../detection';
import type { ColumnAnalysis } from '../../parser/types';
import type { DataRow } from '../../types';

/** Helper to build a ColumnAnalysis entry */
function col(
  name: string,
  type: ColumnAnalysis['type'],
  uniqueCount: number,
  opts?: { hasVariation?: boolean; sampleValues?: string[] }
): ColumnAnalysis {
  return {
    name,
    type,
    uniqueCount,
    hasVariation: opts?.hasVariation ?? uniqueCount > 1,
    missingCount: 0,
    sampleValues: opts?.sampleValues ?? [],
  };
}

describe('detectDefectFormat', () => {
  it('returns no detection for empty data', () => {
    const result = detectDefectFormat([], []);
    expect(result.isDefectFormat).toBe(false);
    expect(result.confidence).toBe('low');
  });

  // ---- Event log detection ----

  describe('event log detection', () => {
    it('detects event log when defect type column exists and no continuous outcome', () => {
      const data: DataRow[] = [
        { Date: '2024-01-01', Defect_Type: 'Scratch', Line: 'A' },
        { Date: '2024-01-01', Defect_Type: 'Dent', Line: 'B' },
        { Date: '2024-01-02', Defect_Type: 'Scratch', Line: 'A' },
      ];
      const columns: ColumnAnalysis[] = [
        col('Date', 'date', 2),
        col('Defect_Type', 'categorical', 2, { sampleValues: ['Scratch', 'Dent'] }),
        col('Line', 'categorical', 2, { sampleValues: ['A', 'B'] }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.dataShape).toBe('event-log');
      expect(result.suggestedMapping.defectTypeColumn).toBe('Defect_Type');
      expect(result.suggestedMapping.dataShape).toBe('event-log');
    });

    it('detects event log with "error_type" column name', () => {
      const data: DataRow[] = [
        { error_type: 'Timeout', server: 'web-01' },
        { error_type: 'OOM', server: 'web-02' },
      ];
      const columns: ColumnAnalysis[] = [
        col('error_type', 'categorical', 2, { sampleValues: ['Timeout', 'OOM'] }),
        col('server', 'categorical', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.dataShape).toBe('event-log');
      expect(result.suggestedMapping.defectTypeColumn).toBe('error_type');
    });

    it('does NOT detect event log when a continuous numeric outcome exists', () => {
      const data: DataRow[] = [
        { Defect_Type: 'Scratch', Weight: 12.5 },
        { Defect_Type: 'Dent', Weight: 13.1 },
      ];
      const columns: ColumnAnalysis[] = [
        col('Defect_Type', 'categorical', 2),
        // Weight has many unique values — looks like continuous measurement
        col('Weight', 'numeric', 50, { hasVariation: true }),
      ];

      const result = detectDefectFormat(data, columns);
      // Should NOT be detected as defect format because Weight looks like a standard Y
      expect(result.isDefectFormat).toBe(false);
    });
  });

  // ---- Pre-aggregated detection ----

  describe('pre-aggregated detection', () => {
    it('detects pre-aggregated when count + type + grouping columns exist', () => {
      const data: DataRow[] = [
        { Date: '2024-01', Defect_Type: 'Scratch', Defect_Count: 5, Units_Produced: 100 },
        { Date: '2024-01', Defect_Type: 'Dent', Defect_Count: 3, Units_Produced: 100 },
        { Date: '2024-02', Defect_Type: 'Scratch', Defect_Count: 2, Units_Produced: 120 },
      ];
      const columns: ColumnAnalysis[] = [
        col('Date', 'date', 2),
        col('Defect_Type', 'categorical', 2, { sampleValues: ['Scratch', 'Dent'] }),
        col('Defect_Count', 'numeric', 3),
        col('Units_Produced', 'numeric', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.dataShape).toBe('pre-aggregated');
      expect(result.suggestedMapping.defectTypeColumn).toBe('Defect_Type');
      expect(result.suggestedMapping.countColumn).toBe('Defect_Count');
      expect(result.suggestedMapping.aggregationUnit).toBe('Date');
      expect(result.suggestedMapping.unitsProducedColumn).toBe('Units_Produced');
    });

    it('detects pre-aggregated with batch grouping column', () => {
      const data: DataRow[] = [
        { Batch: 'B001', Failure_Mode: 'Crack', Rejects: 7 },
        { Batch: 'B002', Failure_Mode: 'Void', Rejects: 2 },
      ];
      const columns: ColumnAnalysis[] = [
        col('Batch', 'categorical', 2, { sampleValues: ['B001', 'B002'] }),
        col('Failure_Mode', 'categorical', 2, { sampleValues: ['Crack', 'Void'] }),
        col('Rejects', 'numeric', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.dataShape).toBe('pre-aggregated');
      expect(result.suggestedMapping.countColumn).toBe('Rejects');
      expect(result.suggestedMapping.aggregationUnit).toBe('Batch');
    });
  });

  // ---- Pass/fail detection ----

  describe('pass/fail detection', () => {
    it('detects pass/fail with matching column name and values', () => {
      const data: DataRow[] = [
        { Part: 'A1', Result: 'Pass', Line: 'L1' },
        { Part: 'A2', Result: 'Fail', Line: 'L1' },
        { Part: 'A3', Result: 'Pass', Line: 'L2' },
      ];
      const columns: ColumnAnalysis[] = [
        col('Part', 'categorical', 3),
        col('Result', 'categorical', 2, { sampleValues: ['Pass', 'Fail'] }),
        col('Line', 'categorical', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.dataShape).toBe('pass-fail');
      expect(result.suggestedMapping.resultColumn).toBe('Result');
    });

    it('detects pass/fail with OK/NG values', () => {
      const data: DataRow[] = [{ Status: 'OK' }, { Status: 'NG' }, { Status: 'OK' }];
      const columns: ColumnAnalysis[] = [
        col('Status', 'categorical', 2, { sampleValues: ['OK', 'NG'] }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.dataShape).toBe('pass-fail');
      expect(result.suggestedMapping.resultColumn).toBe('Status');
    });

    it('detects pass/fail with 0/1 values and keyword column name', () => {
      const data: DataRow[] = [{ Verdict: '0' }, { Verdict: '1' }, { Verdict: '0' }];
      const columns: ColumnAnalysis[] = [
        col('Verdict', 'categorical', 2, { sampleValues: ['0', '1'] }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.dataShape).toBe('pass-fail');
    });

    it('does NOT detect pass/fail when column name does not match keywords', () => {
      const data: DataRow[] = [{ Color: 'Pass' }, { Color: 'Fail' }];
      const columns: ColumnAnalysis[] = [
        col('Color', 'categorical', 2, { sampleValues: ['Pass', 'Fail'] }),
      ];

      const result = detectDefectFormat(data, columns);
      // "Color" is not a pass/fail keyword column
      expect(result.isDefectFormat).toBe(false);
    });
  });

  // ---- False positive resistance ----

  describe('false positive resistance', () => {
    it('does NOT detect defect format for random 0/1 numeric column without keyword name', () => {
      const data: DataRow[] = [
        { Measurement: 12.5, Flag: 0 },
        { Measurement: 13.1, Flag: 1 },
        { Measurement: 11.8, Flag: 0 },
      ];
      const columns: ColumnAnalysis[] = [
        col('Measurement', 'numeric', 50, { hasVariation: true }),
        // Flag is numeric, not categorical, and name doesn't match keywords
        col('Flag', 'numeric', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(false);
    });

    it('does NOT detect defect format for standard variation analysis data', () => {
      const data: DataRow[] = [
        { Shift: 'A', Operator: 'Op1', Weight: 12.45 },
        { Shift: 'B', Operator: 'Op2', Weight: 13.02 },
        { Shift: 'A', Operator: 'Op1', Weight: 12.88 },
      ];
      const columns: ColumnAnalysis[] = [
        col('Shift', 'categorical', 2),
        col('Operator', 'categorical', 2),
        col('Weight', 'numeric', 50, { hasVariation: true }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(false);
    });

    it('returns low confidence when count column exists but no type column', () => {
      const data: DataRow[] = [
        { Date: '2024-01', Count: 5 },
        { Date: '2024-02', Count: 3 },
      ];
      const columns: ColumnAnalysis[] = [col('Date', 'date', 2), col('Count', 'numeric', 2)];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.suggestedMapping.countColumn).toBe('Count');
    });
  });

  // ---- Packaging defects CSV shape ----

  describe('packaging defects CSV data shape', () => {
    it('detects pre-aggregated format with full packaging defects columns', () => {
      const data: DataRow[] = [
        {
          Date: '2024-01-15',
          Product: 'Widget A',
          Units_Produced: 500,
          Defect_Count: 12,
          Defect_Type: 'Seal failure',
          Defect_Percent: 2.4,
        },
        {
          Date: '2024-01-15',
          Product: 'Widget A',
          Units_Produced: 500,
          Defect_Count: 8,
          Defect_Type: 'Label misaligned',
          Defect_Percent: 1.6,
        },
        {
          Date: '2024-01-16',
          Product: 'Widget B',
          Units_Produced: 600,
          Defect_Count: 5,
          Defect_Type: 'Seal failure',
          Defect_Percent: 0.83,
        },
      ];
      const columns: ColumnAnalysis[] = [
        col('Date', 'date', 2),
        col('Product', 'categorical', 2, { sampleValues: ['Widget A', 'Widget B'] }),
        col('Units_Produced', 'numeric', 2),
        col('Defect_Count', 'numeric', 3),
        col('Defect_Type', 'categorical', 2, {
          sampleValues: ['Seal failure', 'Label misaligned'],
        }),
        // Defect_Percent has few unique values — not a continuous outcome
        col('Defect_Percent', 'numeric', 3, { hasVariation: true }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.dataShape).toBe('pre-aggregated');
      expect(result.suggestedMapping.defectTypeColumn).toBe('Defect_Type');
      expect(result.suggestedMapping.countColumn).toBe('Defect_Count');
      expect(result.suggestedMapping.aggregationUnit).toBe('Date');
      expect(result.suggestedMapping.unitsProducedColumn).toBe('Units_Produced');
    });
  });

  // ---- Case-insensitive matching ----

  describe('case-insensitive column name matching', () => {
    it('matches column names regardless of case', () => {
      const data: DataRow[] = [
        { DEFECT_TYPE: 'Scratch', date: '2024-01' },
        { DEFECT_TYPE: 'Dent', date: '2024-02' },
      ];
      const columns: ColumnAnalysis[] = [
        col('DEFECT_TYPE', 'categorical', 2, { sampleValues: ['Scratch', 'Dent'] }),
        col('date', 'date', 2),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.suggestedMapping.defectTypeColumn).toBe('DEFECT_TYPE');
    });

    it('matches column names with spaces and hyphens', () => {
      const data: DataRow[] = [{ 'Defect Type': 'Scratch' }, { 'Defect Type': 'Dent' }];
      const columns: ColumnAnalysis[] = [
        col('Defect Type', 'categorical', 2, { sampleValues: ['Scratch', 'Dent'] }),
      ];

      const result = detectDefectFormat(data, columns);
      expect(result.isDefectFormat).toBe(true);
      expect(result.suggestedMapping.defectTypeColumn).toBe('Defect Type');
    });
  });
});

// ============================================================
// suggestStepRejectedAtColumn — direct unit tests
// ============================================================

describe('suggestStepRejectedAtColumn', () => {
  it('returns the column name on an exact keyword match (step_rejected_at)', () => {
    const columns: ColumnAnalysis[] = [
      col('step_rejected_at', 'categorical', 5),
      col('defect_type', 'categorical', 3),
    ];
    expect(suggestStepRejectedAtColumn(columns)).toBe('step_rejected_at');
  });

  it('returns the column name when the normalized name matches (Step Rejected At)', () => {
    // "Step Rejected At" normalizes to "step_rejected_at"
    const columns: ColumnAnalysis[] = [col('Step Rejected At', 'categorical', 4)];
    expect(suggestStepRejectedAtColumn(columns)).toBe('Step Rejected At');
  });

  it('returns the column name on a substring match (my_reject_step_v2)', () => {
    // Contains 'reject_step'
    const columns: ColumnAnalysis[] = [col('my_reject_step_v2', 'categorical', 6)];
    expect(suggestStepRejectedAtColumn(columns)).toBe('my_reject_step_v2');
  });

  it('prefers the more specific keyword over the generic one', () => {
    // 'defect_step' keyword appears earlier in list than 'step', so it wins
    // over a column whose name only contains 'step'
    const columns: ColumnAnalysis[] = [
      col('process_step', 'categorical', 4),
      col('defect_step', 'categorical', 3),
    ];
    expect(suggestStepRejectedAtColumn(columns)).toBe('defect_step');
  });

  it('returns undefined when no column name matches any keyword', () => {
    const columns: ColumnAnalysis[] = [
      col('defect_type', 'categorical', 3),
      col('batch_id', 'categorical', 10),
      col('line', 'categorical', 2),
    ];
    expect(suggestStepRejectedAtColumn(columns)).toBeUndefined();
  });

  it('returns undefined when the matching column has < 2 unique values', () => {
    // Only 1 unique value — no information content; must be rejected
    const columns: ColumnAnalysis[] = [col('step_rejected_at', 'categorical', 1)];
    expect(suggestStepRejectedAtColumn(columns)).toBeUndefined();
  });

  it('returns undefined when the matching column has > 50 unique values (likely join key)', () => {
    // 51 unique values — exceeds cardinality ceiling; must be rejected
    const columns: ColumnAnalysis[] = [col('step', 'categorical', 51)];
    expect(suggestStepRejectedAtColumn(columns)).toBeUndefined();
  });

  it('accepts a column at exactly the cardinality boundaries (2 and 50)', () => {
    const lowerBound: ColumnAnalysis[] = [col('reject_step', 'categorical', 2)];
    expect(suggestStepRejectedAtColumn(lowerBound)).toBe('reject_step');

    const upperBound: ColumnAnalysis[] = [col('reject_step', 'categorical', 50)];
    expect(suggestStepRejectedAtColumn(upperBound)).toBe('reject_step');
  });

  it('skips numeric columns (only categorical columns qualify)', () => {
    const columns: ColumnAnalysis[] = [
      col('step_rejected_at', 'numeric', 5),
      col('defect_step', 'numeric', 3),
    ];
    expect(suggestStepRejectedAtColumn(columns)).toBeUndefined();
  });

  it('skips date and text columns (only categorical columns qualify)', () => {
    const columns: ColumnAnalysis[] = [
      col('step_rejected_at', 'date', 5),
      col('defect_step', 'text', 3),
    ];
    expect(suggestStepRejectedAtColumn(columns)).toBeUndefined();
  });

  it('returns the first keyword-priority match when multiple columns could match', () => {
    // 'step_rejected_at' keyword has priority 0; 'step' has the last priority
    // A column named 'station_step' contains 'step' — must yield to the specific keyword
    const columns: ColumnAnalysis[] = [
      col('station_step', 'categorical', 4),
      col('step_rejected_at', 'categorical', 3),
    ];
    // step_rejected_at keyword appears before 'step' in STEP_REJECTED_AT_KEYWORDS
    expect(suggestStepRejectedAtColumn(columns)).toBe('step_rejected_at');
  });
});

// ============================================================
// Integration: detectDefectFormat populates stepRejectedAtColumn
// ============================================================

describe('detectDefectFormat — stepRejectedAtColumn integration', () => {
  it('populates stepRejectedAtColumn in pre-aggregated detection when a step column is present', () => {
    const data: DataRow[] = [
      { Date: '2024-01', Defect_Type: 'Scratch', Defect_Count: 5, Step: 'Mold' },
      { Date: '2024-01', Defect_Type: 'Dent', Defect_Count: 3, Step: 'QC' },
    ];
    const columns: ColumnAnalysis[] = [
      col('Date', 'date', 2),
      col('Defect_Type', 'categorical', 2),
      col('Defect_Count', 'numeric', 2),
      col('Step', 'categorical', 2),
    ];

    const result = detectDefectFormat(data, columns);
    expect(result.dataShape).toBe('pre-aggregated');
    expect(result.suggestedMapping.stepRejectedAtColumn).toBe('Step');
  });

  it('populates stepRejectedAtColumn in event-log detection when a step column is present', () => {
    const data: DataRow[] = [
      { Defect_Type: 'Scratch', catch_at_step: 'Mold' },
      { Defect_Type: 'Dent', catch_at_step: 'QC' },
    ];
    const columns: ColumnAnalysis[] = [
      col('Defect_Type', 'categorical', 2),
      // "catch_at_step" contains 'caught_at' substring? No — but it does contain 'step'.
      // Use 'step_caught' instead to hit a specific keyword.
      col('catch_at_step', 'categorical', 2),
    ];

    const result = detectDefectFormat(data, columns);
    expect(result.dataShape).toBe('event-log');
    // "catch_at_step" normalizes to "catch_at_step"; contains 'step' → matched by bare 'step' keyword
    expect(result.suggestedMapping.stepRejectedAtColumn).toBe('catch_at_step');
  });

  it('populates stepRejectedAtColumn in pass-fail detection when a step column is present', () => {
    // 'caught_at_step' matches STEP_REJECTED_AT_KEYWORDS but NOT DEFECT_TYPE_KEYWORDS,
    // so it won't accidentally promote to event-log detection.
    const data: DataRow[] = [
      { Result: 'Pass', caught_at_step: 'Weld' },
      { Result: 'Fail', caught_at_step: 'Weld' },
      { Result: 'Pass', caught_at_step: 'Paint' },
    ];
    const columns: ColumnAnalysis[] = [
      col('Result', 'categorical', 2, { sampleValues: ['Pass', 'Fail'] }),
      col('caught_at_step', 'categorical', 2),
    ];

    const result = detectDefectFormat(data, columns);
    expect(result.dataShape).toBe('pass-fail');
    expect(result.suggestedMapping.stepRejectedAtColumn).toBe('caught_at_step');
  });

  it('leaves stepRejectedAtColumn undefined when no step column is present', () => {
    const data: DataRow[] = [
      { Date: '2024-01', Defect_Type: 'Scratch', Defect_Count: 5 },
      { Date: '2024-02', Defect_Type: 'Dent', Defect_Count: 3 },
    ];
    const columns: ColumnAnalysis[] = [
      col('Date', 'date', 2),
      col('Defect_Type', 'categorical', 2),
      col('Defect_Count', 'numeric', 2),
    ];

    const result = detectDefectFormat(data, columns);
    expect(result.isDefectFormat).toBe(true);
    expect(result.suggestedMapping.stepRejectedAtColumn).toBeUndefined();
  });

  it('does NOT populate stepRejectedAtColumn in low-confidence Detection 4', () => {
    // Use 'station_step' — matches STEP_REJECTED_AT_KEYWORDS via 'step' substring,
    // but does NOT match DEFECT_TYPE_KEYWORDS (avoids accidental event-log promotion).
    const data: DataRow[] = [
      { Date: '2024-01', Count: 5, station_step: 'Mold' },
      { Date: '2024-02', Count: 3, station_step: 'QC' },
    ];
    const columns: ColumnAnalysis[] = [
      col('Date', 'date', 2),
      col('Count', 'numeric', 2),
      col('station_step', 'categorical', 2),
    ];

    // Low-confidence path: count column exists but no defect type column
    const result = detectDefectFormat(data, columns);
    expect(result.isDefectFormat).toBe(false);
    expect(result.confidence).toBe('low');
    // stepRejectedAtColumn must NOT appear in the low-confidence mapping
    expect(result.suggestedMapping.stepRejectedAtColumn).toBeUndefined();
  });

  it('ignores a step column with > 50 unique values (not populated in mapping)', () => {
    const data: DataRow[] = [
      { Date: '2024-01', Defect_Type: 'Scratch', Defect_Count: 5, step: 'x'.repeat(5) },
    ];
    // 51 unique values on the step column — cardinality rejected by suggestStepRejectedAtColumn
    const columns: ColumnAnalysis[] = [
      col('Date', 'date', 2),
      col('Defect_Type', 'categorical', 2),
      col('Defect_Count', 'numeric', 2),
      col('step', 'categorical', 51),
    ];

    const result = detectDefectFormat(data, columns);
    expect(result.isDefectFormat).toBe(true);
    expect(result.suggestedMapping.stepRejectedAtColumn).toBeUndefined();
  });
});
