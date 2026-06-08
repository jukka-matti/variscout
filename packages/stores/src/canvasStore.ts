import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { assertNever, type ProcessHub, type SpecRule } from '@variscout/core';
import type { CanvasAction } from '@variscout/core/actions';
import { createEmptyMap, type ProcessMap, type ProcessMapNode } from '@variscout/core/frame';

export const STORE_LAYER = 'document' as const;

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
  /**
   * Action-shape entry point. Dispatches the canvas action to the corresponding
   * method-per-action handler. Per audit R15: per-action methods stay as transitional
   * wrappers in PR2; PR3 cleanup removes them once consumers migrate to `dispatch`.
   * Only handles `CanvasAction` kinds — `createStepFromChip` and `hydrateCanvasDocument`
   * remain method-only because they're not in the canonical CanvasAction union.
   */
  dispatch: (action: CanvasAction) => void;
  placeChipOnStep: (chipId: string, stepId: string) => void;
  unassignChip: (chipId: string) => void;
  reorderChipInStep: (chipId: string, stepId: string, toIndex: number) => void;
  addStep: (stepName: string, position?: { x: number; y: number }) => void;
  createStepFromChip: (chipId: string, stepName: string) => void;
  /**
   * Mint one canonical node per distinct value of a categorical column, in
   * order. IM-0b (ADR-087): the column-drop-to-process-zone gesture retargets
   * here so it produces RICH `ProcessMapNode`s on the canonical map using the
   * canvas id scheme (`step-${slug}-${seq}` via `nextStepId`) — retiring the
   * old flat `step-${columnName}-${idx}` mint. New nodes append after existing
   * ones, continuing the `order` sequence. One undoable change; no-op (no
   * version bump) when `distinctValues` is empty.
   */
  addStepsFromColumn: (columnName: string, distinctValues: string[]) => void;
  removeStep: (stepId: string) => void;
  renameStep: (stepId: string, newName: string) => void;
  connectSteps: (fromStepId: string, toStepId: string) => void;
  disconnectSteps: (fromStepId: string, toStepId: string) => void;
  groupIntoSubStep: (stepIds: string[], parentStepId: string) => void;
  ungroupSubStep: (stepId: string) => void;
  /**
   * IM-0b-2 (ADR-087 §5): rich-map authoring actions. These migrate the
   * mutators that `ProcessMap` used to apply by building a `next: ProcessMap`
   * and calling `onChange` — making `canvasStore` the SINGLE authoring authority
   * for the canonical map. Method-only (NOT in the `CanvasAction` union, like
   * `addStepsFromColumn`); each runs through `applyUndoable`.
   */
  /** Set (or clear, with `undefined`) the CTQ column measured at a step. */
  setStepCtq: (stepId: string, ctqColumn: string | undefined) => void;
  /** Replace the per-step capability spec rules authored for a step. */
  setCapabilityScope: (stepId: string, specRules: SpecRule[]) => void;
  /** Add, replace, or remove one per-step capability spec rule. */
  editCapabilityScope: (
    stepId: string,
    edit: { index: number; rule: SpecRule | undefined }
  ) => void;
  /** Add a tributary (an x) feeding a step. Deterministic id. */
  addTributary: (stepId: string, column: string) => void;
  /** Remove a tributary; cascades its `subgroupAxes` + pinned-`hunches` refs. */
  removeTributary: (tributaryId: string) => void;
  /** Toggle a tributary's nomination as a rational-subgroup axis. */
  toggleSubgroupAxis: (tributaryId: string) => void;
  /** Add a pre-data hunch, optionally pinned to a step or tributary. */
  addHunch: (text: string, pin?: { stepId?: string; tributaryId?: string }) => void;
  /** Remove a hunch by id. */
  removeHunch: (hunchId: string) => void;
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
// IM-0b-2: deterministic id minters for rich-map authoring (tributaries +
// hunches), mirroring `generatedStepSequence`. Never `crypto.randomUUID()` /
// `Math.random()` — keeps store output reproducible for tests + undo snapshots.
let generatedTributarySequence = 1;
let generatedHunchSequence = 1;

function resetCanvasLocalState() {
  versionSequence = 0;
  generatedStepSequence = 1;
  generatedTributarySequence = 1;
  generatedHunchSequence = 1;
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

function specRulesEqual(a: readonly SpecRule[], b: readonly SpecRule[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// IM-0b-2: deterministic minters for tributary / hunch ids. The old
// `ProcessMap` `uid(prefix)` used `crypto.randomUUID()`; moving authoring
// into the store means ids must be reproducible (undo snapshots + tests), so
// they mint from monotonic sequences reset by `resetCanvasLocalState`. They
// skip any id already present to stay collision-free after hydration.
function nextTributaryId(tributaries: ProcessMap['tributaries']): string {
  const existing = new Set(tributaries.map(t => t.id));
  let candidate = '';
  do {
    candidate = `trib-${generatedTributarySequence}`;
    generatedTributarySequence += 1;
  } while (existing.has(candidate));
  return candidate;
}

function nextHunchId(hunches: NonNullable<ProcessMap['hunches']>): string {
  const existing = new Set(hunches.map(h => h.id));
  let candidate = '';
  do {
    candidate = `hunch-${generatedHunchSequence}`;
    generatedHunchSequence += 1;
  } while (existing.has(candidate));
  return candidate;
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

        dispatch: action => {
          switch (action.kind) {
            case 'PLACE_CHIP_ON_STEP':
              get().placeChipOnStep(action.chipId, action.stepId);
              return;
            case 'UNASSIGN_CHIP':
              get().unassignChip(action.chipId);
              return;
            case 'REORDER_CHIP_IN_STEP':
              get().reorderChipInStep(action.chipId, action.stepId, action.toIndex);
              return;
            case 'ADD_STEP':
              get().addStep(action.stepName, action.position);
              return;
            case 'REMOVE_STEP':
              get().removeStep(action.stepId);
              return;
            case 'RENAME_STEP':
              get().renameStep(action.stepId, action.newName);
              return;
            case 'CONNECT_STEPS':
              get().connectSteps(action.fromStepId, action.toStepId);
              return;
            case 'DISCONNECT_STEPS':
              get().disconnectSteps(action.fromStepId, action.toStepId);
              return;
            case 'GROUP_INTO_SUB_STEP':
              get().groupIntoSubStep(action.stepIds, action.parentStepId);
              return;
            case 'UNGROUP_SUB_STEP':
              get().ungroupSubStep(action.stepId);
              return;
            default:
              assertNever(action);
          }
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

        addStepsFromColumn: (_columnName, distinctValues) => {
          applyUndoable('canvas/addStepsFromColumn', draft => {
            if (distinctValues.length === 0) return false;
            for (const value of distinctValues) {
              const id = nextStepId(draft.canonicalMap.nodes, value);
              draft.canonicalMap.nodes.push({
                id,
                name: value,
                order: draft.canonicalMap.nodes.length,
              });
            }
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

        // ─ IM-0b-2: rich-map authoring (migrated from ProcessMap mutators) ─

        setStepCtq: (stepId, ctqColumn) => {
          applyUndoable('canvas/setStepCtq', draft => {
            const node = draft.canonicalMap.nodes.find(candidate => candidate.id === stepId);
            if (!node || node.ctqColumn === ctqColumn) return false;
            if (ctqColumn === undefined) {
              delete node.ctqColumn;
            } else {
              node.ctqColumn = ctqColumn;
            }
            return true;
          });
        },

        setCapabilityScope: (stepId, specRules) => {
          applyUndoable('canvas/setCapabilityScope', draft => {
            const node = draft.canonicalMap.nodes.find(candidate => candidate.id === stepId);
            if (!node) return false;

            const currentRules = node.capabilityScope?.specRules ?? [];
            if (specRulesEqual(currentRules, specRules)) return false;

            if (specRules.length === 0) {
              delete node.capabilityScope;
            } else {
              node.capabilityScope = { specRules: cloneJson(specRules) };
            }
            return true;
          });
        },

        editCapabilityScope: (stepId, edit) => {
          applyUndoable('canvas/editCapabilityScope', draft => {
            const node = draft.canonicalMap.nodes.find(candidate => candidate.id === stepId);
            if (!node || edit.index < 0) return false;

            const nextRules = [...(node.capabilityScope?.specRules ?? [])];
            if (edit.rule === undefined) {
              if (edit.index >= nextRules.length) return false;
              nextRules.splice(edit.index, 1);
            } else {
              nextRules[edit.index] = cloneJson(edit.rule);
            }

            const currentRules = node.capabilityScope?.specRules ?? [];
            if (specRulesEqual(currentRules, nextRules)) return false;

            if (nextRules.length === 0) {
              delete node.capabilityScope;
            } else {
              node.capabilityScope = { specRules: nextRules };
            }
            return true;
          });
        },

        addTributary: (stepId, column) => {
          applyUndoable('canvas/addTributary', draft => {
            const id = nextTributaryId(draft.canonicalMap.tributaries);
            draft.canonicalMap.tributaries.push({ id, stepId, column });
            return true;
          });
        },

        removeTributary: tributaryId => {
          applyUndoable('canvas/removeTributary', draft => {
            const exists = draft.canonicalMap.tributaries.some(t => t.id === tributaryId);
            if (!exists) return false;

            // Mirror ProcessMap's cascade: drop the tributary AND any
            // subgroupAxis nomination + pinned hunches that reference it.
            draft.canonicalMap.tributaries = draft.canonicalMap.tributaries.filter(
              t => t.id !== tributaryId
            );
            if (draft.canonicalMap.subgroupAxes) {
              draft.canonicalMap.subgroupAxes = draft.canonicalMap.subgroupAxes.filter(
                id => id !== tributaryId
              );
            }
            if (draft.canonicalMap.hunches) {
              draft.canonicalMap.hunches = draft.canonicalMap.hunches.filter(
                h => h.tributaryId !== tributaryId
              );
            }
            return true;
          });
        },

        toggleSubgroupAxis: tributaryId => {
          applyUndoable('canvas/toggleSubgroupAxis', draft => {
            const current = draft.canonicalMap.subgroupAxes ?? [];
            draft.canonicalMap.subgroupAxes = current.includes(tributaryId)
              ? current.filter(id => id !== tributaryId)
              : [...current, tributaryId];
            return true;
          });
        },

        addHunch: (text, pin) => {
          applyUndoable('canvas/addHunch', draft => {
            const trimmed = text.trim();
            if (!trimmed) return false;

            draft.canonicalMap.hunches ??= [];
            const id = nextHunchId(draft.canonicalMap.hunches);
            draft.canonicalMap.hunches.push({
              id,
              text: trimmed,
              ...(pin?.stepId !== undefined && { stepId: pin.stepId }),
              ...(pin?.tributaryId !== undefined && { tributaryId: pin.tributaryId }),
            });
            return true;
          });
        },

        removeHunch: hunchId => {
          applyUndoable('canvas/removeHunch', draft => {
            const hunches = draft.canonicalMap.hunches ?? [];
            const next = hunches.filter(h => h.id !== hunchId);
            if (next.length === hunches.length) return false;
            draft.canonicalMap.hunches = next;
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
