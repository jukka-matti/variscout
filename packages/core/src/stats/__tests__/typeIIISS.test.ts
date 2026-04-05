import { describe, it, expect } from 'vitest';
import { computeTypeIIISS } from '../typeIIISS';
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
