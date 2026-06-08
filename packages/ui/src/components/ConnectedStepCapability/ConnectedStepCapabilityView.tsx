import React from 'react';
import { StepErrorPareto } from '@variscout/charts';
import type { CapabilityBoxplotNode, StepErrorParetoStep } from '@variscout/charts';
import { formatStatistic } from '@variscout/core/i18n';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { ProcessMap } from '@variscout/core/frame';
import {
  deriveConnectedStepCapability,
  type ConnectedStepCapabilityMode,
  type ConnectedStepCapabilityStep,
  type ConnectedStepValueRole,
} from './deriveConnectedStepCapability';

export interface ConnectedStepCapabilityViewProps {
  map: ProcessMap;
  stepCards: ReadonlyArray<CanvasStepCardModel>;
  capabilityNodes: ReadonlyArray<CapabilityBoxplotNode>;
  errorSteps: ReadonlyArray<StepErrorParetoStep>;
  valueRolesByStepId?: Readonly<Record<string, ConnectedStepValueRole>>;
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

function StepBox({
  step,
  mode,
  active,
}: {
  step: ConnectedStepCapabilityStep;
  mode: ConnectedStepCapabilityMode;
  active: boolean;
}) {
  const scaled = mode === 'capability' ? step.capability.values : step.values.scaled;
  const min = scaled.length > 0 ? Math.min(...scaled) : 0;
  const max = scaled.length > 0 ? Math.max(...scaled) : 0;
  const left = Math.max(0, Math.min(100, min * 100));
  const width = Math.max(3, Math.min(100 - left, (max - min) * 100));
  const summary = mode === 'capability' ? capabilitySummary(step) : valuesSummary(step);

  return (
    <div
      data-testid={`connected-step-box-${step.stepId}`}
      data-step-id={step.stepId}
      data-active={active ? 'true' : 'false'}
      className={[
        'min-w-32 flex-1 rounded-md border p-2 transition-colors',
        active ? 'border-focus-ring bg-surface-secondary' : 'border-edge bg-surface-primary',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-content">{step.label}</span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${flagClass[step.flag]}`}
        >
          {flagLabel(step.flag)}
        </span>
      </div>
      <div className="relative h-8 rounded bg-surface-secondary">
        {mode === 'values' && step.values.baselineKind === 'spec-window' ? (
          <div
            className="absolute inset-y-1 left-0 right-0 rounded border border-dashed border-status-info/50 bg-status-info-soft/40"
            aria-hidden="true"
          />
        ) : null}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded bg-content"
          style={{ left: `${left}%`, width: `${width}%` }}
          aria-hidden="true"
        />
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
}: ConnectedStepCapabilityViewProps): React.JSX.Element | null {
  const [mode, setMode] = React.useState<ConnectedStepCapabilityMode>('capability');
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null);
  const model = React.useMemo(
    () =>
      deriveConnectedStepCapability({
        map,
        mode,
        stepCards,
        capabilityNodes,
        errorSteps,
        valueRolesByStepId,
      }),
    [capabilityNodes, errorSteps, map, mode, stepCards, valueRolesByStepId]
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
          {(['values', 'capability'] as const).map(nextMode => (
            <button
              key={nextMode}
              type="button"
              aria-pressed={mode === nextMode}
              onClick={() => setMode(nextMode)}
              className={[
                'rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                mode === nextMode
                  ? 'bg-surface-primary text-content shadow-sm'
                  : 'text-content-secondary hover:text-content',
              ].join(' ')}
            >
              {nextMode === 'values' ? 'Values' : 'Capability'}
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
                  onMouseEnter={() => setActiveStepId(step.stepId)}
                  onFocus={() => setActiveStepId(step.stepId)}
                  onMouseLeave={() => setActiveStepId(null)}
                  onBlur={() => setActiveStepId(null)}
                  className={[
                    'min-w-32 flex-1 rounded-md border px-3 py-2 text-left transition-colors',
                    active
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
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" data-testid="connected-step-box-strip">
            {model.steps.map(step => (
              <StepBox
                key={step.stepId}
                step={step}
                mode={mode}
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
