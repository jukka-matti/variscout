import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityBoxplotBase } from '../CapabilityBoxplot';
import type { CapabilityBoxplotNode } from '../types';
import type { NodeCapabilityResult } from '@variscout/core/stats';

function makeNode(opts: {
  nodeId: string;
  label: string;
  cpks: number[];
  totalN: number;
  confidence?: 'trust' | 'review' | 'insufficient';
  targetCpk?: number;
}): CapabilityBoxplotNode {
  const { nodeId, label, cpks, totalN, confidence = 'trust', targetCpk } = opts;
  const result: NodeCapabilityResult = {
    nodeId,
    cpk: cpks.length ? cpks.reduce((a, b) => a + b, 0) / cpks.length : undefined,
    cp: undefined,
    n: totalN,
    sampleConfidence: confidence,
    source: 'column',
    perContextResults: cpks.map((cpk, i) => ({
      contextTuple: { product: `P${i}` },
      cpk,
      cp: undefined,
      n: Math.floor(totalN / Math.max(cpks.length, 1)),
      sampleConfidence: confidence,
    })),
  };
  return { nodeId, label, targetCpk, result };
}

describe('CapabilityBoxplotBase', () => {
  it('renders one X-axis category per node', () => {
    const nodes: CapabilityBoxplotNode[] = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.1, 1.3, 1.5, 1.0, 1.4, 1.2, 1.6],
        totalN: 700,
      }),
      makeNode({
        nodeId: 'n2',
        label: 'Fill',
        cpks: [0.9, 1.0, 1.1, 1.2, 0.8, 1.3, 1.0],
        totalN: 700,
      }),
      makeNode({
        nodeId: 'n3',
        label: 'Cap',
        cpks: [1.4, 1.6, 1.5, 1.7, 1.3, 1.6, 1.5],
        totalN: 700,
      }),
    ];
    render(<CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={nodes} />);
    // visx renders a hidden text-measurement element alongside tick labels;
    // use getAllByText and assert at least one match per label.
    expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fill').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cap').length).toBeGreaterThan(0);
  });

  it('uses default "Cpk" Y-axis label', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'A',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
      }),
    ];
    render(<CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />);
    expect(screen.getByText('Cpk')).toBeInTheDocument();
  });

  it('renders a target tick for nodes with targetCpk set', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        targetCpk: 1.33,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeTruthy();
  });

  it('omits target tick for nodes without targetCpk', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeFalsy();
  });

  it('hides all target ticks when hideTargetTicks=true', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Mix',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        targetCpk: 1.33,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} hideTargetTicks />
    );
    expect(container.querySelector('[data-testid="target-tick-n1"]')).toBeFalsy();
  });

  it('shows a sample-confidence badge on boxes with confidence != trust', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Trust',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
        confidence: 'trust',
      }),
      makeNode({
        nodeId: 'n2',
        label: 'Review',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 25,
        confidence: 'review',
      }),
      makeNode({
        nodeId: 'n3',
        label: 'Insufficient',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 8,
        confidence: 'insufficient',
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="confidence-badge-n1"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="confidence-badge-n2"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="confidence-badge-n3"]')).toBeTruthy();
  });

  it('renders boxes for nodes with n>=7 distinct context Cpks', () => {
    const nodes = [
      makeNode({
        nodeId: 'n1',
        label: 'Boxed',
        cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
        totalN: 700,
      }),
    ];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    expect(container.querySelector('[data-testid="boxplot-box-Boxed"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="dot-fallback-Boxed-0"]')).toBeFalsy();
  });

  it('falls back to dot plot for nodes with fewer than 7 context Cpks', () => {
    const nodes = [makeNode({ nodeId: 'n1', label: 'Sparse', cpks: [1.0, 1.2, 1.4], totalN: 300 })];
    const { container } = render(
      <CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={nodes} />
    );
    // Dots present, no box rect for this category
    expect(container.querySelector('[data-testid="dot-fallback-Sparse-0"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="boxplot-box-Sparse"]')).toBeFalsy();
  });

  it('skips nodes with no usable per-context Cpks (all undefined)', () => {
    const node: CapabilityBoxplotNode = {
      nodeId: 'empty',
      label: 'Empty',
      result: {
        nodeId: 'empty',
        n: 0,
        sampleConfidence: 'insufficient',
        source: 'column',
        perContextResults: [],
      },
    };
    const filled = makeNode({
      nodeId: 'n1',
      label: 'Fill',
      cpks: [1.0, 1.1, 1.2, 1.0, 1.1, 1.2, 1.3],
      totalN: 700,
    });
    render(<CapabilityBoxplotBase parentWidth={800} parentHeight={400} nodes={[node, filled]} />);
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });

  it('renders empty gracefully with zero nodes (no throw)', () => {
    expect(() => {
      render(<CapabilityBoxplotBase parentWidth={600} parentHeight={300} nodes={[]} />);
    }).not.toThrow();
  });
});
