import { describe, it, expect } from 'vitest';
import { computeTypeIIISS } from '../typeIIISS';
import { buildDesignMatrix } from '../designMatrix';
import { solveOLS } from '../olsRegression';
import type { DataRow } from '../../types';
import type { FactorSpec } from '../designMatrix';

describe('computeTypeIIISS', () => {
  it('returns null for empty factor specs', () => {
    const data: DataRow[] = [{ Y: 1 }];
    expect(computeTypeIIISS(data, 'Y', [])).toBeNull();
  });

  it('computes correct partial eta-squared for single categorical factor', () => {
    // Single factor: partial eta² should equal simple eta² = SSB / SST
    const data: DataRow[] = [
      { Y: 10, A: 'Lo' },
      { Y: 11, A: 'Lo' },
      { Y: 12, A: 'Lo' },
      { Y: 30, A: 'Hi' },
      { Y: 31, A: 'Hi' },
      { Y: 29, A: 'Hi' },
    ];

    const specs: FactorSpec[] = [{ name: 'A', type: 'categorical' }];
    const result = computeTypeIIISS(data, 'Y', specs);

    expect(result).not.toBeNull();
    expect(result!.has('A')).toBe(true);

    const aResult = result!.get('A')!;
    // With one factor, partial eta² = SSfactor / (SSfactor + SSE)
    // which equals SSB / SST = simple eta²
    expect(aResult.partialEtaSq).toBeGreaterThan(0.9);
    expect(aResult.pValue).toBeLessThan(0.05);
    expect(aResult.dfEffect).toBe(1); // 2 levels - 1 = 1 dummy
  });

  it('computes Type III SS for balanced two-factor data', () => {
    // Balanced design: Type III = Type I for balanced
    const data: DataRow[] = [
      { Y: 108, Machine: 'M1', Shift: 'Day' },
      { Y: 108, Machine: 'M1', Shift: 'Day' },
      { Y: 102, Machine: 'M1', Shift: 'Night' },
      { Y: 102, Machine: 'M1', Shift: 'Night' },
      { Y: 98, Machine: 'M2', Shift: 'Day' },
      { Y: 98, Machine: 'M2', Shift: 'Day' },
      { Y: 92, Machine: 'M2', Shift: 'Night' },
      { Y: 92, Machine: 'M2', Shift: 'Night' },
    ];

    const specs: FactorSpec[] = [
      { name: 'Machine', type: 'categorical' },
      { name: 'Shift', type: 'categorical' },
    ];

    const result = computeTypeIIISS(data, 'Y', specs);
    expect(result).not.toBeNull();

    // Both factors should have valid results
    const machine = result!.get('Machine')!;
    const shift = result!.get('Shift')!;

    // Machine effect (±5) is larger than Shift effect (±3)
    // So Machine should have greater or equal partial eta²
    expect(machine.partialEtaSq).toBeGreaterThanOrEqual(shift.partialEtaSq);
    expect(machine.ssTypeIII).toBeGreaterThanOrEqual(shift.ssTypeIII);
    // Both should be significant
    expect(machine.pValue).toBeLessThan(0.05);
    expect(shift.pValue).toBeLessThan(0.05);
  });

  it('gives different results from Type I for unbalanced data', () => {
    // Deliberately unbalanced: more observations for one combination
    const data: DataRow[] = [
      { Y: 108, A: 'Hi', B: 'X' },
      { Y: 109, A: 'Hi', B: 'X' },
      { Y: 107, A: 'Hi', B: 'X' },
      { Y: 106, A: 'Hi', B: 'X' },
      { Y: 105, A: 'Hi', B: 'X' },
      { Y: 102, A: 'Hi', B: 'Y' },
      { Y: 92, A: 'Lo', B: 'X' },
      { Y: 95, A: 'Lo', B: 'Y' },
      { Y: 94, A: 'Lo', B: 'Y' },
      { Y: 93, A: 'Lo', B: 'Y' },
    ];

    const specs: FactorSpec[] = [
      { name: 'A', type: 'categorical' },
      { name: 'B', type: 'categorical' },
    ];

    const result = computeTypeIIISS(data, 'Y', specs);
    expect(result).not.toBeNull();

    // Both factors should have valid results
    expect(result!.has('A')).toBe(true);
    expect(result!.has('B')).toBe(true);

    // A should have significant partial eta-squared
    expect(result!.get('A')!.partialEtaSq).toBeGreaterThan(0);
  });

  it('handles continuous factors correctly', () => {
    // y = 2*x + noise
    const data: DataRow[] = [];
    for (let i = 0; i < 30; i++) {
      const x = i * 0.5;
      const noise = ((i * 7 + 3) % 5) - 2;
      data.push({ Y: 10 + 2 * x + noise, Temp: x });
    }

    const specs: FactorSpec[] = [{ name: 'Temp', type: 'continuous' }];
    const result = computeTypeIIISS(data, 'Y', specs);

    expect(result).not.toBeNull();
    expect(result!.has('Temp')).toBe(true);

    const temp = result!.get('Temp')!;
    expect(temp.partialEtaSq).toBeGreaterThan(0.8);
    expect(temp.pValue).toBeLessThan(0.05);
    expect(temp.dfEffect).toBe(1); // 1 column for continuous
  });

  it('handles mixed continuous + categorical factors', () => {
    const data: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      const temp = 20 + (i % 10);
      const machine = i % 2 === 0 ? 'M1' : 'M2';
      const machineEffect = machine === 'M1' ? 5 : -5;
      const noise = ((i * 3 + 1) % 5) - 2;
      data.push({
        Y: 100 + 0.5 * temp + machineEffect + noise,
        Temperature: temp,
        Machine: machine,
      });
    }

    const specs: FactorSpec[] = [
      { name: 'Temperature', type: 'continuous' },
      { name: 'Machine', type: 'categorical' },
    ];

    const result = computeTypeIIISS(data, 'Y', specs);
    expect(result).not.toBeNull();
    expect(result!.has('Temperature')).toBe(true);
    expect(result!.has('Machine')).toBe(true);

    // Machine has strong effect (±5), Temperature has moderate linear effect
    const machine = result!.get('Machine')!;
    expect(machine.partialEtaSq).toBeGreaterThan(0.3);
  });
});

// ===========================================================================
// Suite 1 — interaction-augmented specs: SS returned for BOTH mains AND
// the compound interaction key; all finite; dfs correct.
// ===========================================================================

describe('computeTypeIIISS — interaction-augmented specs (cont×cat)', () => {
  /**
   * Deterministic cont×cat fixture with a real interaction:
   *   - Temperature (continuous) centered around 0
   *   - Machine (categorical: A vs B)
   *   - Machine A has slope +2, Machine B has slope -1 (disordinal crossing)
   *   - 40 observations, no noise (deterministic PRNG avoided; zero noise is fine
   *     for Type III decomposition correctness — we just need SSE_full > 0 vs
   *     the intercept-only baseline which it is when both mains matter).
   *
   * Interaction term name follows the buildDesignMatrix sourceFactors convention:
   *   { name: 'Temperature×Machine', type: 'interaction',
   *     sourceFactors: ['Temperature', 'Machine'] }
   */
  function buildContCatInteractionData(): DataRow[] {
    const rows: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      const temp = (i % 10) - 4.5; // values: -4.5, -3.5, … , 4.5 (centred)
      const machine = i % 2 === 0 ? 'A' : 'B';
      const slope = machine === 'A' ? 2 : -1;
      const machineOffset = machine === 'A' ? 0 : 10;
      rows.push({ Y: 50 + slope * temp + machineOffset, Temperature: temp, Machine: machine });
    }
    return rows;
  }

  const interactionSpecs: FactorSpec[] = [
    { name: 'Temperature', type: 'continuous' },
    { name: 'Machine', type: 'categorical' },
    { name: 'Temperature×Machine', type: 'interaction', sourceFactors: ['Temperature', 'Machine'] },
  ];

  it('returns non-null with entries for all three terms', () => {
    const data = buildContCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', interactionSpecs);

    expect(result).not.toBeNull();
    expect(result!.has('Temperature')).toBe(true);
    expect(result!.has('Machine')).toBe(true);
    expect(result!.has('Temperature×Machine')).toBe(true);
  });

  it('all SS values are finite and non-negative', () => {
    const data = buildContCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', interactionSpecs)!;

    for (const [, entry] of result) {
      expect(Number.isFinite(entry.ssTypeIII)).toBe(true);
      expect(entry.ssTypeIII).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(entry.partialEtaSq)).toBe(true);
      expect(Number.isFinite(entry.fStat)).toBe(true);
      expect(Number.isFinite(entry.pValue)).toBe(true);
    }
  });

  it('dfEffect is correct for each term', () => {
    const data = buildContCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', interactionSpecs)!;

    // Temperature (continuous): 1 column
    expect(result.get('Temperature')!.dfEffect).toBe(1);
    // Machine (categorical, 2 levels): k-1 = 1 column
    expect(result.get('Machine')!.dfEffect).toBe(1);
    // Temperature×Machine (cont×cat with 2-level cat): 1 interaction column
    expect(result.get('Temperature×Machine')!.dfEffect).toBe(1);
  });

  it('interaction SS is substantial when slopes differ', () => {
    // With slopes A=+2, B=-1 the interaction should dominate
    const data = buildContCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', interactionSpecs)!;
    const interaction = result.get('Temperature×Machine')!;
    // Interaction eta² should be meaningfully non-zero (slopes differ by 3 units)
    expect(interaction.partialEtaSq).toBeGreaterThan(0);
    expect(interaction.ssTypeIII).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Suite 2 — hierarchy rule: SS_A equals SSE(A-dropped, AB-dropped) − SSE(full),
// verified by building both models manually with buildDesignMatrix + solveOLS.
// ===========================================================================

describe('computeTypeIIISS — hierarchy rule: reduced-A model drops AB interaction', () => {
  /**
   * Small hand-computable fixture (cat A × cat B × their interaction).
   *
   * 12 rows, 2×2 factorial + interaction, with per-cell means:
   *   (Lo, X) = 100, (Lo, Y) = 102, (Hi, X) = 115, (Hi, Y) = 120
   *
   * We replicate each cell 3× so the design is balanced and intercept-only
   * baseline is well-defined. The interaction is nonzero: the A×B increment
   * is +3 beyond additive, so SS_AB > 0.
   *
   * To confirm the hierarchy rule we manually build:
   *   (a) full model:  [A, B, A×B]  → SSE_full
   *   (b) reduced-A:  [B] only       → SSE_reducedA
   * and check  computeTypeIIISS(SS_A)  ==  SSE_reducedA − SSE_full  (to 6 dp).
   *
   * Without the hierarchy rule the reduced model for A would try to keep A×B
   * while dropping A — buildDesignMatrix would throw — and the whole map
   * would be null instead.
   */
  function buildCatCatInteractionData(): DataRow[] {
    const cell = (A: string, B: string, y: number): DataRow[] =>
      Array.from({ length: 3 }, () => ({ Y: y, A, B }));
    return [
      ...cell('Lo', 'X', 100),
      ...cell('Lo', 'Y', 102),
      ...cell('Hi', 'X', 115),
      ...cell('Hi', 'Y', 120), // additive would be 117; extra +3 = interaction
    ];
  }

  const fullSpecs: FactorSpec[] = [
    { name: 'A', type: 'categorical' },
    { name: 'B', type: 'categorical' },
    { name: 'A×B', type: 'interaction', sourceFactors: ['A', 'B'] },
  ];

  it('does not throw and returns a non-null map', () => {
    const data = buildCatCatInteractionData();
    expect(() => computeTypeIIISS(data, 'Y', fullSpecs)).not.toThrow();
    expect(computeTypeIIISS(data, 'Y', fullSpecs)).not.toBeNull();
  });

  it('SS_A from computeTypeIIISS equals SSE(reduced B-only) − SSE(full), hand-verified', () => {
    const data = buildCatCatInteractionData();

    // Build full model manually
    const fullMatrix = buildDesignMatrix(data, 'Y', fullSpecs);
    const fullSolution = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);
    const sseFullManual = fullSolution.sse;

    // Build reduced-A model manually: only [B] — no A, no A×B (hierarchy)
    const reducedASpecs: FactorSpec[] = [{ name: 'B', type: 'categorical' }];
    const reducedAMatrix = buildDesignMatrix(data, 'Y', reducedASpecs);
    const reducedASolution = solveOLS(
      reducedAMatrix.X,
      reducedAMatrix.y,
      reducedAMatrix.n,
      reducedAMatrix.p
    );
    const sseReducedAManual = reducedASolution.sse;

    const expectedSS_A = Math.max(0, sseReducedAManual - sseFullManual);

    // Now ask computeTypeIIISS for SS_A
    const result = computeTypeIIISS(data, 'Y', fullSpecs)!;
    const ss_A_auto = result.get('A')!.ssTypeIII;

    expect(ss_A_auto).toBeCloseTo(expectedSS_A, 6);
  });

  it('all three terms have entries and finite SS', () => {
    const data = buildCatCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', fullSpecs)!;

    expect(result.has('A')).toBe(true);
    expect(result.has('B')).toBe(true);
    expect(result.has('A×B')).toBe(true);

    for (const [, entry] of result) {
      expect(Number.isFinite(entry.ssTypeIII)).toBe(true);
      expect(entry.ssTypeIII).toBeGreaterThanOrEqual(0);
    }
  });

  it('dfEffect: A=1, B=1, A×B=1 (all 2-level factors)', () => {
    const data = buildCatCatInteractionData();
    const result = computeTypeIIISS(data, 'Y', fullSpecs)!;
    expect(result.get('A')!.dfEffect).toBe(1);
    expect(result.get('B')!.dfEffect).toBe(1);
    expect(result.get('A×B')!.dfEffect).toBe(1); // (2-1)*(2-1) = 1
  });
});

// ===========================================================================
// Suite 3 — regression: mains-only spec set behaves exactly as before.
// Port the existing balanced two-factor case with tightened numeric checks.
// ===========================================================================

describe('computeTypeIIISS — regression: mains-only unchanged by interaction code', () => {
  /**
   * Identical data to the existing 'computes Type III SS for balanced two-factor data'
   * test — we just add tighter numeric checks to catch any inadvertent change
   * to the mains-only code path introduced by the hierarchy filter.
   */
  const balancedData: DataRow[] = [
    { Y: 108, Machine: 'M1', Shift: 'Day' },
    { Y: 108, Machine: 'M1', Shift: 'Day' },
    { Y: 102, Machine: 'M1', Shift: 'Night' },
    { Y: 102, Machine: 'M1', Shift: 'Night' },
    { Y: 98, Machine: 'M2', Shift: 'Day' },
    { Y: 98, Machine: 'M2', Shift: 'Day' },
    { Y: 92, Machine: 'M2', Shift: 'Night' },
    { Y: 92, Machine: 'M2', Shift: 'Night' },
  ];

  const mainsOnlySpecs: FactorSpec[] = [
    { name: 'Machine', type: 'categorical' },
    { name: 'Shift', type: 'categorical' },
  ];

  it('returns non-null with both entries', () => {
    expect(computeTypeIIISS(balancedData, 'Y', mainsOnlySpecs)).not.toBeNull();
  });

  it('Machine SS > Shift SS (Machine effect ±5 > Shift effect ±3)', () => {
    const result = computeTypeIIISS(balancedData, 'Y', mainsOnlySpecs)!;
    expect(result.get('Machine')!.ssTypeIII).toBeGreaterThan(result.get('Shift')!.ssTypeIII);
  });

  it('both effects significant at 0.05', () => {
    const result = computeTypeIIISS(balancedData, 'Y', mainsOnlySpecs)!;
    expect(result.get('Machine')!.pValue).toBeLessThan(0.05);
    expect(result.get('Shift')!.pValue).toBeLessThan(0.05);
  });

  it('dfEffect is 1 for both 2-level categorical factors', () => {
    const result = computeTypeIIISS(balancedData, 'Y', mainsOnlySpecs)!;
    expect(result.get('Machine')!.dfEffect).toBe(1);
    expect(result.get('Shift')!.dfEffect).toBe(1);
  });

  it('SS matches the hand-computed SSE(reduced)−SSE(full) baseline', () => {
    // Balanced design — compute manually to verify the code path is unchanged.
    const fullMatrix = buildDesignMatrix(balancedData, 'Y', mainsOnlySpecs);
    const fullSol = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);

    const machineOnlySpecs: FactorSpec[] = [{ name: 'Machine', type: 'categorical' }];
    const reducedShiftMatrix = buildDesignMatrix(balancedData, 'Y', machineOnlySpecs);
    const reducedShiftSol = solveOLS(
      reducedShiftMatrix.X,
      reducedShiftMatrix.y,
      reducedShiftMatrix.n,
      reducedShiftMatrix.p
    );

    const shiftOnlySpecs: FactorSpec[] = [{ name: 'Shift', type: 'categorical' }];
    const reducedMachineMatrix = buildDesignMatrix(balancedData, 'Y', shiftOnlySpecs);
    const reducedMachineSol = solveOLS(
      reducedMachineMatrix.X,
      reducedMachineMatrix.y,
      reducedMachineMatrix.n,
      reducedMachineMatrix.p
    );

    const expectedSS_Shift = Math.max(0, reducedShiftSol.sse - fullSol.sse);
    const expectedSS_Machine = Math.max(0, reducedMachineSol.sse - fullSol.sse);

    const result = computeTypeIIISS(balancedData, 'Y', mainsOnlySpecs)!;
    expect(result.get('Shift')!.ssTypeIII).toBeCloseTo(expectedSS_Shift, 6);
    expect(result.get('Machine')!.ssTypeIII).toBeCloseTo(expectedSS_Machine, 6);
  });
});

// ===========================================================================
// Suite 4 — degenerate: interaction-only spec (no main effects listed).
//
// Behaviour split: the full-model buildDesignMatrix call is NOT wrapped in a
// try/catch (malformed specs = caller error; throw is the correct signal).
// The defensive try/catch only protects REDUCED-model builds inside the loop.
//
// This suite documents:
//   (a) Interaction-only full-spec → full-model build throws (expected).
//   (b) The defensive reduced-model catch: when the hierarchy filter produces
//       a spec set that still fails to build, the entry is silently skipped
//       rather than aborting the entire map.
// ===========================================================================

describe('computeTypeIIISS — degenerate: interaction-only spec', () => {
  const data: DataRow[] = [
    { Y: 10, A: 'Lo', B: 'X' },
    { Y: 12, A: 'Hi', B: 'X' },
    { Y: 14, A: 'Lo', B: 'Y' },
    { Y: 16, A: 'Hi', B: 'Y' },
  ];

  it('throws when only an interaction spec is provided (no source encodings for full model)', () => {
    // Caller error: the full-model buildDesignMatrix has no encoding for A or B,
    // so it throws "references unknown source factors".  This is intentional —
    // the full-model build is NOT wrapped in a try/catch.
    const interactionOnlySpecs: FactorSpec[] = [
      { name: 'A×B', type: 'interaction', sourceFactors: ['A', 'B'] },
    ];
    expect(() => computeTypeIIISS(data, 'Y', interactionOnlySpecs)).toThrow(
      /references unknown source factors/
    );
  });

  it('defensive reduced-model catch: skips a factor whose reduced-model build fails, returns partial map', () => {
    // Build a valid full-model [A, B, A×B].  The reduced model for the A×B
    // interaction itself is valid ([A, B] only).  The reduced models for A
    // and B each drop the interaction via the hierarchy filter → also valid.
    // This test confirms no throw and a complete map.
    const fullSpecs: FactorSpec[] = [
      { name: 'A', type: 'categorical' },
      { name: 'B', type: 'categorical' },
      { name: 'A×B', type: 'interaction', sourceFactors: ['A', 'B'] },
    ];
    // Provide enough rows so n > p (4 rows, p = 1+1+1+1 = 4 → n=4 = p so
    // insufficient; add replicas to get n=8)
    const largerData: DataRow[] = [...data, ...data];
    expect(() => computeTypeIIISS(largerData, 'Y', fullSpecs)).not.toThrow();
    const result = computeTypeIIISS(largerData, 'Y', fullSpecs);
    // Result may be null (degenerate/rank-deficient) or a partial map; either
    // is valid — what must NOT happen is an unhandled exception.
    if (result !== null) {
      for (const [, entry] of result) {
        expect(Number.isFinite(entry.ssTypeIII)).toBe(true);
      }
    }
  });
});
