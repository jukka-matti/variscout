import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SaveConflictDialog } from '../SaveConflictDialog';

beforeAll(() => {
  // jsdom <dialog> polyfill (same approach as packages/ui ConfirmDialog tests)
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

function renderDialog(overrides: Partial<Parameters<typeof SaveConflictDialog>[0]> = {}) {
  const handlers = {
    onReload: vi.fn(),
    onBranch: vi.fn(),
    onDismiss: vi.fn(),
  };
  render(<SaveConflictDialog isOpen documentName="Line 4 scrap" {...handlers} {...overrides} />);
  return handlers;
}

describe('SaveConflictDialog (PO-8b reload-or-branch)', () => {
  it('names the conflicted document and makes the discard consequence explicit', () => {
    renderDialog();
    expect(screen.getByText('Cloud copy has changed')).toBeInTheDocument();
    expect(screen.getByText(/Line 4 scrap/)).toBeInTheDocument();
    expect(screen.getByText(/unsaved changes are discarded/i)).toBeInTheDocument();
  });

  it('"Keep mine as a copy" fires onBranch only (negative control: not reload/dismiss)', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /keep mine as a copy/i }));
    expect(handlers.onBranch).toHaveBeenCalledTimes(1);
    expect(handlers.onReload).not.toHaveBeenCalled();
    expect(handlers.onDismiss).not.toHaveBeenCalled();
  });

  it('"Load cloud version" fires onReload only', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /load cloud version/i }));
    expect(handlers.onReload).toHaveBeenCalledTimes(1);
    expect(handlers.onBranch).not.toHaveBeenCalled();
    expect(handlers.onDismiss).not.toHaveBeenCalled();
  });

  it('"Not now" and ESC both defer via onDismiss', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);

    // ESC → native cancel event
    fireEvent(screen.getByRole('alertdialog'), new Event('cancel'));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(2);
    expect(handlers.onReload).not.toHaveBeenCalled();
    expect(handlers.onBranch).not.toHaveBeenCalled();
  });

  it('closed when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.getByTestId('save-conflict-dialog')).not.toHaveAttribute('open');
  });
});
