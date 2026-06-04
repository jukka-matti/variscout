import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalysisScopeStore, getAnalysisScopeInitialState } from '@variscout/stores';
import { navigateToExploreForChip } from '../navigateToExploreForChip';

describe('navigateToExploreForChip', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });

  it('outcome target sets yColumn and invokes the navigation callback', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'outcome', columnName: 'Diameter' }, onNavigate);
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('outcome target with stepId also sets stepId', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'outcome', columnName: 'Diameter', stepId: 'step-3' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-3');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target sets boxplotFactor and leaves yColumn untouched', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target with stepId sets both boxplotFactor and stepId', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'factor', columnName: 'Vessel', stepId: 'step-2' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-2');
  });

  it('factor target without stepId does NOT clear an existing stepId scope', () => {
    useAnalysisScopeStore.setState({ stepId: 'step-1' });
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-1');
  });

  it('step target sets stepId and invokes the callback', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'step', stepId: 'step-1' }, onNavigate);
    expect(useAnalysisScopeStore.getState().stepId).toBe('step-1');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target with outcomeColumn sets BOTH yColumn and boxplotFactor (CS-13 crossing-back)', () => {
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'factor', columnName: 'Vessel', outcomeColumn: 'Diameter' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('factor target without outcomeColumn leaves an existing yColumn untouched (chip-path regression guard)', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Existing' });
    const onNavigate = vi.fn();
    navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Existing');
  });

  it('factor target with an EMPTY outcomeColumn is treated as absent — yColumn untouched (falsy guard contract)', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Existing' });
    const onNavigate = vi.fn();
    navigateToExploreForChip(
      { kind: 'factor', columnName: 'Vessel', outcomeColumn: '' },
      onNavigate
    );
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Existing');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
  });
});
