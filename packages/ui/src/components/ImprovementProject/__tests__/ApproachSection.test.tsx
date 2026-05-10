import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import { ApproachSection } from '../sections/ApproachSection';
import { ImprovementProjectForm } from '../ImprovementProjectForm';
import type { ApproachSectionProps } from '../sections/ApproachSection';

const makeIdea = (overrides: Partial<ImprovementIdea> & Pick<ImprovementIdea, 'id' | 'text'>) =>
  ({
    createdAt: 1,
    deletedAt: null,
    ...overrides,
  }) as ImprovementIdea;

const makeAction = (overrides: Partial<ActionItem> & Pick<ActionItem, 'id' | 'text'>) =>
  ({
    createdAt: 1,
    deletedAt: null,
    ...overrides,
  }) as ActionItem;

describe('ApproachSection', () => {
  const populatedProps: ApproachSectionProps = {
    improvementIdeas: [
      makeIdea({
        id: 'idea-1',
        text: 'Simplify setup with visual guides',
        direction: 'simplify',
        timeframe: 'weeks',
        selected: true,
      }),
    ],
    actionItems: [
      makeAction({
        id: 'action-1',
        text: 'Pilot setup checklist',
        assignee: { upn: 'lee@example.com', displayName: 'Lee Process' },
        dueDate: '2026-06-15',
        completedAt: 1770940800000,
      }),
    ],
    narrative: 'Start with one line and verify before rollout.',
  };

  it('renders idea and action metadata', () => {
    render(<ApproachSection {...populatedProps} />);

    expect(screen.getByText('Simplify setup with visual guides')).toBeInTheDocument();
    expect(screen.getByText('simplify')).toBeInTheDocument();
    expect(screen.getByText('weeks')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();

    expect(screen.getByText('Pilot setup checklist')).toBeInTheDocument();
    expect(screen.getByText('Lee Process')).toBeInTheDocument();
    expect(screen.getByText('Due 2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('clicking idea and action calls onNavigate with the correct kind and id', () => {
    const onNavigate = vi.fn();

    render(<ApproachSection {...populatedProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: /simplify setup with visual guides/i }));
    fireEvent.click(screen.getByRole('button', { name: /pilot setup checklist/i }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, {
      kind: 'improvementIdea',
      id: 'idea-1',
    });
    expect(onNavigate).toHaveBeenNthCalledWith(2, {
      kind: 'actionItem',
      id: 'action-1',
    });
  });

  it('does not render focusable no-op controls when onNavigate is omitted', () => {
    render(<ApproachSection {...populatedProps} />);

    const ideaList = screen.getByRole('list', { name: /improvement ideas/i });
    const actionList = screen.getByRole('list', { name: /action items/i });

    expect(within(ideaList).queryByRole('button')).not.toBeInTheDocument();
    expect(within(actionList).queryByRole('button')).not.toBeInTheDocument();
  });

  it('narrative textarea calls onNarrativeChange', () => {
    const onNarrativeChange = vi.fn();

    render(
      <ApproachSection
        {...populatedProps}
        narrative="Start with one line"
        onNarrativeChange={onNarrativeChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/approach narrative/i), {
      target: { value: 'Pilot the countermeasure before rollout.' },
    });

    expect(onNarrativeChange).toHaveBeenCalledWith('Pilot the countermeasure before rollout.');
  });

  it('renders empty states for no ideas and no actions', () => {
    render(<ApproachSection />);

    expect(screen.getByText('No improvement ideas linked yet.')).toBeInTheDocument();
    expect(screen.getByText('No action items linked yet.')).toBeInTheDocument();
  });
});

describe('ImprovementProjectForm approach integration', () => {
  it('renders ApproachSection in section five when approach props are provided', () => {
    render(
      <ImprovementProjectForm
        approachProps={{
          narrative: 'Pilot the setup guide in one cell.',
          improvementIdeas: [makeIdea({ id: 'idea-1', text: 'Simplify setup guide' })],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Approach / Countermeasures' }));

    expect(screen.getByLabelText(/approach narrative/i)).toHaveValue(
      'Pilot the setup guide in one cell.'
    );
    expect(screen.getByText('Simplify setup guide')).toBeInTheDocument();
  });

  it('keeps sectionContent approach override ahead of approach props', () => {
    render(
      <ImprovementProjectForm
        approachProps={{
          narrative: 'Pilot the setup guide in one cell.',
          improvementIdeas: [makeIdea({ id: 'idea-1', text: 'Simplify setup guide' })],
        }}
        sectionContent={{
          approach: <div>Custom approach override</div>,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Approach / Countermeasures' }));

    expect(screen.getByText('Custom approach override')).toBeInTheDocument();
    expect(screen.queryByLabelText(/approach narrative/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Simplify setup guide')).not.toBeInTheDocument();
  });
});
