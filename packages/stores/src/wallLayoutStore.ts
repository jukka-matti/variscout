/**
 * wallLayoutStore — UI-only Zustand feature store for the Investigation Wall.
 *
 * Holds node positions, zoom/pan, selection, open chart clusters, rail state,
 * and an ephemeral undo history. Persisted to IndexedDB per projectId via Dexie
 * (wired in Task 4.3). Not a domain store — domain facts (hubs, findings,
 * causalLinks, problemContributionTree) live in investigationStore.
 */

import Dexie, { type Table } from 'dexie';
import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer';
import { create } from 'zustand';

// Enable immer's patches plugin once at module load — required by
// `produceWithPatches` / `applyPatches` used for undo/redo history below.
enablePatches();

/** Max entries retained in the undo / redo stacks. Older patches are dropped FIFO. */
const UNDO_STACK_CAP = 50;

export type NodeId = string;
export type TributaryId = string;
export type GateNodePath = string; // dot-separated path from contribution tree root, e.g. "root.and.0"

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

export interface WallLayoutState {
  viewMode: 'map' | 'wall';
  nodePositions: Record<NodeId, { x: number; y: number }>;
  selection: Set<NodeId>;
  openChartClusters: Record<TributaryId, ChartClusterState>;
  zoom: number;
  pan: { x: number; y: number };
  railOpen: boolean;
  andCheckResults: Record<GateNodePath, AndCheckSnapshot>;
  pendingComments: PendingComment[];
  /**
   * Undo history — each entry pairs the forward (redo) patches with the
   * inverse (undo) patches from a single `applyWithUndo` call. Reversing one
   * entry is simply `applyPatches(state, inverse)`; re-forwarding is
   * `applyPatches(state, forward)`. Capped at UNDO_STACK_CAP (50) entries;
   * older entries drop FIFO.
   */
  undoStack: UndoEntry[];
  /** Redo history — mirror of undoStack, populated on undo(), cleared on new mutation. */
  redoStack: UndoEntry[];
}

/** A single reversible mutation: forward patches + their inverse. */
export interface UndoEntry {
  forward: Patch[];
  inverse: Patch[];
}

export interface WallLayoutActions {
  setViewMode: (mode: 'map' | 'wall') => void;
  setNodePosition: (nodeId: NodeId, pos: { x: number; y: number }) => void;
  setSelection: (ids: NodeId[]) => void;
  addToSelection: (id: NodeId) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleRail: () => void;
  setRailOpen: (open: boolean) => void;
  setAndCheckResult: (path: GateNodePath, snapshot: AndCheckSnapshot) => void;
  openChartCluster: (state: ChartClusterState) => void;
  closeChartCluster: (tributaryId: TributaryId) => void;
  enqueuePendingComment: (comment: PendingComment) => void;
  drainPendingComments: () => PendingComment[];
  /**
   * Applies a structural mutation via immer and records the inverse patches
   * on `undoStack`. Clears `redoStack` (new branch of history invalidates
   * forward redo). Route only structural (undoable) mutations through this —
   * `zoom`/`pan`/`selection`/`railOpen` stay on direct `set()`.
   */
  applyWithUndo: (mutator: (draft: WallLayoutState) => void) => void;
  /** Pop the most recent undoStack entry and reverse-apply it. No-op when stack is empty. */
  undo: () => void;
  /** Pop the most recent redoStack entry and re-apply it. No-op when stack is empty. */
  redo: () => void;
}

// ── Initial state ────────────────────────────────────────────────────────────

export const getWallLayoutInitialState = (): WallLayoutState => ({
  viewMode: 'map',
  nodePositions: {},
  selection: new Set<NodeId>(),
  openChartClusters: {},
  zoom: 1,
  pan: { x: 0, y: 0 },
  railOpen: true,
  andCheckResults: {},
  pendingComments: [],
  undoStack: [],
  redoStack: [],
});

// ── Store ────────────────────────────────────────────────────────────────────

export const useWallLayoutStore = create<WallLayoutState & WallLayoutActions>()((set, get) => ({
  ...getWallLayoutInitialState(),

  setViewMode: viewMode => set({ viewMode }),
  setNodePosition: (nodeId, pos) => {
    // Structural mutation — route through applyWithUndo so drag operations
    // participate in ⌘Z history. Direct `set()` here would bypass history.
    get().applyWithUndo(draft => {
      draft.nodePositions[nodeId] = pos;
    });
  },
  setSelection: ids => set({ selection: new Set(ids) }),
  addToSelection: id => set(s => ({ selection: new Set([...s.selection, id]) })),
  clearSelection: () => set({ selection: new Set() }),
  setZoom: zoom => set({ zoom }),
  setPan: pan => set({ pan }),
  toggleRail: () => set(s => ({ railOpen: !s.railOpen })),
  setRailOpen: railOpen => set({ railOpen }),
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
      (draft: WallLayoutState) => {
        mutator(draft);
      }
    );
    // No-op: mutator didn't change anything. Don't pollute history.
    if (patches.length === 0) return;

    const nextUndo: UndoEntry[] = [
      ...current.undoStack,
      { forward: patches, inverse: inversePatches },
    ];
    // FIFO cap: keep only the most recent UNDO_STACK_CAP entries.
    const cappedUndo =
      nextUndo.length > UNDO_STACK_CAP
        ? nextUndo.slice(nextUndo.length - UNDO_STACK_CAP)
        : nextUndo;

    set({
      // Mirror immer's produced state onto the store, but override the
      // history fields explicitly — the undo entry should record ONLY the
      // domain-level change, not the history bookkeeping.
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
      // Restore history bookkeeping — the entry's patches target domain
      // fields only; applying them doesn't touch undoStack/redoStack.
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
}));

// Expose getInitialState for test resets using the named-function pattern
// established by sessionStore (getSessionInitialState) and compatible with
// the Zustand store API attachment expected in wallLayoutStore tests.
// Double-cast via `unknown` avoids a type collision with Zustand's built-in
// getInitialState (which returns state + actions) — here we intentionally
// narrow to the bare WallLayoutState for test-reset semantics.
(useWallLayoutStore as unknown as { getInitialState: () => WallLayoutState }).getInitialState =
  getWallLayoutInitialState;

// ── Dexie persistence ────────────────────────────────────────────────────────

interface WallLayoutSnapshot {
  projectId: string;
  viewMode: 'map' | 'wall';
  nodePositions: Record<NodeId, { x: number; y: number }>;
  zoom: number;
  pan: { x: number; y: number };
  railOpen: boolean;
  updatedAt: number;
}

/**
 * Dedicated Dexie database for Wall UI state.
 *
 * Why a separate DB from the Azure app's `VaRiScoutAzure`: this store lives in
 * the shared `@variscout/stores` package, imported by BOTH PWA and Azure. The
 * Azure DB schema lives under `apps/azure/` — reaching into it from a shared
 * package would reverse the monorepo's downward-only dependency flow
 * (app → stores → core). So the Wall gets its own named IndexedDB
 * (`variscout-wall-layout`), keyed by `projectId`, owned by the stores package.
 *
 * Consequence: UI state (view mode, zoom, pan, node positions) and domain data
 * (projects, blobs) are cleanly separated across two DBs — different
 * lifecycles, different eviction policies.
 *
 * Known gap: no cascade on project delete. If a project is removed from the
 * Azure DB, its Wall snapshot orphans here. Benign (bounded by distinct
 * projects) but a janitor on project-delete would be cleaner — tracked as a
 * known gap in the Wall spec.
 */
class WallLayoutDB extends Dexie {
  snapshots!: Table<WallLayoutSnapshot, string>;
  constructor() {
    super('variscout-wall-layout');
    this.version(1).stores({ snapshots: 'projectId,updatedAt' });
  }
}

const db = new WallLayoutDB();

export async function persistWallLayout(projectId: string): Promise<void> {
  const s = useWallLayoutStore.getState();
  await db.snapshots.put({
    projectId,
    viewMode: s.viewMode,
    nodePositions: s.nodePositions,
    zoom: s.zoom,
    pan: s.pan,
    railOpen: s.railOpen,
    updatedAt: Date.now(),
  });
}

export async function rehydrateWallLayout(projectId: string): Promise<void> {
  const snapshot = await db.snapshots.get(projectId);
  if (!snapshot) return;
  useWallLayoutStore.setState({
    viewMode: snapshot.viewMode,
    nodePositions: snapshot.nodePositions,
    zoom: snapshot.zoom,
    pan: snapshot.pan,
    railOpen: snapshot.railOpen,
  });
}
