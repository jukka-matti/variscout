import { describe, it, expect } from 'vitest';
import type { TimelineWindow } from '../types';
import { isFixedWindow, isRollingWindow, isOpenEndedWindow, isCumulativeWindow } from '../types';

describe('TimelineWindow type guards', () => {
  it('discriminates each kind', () => {
    const fixed: TimelineWindow = {
      kind: 'fixed',
      startISO: '2026-01-01T00:00:00Z',
      endISO: '2026-01-31T23:59:59Z',
    };
    const rolling: TimelineWindow = { kind: 'rolling', windowDays: 30 };
    const open: TimelineWindow = { kind: 'openEnded', startISO: '2026-04-01T00:00:00Z' };
    const cumulative: TimelineWindow = { kind: 'cumulative' };

    expect(isFixedWindow(fixed)).toBe(true);
    expect(isRollingWindow(rolling)).toBe(true);
    expect(isOpenEndedWindow(open)).toBe(true);
    expect(isCumulativeWindow(cumulative)).toBe(true);

    expect(isFixedWindow(rolling)).toBe(false);
    expect(isRollingWindow(open)).toBe(false);
  });
});
