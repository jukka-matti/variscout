import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionLineGlanceDashboard } from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../types';
import type { NodeCapabilityResult } from '@variscout/core/stats';
import type { StatsResult } from '@variscout/core';

// jsdom does not implement ResizeObserver or requestAnimationFrame in a way that
// triggers @visx/responsive `withParentSize` callbacks synchronously.
// Stub both so chart Base components receive non-zero dimensions during render.
type RAFCallback = (time: number) => void;
type ResizeObserverCb = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

const originalRAF = window.requestAnimationFrame;
beforeAll(() => {
  // Run requestAnimationFrame callbacks synchronously so withParentSize.resize() fires.
  window.requestAnimationFrame = (cb: RAFCallback) => {
    cb(0);
    return 0;
  };
  // Provide a ResizeObserver that immediately calls back with fixed dimensions.
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
});

const STATS: StatsResult = {
  mean: 1.2,
  median: 1.2,
  stdDev: 0.1,
  sigmaWithin: 0.1,
  mrBar: 0.1,
  ucl: 1.5,
  lcl: 0.9,
  outOfSpecPercentage: 0,
};

const GAP_STATS: StatsResult = {
  mean: 0.02,
  median: 0.02,
  stdDev: 0.04,
  sigmaWithin: 0.03,
  mrBar: 0.03,
  ucl: 0.14,
  lcl: -0.1,
  outOfSpecPercentage: 0,
};

const cpks = [1.1, 1.3, 1.5, 1.0, 1.4, 1.2, 1.6];
const result: NodeCapabilityResult = {
  nodeId: 'n1',
  cpk: 1.3,
  cp: 1.4,
  n: 700,
  sampleConfidence: 'trust',
  source: 'column',
  perContextResults: cpks.map((cpk, i) => ({
    contextTuple: { product: `P${i}` },
    cpk,
    n: 100,
    sampleConfidence: 'trust',
  })),
};

const props: ProductionLineGlanceDashboardProps = {
  cpkTrend: {
    data: Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: 1.2 + (i % 3) * 0.05,
      originalIndex: i,
    })),
    stats: STATS,
    specs: { target: 1.33 },
  },
  cpkGapTrend: {
    series: Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: 0.05 - (i % 3) * 0.02,
      originalIndex: i,
    })),
    stats: GAP_STATS,
  },
  capabilityNodes: [{ nodeId: 'n1', label: 'Mix', targetCpk: 1.33, result }],
  errorSteps: [
    { nodeId: 'n1', label: 'Mix', errorCount: 12 },
    { nodeId: 'n2', label: 'Fill', errorCount: 47 },
  ],
};

describe('ProductionLineGlanceDashboard — integration', () => {
  it('renders all four real chart components without errors', () => {
    const { container } = render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard {...props} />
      </div>
    );
    // Real visx-rendered SVGs should be present
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('renders empty-state hint when capabilityNodes is empty', () => {
    render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard {...props} capabilityNodes={[]} />
      </div>
    );
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });

  it('renders filter strip with hub-level + tributary chips', () => {
    render(
      <div style={{ width: 1024, height: 768 }}>
        <ProductionLineGlanceDashboard
          {...props}
          filter={{
            availableContext: {
              hubColumns: ['product'],
              tributaryGroups: [{ tributaryLabel: 'Steel', columns: ['supplier'] }],
            },
            contextValueOptions: {
              product: ['Coke 12oz'],
              supplier: ['TightCorp'],
            },
            value: {},
            onChange: vi.fn(),
          }}
        />
      </div>
    );
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('supplier')).toBeInTheDocument();
  });
});
