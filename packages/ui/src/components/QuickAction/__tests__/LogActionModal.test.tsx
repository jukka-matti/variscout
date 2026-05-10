import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LogActionModal } from '../LogActionModal';

describe('LogActionModal', () => {
  it('renders accessible dialog content for a card', () => {
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Log action — Reduce rework' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Log action — Reduce rework' })).toBeInTheDocument();
    expect(screen.getByLabelText('What')).toBeRequired();
    expect(screen.getByRole('radio', { name: 'Done now' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Assign to' })).toBeInTheDocument();
  });

  it('requires action text before submitting a done-now action', () => {
    const onLog = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={onLog} />);

    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLog).not.toHaveBeenCalled();
  });

  it('moves focus into the dialog and wraps tab focus inside it', async () => {
    render(
      <>
        <button type="button">Outside action</button>
        <LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={vi.fn()} />
      </>
    );

    const whatInput = screen.getByLabelText('What');

    await waitFor(() => expect(whatInput).toHaveFocus());

    screen.getByRole('button', { name: 'Log action' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(whatInput).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Outside action' })).not.toHaveFocus();
  });

  it('logs a done action without owner or deadline', () => {
    const onLog = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={onLog} />);

    fireEvent.change(screen.getByLabelText('What'), {
      target: { value: 'Update the control plan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLog).toHaveBeenCalledWith({
      text: 'Update the control plan',
      status: 'done',
    });
  });

  it('requires an owner in assign mode', () => {
    const onLog = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={onLog} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Assign to' }));
    fireEvent.change(screen.getByLabelText('What'), {
      target: { value: 'Check the gage setup' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLog).not.toHaveBeenCalled();
  });

  it('logs an assigned action with owner and optional due date', () => {
    const onLog = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={onLog} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Assign to' }));
    fireEvent.change(screen.getByLabelText('What'), {
      target: { value: 'Check the gage setup' },
    });
    fireEvent.change(screen.getByLabelText('Owner'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Due date'), {
      target: { value: '2026-05-14' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLog).toHaveBeenCalledWith({
      text: 'Check the gage setup',
      status: 'open',
      assignedTo: {
        displayName: 'alex@example.com',
        upn: 'alex@example.com',
      },
      dueAt: '2026-05-14',
    });
  });

  it('omits dueAt when the assigned action has no due date', () => {
    const onLog = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={vi.fn()} onLog={onLog} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Assign to' }));
    fireEvent.change(screen.getByLabelText('What'), {
      target: { value: 'Check the gage setup' },
    });
    fireEvent.change(screen.getByLabelText('Owner'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log action' }));

    expect(onLog).toHaveBeenCalledWith({
      text: 'Check the gage setup',
      status: 'open',
      assignedTo: {
        displayName: 'alex@example.com',
        upn: 'alex@example.com',
      },
    });
  });

  it('calls onCancel when canceled', () => {
    const onCancel = vi.fn();
    render(<LogActionModal cardTitle="Reduce rework" onCancel={onCancel} onLog={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
