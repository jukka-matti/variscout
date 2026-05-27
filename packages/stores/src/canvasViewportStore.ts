/**
 * canvasViewportStore — UI-only Zustand feature store for canvas viewport state.
 *
 * Holds per-hub viewport snapshots plus session/global wall UI state. Persisted
 * to IndexedDB per hubId via Dexie. Not a domain store — domain facts live in
 * analyzeStore and canvasStore.
 */

// R12 exception: separate Dexie DB for cross-app canvas viewport UI state.
import { inferLevel, FIT_TO_CONTENT_ZOOM_BY_LEVEL, type CanvasLevel } from '@variscout/core/canvas';
import type { ProcessHubId } from '@variscout/core/processHub';
import Dexie, { type Table } from 'dexie';
import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer';
import { create } from 'zustand';

export const STORE_LAYER = 'annotation-per-hub' as const;

enablePatches();

const UNDO_STACK_CAP = 50;
export type NodeId = string;
export type TributaryId = string;
export type GateNodePath = string;
export type CanvasViewportFit = { zoom: number; pan: { x: number; y: number } };

export interface CanvasViewportSnapshot {
  zoom: number;
  pan: { x: number; y: number };
  currentLevel: CanvasLevel;
  focalStepId?: string;
  nodePositions: Record<NodeId, { x: number; y: number }>;
  groupByTributary: boolean;
}

export interface ChartClusterState {
  tributaryId: TributaryId;
  x: number;
  y: number;
  activeChart: 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability';
}

export interface AndCheckSnapshot {
  holds: number;
  total: number;
  at: number;
}

export interface PendingComment {
  scope: 'finding' | 'hub';
  targetId: string;
  text: string;
  author?: string;
  localId: string;
  createdAt: number;
}

export interface CanvasViewportState {
  viewMode: 'map' | 'wall';
  viewports: Record<ProcessHubId, CanvasViewportSnapshot>;
  selection: Set<NodeId>;
  openChartClusters: Record<TributaryId, ChartClusterState>;
  railOpen: boolean;
  andCheckResults: Record<GateNodePath, AndCheckSnapshot>;
  pendingComments: PendingComment[];
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
}

export interface UndoEntry {
  forward: Patch[];
  inverse: Patch[];
}

export interface CanvasViewportActions {
  getViewport: (hubId: ProcessHubId) => CanvasViewportSnapshot;
  setViewMode: (mode: 'map' | 'wall') => void;
  setNodePosition: (hubId: ProcessHubId, nodeId: NodeId, pos: { x: number; y: number }) => void;
  setSelection: (ids: NodeId[]) => void;
  addToSelection: (id: NodeId) => void;
  clearSelection: () => void;
  setZoom: (hubId: ProcessHubId, zoom: number) => void;
  setPan: (hubId: ProcessHubId, pan: { x: number; y: number }) => void;
  setLevel: (hubId: ProcessHubId, level: CanvasLevel, focalStepId?: string) => void;
  fitToContent: (hubId: ProcessHubId, level?: CanvasLevel, fit?: CanvasViewportFit) => void;
  toggleRail: () => void;
  setRailOpen: (open: boolean) => void;
  setGroupByTributary: (hubId: ProcessHubId, on: boolean) => void;
  setAndCheckResult: (path: GateNodePath, snapshot: AndCheckSnapshot) => void;
  openChartCluster: (state: ChartClusterState) => void;
  closeChartCluster: (tributaryId: TributaryId) => void;
  enqueuePendingComment: (comment: PendingComment) => void;
  drainPendingComments: () => PendingComment[];
  applyWithUndo: (mutator: (draft: CanvasViewportState) => void) => void;
  undo: () => void;
  redo: () => void;
}

export const getDefaultViewport = (): CanvasViewportSnapshot => ({
  zoom: 1,
  pan: { x: 0, y: 0 },
  currentLevel: 'l2',
  nodePositions: {},
  groupByTributary: false,
});

function setViewportLevel(
  viewport: CanvasViewportSnapshot,
  level: CanvasLevel,
  focalStepId?: string
): CanvasViewportSnapshot {
  if (level === 'l3' && !focalStepId) {
    console.warn(
      'setViewportLevel: l3 requested without focalStepId; ignoring. Set focalStepId via setFocalStepId first.'
    );
    return viewport; // no-op
  }

  if (level === 'l3') {
    return { ...viewport, currentLevel: level, focalStepId };
  }

  const { focalStepId: _staleFocalStepId, ...withoutFocalStepId } = viewport;
  return { ...withoutFocalStepId, currentLevel: level };
}

function withViewport(
  viewports: Record<ProcessHubId, CanvasViewportSnapshot>,
  hubId: ProcessHubId,
  updater: (viewport: CanvasViewportSnapshot) => CanvasViewportSnapshot
): Record<ProcessHubId, CanvasViewportSnapshot> {
  const current = viewports[hubId] ?? getDefaultViewport();
  return { ...viewports, [hubId]: updater(current) };
}

export const getCanvasViewportInitialState = (): CanvasViewportState => ({
  viewMode: 'map',
  viewports: {},
  selection: new Set<NodeId>(),
  openChartClusters: {},
  railOpen: true,
  andCheckResults: {},
  pendingComments: [],
  undoStack: [],
  redoStack: [],
});

export const useCanvasViewportStore = create<CanvasViewportState & CanvasViewportActions>()(
  (set, get) => ({
    ...getCanvasViewportInitialState(),

    getViewport: hubId => get().viewports[hubId] ?? getDefaultViewport(),
    setViewMode: viewMode => set({ viewMode }),
    setNodePosition: (hubId, nodeId, pos) => {
      get().applyWithUndo(draft => {
        draft.viewports[hubId] = draft.viewports[hubId] ?? getDefaultViewport();
        draft.viewports[hubId].nodePositions[nodeId] = pos;
      });
    },
    setSelection: ids => set({ selection: new Set(ids) }),
    addToSelection: id => set(s => ({ selection: new Set([...s.selection, id]) })),
    clearSelection: () => set({ selection: new Set() }),
    setZoom: (hubId, zoom) =>
      set(s => ({
        viewports: withViewport(s.viewports, hubId, viewport => {
          const currentLevel = inferLevel(zoom);
          if (currentLevel === 'l3') {
            return { ...viewport, zoom, currentLevel };
          }

          const { focalStepId: _staleFocalStepId, ...withoutFocalStepId } = viewport;
          return { ...withoutFocalStepId, zoom, currentLevel };
        }),
      })),
    setPan: (hubId, pan) =>
      set(s => ({
        viewports: withViewport(s.viewports, hubId, viewport => ({ ...viewport, pan })),
      })),
    setLevel: (hubId, level, focalStepId) =>
      set(s => ({
        viewports: withViewport(s.viewports, hubId, viewport =>
          setViewportLevel(viewport, level, focalStepId)
        ),
      })),
    fitToContent: (hubId, level, fit) =>
      set(s => ({
        viewports: withViewport(s.viewports, hubId, viewport => {
          const targetLevel =
            level ??
            (viewport.currentLevel === 'l3' && !viewport.focalStepId
              ? 'l2'
              : viewport.currentLevel);
          // Guard: l3 without a focalStepId is a no-op (setViewportLevel will warn).
          if (targetLevel === 'l3' && !viewport.focalStepId) {
            return setViewportLevel(viewport, targetLevel, viewport.focalStepId);
          }
          const nextViewport = setViewportLevel(viewport, targetLevel, viewport.focalStepId);
          return {
            ...nextViewport,
            zoom: fit?.zoom ?? FIT_TO_CONTENT_ZOOM_BY_LEVEL[targetLevel],
            pan: fit?.pan ?? { x: 0, y: 0 },
          };
        }),
      })),
    toggleRail: () => set(s => ({ railOpen: !s.railOpen })),
    setRailOpen: railOpen => set({ railOpen }),
    setGroupByTributary: (hubId, on) =>
      set(s => ({
        viewports: withViewport(s.viewports, hubId, viewport => ({
          ...viewport,
          groupByTributary: on,
        })),
      })),
    setAndCheckResult: (path, snapshot) =>
      set(s => ({ andCheckResults: { ...s.andCheckResults, [path]: snapshot } })),
    openChartCluster: clusterState =>
      set(s => ({
        openChartClusters: { ...s.openChartClusters, [clusterState.tributaryId]: clusterState },
      })),
    closeChartCluster: tributaryId =>
      set(s => {
        const next = { ...s.openChartClusters };
        delete next[tributaryId];
        return { openChartClusters: next };
      }),
    enqueuePendingComment: comment =>
      set(s => ({ pendingComments: [...s.pendingComments, comment] })),
    drainPendingComments: () => {
      const drained = get().pendingComments;
      set({ pendingComments: [] });
      return drained;
    },

    applyWithUndo: mutator => {
      const current = get();
      const [nextState, patches, inversePatches] = produceWithPatches(
        current,
        (draft: CanvasViewportState) => {
          mutator(draft);
        }
      );
      if (patches.length === 0) return;

      const nextUndo: UndoEntry[] = [
        ...current.undoStack,
        { forward: patches, inverse: inversePatches },
      ];
      const cappedUndo =
        nextUndo.length > UNDO_STACK_CAP
          ? nextUndo.slice(nextUndo.length - UNDO_STACK_CAP)
          : nextUndo;

      set({
        ...nextState,
        undoStack: cappedUndo,
        redoStack: [],
      });
    },

    undo: () => {
      const current = get();
      if (current.undoStack.length === 0) return;
      const entry = current.undoStack[current.undoStack.length - 1];
      const nextUndo = current.undoStack.slice(0, -1);
      const rolledBack = applyPatches(current, entry.inverse);
      set({
        ...rolledBack,
        undoStack: nextUndo,
        redoStack: [...current.redoStack, entry],
      });
    },

    redo: () => {
      const current = get();
      if (current.redoStack.length === 0) return;
      const entry = current.redoStack[current.redoStack.length - 1];
      const nextRedo = current.redoStack.slice(0, -1);
      const rolledForward = applyPatches(current, entry.forward);
      set({
        ...rolledForward,
        undoStack: [...current.undoStack, entry],
        redoStack: nextRedo,
      });
    },
  })
);

(
  useCanvasViewportStore as unknown as { getInitialState: () => CanvasViewportState }
).getInitialState = getCanvasViewportInitialState;

interface CanvasViewportSnapshotRow {
  hubId: ProcessHubId;
  viewMode: 'map' | 'wall';
  viewport: CanvasViewportSnapshot;
  railOpen: boolean;
  updatedAt: number;
}

const CANVAS_VIEWPORT_DB_NAME = 'variscout-canvas-viewport';

class CanvasViewportDB extends Dexie {
  snapshots!: Table<CanvasViewportSnapshotRow, string>;

  constructor() {
    super(CANVAS_VIEWPORT_DB_NAME);
    this.version(2).stores({ snapshots: 'hubId,updatedAt' });
  }
}

const db = new CanvasViewportDB();

export async function persistCanvasViewport(hubId: ProcessHubId): Promise<void> {
  const s = useCanvasViewportStore.getState();
  await db.snapshots.put({
    hubId,
    viewMode: s.viewMode,
    viewport: s.getViewport(hubId),
    railOpen: s.railOpen,
    updatedAt: Date.now(),
  });
}

export async function rehydrateCanvasViewport(
  hubId: ProcessHubId,
  shouldApply: () => boolean = () => true
): Promise<void> {
  const snapshot = await db.snapshots.get(hubId);
  if (!snapshot) return;
  if (!shouldApply()) return;

  useCanvasViewportStore.setState(s => ({
    viewMode: snapshot.viewMode,
    viewports: { ...s.viewports, [hubId]: snapshot.viewport },
    railOpen: snapshot.railOpen,
  }));
}

/**
 * Read the `updatedAt` timestamp from the local Dexie row for a hub's
 * canvas viewport snapshot. Returns 0 if no local row exists.
 * Used by the Azure lifecycle hook to decide whether the remote Blob is newer.
 */
export async function getLocalViewportUpdatedAt(hubId: ProcessHubId): Promise<number> {
  const row = await db.snapshots.get(hubId);
  return row?.updatedAt ?? 0;
}
