import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { SuspectedCause, ProcessMap } from '@variscout/core';

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
  tributaries: [{ id: 't1', stepId: 'n1', column: 'SHIFT' }],
  ctsColumn: 'FILL',
  createdAt: '',
  updatedAt: '',
};

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  questionIds: [],
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: '',
  updatedAt: '',
};

describe('WallCanvas', () => {
  it('renders empty state when no hubs', () => {
    render(
      <WallCanvas
        hubs={[]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Start with a hypothesis/i)).toBeInTheDocument();
  });

  it('renders Problem card + hub cards when hubs present', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
  });

  it('renders tributary footer row', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/SHIFT/)).toBeInTheDocument();
  });

  it('flags missing-column when hub condition references a column not in activeColumns', () => {
    const hubWithCondition: SuspectedCause = {
      ...hub,
      id: 'h-missing',
      condition: {
        kind: 'leaf',
        column: 'DROPPED_COLUMN',
        op: 'eq',
        value: 'x',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'NOZZLE.TEMP']}
      />
    );
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  it('does not flag missing-column when all referenced columns are present', () => {
    const hubWithCondition: SuspectedCause = {
      ...hub,
      id: 'h-ok',
      condition: {
        kind: 'leaf',
        column: 'SHIFT',
        op: 'eq',
        value: 'night',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'NOZZLE.TEMP']}
      />
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });

  it('does not flag missing-column when activeColumns is not provided', () => {
    const hubWithCondition: SuspectedCause = {
      ...hub,
      id: 'h-unknown',
      condition: {
        kind: 'leaf',
        column: 'ANY_COLUMN',
        op: 'eq',
        value: 'x',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
      />
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });
});
