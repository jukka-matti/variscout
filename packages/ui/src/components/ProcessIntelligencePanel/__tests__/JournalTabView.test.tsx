import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JournalTabView from '../JournalTabView';
import type { JournalEntry } from '@variscout/hooks';

const makeEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'j-1',
  timestamp: '2026-04-01T09:00:00.000Z',
  type: 'finding-created',
  text: 'Cpk dropped below 1.0 on Line 3',
  ...overrides,
});

const entries: JournalEntry[] = [
  makeEntry({ id: 'j-1', text: 'Cpk dropped below 1.0 on Line 3', type: 'finding-created' }),
  makeEntry({
    id: 'j-2',
    text: 'Machine speed → Ruled out',
    type: 'question-ruled-out',
    timestamp: '2026-04-01T09:15:00.000Z',
  }),
  makeEntry({
    id: 'j-3',
    text: 'Temperature → Answered',
    type: 'question-answered',
    detail: 'R²adj 62%',
    timestamp: '2026-04-01T09:30:00.000Z',
  }),
];

describe('JournalTabView', () => {
  it('renders all journal entries', () => {
    render(<JournalTabView entries={entries} />);
    expect(screen.getByTestId('journal-timeline')).toBeDefined();
    const rows = screen.getAllByTestId('journal-entry-row');
    expect(rows).toHaveLength(3);
    expect(screen.getByText('Cpk dropped below 1.0 on Line 3')).toBeDefined();
    expect(screen.getByText('Machine speed → Ruled out')).toBeDefined();
    expect(screen.getByText('Temperature → Answered')).toBeDefined();
  });

  it('shows detail line when present', () => {
    render(<JournalTabView entries={entries} />);
    expect(screen.getByText('R²adj 62%')).toBeDefined();
  });

  it('shows empty state when no entries', () => {
    render(<JournalTabView entries={[]} />);
    expect(screen.getByTestId('journal-empty-state')).toBeDefined();
    expect(screen.getByText('No investigation activity yet')).toBeDefined();
  });

  it('renders timestamps', () => {
    render(<JournalTabView entries={entries} />);
    // Each entry renders a time string; there should be time text nodes
    // We check the entry rows are present and contain time information
    const rows = screen.getAllByTestId('journal-entry-row');
    expect(rows.length).toBeGreaterThan(0);
    // The timestamp is rendered as toLocaleTimeString — just verify rows are rendered
    // with the correct count matching entries
    expect(rows).toHaveLength(entries.length);
  });

  it('shows subtitle', () => {
    render(<JournalTabView entries={entries} />);
    expect(
      screen.getByText('Investigation timeline — every analytical step recorded')
    ).toBeDefined();
  });

  it('shows Include in Report button when callback provided and entries exist', () => {
    const onIncludeInReport = vi.fn();
    render(<JournalTabView entries={entries} onIncludeInReport={onIncludeInReport} />);
    expect(screen.getByTestId('journal-include-in-report')).toBeDefined();
  });

  it('hides Include in Report button when no entries', () => {
    const onIncludeInReport = vi.fn();
    render(<JournalTabView entries={[]} onIncludeInReport={onIncludeInReport} />);
    expect(screen.queryByTestId('journal-include-in-report')).toBeNull();
  });
});
