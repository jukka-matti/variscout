import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useCanvasViewportStore,
  persistCanvasViewport,
  rehydrateCanvasViewport,
} from '../canvasViewportStore';
import type { ProcessHubId } from '@variscout/core/processHub';

// Typed hub ID constants for test fixtures (cast acceptable inside test files per project convention)
const HUB_A = 'hub-A' as ProcessHubId;
const HUB_B = 'hub-B' as ProcessHubId;
const HUB_1 = 'hub-1' as ProcessHubId;
const HUB_2 = 'hub-2' as ProcessHubId;
const HUB_SELECTION = 'hub-selection-boundary' as ProcessHubId;

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
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toEqual({
      zoom: 1,
      pan: { x: 0, y: 0 },
      currentLevel: 'l2',
      nodePositions: {},
      groupByTributary: false,
    });
  });

  it('updates pan and zoom per hub', () => {
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 100, y: -50 });
    useCanvasViewportStore.getState().setZoom(HUB_A, 2);

    expect(useCanvasViewportStore.getState().getViewport(HUB_A).pan).toEqual({
      x: 100,
      y: -50,
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).zoom).toBe(2);
    expect(useCanvasViewportStore.getState().getViewport(HUB_B).zoom).toBe(1);
  });

  it('setZoom syncs currentLevel from zoom and permits placeholder l3 without focalStepId', () => {
    useCanvasViewportStore.getState().setZoom(HUB_A, 0.2);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 0.2,
      currentLevel: 'l1',
    });

    useCanvasViewportStore.getState().setZoom(HUB_A, 1);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 1,
      currentLevel: 'l2',
    });

    useCanvasViewportStore.getState().setZoom(HUB_A, 2.5);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 2.5,
      currentLevel: 'l3',
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).focalStepId).toBeUndefined();
  });

  it('setZoom clears focalStepId when zoom leaves l3', () => {
    useCanvasViewportStore.getState().setLevel(HUB_A, 'l3', 'step-1');

    useCanvasViewportStore.getState().setZoom(HUB_A, 1);

    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 1,
      currentLevel: 'l2',
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).focalStepId).toBeUndefined();
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
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, true);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).groupByTributary).toBe(true);
    expect(useCanvasViewportStore.getState().getViewport(HUB_B).groupByTributary).toBe(false);
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, false);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).groupByTributary).toBe(false);
  });

  it('groupByTributary changes do NOT populate undoStack (UI-only)', () => {
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, true);
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, false);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });
});

describe('canvasViewportStore — levels, positions, selection, cache', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('sets node position per hub', () => {
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 500, y: 400 });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']).toEqual({
      x: 500,
      y: 400,
    });
    expect(
      useCanvasViewportStore.getState().getViewport(HUB_B).nodePositions['node-1']
    ).toBeUndefined();
  });

  it('sets level with l3 focalStepId validation and clears stale focalStepId on l1/l2', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    useCanvasViewportStore.getState().setLevel(HUB_A, 'l1');
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).currentLevel).toBe('l1');

    useCanvasViewportStore.getState().setLevel(HUB_A, 'l3', 'step-1');
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });

    // l3 without focalStepId: warns and leaves state unchanged (no-op, no throw).
    const levelBefore = useCanvasViewportStore.getState().getViewport(HUB_B).currentLevel;
    useCanvasViewportStore.getState().setLevel(HUB_B, 'l3');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('l3 requested without focalStepId')
    );
    expect(useCanvasViewportStore.getState().getViewport(HUB_B).currentLevel).toBe(levelBefore);

    warnSpy.mockRestore();

    useCanvasViewportStore.getState().setLevel(HUB_A, 'l2');
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      currentLevel: 'l2',
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).focalStepId).toBeUndefined();
  });

  it('fitToContent applies placeholder zoom, resets pan, and preserves layout flags', () => {
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 100, y: -50 });
    useCanvasViewportStore.getState().setZoom(HUB_A, 1.5);
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 20 });
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, true);

    useCanvasViewportStore.getState().fitToContent(HUB_A, 'l1');
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toEqual({
      zoom: 0.2,
      pan: { x: 0, y: 0 },
      currentLevel: 'l1',
      nodePositions: { 'node-1': { x: 10, y: 20 } },
      groupByTributary: true,
    });

    useCanvasViewportStore.getState().fitToContent(HUB_B);
    expect(useCanvasViewportStore.getState().getViewport(HUB_B)).toEqual({
      zoom: 1,
      pan: { x: 0, y: 0 },
      currentLevel: 'l2',
      nodePositions: {},
      groupByTributary: false,
    });
  });

  it('fitToContent uses current level when no explicit level is provided', () => {
    useCanvasViewportStore.getState().setLevel(HUB_A, 'l1');
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 9, y: 8 });

    useCanvasViewportStore.getState().fitToContent(HUB_A);

    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 0.2,
      pan: { x: 0, y: 0 },
      currentLevel: 'l1',
    });
  });

  it('fitToContent falls back to l2 for bare fit from placeholder l3 without focalStepId', () => {
    useCanvasViewportStore.getState().setZoom(HUB_A, 2.5);

    expect(() => useCanvasViewportStore.getState().fitToContent(HUB_A)).not.toThrow();
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 1,
      pan: { x: 0, y: 0 },
      currentLevel: 'l2',
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).focalStepId).toBeUndefined();
  });

  it('fitToContent l3 requires and preserves an existing focalStepId', () => {
    useCanvasViewportStore.getState().setLevel(HUB_A, 'l3', 'step-1');
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 9, y: 8 });

    useCanvasViewportStore.getState().fitToContent(HUB_A, 'l3');

    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toMatchObject({
      zoom: 2.5,
      pan: { x: 0, y: 0 },
      currentLevel: 'l3',
      focalStepId: 'step-1',
    });

    // fitToContent with explicit l3 on a hub with no focalStepId: warns, leaves viewport unchanged.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const snapshotBefore = useCanvasViewportStore.getState().getViewport(HUB_B);
    useCanvasViewportStore.getState().fitToContent(HUB_B, 'l3');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('l3 requested without focalStepId')
    );
    expect(useCanvasViewportStore.getState().getViewport(HUB_B)).toEqual(snapshotBefore);
    warnSpy.mockRestore();
  });

  it('keeps multiple hubs independent', () => {
    useCanvasViewportStore.getState().setZoom(HUB_A, 1.5);
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 10, y: 20 });
    useCanvasViewportStore.getState().setLevel(HUB_A, 'l1');
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 1, y: 2 });
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, true);

    useCanvasViewportStore.getState().setZoom(HUB_B, 2.5);
    useCanvasViewportStore.getState().setPan(HUB_B, { x: -10, y: -20 });
    useCanvasViewportStore.getState().setLevel(HUB_B, 'l3', 'step-9');
    useCanvasViewportStore.getState().setNodePosition(HUB_B, 'node-1', { x: 9, y: 8 });
    useCanvasViewportStore.getState().setGroupByTributary(HUB_B, false);

    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toEqual({
      zoom: 1.5,
      pan: { x: 10, y: 20 },
      currentLevel: 'l1',
      nodePositions: { 'node-1': { x: 1, y: 2 } },
      groupByTributary: true,
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_B)).toEqual({
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
    useCanvasViewportStore.getState().setZoom(HUB_A, 2.25);
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 123, y: 456 });
    useCanvasViewportStore.getState().setLevel(HUB_A, 'l3', 'step-7');
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 20 });
    useCanvasViewportStore.getState().setGroupByTributary(HUB_A, true);
    await persistCanvasViewport(HUB_A);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);

    await rehydrateCanvasViewport(HUB_A);
    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(useCanvasViewportStore.getState().railOpen).toBe(false);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A)).toEqual({
      zoom: 2.25,
      pan: { x: 123, y: 456 },
      currentLevel: 'l3',
      focalStepId: 'step-7',
      nodePositions: { 'node-1': { x: 10, y: 20 } },
      groupByTributary: true,
    });
  });

  it('does not apply rehydrate snapshot when guard returns false', async () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useCanvasViewportStore.getState().setRailOpen(false);
    useCanvasViewportStore.getState().setZoom(HUB_A, 2.25);
    await persistCanvasViewport(HUB_A);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    await rehydrateCanvasViewport(HUB_A, () => false);

    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().railOpen).toBe(true);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).zoom).toBe(1);
  });

  it('persists and rehydrates hubs independently', async () => {
    useCanvasViewportStore.getState().setZoom(HUB_A, 1.25);
    await persistCanvasViewport(HUB_A);

    useCanvasViewportStore.getState().setZoom(HUB_B, 3);
    useCanvasViewportStore.getState().setPan(HUB_B, { x: 30, y: 40 });
    await persistCanvasViewport(HUB_B);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    await rehydrateCanvasViewport(HUB_A);
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).zoom).toBe(1.25);
    expect(useCanvasViewportStore.getState().getViewport(HUB_B).zoom).toBe(1);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    await rehydrateCanvasViewport(HUB_B);
    expect(useCanvasViewportStore.getState().getViewport(HUB_B)).toMatchObject({
      zoom: 3,
      pan: { x: 30, y: 40 },
    });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).zoom).toBe(1);
  });

  it('rehydrate with unknown hub leaves defaults', async () => {
    const unknownHub = 'unknown-hub' as ProcessHubId;
    await rehydrateCanvasViewport(unknownHub);
    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(useCanvasViewportStore.getState().getViewport(unknownHub)).toEqual({
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
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 20 });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(1);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('round-trip: move -> undo -> revert -> redo -> restore', () => {
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 20 });
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']).toEqual({
      x: 10,
      y: 20,
    });

    useCanvasViewportStore.getState().undo();
    expect(
      useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']
    ).toBeUndefined();
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(1);

    useCanvasViewportStore.getState().redo();
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']).toEqual({
      x: 10,
      y: 20,
    });
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(1);
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('undo of sequential moves reverts the latest first', () => {
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 10 });
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 50, y: 50 });
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 99, y: 99 });

    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']).toEqual({
      x: 50,
      y: 50,
    });

    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']).toEqual({
      x: 10,
      y: 10,
    });

    useCanvasViewportStore.getState().undo();
    expect(
      useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions['node-1']
    ).toBeUndefined();
  });

  it('caps undoStack at 50 entries (60 sequential changes keep <= 50)', () => {
    for (let i = 0; i < 60; i++) {
      useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: i, y: i });
    }
    expect(useCanvasViewportStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(50);
  });

  it('new mutation after undo clears the redo stack', () => {
    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-1', { x: 10, y: 20 });
    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(1);

    useCanvasViewportStore.getState().setNodePosition(HUB_A, 'node-2', { x: 99, y: 99 });
    expect(useCanvasViewportStore.getState().redoStack.length).toBe(0);
  });

  it('zoom changes do NOT populate undoStack', () => {
    useCanvasViewportStore.getState().setZoom(HUB_A, 2.5);
    useCanvasViewportStore.getState().setZoom(HUB_A, 0.8);
    expect(useCanvasViewportStore.getState().undoStack.length).toBe(0);
  });

  it('pan changes do NOT populate undoStack', () => {
    useCanvasViewportStore.getState().setPan(HUB_A, { x: 100, y: 100 });
    useCanvasViewportStore.getState().setPan(HUB_A, { x: -50, y: -50 });
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
      draft.viewports[HUB_A] = {
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
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions).toEqual({
      x: { x: 1, y: 1 },
      y: { x: 2, y: 2 },
    });
    useCanvasViewportStore.getState().undo();
    expect(useCanvasViewportStore.getState().getViewport(HUB_A).nodePositions).toEqual({});
  });
});

describe('canvasViewportStore — selection persistence boundary', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
  });

  it('does NOT persist selection', async () => {
    const hubId = HUB_SELECTION;

    useCanvasViewportStore.getState().setSelection([HUB_1, HUB_2]);
    expect([...useCanvasViewportStore.getState().selection]).toEqual([HUB_1, HUB_2]);

    await persistCanvasViewport(hubId);

    useCanvasViewportStore.setState(useCanvasViewportStore.getInitialState());
    expect([...useCanvasViewportStore.getState().selection]).toEqual([]);

    await rehydrateCanvasViewport(hubId);
    expect([...useCanvasViewportStore.getState().selection]).toEqual([]);
  });
});
