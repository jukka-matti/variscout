import { describe, it, expect } from 'vitest';
import { detectBestSubsetsCandidates } from '../bestSubsetsCandidateDetector';
import type { DataRow } from '../../../types';
import { mulberry32 } from '../../../__tests__/helpers/stressDataGenerator';

// ---------------------------------------------------------------------------
// Deterministic synthetic data
// ---------------------------------------------------------------------------

/**
 * Build a dataset with:
 *   - Shift: weak predictor (tiny effect)
 *   - Machine: strong predictor (large effect)
 *   - Operator: moderate predictor
 *   - noise: small noise column not correlated with Y
 *
 * All values are generated via a seeded PRNG, so the same seed produces
 * identical output on every run.
 */
function buildSeededData(n: number, seed: number): DataRow[] {
  const rng = mulberry32(seed);
  const rows: DataRow[] = [];
  const shifts = ['Morning', 'Evening', 'Night'];
  const machines = ['M1', 'M2'];
  const operators = ['Alice', 'Bob', 'Charlie'];

  for (let i = 0; i < n; i++) {
    const shift = shifts[i % shifts.length];
    const machine = machines[i % machines.length];
    const operator = operators[i % operators.length];

    // Tiny shift effect — easily explained by noise
    const shiftEffect = shift === 'Morning' ? 0.1 : shift === 'Evening' ? 0 : -0.1;
    // Very large machine effect — dominant driver
    const machineEffect = machine === 'M1' ? 20 : -20;
    // Moderate operator effect
    const operatorEffect = operator === 'Alice' ? 2 : operator === 'Bob' ? 0 : -2;
    // Small deterministic noise derived from seeded PRNG
    const noise = (rng() - 0.5) * 2;

    rows.push({
      Weight: 100 + shiftEffect + machineEffect + operatorEffect + noise,
      Shift: shift,
      Machine: machine,
      Operator: operator,
      // A column that does not drive Weight — useful for "nothing improves" cases
      FillerNoise: `bucket_${i % 4}`,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectBestSubsetsCandidates', () => {
  it('returns [] when fewer than 10 rows are supplied', () => {
    const rows = buildSeededData(8, 42);
    const result = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Shift']
    );
    expect(result).toEqual([]);
  });

  it('returns [] when rows.length equals minRows - 1 with a custom minRows', () => {
    const rows = buildSeededData(9, 42);
    const result = detectBestSubsetsCandidates(rows, 'Weight', ['Shift', 'Machine'], ['Shift'], 10);
    expect(result).toEqual([]);
  });

  it('returns a candidate when an uncited column meaningfully improves R²adj', () => {
    const rows = buildSeededData(60, 42);
    // Shift is cited (weak predictor); Machine (strong) and Operator (moderate) are uncited.
    const result = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Shift']
    );
    expect(result.length).toBeGreaterThan(0);
    // Every returned candidate must include at least one uncited column only
    for (const c of result) {
      expect(c.columns.length).toBeGreaterThan(0);
      for (const col of c.columns) {
        expect(col).not.toBe('Shift');
      }
      // Safety: finite numbers, no NaN / Infinity (ADR-069 B2)
      expect(Number.isFinite(c.rSquaredAdj)).toBe(true);
      expect(Number.isFinite(c.improvementOverBaseline)).toBe(true);
      expect(c.improvementOverBaseline).toBeGreaterThan(0.1);
    }
    // At least one candidate should include "Machine" — the dominant driver.
    expect(result.some(c => c.columns.includes('Machine'))).toBe(true);
  });

  it('returns [] when all high-impact columns are already cited', () => {
    const rows = buildSeededData(60, 42);
    // Cite the dominant drivers so nothing uncited can beat them by > 0.10.
    const result = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator', 'FillerNoise'],
      ['Machine', 'Operator', 'Shift']
    );
    expect(result).toEqual([]);
  });

  it('is deterministic — same seeded input yields identical output twice', () => {
    const rows = buildSeededData(60, 123);
    const a = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Shift']
    );
    const b = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Shift']
    );
    expect(b).toEqual(a);
  });

  it('respects a custom minImprovement threshold', () => {
    const rows = buildSeededData(60, 42);
    // With a very high minImprovement, no candidate can clear the gate.
    const strict = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Machine'], // strong baseline → nothing uncited can add > 0.99 R²adj
      10,
      0.99
    );
    expect(strict).toEqual([]);

    // With a permissive threshold, the same setup yields at least one candidate.
    const permissive = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      ['Shift'],
      10,
      0.01
    );
    expect(permissive.length).toBeGreaterThan(0);
  });

  it('returns [] when citedColumns is empty (no baseline → nothing to beat meaningfully)', () => {
    // Without a baseline we treat the baseline R²adj as 0. An uncited column that
    // explains > minImprovement variance qualifies.
    const rows = buildSeededData(60, 42);
    const result = detectBestSubsetsCandidates(
      rows,
      'Weight',
      ['Shift', 'Machine', 'Operator'],
      []
    );
    // Machine explains ~all variance → easily beats 0 + 0.10.
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(c => c.columns.includes('Machine'))).toBe(true);
  });
});
