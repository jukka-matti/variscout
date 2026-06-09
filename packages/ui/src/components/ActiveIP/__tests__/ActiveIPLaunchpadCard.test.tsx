import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { ActiveIPLaunchpadCard } from '../ActiveIPLaunchpadCard';

const now = Date.UTC(2026, 4, 15);

function makeIP(id: string, title: string, updatedAt = now): ImprovementProject {
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

describe('ActiveIPLaunchpadCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the zero-IP start affordance', () => {
    const onStartNewIP = vi.fn();
    render(
      <ActiveIPLaunchpadCard
        projects={[]}
        activeProjectId={null}
        onSelectIP={() => {}}
        onExitIP={() => {}}
        onStartNewIP={onStartNewIP}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /new workspace/i }));
    expect(onStartNewIP).toHaveBeenCalledOnce();
  });

  it('shows the workspace identity and attached project', () => {
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('ip-1', 'Reduce rework')]}
        activeProjectId="ip-1"
        onSelectIP={() => {}}
        onExitIP={() => {}}
        onStartNewIP={() => {}}
      />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit IP/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Free roaming/i)).not.toBeInTheDocument();
  });

  it('ignores the retired active-project id and still shows the workspace project', () => {
    const onSelectIP = vi.fn();
    const onStartNewIP = vi.fn();
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('ip-1', 'Reduce rework')]}
        activeProjectId={null}
        onSelectIP={onSelectIP}
        onExitIP={() => {}}
        onStartNewIP={onStartNewIP}
      />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(screen.queryByText('Free roaming')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(onSelectIP).not.toHaveBeenCalled();
    expect(onStartNewIP).not.toHaveBeenCalled();
  });

  it('does not expose a multiple-project switcher', () => {
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('older', 'Older IP', 10), makeIP('newer', 'Newer IP', 20)]}
        activeProjectId="older"
        onSelectIP={() => {}}
        onExitIP={() => {}}
        onStartNewIP={() => {}}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId('active-ip-switcher')).not.toBeInTheDocument();
    expect(screen.getByText('Older IP')).toBeInTheDocument();
  });

  it('does not expose callbacks for Switch IP, Free roaming, Exit IP, or New IP when a workspace project exists', () => {
    const onSelectIP = vi.fn();
    const onExitIP = vi.fn();
    const onStartNewIP = vi.fn();

    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('ip-1', 'Reduce rework'), makeIP('ip-2', 'Lift Cpk')]}
        activeProjectId="ip-1"
        onSelectIP={onSelectIP}
        onExitIP={onExitIP}
        onStartNewIP={onStartNewIP}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Free roaming/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit IP/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /\+ New Improvement Project/ })
    ).not.toBeInTheDocument();
    expect(onSelectIP).not.toHaveBeenCalled();
    expect(onExitIP).not.toHaveBeenCalled();
    expect(onStartNewIP).not.toHaveBeenCalled();
  });
});
