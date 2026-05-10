import React from 'react';
import type {
  ImprovementProjectFactorControl,
  ImprovementProjectMechanismGoal,
  ImprovementProjectOutcomeGoal,
} from '@variscout/core/improvementProject';
import type { Hypothesis, HypothesisCondition } from '@variscout/core/findings';

export interface GoalSectionProps {
  outcomeGoal?: Partial<ImprovementProjectOutcomeGoal>;
  freeText?: string;
  onOutcomeGoalChange?: (goal: Partial<ImprovementProjectOutcomeGoal>) => void;
  onFreeTextChange?: (value: string) => void;
  outcomeOptions?: Array<{ id: string; label: string; baseline?: number; target?: number }>;
  factorControls?: ImprovementProjectFactorControl[];
  onFactorControlsChange?: (controls: ImprovementProjectFactorControl[]) => void;
  confirmedHypotheses?: Hypothesis[];
  mechanismGoals?: ImprovementProjectMechanismGoal[];
  onMechanismGoalsChange?: (goals: ImprovementProjectMechanismGoal[]) => void;
  findingOptions?: Array<{ id: string; label: string }>;
}

const panelClassName = 'rounded-md border border-edge bg-surface-secondary p-4';
const labelClassName = 'block space-y-2';
const labelTextClassName = 'text-sm font-medium text-content';
const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const secondaryButtonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';
const smallButtonClassName =
  'rounded-md border border-edge bg-surface px-2 py-1 text-xs font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstLeafColumn(condition: HypothesisCondition | undefined): string | undefined {
  if (!condition) return undefined;
  if (condition.kind === 'leaf') return condition.column;
  if (condition.kind === 'not') return firstLeafColumn(condition.child);
  for (const child of condition.children) {
    const column = firstLeafColumn(child);
    if (column) return column;
  }
  return undefined;
}

function confirmedOnly(hypotheses: Hypothesis[] = []): Hypothesis[] {
  return hypotheses.filter(hypothesis => hypothesis.status === 'confirmed');
}

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, option => option.value);
}

export const GoalSection: React.FC<GoalSectionProps> = ({
  outcomeGoal = {},
  freeText = '',
  onOutcomeGoalChange,
  onFreeTextChange,
  outcomeOptions = [],
  factorControls = [],
  onFactorControlsChange,
  confirmedHypotheses = [],
  mechanismGoals = [],
  onMechanismGoalsChange,
  findingOptions = [],
}) => {
  const confirmedSuggestions = confirmedOnly(confirmedHypotheses);
  const linkedHypothesisIds = new Set(
    factorControls.map(control => control.linkedHypothesisId).filter(Boolean)
  );
  const unlinkedSuggestions = confirmedSuggestions.filter(
    hypothesis => !linkedHypothesisIds.has(hypothesis.id)
  );
  const yGoalMissing = !outcomeGoal.outcomeSpecId && freeText.trim() === '';

  const emitOutcomeGoal = (patch: Partial<ImprovementProjectOutcomeGoal>) => {
    onOutcomeGoalChange?.({ ...outcomeGoal, ...patch });
  };

  const updateFactorControl = (index: number, patch: Partial<ImprovementProjectFactorControl>) => {
    onFactorControlsChange?.(
      factorControls.map((control, controlIndex) =>
        controlIndex === index ? { ...control, ...patch } : control
      )
    );
  };

  const addSuggestedFactorControl = (hypothesis: Hypothesis) => {
    onFactorControlsChange?.([
      ...factorControls,
      {
        factor: firstLeafColumn(hypothesis.condition) ?? hypothesis.name,
        targetCondition: `Target condition for ${hypothesis.name}`,
        linkedHypothesisId: hypothesis.id,
      },
    ]);
  };

  const updateMechanismGoal = (index: number, patch: Partial<ImprovementProjectMechanismGoal>) => {
    onMechanismGoalsChange?.(
      mechanismGoals.map((goal, goalIndex) => (goalIndex === index ? { ...goal, ...patch } : goal))
    );
  };

  return (
    <div className="space-y-4">
      <section className={panelClassName} aria-labelledby="goal-y-heading">
        <div className="mb-3">
          <h3 id="goal-y-heading" className="text-sm font-semibold text-content">
            Y-level outcome target
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {outcomeOptions.length > 0 && (
            <label className={labelClassName}>
              <span className={labelTextClassName}>Outcome spec</span>
              <select
                className={inputClassName}
                value={outcomeGoal.outcomeSpecId ?? ''}
                aria-invalid={yGoalMissing}
                onChange={event =>
                  emitOutcomeGoal({ outcomeSpecId: event.currentTarget.value || undefined })
                }
              >
                <option value="">Select outcome</option>
                {outcomeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={labelClassName}>
            <span className={labelTextClassName}>Baseline</span>
            <input
              className={inputClassName}
              type="number"
              value={outcomeGoal.baseline ?? ''}
              onChange={event =>
                emitOutcomeGoal({ baseline: parseOptionalNumber(event.currentTarget.value) })
              }
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Target</span>
            <input
              className={inputClassName}
              type="number"
              value={outcomeGoal.target ?? ''}
              onChange={event =>
                emitOutcomeGoal({ target: parseOptionalNumber(event.currentTarget.value) })
              }
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Deadline</span>
            <input
              className={inputClassName}
              type="date"
              value={outcomeGoal.deadline ?? ''}
              onChange={event =>
                emitOutcomeGoal({ deadline: event.currentTarget.value || undefined })
              }
            />
          </label>
        </div>

        <label className={`${labelClassName} mt-3`}>
          <span className={labelTextClassName}>Fallback goal</span>
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            value={freeText}
            aria-invalid={yGoalMissing}
            onChange={event => onFreeTextChange?.(event.currentTarget.value)}
          />
        </label>

        {yGoalMissing && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            Choose an outcome target or describe the goal.
          </p>
        )}
      </section>

      <section className={panelClassName} aria-labelledby="goal-x-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 id="goal-x-heading" className="text-sm font-semibold text-content">
            X-level factor controls
          </h3>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() =>
              onFactorControlsChange?.([
                ...factorControls,
                { factor: '', targetCondition: '', linkedHypothesisId: undefined },
              ])
            }
          >
            Add factor control
          </button>
        </div>

        {unlinkedSuggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {unlinkedSuggestions.map(hypothesis => (
              <button
                key={hypothesis.id}
                type="button"
                className={smallButtonClassName}
                onClick={() => addSuggestedFactorControl(hypothesis)}
              >
                Use {hypothesis.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {factorControls.map((control, index) => (
            <div
              key={`${control.linkedHypothesisId ?? 'factor'}-${index}`}
              data-testid="goal-factor-control-row"
              className="grid gap-3 rounded-md border border-edge bg-surface p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <label className={labelClassName}>
                <span className={labelTextClassName}>Factor</span>
                <input
                  className={inputClassName}
                  value={control.factor}
                  onChange={event =>
                    updateFactorControl(index, { factor: event.currentTarget.value })
                  }
                />
              </label>

              <label className={labelClassName}>
                <span className={labelTextClassName}>Target condition</span>
                <input
                  className={inputClassName}
                  value={control.targetCondition}
                  onChange={event =>
                    updateFactorControl(index, { targetCondition: event.currentTarget.value })
                  }
                />
              </label>

              <label className={labelClassName}>
                <span className={labelTextClassName}>Linked hypothesis</span>
                <select
                  className={inputClassName}
                  value={control.linkedHypothesisId ?? ''}
                  onChange={event =>
                    updateFactorControl(index, {
                      linkedHypothesisId: event.currentTarget.value || undefined,
                    })
                  }
                >
                  <option value="">None</option>
                  {confirmedSuggestions.map(hypothesis => (
                    <option key={hypothesis.id} value={hypothesis.id}>
                      {hypothesis.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  className={smallButtonClassName}
                  onClick={() =>
                    onFactorControlsChange?.(
                      factorControls.filter((_, controlIndex) => controlIndex !== index)
                    )
                  }
                >
                  Remove factor control
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={panelClassName} aria-labelledby="goal-mechanism-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 id="goal-mechanism-heading" className="text-sm font-semibold text-content">
            x-level mechanism goals
          </h3>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() =>
              onMechanismGoalsChange?.([
                ...mechanismGoals,
                { description: '', linkedFindingIds: [] },
              ])
            }
          >
            Add mechanism goal
          </button>
        </div>

        <div className="space-y-3">
          {mechanismGoals.map((goal, index) => (
            <div
              key={`mechanism-${index}`}
              data-testid="goal-mechanism-goal-row"
              className="grid gap-3 rounded-md border border-edge bg-surface p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <label className={labelClassName}>
                <span className={labelTextClassName}>Mechanism description</span>
                <textarea
                  className={`${inputClassName} min-h-24 resize-y`}
                  value={goal.description}
                  onChange={event =>
                    updateMechanismGoal(index, { description: event.currentTarget.value })
                  }
                />
              </label>

              <label className={labelClassName}>
                <span className={labelTextClassName}>Linked findings</span>
                <select
                  multiple
                  className={`${inputClassName} min-h-24`}
                  value={goal.linkedFindingIds ?? []}
                  onChange={event =>
                    updateMechanismGoal(index, {
                      linkedFindingIds: selectedValues(event.currentTarget),
                    })
                  }
                >
                  {findingOptions.map(finding => (
                    <option key={finding.id} value={finding.id}>
                      {finding.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  className={smallButtonClassName}
                  onClick={() =>
                    onMechanismGoalsChange?.(
                      mechanismGoals.filter((_, goalIndex) => goalIndex !== index)
                    )
                  }
                >
                  Remove mechanism goal
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
