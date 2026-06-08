import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ConnectedStepCapabilityView } from '../ConnectedStepCapabilityView';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ProcessMap } from '@variscout/core/frame';
import type { CapabilityBoxplotNode } from '@variscout/charts';
import type { NodeCapabilityResult } from '@variscout/core/stats';

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  const React = await import('react');
  return {
    ...actual,
    StepErrorPareto: ({ steps }: { steps: Array<{ nodeId: string; label: string }> }) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-step-error-pareto' },
        steps.map(step => step.label).join(',')
      ),
  };
});

function mapWithBranch(): ProcessMap {
  return {
    version: 1,
    nodes: [
      { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Mix_Temp' },
      { id: 'fill', name: 'Fill', order: 1, ctqColumn: 'Fill_Weight' },
      { id: 'seal', name: 'Seal', order: 2, ctqColumn: 'Seal_Time' },
    ],
    tributaries: [{ id: 'shift', stepId: 'fill', column: 'Shift', role: 'time' }],
    arrows: [{ id: 'mix-fill', fromStepId: 'mix', toStepId: 'fill' }],
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z',
  };
}

function card(stepId: string, values: number[], specs = { lsl: 0, usl: 10 }): CanvasStepCardModel {
  return {
    stepId,
    stepName: stepId,
    assignedColumns: [],
    metricColumn: `${stepId}_measure`,
    metricKind: 'numeric',
    values,
    distribution: [],
    specs,
    capability: { state: 'graded', n: values.length, cpk: 1.2, target: 1.33, canAddSpecs: false },
  };
}

function capabilityNode(nodeId: string, cpks: number[], targetCpk = 1.33): CapabilityBoxplotNode {
  const result: NodeCapabilityResult = {
    nodeId,
    n: cpks.length * 10,
    sampleConfidence: 'trust',
    source: 'column',
    perContextResults: cpks.map((cpk, index) => ({
      contextTuple: { shift: String(index) },
      cpk,
      n: 10,
      sampleConfidence: 'trust',
    })),
  };
  return { nodeId, label: nodeId, targetCpk, result };
}

function renderView() {
  return render(
    <ConnectedStepCapabilityView
      map={mapWithBranch()}
      stepCards={[card('mix', [1, 2, 3]), card('fill', [4, 5, 8]), card('seal', [2, 4, 6])]}
      capabilityNodes={[
        capabilityNode('mix', [1.5, 1.4]),
        capabilityNode('fill', [0.8, 0.9]),
        capabilityNode('seal', [1.7, 1.6]),
      ]}
      errorSteps={[
        { nodeId: 'fill', label: 'Fill', errorCount: 8 },
        { nodeId: 'mix', label: 'Mix', errorCount: 2 },
      ]}
    />
  );
}

describe('ConnectedStepCapabilityView', () => {
  it('renders Values and Capability controls and toggles aria-pressed state', () => {
    renderView();
    expect(screen.getByRole('button', { name: 'Capability' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Values' }));
    expect(screen.getByRole('button', { name: 'Values' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Capability' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('renders the same ordered step ids in the flow rail and box strip', () => {
    renderView();
    const railIds = within(screen.getByTestId('connected-step-flow-rail'))
      .getAllByTestId(/connected-step-node-/)
      .map(node => node.getAttribute('data-step-id'));
    const boxIds = within(screen.getByTestId('connected-step-box-strip'))
      .getAllByTestId(/connected-step-box-/)
      .map(node => node.getAttribute('data-step-id'));
    expect(railIds).toEqual(['mix', 'fill', 'seal']);
    expect(boxIds).toEqual(['mix', 'fill', 'seal']);
  });

  it('coordinates highlight between a node and its box', () => {
    renderView();
    fireEvent.mouseEnter(screen.getByTestId('connected-step-node-fill'));
    expect(screen.getByTestId('connected-step-node-fill')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('connected-step-box-fill')).toHaveAttribute('data-active', 'true');
  });

  it('renders capability mode as a boxplot with median and target markers', () => {
    renderView();
    expect(screen.getByTestId('connected-step-whisker-fill')).toBeInTheDocument();
    expect(screen.getByTestId('connected-step-iqr-fill')).toBeInTheDocument();
    expect(screen.getByTestId('connected-step-median-fill')).toBeInTheDocument();
    expect(screen.getByTestId('connected-step-target-fill')).toBeInTheDocument();
  });

  it('marks branching maps as linked views and keeps the step error Pareto', () => {
    renderView();
    expect(screen.getByTestId('connected-step-branching-note')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-error-pareto')).toHaveTextContent('Fill,Mix');
  });

  it('does not render ranking language', () => {
    renderView();
    expect(screen.queryByText(/rank/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/worst/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
  });
});
