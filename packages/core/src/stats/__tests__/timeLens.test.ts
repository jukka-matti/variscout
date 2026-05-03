import { describe, it, expect } from 'vitest';
import { DEFAULT_TIME_LENS, type TimeLens, type TimeLensMode } from '../timeLens';
import * as core from '../../index';

describe('timeLens — module', () => {
  it('DEFAULT_TIME_LENS is cumulative with no window or anchor', () => {
    expect(DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
    expect(DEFAULT_TIME_LENS.windowSize).toBeUndefined();
    expect(DEFAULT_TIME_LENS.anchor).toBeUndefined();
  });

  it('TimeLensMode union accepts the four documented modes', () => {
    const modes: TimeLensMode[] = ['cumulative', 'fixed', 'rolling', 'openEnded'];
    expect(modes).toHaveLength(4);
  });

  it('TimeLens with rolling mode carries windowSize', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 50 };
    expect(lens.windowSize).toBe(50);
  });

  it('TimeLens with fixed mode carries windowSize and anchor', () => {
    const lens: TimeLens = { mode: 'fixed', windowSize: 30, anchor: 10 };
    expect(lens.anchor).toBe(10);
    expect(lens.windowSize).toBe(30);
  });

  it('TimeLens with openEnded mode carries anchor only', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 5 };
    expect(lens.anchor).toBe(5);
    expect(lens.windowSize).toBeUndefined();
  });
});

describe('timeLens — barrel re-export from @variscout/core', () => {
  it('exposes DEFAULT_TIME_LENS via @variscout/core barrel', () => {
    expect(core.DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
  });
});
