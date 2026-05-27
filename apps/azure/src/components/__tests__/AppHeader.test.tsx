import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../AppHeader';

describe('AppHeader active IP chip', () => {
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
});
