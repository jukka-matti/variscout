import { describe, it, expect } from 'vitest';
import { computeMissingColumnFlags } from '../reEvaluate';
import type { Hypothesis } from '../../findings/types';
import type { HypothesisCondition } from '../../findings/hypothesisCondition';

function hyp(id: string, condition?: HypothesisCondition): Hypothesis {
  return {
    id,
    name: id,
    synthesis: '',
    findingIds: [],
    investigationId: 'inv-1',
    status: 'proposed',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    condition,
  };
}

const shiftEqNight: HypothesisCondition = {
  kind: 'leaf',
  column: 'Shift',
  op: 'eq',
  value: 'Night',
};
const lineEqA: HypothesisCondition = { kind: 'leaf', column: 'Line', op: 'eq', value: 'A' };

describe('computeMissingColumnFlags', () => {
  it('flags a hypothesis whose condition references a now-absent column (column removed)', () => {
    const hypotheses = [hyp('h-shift', shiftEqNight)];
    const flags = computeMissingColumnFlags(hypotheses, new Set(['Line', 'Operator']));
    expect(flags.hypothesisIds).toEqual(['h-shift']);
  });

  it('clears the flag once the column is available again (column added)', () => {
    const hypotheses = [hyp('h-shift', shiftEqNight)];
    const flags = computeMissingColumnFlags(hypotheses, new Set(['Shift', 'Line']));
    expect(flags.hypothesisIds).toEqual([]);
  });

  it('never flags a hypothesis with no condition', () => {
    const flags = computeMissingColumnFlags([hyp('h-bare', undefined)], new Set<string>());
    expect(flags.hypothesisIds).toEqual([]);
  });

  it('flags a multi-leaf AND condition when ANY referenced column is absent', () => {
    const condition: HypothesisCondition = {
      kind: 'and',
      children: [shiftEqNight, lineEqA],
    };
    const flags = computeMissingColumnFlags([hyp('h-and', condition)], new Set(['Line']));
    expect(flags.hypothesisIds).toEqual(['h-and']);
  });

  it('does NOT return any delete/mutate instruction — report-only (flag, never delete)', () => {
    const flags = computeMissingColumnFlags([hyp('h-shift', shiftEqNight)], new Set<string>());
    // The shape is purely a report: a list of affected ids, no removals.
    expect(Object.keys(flags)).toEqual(['hypothesisIds']);
  });

  it('preserves hypotheses order in the flagged list', () => {
    const hypotheses = [
      hyp('h-1', lineEqA), // Line present → not flagged
      hyp('h-2', shiftEqNight), // Shift absent → flagged
      hyp('h-3', { kind: 'leaf', column: 'Machine', op: 'eq', value: 'M1' }), // absent → flagged
    ];
    const flags = computeMissingColumnFlags(hypotheses, new Set(['Line']));
    expect(flags.hypothesisIds).toEqual(['h-2', 'h-3']);
  });
});
