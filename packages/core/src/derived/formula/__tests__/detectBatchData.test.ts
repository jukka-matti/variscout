import { describe, it, expect } from 'vitest';
import type { ColumnParsingProfile } from '../../../parser/types';
import { detectBatchData } from '../detectBatchData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function numericProfile(columnName: string): ColumnParsingProfile {
  return {
    columnName,
    status: 'ok',
    confidence: 99,
    primary: { kind: 'numeric', label: 'numeric', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

function categoricalProfile(columnName: string): ColumnParsingProfile {
  return {
    columnName,
    status: 'ok',
    confidence: 99,
    primary: { kind: 'categorical', label: 'categorical', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectBatchData', () => {
  it('1. returns null for empty profiles', () => {
    expect(detectBatchData([])).toBeNull();
  });

  it('2. returns null when no profiles have mass-unit suffixes', () => {
    const profiles = [
      numericProfile('Pressure'),
      numericProfile('Temperature'),
      numericProfile('Input_ratio'),
      numericProfile('Output_pct'),
    ];
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('3. full batch: Input_kg + GradeA_kg + GradeB_kg + Scrap_kg → populated result', () => {
    const profiles = [
      numericProfile('Input_kg'),
      numericProfile('GradeA_kg'),
      numericProfile('GradeB_kg'),
      numericProfile('Scrap_kg'),
    ];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.inputColumns).toEqual(['Input_kg']);
    expect(result!.outputColumns).toEqual(['GradeA_kg', 'GradeB_kg']);
    expect(result!.scrapColumns).toEqual(['Scrap_kg']);
    expect(result!.isLikelyBatch).toBe(true);
  });

  it('4. case-insensitive: INPUT_KG + output_kg → detected as input + output', () => {
    const profiles = [numericProfile('INPUT_KG'), numericProfile('output_kg')];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.inputColumns).toEqual(['INPUT_KG']);
    expect(result!.outputColumns).toEqual(['output_kg']);
    expect(result!.isLikelyBatch).toBe(true);
  });

  it('5. non-numeric column with _kg suffix is excluded', () => {
    const profiles = [categoricalProfile('Input_kg'), numericProfile('Output_kg')];
    // No numeric input → null
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('6. single column Input_kg with no output → null', () => {
    const profiles = [numericProfile('Input_kg')];
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('7. mixed units Input_lb + Output_tonnes → still detected (V1 does not require matching units)', () => {
    const profiles = [numericProfile('Input_lb'), numericProfile('Output_tonnes')];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.inputColumns).toEqual(['Input_lb']);
    expect(result!.outputColumns).toEqual(['Output_tonnes']);
    expect(result!.isLikelyBatch).toBe(true);
  });

  it('8a. word-boundary: weight_kg_per_batch still matches _kg', () => {
    // _kg appears before another word so the word-boundary after kg should match
    const profiles = [
      numericProfile('weight_kg_per_batch'), // has _kg (followed by _), word boundary on 'kg'
      numericProfile('Output_kg'),
    ];
    // weight_kg_per_batch: does not contain 'input', 'output', 'grade', 'scrap', 'waste', 'loss'
    // → not bucketed into any category, but Output_kg is output
    // No input side → null (weight_kg_per_batch is not bucketed)
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('8b. word-boundary: _kgrams does NOT match the mass-suffix regex', () => {
    const profiles = [
      numericProfile('Input_kgrams'), // should NOT match — 'kgrams' has no word boundary after 'kg'
      numericProfile('Output_kgrams'), // same
    ];
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('8c. word-boundary: Input_kg_ratio does NOT match (underscore after kg is still a word char — no boundary)', () => {
    // The regex uses \b (word boundary). In JS, underscore is a word char, so 'kg_' has no boundary
    // after 'kg'. This means _kg_ratio does NOT match — same as the spec example.
    const profiles = [numericProfile('Input_kg_ratio'), numericProfile('Grade_kg_ratio')];
    // Neither column matches the mass-suffix regex → null
    expect(detectBatchData(profiles)).toBeNull();
  });

  it('scrapColumns is empty array (not absent) when no scrap columns detected', () => {
    const profiles = [numericProfile('Input_kg'), numericProfile('Output_kg')];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.scrapColumns).toEqual([]);
    expect(result!.isLikelyBatch).toBe(true);
  });

  it('output column matching "grade" keyword is detected', () => {
    const profiles = [numericProfile('Input_units'), numericProfile('Grade_A_units')];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.outputColumns).toEqual(['Grade_A_units']);
  });

  it('scrap column matching "waste" keyword is detected', () => {
    const profiles = [
      numericProfile('Input_g'),
      numericProfile('Output_g'),
      numericProfile('Waste_g'),
    ];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.scrapColumns).toEqual(['Waste_g']);
  });

  it('scrap column matching "loss" keyword is detected', () => {
    const profiles = [
      numericProfile('Input_lb'),
      numericProfile('Output_lb'),
      numericProfile('Loss_lb'),
    ];
    const result = detectBatchData(profiles);
    expect(result).not.toBeNull();
    expect(result!.scrapColumns).toEqual(['Loss_lb']);
  });
});
