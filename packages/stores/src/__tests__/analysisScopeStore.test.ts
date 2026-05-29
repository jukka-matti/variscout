import { beforeEach, describe, expect, it } from 'vitest';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  STORE_LAYER,
} from '../analysisScopeStore';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

describe('useAnalysisScopeStore — skeleton', () => {
  it('declares STORE_LAYER as view', () => {
    expect(STORE_LAYER).toBe('view');
  });

  it('initialises all fields to undefined / empty', () => {
    const s = useAnalysisScopeStore.getState();
    expect(s.yColumn).toBeUndefined();
    expect(s.boxplotFactor).toBeUndefined();
    expect(s.stepId).toBeUndefined();
    expect(s.categoricalFilters).toEqual([]);
  });

  it('getAnalysisScopeInitialState returns a fresh state object each call', () => {
    const a = getAnalysisScopeInitialState();
    const b = getAnalysisScopeInitialState();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('exposes getInitialState on the store instance for the canonical reset pattern', () => {
    const fn = (useAnalysisScopeStore as unknown as { getInitialState: () => unknown })
      .getInitialState;
    expect(typeof fn).toBe('function');
  });
});
