/**
 * Tests for ActionTrackerSection component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionTrackerSection } from '../ActionTrackerSection';
import type { TrackedAction } from '../ActionTrackerSection';

// Fixed "now" for overdue checks: 2024-06-15
const NOW = new Date('2024-06-15T12:00:00.000Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeAction(overrides: Partial<TrackedAction> = {}): TrackedAction {
  return {
    id: 'a1',
    text: 'Reduce cycle time',
    findingId: 'f1',
    createdAt: NOW - 1000,
    ...overrides,
  };
}

describe('ActionTrackerSection', () => {
  it('renders action items with text', () => {
    const actions = [
      makeAction({ id: 'a1', text: 'First action' }),
      makeAction({ id: 'a2', text: 'Second action' }),
    ];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    expect(screen.getByTestId('action-text-a1').textContent).toBe('First action');
    expect(screen.getByTestId('action-text-a2').textContent).toBe('Second action');
  });

  it('shows progress count (completed/total)', () => {
    const actions = [
      makeAction({ id: 'a1', completedAt: NOW - 500 }),
      makeAction({ id: 'a2', completedAt: NOW - 400 }),
      makeAction({ id: 'a3' }),
      makeAction({ id: 'a4' }),
    ];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const count = screen.getByTestId('action-progress-count');
    expect(count.textContent).toBe('2/4 complete');
  });

  it('shows overdue banner when actions are past due', () => {
    const actions = [
      makeAction({ id: 'a1', dueDate: '2024-06-10' }), // past due
      makeAction({ id: 'a2', dueDate: '2024-07-01' }), // future
    ];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const banner = screen.getByTestId('action-overdue-banner');
    expect(banner.textContent).toContain('1 action overdue');
  });

  it('does not show overdue banner when no actions are overdue', () => {
    const actions = [makeAction({ id: 'a1', dueDate: '2024-07-01' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    expect(screen.queryByTestId('action-overdue-banner')).toBeNull();
  });

  it('uses plural "actions" in overdue banner when multiple overdue', () => {
    const actions = [
      makeAction({ id: 'a1', dueDate: '2024-06-10' }),
      makeAction({ id: 'a2', dueDate: '2024-06-11' }),
    ];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const banner = screen.getByTestId('action-overdue-banner');
    expect(banner.textContent).toContain('2 actions overdue');
  });

  it('completed actions show strikethrough styling', () => {
    const actions = [makeAction({ id: 'a1', completedAt: NOW - 100 })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const text = screen.getByTestId('action-text-a1');
    expect(text.className).toContain('line-through');
  });

  it('completed actions show done circle with check', () => {
    const actions = [makeAction({ id: 'a1', completedAt: NOW - 100 })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const toggle = screen.getByTestId('action-toggle-a1');
    expect(toggle.className).toContain('bg-green-500');
  });

  it('incomplete actions show pending circle without fill', () => {
    const actions = [makeAction({ id: 'a1' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const toggle = screen.getByTestId('action-toggle-a1');
    expect(toggle.className).not.toContain('bg-green-500');
    expect(toggle.className).toContain('border-edge');
  });

  it('shows assignee badge when action has assignee', () => {
    const actions = [
      makeAction({ id: 'a1', assignee: { name: 'Jane Doe', email: 'jane@example.com' } }),
    ];
    render(
      <ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} onAssign={vi.fn()} />
    );

    const badge = screen.getByTestId('action-assignee-a1');
    expect(badge.textContent).toBe('Jane Doe');
  });

  it('shows "+ Assign" for unassigned actions when onAssign provided', () => {
    const actions = [makeAction({ id: 'a1' })];
    render(
      <ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} onAssign={vi.fn()} />
    );

    expect(screen.getByTestId('action-assign-btn-a1')).toBeTruthy();
    expect(screen.getByTestId('action-assign-btn-a1').textContent).toContain('+ Assign');
  });

  it('does not show "+ Assign" when onAssign not provided', () => {
    const actions = [makeAction({ id: 'a1' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    expect(screen.queryByTestId('action-assign-btn-a1')).toBeNull();
  });

  it('calls onToggleComplete when circle is clicked', () => {
    const onToggleComplete = vi.fn();
    const actions = [makeAction({ id: 'a1', findingId: 'f42' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={onToggleComplete} />);

    fireEvent.click(screen.getByTestId('action-toggle-a1'));
    expect(onToggleComplete).toHaveBeenCalledWith('a1', 'f42');
  });

  it('calls onAssign when assign button clicked', () => {
    const onAssign = vi.fn();
    const actions = [makeAction({ id: 'a1', findingId: 'f1' })];
    render(
      <ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} onAssign={onAssign} />
    );

    fireEvent.click(screen.getByTestId('action-assign-btn-a1'));
    expect(onAssign).toHaveBeenCalledWith('a1', 'f1');
  });

  it('calls onAddAction when add button clicked', () => {
    const onAddAction = vi.fn();
    render(
      <ActionTrackerSection actions={[]} onToggleComplete={vi.fn()} onAddAction={onAddAction} />
    );

    fireEvent.click(screen.getByTestId('action-add-btn'));
    expect(onAddAction).toHaveBeenCalledOnce();
  });

  it('sorts: overdue first, then pending, then completed', () => {
    const actions: TrackedAction[] = [
      makeAction({ id: 'completed', completedAt: NOW - 100, createdAt: NOW - 3000 }),
      makeAction({ id: 'pending', createdAt: NOW - 2000 }),
      makeAction({ id: 'overdue', dueDate: '2024-06-10', createdAt: NOW - 1000 }),
    ];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const cards = screen.getAllByTestId(/^action-card-/);
    const ids = cards.map(c => c.getAttribute('data-testid')?.replace('action-card-', ''));
    expect(ids).toEqual(['overdue', 'pending', 'completed']);
  });

  it('shows cause dot with color and name', () => {
    const actions = [makeAction({ id: 'a1', causeColor: '#ef4444', causeName: 'Shift' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const cause = screen.getByTestId('action-cause-a1');
    expect(cause.textContent).toContain('Shift');
    const dot = cause.querySelector('span');
    // jsdom normalizes hex to rgb in the style attribute
    const style = dot?.getAttribute('style') ?? '';
    expect(style).toMatch(/background-color:\s*(#ef4444|rgb\(239,\s*68,\s*68\))/i);
  });

  it('shows projected Cpk badge when provided', () => {
    const actions = [makeAction({ id: 'a1', projectedCpk: 1.45 })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const cpk = screen.getByTestId('action-cpk-a1');
    expect(cpk.textContent).toContain('1.45');
  });

  it('shows due date formatted', () => {
    const actions = [makeAction({ id: 'a1', dueDate: '2024-07-20' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    expect(screen.getByTestId('action-due-date-a1')).toBeTruthy();
  });

  it('overdue date has red styling', () => {
    const actions = [makeAction({ id: 'a1', dueDate: '2024-06-10' })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    const dateEl = screen.getByTestId('action-due-date-a1');
    expect(dateEl.className).toContain('text-red-400');
  });

  it('does not show overdue banner for completed overdue actions', () => {
    // Completed action with past due date should NOT count as overdue
    const actions = [makeAction({ id: 'a1', dueDate: '2024-06-10', completedAt: NOW - 50 })];
    render(<ActionTrackerSection actions={actions} onToggleComplete={vi.fn()} />);

    expect(screen.queryByTestId('action-overdue-banner')).toBeNull();
  });

  it('renders empty state without error when no actions', () => {
    render(<ActionTrackerSection actions={[]} onToggleComplete={vi.fn()} />);

    expect(screen.getByTestId('action-tracker-section')).toBeTruthy();
    const count = screen.getByTestId('action-progress-count');
    expect(count.textContent).toBe('0/0 complete');
  });
});
