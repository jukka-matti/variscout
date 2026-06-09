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
    render(<ActiveIPLaunchpadCard projects={[]} onStartNewIP={onStartNewIP} />);

    fireEvent.click(screen.getByRole('button', { name: /new workspace/i }));
    expect(onStartNewIP).toHaveBeenCalledOnce();
  });

  it('shows the workspace identity and attached project', () => {
    render(
      <ActiveIPLaunchpadCard projects={[makeIP('ip-1', 'Reduce rework')]} onStartNewIP={() => {}} />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit IP/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Free roaming/i)).not.toBeInTheDocument();
  });

  it('shows the workspace project without a focus selector', () => {
    const onStartNewIP = vi.fn();
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('ip-1', 'Reduce rework')]}
        onStartNewIP={onStartNewIP}
      />
    );

    expect(screen.getByText('Reduce rework')).toBeInTheDocument();
    expect(onStartNewIP).not.toHaveBeenCalled();
  });

  it('does not expose a multiple-project switcher', () => {
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('older', 'Older IP', 10), makeIP('newer', 'Newer IP', 20)]}
        onStartNewIP={() => {}}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId('active-ip-switcher')).not.toBeInTheDocument();
    expect(screen.getByText('Newer IP')).toBeInTheDocument();
  });

  it('does not expose callbacks for retired focus controls when a workspace project exists', () => {
    const onStartNewIP = vi.fn();

    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('ip-1', 'Reduce rework'), makeIP('ip-2', 'Lift Cpk')]}
        onStartNewIP={onStartNewIP}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Free roaming/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exit IP/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /\+ New Improvement Project/ })
    ).not.toBeInTheDocument();
    expect(onStartNewIP).not.toHaveBeenCalled();
  });
});
