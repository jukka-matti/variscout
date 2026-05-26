import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessHub, SustainmentRecord } from '@variscout/core';
import IPDetailTeamRail from '../IPDetailTeamRail';

const hour = 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 15, 12, 0, 0);

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: now - 72 * hour,
    updatedAt: now - 8 * hour,
    deletedAt: null,
    status: 'active',
    metadata: {
      title: 'Fill Cpk lift',
      members: [
        {
          id: 'pm-mira',
          createdAt: now - 72 * hour,
          deletedAt: null,
          userId: 'mira@example.com',
          displayName: 'Mira Lead',
          role: 'lead',
          invitedAt: now - 72 * hour,
        },
      ],
    },
    goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', baseline: 0.8, target: 1.33 }] },
    sections: {
      background: { updatedAt: now - 7 * hour },
      investigationLineage: { hypothesisIds: ['hyp-1'], updatedAt: now - 6 * hour },
      approach: { updatedAt: now - 5 * hour },
      outcomeReference: { updatedAt: now - 4 * hour },
    },
    ...overrides,
  };
}

function makeIdea(overrides: Partial<ImprovementIdea> = {}): ImprovementIdea {
  return {
    id: 'idea-1',
    createdAt: now - 10 * hour,
    deletedAt: null,
    text: 'Add visual setup guide',
    selected: true,
    updatedAt: now - hour,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'action-1',
    createdAt: now - 9 * hour,
    deletedAt: null,
    text: 'Pilot guide',
    status: 'done',
    updatedAt: now - 30 * 60 * 1000,
    assignedTo: { displayName: 'Avery Owner' },
    ...overrides,
  };
}

function makeSustainment(overrides: Partial<SustainmentRecord> = {}): SustainmentRecord {
  return {
    id: 'sus-1',
    createdAt: now - 2 * hour,
    deletedAt: null,
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    title: 'Sustainment check',
    improvementProjectId: 'ip-1',
    consecutiveOnTargetTicks: 1,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'weekly',
    updatedAt: now - 15 * 60 * 1000,
    owner: { displayName: 'Pat Process', upn: 'pat@example.com' },
    ...overrides,
  };
}

const activeHub: ProcessHub = {
  id: 'hub-1',
  createdAt: 0,
  deletedAt: null,
  name: 'Line 4',
  processOwner: { displayName: 'Pat Process', upn: 'pat@example.com' },
};

describe('IPDetailTeamRail', () => {
  it('renders recent activity last five and opens the full activity log', () => {
    render(
      <IPDetailTeamRail
        ip={makeIP({ signoff: { requestedAt: now - 3 * hour } })}
        ideas={[makeIdea()]}
        actions={[makeAction()]}
        sustainmentRecord={makeSustainment()}
        now={now}
      />
    );

    const feed = screen.getByTestId('ip-activity-feed');
    expect(within(feed).getAllByRole('listitem')).toHaveLength(5);
    expect(feed).toHaveTextContent('Pat Process updated sustainment Sustainment check · 15m ago');
    expect(feed).toHaveTextContent('Avery Owner moved action Pilot guide to done · 30m ago');
    expect(feed).not.toHaveTextContent('System updated Background · 7h ago');

    fireEvent.click(screen.getByRole('button', { name: 'View all activity' }));
    const dialog = screen.getByRole('dialog', { name: 'Activity log' });
    expect(within(dialog).getAllByRole('listitem').length).toBeGreaterThan(5);
    expect(dialog).toHaveTextContent('System updated Background · 7h ago');
  });

  it('exposes an active Request approval button (wedge V1 single SKU)', () => {
    const onRequestSignoff = vi.fn();
    render(
      <IPDetailTeamRail ip={makeIP()} activeHub={activeHub} onRequestSignoff={onRequestSignoff} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Request approval' }));
    expect(onRequestSignoff).toHaveBeenCalledTimes(1);
  });

  it('renders pending signoff nudge and process-owner approve actions', () => {
    const onNudgeSignoff = vi.fn();
    const onApproveSignoff = vi.fn();
    render(
      <IPDetailTeamRail
        ip={makeIP({ signoff: { requestedAt: now - 48 * hour } })}
        activeHub={activeHub}
        onNudgeSignoff={onNudgeSignoff}
        onApproveSignoff={onApproveSignoff}
        now={now}
      />
    );

    expect(screen.getByText('Pat Process awaiting · 2 days ago')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nudge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onNudgeSignoff).toHaveBeenCalledTimes(1);
    expect(onApproveSignoff).toHaveBeenCalledTimes(1);
  });

  it('renders approved signoff state', () => {
    render(
      <IPDetailTeamRail
        ip={makeIP({
          signoff: {
            requestedAt: now - 5 * hour,
            approvedAt: now - hour,
            approvedBy: { displayName: 'Pat Process', upn: 'pat@example.com' },
          },
        })}
        activeHub={activeHub}
        now={now}
      />
    );

    expect(screen.getByText('Approved by Pat Process · May 15, 2026')).toBeInTheDocument();
  });
});
