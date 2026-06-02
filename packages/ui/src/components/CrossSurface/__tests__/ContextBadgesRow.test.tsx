import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ContextBadgesRow, type ContextLinkGroup } from '../ContextBadgesRow';

interface TestLinkItem {
  id: string;
  label: string;
  description?: string;
  href: string;
}

const groups: ContextLinkGroup<TestLinkItem>[] = [
  {
    surfaceType: 'improvement-projects',
    items: [{ id: 'improve-1', label: 'Reduce rework', href: '/improve/1' }],
  },
  {
    surfaceType: 'wall-threads',
    items: [
      { id: 'thread-1', label: 'Containment thread', href: '/wall/1' },
      { id: 'thread-2', label: 'Root cause thread', href: '/wall/2' },
    ],
  },
  {
    surfaceType: 'sustainment',
    items: [
      { id: 'sustain-1', label: 'Control plan', href: '/sustain/1' },
      { id: 'handoff-1', label: 'Shift handoff', href: '/handoff/1' },
    ],
  },
];

describe('ContextBadgesRow', () => {
  it('renders visible surface badges with icon labels and item counts', () => {
    render(<ContextBadgesRow groups={groups} onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Improvement projects: 1 linked item' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wall threads: 2 linked items' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Control: 2 linked items' })).toBeTruthy();
    // PR-CS-5 §7.3: the always-empty 'quick-actions' surface stub was dropped.
    expect(screen.queryByRole('button', { name: /quick actions/i })).toBeNull();
  });

  it('navigates directly when a badge has exactly one item', () => {
    const onNavigate = vi.fn();
    render(<ContextBadgesRow groups={groups} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Improvement projects: 1 linked item' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(groups[0].items[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the multi-link picker when a badge has multiple items', () => {
    const onNavigate = vi.fn();
    render(<ContextBadgesRow groups={groups} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wall threads: 2 linked items' }));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Wall threads' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Containment thread' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Root cause thread' })).toBeTruthy();
  });

  it('selects an item from the picker and closes the overlay', () => {
    const onNavigate = vi.fn();
    render(<ContextBadgesRow groups={groups} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wall threads: 2 linked items' }));
    fireEvent.click(screen.getByRole('button', { name: 'Root cause thread' }));

    expect(onNavigate).toHaveBeenCalledWith(groups[1].items[1]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
