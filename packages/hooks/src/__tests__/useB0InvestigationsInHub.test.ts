import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useB0InvestigationsInHub } from '../useB0InvestigationsInHub';
import type { ProcessHubInvestigation, ProcessHubInvestigationMetadata } from '@variscout/core';

type NodeMappings = NonNullable<ProcessHubInvestigationMetadata['nodeMappings']>;

function inv(opts: {
  id: string;
  hubId: string;
  nodeMappings: NodeMappings;
  declined?: string;
}): ProcessHubInvestigation {
  return {
    id: opts.id,
    name: opts.id,
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    metadata: {
      processHubId: opts.hubId,
      nodeMappings: opts.nodeMappings,
      migrationDeclinedAt: opts.declined,
    },
  };
}

describe('useB0InvestigationsInHub', () => {
  it('returns investigations with empty nodeMappings', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [] }),
      inv({ id: 'b', hubId: 'h1', nodeMappings: [{ nodeId: 'n1', measurementColumn: 'c' }] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['a']);
    expect(result.current.count).toBe(1);
  });

  it('excludes investigations with migrationDeclinedAt set', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [], declined: '2026-04-28T10:00:00Z' }),
      inv({ id: 'b', hubId: 'h1', nodeMappings: [] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['b']);
  });

  it('skips investigations belonging to a different hub', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [] }),
      inv({ id: 'b', hubId: 'h2', nodeMappings: [] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['a']);
  });

  it('returns empty result for empty members', () => {
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members: [] }));
    expect(result.current.count).toBe(0);
    expect(result.current.unmapped).toEqual([]);
  });
});
