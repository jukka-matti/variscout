import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoScoutRightDrawer } from '../CoScoutRightDrawer';

describe('CoScoutRightDrawer', () => {
  it('renders a slim handle when closed', () => {
    const onOpenChange = vi.fn();

    render(
      <CoScoutRightDrawer
        isOpen={false}
        onOpenChange={onOpenChange}
        selectedObject={{ kind: 'cause', id: 'h1', label: 'Line 2 nozzle wear' }}
      >
        <div data-testid="coach-content" />
      </CoScoutRightDrawer>
    );

    expect(screen.getByTestId('coscout-drawer-handle')).toHaveTextContent('CoScout');
    expect(screen.queryByTestId('coscout-right-drawer')).toBeNull();

    fireEvent.click(screen.getByTestId('coscout-drawer-handle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows object-scoped header, tabs, and coach content when open', () => {
    render(
      <CoScoutRightDrawer
        isOpen={true}
        onOpenChange={vi.fn()}
        selectedObject={{ kind: 'finding', id: 'f1', label: 'Temperature spike on night shift' }}
      >
        <div data-testid="coach-content">Existing CoScout panel</div>
      </CoScoutRightDrawer>
    );

    expect(screen.getByTestId('coscout-right-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('coscout-drawer-title')).toHaveTextContent('CoScout');
    expect(screen.getByTestId('coscout-drawer-object')).toHaveTextContent(
      'Temperature spike on night shift'
    );
    expect(screen.getByRole('tab', { name: 'Coach' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByTestId('coach-content')).toBeInTheDocument();
  });

  it('reserves a drawer-level REF activation hook', () => {
    const onRefActivate = vi.fn();

    render(
      <CoScoutRightDrawer
        isOpen={true}
        onOpenChange={vi.fn()}
        selectedObject={{ kind: 'finding', id: 'f1', label: 'Temperature spike' }}
        refTarget={{ targetType: 'finding', targetId: 'f1' }}
        onRefActivate={onRefActivate}
      >
        <div data-testid="coach-content" />
      </CoScoutRightDrawer>
    );

    fireEvent.click(screen.getByTestId('coscout-ref-hook'));
    expect(onRefActivate).toHaveBeenCalledWith('finding', 'f1');
  });
});
