/**
 * Tests for useFindings hook
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFindings } from '../useFindings';
import type { Finding, FindingContext, FindingStatus } from '@variscout/core';

const makeContext = (overrides?: Partial<FindingContext>): FindingContext => ({
  activeFilters: { Machine: ['A'] },
  cumulativeScope: 45,
  stats: { mean: 10.5, samples: 100 },
  ...overrides,
});

/** Create a full Finding with required fields */
const makeFinding = (
  overrides: Partial<Finding> & { id: string; text: string; context: FindingContext }
): Finding => ({
  createdAt: 1000,
  status: 'observed',
  comments: [],
  statusChangedAt: 1000,
  ...overrides,
});

describe('useFindings', () => {
  it('starts with empty findings by default', () => {
    const { result } = renderHook(() => useFindings());
    expect(result.current.findings).toEqual([]);
  });

  it('starts with initialFindings when provided', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Note 1', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Note 2', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));
    expect(result.current.findings).toHaveLength(2);
    expect(result.current.findings[0].text).toBe('Note 1');
  });

  it('addFinding creates a finding with correct text and context', () => {
    const { result } = renderHook(() => useFindings());
    const ctx = makeContext({ cumulativeScope: 72 });

    let finding: ReturnType<typeof result.current.addFinding>;
    act(() => {
      finding = result.current.addFinding('Shift B is off-center', ctx);
    });

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].text).toBe('Shift B is off-center');
    expect(result.current.findings[0].context.cumulativeScope).toBe(72);
    expect(result.current.findings[0].id).toBeTruthy();
    expect(finding!.id).toBe(result.current.findings[0].id);
  });

  it('addFinding prepends (newest first)', () => {
    const { result } = renderHook(() => useFindings());
    const ctx = makeContext();

    act(() => {
      result.current.addFinding('First', ctx);
    });
    act(() => {
      result.current.addFinding('Second', ctx);
    });

    expect(result.current.findings[0].text).toBe('Second');
    expect(result.current.findings[1].text).toBe('First');
  });

  it('editFinding updates text and preserves context', () => {
    const ctx = makeContext({ activeFilters: { Shift: ['Night'] } });
    const initial = [makeFinding({ id: 'f-1', text: 'Original', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.editFinding('f-1', 'Updated note');
    });

    expect(result.current.findings[0].text).toBe('Updated note');
    expect(result.current.findings[0].context.activeFilters).toEqual({ Shift: ['Night'] });
    expect(result.current.findings[0].id).toBe('f-1');
  });

  it('deleteFinding removes by id', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Keep', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Delete', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.deleteFinding('f-2');
    });

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].id).toBe('f-1');
  });

  it('getFindingContext returns context for existing finding', () => {
    const ctx = makeContext({ cumulativeScope: 55 });
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const found = result.current.getFindingContext('f-1');
    expect(found).toEqual(ctx);
  });

  it('getFindingContext returns undefined for missing finding', () => {
    const { result } = renderHook(() => useFindings());

    const found = result.current.getFindingContext('nonexistent');
    expect(found).toBeUndefined();
  });

  it('onFindingsChange callback fires on add', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFindings({ onFindingsChange: onChange }));

    act(() => {
      result.current.addFinding('New note', makeContext());
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: 'New note' })])
    );
  });

  it('onFindingsChange callback fires on edit', () => {
    const onChange = vi.fn();
    const initial = [makeFinding({ id: 'f-1', text: 'Old', context: makeContext() })];
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.editFinding('f-1', 'New text');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'f-1', text: 'New text' })])
    );
  });

  it('findDuplicate returns finding when filters match', () => {
    const ctx1 = makeContext({ activeFilters: { Machine: ['A'] } });
    const ctx2 = makeContext({ activeFilters: { Machine: ['B'], Shift: ['Night'] } });
    const initial = [
      makeFinding({ id: 'f-1', text: 'First', context: ctx1 }),
      makeFinding({ id: 'f-2', text: 'Second', createdAt: 2000, context: ctx2 }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const dup = result.current.findDuplicate({ Shift: ['Night'], Machine: ['B'] });
    expect(dup).toBeDefined();
    expect(dup!.id).toBe('f-2');
  });

  it('findDuplicate returns undefined when no match', () => {
    const ctx = makeContext({ activeFilters: { Machine: ['A'] } });
    const initial = [makeFinding({ id: 'f-1', text: 'Only', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const dup = result.current.findDuplicate({ Machine: ['Z'] });
    expect(dup).toBeUndefined();
  });

  it('onFindingsChange callback fires on delete', () => {
    const onChange = vi.fn();
    const initial = [
      makeFinding({ id: 'f-1', text: 'Stay', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Go', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.deleteFinding('f-2');
    });

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'f-1' })]);
  });

  // --- Investigation status & comments ---

  it('setFindingStatus changes status and updates statusChangedAt', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.setFindingStatus('f-1', 'investigating');
    });

    expect(result.current.findings[0].status).toBe('investigating');
    expect(result.current.findings[0].statusChangedAt).toBeGreaterThan(0);
    expect(onChange).toHaveBeenCalled();
  });

  it('addFindingComment appends a comment with id and timestamp', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.addFindingComment('f-1', 'Checked operator logs');
    });

    const comments = result.current.findings[0].comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Checked operator logs');
    expect(comments[0].id).toBeTruthy();
    expect(comments[0].createdAt).toBeGreaterThan(0);
    expect(onChange).toHaveBeenCalled();
  });

  it('editFindingComment updates comment text', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [{ id: 'c-1', text: 'Original', createdAt: 500 }],
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.editFindingComment('f-1', 'c-1', 'Updated comment');
    });

    expect(result.current.findings[0].comments[0].text).toBe('Updated comment');
    expect(result.current.findings[0].comments[0].id).toBe('c-1');
  });

  it('deleteFindingComment removes by id', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          { id: 'c-1', text: 'Keep', createdAt: 500 },
          { id: 'c-2', text: 'Remove', createdAt: 600 },
        ],
      }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.deleteFindingComment('f-1', 'c-2');
    });

    expect(result.current.findings[0].comments).toHaveLength(1);
    expect(result.current.findings[0].comments[0].id).toBe('c-1');
    expect(onChange).toHaveBeenCalled();
  });

  // --- Tags ---

  it('setFindingTag sets a tag on a finding', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Test', status: 'analyzed', context: makeContext() }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.setFindingTag('f-1', 'key-driver');
    });

    expect(result.current.findings[0].tag).toBe('key-driver');
    expect(onChange).toHaveBeenCalled();
  });

  it('setFindingTag clears a tag when null', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        status: 'analyzed',
        tag: 'key-driver',
        context: makeContext(),
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.setFindingTag('f-1', null);
    });

    expect(result.current.findings[0].tag).toBeUndefined();
  });

  // --- Migration ---

  it('auto-migrates old confirmed/dismissed statuses on initialization', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'A',
        status: 'confirmed' as FindingStatus,
        context: makeContext(),
      }),
      makeFinding({
        id: 'f-2',
        text: 'B',
        status: 'dismissed' as FindingStatus,
        context: makeContext(),
      }),
      makeFinding({ id: 'f-3', text: 'C', status: 'observed', context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    expect(result.current.findings[0].status).toBe('analyzed');
    expect(result.current.findings[0].tag).toBe('key-driver');
    expect(result.current.findings[1].status).toBe('analyzed');
    expect(result.current.findings[1].tag).toBe('low-impact');
    expect(result.current.findings[2].status).toBe('observed');
  });
});
