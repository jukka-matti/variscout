import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../AppHeader';
import { usePanelsStore } from '../../features/panels/panelsStore';

describe('AppHeader active IP chip', () => {
  beforeEach(() => {
    usePanelsStore.setState(usePanelsStore.getInitialState());
  });

  it('renders active IP chip and wires title/exit actions', () => {
    const onOpenActiveIP = vi.fn();
    const onExitActiveIP = vi.fn();

    render(
      <AppHeader
        mode="project"
        hasData={true}
        projectName="Analysis"
        rowCount={10}
        activeView="explore"
        activeIPTitle="Heads 5-8 Cpk shortfall"
        onOpenActiveIP={onOpenActiveIP}
        onExitActiveIP={onExitActiveIP}
      />
    );

    expect(screen.getByTestId('ip-context-chip')).toHaveTextContent(
      '◆ Working in IP: Heads 5-8 Cpk shortfall · Exit IP'
    );
    fireEvent.click(screen.getByRole('button', { name: /Open IP Heads 5-8 Cpk shortfall/i }));
    expect(onOpenActiveIP).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Exit IP' }));
    expect(onExitActiveIP).toHaveBeenCalledOnce();
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

    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual([
      'Home',
      'Project',
      'Process',
      'Explore',
      'Analyze',
      'Improve',
      'Report',
    ]);
    expect(screen.getByTestId('view-toggle-explore')).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByTestId('view-toggle-process'));
    expect(usePanelsStore.getState().activeView).toBe('frame');

    fireEvent.click(screen.getByTestId('view-toggle-home'));
    expect(usePanelsStore.getState().activeView).toBe('dashboard');

    fireEvent.click(screen.getByTestId('view-toggle-analyze'));
    expect(usePanelsStore.getState().activeView).toBe('analyze');

    fireEvent.click(screen.getByTestId('view-toggle-project'));
    expect(usePanelsStore.getState().activeView).toBe('projects');
  });
});
