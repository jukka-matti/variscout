/**
 * useStoreSync — Bidirectional sync between Zustand stores and useDataState
 *
 * Phase 2, Task 1 of the Zustand-First Architecture migration.
 *
 * Makes useInvestigationStore the source of truth for findings, questions,
 * and categories. Syncs store changes into useDataState's setters for
 * persistence (save/load), and pushes useDataState loads into the store.
 *
 * This eliminates the render loop caused by onFindingsChange callback chains
 * because Zustand updates are synchronous and don't trigger React re-renders
 * in the setter path.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useInvestigationStore } from '@variscout/stores';
import type { Finding, Question, InvestigationCategory } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface StoreSyncInputs {
  /**
   * Findings from useDataState (used only during project load to push into store).
   * After initial sync, the store is authoritative.
   */
  stateFindings: Finding[];
  stateQuestions: Question[];
  stateCategories: InvestigationCategory[];

  /**
   * Setters from useDataState — used to keep persistence state in sync.
   * When the store changes, we push the new arrays into useDataState
   * so that saveProject serializes the correct data.
   */
  setStateFindings: (findings: Finding[]) => void;
  setStateQuestions: (questions: Question[]) => void;
  setStateCategories: (categories: InvestigationCategory[]) => void;
}

export interface StoreSyncResult {
  /** Findings from the store (use these in DataContext state) */
  findings: Finding[];
  /** Questions from the store */
  questions: Question[];
  /** Categories from the store */
  categories: InvestigationCategory[];

  /**
   * Wrapped setters that write to the store (not to useDataState directly).
   * Drop-in replacement for actions.setFindings/setQuestions/setCategories.
   */
  setFindings: (findings: Finding[]) => void;
  setQuestions: (questions: Question[]) => void;
  setCategories: (categories: InvestigationCategory[]) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useStoreSync(inputs: StoreSyncInputs): StoreSyncResult {
  const {
    stateFindings,
    stateQuestions,
    stateCategories,
    setStateFindings,
    setStateQuestions,
    setStateCategories,
  } = inputs;

  // Track whether we're currently syncing to prevent loops
  const isSyncingRef = useRef(false);
  // Track whether the store has been initialized from a project load
  const storeInitializedRef = useRef(false);

  // Read current store state
  const storeFindings = useInvestigationStore(s => s.findings);
  const storeQuestions = useInvestigationStore(s => s.questions);
  const storeCategories = useInvestigationStore(s => s.categories);

  // ------------------------------------------------------------------
  // Direction 1: useDataState → Store (on project load)
  //
  // When useDataState receives new data from loadProject/importProject,
  // push it into the investigation store. We detect this by comparing
  // the state arrays with what we last synced.
  // ------------------------------------------------------------------

  const lastSyncedFindingsRef = useRef<Finding[]>([]);
  const lastSyncedQuestionsRef = useRef<Question[]>([]);
  const lastSyncedCategoriesRef = useRef<InvestigationCategory[]>([]);

  useEffect(() => {
    // If we're the ones who caused this change (sync from store → state), skip
    if (isSyncingRef.current) return;

    // Check if useDataState changed (from project load or import)
    const findingsChanged = stateFindings !== lastSyncedFindingsRef.current;
    const questionsChanged = stateQuestions !== lastSyncedQuestionsRef.current;
    const categoriesChanged = stateCategories !== lastSyncedCategoriesRef.current;

    if (findingsChanged || questionsChanged || categoriesChanged) {
      // Push state into the store
      useInvestigationStore.getState().loadInvestigationState({
        findings: stateFindings,
        questions: stateQuestions,
        categories: stateCategories,
      });

      // Update our tracking refs
      lastSyncedFindingsRef.current = stateFindings;
      lastSyncedQuestionsRef.current = stateQuestions;
      lastSyncedCategoriesRef.current = stateCategories;
      storeInitializedRef.current = true;
    }
  }, [stateFindings, stateQuestions, stateCategories]);

  // ------------------------------------------------------------------
  // Direction 2: Store → useDataState (for persistence)
  //
  // When the store changes (via CRUD operations), push the new state
  // into useDataState so that saveProject serializes correctly.
  // ------------------------------------------------------------------

  useEffect(() => {
    // Don't sync until store has been initialized
    if (!storeInitializedRef.current) return;

    // Mark as syncing to prevent the reverse direction from firing
    isSyncingRef.current = true;

    // Only push if actually different (reference equality)
    if (storeFindings !== lastSyncedFindingsRef.current) {
      setStateFindings(storeFindings);
      lastSyncedFindingsRef.current = storeFindings;
    }
    if (storeQuestions !== lastSyncedQuestionsRef.current) {
      setStateQuestions(storeQuestions);
      lastSyncedQuestionsRef.current = storeQuestions;
    }
    if (storeCategories !== lastSyncedCategoriesRef.current) {
      setStateCategories(storeCategories);
      lastSyncedCategoriesRef.current = storeCategories;
    }

    // Clear sync flag after React finishes this micro-task
    // Using queueMicrotask ensures we clear after the current batch of updates
    queueMicrotask(() => {
      isSyncingRef.current = false;
    });
  }, [
    storeFindings,
    storeQuestions,
    storeCategories,
    setStateFindings,
    setStateQuestions,
    setStateCategories,
  ]);

  // ------------------------------------------------------------------
  // Wrapped setters — write to store instead of directly to useDataState
  // ------------------------------------------------------------------

  const setFindings = useCallback((findings: Finding[]) => {
    useInvestigationStore.getState().loadInvestigationState({ findings });
  }, []);

  const setQuestions = useCallback((questions: Question[]) => {
    useInvestigationStore.getState().loadInvestigationState({ questions });
  }, []);

  const setCategories = useCallback((categories: InvestigationCategory[]) => {
    useInvestigationStore.getState().setCategories(categories);
  }, []);

  return {
    findings: storeFindings,
    questions: storeQuestions,
    categories: storeCategories,
    setFindings,
    setQuestions,
    setCategories,
  };
}
