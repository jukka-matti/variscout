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

describe('useAnalysisScopeStore — single-value setters', () => {
  it('setY assigns yColumn', () => {
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('yield_pct');
  });

  it('setY(undefined) clears yColumn', () => {
    useAnalysisScopeStore.setState({ yColumn: 'yield_pct' });
    useAnalysisScopeStore.getState().setY(undefined);
    expect(useAnalysisScopeStore.getState().yColumn).toBeUndefined();
  });

  it('setBoxplotFactor assigns boxplotFactor', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('vessel');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
  });

  it('setBoxplotFactor(undefined) clears boxplotFactor', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel' });
    useAnalysisScopeStore.getState().setBoxplotFactor(undefined);
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('setStepId assigns stepId', () => {
    useAnalysisScopeStore.getState().setStepId('pack');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });

  it('setStepId(undefined) clears stepId', () => {
    useAnalysisScopeStore.setState({ stepId: 'pack' });
    useAnalysisScopeStore.getState().setStepId(undefined);
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
  });

  it('setters are independent — setting Y does not touch other fields', () => {
    useAnalysisScopeStore.setState({ boxplotFactor: 'vessel', stepId: 'pack' });
    useAnalysisScopeStore.getState().setY('yield_pct');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('vessel');
    expect(useAnalysisScopeStore.getState().stepId).toBe('pack');
  });
});
