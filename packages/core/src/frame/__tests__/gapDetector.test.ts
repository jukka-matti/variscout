import { describe, it, expect } from 'vitest';
import { detectGaps } from '../gapDetector';
import type { ProcessMap } from '../types';

const mkMap = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-04-18T00:00:00.000Z',
  updatedAt: '2026-04-18T00:00:00.000Z',
  ...overrides,
});

describe('detectGaps — required gaps', () => {
  it('flags missing-cts when neither ctsColumn nor outcomeColumn is set', () => {
    const gaps = detectGaps({ processMap: mkMap() });
    expect(gaps.some(g => g.kind === 'missing-cts' && g.severity === 'required')).toBe(true);
  });

  it('does NOT flag missing-cts when ctsColumn is set on the map', () => {
    const gaps = detectGaps({
      processMap: mkMap({ ctsColumn: 'Fill_Weight' }),
      specs: { usl: 12 },
    });
    expect(gaps.some(g => g.kind === 'missing-cts')).toBe(false);
  });

  it('does NOT flag missing-cts when outcomeColumn is declared (legacy fallback)', () => {
    const gaps = detectGaps({
      processMap: mkMap(),
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
    });
    expect(gaps.some(g => g.kind === 'missing-cts')).toBe(false);
  });

  it('flags missing-spec-limits when specs are empty', () => {
    const gaps = detectGaps({ outcomeColumn: 'Fill_Weight' });
    expect(gaps.some(g => g.kind === 'missing-spec-limits' && g.severity === 'required')).toBe(
      true
    );
  });

  it('flags missing-spec-limits when only target is set (target alone is not a limit)', () => {
    const gaps = detectGaps({ outcomeColumn: 'Fill_Weight', specs: { target: 12 } });
    expect(gaps.some(g => g.kind === 'missing-spec-limits')).toBe(true);
  });

  it('does NOT flag missing-spec-limits when USL is set', () => {
    const gaps = detectGaps({ outcomeColumn: 'Fill_Weight', specs: { usl: 12 } });
    expect(gaps.some(g => g.kind === 'missing-spec-limits')).toBe(false);
  });

  it('does NOT flag missing-spec-limits when LSL is set', () => {
    const gaps = detectGaps({ outcomeColumn: 'Fill_Weight', specs: { lsl: 11.7 } });
    expect(gaps.some(g => g.kind === 'missing-spec-limits')).toBe(false);
  });

  it('orders required gaps before recommended gaps', () => {
    const gaps = detectGaps({ processMap: mkMap() });
    const firstRecommendedIdx = gaps.findIndex(g => g.severity === 'recommended');
    const lastRequiredIdx = gaps.map(g => g.severity).lastIndexOf('required');
    if (firstRecommendedIdx !== -1 && lastRequiredIdx !== -1) {
      expect(lastRequiredIdx).toBeLessThan(firstRecommendedIdx);
    }
  });
});

describe('detectGaps — recommended gaps', () => {
  it('flags missing-subgroup-axis when tributaries exist but no axis is picked', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [{ id: 'step-1', name: 'Fill', order: 0, ctqColumn: 'Fill_Weight' }],
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
      }),
    });
    expect(gaps.some(g => g.kind === 'missing-subgroup-axis')).toBe(true);
  });

  it('does NOT flag missing-subgroup-axis when a valid axis is picked', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [{ id: 'step-1', name: 'Fill', order: 0, ctqColumn: 'Fill_Weight' }],
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(gaps.some(g => g.kind === 'missing-subgroup-axis')).toBe(false);
  });

  it('flags missing-subgroup-axis when axis points at a tributary that no longer exists', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [{ id: 'step-1', name: 'Fill', order: 0, ctqColumn: 'Fill_Weight' }],
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-DELETED'],
      }),
    });
    expect(gaps.some(g => g.kind === 'missing-subgroup-axis')).toBe(true);
  });

  it('flags missing-time-axis when neither a timeColumn nor a date-kind column is available', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      columns: ['Machine', 'Shift', 'Fill_Weight'],
      columnKinds: { Machine: 'categorical', Shift: 'categorical', Fill_Weight: 'numeric' },
    });
    expect(gaps.some(g => g.kind === 'missing-time-axis')).toBe(true);
  });

  it('does NOT flag missing-time-axis when a date-kind column is available', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      columns: ['Timestamp', 'Machine', 'Fill_Weight'],
      columnKinds: { Timestamp: 'date', Machine: 'categorical', Fill_Weight: 'numeric' },
    });
    expect(gaps.some(g => g.kind === 'missing-time-axis')).toBe(false);
  });

  it('does NOT flag missing-time-axis when timeColumn is declared', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      timeColumn: 'Observation',
    });
    expect(gaps.some(g => g.kind === 'missing-time-axis')).toBe(false);
  });

  it('flags missing-ctq-at-step for every step without a ctqColumn', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [
          { id: 'step-1', name: 'Mix', order: 0 },
          { id: 'step-2', name: 'Fill', order: 1, ctqColumn: 'Fill_Weight' },
          { id: 'step-3', name: 'Seal', order: 2 },
        ],
      }),
    });
    const ctqGaps = gaps.filter(g => g.kind === 'missing-ctq-at-step');
    expect(ctqGaps).toHaveLength(2);
    expect(ctqGaps.map(g => g.stepId).sort()).toEqual(['step-1', 'step-3']);
  });

  it('emits missing-ctq-at-step gaps in step order (by `order` field)', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [
          { id: 'step-3', name: 'Seal', order: 2 },
          { id: 'step-1', name: 'Mix', order: 0 },
          { id: 'step-2', name: 'Fill', order: 1 },
        ],
      }),
    });
    const ctqStepIds = gaps.filter(g => g.kind === 'missing-ctq-at-step').map(g => g.stepId);
    expect(ctqStepIds).toEqual(['step-1', 'step-2', 'step-3']);
  });

  it('flags step-without-tributaries for every step that has none', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12 },
      processMap: mkMap({
        nodes: [
          { id: 'step-1', name: 'Mix', order: 0, ctqColumn: 'A' },
          { id: 'step-2', name: 'Fill', order: 1, ctqColumn: 'B' },
        ],
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(gaps.filter(g => g.kind === 'step-without-tributaries').map(g => g.stepId)).toEqual([
      'step-2',
    ]);
  });
});

describe('detectGaps — no map', () => {
  it('emits only the data-level gaps (no step-scoped entries) when no map exists', () => {
    const gaps = detectGaps({ outcomeColumn: 'Fill_Weight' });
    expect(gaps.some(g => g.stepId)).toBe(false);
    expect(gaps.some(g => g.kind === 'missing-spec-limits')).toBe(true);
  });

  it('returns no gaps when CTS, specs, and time-axis are all present', () => {
    const gaps = detectGaps({
      outcomeColumn: 'Fill_Weight',
      specs: { lsl: 11.7, usl: 12.3 },
      timeColumn: 'Observation',
    });
    expect(gaps).toEqual([]);
  });
});
