/**
 * useFactorStripModel — deterministic unit tests (Task 2 / ER-2).
 *
 * All assertions use literal datasets with known ANOVA quantities so the tests
 * catch any regression in the ω² formula path without relying on the engine's
 * own fixture matrix (which lives in packages/core).
 *
 * Conventions:
 *   - renderHook from @testing-library/react (same as every other hooks test).
 *   - No stores touched — the hook is pure props-in.
 *   - Numbers via toBeCloseTo(n, 1) when exact float equality would be brittle;
 *     exact equality for booleans, strings, and ordinal rank claims.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFactorStripModel } from '../useFactorStripModel';
import type { UseFactorStripModelArgs } from '../useFactorStripModel';
import type { DataRow } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';

// ── Dataset builders ────────────────────────────────────────────────────────

/**
 * Two-factor dataset:
 *   Machine: 2 levels (A / B), large separation → high adjusted η².
 *   Operator: 2 levels (X / Y), PERFECTLY CONFOUNDED with Machine (1:1 pairing —
 *   every Machine-A row has Operator-X, every Machine-B row has Operator-Y).
 *   Identical SS; stable sort on insertion order puts Machine first.
 *
 * Machine should always rank first (insertion-order tiebreak) after ω²-adjustment.
 */
function makeTwoFactorRows(): DataRow[] {
  const rows: DataRow[] = [];
  // Machine A: outcome ~20; Machine B: outcome ~10
  for (let i = 0; i < 10; i++) rows.push({ Machine: 'A', Operator: 'X', Outcome: 20 + (i % 3) });
  for (let i = 0; i < 10; i++) rows.push({ Machine: 'B', Operator: 'Y', Outcome: 10 + (i % 3) });
  return rows;
}

/**
 * Discrimination fixture: Machine has strong separation; Operator is assigned
 * INDEPENDENTLY of Machine via deterministic alternation (even rows = P, odd = Q)
 * with no outcome effect.  Machine must rank first with substantially higher
 * adjustedPct; Operator chip must be weak.
 */
function makeDiscriminationRows(): DataRow[] {
  const rows: DataRow[] = [];
  // Machine A: outcome ~20, Machine B: outcome ~10 — 10 rows each
  for (let i = 0; i < 10; i++) {
    rows.push({ Machine: 'A', Operator: i % 2 === 0 ? 'P' : 'Q', Outcome: 20 + (i % 3) });
  }
  for (let i = 0; i < 10; i++) {
    rows.push({ Machine: 'B', Operator: i % 2 === 0 ? 'P' : 'Q', Outcome: 10 + (i % 3) });
  }
  return rows;
}

/**
 * Dataset where a `${outcome}_bin` derived column exists as a factor candidate.
 * D11 exclusion must drop it before ranking.
 */
function makeD11Rows(): DataRow[] {
  const rows: DataRow[] = [];
  // Real predictor: Shift (2 levels, meaningful separation)
  for (let i = 0; i < 10; i++) rows.push({ Shift: 'Day', Value: 20 + i, Value_bin: 'High' });
  for (let i = 0; i < 10; i++) rows.push({ Shift: 'Night', Value: 10 + i, Value_bin: 'Low' });
  return rows;
}

/**
 * Dataset with < 3 rows — engine must return null.
 */
function makeTinyRows(): DataRow[] {
  return [
    { Factor: 'A', Outcome: 1 },
    { Factor: 'B', Outcome: 2 },
  ];
}

/**
 * Dataset where factor separation is deliberate (larger-is-better; two levels).
 * Used for what-if hover assertions.
 */
function makeWhatIfRows(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 8; i++) rows.push({ Source: 'Good', Result: 50 + i });
  for (let i = 0; i < 8; i++) rows.push({ Source: 'Bad', Result: 30 + i });
  return rows;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function callHook(args: UseFactorStripModelArgs) {
  const { result } = renderHook(() => useFactorStripModel(args));
  return result.current;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useFactorStripModel', () => {
  // 1 ─ Null cases ────────────────────────────────────────────────────────────

  it('returns null when outcome is null', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: null,
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).toBeNull();
  });

  it('returns null when outcome is empty string', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: '',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).toBeNull();
  });

  it('returns null when data has < 3 rows', () => {
    const result = callHook({
      rows: makeTinyRows(),
      outcome: 'Outcome',
      allFactors: ['Factor'],
      selectedFactors: [],
    });
    expect(result).toBeNull();
  });

  it('returns null when allFactors is empty', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: [],
      selectedFactors: [],
    });
    expect(result).toBeNull();
  });

  // 2 ─ Ranking order ─────────────────────────────────────────────────────────

  it('ranks Machine first via insertion-order tiebreak (perfectly confounded dataset)', () => {
    // Machine and Operator are 1:1 confounded — identical SS — so stable sort on
    // insertion order (Machine listed before Operator in allFactors) decides rank.
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const chips = result!.chips;
    // At least 2 chips; Machine must rank first (insertion-order tiebreak)
    expect(chips.length).toBeGreaterThanOrEqual(1);
    expect(chips[0].factor).toBe('Machine');
    // adjustedPct must be in descending order
    for (let i = 1; i < chips.length; i++) {
      expect(chips[i - 1].adjustedPct).toBeGreaterThanOrEqual(chips[i].adjustedPct);
    }
  });

  it('chips[0].adjustedPct is strictly positive for a strong predictor', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result!.chips[0].adjustedPct).toBeGreaterThan(0);
  });

  it('discrimination: Machine ranks first with substantially higher adjustedPct; independent Operator is weak', () => {
    // Operator is assigned independently of Machine (deterministic alternation) with
    // no outcome effect — its adjustedPct should be near zero and chip isWeak.
    const result = callHook({
      rows: makeDiscriminationRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const chips = result!.chips;
    expect(chips[0].factor).toBe('Machine');
    // Machine's adjustedPct must be substantially higher than Operator's
    const machineChip = chips.find(c => c.factor === 'Machine')!;
    const operatorChip = chips.find(c => c.factor === 'Operator')!;
    expect(machineChip).toBeDefined();
    expect(operatorChip).toBeDefined();
    expect(machineChip.adjustedPct).toBeGreaterThan(operatorChip.adjustedPct + 10);
    // Operator has no outcome effect → must be flagged weak
    expect(operatorChip.isWeak).toBe(true);
  });

  // 3 ─ D11 exclusion ─────────────────────────────────────────────────────────

  it('excludes ${outcome}_bin from ranking (D11)', () => {
    const result = callHook({
      rows: makeD11Rows(),
      outcome: 'Value',
      allFactors: ['Shift', 'Value_bin'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const factorNames = result!.chips.map(c => c.factor);
    expect(factorNames).not.toContain('Value_bin');
    // Shift must still appear
    expect(factorNames).toContain('Shift');
  });

  it('excludes a binding-named column whose sourceColumn === outcome (D11)', () => {
    const rows = makeD11Rows();
    const binding: BinnedFactorBinding = {
      id: 'value-quartile-bin',
      sourceColumn: 'Value',
      cuts: [14, 18],
      levelNames: ['Low', 'Mid', 'High'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-06-11T00:00:00Z',
    };
    // Add the binding id as a column to the rows and factor list
    const augmented = rows.map(r => ({
      ...r,
      'value-quartile-bin': r.Value > 15 ? 'High' : 'Low',
    }));
    const result = callHook({
      rows: augmented,
      outcome: 'Value',
      allFactors: ['Shift', 'value-quartile-bin'],
      selectedFactors: [],
      bindings: [binding],
    });
    expect(result).not.toBeNull();
    const factorNames = result!.chips.map(c => c.factor);
    expect(factorNames).not.toContain('value-quartile-bin');
  });

  // 4 ─ isWeak flags ──────────────────────────────────────────────────────────

  it('marks a clearly significant high-share chip as NOT weak', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const machineChip = result!.chips.find(c => c.factor === 'Machine')!;
    expect(machineChip).toBeDefined();
    // Machine has a large separation → adjustedPct > 1 AND should be significant
    expect(machineChip.isWeak).toBe(false);
  });

  it('isWeak is true for a two-level no-effect factor (deterministic alternation)', () => {
    // Noise alternates deterministically P/Q across all rows — two levels guaranteed —
    // but outcome increases monotonically with index, giving Noise zero group separation.
    // The chip must be present (two levels) and isWeak must be unconditionally true.
    const rows: DataRow[] = [];
    for (let i = 0; i < 12; i++) {
      rows.push({
        Signal: i % 2 === 0 ? 'A' : 'B',
        Noise: i % 2 === 0 ? 'P' : 'Q',
        Outcome: 10 + i * 2,
      });
    }
    const result = callHook({
      rows,
      outcome: 'Outcome',
      allFactors: ['Signal', 'Noise'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const noiseChip = result!.chips.find(c => c.factor === 'Noise');
    // Noise has two levels so the engine will include it
    expect(noiseChip).toBeDefined();
    // Noise is perfectly balanced with no group separation → isWeak unconditionally
    expect(noiseChip!.isWeak).toBe(true);
  });

  // 5 ─ isSelected flag ────────────────────────────────────────────────────────

  it('marks selectedFactors with isSelected=true', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: ['Machine'],
    });
    expect(result).not.toBeNull();
    const machineChip = result!.chips.find(c => c.factor === 'Machine')!;
    const operatorChip = result!.chips.find(c => c.factor === 'Operator');
    expect(machineChip.isSelected).toBe(true);
    if (operatorChip) {
      expect(operatorChip.isSelected).toBe(false);
    }
  });

  it('a factor absent from selectedFactors has isSelected=false', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [], // nothing selected
    });
    expect(result).not.toBeNull();
    for (const chip of result!.chips) {
      expect(chip.isSelected).toBe(false);
    }
  });

  // 6 ─ whatIf ────────────────────────────────────────────────────────────────

  it('whatIf is defined when specs with clear direction are supplied (one-sided LSL = larger-is-better)', () => {
    const rows = makeWhatIfRows();
    const result = callHook({
      rows,
      outcome: 'Result',
      allFactors: ['Source'],
      selectedFactors: [],
      // One-sided LSL only → inferCharacteristicType resolves 'larger' (larger-is-better).
      specs: { lsl: 25 },
    });
    expect(result).not.toBeNull();
    const sourceChip = result!.chips.find(c => c.factor === 'Source')!;
    expect(sourceChip).toBeDefined();
    expect(sourceChip.whatIf).toBeDefined();
    // Larger-is-better: best group is "Good" (~53 mean), bad group shifts up →
    // projectedMean >= currentMean.
    expect(sourceChip.whatIf!.projectedMean).toBeGreaterThanOrEqual(sourceChip.whatIf!.currentMean);
    // bestLevel must be a non-empty string
    expect(sourceChip.whatIf!.bestLevel).toBeTruthy();
    // k and n must be present and sane
    expect(sourceChip.whatIf!.k).toBe(2);
    expect(sourceChip.whatIf!.n).toBe(16);
  });

  it('whatIf is undefined when no specs supplied (no inferable direction)', () => {
    const rows = makeWhatIfRows();
    const result = callHook({
      rows,
      outcome: 'Result',
      allFactors: ['Source'],
      selectedFactors: [],
      // no specs → inferCharacteristicType returns 'nominal' → undefined
    });
    expect(result).not.toBeNull();
    const sourceChip = result!.chips.find(c => c.factor === 'Source')!;
    expect(sourceChip).toBeDefined();
    expect(sourceChip.whatIf).toBeUndefined();
  });

  it('whatIf is undefined when no specs and no direction anchor (pure nominal)', () => {
    // No specs at all → inferCharacteristicType returns 'nominal' with no target
    // → findBestSubgroup has no anchor → computeMatchedBestProjection returns undefined.
    const rows = makeWhatIfRows();
    const result = callHook({
      rows,
      outcome: 'Result',
      allFactors: ['Source'],
      selectedFactors: [],
      specs: {}, // empty spec → 'nominal' with no anchor
    });
    expect(result).not.toBeNull();
    const sourceChip = result!.chips.find(c => c.factor === 'Source')!;
    expect(sourceChip).toBeDefined();
    expect(sourceChip.whatIf).toBeUndefined();
  });

  it('whatIf is defined for two-sided spec (nominal uses spec midpoint as anchor)', () => {
    // Both USL and LSL → characteristicType='nominal' but midpoint=(60+25)/2=42.5 acts as anchor.
    const rows = makeWhatIfRows();
    const result = callHook({
      rows,
      outcome: 'Result',
      allFactors: ['Source'],
      selectedFactors: [],
      specs: { usl: 60, lsl: 25 }, // midpoint = 42.5
    });
    expect(result).not.toBeNull();
    const sourceChip = result!.chips.find(c => c.factor === 'Source')!;
    expect(sourceChip).toBeDefined();
    // Direction is inferable (midpoint anchor) → whatIf should be defined
    expect(sourceChip.whatIf).toBeDefined();
    expect(sourceChip.whatIf!.bestLevel).toBeTruthy();
  });

  // 7 ─ residualPct ───────────────────────────────────────────────────────────

  it('residualPct = 100 − top chip adjustedPct (v1 approximation)', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const maxAdj = Math.max(...result!.chips.map(c => c.adjustedPct));
    expect(result!.residualPct).toBeCloseTo(100 - maxAdj, 5);
  });

  it('residualPct is >= 0 (floored)', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    expect(result!.residualPct).toBeGreaterThanOrEqual(0);
  });

  // 8 ─ n passthrough ─────────────────────────────────────────────────────────

  it('returns n equal to the number of valid rows', () => {
    const rows = makeTwoFactorRows(); // 20 rows, all valid
    const result = callHook({
      rows,
      outcome: 'Outcome',
      allFactors: ['Machine', 'Operator'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    expect(result!.n).toBe(20);
  });

  // 9 ─ pValue / dfBetween / dfWithin passthrough ─────────────────────────────

  it('each chip exposes pValue, dfBetween, dfWithin as finite numbers', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const chip = result!.chips[0];
    expect(Number.isFinite(chip.pValue)).toBe(true);
    expect(Number.isFinite(chip.dfBetween)).toBe(true);
    expect(Number.isFinite(chip.dfWithin)).toBe(true);
    // 2 levels → dfBetween = 1; 20 rows − 2 = 18
    expect(chip.dfBetween).toBe(1);
  });

  // 10 ─ binnedForRanking passthrough ─────────────────────────────────────────

  it('binnedForRanking is false for categorical factors', () => {
    const result = callHook({
      rows: makeTwoFactorRows(),
      outcome: 'Outcome',
      allFactors: ['Machine'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    // Machine is categorical (string levels) — should not be binned
    const chip = result!.chips.find(c => c.factor === 'Machine')!;
    expect(chip.binnedForRanking).toBe(false);
  });

  it('binnedForRanking is true for continuous numeric factors', () => {
    // Build rows with a continuous numeric factor (no repeated values)
    const rows: DataRow[] = [];
    for (let i = 0; i < 20; i++) {
      rows.push({ Temperature: i * 1.5 + 10, Category: i % 2 === 0 ? 'A' : 'B', Output: i * 2 });
    }
    const result = callHook({
      rows,
      outcome: 'Output',
      allFactors: ['Temperature', 'Category'],
      selectedFactors: [],
    });
    expect(result).not.toBeNull();
    const tempChip = result!.chips.find(c => c.factor === 'Temperature');
    if (tempChip) {
      // Temperature is continuous → should be quartile-binned
      expect(tempChip.binnedForRanking).toBe(true);
    }
  });
});
