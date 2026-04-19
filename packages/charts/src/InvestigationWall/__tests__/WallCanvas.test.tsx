import { describe, it, expect, vi } from 'vitest';
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

  it('renders draggable hubs when onComposeGate is provided (DnD enabled)', () => {
    const onComposeGate = vi.fn();
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        onComposeGate={onComposeGate}
      />
    );
    // DraggableHypothesisCard wraps with data-draggable-hub attr.
    expect(container.querySelector('[data-draggable-hub="h1"]')).toBeTruthy();
  });

  it('renders static hubs when onComposeGate is not provided (DnD disabled)', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    // No draggable wrapper when DnD is off.
    expect(container.querySelector('[data-draggable-hub]')).toBeNull();
  });

  it('applies identity transform (zoom=1, pan=0,0) by default', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    const transformGroup = container.querySelector('[data-wall-viewport]');
    expect(transformGroup).toBeTruthy();
    expect(transformGroup?.getAttribute('transform')).toContain('translate(0, 0)');
    expect(transformGroup?.getAttribute('transform')).toContain('scale(1)');
  });

  it('wraps hubs in a tributary-group frame when groupByTributary is on', () => {
    const hubA: SuspectedCause = { ...hub, id: 'hA', tributaryIds: ['t1'] };
    const hubB: SuspectedCause = { ...hub, id: 'hB', tributaryIds: ['t1'] };
    const { container } = render(
      <WallCanvas
        hubs={[hubA, hubB]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        groupByTributary
      />
    );
    const group = container.querySelector('[data-tributary-group="t1"]');
    expect(group).toBeTruthy();
    // Both hubs live inside the group frame.
    expect(group?.querySelectorAll('[aria-label*="Hypothesis"]').length).toBe(2);
  });

  it('does not render tributary-group frame when groupByTributary is off', () => {
    const hubA: SuspectedCause = { ...hub, id: 'hA', tributaryIds: ['t1'] };
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(container.querySelector('[data-tributary-group]')).toBeNull();
  });

  it('buckets hubs without matching tributary into an unassigned group', () => {
    const hubA: SuspectedCause = { ...hub, id: 'hA' }; // no tributaryIds
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        groupByTributary
      />
    );
    expect(container.querySelector('[data-tributary-group="unassigned"]')).toBeTruthy();
  });

  it('applies provided zoom + pan to the viewport transform', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        zoom={0.5}
        pan={{ x: 100, y: 50 }}
      />
    );
    const transformGroup = container.querySelector('[data-wall-viewport]');
    expect(transformGroup?.getAttribute('transform')).toContain('translate(100, 50)');
    expect(transformGroup?.getAttribute('transform')).toContain('scale(0.5)');
  });
});
