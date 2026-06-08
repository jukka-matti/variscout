vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { HypothesisCardWithPlans, type TestPlanFactorView } from '../HypothesisCardWithPlans';

const NOW = Date.UTC(2026, 5, 8, 12, 0, 0);
const UPDATED = Date.UTC(2026, 5, 1, 12, 0, 0);

const member: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Matti Lead',
  role: 'lead',
  invitedAt: UPDATED,
  createdAt: UPDATED,
  deletedAt: null,
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Night shift staffing gap drives late starts',
  synthesis: '',
  findingIds: [],
  status: 'needs-disconfirmation',
  createdAt: UPDATED,
  updatedAt: UPDATED,
  deletedAt: null,
};

function plan(overrides: Partial<MeasurementPlan> = {}): MeasurementPlan {
  return {
    id: 'mp1',
    hypothesisId: 'h1',
    outcome: 'CycleTime',
    primaryFactor: 'Shift',
    neededFactors: [],
    method: 'gemba-walk',
    sampleSize: 12,
    owner: 'm1',
    status: 'planned',
    scope: [],
    processLocation: '',
    linkedFindingIds: [],
    dueDate: '2026-06-30',
    createdAt: UPDATED,
    deletedAt: null,
    ...overrides,
  };
}

function renderInSvg(
  overrides: Partial<React.ComponentProps<typeof HypothesisCardWithPlans>> = {}
) {
  return render(
    <svg>
      <HypothesisCardWithPlans
        hub={hub}
        displayStatus={hub.status}
        x={0}
        y={0}
        plans={[]}
        members={[member]}
        currentUserId="user-lead"
        findings={[]}
        onAddPlan={vi.fn()}
        onLinkFinding={vi.fn()}
        onEditPlan={vi.fn()}
        activityNow={NOW}
        {...overrides}
      />
    </svg>
  );
}

describe('HypothesisCardWithPlans activity layer', () => {
  it('renders planned and in-progress plans in an in-flight activity section with owner and due date', () => {
    renderInSvg({
      plans: [plan({ status: 'planned' }), plan({ id: 'mp2', status: 'in-progress' })],
    });

    const section = screen.getByTestId('activity-in-flight');
    expect(within(section).getByText(/In flight/i)).toBeInTheDocument();
    expect(within(section).getAllByText(/Matti Lead/i).length).toBeGreaterThan(0);
    expect(section.textContent).toMatch(/2026-06-30/);
    expect(section.textContent).toMatch(/gemba-walk/);
  });

  it('does not count complete or skipped plans as in-flight activity', () => {
    renderInSvg({ plans: [plan({ status: 'complete' }), plan({ id: 'mp2', status: 'skipped' })] });

    expect(screen.queryByTestId('activity-in-flight')).toBeNull();
    expect(screen.queryByTestId('data-collection-task')).toBeNull();
  });

  it('renders pending disconfirmation attempts as in-flight break attempts', () => {
    renderInSvg({
      hub: {
        ...hub,
        disconfirmationAttempts: [
          {
            id: 'da1',
            attemptedAt: new Date(UPDATED).toISOString(),
            attemptedBy: { userId: 'user-lead', displayName: 'Matti Lead' },
            description: 'Check whether Shift still explains CycleTime',
            verdict: 'pending',
            linkedFindingIds: [],
          },
        ],
      },
    });

    const section = screen.getByTestId('activity-in-flight');
    expect(section.textContent).toMatch(/break attempt/i);
    expect(section.textContent).toMatch(/Shift still explains CycleTime/i);
  });

  it('keeps run-now checks as buttons and never renders them as in-flight rows', () => {
    const testPlanFactors: TestPlanFactorView[] = [
      { factor: 'Shift', readiness: 'ready', tool: 'two-sample' },
    ];
    renderInSvg({ testPlanFactors, onEvaluateFactor: vi.fn() });

    expect(screen.getByTestId('evaluate-factor-Shift')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-in-flight')).toBeNull();
    expect(screen.queryByTestId('data-collection-task')).toBeNull();
  });
});

describe('HypothesisCardWithPlans stalled activity state', () => {
  it('renders amber stalled state with the three escape actions for a quiet unsettled cause', () => {
    renderInSvg({ plans: [], testPlanFactors: [] });

    const stalled = screen.getByTestId('activity-stalled');
    expect(stalled.textContent).toMatch(/Nothing in flight/i);
    expect(stalled.textContent).toMatch(/5 working days/i);
    expect(within(stalled).getByRole('button', { name: /Plan a check/i })).toBeInTheDocument();
    expect(within(stalled).getByRole('button', { name: /Go look/i })).toBeInTheDocument();
    expect(within(stalled).getByRole('button', { name: /Rule it out/i })).toBeInTheDocument();
  });

  it('Plan a check opens AddPlanForm, Go look calls onGoLook, and Rule it out sets refuted', () => {
    const onGoLook = vi.fn();
    const onSetStatus = vi.fn();
    renderInSvg({ plans: [], testPlanFactors: [], onGoLook, onSetStatus });

    fireEvent.click(screen.getByRole('button', { name: /Plan a check/i }));
    expect(screen.getByLabelText('Primary factor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Go look/i }));
    expect(onGoLook).toHaveBeenCalledWith('h1');

    fireEvent.click(screen.getByRole('button', { name: /Rule it out/i }));
    expect(onSetStatus).toHaveBeenCalledWith('h1', 'refuted');
  });

  it('does not render stalled when the cause is verified or ruled out', () => {
    for (const status of ['evidence-survived-test', 'refuted'] as const) {
      const { unmount } = renderInSvg({
        hub: { ...hub, status },
        displayStatus: status,
        plans: [],
        testPlanFactors: [],
      });
      expect(screen.queryByTestId('activity-stalled')).toBeNull();
      unmount();
    }
  });

  it('does not render stalled while a ready run-now check exists', () => {
    renderInSvg({
      plans: [],
      testPlanFactors: [{ factor: 'Shift', readiness: 'ready', tool: 'two-sample' }],
      onEvaluateFactor: vi.fn(),
    });

    expect(screen.getByTestId('evaluate-factor-Shift')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-stalled')).toBeNull();
  });
});
