import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Hypothesis } from '@variscout/core/findings';
import { GoalSection } from '../sections/GoalSection';
import { ImprovementProjectForm } from '../ImprovementProjectForm';

const makeHypothesis = (
  overrides: Partial<Hypothesis> & Pick<Hypothesis, 'id' | 'name' | 'status'>
): Hypothesis =>
  ({
    createdAt: 1,
    deletedAt: null,
    synthesis: '',
    questionIds: [],
    findingIds: [],
    updatedAt: 1,
    ...overrides,
  }) as Hypothesis;

describe('GoalSection', () => {
  it('renders Y required guidance when no outcome FK or free text exists and clears it for either path', () => {
    const { rerender } = render(<GoalSection freeText="   " />);

    expect(screen.getByText(/choose an outcome target or describe the goal/i)).toBeInTheDocument();

    rerender(<GoalSection outcomeGoal={{ outcomeSpecId: 'yield' }} freeText="   " />);
    expect(
      screen.queryByText(/choose an outcome target or describe the goal/i)
    ).not.toBeInTheDocument();

    rerender(<GoalSection freeText="Reduce rework in onboarding" />);
    expect(
      screen.queryByText(/choose an outcome target or describe the goal/i)
    ).not.toBeInTheDocument();
  });

  it('emits merged outcome goal changes from outcome, baseline, target, and deadline controls', () => {
    const onOutcomeGoalChange = vi.fn();

    render(
      <GoalSection
        outcomeGoal={{ outcomeSpecId: 'yield', baseline: 82, target: 92, deadline: '2026-06-01' }}
        outcomeOptions={[
          { id: 'yield', label: 'First pass yield', baseline: 80, target: 90 },
          { id: 'scrap', label: 'Scrap rate', baseline: 7, target: 3 },
        ]}
        onOutcomeGoalChange={onOutcomeGoalChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/outcome spec/i), { target: { value: 'scrap' } });
    fireEvent.change(screen.getByLabelText(/baseline/i), { target: { value: '79.5' } });
    fireEvent.change(screen.getByLabelText(/^target$/i), { target: { value: '94.25' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2026-07-15' } });

    expect(onOutcomeGoalChange).toHaveBeenNthCalledWith(1, {
      outcomeSpecId: 'scrap',
      baseline: 82,
      target: 92,
      deadline: '2026-06-01',
    });
    expect(onOutcomeGoalChange).toHaveBeenNthCalledWith(2, {
      outcomeSpecId: 'yield',
      baseline: 79.5,
      target: 92,
      deadline: '2026-06-01',
    });
    expect(onOutcomeGoalChange).toHaveBeenNthCalledWith(3, {
      outcomeSpecId: 'yield',
      baseline: 82,
      target: 94.25,
      deadline: '2026-06-01',
    });
    expect(onOutcomeGoalChange).toHaveBeenNthCalledWith(4, {
      outcomeSpecId: 'yield',
      baseline: 82,
      target: 92,
      deadline: '2026-07-15',
    });
  });

  it('renders only confirmed hypothesis suggestions and appends a deterministic factor control', () => {
    const onFactorControlsChange = vi.fn();

    render(
      <GoalSection
        factorControls={[
          { factor: 'Shift', targetCondition: 'Day shift', linkedHypothesisId: 'h-linked' },
        ]}
        onFactorControlsChange={onFactorControlsChange}
        confirmedHypotheses={[
          makeHypothesis({
            id: 'h-linked',
            name: 'Already linked',
            status: 'evidence-survived-test',
          }),
          makeHypothesis({
            id: 'h-confirmed',
            name: 'Night shift setup drift',
            synthesis: 'Setup standard varies after handoff',
            status: 'evidence-survived-test',
            condition: { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
          }),
          makeHypothesis({
            id: 'h-candidate',
            name: 'Candidate hypothesis',
            status: 'proposed',
          }),
        ]}
      />
    );

    expect(
      screen.getByRole('button', { name: /use night shift setup drift/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /use candidate hypothesis/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /use already linked/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /use night shift setup drift/i }));

    expect(onFactorControlsChange).toHaveBeenCalledWith([
      { factor: 'Shift', targetCondition: 'Day shift', linkedHypothesisId: 'h-linked' },
      {
        factor: 'Shift',
        targetCondition: 'Target condition for Night shift setup drift',
        linkedHypothesisId: 'h-confirmed',
      },
    ]);
  });

  it('adds, removes, and edits factor control rows', () => {
    const onFactorControlsChange = vi.fn();
    const factorControls = [
      { factor: 'Shift', targetCondition: 'Day shift', linkedHypothesisId: 'h-1' },
      { factor: 'Machine', targetCondition: 'Calibrated' },
    ];

    render(
      <GoalSection
        factorControls={factorControls}
        onFactorControlsChange={onFactorControlsChange}
        confirmedHypotheses={[
          makeHypothesis({ id: 'h-1', name: 'Shift effect', status: 'evidence-survived-test' }),
          makeHypothesis({ id: 'h-2', name: 'Machine effect', status: 'evidence-survived-test' }),
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add factor control/i }));
    expect(onFactorControlsChange).toHaveBeenNthCalledWith(1, [
      ...factorControls,
      { factor: '', targetCondition: '', linkedHypothesisId: undefined },
    ]);

    const rows = screen.getAllByTestId('goal-factor-control-row');
    fireEvent.change(within(rows[0]).getByLabelText(/factor/i), {
      target: { value: 'Team' },
    });
    fireEvent.change(within(rows[1]).getByLabelText(/target condition/i), {
      target: { value: 'PM complete' },
    });
    fireEvent.change(within(rows[1]).getByLabelText(/linked hypothesis/i), {
      target: { value: 'h-2' },
    });
    fireEvent.click(within(rows[0]).getByRole('button', { name: /remove factor control/i }));

    expect(onFactorControlsChange).toHaveBeenNthCalledWith(2, [
      { factor: 'Team', targetCondition: 'Day shift', linkedHypothesisId: 'h-1' },
      factorControls[1],
    ]);
    expect(onFactorControlsChange).toHaveBeenNthCalledWith(3, [
      factorControls[0],
      { factor: 'Machine', targetCondition: 'PM complete' },
    ]);
    expect(onFactorControlsChange).toHaveBeenNthCalledWith(4, [
      factorControls[0],
      { factor: 'Machine', targetCondition: 'Calibrated', linkedHypothesisId: 'h-2' },
    ]);
    expect(onFactorControlsChange).toHaveBeenNthCalledWith(5, [factorControls[1]]);
  });

  it('keeps mechanism goals optional and emits description plus linked finding IDs', () => {
    const onMechanismGoalsChange = vi.fn();

    render(
      <GoalSection
        mechanismGoals={[
          { description: 'Standardize handoff checks', linkedFindingIds: ['finding-1'] },
        ]}
        onMechanismGoalsChange={onMechanismGoalsChange}
        findingOptions={[
          { id: 'finding-1', label: 'Night handoff gap' },
          { id: 'finding-2', label: 'Calibration drift' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add mechanism goal/i }));
    expect(onMechanismGoalsChange).toHaveBeenNthCalledWith(1, [
      { description: 'Standardize handoff checks', linkedFindingIds: ['finding-1'] },
      { description: '', linkedFindingIds: [] },
    ]);

    const row = screen.getByTestId('goal-mechanism-goal-row');
    fireEvent.change(within(row).getByLabelText(/mechanism description/i), {
      target: { value: 'Pilot setup checklist' },
    });
    const findingsSelect = within(row).getByLabelText(/linked findings/i) as HTMLSelectElement;
    for (const option of Array.from(findingsSelect.options)) {
      option.selected = option.value === 'finding-1' || option.value === 'finding-2';
    }
    fireEvent.change(findingsSelect);

    expect(onMechanismGoalsChange).toHaveBeenNthCalledWith(2, [
      { description: 'Pilot setup checklist', linkedFindingIds: ['finding-1'] },
    ]);
    expect(onMechanismGoalsChange).toHaveBeenNthCalledWith(3, [
      { description: 'Standardize handoff checks', linkedFindingIds: ['finding-1', 'finding-2'] },
    ]);
  });

  it('removes a mechanism goal row and emits the full next array', () => {
    const onMechanismGoalsChange = vi.fn();
    const mechanismGoals = [
      { description: 'Standardize handoff checks', linkedFindingIds: ['finding-1'] },
      { description: 'Stabilize calibration routine', linkedFindingIds: ['finding-2'] },
    ];

    render(
      <GoalSection
        mechanismGoals={mechanismGoals}
        onMechanismGoalsChange={onMechanismGoalsChange}
        findingOptions={[
          { id: 'finding-1', label: 'Night handoff gap' },
          { id: 'finding-2', label: 'Calibration drift' },
        ]}
      />
    );

    const rows = screen.getAllByTestId('goal-mechanism-goal-row');
    fireEvent.click(within(rows[0]).getByRole('button', { name: /remove mechanism goal/i }));

    expect(onMechanismGoalsChange).toHaveBeenCalledTimes(1);
    expect(onMechanismGoalsChange).toHaveBeenCalledWith([mechanismGoals[1]]);
  });
});

describe('ImprovementProjectForm goal integration', () => {
  it('renders GoalSection in section three when goal props are provided', () => {
    render(
      <ImprovementProjectForm
        goalProps={{
          freeText: 'Improve first-pass yield',
          outcomeOptions: [{ id: 'yield', label: 'First pass yield' }],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Goal' }));

    expect(screen.getByLabelText(/fallback goal/i)).toHaveValue('Improve first-pass yield');
  });

  it('keeps sectionContent goal override ahead of goal props', () => {
    render(
      <ImprovementProjectForm
        goalProps={{ freeText: 'Improve first-pass yield' }}
        sectionContent={{ goal: <div>Custom goal override</div> }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Goal' }));

    expect(screen.getByText('Custom goal override')).toBeInTheDocument();
    expect(screen.queryByLabelText(/fallback goal/i)).not.toBeInTheDocument();
  });
});
