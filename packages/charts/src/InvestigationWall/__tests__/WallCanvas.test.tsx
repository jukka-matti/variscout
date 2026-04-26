import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { SuspectedCause, ProcessMap } from '@variscout/core';

/**
 * Override `window.matchMedia` for a single test to force the mobile branch
 * of `useWallIsMobile`. Returns a restore function that the caller invokes
 * in `afterEach` (or directly) to put the default jsdom desktop stub back.
 */
function installMobileMatchMedia() {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: original,
    });
  };
}

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
    expect(screen.getByText(/Start a Mechanism Branch/i)).toBeInTheDocument();
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

  it('renders branch cards without a process map', () => {
    render(
      <WallCanvas
        hubs={[{ ...hub, nextMove: 'Check nozzle temperature.' }]}
        findings={[]}
        questions={[]}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
    expect(screen.getByText(/Mechanism Branch/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: Check nozzle temperature/i)).toBeInTheDocument();
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
    expect(group?.querySelectorAll('[aria-label*="Mechanism Branch"]').length).toBe(2);
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

  describe('mobile breakpoint', () => {
    let restoreMatchMedia: (() => void) | undefined;

    afterEach(() => {
      restoreMatchMedia?.();
      restoreMatchMedia = undefined;
    });

    it('renders MobileCardList instead of the SVG canvas below 768px', () => {
      restoreMatchMedia = installMobileMatchMedia();
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
      // Mobile card list is present...
      expect(screen.getByTestId('wall-mobile-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('wall-mobile-hub-h1')).toBeInTheDocument();
      // ...and the desktop SVG viewport group is not.
      expect(container.querySelector('[data-wall-viewport]')).toBeNull();
    });

    it('still renders MissingEvidenceDigest below the card list on mobile', () => {
      restoreMatchMedia = installMobileMatchMedia();
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          questions={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          gaps={[{ id: 'g1', message: 'No SHIFT coverage', hubId: 'h1' }]}
        />
      );
      // Digest renders as a collapsed section — the aria-label is enough to
      // confirm the panel mounted alongside the mobile card list.
      expect(screen.getByLabelText(/Missing evidence digest/i)).toBeInTheDocument();
    });
  });
});
