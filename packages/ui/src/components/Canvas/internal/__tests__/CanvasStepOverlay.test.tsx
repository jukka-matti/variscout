import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ActionItem } from '@variscout/core';
import { CanvasStepOverlay } from '../CanvasStepOverlay';

const baseCard: CanvasStepCardModel = {
  stepId: 'step-1',
  stepName: 'Bake step',
  metricKind: 'numeric',
  metricColumn: 'Bake_Time',
  assignedColumns: ['Bake_Time'],
  values: [],
  capability: { state: 'no-specs', n: 12, canAddSpecs: true },
  distribution: [],
  defectCount: undefined,
  stats: {
    mean: 1.0,
    median: 1.0,
    stdDev: 0.1,
    sigmaWithin: 0.1,
    mrBar: 0.1,
    ucl: 1.3,
    lcl: 0.7,
    outOfSpecPercentage: 0,
  },
};

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: overrides.id ?? 'action-1',
    text: overrides.text ?? 'Check oven gasket seating',
    stepId: overrides.stepId ?? 'step-1',
    parentImprovementProjectId: null,
    parentImprovementIdeaId: null,
    assignedTo: null,
    dueAt: null,
    status: 'open',
    doneAt: null,
    doneBy: null,
    createdBy: { displayName: 'Local browser' },
    createdAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

function renderOverlay(overrides: Partial<React.ComponentProps<typeof CanvasStepOverlay>> = {}) {
  return render(
    <CanvasStepOverlay card={baseCard} onClose={() => undefined} actionItems={[]} {...overrides} />
  );
}

describe('CanvasStepOverlay — recent activity', () => {
  it('renders selected-step orphan quick actions in Recent activity after expanding', () => {
    renderOverlay({
      actionItems: [
        makeAction({ id: 'action-1', text: 'Check oven gasket seating' }),
        makeAction({ id: 'action-other-step', stepId: 'step-2', text: 'Wrong step action' }),
        makeAction({
          id: 'action-linked',
          text: 'Linked project action',
          parentImprovementProjectId: 'project-1',
        }),
      ],
    });

    const summary = screen.getByText('Recent activity');
    const details = summary.closest('details');
    expect(details).not.toHaveAttribute('open');

    fireEvent.click(summary);

    expect(screen.getByRole('button', { name: /check oven gasket seating\s*open/i })).toBeVisible();
    expect(screen.queryByText('Wrong step action')).toBeNull();
    expect(screen.queryByText('Linked project action')).toBeNull();
  });

  it('renders linked context badge counts above the recent-activity panel', () => {
    const { container } = renderOverlay({
      contextLinkGroups: [
        {
          surfaceType: 'improvement-projects',
          items: [{ id: 'improve-1', label: 'Reduce rework' }],
        },
        {
          surfaceType: 'wall-threads',
          items: [
            { id: 'thread-1', label: 'Containment thread' },
            { id: 'thread-2', label: 'Root cause thread' },
          ],
        },
      ],
      onNavigateContextLink: vi.fn(),
    });

    const improvementBadge = screen.getByRole('button', {
      name: 'Improvement projects: 1 linked item',
    });
    expect(screen.getByRole('button', { name: 'Wall threads: 2 linked items' })).toBeTruthy();

    const recentActivity = screen.getByText('Recent activity');
    expect(
      improvementBadge.compareDocumentPosition(recentActivity) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(container.querySelector('[data-testid="canvas-step-overlay"]')).toContainElement(
      improvementBadge
    );
  });

  it('navigates when clicking a single linked context badge', () => {
    const onNavigateContextLink = vi.fn();
    const linkedItem = { id: 'improve-1', label: 'Reduce rework', href: '/improve/1' };
    renderOverlay({
      contextLinkGroups: [{ surfaceType: 'improvement-projects', items: [linkedItem] }],
      onNavigateContextLink,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Improvement projects: 1 linked item' }));

    expect(onNavigateContextLink).toHaveBeenCalledTimes(1);
    expect(onNavigateContextLink).toHaveBeenCalledWith(linkedItem);
  });
});

describe('CanvasStepOverlay causal link removal', () => {
  const overlay = {
    stepId: 'step-1',
    findings: [],
    hypotheses: [],
    causalLinks: [
      {
        id: 'link-1',
        fromStepId: 'step-1',
        toStepId: 'step-2',
        label: 'A drives B',
        questionId: undefined,
        focus: { kind: 'causal-link' as const, id: 'link-1' },
      },
    ],
    investigationCounts: { open: 0, supported: 0, refuted: 0 },
  };

  it('renders a Remove button per causal link', () => {
    renderOverlay({ investigationOverlay: overlay, onRemoveCausalLink: vi.fn() });

    expect(
      screen.getByRole('button', { name: /remove hypothesis A drives B/i })
    ).toBeInTheDocument();
  });

  it('clicking Remove calls onRemoveCausalLink with the link id', () => {
    const onRemoveCausalLink = vi.fn();
    renderOverlay({ investigationOverlay: overlay, onRemoveCausalLink });

    fireEvent.click(screen.getByRole('button', { name: /remove hypothesis/i }));

    expect(onRemoveCausalLink).toHaveBeenCalledWith('link-1');
  });

  it('clicking Remove does not open the investigation focus', () => {
    const onOpenInvestigationFocus = vi.fn();
    const onRemoveCausalLink = vi.fn();
    renderOverlay({ investigationOverlay: overlay, onOpenInvestigationFocus, onRemoveCausalLink });

    fireEvent.click(screen.getByRole('button', { name: /remove hypothesis/i }));

    expect(onRemoveCausalLink).toHaveBeenCalledOnce();
    expect(onOpenInvestigationFocus).not.toHaveBeenCalled();
  });
});
