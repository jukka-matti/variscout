import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hypothesis, ProcessMap } from '@variscout/core';
import { getAnalyzeInitialState, useAnalyzeStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { LocalMechanismView } from '../LocalMechanismView';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

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

function hub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: overrides.id ?? h('hub-1'),
    name: overrides.name ?? 'Machine setup drift',
    synthesis: overrides.synthesis ?? '',
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
      {...overrides}
    />
  );
}

describe('LocalMechanismView', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('renders one mini-chart per focal step column including ctq without duplicates', () => {
    renderView();

    expect(screen.getAllByTestId('column-mini-chart')).toHaveLength(4);
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('gates factor contribution rankings to focal investigation context via hypothesis condition', () => {
    renderView();
    expect(screen.queryByTestId('factor-contribution-rankings')).toBeNull();

    cleanup();
    // IM-1: factor context comes from hypothesis.condition, not Question entity
    act(() => {
      useAnalyzeStore.setState({
        hypotheses: [
          hub({
            condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
          }),
        ],
      });
    });
    renderView();

    const rankings = screen.getByTestId('factor-contribution-rankings');
    expect(within(rankings).getByText(/contribution evidence/i)).toBeInTheDocument();
    expect(within(rankings).getByText('Machine')).toBeInTheDocument();
  });

  it('excludes the outcome column from factor contribution rankings', () => {
    act(() => {
      useAnalyzeStore.setState({
        hypotheses: [
          hub({
            condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
          }),
        ],
      });
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

  // CS-12 §7.1/§7.3: the glued stack (embedded WallCanvas + compact
  // EvidenceMapBase) and the per-column response-path CTA row retired. Negative
  // controls — none of those surfaces may render, even when an investigation
  // context (which previously triggered them) is present.
  it('does not render the retired glued stack or response-path CTAs', () => {
    act(() => {
      useAnalyzeStore.setState({
        hypotheses: [
          hub({
            condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
          }),
        ],
      });
    });
    renderView();

    // Rankings (kept) still render under investigation context — proves the
    // negative controls aren't passing because nothing rendered at all.
    expect(screen.getByTestId('factor-contribution-rankings')).toBeInTheDocument();

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
    expect(screen.queryByTestId('evidence-map-base')).toBeNull();
    expect(screen.queryByTestId('response-path-ctas')).toBeNull();
  });
});
