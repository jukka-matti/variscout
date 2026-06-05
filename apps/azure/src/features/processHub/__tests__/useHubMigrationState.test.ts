import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHubMigrationState } from '../useHubMigrationState';
import type { ProcessStepCapabilityMember, ProcessMap } from '@variscout/core';

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
  mappings: { nodeId: string; measurementColumn: string }[] = [],
  declined?: string
): ProcessStepCapabilityMember => ({
  id,
  name: id,
  metadata: {
    processHubId: 'h1',
    nodeMappings: mappings,
    migrationDeclinedAt: declined,
  },
});

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
        members: [
          member('a'),
          member('b', [], '2026-04-28T10:00:00Z'),
          member('c', [{ nodeId: 'n1', measurementColumn: 'mixCpk' }]),
        ],
        canonicalMap: map,
        persistInvestigation: vi.fn(),
      })
    );
    expect(result.current.count).toBe(1);
  });

  it('modalEntries surface one entry per unmapped member (no rows → no auto-suggestions, CS-P2 seam)', () => {
    const m = member('a');
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [m],
        canonicalMap: map,
        persistInvestigation: vi.fn(),
      })
    );
    const entry = result.current.modalEntries.find(e => e.investigationId === 'a');
    expect(entry?.investigationName).toBe('a');
    // The portfolio source carries no rows, so the engine cannot auto-suggest
    // node mappings here; CS-P2 wires the editor's live rawData at lift.
    expect(entry?.suggestions).toEqual([]);
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
