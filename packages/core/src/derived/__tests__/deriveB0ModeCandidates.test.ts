import { describe, expect, it } from 'vitest';
import type { DataRow, DefectMapping } from '../../index';
import { deriveB0ModeCandidates } from '../deriveB0ModeCandidates';

const MEASUREMENT_ROWS: DataRow[] = Array.from({ length: 30 }, (_, i) => ({
  Quality_Score: 40 + (i % 12),
  Machine: i % 2 === 0 ? 'A' : 'B',
}));

const DEFECT_ROWS_WITH_UNITS: DataRow[] = [
  { Date: '2026-05-01', Defect_Type: 'Scratch', Shift: 'Day', Units_Produced: 100 },
  { Date: '2026-05-01', Defect_Type: 'Dent', Shift: 'Day', Units_Produced: 100 },
  { Date: '2026-05-02', Defect_Type: 'Scratch', Shift: 'Night', Units_Produced: 200 },
];

const DEFECT_ROWS_WITHOUT_UNITS: DataRow[] = [
  { Date: '2026-05-01', Defect_Type: 'Scratch', Shift: 'Day' },
  { Date: '2026-05-01', Defect_Type: 'Dent', Shift: 'Day' },
  { Date: '2026-05-02', Defect_Type: 'Scratch', Shift: 'Night' },
];

const WIDE_ROWS: DataRow[] = Array.from({ length: 12 }, (_, i) => ({
  Batch: `B${i + 1}`,
  V1: 10 + (i % 5),
  V2: 11 + ((i * 2) % 5),
  V3: 9 + ((i * 3) % 5),
  V4: 12 + ((i * 4) % 5),
}));

const DEFECT_MAPPING_WITH_UNITS: DefectMapping = {
  dataShape: 'event-log',
  aggregationUnit: 'Date',
  defectTypeColumn: 'Defect_Type',
  unitsProducedColumn: 'Units_Produced',
};

const DEFECT_MAPPING_WITHOUT_UNITS: DefectMapping = {
  dataShape: 'event-log',
  aggregationUnit: 'Date',
  defectTypeColumn: 'Defect_Type',
};

describe('deriveB0ModeCandidates', () => {
  it('uses ordinary ranked measurement candidates in standard mode', () => {
    const result = deriveB0ModeCandidates({
      rows: MEASUREMENT_ROWS,
      analysisMode: 'standard',
      selectedOutcome: null,
    });

    expect(result.rows).toBe(MEASUREMENT_ROWS);
    expect(result.defaultOutcomeColumn).toBe('Quality_Score');
    expect(result.yColumns.map(column => column.name)).toEqual(['Quality_Score']);
    expect(result.xColumns.map(column => column.name)).toContain('Machine');
  });

  it('honors an explicit numeric selected outcome even when the heuristic filtered it', () => {
    const rows: DataRow[] = Array.from({ length: 30 }, (_, i) => ({
      Quality_Score: 40 + (i % 12),
      batch_id: 1000 + i,
      Machine: i % 2 === 0 ? 'A' : 'B',
    }));

    const result = deriveB0ModeCandidates({
      rows,
      analysisMode: 'standard',
      selectedOutcome: 'batch_id',
    });

    expect(result.defaultOutcomeColumn).toBe('batch_id');
    expect(result.yColumns.map(column => column.name)[0]).toBe('batch_id');
    expect(result.xColumns.map(column => column.name)).not.toContain('batch_id');
  });

  it('derives defect Count and Rate candidates when units are mapped', () => {
    const result = deriveB0ModeCandidates({
      rows: DEFECT_ROWS_WITH_UNITS,
      analysisMode: 'defect',
      defectMapping: DEFECT_MAPPING_WITH_UNITS,
      selectedOutcome: null,
    });

    expect(Object.keys(DEFECT_ROWS_WITH_UNITS[0])).not.toContain(result.defaultOutcomeColumn);
    expect(result.defaultOutcomeColumn).toBe('DefectRate');
    expect(result.rows[0]).toHaveProperty('DefectRate');
    expect(result.rows[0]).toHaveProperty('DefectCount');
    expect(result.yColumns.map(column => column.name)).toEqual(['DefectRate', 'DefectCount']);
    expect(result.xColumns.map(column => column.name)).toEqual(
      expect.arrayContaining(['Defect_Type', 'Shift'])
    );
  });

  it('defaults defect mode to Count when units are not mapped', () => {
    const result = deriveB0ModeCandidates({
      rows: DEFECT_ROWS_WITHOUT_UNITS,
      analysisMode: 'defect',
      defectMapping: DEFECT_MAPPING_WITHOUT_UNITS,
      selectedOutcome: null,
    });

    expect(result.defaultOutcomeColumn).toBe('DefectCount');
    expect(result.yColumns.map(column => column.name)).toEqual(['DefectCount']);
  });

  it('excludes accepted performance channel siblings from ordinary Y and X candidates', () => {
    const result = deriveB0ModeCandidates({
      rows: WIDE_ROWS,
      analysisMode: 'performance',
      measureColumns: ['V1', 'V2', 'V3', 'V4'],
      selectedOutcome: null,
    });

    expect(result.yColumns.map(column => column.name)).toEqual([]);
    expect(result.xColumns.map(column => column.name)).toEqual(['Batch']);
  });

  it('does not re-add accepted performance channels through an explicit selected outcome', () => {
    const result = deriveB0ModeCandidates({
      rows: WIDE_ROWS,
      analysisMode: 'performance',
      measureColumns: ['V1', 'V2', 'V3', 'V4'],
      selectedOutcome: 'V1',
    });

    expect(result.defaultOutcomeColumn).toBeNull();
    expect(result.yColumns.map(column => column.name)).toEqual([]);
    expect(result.xColumns.map(column => column.name)).toEqual(['Batch']);
  });
});
