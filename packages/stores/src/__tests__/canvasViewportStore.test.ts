import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCanvasViewportStore,
  persistCanvasViewport,
  rehydrateCanvasViewport,
} from '../canvasViewportStore';

describe('canvasViewportStore', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('defaults viewMode to map (preserves ADR-066 default)', () => {
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
  });

  it('toggles viewMode to wall and back', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    useCanvasViewportStore.getState().setViewMode('map');
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
  });

  it('returns a default viewport for an unknown hub', () => {
    expect(useCanvasViewportStore.getState().getViewport('hub-A')).toEqual({
      zoom: 1,
      pan: { x: 0, y: 0 },
      currentLevel: 'l2',
      nodePositions: {},
      groupByTributary: false,
    });
  });

  it('updates pan and zoom per hub', () => {
    useCanvasViewportStore.getState().setPan('hub-A', { x: 100, y: -50 });
    useCanvasViewportStore.getState().setZoom('hub-A', 2);

    expect(useCanvasViewportStore.getState().getViewport('hub-A').pan).toEqual({
      x: 100,
      y: -50,
    });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').zoom).toBe(2);
    expect(useCanvasViewportStore.getState().getViewport('hub-B').zoom).toBe(1);
  });

  it('rail is open by default', () => {
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);
  });

  it('toggles rail', () => {
    useCanvasViewportStore.getState().toggleRail();
    expect(useCanvasViewportStore.getState().railOpen).toBe(false);
    useCanvasViewportStore.getState().toggleRail();
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);
  });

  it('setGroupByTributary toggles the per-hub flag', () => {
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').groupByTributary).toBe(true);
    expect(useCanvasViewportStore.getState().getViewport('hub-B').groupByTributary).toBe(false);
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', false);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').groupByTributary).toBe(false);
  });

  it('groupByTributary changes do NOT populate undoStack (UI-only)', () => {
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', false);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });
});

describe('canvasViewportStore — levels, positions, selection, cache', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('sets node position per hub', () => {
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 500, y: 400 });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']).toEqual({
      x: 500,
      y: 400,
    });
    expect(
      useCanvasViewportStore.getState().getViewport('hub-B').nodePositions['node-1']
    ).toBeUndefined();
  });

  it('sets level with l3 focalStepId validation and clears stale focalStepId on l1/l2', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l1');
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');

    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-1');
    expect(useCanvasViewportStore.getState().getViewport('hub-A')).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });

    expect(() => useCanvasViewportStore.getState().setLevel('hub-B', 'l3')).toThrow(
      /focalStepId required when currentLevel === 'l3'/
    );

    useCanvasViewportStore.getState().setLevel('hub-A', 'l2');
    expect(useCanvasViewportStore.getState().getViewport('hub-A')).toMatchObject({
      currentLevel: 'l2',
    });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').focalStepId).toBeUndefined();
  });

  it('fitToContent ensures a viewport exists and optionally updates level', () => {
    useCanvasViewportStore.getState().fitToContent('hub-A', 'l1');
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
    useCanvasViewportStore.getState().fitToContent('hub-B');
    expect(useCanvasViewportStore.getState().getViewport('hub-B').currentLevel).toBe('l2');
  });

  it('keeps multiple hubs independent', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 1.5);
    useCanvasViewportStore.getState().setPan('hub-A', { x: 10, y: 20 });
    useCanvasViewportStore.getState().setLevel('hub-A', 'l1');
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 1, y: 2 });
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);

    useCanvasViewportStore.getState().setZoom('hub-B', 2.5);
    useCanvasViewportStore.getState().setPan('hub-B', { x: -10, y: -20 });
    useCanvasViewportStore.getState().setLevel('hub-B', 'l3', 'step-9');
    useCanvasViewportStore.getState().setNodePosition('hub-B', 'node-1', { x: 9, y: 8 });
    useCanvasViewportStore.getState().setGroupByTributary('hub-B', false);

    expect(useCanvasViewportStore.getState().getViewport('hub-A')).toEqual({
      zoom: 1.5,
      pan: { x: 10, y: 20 },
      currentLevel: 'l1',
      nodePositions: { 'node-1': { x: 1, y: 2 } },
      groupByTributary: true,
    });
    expect(useCanvasViewportStore.getState().getViewport('hub-B')).toEqual({
      zoom: 2.5,
      pan: { x: -10, y: -20 },
      currentLevel: 'l3',
      focalStepId: 'step-9',
      nodePositions: { 'node-1': { x: 9, y: 8 } },
      groupByTributary: false,
    });
  });

  it('replaces selection', () => {
    useCanvasViewportStore.getState().setSelection(['a', 'b']);
    expect([...useCanvasViewportStore.getState().selection]).toEqual(['a', 'b']);
    useCanvasViewportStore.getState().setSelection(['c']);
    expect([...useCanvasViewportStore.getState().selection]).toEqual(['c']);
  });

  it('adds to selection and clears', () => {
    useCanvasViewportStore.getState().addToSelection('a');
    useCanvasViewportStore.getState().addToSelection('b');
    expect(useCanvasViewportStore.getState().selection.size).toBe(2);
    useCanvasViewportStore.getState().clearSelection();
    expect(useCanvasViewportStore.getState().selection.size).toBe(0);
  });

  it('stores an AND-check result by gate path', () => {
    useCanvasViewportStore.getState().setAndCheckResult('root', { holds: 38, total: 42, at: 123 });
    expect(useCanvasViewportStore.getState().andCheckResults.root).toEqual({
      holds: 38,
      total: 42,
      at: 123,
    });
  });

  it('opens and closes chart clusters', () => {
    useCanvasViewportStore.getState().openChartCluster({
      tributaryId: 't1',
      x: 100,
      y: 200,
      activeChart: 'ichart',
    });
    expect(useCanvasViewportStore.getState().openChartClusters.t1?.activeChart).toBe('ichart');
    useCanvasViewportStore.getState().closeChartCluster('t1');
    expect(useCanvasViewportStore.getState().openChartClusters.t1).toBeUndefined();
  });

  it('enqueues and drains pending comments', () => {
    useCanvasViewportStore.getState().enqueuePendingComment({
      scope: 'hub',
      targetId: 'h1',
      text: 'offline note',
      localId: 'loc-1',
      createdAt: 1,
    });
    expect(useCanvasViewportStore.getState().pendingComments.length).toBe(1);
    const drained = useCanvasViewportStore.getState().drainPendingComments();
    expect(drained.length).toBe(1);
    expect(useCanvasViewportStore.getState().pendingComments.length).toBe(0);
  });
});

describe('canvasViewportStore persistence', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('persists and rehydrates one hub viewport with viewMode and railOpen', async () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useCanvasViewportStore.getState().setRailOpen(false);
    useCanvasViewportStore.getState().setZoom('hub-A', 2.25);
    useCanvasViewportStore.getState().setPan('hub-A', { x: 123, y: 456 });
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 10, y: 20 });
    useCanvasViewportStore.getState().setGroupByTributary('hub-A', true);
    await persistCanvasViewport('hub-A');

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);

    await rehydrateCanvasViewport('hub-A');
    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(useCanvasViewportStore.getState().railOpen).toBe(false);
    expect(useCanvasViewportStore.getState().getViewport('hub-A')).toEqual({
      zoom: 2.25,
      pan: { x: 123, y: 456 },
      currentLevel: 'l3',
      focalStepId: 'step-7',
      nodePositions: { 'node-1': { x: 10, y: 20 } },
      groupByTributary: true,
    });
  });

  it('persists and rehydrates hubs independently', async () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 1.25);
    await persistCanvasViewport('hub-A');

    useCanvasViewportStore.getState().setZoom('hub-B', 3);
    useCanvasViewportStore.getState().setPan('hub-B', { x: 30, y: 40 });
    await persistCanvasViewport('hub-B');

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    await rehydrateCanvasViewport('hub-A');
    expect(useCanvasViewportStore.getState().getViewport('hub-A').zoom).toBe(1.25);
    expect(useCanvasViewportStore.getState().getViewport('hub-B').zoom).toBe(1);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    await rehydrateCanvasViewport('hub-B');
    expect(useCanvasViewportStore.getState().getViewport('hub-B')).toMatchObject({
      zoom: 3,
      pan: { x: 30, y: 40 },
    });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').zoom).toBe(1);
  });

  it('rehydrate with unknown hub leaves defaults', async () => {
    await rehydrateCanvasViewport('unknown-hub');
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().getViewport('unknown-hub')).toEqual({
      zoom: 1,
      pan: { x: 0, y: 0 },
      currentLevel: 'l2',
      nodePositions: {},
      groupByTributary: false,
    });
  });
});

describe('canvasViewportStore — undo/redo', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('records setNodePosition on the undo stack', () => {
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 10, y: 20 });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(1);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('round-trip: move -> undo -> revert -> redo -> restore', () => {
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 10, y: 20 });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']).toEqual({
      x: 10,
      y: 20,
    });

    useCanvasViewportStore.getState().undo();
    expect(
      useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']
    ).toBeUndefined();
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(1);

    useCanvasViewportStore.getState().redo();
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']).toEqual({
      x: 10,
      y: 20,
    });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(1);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('undo of sequential moves reverts the latest first', () => {
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 10, y: 10 });
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 50, y: 50 });
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 99, y: 99 });

    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']).toEqual({
      x: 50,
      y: 50,
    });

    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']).toEqual({
      x: 10,
      y: 10,
    });

    useCanvasViewportStore.getState().undo();
    expect(
      useCanvasViewportStore.getState().getViewport('hub-A').nodePositions['node-1']
    ).toBeUndefined();
  });

  it('caps undoStack at 50 entries (60 sequential changes keep <= 50)', () => {
    for (let i = 0; i < 60; i++) {
      useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: i, y: i });
    }
    expect(useCanvasViewportStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(50);
  });

  it('new mutation after undo clears the redo stack', () => {
    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-1', { x: 10, y: 20 });
    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(1);

    useCanvasViewportStore.getState().setNodePosition('hub-A', 'node-2', { x: 99, y: 99 });
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('zoom changes do NOT populate undoStack', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 2.5);
    useCanvasViewportStore.getState().setZoom('hub-A', 0.8);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('pan changes do NOT populate undoStack', () => {
    useCanvasViewportStore.getState().setPan('hub-A', { x: 100, y: 100 });
    useCanvasViewportStore.getState().setPan('hub-A', { x: -50, y: -50 });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('selection changes do NOT populate undoStack', () => {
    useCanvasViewportStore.getState().setSelection(['a', 'b']);
    useCanvasViewportStore.getState().addToSelection('c');
    useCanvasViewportStore.getState().clearSelection();
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('rail toggle does NOT populate undoStack', () => {
    useCanvasViewportStore.getState().toggleRail();
    useCanvasViewportStore.getState().setRailOpen(true);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('undo on empty stack is a no-op (does not throw)', () => {
    expect(() => useCanvasViewportStore.getState().undo()).not.toThrow();
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('redo on empty stack is a no-op (does not throw)', () => {
    expect(() => useCanvasViewportStore.getState().redo()).not.toThrow();
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('applyWithUndo that changes nothing does not pollute stacks', () => {
    useCanvasViewportStore.getState().applyWithUndo(() => {
      // no-op mutator
    });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('applyWithUndo round-trips an arbitrary mutation', () => {
    useCanvasViewportStore.getState().applyWithUndo(draft => {
      draft.viewports['hub-A'] = {
        zoom: 1,
        pan: { x: 0, y: 0 },
        currentLevel: 'l2',
        nodePositions: {
          x: { x: 1, y: 1 },
          y: { x: 2, y: 2 },
        },
        groupByTributary: false,
      };
    });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions).toEqual({
      x: { x: 1, y: 1 },
      y: { x: 2, y: 2 },
    });
    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport('hub-A').nodePositions).toEqual({});
  });
});

describe('canvasViewportStore — selection persistence boundary', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('does NOT persist selection', async () => {
    const hubId = 'hub-selection-boundary';

    useCanvasViewportStore.getState().setSelection(['hub-1', 'hub-2']);
    expect([...useCanvasViewportStore.getState().selection]).toEqual(['hub-1', 'hub-2']);

    await persistCanvasViewport(hubId);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    expect([...useCanvasViewportStore.getState().selection]).toEqual([]);

    await rehydrateCanvasViewport(hubId);
    expect([...useCanvasViewportStore.getState().selection]).toEqual([]);
  });
});
