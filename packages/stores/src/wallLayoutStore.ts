/**
 * wallLayoutStore — UI-only Zustand feature store for the Investigation Wall.
 *
 * Holds node positions, zoom/pan, selection, open chart clusters, rail state,
 * and an ephemeral undo history. Persisted to IndexedDB per projectId via Dexie
 * (wired in Task 4.3). Not a domain store — domain facts (hubs, findings,
 * causalLinks, problemContributionTree) live in investigationStore.
 */

import Dexie, { type Table } from 'dexie';
import { create } from 'zustand';

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
});

// ── Store ────────────────────────────────────────────────────────────────────

export const useWallLayoutStore = create<WallLayoutState & WallLayoutActions>()((set, get) => ({
  ...getWallLayoutInitialState(),

  setViewMode: viewMode => set({ viewMode }),
  setNodePosition: (nodeId, pos) =>
    set(s => ({ nodePositions: { ...s.nodePositions, [nodeId]: pos } })),
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
