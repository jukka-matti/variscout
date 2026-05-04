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
  // Event-log with cost/duration columns
  // ──────────────────────────────────────────────

  describe('event-log with costColumn', () => {
    const data: DataRow[] = [
      { Batch: 'B1', DefectType: 'Scratch', Cost: 10 },
      { Batch: 'B1', DefectType: 'Scratch', Cost: 15 },
      { Batch: 'B1', DefectType: 'Dent', Cost: 50 },
      { Batch: 'B2', DefectType: 'Scratch', Cost: 12 },
      { Batch: 'B2', DefectType: 'Dent', Cost: 30 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'DefectType',
      costColumn: 'Cost',
    };

    it('sums cost per group into CostTotal column', () => {
      const result = computeDefectRates(data, mapping);

      const b1Scratch = result.data.find(r => r['Batch'] === 'B1' && r['DefectType'] === 'Scratch');
      expect(b1Scratch?.['CostTotal']).toBe(25); // 10 + 15

      const b1Dent = result.data.find(r => r['Batch'] === 'B1' && r['DefectType'] === 'Dent');
      expect(b1Dent?.['CostTotal']).toBe(50);

      const b2Scratch = result.data.find(r => r['Batch'] === 'B2' && r['DefectType'] === 'Scratch');
      expect(b2Scratch?.['CostTotal']).toBe(12);
    });

    it('exposes costColumn as CostTotal in result', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.costColumn).toBe('CostTotal');
    });

    it('still produces DefectCount alongside CostTotal', () => {
      const result = computeDefectRates(data, mapping);
      const b1Scratch = result.data.find(r => r['Batch'] === 'B1' && r['DefectType'] === 'Scratch');
      expect(b1Scratch?.['DefectCount']).toBe(2);
      expect(b1Scratch?.['CostTotal']).toBe(25);
    });
  });

  describe('event-log with durationColumn', () => {
    const data: DataRow[] = [
      { Batch: 'B1', DefectType: 'Scratch', Duration: 5 },
      { Batch: 'B1', DefectType: 'Scratch', Duration: 8 },
      { Batch: 'B1', DefectType: 'Dent', Duration: 20 },
      { Batch: 'B2', DefectType: 'Dent', Duration: 15 },
      { Batch: 'B2', DefectType: 'Dent', Duration: 10 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'DefectType',
      durationColumn: 'Duration',
    };

    it('sums duration per group into DurationTotal column', () => {
      const result = computeDefectRates(data, mapping);

      const b1Scratch = result.data.find(r => r['Batch'] === 'B1' && r['DefectType'] === 'Scratch');
      expect(b1Scratch?.['DurationTotal']).toBe(13); // 5 + 8

      const b2Dent = result.data.find(r => r['Batch'] === 'B2' && r['DefectType'] === 'Dent');
      expect(b2Dent?.['DurationTotal']).toBe(25); // 15 + 10
    });

    it('exposes durationColumn as DurationTotal in result', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.durationColumn).toBe('DurationTotal');
    });
  });

  describe('event-log with both cost and duration', () => {
    const data: DataRow[] = [
      { Batch: 'B1', DefectType: 'X', Cost: 10, Duration: 5 },
      { Batch: 'B1', DefectType: 'X', Cost: 20, Duration: 3 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'DefectType',
      costColumn: 'Cost',
      durationColumn: 'Duration',
    };

    it('produces both CostTotal and DurationTotal', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]['CostTotal']).toBe(30);
      expect(result.data[0]['DurationTotal']).toBe(8);
      expect(result.costColumn).toBe('CostTotal');
      expect(result.durationColumn).toBe('DurationTotal');
    });
  });

  describe('event-log cost with non-numeric values', () => {
    const data: DataRow[] = [
      { Batch: 'B1', DefectType: 'X', Cost: 10 },
      { Batch: 'B1', DefectType: 'X', Cost: 'N/A' },
      { Batch: 'B1', DefectType: 'X', Cost: null },
    ];

    const mapping: DefectMapping = {
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'DefectType',
      costColumn: 'Cost',
    };

    it('skips non-numeric values when summing', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.data[0]['CostTotal']).toBe(10);
    });
  });

  // ──────────────────────────────────────────────
  // Pass-fail with cost/duration
  // ──────────────────────────────────────────────

  describe('pass-fail with costColumn', () => {
    const data: DataRow[] = [
      { Batch: 'B1', Result: 'Fail', Cost: 100 },
      { Batch: 'B1', Result: 'Pass', Cost: 0 },
      { Batch: 'B1', Result: 'Fail', Cost: 50 },
      { Batch: 'B2', Result: 'Fail', Cost: 75 },
      { Batch: 'B2', Result: 'Pass', Cost: 0 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'pass-fail',
      aggregationUnit: 'Batch',
      resultColumn: 'Result',
      costColumn: 'Cost',
    };

    it('sums cost per aggregation group', () => {
      const result = computeDefectRates(data, mapping);
      const b1 = result.data.find(r => r['Batch'] === 'B1');
      expect(b1?.['CostTotal']).toBe(150); // 100 + 0 + 50
      const b2 = result.data.find(r => r['Batch'] === 'B2');
      expect(b2?.['CostTotal']).toBe(75); // 75 + 0
    });

    it('exposes costColumn as CostTotal', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.costColumn).toBe('CostTotal');
    });
  });

  // ──────────────────────────────────────────────
  // Pre-aggregated with cost/duration passthrough
  // ──────────────────────────────────────────────

  describe('pre-aggregated with costColumn passthrough', () => {
    const data: DataRow[] = [
      { Station: 'S1', Defects: 5, TotalCost: 200 },
      { Station: 'S2', Defects: 12, TotalCost: 800 },
    ];

    const mapping: DefectMapping = {
      dataShape: 'pre-aggregated',
      aggregationUnit: 'Station',
      countColumn: 'Defects',
      costColumn: 'TotalCost',
    };

    it('passes costColumn name through directly', () => {
      const result = computeDefectRates(data, mapping);
      expect(result.costColumn).toBe('TotalCost');
      // Data is passed through, so original column name is preserved
      expect(result.data[0]['TotalCost']).toBe(200);
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

  // ──────────────────────────────────────────────
  // Per-step bucketing (stepRejectedAtColumn)
  // ──────────────────────────────────────────────

  describe('per-step bucketing', () => {
    // ── event-log ──────────────────────────────

    describe('event-log shape', () => {
      const data: DataRow[] = [
        { Batch: 'B1', DefectType: 'Scratch', Step: 'Mold', Cost: 10 },
        { Batch: 'B1', DefectType: 'Scratch', Step: 'Mold', Cost: 15 },
        { Batch: 'B1', DefectType: 'Dent', Step: 'Mold', Cost: 5 },
        { Batch: 'B2', DefectType: 'Dent', Step: 'QC', Cost: 20 },
        { Batch: 'B2', DefectType: 'Scratch', Step: 'QC', Cost: 8 },
      ];

      it('absent column → perStep is undefined (regression)', () => {
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          defectTypeColumn: 'DefectType',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeUndefined();
      });

      it('present column → emits per-step rollup with correct counts', () => {
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          defectTypeColumn: 'DefectType',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeDefined();
        expect(result.perStep).toHaveLength(2);

        const mold = result.perStep!.find(s => s.stepKey === 'Mold');
        const qc = result.perStep!.find(s => s.stepKey === 'QC');
        expect(mold?.defectCount).toBe(3);
        expect(qc?.defectCount).toBe(2);
      });

      it('present column + costColumn → costTotal correct per step', () => {
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          defectTypeColumn: 'DefectType',
          stepRejectedAtColumn: 'Step',
          costColumn: 'Cost',
        };
        const result = computeDefectRates(data, mapping);
        const mold = result.perStep!.find(s => s.stepKey === 'Mold');
        const qc = result.perStep!.find(s => s.stepKey === 'QC');
        expect(mold?.costTotal).toBeCloseTo(30); // 10 + 15 + 5
        expect(qc?.costTotal).toBeCloseTo(28); // 20 + 8
      });

      it('sorted descending by defectCount', () => {
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          defectTypeColumn: 'DefectType',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        const counts = result.perStep!.map(s => s.defectCount);
        expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
      });

      it('rows with empty/null step not in perStep but counted in system total', () => {
        const dataWithNulls: DataRow[] = [
          { Batch: 'B1', DefectType: 'Scratch', Step: 'Mold' },
          { Batch: 'B1', DefectType: 'Dent', Step: null },
          { Batch: 'B2', DefectType: 'Scratch', Step: '' },
          { Batch: 'B2', DefectType: 'Dent', Step: 'QC' },
        ];
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(dataWithNulls, mapping);

        // System-level total: 4 rows → DefectCount aggregated by batch
        const systemTotal = result.data.reduce((acc, r) => acc + (r['DefectCount'] as number), 0);
        expect(systemTotal).toBe(4);

        // Only rows with non-empty step appear in perStep
        const perStepTotal = result.perStep!.reduce((acc, s) => acc + s.defectCount, 0);
        expect(perStepTotal).toBe(2); // only Mold + QC rows have valid step keys

        // No entry with an empty key
        expect(result.perStep!.every(s => s.stepKey !== '' && s.stepKey !== 'null')).toBe(true);
      });

      it('defectRate per step is undefined when no unitsProducedColumn', () => {
        const mapping: DefectMapping = {
          dataShape: 'event-log',
          aggregationUnit: 'Batch',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep!.every(s => s.defectRate === undefined)).toBe(true);
      });
    });

    // ── pre-aggregated ──────────────────────────

    describe('pre-aggregated shape', () => {
      const data: DataRow[] = [
        { Station: 'S1', Defects: 5, Step: 'Mold' },
        { Station: 'S2', Defects: 3, Step: 'Mold' },
        { Station: 'S3', Defects: 7, Step: 'QC' },
        { Station: 'S4', Defects: 2, Step: 'QC' },
      ];

      it('absent column → perStep is undefined (regression)', () => {
        const mapping: DefectMapping = {
          dataShape: 'pre-aggregated',
          aggregationUnit: 'Station',
          countColumn: 'Defects',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeUndefined();
      });

      it('present column → sums countColumn per step', () => {
        const mapping: DefectMapping = {
          dataShape: 'pre-aggregated',
          aggregationUnit: 'Station',
          countColumn: 'Defects',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeDefined();
        expect(result.perStep).toHaveLength(2);

        const mold = result.perStep!.find(s => s.stepKey === 'Mold');
        const qc = result.perStep!.find(s => s.stepKey === 'QC');
        expect(mold?.defectCount).toBe(8); // 5 + 3
        expect(qc?.defectCount).toBe(9); // 7 + 2
      });

      it('sorted descending by defectCount', () => {
        const mapping: DefectMapping = {
          dataShape: 'pre-aggregated',
          aggregationUnit: 'Station',
          countColumn: 'Defects',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        const counts = result.perStep!.map(s => s.defectCount);
        expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
      });

      it('rows with null step not in perStep but row-count preserved in data', () => {
        const dataWithNull: DataRow[] = [
          { Station: 'S1', Defects: 5, Step: 'Mold' },
          { Station: 'S2', Defects: 3, Step: null },
        ];
        const mapping: DefectMapping = {
          dataShape: 'pre-aggregated',
          aggregationUnit: 'Station',
          countColumn: 'Defects',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(dataWithNull, mapping);
        // System data unchanged (2 rows pass through)
        expect(result.data).toHaveLength(2);
        // perStep only has Mold (S2 had null step)
        expect(result.perStep).toHaveLength(1);
        expect(result.perStep![0].stepKey).toBe('Mold');
        expect(result.perStep![0].defectCount).toBe(5);
      });
    });

    // ── pass-fail ───────────────────────────────

    describe('pass-fail shape', () => {
      const data: DataRow[] = [
        { Batch: 'B1', Result: 'Fail', Step: 'Mold' },
        { Batch: 'B1', Result: 'Fail', Step: 'Mold' },
        { Batch: 'B1', Result: 'Pass', Step: 'Mold' },
        { Batch: 'B2', Result: 'Fail', Step: 'QC' },
        { Batch: 'B2', Result: 'Pass', Step: 'QC' },
        { Batch: 'B2', Result: 'Fail', Step: 'QC' },
      ];

      it('absent column → perStep is undefined (regression)', () => {
        const mapping: DefectMapping = {
          dataShape: 'pass-fail',
          aggregationUnit: 'Batch',
          resultColumn: 'Result',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeUndefined();
      });

      it('present column → only fail rows bucketed per step', () => {
        const mapping: DefectMapping = {
          dataShape: 'pass-fail',
          aggregationUnit: 'Batch',
          resultColumn: 'Result',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        expect(result.perStep).toBeDefined();
        expect(result.perStep).toHaveLength(2);

        const mold = result.perStep!.find(s => s.stepKey === 'Mold');
        const qc = result.perStep!.find(s => s.stepKey === 'QC');
        // Only fail rows: B1 has 2 fails on Mold, B2 has 2 fails on QC
        expect(mold?.defectCount).toBe(2);
        expect(qc?.defectCount).toBe(2);
      });

      it('sorted descending by defectCount (tie preserves insertion order)', () => {
        const mapping: DefectMapping = {
          dataShape: 'pass-fail',
          aggregationUnit: 'Batch',
          resultColumn: 'Result',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(data, mapping);
        const counts = result.perStep!.map(s => s.defectCount);
        expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
      });

      it('rows with empty step value not in perStep', () => {
        const dataWithEmpty: DataRow[] = [
          { Batch: 'B1', Result: 'Fail', Step: 'Mold' },
          { Batch: 'B1', Result: 'Fail', Step: '' },
          { Batch: 'B1', Result: 'Fail', Step: 'QC' },
        ];
        const mapping: DefectMapping = {
          dataShape: 'pass-fail',
          aggregationUnit: 'Batch',
          resultColumn: 'Result',
          stepRejectedAtColumn: 'Step',
        };
        const result = computeDefectRates(dataWithEmpty, mapping);
        // System level: B1 has 3 fails
        const b1 = result.data.find(r => r['Batch'] === 'B1');
        expect(b1?.['DefectCount']).toBe(3);
        // Only Mold and QC appear in perStep (empty string excluded)
        expect(result.perStep).toHaveLength(2);
        expect(result.perStep!.every(s => s.stepKey !== '')).toBe(true);
      });
    });
  });
});
