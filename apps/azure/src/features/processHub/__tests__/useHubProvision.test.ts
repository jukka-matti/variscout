import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHubProvision } from '../useHubProvision';
import type {
  ProcessStepCapabilitySource,
  ProcessStepCapabilityMember,
  ProcessHub,
} from '@variscout/core';

const hub: ProcessHub = {
  id: 'h1',
  name: 'Line A',
  createdAt: 1745798400000,
  deletedAt: null,
};

const m1: ProcessStepCapabilityMember = {
  id: 'i1',
  name: 'I1',
  metadata: { processHubId: 'h1', nodeMappings: [] },
};

describe('useHubProvision', () => {
  it('returns hub + members from the capability source', () => {
    const source: ProcessStepCapabilitySource = { hub, members: [m1] };
    const { result } = renderHook(() => useHubProvision({ source }));
    expect(result.current.hub).toBe(hub);
    expect(result.current.members).toEqual([m1]);
  });

  it('rowsByAnalyze is empty — the portfolio source carries no rows (CS-P2 seam)', () => {
    const source: ProcessStepCapabilitySource = { hub, members: [m1] };
    const { result } = renderHook(() => useHubProvision({ source }));
    expect(result.current.rowsByAnalyze.size).toBe(0);
  });

  it('returns empty members for a source with no members', () => {
    const source: ProcessStepCapabilitySource = { hub, members: [] };
    const { result } = renderHook(() => useHubProvision({ source }));
    expect(result.current.members).toEqual([]);
    expect(result.current.rowsByAnalyze.size).toBe(0);
  });
});
