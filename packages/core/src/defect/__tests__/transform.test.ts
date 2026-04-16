import { describe, it, expect } from 'vitest';
import { computeDefectRates } from '../transform';
import type { DefectMapping } from '../types';
import type { DataRow } from '../../types';

describe('computeDefectRates', () => {
  // ──────────────────────────────────────────────
  // Event Log
  // ──────────────────────────────────────────────

  describe('event-log shape', () => {
    const eventLogData: DataRow[] = [
      { Batch: 'B1', DefectType: 'Scratch', Line: 'A' },
      { Batch: 'B1', DefectType: 'Scratch', Line: 'A' },
      { Batch: 'B1', DefectType: 'Dent', Line: 'B' },
      { Batch: 'B2', DefectType: 'Scratch', Line: 'A' },
      { Batch: 'B2', DefectType: 'Dent', Line: 'A' },
      { Batch: 'B2', DefectType: 'Dent', Line: 'B' },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'DefectType',
    };

    it('aggregates 6 raw events into 4 rows (2 batches x 2 types)', () => {
      const result = computeDefectRates(eventLogData, mapping);
      expect(result.data).toHaveLength(4);
    });

    it('uses DefectCount as outcome when no unitsProduced', () => {
      const result = computeDefectRates(eventLogData, mapping);
      expect(result.outcomeColumn).toBe('DefectCount');
    });

    it('counts defects correctly per group', () => {
      const result = computeDefectRates(eventLogData, mapping);

      const b1Scratch = result.data.find(r => r['Batch'] === 'B1' && r['DefectType'] === 'Scratch');
      expect(b1Scratch?.['DefectCount']).toBe(2);

      const b2Dent = result.data.find(r => r['Batch'] === 'B2' && r['DefectType'] === 'Dent');
      expect(b2Dent?.['DefectCount']).toBe(2);
    });

    it('includes DefectType and Line as factors', () => {
      const result = computeDefectRates(eventLogData, mapping);
      expect(result.factors).toContain('DefectType');
      expect(result.factors).toContain('Line');
    });

    it('does not include aggregationUnit in factors', () => {
      const result = computeDefectRates(eventLogData, mapping);
      expect(result.factors).not.toContain('Batch');
    });
  });

  describe('event-log with unitsProduced', () => {
    const data: DataRow[] = [
      { Week: 'W1', DefectType: 'Crack', Units: 100 },
      { Week: 'W1', DefectType: 'Crack', Units: 100 },
      { Week: 'W1', DefectType: 'Crack', Units: 100 },
      { Week: 'W2', DefectType: 'Crack', Units: 200 },
      { Week: 'W2', DefectType: 'Crack', Units: 200 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Week',
      defectTypeColumn: 'DefectType',
      unitsProducedColumn: 'Units',
    };

    it('computes rate = count / units', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.outcomeColumn).toBe('DefectRate');

      const w1 = result.data.find(r => r['Week'] === 'W1');
      expect(w1?.['DefectRate']).toBeCloseTo(3 / 100);

      const w2 = result.data.find(r => r['Week'] === 'W2');
      expect(w2?.['DefectRate']).toBeCloseTo(2 / 200);
    });
  });

  // ──────────────────────────────────────────────
  // Pre-aggregated
  // ──────────────────────────────────────────────

  describe('pre-aggregated shape', () => {
    const preAggData: DataRow[] = [
      { Station: 'S1', Defects: 5, Category: 'Appearance' },
      { Station: 'S2', Defects: 12, Category: 'Dimension' },
      { Station: 'S3', Defects: 3, Category: 'Appearance' },
    ];

    const mapping: DefectMapping = {
      dataShape: 'pre-aggregated',
      aggregationUnit: 'Station',
      countColumn: 'Defects',
    };

    it('passes through data unchanged', () => {
      const result = computeDefectRates(preAggData, mapping);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]['Defects']).toBe(5);
      expect(result.data[1]['Defects']).toBe(12);
    });

    it('uses countColumn as outcomeColumn', () => {
      const result = computeDefectRates(preAggData, mapping);
      expect(result.outcomeColumn).toBe('Defects');
    });

    it('identifies categorical columns as factors', () => {
      const result = computeDefectRates(preAggData, mapping);
      expect(result.factors).toContain('Category');
      expect(result.factors).not.toContain('Station'); // excluded as aggregationUnit
    });
  });

  // ──────────────────────────────────────────────
  // Pass/fail
  // ──────────────────────────────────────────────

  describe('pass-fail shape', () => {
    const passFailData: DataRow[] = [
      { Batch: 'B1', Result: 'Pass', Operator: 'Alice' },
      { Batch: 'B1', Result: 'Pass', Operator: 'Alice' },
      { Batch: 'B1', Result: 'Fail', Operator: 'Alice' },
      { Batch: 'B1', Result: 'Pass', Operator: 'Bob' },
      { Batch: 'B1', Result: 'Fail', Operator: 'Bob' },
      { Batch: 'B2', Result: 'Pass', Operator: 'Alice' },
      { Batch: 'B2', Result: 'Pass', Operator: 'Alice' },
      { Batch: 'B2', Result: 'Pass', Operator: 'Alice' },
      { Batch: 'B2', Result: 'Fail', Operator: 'Alice' },
      { Batch: 'B2', Result: 'Pass', Operator: 'Alice' },
    ];

    const mapping: DefectMapping = {
      dataShape: 'pass-fail',
      aggregationUnit: 'Batch',
      resultColumn: 'Result',
    };

    it('aggregates 10 units into 2 groups', () => {
      const result = computeDefectRates(passFailData, mapping);
      expect(result.data).toHaveLength(2);
    });

    it('computes correct defect rate', () => {
      const result = computeDefectRates(passFailData, mapping);

      const b1 = result.data.find(r => r['Batch'] === 'B1');
      expect(b1?.['DefectCount']).toBe(2);
      expect(b1?.['DefectRate']).toBeCloseTo(2 / 5);
      expect(b1?.['TotalUnits']).toBe(5);

      const b2 = result.data.find(r => r['Batch'] === 'B2');
      expect(b2?.['DefectCount']).toBe(1);
      expect(b2?.['DefectRate']).toBeCloseTo(1 / 5);
      expect(b2?.['TotalUnits']).toBe(5);
    });

    it('uses DefectRate as outcomeColumn', () => {
      const result = computeDefectRates(passFailData, mapping);
      expect(result.outcomeColumn).toBe('DefectRate');
    });

    it('excludes aggregationUnit and resultColumn from factors', () => {
      const result = computeDefectRates(passFailData, mapping);
      expect(result.factors).not.toContain('Batch');
      expect(result.factors).not.toContain('Result');
      expect(result.factors).toContain('Operator');
    });

    it('recognizes case-insensitive fail values (OK/NG)', () => {
      const ngData: DataRow[] = [
        { Lot: 'L1', Status: 'ok' },
        { Lot: 'L1', Status: 'ng' },
        { Lot: 'L1', Status: 'NG' },
      ];
      const ngMapping: DefectMapping = {
        dataShape: 'pass-fail',
        aggregationUnit: 'Lot',
        resultColumn: 'Status',
      };
      const result = computeDefectRates(ngData, ngMapping);
      const l1 = result.data[0];
      expect(l1?.['DefectCount']).toBe(2);
      expect(l1?.['DefectRate']).toBeCloseTo(2 / 3);
    });
  });

  // ──────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty result for empty data', () => {
      const mapping: DefectMapping = {
        dataShape: 'event-log',
        aggregationUnit: 'Batch',
        defectTypeColumn: 'Type',
      };
      const result = computeDefectRates([], mapping);
      expect(result.data).toHaveLength(0);
      expect(result.outcomeColumn).toBe('DefectCount');
      expect(result.factors).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────
  // Factor preservation
  // ──────────────────────────────────────────────

  describe('factor preservation', () => {
    it('preserves most frequent value per group (mode)', () => {
      const data: DataRow[] = [
        { Day: 'Mon', DefectType: 'X', Shift: 'Morning' },
        { Day: 'Mon', DefectType: 'X', Shift: 'Morning' },
        { Day: 'Mon', DefectType: 'X', Shift: 'Evening' },
      ];
      const mapping: DefectMapping = {
        dataShape: 'event-log',
        aggregationUnit: 'Day',
        defectTypeColumn: 'DefectType',
      };
      const result = computeDefectRates(data, mapping);
      const monX = result.data.find(r => r['Day'] === 'Mon' && r['DefectType'] === 'X');
      expect(monX?.['Shift']).toBe('Morning');
    });
  });

  // ──────────────────────────────────────────────
  // Re-aggregation (simulates filter change)
  // ──────────────────────────────────────────────

  describe('re-aggregation after filtering', () => {
    it('produces only matching rows when filtered data is provided', () => {
      const allData: DataRow[] = [
        { Batch: 'B1', DefectType: 'Scratch' },
        { Batch: 'B1', DefectType: 'Dent' },
        { Batch: 'B2', DefectType: 'Scratch' },
        { Batch: 'B2', DefectType: 'Dent' },
      ];
      const mapping: DefectMapping = {
        dataShape: 'event-log',
        aggregationUnit: 'Batch',
        defectTypeColumn: 'DefectType',
      };

      // Simulate filtering to only Scratch
      const filtered = allData.filter(r => r['DefectType'] === 'Scratch');
      const result = computeDefectRates(filtered, mapping);
      expect(result.data).toHaveLength(2); // B1+Scratch, B2+Scratch
      expect(result.data.every(r => r['DefectType'] === 'Scratch')).toBe(true);
    });
  });
});
