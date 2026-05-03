/**
 * Tests for the Y-likelihood ranking heuristic.
 *
 * Pure function — no React, no async, no fixtures.
 * Each test sets up a small ColumnAnalysis array and asserts ordering / exclusion.
 */

import { describe, it, expect } from 'vitest';
import { rankYCandidates } from '../yLikelihood';
import type { ColumnAnalysis } from '../types';

function col(overrides: Partial<ColumnAnalysis> & { name: string }): ColumnAnalysis {
  return {
    name: overrides.name,
    type: overrides.type ?? 'numeric',
    uniqueCount: overrides.uniqueCount ?? 50,
    hasVariation: overrides.hasVariation ?? true,
    missingCount: overrides.missingCount ?? 0,
    sampleValues: overrides.sampleValues ?? ['1', '2', '3'],
  };
}

describe('rankYCandidates', () => {
  it('returns empty for empty input', () => {
    expect(rankYCandidates([])).toEqual([]);
  });

  it('excludes datetime / date columns by name', () => {
    const dateNames = ['Lot_Start_DateTime', 'created_at', 'event_dt', 'EventTime', 'EndDate'];
    // Even if mistakenly typed as numeric, the time-like name pattern excludes them.
    const cols = dateNames.map(name => col({ name, type: 'numeric' }));
    const ranked = rankYCandidates(cols);
    expect(ranked).toEqual([]);
  });

  it('excludes ID-like columns', () => {
    const idNames = ['id', 'lot_id', 'serial_uuid', 'row_num', 'seq_num'];
    const cols = idNames.map(name => col({ name, type: 'numeric' }));
    const ranked = rankYCandidates(cols);
    expect(ranked).toEqual([]);
  });

  it('excludes non-numeric types', () => {
    const cols: ColumnAnalysis[] = [
      col({ name: 'Material_Type', type: 'categorical' }),
      col({ name: 'Operator_Note', type: 'text' }),
      col({ name: 'Timestamp', type: 'date' }),
    ];
    const ranked = rankYCandidates(cols);
    expect(ranked).toEqual([]);
  });

  it('excludes numeric columns with no variation', () => {
    const cols: ColumnAnalysis[] = [
      col({ name: 'Constant_Value', type: 'numeric', hasVariation: false }),
    ];
    const ranked = rankYCandidates(cols);
    expect(ranked).toEqual([]);
  });

  it('feather dataset case: Down_Content_% ranks first, Input_Quantity_kg second', () => {
    // The user's real dataset shape — verify the canonical ordering:
    // Down_Content_% hits BOTH '%' AND 'content' (cap reached at +1.0),
    // outranking Input_Quantity_kg which only hits 'weight'.
    const cols: ColumnAnalysis[] = [
      col({ name: 'Lot_Start_DateTime', type: 'date' }),
      col({ name: 'Material_Type', type: 'categorical' }),
      col({ name: 'Input_Down_Content_%', type: 'numeric', uniqueCount: 200 }),
      col({ name: 'Input_Quantity_kg', type: 'numeric', uniqueCount: 200 }),
    ];
    const ranked = rankYCandidates(cols);
    expect(ranked.map(r => r.column.name)).toEqual(['Input_Down_Content_%', 'Input_Quantity_kg']);
    // Sanity: down content's name-bonus reached the cap of +1.0,
    // input quantity's name-bonus is +0.5 (weight only).
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('preserves original order when scores tie', () => {
    // Two columns with no name-pattern hits and identical variation/missing
    // profile → same score → original order wins.
    const cols: ColumnAnalysis[] = [
      col({ name: 'Alpha_Reading', type: 'numeric', uniqueCount: 10 }),
      col({ name: 'Bravo_Reading', type: 'numeric', uniqueCount: 10 }),
    ];
    const ranked = rankYCandidates(cols);
    expect(ranked.map(r => r.column.name)).toEqual(['Alpha_Reading', 'Bravo_Reading']);
    expect(ranked[0].score).toBe(ranked[1].score);
  });

  it('reasons array contains expected strings for each rule fired', () => {
    const cols: ColumnAnalysis[] = [
      // Plain numeric, no name hits, low variation, no missing → just "base".
      col({ name: 'Plain_Reading', type: 'numeric', uniqueCount: 10 }),
      // Name pattern hit + rich variation.
      col({ name: 'Output_Quality', type: 'numeric', uniqueCount: 100 }),
      // Sparse data path.
      col({
        name: 'Defect_Rate',
        type: 'numeric',
        uniqueCount: 5,
        missingCount: 100, // 100 / 105 > 0.5
      }),
    ];
    const ranked = rankYCandidates(cols);
    const byName = new Map(ranked.map(r => [r.column.name, r]));

    expect(byName.get('Plain_Reading')!.reasons).toEqual(['base']);

    const outputReasons = byName.get('Output_Quality')!.reasons;
    expect(outputReasons).toContain('base');
    expect(outputReasons).toContain('rich variation');
    // At least one name-pattern reason — both "output" and "quality" hit.
    expect(outputReasons.some(r => r.startsWith('name pattern:'))).toBe(true);

    const defectReasons = byName.get('Defect_Rate')!.reasons;
    expect(defectReasons).toContain('base');
    // Both 'rate' and 'defect' substrings hit (cap at +1.0 reached).
    expect(defectReasons.filter(r => r.startsWith('name pattern:')).length).toBeGreaterThanOrEqual(
      2
    );
  });

  it('variation bonus only kicks in when uniqueCount >= 30', () => {
    const cols: ColumnAnalysis[] = [
      col({ name: 'Reading_A', type: 'numeric', uniqueCount: 29 }),
      col({ name: 'Reading_B', type: 'numeric', uniqueCount: 30 }),
    ];
    const ranked = rankYCandidates(cols);
    const a = ranked.find(r => r.column.name === 'Reading_A')!;
    const b = ranked.find(r => r.column.name === 'Reading_B')!;
    expect(a.score).toBe(1.0);
    expect(b.score).toBeCloseTo(1.3, 5);
    expect(a.reasons).not.toContain('rich variation');
    expect(b.reasons).toContain('rich variation');
  });

  it('does not apply a missing-data penalty (deferred until ColumnAnalysis exposes totalCount)', () => {
    // The missing/(unique+missing) ratio is algorithmically wrong for high-
    // cardinality columns (false positive on sparse signal). Penalty was
    // dropped in code review. Both columns score the same; sparse is not
    // flagged in reasons.
    const cols: ColumnAnalysis[] = [
      col({ name: 'Reading_Half', type: 'numeric', uniqueCount: 50, missingCount: 50 }),
      col({ name: 'Reading_Sparse', type: 'numeric', uniqueCount: 40, missingCount: 60 }),
    ];
    const ranked = rankYCandidates(cols);
    const half = ranked.find(r => r.column.name === 'Reading_Half')!;
    const sparse = ranked.find(r => r.column.name === 'Reading_Sparse')!;
    expect(half.reasons).not.toContain('sparse data');
    expect(sparse.reasons).not.toContain('sparse data');
    // Both have rich variation (uniqueCount >= 30) so both score base + bonus.
    expect(half.score).toBe(sparse.score);
  });
});
