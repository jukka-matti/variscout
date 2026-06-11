/**
 * Boundary guard: handlePinFinding must never let a non-string arrive as
 * finding.text. A leaked DOM event object is truthy and would survive the
 * `noteText || ''` fallback — crashing JSON serialization downstream on
 * the circular `event.target` SVG.
 *
 * This test uses renderHook to call handlePinFinding with a fake DOM-event
 * shaped object and asserts that `addFinding` received '' (empty string),
 * not the object.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks BEFORE component imports ────────────────────────────────────────

const addFindingMock = vi.hoisted(() => vi.fn(() => ({ id: 'f-new', text: '' }) as never));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findDuplicateMock = vi.hoisted(() => vi.fn((): any => undefined));
const setHighlightedFindingIdMock = vi.hoisted(() => vi.fn());
const setFindingsOpenMock = vi.hoisted(() => vi.fn());

vi.mock('@variscout/hooks', () => ({
  useFindings: () => ({
    findings: [],
    addFinding: addFindingMock,
    findDuplicate: findDuplicateMock,
    findDuplicateSource: vi.fn(() => undefined),
    editFinding: vi.fn(),
    deleteFinding: vi.fn(),
    setFindingTag: vi.fn(),
    setOutcome: vi.fn(),
    addAction: vi.fn(),
    completeAction: vi.fn(),
    deleteAction: vi.fn(),
    addFindingComment: vi.fn(),
    setProjection: vi.fn(),
  }),
  useDrillPath: () => ({ drillPath: [] }),
  buildFindingContext: () => ({ activeFilters: {}, cumulativeScope: null }),
  buildFindingSource: vi.fn(),
}));

vi.mock('../findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
  groupFindingsByChart: () => ({ boxplot: [], pareto: [], ichart: [] }),
  // getState is accessed imperatively inside the hook callback
  // — expose it as a static method on the selector function via prototype augmentation
  // at import time. We do this by making useFindingsStore callable AND having getState:
  // Use vi.hoisted below for the actual stub + Object.assign to bolt on getState.
  // Actually the simplest approach: re-export useFindingsStore as a function with .getState
}));

vi.mock('../../panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({
      setFindingsOpen: setFindingsOpenMock,
    }),
  },
}));

vi.mock('@variscout/stores', () => ({
  usePreferencesStore: {
    getState: () => ({ setTimeLens: vi.fn() }),
  },
  useProjectStore: {
    getState: () => ({ rawData: [], measureSpecs: {} }),
  },
  // ER-4: the orchestration's scopeId resolver reads these. No applied condition
  // in these tests → conditionLeaves: [] → resolver returns undefined (no mint).
  useAnalysisScopeStore: {
    getState: () => ({ conditionLeaves: [] }),
  },
  useAnalyzeStore: {
    getState: () => ({ scopes: [], syncScopeFromCondition: vi.fn() }),
  },
}));

vi.mock('../../findings/usePopoutSync', () => ({
  usePopoutSync: vi.fn(() => ({ handleOpenFindingsPopout: vi.fn() })),
}));

// ── Imports AFTER mocks ────────────────────────────────────────────────────

import { useFindingsOrchestration } from '../useFindingsOrchestration';
import { useFindingsStore } from '../findingsStore';
import type { UseFindingsOrchestrationOptions } from '../useFindingsOrchestration';

// Bolt getState onto the useFindingsStore mock function so imperactive calls inside
// the hook (useFindingsStore.getState().setHighlightedFindingId) work without throwing.
// This runs at module evaluation time, AFTER the mock has been applied.
(useFindingsStore as unknown as { getState: () => unknown }).getState = () => ({
  setHighlightedFindingId: setHighlightedFindingIdMock,
});

// ── Minimal options factory ────────────────────────────────────────────────

function makeMinimalOptions(): UseFindingsOrchestrationOptions {
  const noOp = vi.fn();
  return {
    persistedFindings: [],
    setPersistedFindings: noOp,
    filters: {},
    filteredData: [],
    outcome: 'Y',
    specs: undefined,
    rawData: [],
    columnAliases: {},
    filterNav: {
      filterStack: [],
      pushFilter: noOp,
      popFilter: noOp,
      clearFilters: noOp,
    } as never,
    setFilters: noOp,
    shareFinding: vi.fn(async () => true),
    canMentionInChannel: false,
    onViewStateChange: noOp,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useFindingsOrchestration — handlePinFinding boundary guard (Bug 1)', () => {
  beforeEach(() => {
    addFindingMock.mockClear();
    findDuplicateMock.mockClear();
    setHighlightedFindingIdMock.mockClear();
    setFindingsOpenMock.mockClear();
    findDuplicateMock.mockReturnValue(undefined);
  });

  it('calls addFinding with empty string when noteText is a non-string (e.g. a leaked DOM event)', () => {
    // mechanism: a React SyntheticEvent leaked via onClick={handlePinFinding} is
    // truthy and would survive `noteText || ''`, becoming finding.text and
    // crashing JSON serialization (circular SVG target).
    // Boundary guard: a non-string (e.g. a leaked DOM event) must never become finding.text
    // — it crashes JSON serialization downstream.
    const { result } = renderHook(() => useFindingsOrchestration(makeMinimalOptions()));

    const eventLike = { target: {}, preventDefault: () => {} } as never;
    act(() => {
      result.current.handlePinFinding(eventLike);
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    // LOAD-BEARING: the first arg to addFinding must be '' (string), NOT the
    // event object. Fails before the boundary guard is applied.
    const textArg = (addFindingMock.mock.calls[0] as unknown[])[0];
    expect(textArg).toBe('');
    expect(typeof textArg).toBe('string');
  });

  it('calls addFinding with the provided string noteText when given a real string', () => {
    const { result } = renderHook(() => useFindingsOrchestration(makeMinimalOptions()));

    act(() => {
      result.current.handlePinFinding('Observation from drill');
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    expect((addFindingMock.mock.calls[0] as unknown[])[0]).toBe('Observation from drill');
  });

  it('calls addFinding with empty string when noteText is omitted', () => {
    const { result } = renderHook(() => useFindingsOrchestration(makeMinimalOptions()));

    act(() => {
      result.current.handlePinFinding();
    });

    expect(addFindingMock).toHaveBeenCalledTimes(1);
    expect((addFindingMock.mock.calls[0] as unknown[])[0]).toBe('');
  });
});
