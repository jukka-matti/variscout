import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessHubCapabilityTab } from '../ProcessHubCapabilityTab';
import type { ProcessStepCapabilitySource, ProcessHub } from '@variscout/core';

// jsdom polyfills for visx withParentSize (mirrors Plan B integration test)
type RAFCallback = (time: number) => void;
type ResizeObserverCb = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

const originalRAF = window.requestAnimationFrame;
const originalRO = window.ResizeObserver;
beforeAll(() => {
  window.requestAnimationFrame = (cb: RAFCallback) => {
    cb(0);
    return 0;
  };
  window.ResizeObserver = class implements ResizeObserver {
    private cb: ResizeObserverCb;
    constructor(cb: ResizeObserverCb) {
      this.cb = cb;
    }
    observe(_target: Element) {
      this.cb([{ contentRect: { width: 512, height: 384 } } as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  window.requestAnimationFrame = originalRAF;
  window.ResizeObserver = originalRO;
});

const map = {
  version: 1 as const,
  nodes: [
    {
      id: 'n1',
      name: 'Mix',
      ctqColumn: 'mixCpk',
      capabilityScope: {
        measurementColumn: 'mixCpk',
        specRules: [{ specs: { lsl: 0, usl: 2, target: 1 } }],
      },
    },
  ],
  tributaries: [],
};

const hub = {
  id: 'h1',
  name: 'Line A',
  canonicalProcessMap: map,
  canonicalMapVersion: '2026-04-28',
  contextColumns: ['product'],
  createdAt: '2026-04-28T00:00:00.000Z',
} as unknown as ProcessHub;

// PO-4: the portfolio source carries members but no rows (rows reach the
// per-step capability path only via the CS-P2 `rowsByAnalyze` seam at lift).
const member = {
  id: 'i1',
  name: 'I1',
  metadata: {
    processHubId: 'h1',
    nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
  },
};

const source = {
  hub,
  members: [member],
} as unknown as ProcessStepCapabilitySource;

describe('ProcessHubCapabilityTab', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
  });

  it('renders the hub host without crashing (no rows reachable in the portfolio source)', () => {
    render(<ProcessHubCapabilityTab source={source} onHubCpkTargetCommit={vi.fn()} />);
    // The Cpk target editor is the stable survivor — it does not depend on rows.
    expect(screen.getByTestId('hub-capability-cpk-target')).toBeInTheDocument();
  });

  it('renders empty-state hint when no mapped members supply rows', () => {
    render(<ProcessHubCapabilityTab source={source} onHubCpkTargetCommit={vi.fn()} />);
    // With no rows reachable, the production-line-glance dashboard shows its
    // no-mapped-data hint.
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });

  it('renders empty-state hint when there are no members at all', () => {
    const emptySource = { hub, members: [] } as unknown as ProcessStepCapabilitySource;
    render(<ProcessHubCapabilityTab source={emptySource} onHubCpkTargetCommit={vi.fn()} />);
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });

  it('renders the hub-level Cpk target editor with the persisted value', () => {
    const hubWithTarget = {
      ...hub,
      reviewSignal: {
        rowCount: 0,
        outcome: '',
        computedAt: '2026-04-29T00:00:00.000Z',
        changeSignals: {
          total: 0,
          outOfControlCount: 0,
          nelsonRule2Count: 0,
          nelsonRule3Count: 0,
        },
        capability: { outOfSpecPercentage: 0, cpkTarget: 1.67 },
      },
    } as unknown as ProcessHub;
    const s = {
      hub: hubWithTarget,
      members: [member],
    } as unknown as ProcessStepCapabilitySource;
    render(<ProcessHubCapabilityTab source={s} onHubCpkTargetCommit={vi.fn()} />);
    const wrapper = screen.getByTestId('hub-capability-cpk-target');
    const input = wrapper.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('1.67');
  });

  it('calls onHubCpkTargetCommit when the editor commits a new value', () => {
    const onHubCpkTargetCommit = vi.fn();
    render(<ProcessHubCapabilityTab source={source} onHubCpkTargetCommit={onHubCpkTargetCommit} />);
    const wrapper = screen.getByTestId('hub-capability-cpk-target');
    const input = wrapper.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1.5' } });
    fireEvent.blur(input);
    expect(onHubCpkTargetCommit).toHaveBeenCalledWith('h1', 1.5);
  });
});
