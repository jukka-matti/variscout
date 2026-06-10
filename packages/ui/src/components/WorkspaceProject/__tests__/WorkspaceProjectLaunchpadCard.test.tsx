import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { WorkspaceProjectLaunchpadCard } from '../WorkspaceProjectLaunchpadCard';

const now = Date.UTC(2026, 4, 15);

function makeWorkspaceProject(id: string, title: string, updatedAt = now): ImprovementProject {
  return {
    id,
    hubId: 'hub-1',
    createdAt: now,
    updatedAt,
    deletedAt: null,
    status: 'active',
    metadata: { title },
    goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
    sections: { background: {}, approach: {}, outcomeReference: {} },
  };
}

describe('WorkspaceProjectLaunchpadCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the zero-workspace start affordance', () => {
    const onStartNewWorkspace = vi.fn();
    render(
      <WorkspaceProjectLaunchpadCard projects={[]} onStartNewWorkspace={onStartNewWorkspace} />
    );

    fireEvent.click(screen.getByRole('button', { name: /new workspace/i }));
    expect(onStartNewWorkspace).toHaveBeenCalledOnce();
  });

  it('shows the workspace identity and attached project', () => {
    render(
      <WorkspaceProjectLaunchpadCard
        projects={[makeWorkspaceProject('ip-1', 'Reduce rework')]}
        onStartNewWorkspace={() => {}}
      />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch Workspace/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit Workspace/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Free roaming/i)).not.toBeInTheDocument();
  });

  it('shows the workspace project without a focus selector', () => {
    const onStartNewWorkspace = vi.fn();
    render(
      <WorkspaceProjectLaunchpadCard
        projects={[makeWorkspaceProject('ip-1', 'Reduce rework')]}
        onStartNewWorkspace={onStartNewWorkspace}
      />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(onStartNewWorkspace).not.toHaveBeenCalled();
  });

  it('does not expose a multiple-project switcher', () => {
    render(
      <WorkspaceProjectLaunchpadCard
        projects={[
          makeWorkspaceProject('older', 'Older Workspace', 10),
          makeWorkspaceProject('newer', 'Newer Workspace', 20),
        ]}
        onStartNewWorkspace={() => {}}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch Workspace/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId('workspace-project-switcher')).not.toBeInTheDocument();
    expect(screen.getByText('Newer Workspace')).toBeInTheDocument();
  });

  it('does not expose callbacks for retired focus controls when a workspace project exists', () => {
    const onStartNewWorkspace = vi.fn();

    render(
      <WorkspaceProjectLaunchpadCard
        projects={[
          makeWorkspaceProject('ip-1', 'Reduce rework'),
          makeWorkspaceProject('ip-2', 'Lift Cpk'),
        ]}
        onStartNewWorkspace={onStartNewWorkspace}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch Workspace/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Free roaming/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit Workspace/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /\+ New Improvement Project/ })
    ).not.toBeInTheDocument();
    expect(onStartNewWorkspace).not.toHaveBeenCalled();
  });
});
