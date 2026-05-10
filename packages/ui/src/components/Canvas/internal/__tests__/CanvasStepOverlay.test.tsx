import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ActionItem, WorkflowReadinessSignals } from '@variscout/core';
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

const emptySignals: WorkflowReadinessSignals = {
  hasIntervention: false,
  sustainmentConfirmed: false,
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
    <CanvasStepOverlay
      card={baseCard}
      onClose={() => undefined}
      signals={emptySignals}
      actionItems={[]}
      onQuickAction={() => undefined}
      onFocusedInvestigation={() => undefined}
      onCharter={() => undefined}
      onSustainment={() => undefined}
      onHandoff={() => undefined}
      {...overrides}
    />
  );
}

describe('CanvasStepOverlay — response-path CTA rendering', () => {
  it('renders all five CTAs when handlers wired and prerequisites met', () => {
    renderOverlay({
      signals: { hasIntervention: true, sustainmentConfirmed: true },
    });
    for (const path of [
      'quick-action',
      'focused-investigation',
      'charter',
      'sustainment',
      'handoff',
    ]) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
      expect(cta).not.toBeDisabled();
    }
  });

  it('renders quick-action and focused-investigation as active even when other paths have unmet prerequisites', () => {
    renderOverlay(); // emptySignals
    for (const path of ['quick-action', 'focused-investigation']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
      expect(cta).not.toBeDisabled();
    }
  });

  it('renders Improvement Project as active regardless of signals (DMAIC Define-phase, no prerequisite)', () => {
    renderOverlay(); // emptySignals
    const cta = screen.getByTestId('canvas-cta-charter');
    expect(cta).toHaveTextContent('Improvement Project');
    expect(cta).toHaveAttribute('data-cta-state', 'active');
    expect(cta).not.toBeDisabled();
  });

  it('renders Sustainment as prerequisite-locked when no intervention exists', () => {
    renderOverlay();
    const cta = screen.getByTestId('canvas-cta-sustainment');
    expect(cta).toHaveAttribute('data-cta-state', 'prerequisite-locked');
    expect(cta).toHaveAttribute('data-cta-reason', 'no-intervention');
    expect(cta).toBeDisabled();
    expect(cta.getAttribute('title')).toMatch(/process change to monitor/i);
  });

  it('renders Handoff as prerequisite-locked when sustainment not confirmed', () => {
    renderOverlay({ signals: { hasIntervention: true, sustainmentConfirmed: false } });
    const cta = screen.getByTestId('canvas-cta-handoff');
    expect(cta).toHaveAttribute('data-cta-state', 'prerequisite-locked');
    expect(cta).toHaveAttribute('data-cta-reason', 'no-sustainment-confirmed');
    expect(cta).toBeDisabled();
    expect(cta.getAttribute('title')).toMatch(/sustainment monitoring confirms gains/i);
  });

  it('hides any CTA whose handler is not wired', () => {
    renderOverlay({
      signals: { hasIntervention: true, sustainmentConfirmed: true },
      onCharter: undefined,
      onSustainment: undefined,
      onHandoff: undefined,
    });
    expect(screen.queryByTestId('canvas-cta-charter')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-sustainment')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-handoff')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-quick-action')).not.toBeNull();
    expect(screen.queryByTestId('canvas-cta-focused-investigation')).not.toBeNull();
  });

  it('isDemo bypasses sustainment + handoff prerequisites', () => {
    renderOverlay({ signals: { ...emptySignals, isDemo: true } });
    for (const path of ['sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
    }
  });

  it('clicking an active CTA invokes its handler with the step id', () => {
    const onCharter = vi.fn();
    renderOverlay({ onCharter });
    const cta = screen.getByTestId('canvas-cta-charter');
    cta.click();
    expect(onCharter).toHaveBeenCalledWith('step-1');
  });

  it('opens LogActionModal from Quick action and submits payload with the step id', () => {
    const onLogQuickAction = vi.fn();
    renderOverlay({ onQuickAction: undefined, onLogQuickAction });

    fireEvent.click(screen.getByTestId('canvas-cta-quick-action'));
    expect(screen.getByRole('dialog', { name: 'Log action — Bake step' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('What'), {
      target: { value: 'Refill buffer tank' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLogQuickAction).toHaveBeenCalledWith('step-1', {
      text: 'Refill buffer tank',
      status: 'done',
    });
  });

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

  it('renders linked context badge counts above the response-path CTAs', () => {
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

    const quickActionCta = screen.getByTestId('canvas-cta-quick-action');
    expect(
      improvementBadge.compareDocumentPosition(quickActionCta) & Node.DOCUMENT_POSITION_FOLLOWING
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
    questions: [],
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
