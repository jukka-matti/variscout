import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Finding, Hypothesis, ProcessMap, Question } from '@variscout/core';
import { getInvestigationInitialState, useInvestigationStore } from '@variscout/stores';
import { LocalMechanismView } from '../LocalMechanismView';

vi.mock('@variscout/charts', async () => {
  const actual = await vi.importActual<typeof import('@variscout/charts')>('@variscout/charts');
  return {
    ...actual,
    EvidenceMapBase: (props: {
      stepColumns?: readonly string[];
      factorNodes: Array<{ factor: string }>;
      onFactorClick?: (factor: string) => void;
    }) => (
      <div
        data-testid="mock-evidence-map-base"
        data-step-columns={(props.stepColumns ?? []).join('|')}
        data-factor-count={props.factorNodes.length}
      >
        <button type="button" onClick={() => props.onFactorClick?.('Machine')}>
          evidence factor
        </button>
      </div>
    ),
  };
});

vi.mock('../../../InvestigationWall/WallCanvas', () => ({
  WallCanvas: (props: {
    mode?: string;
    filterByStepId?: string;
    hubs: Hypothesis[];
    questions: Question[];
    findings: Finding[];
    rows?: ReadonlyArray<Record<string, unknown>>;
    columnTypes?: Record<string, string>;
    outcomeColumn?: string | null;
    onSelectHub?: (id: string) => void;
  }) => (
    <div
      data-testid="mock-wall-canvas"
      data-mode={props.mode}
      data-filter-by-step-id={props.filterByStepId}
      data-hubs-count={props.hubs.length}
      data-questions-count={props.questions.length}
      data-findings-count={props.findings.length}
      data-rows-count={props.rows?.length ?? 0}
      data-outcome-column={props.outcomeColumn ?? ''}
    >
      <button type="button" onClick={() => props.onSelectHub?.('hub-1')}>
        select wall hub
      </button>
    </div>
  ),
}));

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Temperature' },
    { id: 'pack', name: 'Pack', order: 1, ctqColumn: 'Pack Weight' },
  ],
  tributaries: [
    { id: 't-machine', stepId: 'mix', column: 'Machine' },
    { id: 't-shift', stepId: 'mix', column: 'Shift' },
    { id: 't-pack', stepId: 'pack', column: 'Carton' },
  ],
  assignments: {
    Machine: 'mix',
    Operator: 'mix',
    Temperature: 'mix',
    Carton: 'pack',
  },
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const rows = [
  { Outcome: 10, Machine: 'A', Operator: 'Ada', Shift: 'Day', Temperature: 98 },
  { Outcome: 12, Machine: 'A', Operator: 'Ada', Shift: 'Day', Temperature: 99 },
  { Outcome: 15, Machine: 'B', Operator: 'Ben', Shift: 'Night', Temperature: 103 },
  { Outcome: 16, Machine: 'B', Operator: 'Ben', Shift: 'Night', Temperature: 104 },
  { Outcome: 11, Machine: 'A', Operator: 'Cam', Shift: 'Day', Temperature: 100 },
  { Outcome: 17, Machine: 'B', Operator: 'Cam', Shift: 'Night', Temperature: 105 },
  { Outcome: 18, Machine: 'C', Operator: 'Ada', Shift: 'Night', Temperature: 106 },
  { Outcome: 13, Machine: 'C', Operator: 'Ben', Shift: 'Day', Temperature: 101 },
  { Outcome: 19, Machine: 'C', Operator: 'Cam', Shift: 'Night', Temperature: 107 },
  { Outcome: 14, Machine: 'A', Operator: 'Ben', Shift: 'Day', Temperature: 102 },
  { Outcome: 20, Machine: 'B', Operator: 'Ada', Shift: 'Night', Temperature: 108 },
  { Outcome: 21, Machine: 'C', Operator: 'Ben', Shift: 'Night', Temperature: 109 },
];

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: overrides.id ?? 'q-1',
    text: overrides.text ?? 'Does Machine explain the outcome?',
    factor: overrides.factor ?? 'Machine',
    status: overrides.status ?? 'open',
    linkedFindingIds: [],
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-1',
    ...overrides,
  };
}

function hub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: overrides.id ?? 'hub-1',
    name: overrides.name ?? 'Machine setup drift',
    synthesis: overrides.synthesis ?? '',
    questionIds: overrides.questionIds ?? [],
    findingIds: overrides.findingIds ?? [],
    status: overrides.status ?? 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-1',
    ...overrides,
  };
}

function renderView(overrides: Partial<React.ComponentProps<typeof LocalMechanismView>> = {}) {
  return render(
    <LocalMechanismView
      hubId="hub-main"
      focalStepId="mix"
      map={map}
      rows={rows}
      outcomeColumn="Outcome"
      columnTypes={{
        Machine: 'categorical',
        Operator: 'text',
        Shift: 'categorical',
        Temperature: 'numeric',
      }}
      findings={[]}
      problemCpk={0.72}
      eventsPerWeek={33}
      activeColumns={['Outcome', 'Machine', 'Operator', 'Shift', 'Temperature']}
      {...overrides}
    />
  );
}

describe('LocalMechanismView', () => {
  beforeEach(() => {
    useInvestigationStore.setState(getInvestigationInitialState());
  });

  it('renders one mini-chart per focal step column including ctq without duplicates', () => {
    renderView();

    expect(screen.getAllByTestId('column-mini-chart')).toHaveLength(4);
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('passes focal step columns to EvidenceMapBase and focuses factor clicks', () => {
    const onOpenInvestigationFocus = vi.fn();
    useInvestigationStore.setState({
      questions: [question({ id: 'q-machine', factor: 'Machine' })],
    });
    renderView({ onOpenInvestigationFocus });

    expect(screen.getByTestId('evidence-map-base')).toHaveAttribute(
      'data-step-columns',
      'Machine|Operator|Temperature|Shift'
    );
    expect(screen.getByTestId('mock-evidence-map-base')).toHaveAttribute(
      'data-step-columns',
      'Machine|Operator|Temperature|Shift'
    );

    fireEvent.click(screen.getByRole('button', { name: 'evidence factor' }));

    expect(onOpenInvestigationFocus).toHaveBeenCalledWith({
      kind: 'question',
      id: 'q-machine',
      questionId: 'q-machine',
    });
  });

  it('renders WallCanvas in overlay mode filtered to the focal step and forwards selection callbacks', () => {
    const onSelectWallHub = vi.fn();
    const onOpenWall = vi.fn();
    useInvestigationStore.setState({ hypotheses: [hub()], questions: [question()] });

    renderView({ findings: [{ id: 'f-1' } as Finding], onSelectWallHub, onOpenWall });

    const wall = screen.getByTestId('wall-canvas');
    expect(wall).toBeInTheDocument();

    const mockedWall = screen.getByTestId('mock-wall-canvas');
    expect(mockedWall).toHaveAttribute('data-mode', 'overlay');
    expect(mockedWall).toHaveAttribute('data-filter-by-step-id', 'mix');
    expect(mockedWall).toHaveAttribute('data-hubs-count', '1');
    expect(mockedWall).toHaveAttribute('data-questions-count', '1');
    expect(mockedWall).toHaveAttribute('data-findings-count', '1');

    fireEvent.click(screen.getByRole('button', { name: 'select wall hub' }));

    expect(onSelectWallHub).toHaveBeenCalledWith('hub-1');
    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });

  it('gates factor contribution rankings to focal investigation context', () => {
    renderView();
    expect(screen.queryByTestId('factor-contribution-rankings')).toBeNull();

    cleanup();
    act(() => {
      useInvestigationStore.setState({ questions: [question({ factor: 'Machine' })] });
    });
    renderView();

    const rankings = screen.getByTestId('factor-contribution-rankings');
    expect(within(rankings).getByText(/contribution evidence/i)).toBeInTheDocument();
    expect(within(rankings).getByText('Machine')).toBeInTheDocument();

    cleanup();
    act(() => {
      useInvestigationStore.setState({
        questions: [],
        hypotheses: [
          hub({
            condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
          }),
        ],
      });
    });
    renderView();

    expect(screen.getByTestId('factor-contribution-rankings')).toBeInTheDocument();
  });

  it('excludes the outcome column from factor contribution rankings', () => {
    act(() => {
      useInvestigationStore.setState({ questions: [question({ factor: 'Machine' })] });
    });

    renderView({
      map: {
        ...map,
        nodes: [{ id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Outcome' }],
        assignments: { Machine: 'mix', Outcome: 'mix' },
        tributaries: [],
      },
    });

    const rankings = screen.getByTestId('factor-contribution-rankings');
    expect(within(rankings).getByText('Machine')).toBeInTheDocument();
    expect(within(rankings).queryByText('Outcome')).not.toBeInTheDocument();
  });

  it('opens column detail from mini-chart clicks', () => {
    const onOpenColumnDetail = vi.fn();
    renderView({ onOpenColumnDetail });

    fireEvent.click(screen.getAllByTestId('column-mini-chart')[0]);

    expect(onOpenColumnDetail).toHaveBeenCalledWith('Machine', 'mix');
  });

  it('submits quick action payload with focal step and column context', () => {
    const onLogQuickAction = vi.fn();
    renderView({ onLogQuickAction });

    fireEvent.click(screen.getByRole('button', { name: /log action for Machine/i }));
    fireEvent.change(screen.getByLabelText(/what/i), { target: { value: 'Check setup sheet' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLogQuickAction).toHaveBeenCalledWith('mix', {
      text: '[Machine] Check setup sheet',
      status: 'done',
    });
  });
});
