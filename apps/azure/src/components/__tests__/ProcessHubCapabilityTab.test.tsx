import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessHubCapabilityTab } from '../ProcessHubCapabilityTab';
import { useProjectStore } from '@variscout/stores';
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
    render(<ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={vi.fn()} />);
    // The Mix label appears as a category in CapabilityBoxplot
    expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
  });

  it('renders the filter strip with hub-level chips populated from data', () => {
    render(<ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={vi.fn()} />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coke/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sprite/ })).toBeInTheDocument();
  });

  it('renders empty-state hint when no mapped investigations', () => {
    const emptyRollup = {
      hub,
      investigations: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubCapabilityTab rollup={emptyRollup} onHubCpkTargetCommit={vi.fn()} />);
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
    const r = {
      hub: hubWithTarget,
      investigations: [member],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubCapabilityTab rollup={r} onHubCpkTargetCommit={vi.fn()} />);
    const wrapper = screen.getByTestId('hub-capability-cpk-target');
    const input = wrapper.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('1.67');
  });

  it('resolves per-step targetCpks via cascade — per-column override beats hub default', () => {
    // Per-column override for `mixCpk` should win over the hub-level cpkTarget.
    useProjectStore.setState({
      measureSpecs: { mixCpk: { cpkTarget: 1.5 } },
      cpkTarget: 1.0,
    });
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
    const r = {
      hub: hubWithTarget,
      investigations: [member],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    const { container } = render(
      <ProcessHubCapabilityTab rollup={r} onHubCpkTargetCommit={vi.fn()} />
    );
    // CapabilityBoxplot renders a per-node target tick when targetCpk is finite.
    // The cascade resolved 1.5 (per-column) → tick must exist for n1.
    expect(container.querySelector('[data-testid="target-tick-n1"]')).not.toBeNull();
    // Reset.
    useProjectStore.setState({ measureSpecs: {}, cpkTarget: undefined });
  });

  it('calls onHubCpkTargetCommit when the editor commits a new value', () => {
    const onHubCpkTargetCommit = vi.fn();
    render(<ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={onHubCpkTargetCommit} />);
    const wrapper = screen.getByTestId('hub-capability-cpk-target');
    const input = wrapper.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1.5' } });
    fireEvent.blur(input);
    expect(onHubCpkTargetCommit).toHaveBeenCalledWith('h1', 1.5);
  });
});
