import { describe, it, expect } from 'vitest';
import { DEFAULT_TIME_LENS, type TimeLens, type TimeLensMode } from '@variscout/core';

describe('timeLens — module', () => {
  it('DEFAULT_TIME_LENS is cumulative (frozen literal)', () => {
    expect(DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
    expect(DEFAULT_TIME_LENS.mode).toBe('cumulative');
  });

  it('TimeLensMode union accepts the four documented modes', () => {
    const modes: TimeLensMode[] = ['cumulative', 'fixed', 'rolling', 'openEnded'];
    expect(modes).toHaveLength(4);
  });

  it('rolling mode requires windowSize', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 50 };
    expect(lens.mode).toBe('rolling');
    expect(lens.windowSize).toBe(50);
  });

  it('fixed mode requires both anchor and windowSize', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 10, windowSize: 30 };
    expect(lens.mode).toBe('fixed');
    expect(lens.anchor).toBe(10);
    expect(lens.windowSize).toBe(30);
  });

  it('openEnded mode requires anchor only', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 5 };
    expect(lens.mode).toBe('openEnded');
    expect(lens.anchor).toBe(5);
  });
});

describe('timeLens — barrel re-export from @variscout/core', () => {
  it('exposes DEFAULT_TIME_LENS via @variscout/core barrel', () => {
    expect(DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
  });
});
