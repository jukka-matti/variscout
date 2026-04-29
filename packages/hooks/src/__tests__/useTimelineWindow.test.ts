import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHubInvestigation } from '@variscout/core';
import { useTimelineWindow } from '../useTimelineWindow';

const inv = (
  id: string,
  metadata?: ProcessHubInvestigation['metadata']
): Pick<ProcessHubInvestigation, 'id' | 'metadata'> => ({ id, metadata });

describe('useTimelineWindow', () => {
  it('returns cumulative default when metadata.timelineWindow is absent', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({ investigation: inv('inv-1'), onChange })
    );
    expect(result.current.window).toEqual({ kind: 'cumulative' });
  });

  it('reflects the metadata.timelineWindow when present', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({
        investigation: inv('inv-1', { timelineWindow: { kind: 'rolling', windowDays: 30 } }),
        onChange,
      })
    );
    expect(result.current.window).toEqual({ kind: 'rolling', windowDays: 30 });
  });

  it('setWindow delegates to onChange with investigationId', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimelineWindow({ investigation: inv('inv-1'), onChange })
    );
    act(() => result.current.setWindow({ kind: 'rolling', windowDays: 7 }));
    expect(onChange).toHaveBeenCalledWith('inv-1', { kind: 'rolling', windowDays: 7 });
  });
});
