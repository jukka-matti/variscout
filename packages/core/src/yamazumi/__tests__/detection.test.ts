import { describe, it, expect } from 'vitest';

import { detectYamazumiFormat } from '../detection';
import type { DataRow } from '../../types';
import type { ColumnAnalysis } from '../../parser/types';

/** Helper to create a minimal ColumnAnalysis */
function col(
  name: string,
  type: 'numeric' | 'categorical' | 'date' | 'text',
  opts: Partial<ColumnAnalysis> = {}
): ColumnAnalysis {
  return {
    name,
    type,
    uniqueCount: opts.uniqueCount ?? 4,
    hasVariation: opts.hasVariation ?? true,
    missingCount: opts.missingCount ?? 0,
    sampleValues: opts.sampleValues ?? [],
  };
}

describe('detectYamazumiFormat', () => {
  describe('high confidence detection', () => {
    it('detects yamazumi format with >80% activity type match', () => {
      const data: DataRow[] = [
        { Step: 'Pick', Activity_Type: 'VA', Cycle_Time: 30 },
        { Step: 'Pick', Activity_Type: 'Waste', Cycle_Time: 15 },
        { Step: 'Pack', Activity_Type: 'NVA-Required', Cycle_Time: 20 },
        { Step: 'Pack', Activity_Type: 'Wait', Cycle_Time: 10 },
        { Step: 'Ship', Activity_Type: 'VA', Cycle_Time: 25 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['Pick', 'Pack', 'Ship'] }),
        col('Activity_Type', 'categorical', {
          sampleValues: ['VA', 'Waste', 'NVA-Required', 'Wait'],
        }),
        col('Cycle_Time', 'numeric', { sampleValues: ['30', '15', '20', '10'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedMapping.activityTypeColumn).toBe('Activity_Type');
      expect(result.suggestedMapping.cycleTimeColumn).toBe('Cycle_Time');
      expect(result.suggestedMapping.stepColumn).toBe('Step');
    });

    it('finds time column by keyword match', () => {
      const data: DataRow[] = [
        { Process_Step: 'A', Type: 'VA', Duration_Seconds: 30 },
        { Process_Step: 'A', Type: 'Waste', Duration_Seconds: 15 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Process_Step', 'categorical', { sampleValues: ['A'] }),
        col('Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Duration_Seconds', 'numeric', { sampleValues: ['30', '15'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.suggestedMapping.cycleTimeColumn).toBe('Duration_Seconds');
    });

    it('finds step column by keyword match', () => {
      const data: DataRow[] = [
        { Station: 'S1', Category: 'VA', Time: 30 },
        { Station: 'S2', Category: 'Waste', Time: 15 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Station', 'categorical', { sampleValues: ['S1', 'S2'] }),
        col('Category', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Time', 'numeric', { sampleValues: ['30', '15'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.suggestedMapping.stepColumn).toBe('Station');
    });
  });

  describe('medium confidence detection', () => {
    it('returns medium confidence when all columns found but lower match rate', () => {
      // 3 out of 5 unique values are activity types → 60% match
      const data: DataRow[] = [
        { Step: 'A', Type: 'VA', CT: 10 },
        { Step: 'B', Type: 'Waste', CT: 20 },
        { Step: 'C', Type: 'Wait', CT: 15 },
        { Step: 'D', Type: 'Setup', CT: 5 },
        { Step: 'E', Type: 'Changeover', CT: 8 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['A', 'B', 'C', 'D', 'E'] }),
        col('Type', 'categorical', {
          sampleValues: ['VA', 'Waste', 'Wait', 'Setup', 'Changeover'],
        }),
        col('CT', 'numeric', { sampleValues: ['10', '20', '15', '5', '8'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('returns medium when activity type column found but no time keyword column', () => {
      const data: DataRow[] = [
        { Step: 'A', Category: 'VA', Value: 30 },
        { Step: 'B', Category: 'Waste', Value: 20 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['A', 'B'] }),
        col('Category', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Value', 'numeric', { sampleValues: ['30', '20'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      // "Value" does not match time keywords, but it's the first numeric with variation → fallback
      expect(result.isYamazumiFormat).toBe(true);
      expect(result.suggestedMapping.cycleTimeColumn).toBe('Value');
    });
  });

  describe('no match scenarios', () => {
    it('returns false when no activity type column found', () => {
      const data: DataRow[] = [
        { Machine: 'M1', Part: 'A', Measurement: 10.5 },
        { Machine: 'M2', Part: 'B', Measurement: 11.2 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Machine', 'categorical', { sampleValues: ['M1', 'M2'] }),
        col('Part', 'categorical', { sampleValues: ['A', 'B'] }),
        col('Measurement', 'numeric', { sampleValues: ['10.5', '11.2'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.isYamazumiFormat).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('No column with activity type values');
    });

    it('returns false for empty data', () => {
      const result = detectYamazumiFormat([], []);

      expect(result.isYamazumiFormat).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('No data');
    });

    it('returns false for empty column analysis', () => {
      const data: DataRow[] = [{ A: 1 }];
      const result = detectYamazumiFormat(data, []);

      expect(result.isYamazumiFormat).toBe(false);
    });

    it('returns false when activity type match rate is below 60%', () => {
      // Only 1 out of 4 unique values matches → 25%
      const data: DataRow[] = [
        { Step: 'A', Type: 'VA', CT: 10 },
        { Step: 'B', Type: 'Assembly', CT: 20 },
        { Step: 'C', Type: 'Inspection', CT: 15 },
        { Step: 'D', Type: 'Transport', CT: 5 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['A', 'B', 'C', 'D'] }),
        col('Type', 'categorical', {
          sampleValues: ['VA', 'Assembly', 'Inspection', 'Transport'],
        }),
        col('CT', 'numeric', { sampleValues: ['10', '20'] }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.isYamazumiFormat).toBe(false);
    });
  });

  describe('optional column detection', () => {
    const baseData: DataRow[] = [
      {
        Step: 'Pick',
        Activity_Type: 'VA',
        Cycle_Time: 30,
        Reason: 'None',
        Product: 'Widget',
        Wait_Queue: 5,
      },
      {
        Step: 'Pack',
        Activity_Type: 'Waste',
        Cycle_Time: 15,
        Reason: 'Defect',
        Product: 'Gadget',
        Wait_Queue: 3,
      },
    ];

    it('detects reason column', () => {
      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['Pick', 'Pack'] }),
        col('Activity_Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Cycle_Time', 'numeric'),
        col('Reason', 'categorical', { sampleValues: ['None', 'Defect'] }),
      ];

      const result = detectYamazumiFormat(baseData, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.suggestedMapping.reasonColumn).toBe('Reason');
    });

    it('detects product column', () => {
      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['Pick', 'Pack'] }),
        col('Activity_Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Cycle_Time', 'numeric'),
        col('Product', 'categorical', { sampleValues: ['Widget', 'Gadget'] }),
      ];

      const result = detectYamazumiFormat(baseData, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.suggestedMapping.productColumn).toBe('Product');
    });

    it('detects wait time column', () => {
      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['Pick', 'Pack'] }),
        col('Activity_Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Cycle_Time', 'numeric'),
        col('Wait_Queue', 'numeric', { sampleValues: ['5', '3'] }),
      ];

      const result = detectYamazumiFormat(baseData, columns);

      expect(result.isYamazumiFormat).toBe(true);
      expect(result.suggestedMapping.waitTimeColumn).toBe('Wait_Queue');
    });

    it('detects multiple optional columns at once', () => {
      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['Pick', 'Pack'] }),
        col('Activity_Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Cycle_Time', 'numeric'),
        col('Reason', 'categorical', { sampleValues: ['None', 'Defect'] }),
        col('Product', 'categorical', { sampleValues: ['Widget', 'Gadget'] }),
        col('Wait_Queue', 'numeric', { sampleValues: ['5', '3'] }),
      ];

      const result = detectYamazumiFormat(baseData, columns);

      expect(result.suggestedMapping.reasonColumn).toBe('Reason');
      expect(result.suggestedMapping.productColumn).toBe('Product');
      expect(result.suggestedMapping.waitTimeColumn).toBe('Wait_Queue');
    });
  });

  describe('fallback column matching', () => {
    it('uses first numeric column with variation as cycle time fallback', () => {
      const data: DataRow[] = [
        { Process: 'A', Type: 'VA', Measurement: 30 },
        { Process: 'B', Type: 'Waste', Measurement: 20 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Process', 'categorical', { sampleValues: ['A', 'B'] }),
        col('Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        // No time keywords in name
        col('Measurement', 'numeric', { hasVariation: true }),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.suggestedMapping.cycleTimeColumn).toBe('Measurement');
    });

    it('uses first categorical column as step fallback', () => {
      const data: DataRow[] = [
        { Label: 'Step1', Category: 'VA', Time: 30 },
        { Label: 'Step2', Category: 'Waste', Time: 20 },
      ];

      const columns: ColumnAnalysis[] = [
        // "Label" does not match step keywords but is categorical with variation
        col('Label', 'categorical', { sampleValues: ['Step1', 'Step2'] }),
        col('Category', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('Time', 'numeric'),
      ];

      const result = detectYamazumiFormat(data, columns);

      // Category matched as activityTypeColumn, Label as step fallback
      expect(result.suggestedMapping.stepColumn).toBe('Label');
    });
  });

  describe('reason message', () => {
    it('includes match rate in reason when detected', () => {
      const data: DataRow[] = [
        { Step: 'A', Type: 'VA', CT: 10 },
        { Step: 'B', Type: 'Waste', CT: 20 },
      ];

      const columns: ColumnAnalysis[] = [
        col('Step', 'categorical', { sampleValues: ['A', 'B'] }),
        col('Type', 'categorical', { sampleValues: ['VA', 'Waste'] }),
        col('CT', 'numeric'),
      ];

      const result = detectYamazumiFormat(data, columns);

      expect(result.reason).toContain('100%');
      expect(result.reason).toContain('Type');
    });
  });
});
