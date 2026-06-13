import { describe, it, expect, vi } from 'vitest';

// vi.mock BEFORE component imports per testing.md rule.
vi.mock('../../../components/ImprovementPlan/ImprovementWorkspaceBase', () => ({
  ImprovementWorkspaceBase: () => (
    <div data-testid="improvement-workspace-base">ImprovementWorkspaceBase</div>
  ),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import { ImproveTabRoot } from '../ImproveTabRoot';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProjectContributor } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: {
    title: 'Test IP',
    contributors: [
      {
        id: 'pm-1',
        createdAt: 1,
        deletedAt: null,
        userId: 'lead@org',
        displayName: 'Lead',
      } satisfies ProjectContributor,
    ],
  },
  goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 }] },
  sections: { background: {}, approach: {}, outcomeReference: {} },
};

const actions: ActionItem[] = [];

describe('ImproveTabRoot', () => {
  it('renders Workspace guidance when workspaceProject is null', () => {
    render(
      <ImproveTabRoot
        workspaceProject={null}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={() => {}}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /workspace unavailable/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /actions/i })).not.toBeInTheDocument();
  });

  it('renders ImproveStage scoped to workspaceProject when set', () => {
    render(
      <ImproveTabRoot
        workspaceProject={ip}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={() => {}}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /workspace unavailable/i })
    ).not.toBeInTheDocument();
  });

  it('passes onGoHome from NoActiveProjectGuidance through correctly', () => {
    const onGoHome = vi.fn();
    render(
      <ImproveTabRoot
        workspaceProject={null}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={onGoHome}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
