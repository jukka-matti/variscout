import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  getCanvasViewportInitialState,
  getInvestigationInitialState,
  useCanvasViewportStore,
  useInvestigationStore,
} from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import {
  useSharedWallProps,
  type UseSharedWallPropsArgs,
  type UseSharedWallPropsReturn,
} from '../useSharedWallProps';
import type { Finding, Question, Hypothesis } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

interface MutableWallCanvasDataProps {
  hubId?: string;
  hubs: Hypothesis[];
  findings: Finding[];
  questions: Question[];
  processMap?: ProcessMap;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns?: ReadonlyArray<string>;
  zoom?: number;
  pan?: { x: number; y: number };
  groupByTributary?: boolean;
}

function makeHub(overrides: Partial<Hypothesis> & { id: string }): Hypothesis {
  return {
    name: 'Night shift setup',
    synthesis: 'Setup variation likely drives defects.',
    questionIds: [],
    findingIds: [],
    status: 'proposed',
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
    evidenceType: 'data',
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
const HUB_ID = 'hub-shared-wall-props' as ProcessHubId;
const OTHER_HUB_ID = 'hub-other-wall-props' as ProcessHubId;

beforeEach(() => {
  useInvestigationStore.setState(getInvestigationInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('useSharedWallProps', () => {
  it('returns data props assignable to the mutable WallCanvas data prop shape', () => {
    expectTypeOf<UseSharedWallPropsArgs['findings']>().toEqualTypeOf<Finding[]>();
    expectTypeOf<UseSharedWallPropsReturn>().toMatchTypeOf<MutableWallCanvasDataProps>();
  });

  it('exposes hubs and questions from investigation store and findings from args', () => {
    const hub = makeHub({ id: 'hub-1' });
    const question = makeQuestion({ id: 'q-1' });
    const findings = [makeFinding({ id: 'finding-1' })];
    useInvestigationStore.setState({
      hypotheses: [hub],
      questions: [question],
    });

    const { result } = renderHook(() =>
      useSharedWallProps({
        hubId: HUB_ID,
        findings,
        processMap: undefined,
        problemCpk: 0.82,
        eventsPerWeek: 17,
        activeColumns: undefined,
      })
    );

    expect(result.current.hubs).toBe(useInvestigationStore.getState().hypotheses);
    expect(result.current.questions).toBe(useInvestigationStore.getState().questions);
    expect(result.current.findings).toBe(findings);
  });

  it('exposes viewport state from the requested hub viewport', () => {
    const pan = { x: 120, y: -45 };
    useCanvasViewportStore.getState().setZoom(HUB_ID, 1.75);
    useCanvasViewportStore.getState().setPan(HUB_ID, pan);
    useCanvasViewportStore.getState().setGroupByTributary(HUB_ID, true);
    useCanvasViewportStore.getState().setZoom(OTHER_HUB_ID, 2.5);
    useCanvasViewportStore.getState().setPan(OTHER_HUB_ID, { x: -1, y: -2 });
    useCanvasViewportStore.getState().setGroupByTributary(OTHER_HUB_ID, false);

    const { result } = renderHook(() =>
      useSharedWallProps({
        hubId: HUB_ID,
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
        hubId: HUB_ID,
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
      hubId: HUB_ID,
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
