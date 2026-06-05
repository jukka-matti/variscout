import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalEntries } from '../useJournalEntries';
import type { Finding, FindingContext } from '@variscout/core';

const makeContext = (): FindingContext => ({
  activeFilters: {},
  cumulativeScope: null,
});

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f1',
  text: 'Night shift 2.5mm higher',
  status: 'observed',
  createdAt: new Date('2026-04-01T10:45:00Z').getTime(),
  deletedAt: null,
  statusChangedAt: new Date('2026-04-01T10:45:00Z').getTime(),
  context: makeContext(),
  evidenceType: 'data',
  comments: [],
  ...overrides,
});

describe('useJournalEntries', () => {
  it('returns empty array when no inputs', () => {
    const { result } = renderHook(() => useJournalEntries({ findings: [] }));
    expect(result.current).toEqual([]);
  });

  it('creates entry for each finding', () => {
    const { result } = renderHook(() => useJournalEntries({ findings: [makeFinding()] }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('finding-created');
    expect(result.current[0].text).toContain('Night shift');
  });

  it('creates note-added entries for finding comments', () => {
    const finding = makeFinding({
      comments: [
        {
          id: 'c1',
          text: 'Confirmed by operator',
          createdAt: new Date('2026-04-01T11:00:00Z').getTime(),
          deletedAt: null,
          parentId: 'f1',
          parentKind: 'finding' as const,
        },
      ],
    });
    const { result } = renderHook(() => useJournalEntries({ findings: [finding] }));
    const noteEntry = result.current.find(e => e.type === 'note-added');
    expect(noteEntry).toBeDefined();
    expect(noteEntry!.text).toBe('Confirmed by operator');
    expect(noteEntry!.detail).toContain('Night shift');
    expect(noteEntry!.relatedFindingId).toBe('f1');
  });

  it('creates problem-statement entry when provided', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        problemStatement: 'Fill weight varies by shift',
      })
    );
    const entry = result.current.find(e => e.type === 'problem-statement');
    expect(entry).toBeDefined();
    expect(entry!.detail).toBe('Fill weight varies by shift');
  });

  it('sorts entries chronologically (oldest first)', () => {
    const earlyFinding = makeFinding({
      id: 'f-early',
      createdAt: new Date('2026-04-01T09:00:00Z').getTime(),
    });
    const laterFinding = makeFinding({
      id: 'f-later',
      createdAt: new Date('2026-04-01T11:00:00Z').getTime(),
      text: 'Machine B also affects weight',
    });
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [earlyFinding, laterFinding],
      })
    );
    expect(result.current.length).toBeGreaterThanOrEqual(2);
    const timestamps = result.current.map(e => e.timestamp);
    expect(timestamps).toEqual([...timestamps].sort());
  });

  it('uses stable timestamp for problem statement', () => {
    const { result, rerender } = renderHook(
      ({ ps }) => useJournalEntries({ findings: [], problemStatement: ps }),
      { initialProps: { ps: 'Test problem' } }
    );
    const ts1 = result.current.find(e => e.type === 'problem-statement')?.timestamp;
    rerender({ ps: 'Test problem' });
    const ts2 = result.current.find(e => e.type === 'problem-statement')?.timestamp;
    expect(ts1).toBe(ts2);
  });

  it('includes multiple findings in chronological order', () => {
    const findings = [
      makeFinding({ id: 'f1', createdAt: 2000, text: 'Later finding' }),
      makeFinding({ id: 'f2', createdAt: 1000, text: 'Earlier finding' }),
    ];
    const { result } = renderHook(() => useJournalEntries({ findings }));
    const texts = result.current.filter(e => e.type === 'finding-created').map(e => e.text);
    expect(texts[0]).toBe('Earlier finding');
    expect(texts[1]).toBe('Later finding');
  });
});
