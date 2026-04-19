import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWallLayoutStore } from '../wallLayoutStore';

describe('wallLayoutStore', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('defaults viewMode to map (preserves ADR-066 default)', () => {
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('toggles viewMode to wall and back', () => {
    useWallLayoutStore.getState().setViewMode('wall');
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
    useWallLayoutStore.getState().setViewMode('map');
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('starts with zoom 1.0 and pan 0,0', () => {
    expect(useWallLayoutStore.getState().zoom).toBe(1);
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 0, y: 0 });
  });

  it('updates pan', () => {
    useWallLayoutStore.getState().setPan({ x: 100, y: -50 });
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 100, y: -50 });
  });

  it('updates zoom', () => {
    useWallLayoutStore.getState().setZoom(2);
    expect(useWallLayoutStore.getState().zoom).toBe(2);
  });

  it('rail is open by default', () => {
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });

  it('toggles rail', () => {
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(false);
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });
});

describe('wallLayoutStore — positions, selection, cache', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('sets node position', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 500, y: 400 });
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 500, y: 400 });
  });

  it('replaces selection', () => {
    useWallLayoutStore.getState().setSelection(['a', 'b']);
    expect([...useWallLayoutStore.getState().selection]).toEqual(['a', 'b']);
    useWallLayoutStore.getState().setSelection(['c']);
    expect([...useWallLayoutStore.getState().selection]).toEqual(['c']);
  });

  it('adds to selection and clears', () => {
    useWallLayoutStore.getState().addToSelection('a');
    useWallLayoutStore.getState().addToSelection('b');
    expect(useWallLayoutStore.getState().selection.size).toBe(2);
    useWallLayoutStore.getState().clearSelection();
    expect(useWallLayoutStore.getState().selection.size).toBe(0);
  });

  it('stores an AND-check result by gate path', () => {
    useWallLayoutStore.getState().setAndCheckResult('root', { holds: 38, total: 42, at: 123 });
    expect(useWallLayoutStore.getState().andCheckResults.root).toEqual({
      holds: 38,
      total: 42,
      at: 123,
    });
  });

  it('opens and closes chart clusters', () => {
    useWallLayoutStore.getState().openChartCluster({
      tributaryId: 't1',
      x: 100,
      y: 200,
      activeChart: 'ichart',
    });
    expect(useWallLayoutStore.getState().openChartClusters.t1?.activeChart).toBe('ichart');
    useWallLayoutStore.getState().closeChartCluster('t1');
    expect(useWallLayoutStore.getState().openChartClusters.t1).toBeUndefined();
  });

  it('enqueues and drains pending comments', () => {
    useWallLayoutStore.getState().enqueuePendingComment({
      scope: 'hub',
      targetId: 'h1',
      text: 'offline note',
      localId: 'loc-1',
      createdAt: 1,
    });
    expect(useWallLayoutStore.getState().pendingComments.length).toBe(1);
    const drained = useWallLayoutStore.getState().drainPendingComments();
    expect(drained.length).toBe(1);
    expect(useWallLayoutStore.getState().pendingComments.length).toBe(0);
  });
});

import { rehydrateWallLayout, persistWallLayout } from '../wallLayoutStore';

describe('wallLayoutStore persistence', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('persists and rehydrates viewMode + positions for a projectId', async () => {
    useWallLayoutStore.getState().setViewMode('wall');
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 123, y: 456 });
    await persistWallLayout('proj-abc');

    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
    expect(useWallLayoutStore.getState().viewMode).toBe('map');

    await rehydrateWallLayout('proj-abc');
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 123, y: 456 });
  });

  it('rehydrate with unknown projectId leaves defaults', async () => {
    await rehydrateWallLayout('unknown-project');
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });
});
