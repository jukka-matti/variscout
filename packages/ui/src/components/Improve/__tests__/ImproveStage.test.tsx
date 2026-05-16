import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock BEFORE component imports per testing.md rule.
// ImprovementWorkspaceBase uses useTranslation (i18n) and lucide icons that need mocking
// to keep this test hermetic. Runtime integration verified via --chrome browser walk.
vi.mock('../../../components/ImprovementPlan/ImprovementWorkspaceBase', () => ({
  ImprovementWorkspaceBase: () => (
    <div data-testid="improvement-workspace-base">ImprovementWorkspaceBase</div>
  ),
}));

import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ImproveStage } from '../ImproveStage';
import type { ActionItem } from '@variscout/core/findings';
import type { ProjectMember } from '@variscout/core/projectMembership';

const leadMembers: ProjectMember[] = [
  {
    id: 'pm-1',
    createdAt: 1,
    deletedAt: null,
    userId: 'lead@org',
    displayName: 'Lead',
    role: 'lead',
    invitedAt: 1,
  },
];

const actions: ActionItem[] = [
  {
    id: 'ai-1',
    createdAt: 1,
    deletedAt: null,
    text: 'Run a pilot on Line 3',
    assignedTo: { displayName: 'Mira', upn: 'mira@org' },
    dueAt: '2026-06-01',
    status: 'open',
    parentImprovementProjectId: 'ip-1',
  },
  {
    id: 'ai-2',
    createdAt: 2,
    deletedAt: null,
    text: 'Document the new SOP',
    status: 'done',
    parentImprovementProjectId: 'ip-1',
  },
];

describe('ImproveStage', () => {
  it('renders the scoped ActionItem list', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={actions}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByText('Run a pilot on Line 3')).toBeInTheDocument();
    expect(screen.getByText('Document the new SOP')).toBeInTheDocument();
  });

  it('shows owner display name when present', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={actions}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByText('Mira')).toBeInTheDocument();
  });

  it('renders an Add Action affordance for users with edit-improve', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /add action/i })).toBeInTheDocument();
  });

  it('hides Add Action for users without edit-improve (Sponsor)', () => {
    const mixedMembers: ProjectMember[] = [
      ...leadMembers,
      {
        id: 'pm-2',
        createdAt: 1,
        deletedAt: null,
        userId: 'sponsor@org',
        displayName: 'Sponsor',
        role: 'sponsor',
        invitedAt: 1,
      },
    ];
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={mixedMembers}
        currentUserId="sponsor@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /add action/i })).not.toBeInTheDocument();
  });

  it('calls onActionAdd with a typed payload when Add is submitted', () => {
    const onActionAdd = vi.fn();
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={onActionAdd}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add action/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New action' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onActionAdd).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'New action', parentImprovementProjectId: 'ip-1' })
    );
  });

  it('renders an empty state when there are no actions', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByText(/no actions yet/i)).toBeInTheDocument();
  });
});

describe('ImproveStage advanced toggle', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders simple tracker by default', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
    expect(screen.queryByTestId('improvement-workspace-base')).not.toBeInTheDocument();
  });

  it('switches to Advanced workbench (ImprovementWorkspaceBase) when toggle clicked', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
    expect(screen.getByTestId('improvement-workspace-base')).toBeInTheDocument();
  });
});
