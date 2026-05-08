import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  getInvestigationInitialState,
  useInvestigationStore,
  useWallLayoutStore,
} from '@variscout/stores';
import { useSharedWallProps } from '../useSharedWallProps';
import type { Finding, Question, SuspectedCause } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

function makeHub(overrides: Partial<SuspectedCause> & { id: string }): SuspectedCause {
  return {
    name: 'Night shift setup',
    synthesis: 'Setup variation likely drives defects.',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    text: 'Does setup vary by shift?',
    status: 'open',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> & { id: string }): Finding {
  return {
    text: 'Night shift has wider spread.',
    context: {
      activeFilters: {},
      cumulativeScope: null,
    },
    status: 'observed',
    comments: [],
    statusChangedAt: 1714000000000,
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'mix', name: 'Mix', order: 0 }],
  tributaries: [{ id: 'shift', stepId: 'mix', column: 'Shift' }],
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
};

beforeEach(() => {
  useInvestigationStore.setState(getInvestigationInitialState());
  useWallLayoutStore.setState({
    zoom: 1,
    pan: { x: 0, y: 0 },
    groupByTributary: false,
  });
});

describe('useSharedWallProps', () => {
  it('exposes hubs and questions from investigation store and findings from args', () => {
    const hub = makeHub({ id: 'hub-1' });
    const question = makeQuestion({ id: 'q-1' });
    const findings = [makeFinding({ id: 'finding-1' })];
    useInvestigationStore.setState({
      suspectedCauses: [hub],
      questions: [question],
    });

    const { result } = renderHook(() =>
      useSharedWallProps({
        findings,
        processMap: undefined,
        problemCpk: 0.82,
        eventsPerWeek: 17,
        activeColumns: undefined,
      })
    );

    expect(result.current.hubs).toBe(useInvestigationStore.getState().suspectedCauses);
    expect(result.current.questions).toBe(useInvestigationStore.getState().questions);
    expect(result.current.findings).toBe(findings);
  });

  it('exposes viewport state from wall layout store', () => {
    const pan = { x: 120, y: -45 };
    useWallLayoutStore.setState({
      zoom: 1.75,
      pan,
      groupByTributary: true,
    });

    const { result } = renderHook(() =>
      useSharedWallProps({
        findings: [],
        processMap: undefined,
        problemCpk: 0.9,
        eventsPerWeek: 4,
        activeColumns: undefined,
      })
    );

    expect(result.current.zoom).toBe(1.75);
    expect(result.current.pan).toBe(pan);
    expect(result.current.groupByTributary).toBe(true);
  });

  it('returns the exact scalar and object args for process data', () => {
    const activeColumns = ['Shift', 'Temperature'];

    const { result } = renderHook(() =>
      useSharedWallProps({
        findings: [],
        processMap,
        problemCpk: 1.23,
        eventsPerWeek: 9,
        activeColumns,
      })
    );

    expect(result.current.processMap).toBe(processMap);
    expect(result.current.problemCpk).toBe(1.23);
    expect(result.current.eventsPerWeek).toBe(9);
    expect(result.current.activeColumns).toBe(activeColumns);
  });

  it('keeps object identity stable when store slices and arg references are unchanged', () => {
    const findings = [makeFinding({ id: 'finding-1' })];
    const activeColumns = ['Shift'];
    const args = {
      findings,
      processMap,
      problemCpk: 0.74,
      eventsPerWeek: 11,
      activeColumns,
    };

    const { result, rerender } = renderHook(() => useSharedWallProps(args));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
