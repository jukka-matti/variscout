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

// ────────────────────────────────────────────────────────────────────────────
// Undo / redo (Phase 7.3)
// ────────────────────────────────────────────────────────────────────────────

describe('wallLayoutStore — undo/redo', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('records setNodePosition on the undo stack', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(1);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('round-trip: move → undo → revert → redo → restore', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 20 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toBeUndefined();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(1);

    useWallLayoutStore.getState().redo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 20 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(1);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('undo of sequential moves reverts the latest first', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 10 });
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 50, y: 50 });
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 99, y: 99 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 50, y: 50 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 10 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toBeUndefined();
  });

  it('caps undoStack at 50 entries (60 sequential changes keep ≤ 50)', () => {
    for (let i = 0; i < 60; i++) {
      useWallLayoutStore.getState().setNodePosition('hub-1', { x: i, y: i });
    }
    expect(useWallLayoutStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(50);
  });

  it('new mutation after undo clears the redo stack', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().redoStack.length).toBe(1);

    useWallLayoutStore.getState().setNodePosition('hub-2', { x: 99, y: 99 });
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('zoom changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setZoom(2.5);
    useWallLayoutStore.getState().setZoom(0.8);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('pan changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setPan({ x: 100, y: 100 });
    useWallLayoutStore.getState().setPan({ x: -50, y: -50 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('selection changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setSelection(['a', 'b']);
    useWallLayoutStore.getState().addToSelection('c');
    useWallLayoutStore.getState().clearSelection();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('rail toggle does NOT populate undoStack', () => {
    useWallLayoutStore.getState().toggleRail();
    useWallLayoutStore.getState().setRailOpen(true);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('undo on empty stack is a no-op (does not throw)', () => {
    expect(() => useWallLayoutStore.getState().undo()).not.toThrow();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('redo on empty stack is a no-op (does not throw)', () => {
    expect(() => useWallLayoutStore.getState().redo()).not.toThrow();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('applyWithUndo that changes nothing does not pollute stacks', () => {
    useWallLayoutStore.getState().applyWithUndo(() => {
      // no-op mutator
    });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('applyWithUndo round-trips an arbitrary mutation', () => {
    useWallLayoutStore.getState().applyWithUndo(draft => {
      draft.nodePositions['x'] = { x: 1, y: 1 };
      draft.nodePositions['y'] = { x: 2, y: 2 };
    });
    expect(useWallLayoutStore.getState().nodePositions).toEqual({
      x: { x: 1, y: 1 },
      y: { x: 2, y: 2 },
    });
    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions).toEqual({});
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Undo / redo (Phase 7.3)
// ────────────────────────────────────────────────────────────────────────────

describe('wallLayoutStore — undo/redo', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('records setNodePosition on the undo stack', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(1);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('round-trip: move → undo → revert → redo → restore', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 20 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toBeUndefined();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(1);

    useWallLayoutStore.getState().redo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 20 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(1);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('undo of sequential moves reverts the latest first', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 10 });
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 50, y: 50 });
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 99, y: 99 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 50, y: 50 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toEqual({ x: 10, y: 10 });

    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions['hub-1']).toBeUndefined();
  });

  it('caps undoStack at 50 entries (60 sequential changes keep ≤ 50)', () => {
    for (let i = 0; i < 60; i++) {
      useWallLayoutStore.getState().setNodePosition('hub-1', { x: i, y: i });
    }
    expect(useWallLayoutStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(50);
  });

  it('new mutation after undo clears the redo stack', () => {
    useWallLayoutStore.getState().setNodePosition('hub-1', { x: 10, y: 20 });
    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().redoStack.length).toBe(1);

    useWallLayoutStore.getState().setNodePosition('hub-2', { x: 99, y: 99 });
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('zoom changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setZoom(2.5);
    useWallLayoutStore.getState().setZoom(0.8);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('pan changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setPan({ x: 100, y: 100 });
    useWallLayoutStore.getState().setPan({ x: -50, y: -50 });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('selection changes do NOT populate undoStack', () => {
    useWallLayoutStore.getState().setSelection(['a', 'b']);
    useWallLayoutStore.getState().addToSelection('c');
    useWallLayoutStore.getState().clearSelection();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('rail toggle does NOT populate undoStack', () => {
    useWallLayoutStore.getState().toggleRail();
    useWallLayoutStore.getState().setRailOpen(true);
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('undo on empty stack is a no-op (does not throw)', () => {
    expect(() => useWallLayoutStore.getState().undo()).not.toThrow();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('redo on empty stack is a no-op (does not throw)', () => {
    expect(() => useWallLayoutStore.getState().redo()).not.toThrow();
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
    expect(useWallLayoutStore.getState().redoStack.length).toBe(0);
  });

  it('applyWithUndo that changes nothing does not pollute stacks', () => {
    useWallLayoutStore.getState().applyWithUndo(() => {
      // no-op mutator
    });
    expect(useWallLayoutStore.getState().undoStack.length).toBe(0);
  });

  it('applyWithUndo round-trips an arbitrary mutation', () => {
    useWallLayoutStore.getState().applyWithUndo(draft => {
      draft.nodePositions['x'] = { x: 1, y: 1 };
      draft.nodePositions['y'] = { x: 2, y: 2 };
    });
    expect(useWallLayoutStore.getState().nodePositions).toEqual({
      x: { x: 1, y: 1 },
      y: { x: 2, y: 2 },
    });
    useWallLayoutStore.getState().undo();
    expect(useWallLayoutStore.getState().nodePositions).toEqual({});
  });
});
