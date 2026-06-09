import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../AppHeader';
import { usePanelsStore } from '../../features/panels/panelsStore';

describe('AppHeader Workspace Project chip', () => {
  beforeEach(() => {
    usePanelsStore.setState(usePanelsStore.getInitialState());
  });

  it('renders Workspace Project chip and wires the title action', () => {
    const onOpenWorkspaceProject = vi.fn();

    render(
      <AppHeader
        mode="project"
        hasData={true}
        projectName="Analysis"
        rowCount={10}
        activeView="explore"
        workspaceProjectTitle="Heads 5-8 Cpk shortfall"
        onOpenWorkspaceProject={onOpenWorkspaceProject}
      />
    );

    expect(screen.getByTestId('workspace-project-chip')).toHaveTextContent(
      '◆ Workspace Project: Heads 5-8 Cpk shortfall'
    );
    fireEvent.click(screen.getByRole('button', { name: /Open Project Heads 5-8 Cpk shortfall/i }));
    expect(onOpenWorkspaceProject).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Exit Workspace' })).not.toBeInTheDocument();
  });

  it('renders the shared workflow tabs and routes clicks through the panel store', () => {
    render(
      <AppHeader
        mode="project"
        hasData={true}
        projectName="Analysis"
        rowCount={10}
        activeView="explore"
      />
    );

    expect(screen.getByTestId('workflow-nav')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual([
      'Home',
      'Project',
      'Process',
      'Explore',
      'Analyze',
      'Improve',
      'Report',
    ]);
    expect(screen.getByTestId('workflow-tab-explore')).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByTestId('workflow-tab-process'));
    expect(usePanelsStore.getState().activeView).toBe('frame');

    fireEvent.click(screen.getByTestId('workflow-tab-home'));
    expect(usePanelsStore.getState().activeView).toBe('home');

    fireEvent.click(screen.getByTestId('workflow-tab-analyze'));
    expect(usePanelsStore.getState().activeView).toBe('analyze');

    fireEvent.click(screen.getByTestId('workflow-tab-project'));
    expect(usePanelsStore.getState().activeView).toBe('projects');
  });

  it('shows Save As in the project menu and invokes the fork action', () => {
    const onSaveAs = vi.fn();

    render(
      <AppHeader
        mode="project"
        hasData={true}
        projectName="Analysis"
        rowCount={10}
        activeView="explore"
        onSaveAs={onSaveAs}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /project menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /save as/i }));

    expect(onSaveAs).toHaveBeenCalledOnce();
  });
});
