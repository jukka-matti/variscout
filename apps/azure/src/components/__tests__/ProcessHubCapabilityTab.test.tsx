import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessHubCapabilityTab } from '../ProcessHubCapabilityTab';
import type {
  ProcessHubInvestigation,
  ProcessHubRollup,
  ProcessHub,
  DataRow,
} from '@variscout/core';

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

const member = {
  id: 'i1',
  name: 'I1',
  processHubId: 'h1',
  modified: '2026-04-28T00:00:00.000Z',
  metadata: {
    processHubId: 'h1',
    nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    canonicalMapVersion: '2026-04-28',
  },
  rows: Array.from({ length: 30 }, (_, i) => ({
    mixCpk: 1.0 + (i % 7) * 0.1,
    product: i < 15 ? 'Coke' : 'Sprite',
  })) as DataRow[],
  reviewSignal: { ok: 0, review: 0, alarm: 0 },
} as unknown as ProcessHubInvestigation;

const rollup = {
  hub,
  investigations: [member],
} as unknown as ProcessHubRollup<ProcessHubInvestigation>;

describe('ProcessHubCapabilityTab', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
  });

  it('renders the dashboard with Mix node visible', () => {
    render(<ProcessHubCapabilityTab rollup={rollup} />);
    // The Mix label appears as a category in CapabilityBoxplot
    expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
  });

  it('renders the filter strip with hub-level chips populated from data', () => {
    render(<ProcessHubCapabilityTab rollup={rollup} />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coke/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sprite/ })).toBeInTheDocument();
  });

  it('renders empty-state hint when no mapped investigations', () => {
    const emptyRollup = {
      hub,
      investigations: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubCapabilityTab rollup={emptyRollup} />);
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });
});
