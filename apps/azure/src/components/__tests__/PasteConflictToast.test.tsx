// PasteConflictToast.test.tsx
// Tests for P5.3 (F3.6-β).
//
// IMPORTANT: vi.mock MUST appear before component imports to avoid infinite loops.
// The hoisted pattern captures the captured handler so tests can fire events.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ── Hoisted mock helpers (available inside vi.mock factory, before imports) ──

const { mockSubscribePasteConflict } = vi.hoisted(() => ({
  mockSubscribePasteConflict: vi.fn(),
}));

// ── Module mock (before component import) ─────────────────────────────────────

vi.mock('../../services/cloudSync', () => ({
  subscribePasteConflict: mockSubscribePasteConflict,
}));

// ── Component import (after mock) ─────────────────────────────────────────────

import { PasteConflictToast } from '../PasteConflictToast';
import type { PasteConflictEvent } from '../../services/cloudSync';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONFLICT_EVENT: PasteConflictEvent = {
  kind: 'paste-conflict',
  hubId: 'hub-001',
  sourceId: 'src-001',
  snapshotId: 'snap-001',
};

const CONFLICT_EVENT_2: PasteConflictEvent = {
  kind: 'paste-conflict',
  hubId: 'hub-002',
  sourceId: 'src-002',
  snapshotId: 'snap-002',
};

/**
 * Render the component and return the captured handler + unsubscribe spy.
 * `subscribePasteConflict` is called on mount; we capture the handler passed to it.
 */
function renderAndCapture() {
  let capturedHandler: ((event: PasteConflictEvent) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  mockSubscribePasteConflict.mockImplementation((handler: (event: PasteConflictEvent) => void) => {
    capturedHandler = handler;
    return mockUnsubscribe;
  });

  const result = render(<PasteConflictToast />);

  return {
    ...result,
    /** Fire a conflict event as if the cloudSync service emitted it (wrapped in act for React state flush). */
    fireConflict: (event: PasteConflictEvent = CONFLICT_EVENT) => {
      if (!capturedHandler) throw new Error('Handler not captured — subscribe was not called');
      act(() => {
        capturedHandler!(event);
      });
    },
    mockUnsubscribe,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PasteConflictToast', () => {
  beforeEach(() => {
    mockSubscribePasteConflict.mockReset();
  });

  it('renders nothing when no conflict event has fired', () => {
    mockSubscribePasteConflict.mockReturnValue(vi.fn());
    const { container } = render(<PasteConflictToast />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the conflict modal when a paste-conflict event fires', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();
  });

  it('displays the conflict title and body message', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    expect(screen.getByText('Multiple teammates are updating this hub')).toBeInTheDocument();
    expect(screen.getByText('Pausing your paste — please retry in a moment.')).toBeInTheDocument();
  });

  it('shows both "Try again" and "Dismiss" action buttons', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    expect(screen.getByTestId('paste-conflict-try-again')).toBeInTheDocument();
    expect(screen.getByTestId('paste-conflict-dismiss')).toBeInTheDocument();
  });

  it('"Try again" button click clears the modal', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('paste-conflict-try-again'));
    expect(screen.queryByTestId('paste-conflict-modal')).not.toBeInTheDocument();
  });

  it('"Dismiss" button click clears the modal', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('paste-conflict-dismiss'));
    expect(screen.queryByTestId('paste-conflict-modal')).not.toBeInTheDocument();
  });

  it('calls the unsubscribe function on component unmount', () => {
    const { unmount, mockUnsubscribe } = renderAndCapture();
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('latest-wins: a second conflict event replaces the first (modal stays visible with updated event)', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict(CONFLICT_EVENT);

    // Modal is visible after first event
    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();

    // Fire a second event — modal should still be visible (not reset to null)
    fireConflict(CONFLICT_EVENT_2);
    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();
  });

  it('modal re-appears after dismiss if a new conflict event fires', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    fireEvent.click(screen.getByTestId('paste-conflict-dismiss'));
    expect(screen.queryByTestId('paste-conflict-modal')).not.toBeInTheDocument();

    // New event fires after dismiss
    fireConflict(CONFLICT_EVENT_2);
    expect(screen.getByTestId('paste-conflict-modal')).toBeInTheDocument();
  });

  it('modal has role="dialog" and aria-modal="true" for accessibility', () => {
    const { fireConflict } = renderAndCapture();
    fireConflict();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
