import { describe, it, expect } from 'vitest';
import type { ProcessMap } from '../../frame';
import type { DataRow, SpecLimits } from '../..';
import { stampStepCapabilities } from '../stampStepCapabilities';

const baseMap: ProcessMap = {
  nodes: [
    { id: 'step-1', name: 'Cure', order: 0, parentStepId: null, ctqColumn: 'cure_temp_c' },
    { id: 'step-2', name: 'Pack', order: 1, parentStepId: null, ctqColumn: null },
  ],
  arrows: [],
  assignments: {},
};

describe('stampStepCapabilities', () => {
  it('returns one stamp per map node, ordered by node order', () => {
    const rows: DataRow[] = [
      { cure_temp_c: '100' },
      { cure_temp_c: '101' },
      { cure_temp_c: '102' },
      { cure_temp_c: '103' },
    ];
    const measureSpecs: Record<string, SpecLimits> = {
      cure_temp_c: { usl: 110, lsl: 90, target: 100, characteristicType: 'nominal' },
    };

    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs });

    expect(stamps).toHaveLength(2);
    expect(stamps[0]?.stepId).toBe('step-1');
    expect(stamps[1]?.stepId).toBe('step-2');
  });

  it('populates n / mean / sigma / cpk on a numeric stamp from the metric column', () => {
    const rows: DataRow[] = [
      { cure_temp_c: '99' },
      { cure_temp_c: '100' },
      { cure_temp_c: '101' },
      { cure_temp_c: '102' },
    ];
    const measureSpecs: Record<string, SpecLimits> = {
      cure_temp_c: { usl: 110, lsl: 90 },
    };

    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs });

    expect(stamps[0]?.n).toBe(4);
    expect(stamps[0]?.mean).toBeCloseTo(100.5, 4);
    expect(stamps[0]?.sigma).toBeGreaterThan(0);
    expect(stamps[0]?.cpk).toBeDefined();
  });

  it('emits n=0 stamps for nodes with no metric column or no numeric values', () => {
    const rows: DataRow[] = [{ cure_temp_c: '100' }];
    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs: {} });
    const stepTwo = stamps.find(s => s.stepId === 'step-2');
    expect(stepTwo?.n).toBe(0);
    expect(stepTwo?.mean).toBeUndefined();
    expect(stepTwo?.sigma).toBeUndefined();
    expect(stepTwo?.cpk).toBeUndefined();
  });

  it('returns [] when the map has no nodes', () => {
    const empty: ProcessMap = { nodes: [], arrows: [], assignments: {} };
    expect(stampStepCapabilities({ map: empty, rows: [], measureSpecs: {} })).toEqual([]);
  });

  it('uses an assignment column when ctqColumn is null', () => {
    const map: ProcessMap = {
      nodes: [{ id: 'step-A', name: 'A', order: 0, parentStepId: null, ctqColumn: null }],
      arrows: [],
      assignments: { col_x: 'step-A' },
    };
    const rows: DataRow[] = [{ col_x: '5' }, { col_x: '7' }];
    const stamps = stampStepCapabilities({ map, rows, measureSpecs: {} });
    expect(stamps[0]?.n).toBe(2);
    expect(stamps[0]?.mean).toBeCloseTo(6, 4);
  });

  it('returns finite numbers only — never NaN / Infinity (ADR-069 B2)', () => {
    const rows: DataRow[] = [{ cure_temp_c: 'not-a-number' }, { cure_temp_c: '' }];
    const stamps = stampStepCapabilities({ map: baseMap, rows, measureSpecs: {} });
    for (const stamp of stamps) {
      if (stamp.mean !== undefined) expect(Number.isFinite(stamp.mean)).toBe(true);
      if (stamp.sigma !== undefined) expect(Number.isFinite(stamp.sigma)).toBe(true);
      if (stamp.cpk !== undefined) expect(Number.isFinite(stamp.cpk)).toBe(true);
    }
  });
});
