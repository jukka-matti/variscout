import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHubProvision } from '../useHubProvision';
import type { ProcessHubRollup, ProcessHubInvestigation, ProcessHub } from '@variscout/core';

const hub: ProcessHub = {
  id: 'h1',
  name: 'Line A',
  createdAt: 1745798400000,
  deletedAt: null,
};

const m1: ProcessHubInvestigation = {
  id: 'i1',
  name: 'I1',
  createdAt: 1745798400000,
  updatedAt: 1745798400000,
  deletedAt: null,
  metadata: { processHubId: 'h1', nodeMappings: [] },
  rows: [{ a: 1 }, { a: 2 }],
  reviewSignal: { ok: 0, review: 0, alarm: 0 },
} as ProcessHubInvestigation;

describe('useHubProvision', () => {
  it('returns hub, members, rowsByInvestigation from rollup', () => {
    const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [m1],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.hub).toBe(hub);
    expect(result.current.members).toEqual([m1]);
    expect(result.current.rowsByInvestigation.get('i1')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('returns empty map for rollup with no investigations', () => {
    const rollup = {
      hub,
      investigations: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.rowsByInvestigation.size).toBe(0);
  });

  it('handles investigations without rows (treats as empty array)', () => {
    const noRows = { ...m1, rows: undefined } as ProcessHubInvestigation;
    const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [noRows],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.rowsByInvestigation.get('i1')).toEqual([]);
  });
});
