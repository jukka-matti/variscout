import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHubMigrationState } from '../useHubMigrationState';
import type { ProcessHubInvestigation, ProcessMap } from '@variscout/core';

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'n1', name: 'Mix', ctqColumn: 'mixCpk' },
    { id: 'n2', name: 'Fill', ctqColumn: 'fillCpk' },
  ],
  tributaries: [],
} as unknown as ProcessMap;

const member = (
  id: string,
  mappings: unknown[] = [],
  declined?: string,
  rows: Record<string, unknown>[] = []
): ProcessHubInvestigation =>
  ({
    id,
    name: id,
    processHubId: 'h1',
    metadata: {
      processHubId: 'h1',
      nodeMappings: mappings,
      migrationDeclinedAt: declined,
    },
    rows,
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  }) as unknown as ProcessHubInvestigation;

describe('useHubMigrationState', () => {
  it('isModalOpen toggles via openModal / closeModal', () => {
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a')],
        canonicalMap: map,
        persistInvestigation: vi.fn(),
      })
    );
    expect(result.current.isModalOpen).toBe(false);
    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });

  it('count reflects unmapped + non-dismissed', () => {
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a'), member('b', [], '2026-04-28T10:00:00Z'), member('c', [{ x: 1 }])],
        canonicalMap: map,
        persistInvestigation: vi.fn(),
      })
    );
    expect(result.current.count).toBe(1);
  });

  it('modalEntries derive suggestions from canonicalMap + investigation rows', () => {
    // Investigation 'a' has a `mixCpk` column → suggests Mix node
    const m = member('a', [], undefined, [{ mixCpk: 1.2, defect: 'pass' }]);
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [m],
        canonicalMap: map,
        persistInvestigation: vi.fn(),
      })
    );
    const entry = result.current.modalEntries.find(e => e.investigationId === 'a');
    expect(entry?.suggestions.map(s => s.nodeId)).toContain('n1');
    expect(entry?.suggestions.find(s => s.nodeId === 'n1')?.label).toBe('Mix');
  });

  it('handleSave calls persistInvestigation with merged nodeMappings per row', () => {
    const persist = vi.fn();
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a'), member('b')],
        canonicalMap: map,
        persistInvestigation: persist,
      })
    );
    act(() =>
      result.current.handleSave([
        { investigationId: 'a', nodeId: 'n1', measurementColumn: 'mix' },
        { investigationId: 'b', nodeId: 'n2', measurementColumn: 'fill' },
      ])
    );
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a',
        metadata: expect.objectContaining({
          nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mix' }],
        }),
      })
    );
  });

  it('handleDecline persists migrationDeclinedAt for a single investigation', () => {
    const persist = vi.fn();
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a')],
        canonicalMap: map,
        persistInvestigation: persist,
      })
    );
    act(() => result.current.handleDecline('a'));
    expect(persist).toHaveBeenCalledOnce();
    expect(persist.mock.calls[0][0]).toMatchObject({
      id: 'a',
      metadata: expect.objectContaining({ migrationDeclinedAt: expect.any(String) }),
    });
  });
});
