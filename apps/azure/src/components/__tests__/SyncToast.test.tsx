import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncToastContainer } from '../SyncToast';
import type { SyncNotification } from '../../services/storage';

describe('SyncToastContainer', () => {
  const onDismiss = vi.fn();

  it('renders nothing when no notifications', () => {
    const { container } = render(<SyncToastContainer notifications={[]} onDismiss={onDismiss} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders success notification', () => {
    const notifications: SyncNotification[] = [
      { id: '1', type: 'success', message: 'Saved to cloud', dismissAfter: 3000 },
    ];

    render(<SyncToastContainer notifications={notifications} onDismiss={onDismiss} />);

    expect(screen.getByText('Saved to cloud')).toBeInTheDocument();
  });

  it('renders error notification with action button', () => {
    const actionFn = vi.fn();
    const notifications: SyncNotification[] = [
      {
        id: '2',
        type: 'error',
        message: 'Session expired.',
        action: { label: 'Sign in', onClick: actionFn },
      },
    ];

    render(<SyncToastContainer notifications={notifications} onDismiss={onDismiss} />);

    expect(screen.getByText('Session expired.')).toBeInTheDocument();
    const actionBtn = screen.getByText('Sign in');
    expect(actionBtn).toBeInTheDocument();

    fireEvent.click(actionBtn);
    expect(actionFn).toHaveBeenCalled();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const notifications: SyncNotification[] = [{ id: '3', type: 'info', message: 'Offline mode' }];

    render(<SyncToastContainer notifications={notifications} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith('3');
  });

  it('renders multiple notifications', () => {
    const notifications: SyncNotification[] = [
      { id: 'a', type: 'success', message: 'First' },
      { id: 'b', type: 'warning', message: 'Second' },
      { id: 'c', type: 'error', message: 'Third' },
    ];

    render(<SyncToastContainer notifications={notifications} onDismiss={onDismiss} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('has accessible role and aria-live attributes', () => {
    const notifications: SyncNotification[] = [
      { id: '4', type: 'info', message: 'Test accessibility' },
    ];

    render(<SyncToastContainer notifications={notifications} onDismiss={onDismiss} />);

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
