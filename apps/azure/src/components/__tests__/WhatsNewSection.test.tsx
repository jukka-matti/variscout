import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import WhatsNewSection from '../WhatsNewSection';
import type { Finding, Question } from '@variscout/core';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = 1742731200000; // 2026-03-23T12:00:00.000Z
const LAST_VIEWED = NOW - 60 * 60 * 1000; // 1 hour before NOW

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Test finding',
    createdAt: LAST_VIEWED - 1000, // before lastViewed by default
    deletedAt: null,
    investigationId: 'general-unassigned',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: LAST_VIEWED - 1000,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'h-1',
    text: 'Night shift causes drift',
    status: 'open',
    linkedFindingIds: [],
    createdAt: LAST_VIEWED - 5000,
    updatedAt: LAST_VIEWED - 5000, // before lastViewed by default
    deletedAt: null,
    investigationId: 'general-unassigned',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WhatsNewSection', () => {
  it('shows empty state when nothing is new', () => {
    render(<WhatsNewSection findings={[]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByTestId('whats-new-empty')).toBeInTheDocument();
    expect(screen.getByText(/Nothing new since your last visit/)).toBeInTheDocument();
    expect(screen.queryByTestId('whats-new-list')).not.toBeInTheDocument();
  });

  it('handles empty findings and questions arrays without error', () => {
    const { container } = render(
      <WhatsNewSection findings={[]} questions={[]} lastViewedAt={LAST_VIEWED} />
    );
    expect(container).toBeTruthy();
    expect(screen.getByTestId('whats-new-section')).toBeInTheDocument();
  });

  it('shows new findings created after lastViewedAt', () => {
    const finding = makeFinding({
      createdAt: LAST_VIEWED + 1000,
      statusChangedAt: LAST_VIEWED + 1000,
      text: 'Shift B outlier',
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByTestId('whats-new-list')).toBeInTheDocument();
    expect(screen.getByText(/New finding.*Shift B outlier/)).toBeInTheDocument();
  });

  it('does not show findings created before lastViewedAt', () => {
    const finding = makeFinding({ createdAt: LAST_VIEWED - 1000 });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.queryByText(/New finding/)).not.toBeInTheDocument();
  });

  it('shows finding status changes after lastViewedAt', () => {
    const finding = makeFinding({
      text: 'Pressure spike',
      createdAt: LAST_VIEWED - 5000, // created before
      status: 'investigating',
      statusChangedAt: LAST_VIEWED + 2000, // status changed after
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByText(/Pressure spike/)).toBeInTheDocument();
    expect(screen.getByText(/Investigating/)).toBeInTheDocument();
  });

  it('does not show status change when statusChangedAt equals createdAt', () => {
    // This avoids showing "status changed" for freshly created findings
    const finding = makeFinding({
      text: 'Drift issue',
      createdAt: LAST_VIEWED + 1000,
      statusChangedAt: LAST_VIEWED + 1000, // same as createdAt
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    // Should show "New finding" but NOT a duplicate status-change entry
    const items = screen.getAllByTestId('whats-new-item-finding-new');
    expect(items).toHaveLength(1);
    expect(screen.queryByTestId('whats-new-item-finding-status')).not.toBeInTheDocument();
  });

  it('shows question status changes after lastViewedAt', () => {
    const question = makeQuestion({
      text: 'Operator training gap',
      status: 'answered',
      updatedAt: LAST_VIEWED + 3000, // after lastViewed
    });
    render(<WhatsNewSection findings={[]} questions={[question]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByText(/Operator training gap.*answered/)).toBeInTheDocument();
  });

  it('does not show questions updated before lastViewedAt', () => {
    const question = makeQuestion({
      updatedAt: LAST_VIEWED - 1000,
    });
    render(<WhatsNewSection findings={[]} questions={[question]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByTestId('whats-new-empty')).toBeInTheDocument();
  });

  it('shows completed actions after lastViewedAt', () => {
    const finding = makeFinding({
      text: 'Setup variance',
      actions: [
        {
          id: 'a-1',
          text: 'Retrain operators',
          createdAt: LAST_VIEWED - 10000,
          completedAt: LAST_VIEWED + 5000, // completed after lastViewed
          deletedAt: null,
        },
      ],
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByText(/Action completed.*Retrain operators/)).toBeInTheDocument();
  });

  it('does not show actions completed before lastViewedAt', () => {
    const finding = makeFinding({
      actions: [
        {
          id: 'a-1',
          text: 'Old action',
          createdAt: LAST_VIEWED - 20000,
          completedAt: LAST_VIEWED - 10000,
          deletedAt: null,
        },
      ],
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.queryByText(/Action completed/)).not.toBeInTheDocument();
  });

  it('shows new comments after lastViewedAt', () => {
    const finding = makeFinding({
      text: 'Temperature spike',
      comments: [
        {
          id: 'c-1',
          text: 'Checked with ops team',
          createdAt: LAST_VIEWED + 1000,
          parentId: 'f-1',
          parentKind: 'finding',
          deletedAt: null,
        },
      ],
    });
    render(<WhatsNewSection findings={[finding]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    expect(screen.getByText(/New comment on.*Temperature spike/)).toBeInTheDocument();
  });

  it('sorts items newest first', () => {
    const olderFinding = makeFinding({
      id: 'f-older',
      text: 'Older finding',
      createdAt: LAST_VIEWED + 1000,
      statusChangedAt: LAST_VIEWED + 1000,
    });
    const newerFinding = makeFinding({
      id: 'f-newer',
      text: 'Newer finding',
      createdAt: LAST_VIEWED + 5000,
      statusChangedAt: LAST_VIEWED + 5000,
    });
    render(
      <WhatsNewSection
        findings={[olderFinding, newerFinding]}
        questions={[]}
        lastViewedAt={LAST_VIEWED}
      />
    );
    const items = screen.getByTestId('whats-new-list').querySelectorAll('li');
    // Newer finding should appear first
    expect(items[0].textContent).toContain('Newer finding');
    expect(items[1].textContent).toContain('Older finding');
  });

  it('caps output at 10 items', () => {
    // Create 12 new findings
    const findings: Finding[] = Array.from({ length: 12 }, (_, i) =>
      makeFinding({
        id: `f-${i}`,
        text: `Finding ${i}`,
        createdAt: LAST_VIEWED + (i + 1) * 1000,
        statusChangedAt: LAST_VIEWED + (i + 1) * 1000,
      })
    );
    render(<WhatsNewSection findings={findings} questions={[]} lastViewedAt={LAST_VIEWED} />);
    const items = within(screen.getByTestId('whats-new-list')).getAllByRole('listitem');
    expect(items).toHaveLength(10);
  });

  it('renders header with last-viewed date', () => {
    render(<WhatsNewSection findings={[]} questions={[]} lastViewedAt={LAST_VIEWED} />);
    // Should contain "What's new since" text
    expect(screen.getByText(/What.s new since/)).toBeInTheDocument();
  });
});
