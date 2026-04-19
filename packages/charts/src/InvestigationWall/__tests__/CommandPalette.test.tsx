/**
 * CommandPalette — ⌘K search over hubs/questions/findings on the Wall.
 *
 * Tests exercise the externally-observable behavior: filter on input,
 * arrow-key navigation, Enter → onPanTo(id) + onClose, Escape → onClose.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../CommandPalette';
import type { SuspectedCause, Question, Finding } from '@variscout/core';

const hubs: SuspectedCause[] = [
  {
    id: 'h-night',
    name: 'Night shift thermal drift',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-nozzle',
    name: 'Nozzle runs hot on pack line',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-cal',
    name: 'Calibration drift on Friday',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  },
];

const questions: Question[] = [
  {
    id: 'q-1',
    text: 'What does the night shift do differently?',
    status: 'open',
    linkedFindingIds: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'q-2',
    text: 'Is Cpk trending?',
    status: 'open',
    linkedFindingIds: [],
    createdAt: '',
    updatedAt: '',
  },
];

const findings: Finding[] = [];

describe('CommandPalette', () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onPanTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onPanTo = vi.fn();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(
      <CommandPalette
        open={false}
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    expect(container.querySelector('[data-testid="wall-command-palette"]')).toBeNull();
  });

  it('renders the modal when open=true', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    expect(screen.getByTestId('wall-command-palette')).toBeInTheDocument();
  });

  it('filters results by case-insensitive substring match', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'night' } });
    // Hub "Night shift thermal drift" + question "What does the night shift..."
    expect(screen.getByText(/Night shift thermal drift/)).toBeInTheDocument();
    expect(screen.getByText(/What does the night shift do differently\?/)).toBeInTheDocument();
    // Non-matching hubs/questions disappear
    expect(screen.queryByText(/Nozzle runs hot/)).toBeNull();
    expect(screen.queryByText(/Is Cpk trending\?/)).toBeNull();
  });

  it('Arrow Down + Enter pans to the second result', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    const input = screen.getByRole('textbox');
    // No filter — all 5 items (3 hubs + 2 questions) listed. First item is
    // the first hub in the ordered result list.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPanTo).toHaveBeenCalledTimes(1);
    // With default ordering (hubs first, then questions), ArrowDown twice
    // lands on hubs[1] = 'h-nozzle'. Because we issued only one ArrowDown,
    // the initial selection moves from index 0 to 1 → hubs[1].
    expect(onPanTo).toHaveBeenCalledWith('h-nozzle');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter on the (default-selected) first result pans to it', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPanTo).toHaveBeenCalledWith('h-night');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the palette without panning', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onPanTo).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ArrowUp wraps to the last result', () => {
    render(
      <CommandPalette
        open
        onClose={onClose}
        onPanTo={onPanTo}
        hubs={hubs}
        questions={questions}
        findings={findings}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Wraps to the last question
    expect(onPanTo).toHaveBeenCalledWith('q-2');
  });
});
