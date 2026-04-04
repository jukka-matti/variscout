/**
 * Tests for useStoreSync — bidirectional sync between investigation store and DataContext
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvestigationStore, getInvestigationInitialState } from '@variscout/stores';
import { useStoreSync, type StoreSyncInputs } from '../useStoreSync';
import type { Finding, Question, InvestigationCategory } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: `f-${Math.random().toString(36).slice(2, 8)}`,
    text: 'Test finding',
    createdAt: Date.now(),
    status: 'observed',
    comments: [],
    activeFilters: {},
    ...overrides,
  } as Finding;
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: `q-${Math.random().toString(36).slice(2, 8)}`,
    text: 'Test question',
    status: 'open',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Question;
}

function makeCategory(name: string): InvestigationCategory {
  return {
    id: `cat-${Math.random().toString(36).slice(2, 8)}`,
    name,
    factorColumns: [],
  };
}

function createInputs(overrides: Partial<StoreSyncInputs> = {}): StoreSyncInputs {
  return {
    stateFindings: [],
    stateQuestions: [],
    stateCategories: [],
    setStateFindings: vi.fn(),
    setStateQuestions: vi.fn(),
    setStateCategories: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStoreSync', () => {
  beforeEach(() => {
    // Reset investigation store between tests
    useInvestigationStore.setState(getInvestigationInitialState());
  });

  it('returns empty arrays when both state and store are empty', () => {
    const { result } = renderHook(() => useStoreSync(createInputs()));

    expect(result.current.findings).toEqual([]);
    expect(result.current.questions).toEqual([]);
    expect(result.current.categories).toEqual([]);
  });

  it('provides stable setter functions', () => {
    const { result, rerender } = renderHook(() => useStoreSync(createInputs()));

    const firstSetFindings = result.current.setFindings;
    const firstSetQuestions = result.current.setQuestions;
    const firstSetCategories = result.current.setCategories;

    rerender();

    expect(result.current.setFindings).toBe(firstSetFindings);
    expect(result.current.setQuestions).toBe(firstSetQuestions);
    expect(result.current.setCategories).toBe(firstSetCategories);
  });

  describe('Direction 1: State → Store (project load)', () => {
    it('pushes state findings into the investigation store', () => {
      const findings = [makeFinding({ text: 'loaded finding' })];
      const { result } = renderHook(() => useStoreSync(createInputs({ stateFindings: findings })));

      // Store should now contain the findings
      expect(useInvestigationStore.getState().findings).toEqual(findings);
      // Hook should return the store's findings
      expect(result.current.findings).toEqual(findings);
    });

    it('pushes state questions into the investigation store', () => {
      const questions = [makeQuestion({ text: 'loaded question' })];
      renderHook(() => useStoreSync(createInputs({ stateQuestions: questions })));

      expect(useInvestigationStore.getState().questions).toEqual(questions);
    });

    it('pushes state categories into the investigation store', () => {
      const categories = [makeCategory('Machine')];
      renderHook(() => useStoreSync(createInputs({ stateCategories: categories })));

      expect(useInvestigationStore.getState().categories).toEqual(categories);
    });

    it('updates store when state changes (simulating project load)', () => {
      // Start with findings already present (simulating a loaded project)
      const findings = [makeFinding({ text: 'loaded from project' })];
      const questions = [makeQuestion({ text: 'loaded question' })];

      const { result } = renderHook(() =>
        useStoreSync(
          createInputs({
            stateFindings: findings,
            stateQuestions: questions,
          })
        )
      );

      // Both store and hook return the loaded data
      expect(result.current.findings).toEqual(findings);
      expect(result.current.questions).toEqual(questions);
      expect(useInvestigationStore.getState().findings).toEqual(findings);
      expect(useInvestigationStore.getState().questions).toEqual(questions);
    });
  });

  describe('Direction 2: Store → State (for persistence)', () => {
    it('syncs store findings back to state setters', async () => {
      const setStateFindings = vi.fn();
      const findings = [makeFinding()];

      // Start with initial findings so store is initialized
      renderHook(() =>
        useStoreSync(
          createInputs({
            stateFindings: findings,
            setStateFindings,
          })
        )
      );

      // Now mutate via the store directly
      const newFinding = makeFinding({ text: 'store-added' });
      act(() => {
        useInvestigationStore.setState({ findings: [...findings, newFinding] });
      });

      // Wait for microtask to clear sync flag
      await new Promise(resolve => setTimeout(resolve, 0));

      // The setter should have been called with the updated findings
      expect(setStateFindings).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: 'store-added' })])
      );
    });
  });

  describe('Wrapped setters', () => {
    it('setFindings writes to the investigation store', () => {
      const findings = [makeFinding({ text: 'initial' })];
      const { result } = renderHook(() => useStoreSync(createInputs({ stateFindings: findings })));

      const newFindings = [makeFinding({ text: 'replaced' })];
      act(() => {
        result.current.setFindings(newFindings);
      });

      expect(useInvestigationStore.getState().findings).toEqual(newFindings);
    });

    it('setQuestions writes to the investigation store', () => {
      const { result } = renderHook(() => useStoreSync(createInputs()));

      const newQuestions = [makeQuestion({ text: 'new question' })];
      act(() => {
        result.current.setQuestions(newQuestions);
      });

      expect(useInvestigationStore.getState().questions).toEqual(newQuestions);
    });

    it('setCategories writes to the investigation store', () => {
      const { result } = renderHook(() => useStoreSync(createInputs()));

      const newCategories = [makeCategory('Environment')];
      act(() => {
        result.current.setCategories(newCategories);
      });

      expect(useInvestigationStore.getState().categories).toEqual(newCategories);
    });
  });
});
