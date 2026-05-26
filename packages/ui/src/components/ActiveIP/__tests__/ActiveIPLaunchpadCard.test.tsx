import { fireEvent, render, screen, within } from '@testing-library/react';
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
    sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
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

    fireEvent.click(screen.getByRole('button', { name: '+ Start your first Improvement Project' }));
    expect(onStartNewIP).toHaveBeenCalledOnce();
  });

  it('shows the active working project', () => {
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
    expect(screen.getAllByText(/Day 1/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Switch IP/ })).not.toBeInTheDocument();
  });

  it('keeps free-roaming visible when projects exist but no active IP is selected', () => {
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

    expect(screen.getByText('Free roaming')).toBeInTheDocument();
    expect(screen.queryByText('Reduce rework')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Switch IP/ }));
    fireEvent.click(screen.getByRole('button', { name: /Reduce rework/ }));
    expect(onSelectIP).toHaveBeenCalledWith('ip-1');

    fireEvent.click(screen.getByRole('button', { name: '+ New Improvement Project' }));
    expect(onStartNewIP).toHaveBeenCalledOnce();
  });

  it('opens a multiple-IP switch dropdown with sorted choices', () => {
    render(
      <ActiveIPLaunchpadCard
        projects={[makeIP('older', 'Older IP', 10), makeIP('newer', 'Newer IP', 20)]}
        activeProjectId="older"
        onSelectIP={() => {}}
        onExitIP={() => {}}
        onStartNewIP={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Switch IP/ }));
    const switcher = screen.getByTestId('active-ip-switcher');
    const items = within(switcher).getAllByRole('button');

    expect(items[0]).toHaveTextContent('Newer IP');
    expect(items[1]).toHaveTextContent('Older IP');
    expect(within(switcher).getByRole('button', { name: 'Free roaming' })).toBeInTheDocument();
    expect(
      within(switcher).getByRole('button', { name: '+ New Improvement Project' })
    ).toBeInTheDocument();
  });

  it('calls callbacks for Switch IP, Free roaming, Exit IP, and New IP', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /Switch IP/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lift Cpk/ }));
    expect(onSelectIP).toHaveBeenCalledWith('ip-2');

    fireEvent.click(screen.getByRole('button', { name: /Switch IP/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Free roaming' }));
    expect(onExitIP).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /Switch IP/ }));
    fireEvent.click(screen.getByRole('button', { name: '+ New Improvement Project' }));
    expect(onStartNewIP).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Exit IP' }));
    expect(onExitIP).toHaveBeenCalledTimes(2);
  });
});
