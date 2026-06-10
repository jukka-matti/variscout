import React from 'react';
import {
  freezeBaseline,
  toNumericValue,
  type ControlBaseline,
  type ControlRecord,
  type ControlReview,
  type DataRow,
  type SpecLimits,
  type SustainmentComparison,
} from '@variscout/core';
import type {
  ImprovementProjectFactorControl,
  ImprovementProjectGoal,
  ImprovementProjectMechanismGoal,
} from '@variscout/core/improvementProject';
import { CollapsibleSection } from '../ImprovementProject/CollapsibleSection';

export interface ControlFormProps {
  record: ControlRecord;
  reviews?: ControlReview[];
  rawData?: DataRow[];
  timeColumn?: string | null;
  specs?: Pick<SpecLimits, 'usl' | 'lsl' | 'target'>;
  comparison?: SustainmentComparison | null;
  onRecordChange?: (patch: ControlRecordChangePatch) => void;
  onLogRecheck?: (input: ControlReviewLogInput) => void;
}

export type ControlRecordChangePatch = Partial<
  Omit<ControlRecord, 'id' | 'createdAt' | 'hubId' | 'projectId' | 'updatedAt' | 'deletedAt'>
>;

export type ControlReviewLogInput = Pick<
  ControlReview,
  'verdict' | 'nowStats' | 'dataStamp' | 'observation'
>;

const labelClassName = 'block space-y-2';
const labelTextClassName = 'text-sm font-medium text-content';
const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const disabledInputClassName = `${inputClassName} disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-content/60`;
const metadataClassName =
  'rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content/70';
const buttonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClassName =
  'rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';

function formatLabel(value: string | undefined): string {
  return value?.replaceAll('-', ' ') ?? 'not set';
}

function formatDate(value: string | number | undefined): string {
  if (value === undefined) return 'not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'not set';

  return date.toISOString().slice(0, 10);
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return 'not set';
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function dateInputValue(value: string | number | undefined): string {
  return formatDate(value) === 'not set' ? '' : formatDate(value);
}

function toISODate(value: string): string {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed) && value.includes('T')) return new Date(parsed).toISOString();
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function addDaysISO(anchorISO: string, days: number): string {
  const date = new Date(anchorISO);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function normalizedLadderValue(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 7;
}

function normalizedLadder(ladder: number[] | undefined): number[] {
  const parsed = (ladder?.length ? ladder : [7, 30, 90, 180])
    .map(normalizedLadderValue)
    .filter(days => days > 0);
  return parsed.length > 0 ? parsed : [7];
}

function deriveMeasureOptions(
  rows: DataRow[],
  timeColumn: string | null | undefined,
  currentMeasure: string
): string[] {
  const columns = new Set<string>(currentMeasure ? [currentMeasure] : []);
  for (const row of rows.slice(0, 25)) {
    for (const key of Object.keys(row)) {
      if (key === timeColumn) continue;
      if (toNumericValue(row[key]) !== undefined) columns.add(key);
    }
  }
  return [...columns].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function dataTimestampRange(
  rows: DataRow[],
  timeColumn: string | null | undefined
): { startISO: string; endISO: string } | undefined {
  if (!timeColumn) return undefined;
  let start: Date | undefined;
  let end: Date | undefined;
  for (const row of rows) {
    const value = row[timeColumn];
    const parsed =
      typeof value === 'number' || typeof value === 'string' ? new Date(value) : undefined;
    if (!parsed || Number.isNaN(parsed.getTime())) continue;
    if (!start || parsed.getTime() < start.getTime()) start = parsed;
    if (!end || parsed.getTime() > end.getTime()) end = parsed;
  }
  if (!start || !end) return undefined;
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function afterWindow(
  record: ControlRecord,
  comparison: SustainmentComparison | null | undefined
): { startISO: string; endISO: string } {
  return (
    comparison?.phases?.afterLimits?.window ?? {
      startISO: record.improvementDate,
      endISO: record.improvementDate,
    }
  );
}

function renderFactorControl(control: ImprovementProjectFactorControl, index: number) {
  return (
    <li key={`${control.factor}-${index}`} className="space-y-1">
      <div className="font-medium text-content">{control.factor || 'Unnamed factor'}</div>
      <div className="text-content/70">{control.targetCondition || 'Target condition not set'}</div>
    </li>
  );
}

function renderMechanismGoal(goal: ImprovementProjectMechanismGoal, index: number) {
  return (
    <li key={`${goal.description}-${index}`} className="text-content/80">
      {goal.description || 'Mechanism goal not set'}
    </li>
  );
}

function GoalCarryForward({ goal }: { goal?: ImprovementProjectGoal }) {
  if (!goal) {
    return <p className="text-sm text-content/60">No carried-forward goal.</p>;
  }

  // Legacy first-outcome read — multi-outcome rendering is later phases
  // (Spec 2 §3.2.2 / PR-CCJ-C1).
  const outcome = goal.outcomeGoals[0];
  const factorControls = goal.factorControls ?? [];
  const mechanismGoals = goal.mechanismGoals ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-2" aria-labelledby="sustainment-goal-y-heading">
        <h3 id="sustainment-goal-y-heading" className="text-sm font-semibold text-content">
          Y-level outcome target
        </h3>
        {outcome ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-content/60">Outcome spec</dt>
              <dd className="font-medium text-content">{outcome.outcomeSpecId}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              {outcome.baseline !== undefined && (
                <span className={metadataClassName}>Baseline {outcome.baseline}</span>
              )}
              <span className={metadataClassName}>Target {outcome.target}</span>
              {outcome.deadline && (
                <span className={metadataClassName}>Due {outcome.deadline}</span>
              )}
            </div>
          </dl>
        ) : (
          <p className="text-sm text-content/60">No outcome target set.</p>
        )}
        {goal.freeText && <p className="text-sm text-content/70">{goal.freeText}</p>}
      </section>

      <section className="space-y-2" aria-labelledby="sustainment-goal-x-heading">
        <h3 id="sustainment-goal-x-heading" className="text-sm font-semibold text-content">
          X-level factor controls
        </h3>
        {factorControls.length > 0 ? (
          <ul className="space-y-3 text-sm">{factorControls.map(renderFactorControl)}</ul>
        ) : (
          <p className="text-sm text-content/60">No factor controls.</p>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="sustainment-goal-little-x-heading">
        <h3 id="sustainment-goal-little-x-heading" className="text-sm font-semibold text-content">
          x-level mechanism goals
        </h3>
        {mechanismGoals.length > 0 ? (
          <ul className="space-y-2 text-sm">{mechanismGoals.map(renderMechanismGoal)}</ul>
        ) : (
          <p className="text-sm text-content/60">No mechanism goals.</p>
        )}
      </section>
    </div>
  );
}

export const ControlForm: React.FC<ControlFormProps> = ({
  record,
  reviews = [],
  rawData = [],
  timeColumn,
  specs,
  comparison,
  onRecordChange,
  onLogRecheck,
}) => {
  const isReadOnly = !onRecordChange;
  const isLoggerReadOnly = !onLogRecheck;
  const ladder = record.ladder?.length ? record.ladder : [7];
  const ladderStep = Number.isFinite(record.ladderStep) ? record.ladderStep : 0;
  const [title, setTitle] = React.useState(record.title);
  const [targetSummary, setTargetSummary] = React.useState(record.targetSummary ?? '');
  const [improvementDate, setImprovementDate] = React.useState(
    dateInputValue(record.improvementDate)
  );
  const [measure, setMeasure] = React.useState(record.baseline.measure);
  const [ladderValues, setLadderValues] = React.useState(normalizedLadder(record.ladder));
  const [verdict, setVerdict] = React.useState<ControlReview['verdict']>('holding');
  const [observation, setObservation] = React.useState('');

  React.useEffect(() => {
    setTitle(record.title);
    setTargetSummary(record.targetSummary ?? '');
    setImprovementDate(dateInputValue(record.improvementDate));
    setMeasure(record.baseline.measure);
    setLadderValues(normalizedLadder(record.ladder));
  }, [record]);

  const measureOptions = React.useMemo(
    () => deriveMeasureOptions(rawData, timeColumn, measure),
    [measure, rawData, timeColumn]
  );
  const parsedLadder = React.useMemo(() => normalizedLadder(ladderValues), [ladderValues]);
  const baselinePreview = React.useMemo<{ baseline?: ControlBaseline; error?: string }>(() => {
    if (!timeColumn) return { error: 'Select a time column to freeze the baseline.' };
    if (!measure) return { error: 'Select a measure to freeze the baseline.' };
    if (!improvementDate) return { error: 'Select an improvement date.' };
    try {
      return {
        baseline: freezeBaseline({
          rows: rawData,
          timeColumn,
          improvementDate: toISODate(improvementDate),
          measure,
          specs,
        }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not freeze baseline.' };
    }
  }, [improvementDate, measure, rawData, specs, timeColumn]);

  const nowStats = comparison?.after
    ? {
        window: afterWindow(record, comparison),
        n: comparison.after.n,
        mean: comparison.after.mean,
        sigma: comparison.after.sigma,
        ...(comparison.after.cpk !== undefined ? { cpk: comparison.after.cpk } : {}),
      }
    : null;
  const rowTimestampRange = dataTimestampRange(rawData, timeColumn);
  const dataStamp = {
    rowCount: rawData.length,
    ...(rowTimestampRange ? { rowTimestampRange } : {}),
  };

  const saveSetup = () => {
    const nextImprovementDate = toISODate(improvementDate);
    onRecordChange?.({
      title,
      targetSummary,
      improvementDate: nextImprovementDate,
      ...(baselinePreview.baseline ? { baseline: baselinePreview.baseline } : {}),
      ladder: parsedLadder,
      ladderStep: 0,
      nextCheckSuggestedAt: addDaysISO(nextImprovementDate, parsedLadder[0] ?? 7),
    });
  };

  const updateLadderValue = (index: number, nextValue: string) => {
    const days = normalizedLadderValue(Number(nextValue));
    setLadderValues(current => current.map((value, i) => (i === index ? days : value)));
  };

  const removeLadderValue = (index: number) => {
    setLadderValues(current => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [7];
    });
  };

  const addLadderValue = () => {
    setLadderValues(current => [...current, current.at(-1) ?? 7]);
  };

  const logReview = () => {
    if (!nowStats) return;
    onLogRecheck?.({
      verdict,
      observation,
      nowStats,
      dataStamp,
    });
    setObservation('');
  };

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Control setup" defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>Title</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={title}
              onChange={event => setTitle(event.currentTarget.value)}
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            <span className={labelTextClassName}>Target summary</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isReadOnly}
              value={targetSummary}
              onChange={event => setTargetSummary(event.currentTarget.value)}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Improvement date</span>
            <input
              type="date"
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={improvementDate}
              onChange={event => setImprovementDate(event.currentTarget.value)}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Measure binding</span>
            <select
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={measure}
              onChange={event => setMeasure(event.currentTarget.value)}
            >
              {measureOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 md:col-span-2">
            <span className={labelTextClassName}>Verification ladder days</span>
            <div className="flex flex-wrap items-center gap-2">
              {ladderValues.map((days, index) => (
                <div
                  key={`ladder-${index}`}
                  className="flex items-center gap-1 rounded-md border border-edge bg-surface-secondary p-1"
                >
                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded border border-edge bg-surface px-2 py-1 text-sm text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:text-content/60"
                    disabled={isReadOnly}
                    aria-label={`Ladder interval ${index + 1} days`}
                    value={days}
                    onChange={event => updateLadderValue(index, event.currentTarget.value)}
                  />
                  <span className="pr-1 text-xs text-content/60">days</span>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-content/70 hover:bg-surface"
                    disabled={isReadOnly || ladderValues.length === 1}
                    aria-label={`Remove ladder interval ${index + 1}`}
                    onClick={() => removeLadderValue(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={buttonClassName}
                disabled={isReadOnly}
                onClick={addLadderValue}
              >
                Add interval
              </button>
            </div>
          </div>

          <dl className="grid gap-2 text-sm md:col-span-2 md:grid-cols-4">
            <div>
              <dt className="text-content/60">Owner</dt>
              <dd className="font-medium text-content">{record.owner?.displayName ?? 'not set'}</dd>
            </div>
            <div>
              <dt className="text-content/60">Frozen baseline n</dt>
              <dd className="font-medium text-content">
                {baselinePreview.baseline ? baselinePreview.baseline.n : 'not set'}
              </dd>
            </div>
            <div>
              <dt className="text-content/60">Frozen mean</dt>
              <dd className="font-medium text-content">
                {formatNumber(baselinePreview.baseline?.mean)}
              </dd>
            </div>
            <div>
              <dt className="text-content/60">Frozen sigma</dt>
              <dd className="font-medium text-content">
                {formatNumber(baselinePreview.baseline?.sigma)}
              </dd>
            </div>
          </dl>

          {baselinePreview.error && (
            <p className="text-sm text-content/60 md:col-span-2">{baselinePreview.error}</p>
          )}

          <div className="md:col-span-2">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={isReadOnly}
              onClick={saveSetup}
            >
              Save setup and freeze baseline
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Current status" defaultOpen>
        <dl className="grid gap-3 md:grid-cols-3">
          <div>
            <dt className="text-content/60">Status</dt>
            <dd className="mt-1 font-medium text-content">{formatLabel(record.status)}</dd>
          </div>
          <div>
            <dt className="text-content/60">Ladder step</dt>
            <dd className="mt-1 font-medium text-content">
              {ladderStep + 1} of {ladder.length}
            </dd>
          </div>
          <div>
            <dt className="text-content/60">Baseline</dt>
            <dd className="mt-1 font-medium text-content">
              {record.baseline ? `${record.baseline.measure} · n=${record.baseline.n}` : 'not set'}
            </dd>
          </div>
          <div>
            <dt className="text-content/60">Next suggested re-check</dt>
            <dd className="mt-1 font-medium text-content">
              {formatDate(record.nextCheckSuggestedAt)}
            </dd>
          </div>
        </dl>
      </CollapsibleSection>

      <CollapsibleSection title="Log re-check" defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className={labelTextClassName}>Analyst verdict</legend>
            {(['holding', 'drifted', 'inconclusive'] as const).map(option => (
              <label key={option} className="mr-4 inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="control-review-verdict"
                  value={option}
                  disabled={isLoggerReadOnly}
                  checked={verdict === option}
                  onChange={() => setVerdict(option)}
                />
                {formatLabel(option)}
              </label>
            ))}
          </fieldset>

          <dl className="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <dt className="text-content/60">Now n</dt>
              <dd className="font-medium text-content">{nowStats ? nowStats.n : 'not set'}</dd>
            </div>
            <div>
              <dt className="text-content/60">Now mean</dt>
              <dd className="font-medium text-content">{formatNumber(nowStats?.mean)}</dd>
            </div>
            <div>
              <dt className="text-content/60">Now sigma</dt>
              <dd className="font-medium text-content">{formatNumber(nowStats?.sigma)}</dd>
            </div>
            <div className="md:col-span-3">
              <dt className="text-content/60">Data stamp</dt>
              <dd className="font-medium text-content">
                {dataStamp.rowTimestampRange
                  ? `${dataStamp.rowCount} rows · ${formatDate(dataStamp.rowTimestampRange.startISO)} to ${formatDate(dataStamp.rowTimestampRange.endISO)}`
                  : `${dataStamp.rowCount} rows`}
              </dd>
            </div>
          </dl>

          <label className={`${labelClassName} md:col-span-2`}>
            <span className={labelTextClassName}>Observation</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isLoggerReadOnly}
              value={observation}
              onChange={event => setObservation(event.currentTarget.value)}
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="button"
              className={buttonClassName}
              disabled={isLoggerReadOnly || !nowStats}
              onClick={logReview}
            >
              Log re-check
            </button>
            {!nowStats && (
              <p className="mt-2 text-sm text-content/60">
                Re-ingest post-improvement data before logging a re-check.
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Review history" defaultOpen>
        {reviews.length > 0 ? (
          <ol className="space-y-3">
            {reviews.map(review => (
              <li key={review.id} className="border-b border-edge pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-content">
                    Review verdict: {formatLabel(review.verdict)}
                  </span>
                  <span className={metadataClassName}>{formatDate(review.reviewedAt)}</span>
                  {review.snapshotId && (
                    <span className={metadataClassName}>Snapshot {review.snapshotId}</span>
                  )}
                </div>
                {review.observation && (
                  <p className="mt-2 text-sm text-content/80">{review.observation}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-content/60">No reviews logged.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Goal carry-forward" defaultOpen>
        <GoalCarryForward goal={record.goal} />
      </CollapsibleSection>
    </div>
  );
};
