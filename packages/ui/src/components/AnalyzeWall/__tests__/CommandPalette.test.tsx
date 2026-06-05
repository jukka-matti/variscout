/**
 * CommandPalette — ⌘K search over hubs/findings on the Wall.
 *
 * Tests exercise the externally-observable behavior: filter on input,
 * arrow-key navigation, Enter → onPanTo(id) + onClose, Escape → onClose.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../CommandPalette';
import type { Hypothesis, Finding } from '@variscout/core';

const hubs: Hypothesis[] = [
  {
    id: 'h-night',
    name: 'Night shift thermal drift',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
  {
    id: 'h-nozzle',
    name: 'Nozzle runs hot on pack line',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
  {
    id: 'h-cal',
    name: 'Calibration drift on Friday',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
];

const findings: Finding[] = [];

describe('CommandPalette', () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onPanTo: ReturnType<typeof vi.fn<(nodeId: string) => void>>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    onPanTo = vi.fn<(nodeId: string) => void>();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(
      <CommandPalette
        open={false}
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        findings={findings}
      />
    );
    expect(container.querySelector('[data-testid="wall-command-palette"]')).toBeNull();
  });

  it('renders the modal when open=true', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    expect(screen.getByTestId('wall-command-palette')).toBeInTheDocument();
  });

  it('filters results by case-insensitive substring match', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'night' } });
    // Hub "Night shift thermal drift" matches
    expect(screen.getByText(/Night shift thermal drift/)).toBeInTheDocument();
    // Non-matching hubs disappear
    expect(screen.queryByText(/Nozzle runs hot/)).toBeNull();
  });

  it('Arrow Down + Enter pans to the second result', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    const input = screen.getByRole('textbox');
    // No filter — all 3 hubs listed. First item is hubs[0].
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPanTo).toHaveBeenCalledTimes(1);
    // One ArrowDown moves from index 0 to 1 → hubs[1].
    expect(onPanTo).toHaveBeenCalledWith('h-nozzle');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter on the (default-selected) first result pans to it', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPanTo).toHaveBeenCalledWith('h-night');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the palette without panning', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onPanTo).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ArrowUp wraps to the last result', () => {
    render(
      <CommandPalette open onClose={onClose} onPanTo={onPanTo} hubs={hubs} findings={findings} />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Wraps to the last hub
    expect(onPanTo).toHaveBeenCalledWith('h-cal');
  });
});
