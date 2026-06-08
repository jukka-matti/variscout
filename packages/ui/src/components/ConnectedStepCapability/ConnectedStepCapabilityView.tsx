import React from 'react';
import { StepErrorPareto } from '@variscout/charts';
import type { CapabilityBoxplotNode, StepErrorParetoStep } from '@variscout/charts';
import { formatStatistic } from '@variscout/core/i18n';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ProcessMap } from '@variscout/core/frame';
import type { DataRow, StepTimingBinding } from '@variscout/core';
import {
  deriveConnectedStepCapability,
  type ConnectedStepCapabilityMode,
  type ConnectedStepCapabilityStep,
  type ConnectedStepValueRole,
} from './deriveConnectedStepCapability';
import { deriveConnectedStepTime, type ConnectedStepTimeStep } from './deriveConnectedStepTime';

export interface ConnectedStepCapabilityViewProps {
  map: ProcessMap;
  stepCards: ReadonlyArray<CanvasStepCardModel>;
  capabilityNodes: ReadonlyArray<CapabilityBoxplotNode>;
  errorSteps: ReadonlyArray<StepErrorParetoStep>;
  valueRolesByStepId?: Readonly<Record<string, ConnectedStepValueRole>>;
  rows?: readonly DataRow[];
  stepTimings?: readonly StepTimingBinding[];
}

const flagClass: Record<ConnectedStepCapabilityStep['flag'], string> = {
  none: 'bg-surface-secondary text-content-secondary border-edge',
  'no-data': 'bg-surface-secondary text-content-muted border-edge',
  'no-specs': 'bg-status-warning-soft text-status-warning border-status-warning/30',
  review: 'bg-status-warning-soft text-status-warning border-status-warning/30',
  capable: 'bg-status-pass-soft text-status-pass border-status-pass/30',
  watch: 'bg-status-fail-soft text-status-fail border-status-fail/30',
};

function flagLabel(flag: ConnectedStepCapabilityStep['flag']): string {
  if (flag === 'capable') return 'Capable';
  if (flag === 'watch') return 'Watch';
  if (flag === 'review') return 'Review';
  if (flag === 'no-specs') return 'Specs';
  if (flag === 'no-data') return 'No data';
  return 'Step';
}

function capabilitySummary(step: ConnectedStepCapabilityStep): string {
  if (step.capability.values.length === 0) return 'Cpk unavailable';
  const low = Math.min(...step.capability.values);
  const high = Math.max(...step.capability.values);
  const target = step.capability.target ?? 1.33;
  return `${formatStatistic(low, 'en', 2)}-${formatStatistic(high, 'en', 2)} Cpk · target ${formatStatistic(target, 'en', 2)}`;
}

function valuesSummary(step: ConnectedStepCapabilityStep): string {
  if (step.values.raw.length === 0) return 'No values';
  const low = Math.min(...step.values.raw);
  const high = Math.max(...step.values.raw);
  const basis = step.values.baselineKind === 'spec-window' ? 'spec window' : 'zero baseline';
  return `${formatStatistic(low, 'en', 1)}-${formatStatistic(high, 'en', 1)} · ${basis}`;
}

function formatDurationMs(ms: number): string {
  if (ms >= 60 * 60 * 1000) {
    return `${formatStatistic(ms / (60 * 60 * 1000), 'en', 1)} hr`;
  }
  if (ms >= 60 * 1000) {
    return `${formatStatistic(ms / (60 * 1000), 'en', 0)} min`;
  }
  if (ms >= 1000) {
    return `${formatStatistic(ms / 1000, 'en', 1)} sec`;
  }
  return `${formatStatistic(ms, 'en', 0)} ms`;
}

function timeSummary(timeStep: ConnectedStepTimeStep | undefined): string {
  if (!timeStep || timeStep.durationsMs.length === 0) return 'No timing';
  const median = timeStep.durationBoxplot?.median ?? timeStep.durationsMs[0]!;
  const rate = timeStep.outputRate
    ? ` · ${formatStatistic(timeStep.outputRate.averageRatePerHour, 'en', 1)}/hr`
    : '';
  return `${formatDurationMs(median)}${rate}`;
}

function StepBox({
  step,
  timeStep,
  mode,
  active,
}: {
  step: ConnectedStepCapabilityStep;
  timeStep: ConnectedStepTimeStep | undefined;
  mode: ConnectedStepCapabilityMode;
  active: boolean;
}) {
  const summary =
    mode === 'capability'
      ? capabilitySummary(step)
      : mode === 'time'
        ? timeSummary(timeStep)
        : valuesSummary(step);
  const cpkStats = step.capability.boxplot;
  const cpkTarget = step.capability.target ?? 1.33;
  const cpkDomainMax = Math.max(cpkStats?.max ?? 0, cpkTarget, 2);
  const cpkPosition = (value: number) => Math.max(0, Math.min(100, (value / cpkDomainMax) * 100));
  const valueStats = step.values.boxplot;
  const timeStats = timeStep?.durationBoxplot ?? null;
  const timeDomainMax = Math.max(timeStats?.max ?? 0, 1);
  const valuePosition = (value: number) => {
    const span = Math.max(step.values.upper - step.values.lower, 1);
    return Math.max(0, Math.min(100, ((value - step.values.lower) / span) * 100));
  };
  const timePosition = (value: number) => Math.max(0, Math.min(100, (value / timeDomainMax) * 100));
  const activeStats = mode === 'capability' ? cpkStats : mode === 'time' ? timeStats : valueStats;
  const position =
    mode === 'capability' ? cpkPosition : mode === 'time' ? timePosition : valuePosition;
  const targetPosition =
    mode === 'capability'
      ? cpkPosition(cpkTarget)
      : mode === 'values' && step.values.target !== undefined
        ? valuePosition(step.values.target)
        : undefined;
  const constrained = mode === 'time' && timeStep?.isConstraint === true;

  return (
    <div
      data-testid={`connected-step-box-${step.stepId}`}
      data-step-id={step.stepId}
      data-active={active ? 'true' : 'false'}
      data-constraint={constrained ? 'true' : 'false'}
      className={[
        'min-w-32 flex-1 rounded-md border p-2 transition-colors',
        constrained
          ? 'border-status-warning bg-status-warning-soft/40'
          : active
            ? 'border-focus-ring bg-surface-secondary'
            : 'border-edge bg-surface-primary',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-content">{step.label}</span>
        <div className="flex shrink-0 items-center gap-1">
          {constrained ? (
            <span className="rounded-full border border-status-warning/30 bg-status-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-status-warning">
              Constraint
            </span>
          ) : null}
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${flagClass[step.flag]}`}
          >
            {flagLabel(step.flag)}
          </span>
        </div>
      </div>
      <div
        className="relative h-8 rounded bg-surface-secondary"
        data-testid={`connected-step-boxplot-${step.stepId}`}
      >
        {activeStats ? (
          <>
            <div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-content-secondary"
              style={{
                left: `${position(activeStats.min)}%`,
                width: `${Math.max(2, position(activeStats.max) - position(activeStats.min))}%`,
              }}
              data-testid={`connected-step-whisker-${step.stepId}`}
              aria-hidden="true"
            />
            <div
              className="absolute top-1/2 h-4 -translate-y-1/2 rounded-sm border border-content bg-surface-primary"
              style={{
                left: `${position(activeStats.q1)}%`,
                width: `${Math.max(3, position(activeStats.q3) - position(activeStats.q1))}%`,
              }}
              data-testid={`connected-step-iqr-${step.stepId}`}
              aria-hidden="true"
            />
            <div
              className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 bg-content"
              style={{ left: `${position(activeStats.median)}%` }}
              data-testid={`connected-step-median-${step.stepId}`}
              aria-hidden="true"
            />
            {targetPosition !== undefined ? (
              <div
                className="absolute inset-y-1 w-0.5 bg-status-info"
                style={{ left: `${targetPosition}%` }}
                data-testid={`connected-step-target-${step.stepId}`}
                aria-hidden="true"
              />
            ) : null}
          </>
        ) : null}
        {mode === 'values' && step.values.baselineKind === 'spec-window' ? (
          <div
            className="absolute inset-y-1 left-0 right-0 rounded border border-dashed border-status-info/50 bg-status-info-soft/40"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className="mt-2 truncate text-[11px] text-content-secondary">{summary}</p>
    </div>
  );
}

export function ConnectedStepCapabilityView({
  map,
  stepCards,
  capabilityNodes,
  errorSteps,
  valueRolesByStepId,
  rows = [],
  stepTimings = [],
}: ConnectedStepCapabilityViewProps): React.JSX.Element | null {
  const [mode, setMode] = React.useState<ConnectedStepCapabilityMode>('capability');
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null);
  const timeModel = React.useMemo(
    () => deriveConnectedStepTime({ map, rows, stepTimings }),
    [map, rows, stepTimings]
  );
  const selectedMode: ConnectedStepCapabilityMode =
    mode === 'time' && !timeModel.hasTimeData ? 'capability' : mode;
  const model = React.useMemo(
    () =>
      deriveConnectedStepCapability({
        map,
        mode: selectedMode,
        stepCards,
        capabilityNodes,
        errorSteps,
        valueRolesByStepId,
      }),
    [capabilityNodes, errorSteps, map, selectedMode, stepCards, valueRolesByStepId]
  );
  const timeStepsById = React.useMemo(
    () => new Map(timeModel.steps.map(step => [step.stepId, step])),
    [timeModel.steps]
  );
  const availableModes = React.useMemo<ConnectedStepCapabilityMode[]>(
    () => (timeModel.hasTimeData ? ['values', 'capability', 'time'] : ['values', 'capability']),
    [timeModel.hasTimeData]
  );

  if (model.steps.length === 0) return null;

  return (
    <section
      className="border-b border-edge bg-surface px-4 py-3"
      data-testid="connected-step-capability-view"
      aria-label="Per-step capability"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-content">Per-step capability</h3>
          {model.hasBranching ? (
            <p
              className="text-xs text-content-secondary"
              data-testid="connected-step-branching-note"
            >
              Linked flow and capability strip share step focus for branching maps.
            </p>
          ) : null}
        </div>
        <div className="inline-flex rounded-md border border-edge bg-surface-secondary p-0.5">
          {availableModes.map(nextMode => (
            <button
              key={nextMode}
              type="button"
              aria-pressed={selectedMode === nextMode}
              onClick={() => setMode(nextMode)}
              className={[
                'rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                selectedMode === nextMode
                  ? 'bg-surface-primary text-content shadow-sm'
                  : 'text-content-secondary hover:text-content',
              ].join(' ')}
            >
              {nextMode === 'values' ? 'Values' : nextMode === 'time' ? 'Time' : 'Capability'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <div
            className="mb-2 flex gap-2 overflow-x-auto pb-1"
            data-testid="connected-step-flow-rail"
          >
            {model.steps.map(step => {
              const active = activeStepId === step.stepId;
              return (
                <button
                  key={step.stepId}
                  type="button"
                  data-testid={`connected-step-node-${step.stepId}`}
                  data-step-id={step.stepId}
                  data-active={active ? 'true' : 'false'}
                  data-constraint={
                    selectedMode === 'time' && timeStepsById.get(step.stepId)?.isConstraint
                      ? 'true'
                      : 'false'
                  }
                  onMouseEnter={() => setActiveStepId(step.stepId)}
                  onFocus={() => setActiveStepId(step.stepId)}
                  onMouseLeave={() => setActiveStepId(null)}
                  onBlur={() => setActiveStepId(null)}
                  className={[
                    'min-w-32 flex-1 rounded-md border px-3 py-2 text-left transition-colors',
                    selectedMode === 'time' && timeStepsById.get(step.stepId)?.isConstraint
                      ? 'border-status-warning bg-status-warning-soft/40'
                      : active
                        ? 'border-focus-ring bg-surface-secondary'
                        : 'border-edge bg-surface-primary',
                  ].join(' ')}
                >
                  <span className="block truncate text-xs font-semibold text-content">
                    {step.label}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${flagClass[step.flag]}`}
                  >
                    {flagLabel(step.flag)}
                  </span>
                  {selectedMode === 'time' && timeStepsById.get(step.stepId)?.isConstraint ? (
                    <span className="ml-1 mt-1 inline-block rounded-full border border-status-warning/30 bg-status-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-status-warning">
                      Constraint
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            data-testid={
              selectedMode === 'time' ? 'connected-step-time-axis' : 'connected-step-box-strip'
            }
          >
            {model.steps.map(step => (
              <StepBox
                key={step.stepId}
                step={step}
                timeStep={timeStepsById.get(step.stepId)}
                mode={selectedMode}
                active={activeStepId === step.stepId}
              />
            ))}
          </div>
        </div>
        <div className="min-h-40 rounded-md border border-edge bg-surface-primary p-2">
          <StepErrorPareto steps={model.errorSteps} />
        </div>
      </div>
    </section>
  );
}

export default ConnectedStepCapabilityView;
