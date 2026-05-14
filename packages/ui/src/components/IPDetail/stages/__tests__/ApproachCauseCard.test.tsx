import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApproachCauseCard from '../ApproachCauseCard';
import type { CauseRow } from '../causeProjection';
import type { ImprovementIdea, ActionItem } from '@variscout/core/findings/types';

const baseEntity = { createdAt: 0, deletedAt: null };

const selectedIdea: ImprovementIdea = {
  ...baseEntity,
  id: 'idea-1',
  text: 'PID retune',
};

const doneAction: ActionItem = {
  ...baseEntity,
  id: 'a-1',
  text: 'Tune PID controller',
  status: 'done',
};

const causeResolved: CauseRow = {
  factor: 'NOZZLE.TEMP',
  targetCondition: 'in control 95±2°C',
  hypothesis: undefined,
  ideas: [],
  selectedIdea,
  actions: [doneAction],
  causeStatus: 'resolved',
};

describe('ApproachCauseCard', () => {
  it('shows the selected idea name + RESOLVED status', () => {
    render(<ApproachCauseCard cause={causeResolved} onOpenWorkbench={() => {}} />);
    expect(screen.getByText('NOZZLE.TEMP')).toBeInTheDocument();
    expect(screen.getByText('PID retune')).toBeInTheDocument();
    expect(screen.getByText(/RESOLVED/i)).toBeInTheDocument();
  });

  it('shows pending state when status = pending-idea', () => {
    const pending: CauseRow = {
      ...causeResolved,
      selectedIdea: undefined,
      actions: [],
      causeStatus: 'pending-idea',
    };
    render(<ApproachCauseCard cause={pending} onOpenWorkbench={() => {}} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('calls onOpenWorkbench with the cause when CTA clicked', () => {
    const onOpen = vi.fn();
    const pending: CauseRow = {
      ...causeResolved,
      selectedIdea: undefined,
      actions: [],
      causeStatus: 'pending-idea',
    };
    render(<ApproachCauseCard cause={pending} onOpenWorkbench={onOpen} />);
    fireEvent.click(screen.getByTestId('cause-open-workbench'));
    expect(onOpen).toHaveBeenCalledWith(pending);
  });
});
