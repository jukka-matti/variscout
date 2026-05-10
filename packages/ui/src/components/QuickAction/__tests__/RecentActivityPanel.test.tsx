import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ActionItem } from '@variscout/core/findings';
import { RecentActivityPanel } from '../RecentActivityPanel';

const makeAction = (overrides: Partial<ActionItem> & Pick<ActionItem, 'id' | 'text'>) =>
  ({
    createdAt: 1,
    deletedAt: null,
    stepId: 'step-1',
    parentImprovementProjectId: null,
    parentImprovementIdeaId: null,
    status: 'open',
    assignedTo: null,
    dueAt: null,
    doneAt: null,
    ...overrides,
  }) as ActionItem;

describe('RecentActivityPanel', () => {
  it('renders a collapsed Recent activity section with only step-scoped orphan actions', () => {
    render(
      <RecentActivityPanel
        stepId="step-1"
        actionItems={[
          makeAction({ id: 'action-1', text: 'Check gasket seating' }),
          makeAction({ id: 'action-2', text: 'Different step', stepId: 'step-2' }),
          makeAction({
            id: 'action-3',
            text: 'Linked to project',
            parentImprovementProjectId: 'project-1',
          }),
          makeAction({
            id: 'action-4',
            text: 'Linked to idea',
            parentImprovementIdeaId: 'idea-1',
          }),
          makeAction({ id: 'action-5', text: 'Deleted action', deletedAt: 1770000000000 }),
        ]}
      />
    );

    const section = screen.getByText('Recent activity').closest('details');

    expect(section).toBeInTheDocument();
    expect(section).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Recent activity'));

    expect(screen.getByRole('button', { name: /check gasket seating/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /different step/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /linked to project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /linked to idea/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deleted action/i })).not.toBeInTheDocument();
  });

  it('expands and collapses using native details behavior', () => {
    render(
      <RecentActivityPanel
        stepId="step-1"
        actionItems={[makeAction({ id: 'action-1', text: 'Check gasket seating' })]}
      />
    );

    const section = screen.getByText('Recent activity').closest('details');

    expect(section).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Recent activity'));
    expect(section).toHaveAttribute('open');

    fireEvent.click(screen.getByText('Recent activity'));
    expect(section).not.toHaveAttribute('open');
  });

  it('opens a labelled, closable details dialog when an action row is clicked', () => {
    render(
      <RecentActivityPanel
        stepId="step-1"
        actionItems={[
          makeAction({
            id: 'action-1',
            text: 'Update setup checklist',
            status: 'done',
            assignedTo: { displayName: 'Alex Chen', upn: 'alex@example.com' },
            dueAt: '2026-05-18',
            doneAt: '2026-05-20T08:30:00.000Z',
          }),
        ]}
      />
    );

    fireEvent.click(screen.getByText('Recent activity'));
    fireEvent.click(screen.getByRole('button', { name: /update setup checklist/i }));

    const dialog = screen.getByRole('dialog', { name: 'Action details' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Update setup checklist')).toBeInTheDocument();
    expect(within(dialog).getByText('done')).toBeInTheDocument();
    expect(within(dialog).getByText('Alex Chen')).toBeInTheDocument();
    expect(within(dialog).getByText('2026-05-18')).toBeInTheDocument();
    expect(within(dialog).getByText('2026-05-20T08:30:00.000Z')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: 'Action details' })).not.toBeInTheDocument();
  });

  it('moves focus into the details dialog, traps tab focus, closes on Escape, and restores focus', async () => {
    render(
      <>
        <button type="button">Outside action</button>
        <RecentActivityPanel
          stepId="step-1"
          actionItems={[makeAction({ id: 'action-1', text: 'Update setup checklist' })]}
        />
      </>
    );

    fireEvent.click(screen.getByText('Recent activity'));
    const actionRow = screen.getByRole('button', { name: /update setup checklist/i });
    fireEvent.click(actionRow);

    const dialog = screen.getByRole('dialog', { name: 'Action details' });
    const closeButton = within(dialog).getByRole('button', { name: 'Close' });

    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(closeButton).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Outside action' })).not.toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Action details' })).not.toBeInTheDocument();
    await waitFor(() => expect(actionRow).toHaveFocus());
  });
});
