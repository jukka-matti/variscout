/**
 * State machine driving the inflection-binning workflow on the Probability
 * lens of the Explore tab.
 *
 * Lifecycle:
 *   1. `idle`      — no detection has run; once-per-session banner pitches the
 *                    feature; user clicks Detect to propose.
 *   2. `proposing` — cuts detected but not committed; in-memory only (dies on
 *                    tab/lens switch by design). User adjusts via drag / add /
 *                    remove / rename; click "Create bin column" to commit.
 *   3. `committed` — binding persisted on the IP. Direct manipulation: every
 *                    drag / add / remove / rename patches `existingBindings`
 *                    immediately (no second commit step). User clicks "Remove
 *                    binning" to delete and return to `idle`.
 *
 * Rename preservation: when cuts.length is unchanged (drag), user-typed level
 * names are preserved. When cuts.length changes (add / remove), level names
 * are regenerated from `defaultLevelNames(cuts)` — simpler than tracking
 * per-segment rename provenance, and matches the user expectation that adding
 * a new boundary invalidates the old labels.
 *
 * @module Explore/Probability/InflectionBinning/useInflectionBinningState
 */

import { useMemo, useReducer, useCallback } from 'react';
import { computeSegmentStats, detectInflectionPoints } from '@variscout/core/binning';
import type { BinnedFactorBinding, SegmentStats } from '@variscout/core/binning';
import { generateDeterministicId } from '@variscout/core';
import { defaultLevelNames } from './defaultLevelNames';

// ============================================================================
// State + actions
// ============================================================================

export type BinningState =
  | { kind: 'idle'; canShowBanner: boolean }
  | { kind: 'proposing'; cuts: number[]; levelNames: string[]; segments: SegmentStats[] }
  | { kind: 'committed'; binding: BinnedFactorBinding; segments: SegmentStats[] };

export interface UseInflectionBinningStateInput {
  /** Numeric column being analyzed (the Y of the prob plot). */
  sourceColumn: string;
  /** Raw values from the column (numeric only; caller filters nulls). */
  values: number[];
  /** Sorted ascending value array (precomputed by caller to match the prob plot). */
  sortedValues: number[];
  /** Existing bindings on the active IP. */
  existingBindings: BinnedFactorBinding[];
  /** Patch handler — called for every mutation in committed state, and on commit. */
  patchBindings: (next: BinnedFactorBinding[]) => void;
  /** Optional: ID generator (defaults to `generateDeterministicId`). */
  generateId?: () => string;
}

export interface UseInflectionBinningStateReturn {
  state: BinningState;
  // ----- Actions valid from various states -----
  dismissBanner: () => void;
  detectInflections: () => void;
  // Proposing OR Committed:
  dragCut: (cutIndex: number, newPosition: number) => void;
  addCut: (position: number) => void;
  removeCut: (cutIndex: number) => void;
  renameLevel: (levelIndex: number, newName: string) => void;
  // Proposing only:
  commit: () => void;
  // Committed only:
  removeBinning: () => void;
  // Reset (e.g., when column changes):
  reset: () => void;
}

// ----------------------------------------------------------------------------
// Reducer
// ----------------------------------------------------------------------------

type Action =
  | { type: 'dismissBanner' }
  | {
      type: 'proposeFromDetection';
      cuts: number[];
      levelNames: string[];
      segments: SegmentStats[];
    }
  | {
      type: 'updateProposingCuts';
      cuts: number[];
      levelNames: string[];
      segments: SegmentStats[];
    }
  | {
      type: 'renameProposingLevel';
      levelIndex: number;
      newName: string;
    }
  | {
      type: 'commit';
      binding: BinnedFactorBinding;
      segments: SegmentStats[];
    }
  | {
      type: 'updateCommittedBinding';
      binding: BinnedFactorBinding;
      segments: SegmentStats[];
    }
  | { type: 'removeBinning' }
  | { type: 'backToIdle' }
  | { type: 'reset'; nextState: BinningState };

interface InitArgs {
  sourceColumn: string;
  sortedValues: number[];
  existingBindings: BinnedFactorBinding[];
}

function initialState({ sourceColumn, sortedValues, existingBindings }: InitArgs): BinningState {
  const existing = existingBindings.find(b => b.sourceColumn === sourceColumn);
  if (existing) {
    return {
      kind: 'committed',
      binding: existing,
      segments: computeSegmentStats(sortedValues, existing.cuts),
    };
  }
  return { kind: 'idle', canShowBanner: true };
}

function reducer(state: BinningState, action: Action): BinningState {
  switch (action.type) {
    case 'dismissBanner': {
      if (state.kind !== 'idle') return state;
      return { kind: 'idle', canShowBanner: false };
    }
    case 'proposeFromDetection': {
      if (state.kind !== 'idle') return state;
      return {
        kind: 'proposing',
        cuts: action.cuts,
        levelNames: action.levelNames,
        segments: action.segments,
      };
    }
    case 'updateProposingCuts': {
      if (state.kind !== 'proposing') return state;
      return {
        kind: 'proposing',
        cuts: action.cuts,
        levelNames: action.levelNames,
        segments: action.segments,
      };
    }
    case 'renameProposingLevel': {
      if (state.kind !== 'proposing') return state;
      const nextLevels = state.levelNames.slice();
      if (action.levelIndex < 0 || action.levelIndex >= nextLevels.length) return state;
      nextLevels[action.levelIndex] = action.newName;
      return { ...state, levelNames: nextLevels };
    }
    case 'commit': {
      if (state.kind !== 'proposing') return state;
      return {
        kind: 'committed',
        binding: action.binding,
        segments: action.segments,
      };
    }
    case 'updateCommittedBinding': {
      if (state.kind !== 'committed') return state;
      return {
        kind: 'committed',
        binding: action.binding,
        segments: action.segments,
      };
    }
    case 'removeBinning': {
      if (state.kind !== 'committed') return state;
      return { kind: 'idle', canShowBanner: false };
    }
    case 'backToIdle': {
      return { kind: 'idle', canShowBanner: false };
    }
    case 'reset': {
      return action.nextState;
    }
    default:
      return state;
  }
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

/**
 * Drive the idle → proposing → committed inflection-binning workflow.
 */
export function useInflectionBinningState(
  input: UseInflectionBinningStateInput
): UseInflectionBinningStateReturn {
  const {
    sourceColumn,
    values,
    sortedValues,
    existingBindings,
    patchBindings,
    generateId = generateDeterministicId,
  } = input;

  const initial = useMemo(
    () => initialState({ sourceColumn, sortedValues, existingBindings }),
    // We intentionally compute init only on mount; subsequent existingBindings
    // changes are owned by the consumer (they call `reset` if column changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [state, dispatch] = useReducer(reducer, initial);

  // ── detectInflections ────────────────────────────────────────────────────
  const detectInflections = useCallback(() => {
    if (state.kind !== 'idle') return;
    const result = detectInflectionPoints({ values });
    if (result.cuts.length === 0) {
      // Stay in idle — consumer surfaces "no inflection found" feedback.
      return;
    }
    dispatch({
      type: 'proposeFromDetection',
      cuts: result.cuts,
      levelNames: defaultLevelNames(result.cuts),
      segments: result.segments,
    });
  }, [state.kind, values]);

  const dismissBanner = useCallback(() => {
    dispatch({ type: 'dismissBanner' });
  }, []);

  // ── dragCut / addCut / removeCut / renameLevel ───────────────────────────
  // Each action recomputes segments + level names, then in committed state
  // also patches the binding back to the consumer.
  const applyCutMutation = useCallback(
    (
      previousCuts: number[],
      previousLevels: string[],
      nextCuts: number[]
    ): { cuts: number[]; levels: string[]; segments: SegmentStats[] } => {
      const sortedCuts = [...nextCuts].sort((a, b) => a - b);
      const sameLength = sortedCuts.length === previousCuts.length;
      const levels = sameLength ? previousLevels : defaultLevelNames(sortedCuts);
      const segments = computeSegmentStats(sortedValues, sortedCuts);
      return { cuts: sortedCuts, levels, segments };
    },
    [sortedValues]
  );

  const dragCut = useCallback(
    (cutIndex: number, newPosition: number) => {
      if (state.kind === 'proposing') {
        if (cutIndex < 0 || cutIndex >= state.cuts.length) return;
        const nextCuts = state.cuts.slice();
        nextCuts[cutIndex] = newPosition;
        const { cuts, levels, segments } = applyCutMutation(state.cuts, state.levelNames, nextCuts);
        dispatch({ type: 'updateProposingCuts', cuts, levelNames: levels, segments });
        return;
      }
      if (state.kind === 'committed') {
        if (cutIndex < 0 || cutIndex >= state.binding.cuts.length) return;
        const nextCuts = state.binding.cuts.slice();
        nextCuts[cutIndex] = newPosition;
        const { cuts, levels, segments } = applyCutMutation(
          state.binding.cuts,
          state.binding.levelNames,
          nextCuts
        );
        const nextBinding: BinnedFactorBinding = {
          ...state.binding,
          cuts,
          levelNames: levels,
        };
        patchBindings(existingBindings.map(b => (b.id === state.binding.id ? nextBinding : b)));
        dispatch({ type: 'updateCommittedBinding', binding: nextBinding, segments });
      }
    },
    [state, applyCutMutation, patchBindings, existingBindings]
  );

  const addCut = useCallback(
    (position: number) => {
      if (state.kind === 'proposing') {
        const nextCuts = [...state.cuts, position];
        const { cuts, levels, segments } = applyCutMutation(state.cuts, state.levelNames, nextCuts);
        dispatch({ type: 'updateProposingCuts', cuts, levelNames: levels, segments });
        return;
      }
      if (state.kind === 'committed') {
        const nextCuts = [...state.binding.cuts, position];
        const { cuts, levels, segments } = applyCutMutation(
          state.binding.cuts,
          state.binding.levelNames,
          nextCuts
        );
        const nextBinding: BinnedFactorBinding = {
          ...state.binding,
          cuts,
          levelNames: levels,
        };
        patchBindings(existingBindings.map(b => (b.id === state.binding.id ? nextBinding : b)));
        dispatch({ type: 'updateCommittedBinding', binding: nextBinding, segments });
      }
    },
    [state, applyCutMutation, patchBindings, existingBindings]
  );

  const removeCut = useCallback(
    (cutIndex: number) => {
      if (state.kind === 'proposing') {
        if (cutIndex < 0 || cutIndex >= state.cuts.length) return;
        const nextCuts = state.cuts.filter((_, i) => i !== cutIndex);
        if (nextCuts.length === 0) {
          // No cuts left → return to idle (banner stays dismissed).
          dispatch({ type: 'backToIdle' });
          return;
        }
        const { cuts, levels, segments } = applyCutMutation(state.cuts, state.levelNames, nextCuts);
        dispatch({ type: 'updateProposingCuts', cuts, levelNames: levels, segments });
        return;
      }
      if (state.kind === 'committed') {
        if (cutIndex < 0 || cutIndex >= state.binding.cuts.length) return;
        const nextCuts = state.binding.cuts.filter((_, i) => i !== cutIndex);
        if (nextCuts.length === 0) {
          // Removing the last cut in committed state is equivalent to removing
          // the binding entirely — preserve user intent.
          patchBindings(existingBindings.filter(b => b.id !== state.binding.id));
          dispatch({ type: 'removeBinning' });
          return;
        }
        const { cuts, levels, segments } = applyCutMutation(
          state.binding.cuts,
          state.binding.levelNames,
          nextCuts
        );
        const nextBinding: BinnedFactorBinding = {
          ...state.binding,
          cuts,
          levelNames: levels,
        };
        patchBindings(existingBindings.map(b => (b.id === state.binding.id ? nextBinding : b)));
        dispatch({ type: 'updateCommittedBinding', binding: nextBinding, segments });
      }
    },
    [state, applyCutMutation, patchBindings, existingBindings]
  );

  const renameLevel = useCallback(
    (levelIndex: number, newName: string) => {
      if (state.kind === 'proposing') {
        if (levelIndex < 0 || levelIndex >= state.levelNames.length) return;
        dispatch({ type: 'renameProposingLevel', levelIndex, newName });
        return;
      }
      if (state.kind === 'committed') {
        if (levelIndex < 0 || levelIndex >= state.binding.levelNames.length) return;
        const nextLevels = state.binding.levelNames.slice();
        nextLevels[levelIndex] = newName;
        const nextBinding: BinnedFactorBinding = {
          ...state.binding,
          levelNames: nextLevels,
        };
        patchBindings(existingBindings.map(b => (b.id === state.binding.id ? nextBinding : b)));
        dispatch({
          type: 'updateCommittedBinding',
          binding: nextBinding,
          segments: state.segments,
        });
      }
    },
    [state, patchBindings, existingBindings]
  );

  // ── commit / removeBinning / reset ───────────────────────────────────────
  const commit = useCallback(() => {
    if (state.kind !== 'proposing') return;
    if (state.cuts.length === 0) return;
    const binding: BinnedFactorBinding = {
      id: generateId(),
      sourceColumn,
      cuts: state.cuts,
      levelNames: state.levelNames,
      detectionMethod: 'gap-ratio-v1',
      detectedAt: new Date().toISOString(),
    };
    patchBindings([...existingBindings, binding]);
    dispatch({ type: 'commit', binding, segments: state.segments });
  }, [state, sourceColumn, existingBindings, patchBindings, generateId]);

  const removeBinning = useCallback(() => {
    if (state.kind !== 'committed') return;
    patchBindings(existingBindings.filter(b => b.id !== state.binding.id));
    dispatch({ type: 'removeBinning' });
  }, [state, existingBindings, patchBindings]);

  const reset = useCallback(() => {
    dispatch({
      type: 'reset',
      nextState: initialState({ sourceColumn, sortedValues, existingBindings }),
    });
  }, [sourceColumn, sortedValues, existingBindings]);

  return {
    state,
    dismissBanner,
    detectInflections,
    dragCut,
    addCut,
    removeCut,
    renameLevel,
    commit,
    removeBinning,
    reset,
  };
}
