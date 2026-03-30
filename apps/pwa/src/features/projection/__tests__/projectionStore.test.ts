import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectionStore } from '../projectionStore';

beforeEach(() => {
  useProjectionStore.setState({
    activeProjection: null,
    drillProjection: null,
    benchmarkProjection: null,
    cumulativeProjection: null,
    improvementProjection: null,
    resolvedProjection: null,
    centeringOpportunity: null,
    specSuggestion: null,
    complement: null,
    isDrilling: false,
  });
});

describe('projectionStore', () => {
  it('syncProjections updates partial state', () => {
    useProjectionStore.getState().syncProjections({
      isDrilling: true,
      complement: { mean: 10, stdDev: 2, count: 50 },
    });
    const s = useProjectionStore.getState();
    expect(s.isDrilling).toBe(true);
    expect(s.complement).toEqual({ mean: 10, stdDev: 2, count: 50 });
    expect(s.activeProjection).toBeNull(); // untouched
  });

  it('setComplement updates complement', () => {
    useProjectionStore.getState().setComplement({ mean: 5, stdDev: 1, count: 20 });
    expect(useProjectionStore.getState().complement).toEqual({ mean: 5, stdDev: 1, count: 20 });
    useProjectionStore.getState().setComplement(null);
    expect(useProjectionStore.getState().complement).toBeNull();
  });

  it('setIsDrilling updates drilling state', () => {
    useProjectionStore.getState().setIsDrilling(true);
    expect(useProjectionStore.getState().isDrilling).toBe(true);
  });
});
