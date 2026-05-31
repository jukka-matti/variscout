import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowNav, workflowTabs, type WorkflowTabId } from './WorkflowNav';

describe('WorkflowNav', () => {
  it('exports the canonical V1 workflow tab order', () => {
    expect(workflowTabs.map(tab => tab.id)).toEqual<WorkflowTabId[]>([
      'home',
      'project',
      'process',
      'explore',
      'analyze',
      'improvement',
      'report',
    ]);
    expect(workflowTabs.map(tab => tab.label)).toEqual([
      'Home',
      'Project',
      'Process',
      'Explore',
      'Analyze',
      'Improve',
      'Report',
    ]);
  });

  it('renders stable tab test ids, active state, badges, and click callbacks', () => {
    const onTabChange = vi.fn();

    render(
      <WorkflowNav
        activeTab="analyze"
        onTabChange={onTabChange}
        badges={{ analyze: 3, improvement: 2 }}
      />
    );

    const nav = screen.getByTestId('workflow-nav');
    expect(
      within(nav)
        .getAllByRole('tab')
        .map(tab => tab.textContent)
    ).toEqual(['Home', 'Project', 'Process', 'Explore', 'Analyze3', 'Improve2', 'Report']);

    expect(screen.getByTestId('workflow-tab-analyze')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('workflow-tab-explore')).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByTestId('workflow-tab-process'));
    expect(onTabChange).toHaveBeenCalledWith('process');
  });
});
