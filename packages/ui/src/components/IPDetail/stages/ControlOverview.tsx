import React from 'react';
import type { ControlRecord } from '@variscout/core';
import ProjectSignalChips from '../ProjectSignalChips';
import type { ProjectOverviewSignals } from '../projectOverviewSignals';

/** Closure checklist inputs derived from Control entities plus local trusted inputs. */
export interface ControlClosureInputs {
  handoffRecorded: boolean;
  handoffSummary?: string;
  ownerAcceptedDefault?: boolean;
  ladderWalked: boolean;
  ladderSummary: string;
  sustainmentConfirmed: boolean;
}

interface ClosureChecklistItem {
  key: 'handoffRecorded' | 'ownerAccepted' | 'ladderReady' | 'sustainmentConfirmed';
  label: string;
  done: boolean;
  description: string;
  control?: React.ReactNode;
}

interface ControlOverviewProps {
  record: ControlRecord;
  onStartHandoff: () => void;
  onOpenProcess: () => void;
  onOpenAnalyze: () => void;
  /** Optional: per-cause in-control rows from caller (Plan 4 wires real data). */
  perCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** Optional closure checklist inputs (folded in from former Handoff stage). */
  closureInputs?: ControlClosureInputs;
  overviewSignals?: ProjectOverviewSignals;
  /** Deprecated by CC-7 trusted owner checkbox; retained as no-op caller compatibility. */
  onNudgeOwner?: () => void;
  /** Called when user clicks "Report · final summary". */
  onOpenReport?: () => void;
  /** Called when user clicks "Export PDF for audit". */
  onExportPdf?: () => void;
}

function buildClosureItems(input: {
  inputs: ControlClosureInputs;
  ownerAccepted: boolean;
  overrideReason: string;
  onOwnerAcceptedChange: (value: boolean) => void;
  onOverrideReasonChange: (value: string) => void;
}): ClosureChecklistItem[] {
  const trimmedOverride = input.overrideReason.trim();
  const ladderReady = input.inputs.ladderWalked || trimmedOverride.length > 0;
  return [
    {
      key: 'handoffRecorded',
      label: 'Handoff recorded',
      done: input.inputs.handoffRecorded,
      description: input.inputs.handoffSummary ?? 'Record the operational handoff before closing',
    },
    {
      key: 'ownerAccepted',
      label: 'Operational owner accepted',
      done: input.ownerAccepted,
      description: 'Trusted acknowledgement for the closeout discussion',
      control: (
        <label className="mt-2 flex items-center gap-2 text-xs text-content-secondary">
          <input
            type="checkbox"
            checked={input.ownerAccepted}
            onChange={event => input.onOwnerAcceptedChange(event.currentTarget.checked)}
          />
          Owner accepted the control
        </label>
      ),
    },
    {
      key: 'ladderReady',
      label: 'Ladder walked or override reason recorded',
      done: ladderReady,
      description: input.inputs.ladderWalked
        ? input.inputs.ladderSummary
        : 'Enter the analyst reason for closing before the full ladder is walked',
      control: input.inputs.ladderWalked ? undefined : (
        <textarea
          aria-label="Analyst override reason"
          value={input.overrideReason}
          onChange={event => input.onOverrideReasonChange(event.currentTarget.value)}
          className="mt-2 min-h-16 w-full rounded-md border border-edge bg-white p-2 text-xs text-content"
          placeholder="Why is closure acceptable before the final planned re-check?"
        />
      ),
    },
    {
      key: 'sustainmentConfirmed',
      label: 'Sustainment confirmed by analyst',
      done: input.inputs.sustainmentConfirmed,
      description: input.inputs.sustainmentConfirmed
        ? 'Record status is confirmed sustained'
        : 'Set the Control record to confirmed sustained before closing',
    },
  ];
}

const ControlOverview: React.FC<ControlOverviewProps> = ({
  record,
  onStartHandoff,
  onOpenProcess,
  onOpenAnalyze,
  perCauseRows = [],
  closureInputs,
  overviewSignals,
  onOpenReport,
  onExportPdf,
}) => {
  const [ownerAccepted, setOwnerAccepted] = React.useState(
    closureInputs?.ownerAcceptedDefault ?? false
  );
  const [overrideReason, setOverrideReason] = React.useState('');

  React.useEffect(() => {
    setOwnerAccepted(closureInputs?.ownerAcceptedDefault ?? false);
    setOverrideReason('');
  }, [
    closureInputs?.handoffRecorded,
    closureInputs?.ladderWalked,
    closureInputs?.ownerAcceptedDefault,
    closureInputs?.sustainmentConfirmed,
  ]);

  const isDrifted = record.status === 'drifted';
  const isConfirmed = record.status === 'confirmed-sustained';
  const closureItems = closureInputs
    ? buildClosureItems({
        inputs: closureInputs,
        ownerAccepted,
        overrideReason,
        onOwnerAcceptedChange: setOwnerAccepted,
        onOverrideReasonChange: setOverrideReason,
      })
    : [];
  const closureReady = !closureInputs || closureItems.every(item => item.done);
  const canHandoff = isConfirmed && !isDrifted && closureReady;

  return (
    <div className="space-y-5">
      <div
        className={`rounded-r-md border-l-4 px-4 py-3 ${
          isDrifted ? 'border-amber-400 bg-amber-50' : 'border-green-500 bg-green-50'
        }`}
      >
        <div
          className={`text-xs font-semibold uppercase tracking-wide ${isDrifted ? 'text-amber-700' : 'text-green-700'}`}
        >
          {isDrifted
            ? 'Drift detected'
            : isConfirmed
              ? 'Sustained · analyst confirmed'
              : 'Verifying · re-check in progress'}
        </div>
      </div>

      <ProjectSignalChips
        signals={overviewSignals}
        groups={['actions', 'measurementPlans', 'findings', 'team']}
      />

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Re-check ladder
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-content-secondary">
          <span data-testid="control-ladder-step">
            Step {record.ladderStep + 1} of {record.ladder.length}
          </span>
          {record.nextCheckSuggestedAt && (
            <span>Next suggested {record.nextCheckSuggestedAt.slice(0, 10)}</span>
          )}
        </div>
      </div>

      {perCauseRows.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Per-cause in-control evidence
          </div>
          {perCauseRows.map(row => (
            <div key={row.factor} className="rounded-md border border-edge p-2 text-xs">
              <div className="font-medium text-content">{row.factor}</div>
              <div className={`mt-0.5 ${row.inControl ? 'text-green-700' : 'text-amber-700'}`}>
                {row.inControl ? '✓' : '⚠'}{' '}
                {row.observation ?? (row.inControl ? 'in control' : 'drift detected')}
              </div>
            </div>
          ))}
        </div>
      )}

      {closureInputs && (
        <div className="space-y-3">
          <div className="rounded-r-md border-l-4 border-[var(--vs-accent)] bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
              Control closure · {closureItems.filter(item => item.done).length} of{' '}
              {closureItems.length} items complete
            </div>
          </div>

          <div className="space-y-2">
            {closureItems.map(item => {
              return (
                <div
                  key={String(item.key)}
                  className={`rounded-md border p-3 ${item.done ? 'border-edge bg-white' : 'border-amber-300 bg-amber-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={item.done ? 'text-green-600' : 'text-amber-600'}>
                      {item.done ? '✓' : '⏳'}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-content">{item.label}</div>
                      <div className="mt-0.5 text-xs text-content-secondary">
                        {item.description}
                      </div>
                      {item.control}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(onOpenReport || onExportPdf) && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
                Continue in
              </div>
              <div className="mt-2 flex gap-2">
                {onOpenReport && (
                  <button
                    type="button"
                    onClick={onOpenReport}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
                  >
                    Report · final summary
                  </button>
                )}
                {onExportPdf && (
                  <button
                    type="button"
                    onClick={onExportPdf}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
                  >
                    Export PDF for audit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenProcess}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Process · monitor drift
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Analyze · capability latest
          </button>
          <button
            type="button"
            onClick={onStartHandoff}
            disabled={!canHandoff}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            data-testid="sustainment-start-handoff"
          >
            Start closure
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlOverview;
