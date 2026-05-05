import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProcessHub } from '@variscout/core';
import { createEmptyMap, type ProcessMap, type ProcessMapNode } from '@variscout/core/frame';

const HISTORY_CAP = 50;
type OutcomeSpec = NonNullable<ProcessHub['outcomes']>[number];

export interface CanvasStoreState {
  canonicalMap: ProcessMap;
  outcomes: OutcomeSpec[];
  primaryScopeDimensions: string[];
  canonicalMapVersion: string;
  undoStack: CanvasHistoryEntry[];
  redoStack: CanvasHistoryEntry[];
}

export interface CanvasHistoryControls {
  undo: () => void;
  redo: () => void;
  historyDepth: () => number;
  redoDepth: () => number;
  clearHistory: () => void;
}

export interface CanvasStoreActions {
  hydrateCanvasDocument: (snapshot: CanvasHydrationSnapshot) => void;
  placeChipOnStep: (chipId: string, stepId: string) => void;
  unassignChip: (chipId: string) => void;
  reorderChipInStep: (chipId: string, stepId: string, toIndex: number) => void;
  addStep: (stepName: string, position?: { x: number; y: number }) => void;
  createStepFromChip: (chipId: string, stepName: string) => void;
  removeStep: (stepId: string) => void;
  renameStep: (stepId: string, newName: string) => void;
  connectSteps: (fromStepId: string, toStepId: string) => void;
  disconnectSteps: (fromStepId: string, toStepId: string) => void;
  groupIntoSubStep: (stepIds: string[], parentStepId: string) => void;
  ungroupSubStep: (stepId: string) => void;
}

export type CanvasStore = CanvasStoreState & CanvasHistoryControls & CanvasStoreActions;

export interface CanvasDocumentSnapshot {
  canonicalMap: ProcessMap;
  outcomes: OutcomeSpec[];
  primaryScopeDimensions: string[];
  canonicalMapVersion: string;
}

export type CanvasHydrationSnapshot = Pick<CanvasDocumentSnapshot, 'canonicalMap'> &
  Partial<Omit<CanvasDocumentSnapshot, 'canonicalMap'>>;

export interface CanvasHistoryEntry {
  before: CanvasDocumentSnapshot;
  after: CanvasDocumentSnapshot;
}

let versionSequence = 0;
let generatedStepSequence = 1;

function resetCanvasLocalState() {
  versionSequence = 0;
  generatedStepSequence = 1;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function documentSnapshot(state: CanvasStoreState): CanvasDocumentSnapshot {
  return cloneJson({
    canonicalMap: state.canonicalMap,
    outcomes: state.outcomes,
    primaryScopeDimensions: state.primaryScopeDimensions,
    canonicalMapVersion: state.canonicalMapVersion,
  });
}

function applyDocumentSnapshot(draft: CanvasStoreState, snapshot: CanvasDocumentSnapshot) {
  draft.canonicalMap = snapshot.canonicalMap;
  draft.outcomes = snapshot.outcomes;
  draft.primaryScopeDimensions = snapshot.primaryScopeDimensions;
  draft.canonicalMapVersion = snapshot.canonicalMapVersion;
}

function normalizeHydrationSnapshot(snapshot: CanvasHydrationSnapshot): CanvasDocumentSnapshot {
  const canonicalMap = cloneJson(snapshot.canonicalMap);
  canonicalMap.assignments ??= {};
  canonicalMap.arrows ??= [];

  return {
    canonicalMap,
    outcomes: cloneJson(snapshot.outcomes ?? []),
    primaryScopeDimensions: cloneJson(snapshot.primaryScopeDimensions ?? []),
    canonicalMapVersion: snapshot.canonicalMapVersion ?? nextCanvasMapVersion(),
  };
}

function nextCanvasMapVersion(): string {
  versionSequence += 1;
  return `canvas-map-${versionSequence}`;
}

function advanceVersionSequenceFrom(version: string) {
  const match = /^canvas-map-(\d+)$/.exec(version);
  if (!match) return;
  versionSequence = Math.max(versionSequence, Number(match[1]));
}

function bumpCanonicalMapVersion(draft: CanvasStoreState) {
  draft.canonicalMapVersion = nextCanvasMapVersion();
  draft.canonicalMap.updatedAt = new Date().toISOString();
}

function cappedUndoStack(entries: CanvasHistoryEntry[]): CanvasHistoryEntry[] {
  return entries.length > HISTORY_CAP ? entries.slice(entries.length - HISTORY_CAP) : entries;
}

function slugifyStepName(stepName: string): string {
  const slug = stepName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'step';
}

function nextStepId(nodes: ProcessMapNode[], stepName: string): string {
  const existingIds = new Set(nodes.map(node => node.id));
  const slug = slugifyStepName(stepName);
  let candidate = '';

  do {
    candidate = `step-${slug}-${generatedStepSequence}`;
    generatedStepSequence += 1;
  } while (existingIds.has(candidate));

  return candidate;
}

function arrowId(fromStepId: string, toStepId: string): string {
  return `arrow-${fromStepId}-to-${toStepId}`;
}

export function getCanvasInitialState(): CanvasStoreState {
  resetCanvasLocalState();
  return {
    canonicalMap: createEmptyMap(),
    outcomes: [],
    primaryScopeDimensions: [],
    canonicalMapVersion: 'canvas-map-0',
    undoStack: [],
    redoStack: [],
  };
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    immer((set, get) => {
      function applyUndoable(
        actionName: string,
        mutator: (draft: CanvasStoreState) => boolean
      ): void {
        const before = documentSnapshot(get());
        let changed = false;

        set(
          draft => {
            changed = mutator(draft);
            if (!changed) return;

            bumpCanonicalMapVersion(draft);
            const after = documentSnapshot(draft);
            draft.undoStack = cappedUndoStack([...draft.undoStack, { before, after }]);
            draft.redoStack = [];
          },
          false,
          actionName
        );
      }

      return {
        ...getCanvasInitialState(),

        hydrateCanvasDocument: snapshot => {
          const normalizedSnapshot = normalizeHydrationSnapshot(snapshot);
          advanceVersionSequenceFrom(normalizedSnapshot.canonicalMapVersion);

          set(
            draft => {
              applyDocumentSnapshot(draft, normalizedSnapshot);
              draft.undoStack = [];
              draft.redoStack = [];
            },
            false,
            'canvas/hydrateCanvasDocument'
          );
        },

        undo: () => {
          const entry = get().undoStack.at(-1);
          if (!entry) return;

          set(
            draft => {
              applyDocumentSnapshot(draft, entry.before);
              draft.undoStack = draft.undoStack.slice(0, -1);
              draft.redoStack = [...draft.redoStack, entry];
            },
            false,
            'canvas/undo'
          );
        },

        redo: () => {
          const entry = get().redoStack.at(-1);
          if (!entry) return;

          set(
            draft => {
              applyDocumentSnapshot(draft, entry.after);
              draft.undoStack = [...draft.undoStack, entry];
              draft.redoStack = draft.redoStack.slice(0, -1);
            },
            false,
            'canvas/redo'
          );
        },

        historyDepth: () => get().undoStack.length,
        redoDepth: () => get().redoStack.length,
        clearHistory: () => {
          set(
            draft => {
              draft.undoStack = [];
              draft.redoStack = [];
            },
            false,
            'canvas/clearHistory'
          );
        },

        placeChipOnStep: (chipId, stepId) => {
          applyUndoable('canvas/placeChipOnStep', draft => {
            draft.canonicalMap.assignments ??= {};
            if (draft.canonicalMap.assignments[chipId] === stepId) return false;
            draft.canonicalMap.assignments[chipId] = stepId;
            return true;
          });
        },

        unassignChip: chipId => {
          applyUndoable('canvas/unassignChip', draft => {
            if (!draft.canonicalMap.assignments || !(chipId in draft.canonicalMap.assignments)) {
              return false;
            }
            delete draft.canonicalMap.assignments[chipId];
            return true;
          });
        },

        reorderChipInStep: () => {
          // ProcessMap has no chip ordering field. Preserve the API as a stable no-op
          // until ordering is promoted into the canonical model.
        },

        addStep: stepName => {
          applyUndoable('canvas/addStep', draft => {
            const id = nextStepId(draft.canonicalMap.nodes, stepName);
            draft.canonicalMap.nodes.push({
              id,
              name: stepName,
              order: draft.canonicalMap.nodes.length,
            });
            return true;
          });
        },

        createStepFromChip: (chipId, stepName) => {
          applyUndoable('canvas/createStepFromChip', draft => {
            const name = stepName.trim();
            if (!name) return false;

            const id = nextStepId(draft.canonicalMap.nodes, name);
            draft.canonicalMap.nodes.push({
              id,
              name,
              order: draft.canonicalMap.nodes.length,
            });
            draft.canonicalMap.assignments ??= {};
            draft.canonicalMap.assignments[chipId] = id;
            return true;
          });
        },

        removeStep: stepId => {
          applyUndoable('canvas/removeStep', draft => {
            const existingNode = draft.canonicalMap.nodes.find(node => node.id === stepId);
            if (!existingNode) return false;

            draft.canonicalMap.nodes = draft.canonicalMap.nodes.filter(node => node.id !== stepId);
            draft.canonicalMap.arrows = (draft.canonicalMap.arrows ?? []).filter(
              arrow => arrow.fromStepId !== stepId && arrow.toStepId !== stepId
            );

            for (const node of draft.canonicalMap.nodes) {
              if (node.parentStepId === stepId) node.parentStepId = null;
            }

            if (draft.canonicalMap.assignments) {
              for (const [chipId, assignedStepId] of Object.entries(
                draft.canonicalMap.assignments
              )) {
                if (assignedStepId === stepId) delete draft.canonicalMap.assignments[chipId];
              }
            }

            return true;
          });
        },

        renameStep: (stepId, newName) => {
          applyUndoable('canvas/renameStep', draft => {
            const node = draft.canonicalMap.nodes.find(candidate => candidate.id === stepId);
            if (!node || node.name === newName) return false;
            node.name = newName;
            return true;
          });
        },

        connectSteps: (fromStepId, toStepId) => {
          applyUndoable('canvas/connectSteps', draft => {
            draft.canonicalMap.arrows ??= [];
            const duplicate = draft.canonicalMap.arrows.some(
              arrow => arrow.fromStepId === fromStepId && arrow.toStepId === toStepId
            );
            if (duplicate) return false;

            draft.canonicalMap.arrows.push({
              id: arrowId(fromStepId, toStepId),
              fromStepId,
              toStepId,
            });
            return true;
          });
        },

        disconnectSteps: (fromStepId, toStepId) => {
          applyUndoable('canvas/disconnectSteps', draft => {
            const arrows = draft.canonicalMap.arrows ?? [];
            const nextArrows = arrows.filter(
              arrow => arrow.fromStepId !== fromStepId || arrow.toStepId !== toStepId
            );
            if (nextArrows.length === arrows.length) return false;

            draft.canonicalMap.arrows = nextArrows;
            return true;
          });
        },

        groupIntoSubStep: (stepIds, parentStepId) => {
          applyUndoable('canvas/groupIntoSubStep', draft => {
            let changed = false;
            const targetIds = new Set(stepIds);

            for (const node of draft.canonicalMap.nodes) {
              if (!targetIds.has(node.id) || node.parentStepId === parentStepId) continue;
              node.parentStepId = parentStepId;
              changed = true;
            }

            return changed;
          });
        },

        ungroupSubStep: stepId => {
          applyUndoable('canvas/ungroupSubStep', draft => {
            const node = draft.canonicalMap.nodes.find(candidate => candidate.id === stepId);
            if (!node || node.parentStepId == null) return false;
            node.parentStepId = null;
            return true;
          });
        },
      };
    }),
    { name: 'canvasStore' }
  )
);

(useCanvasStore as unknown as { getInitialState: () => CanvasStoreState }).getInitialState =
  getCanvasInitialState;
