import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ConfirmDialog, type ConfirmDialogProps } from '../ConfirmDialog';

// Polyfill <dialog> APIs for happy-dom / jsdom (shared setup.ts already covers this,
// but guard here in case the test is run in isolation)
beforeAll(() => {
  if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
});

const defaultProps = {
  isOpen: true,
  title: 'Delete entry',
  message: 'This action cannot be undone.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

function renderDialog(overrides: Partial<ConfirmDialogProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<ConfirmDialog {...props} />);
}

describe('ConfirmDialog', () => {
  it('renders open dialog with title and message when isOpen=true', () => {
    const { container } = renderDialog({ isOpen: true });
    const dialog = container.querySelector('dialog[open]');
    expect(dialog).not.toBeNull();
    expect(screen.getByText('Delete entry')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('does not render an open dialog when isOpen=false', () => {
    const { container } = renderDialog({ isOpen: false });
    const dialog = container.querySelector('dialog[open]');
    expect(dialog).toBeNull();
  });

  it('calls onCancel once and not onConfirm when Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderDialog({ onCancel, onConfirm });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm once and not onCancel when Confirm button is clicked', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderDialog({ onCancel, onConfirm });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape (cancel event) is dispatched on dialog', () => {
    const onCancel = vi.fn();
    const { container } = renderDialog({ onCancel });
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toBeNull();
    fireEvent(dialog!, new Event('cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking on the dialog backdrop (target === dialog element)', () => {
    const onCancel = vi.fn();
    const { container } = renderDialog({ onCancel });
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toBeNull();
    // Fire click directly on the dialog element (simulates backdrop click)
    fireEvent.click(dialog!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking inside dialog content', async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    const user = userEvent.setup();
    // Click on the title — target is a child element, not the dialog itself
    await user.click(screen.getByText('Delete entry'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('applies bg-red-500 class to Confirm button when isDestructive=true', () => {
    renderDialog({ isDestructive: true });
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton.className).toContain('bg-red-500');
  });
});
