import React from 'react';
import type { SustainmentRecord } from '@variscout/core';

/** Closure checklist inputs derived from a ControlHandoff or caller state. */
export interface SustainmentClosureInputs {
  controlPlanDocumented: boolean;
  trainingDelivered: boolean;
  cadenceAssigned: boolean;
  processOwnerAcknowledged: boolean;
  controlPlanRef?: string;
  trainingRef?: string;
  cadenceOwner?: string;
  acknowledgmentReminder?: string;
}

interface ClosureChecklistItem {
  key: keyof Pick<
    SustainmentClosureInputs,
    'controlPlanDocumented' | 'trainingDelivered' | 'cadenceAssigned' | 'processOwnerAcknowledged'
  >;
  label: string;
  description: (i: SustainmentClosureInputs) => string;
}

const CLOSURE_ITEMS: ClosureChecklistItem[] = [
  {
    key: 'controlPlanDocumented',
    label: 'Control plan documented',
    description: i => i.controlPlanRef ?? 'No control plan linked',
  },
  {
    key: 'trainingDelivered',
    label: 'Training materials delivered',
    description: i => i.trainingRef ?? 'No training acknowledgments on file',
  },
  {
    key: 'cadenceAssigned',
    label: 'Monitoring cadence assigned',
    description: i => i.cadenceOwner ?? 'No owner assigned',
  },
  {
    key: 'processOwnerAcknowledged',
    label: 'Process Owner acknowledgment',
    description: i => i.acknowledgmentReminder ?? 'Pending — not yet acknowledged',
  },
];

interface SustainmentOverviewProps {
  record: SustainmentRecord;
  onStartHandoff: () => void;
  onOpenProcess: () => void;
  onOpenAnalyze: () => void;
  /** Optional: per-cause in-control rows from caller (Plan 4 wires real data). */
  perCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** Optional closure checklist inputs (folded in from former Handoff stage). */
  closureInputs?: SustainmentClosureInputs;
  /** Called when user clicks "Nudge" on pending process-owner acknowledgment. */
  onNudgeOwner?: () => void;
  /** Called when user clicks "Report · final summary". */
  onOpenReport?: () => void;
  /** Called when user clicks "Export PDF for audit". */
  onExportPdf?: () => void;
}

const SUSTAINMENT_THRESHOLD = 4;

const SustainmentOverview: React.FC<SustainmentOverviewProps> = ({
  record,
  onStartHandoff,
  onOpenProcess,
  onOpenAnalyze,
  perCauseRows = [],
  closureInputs,
  onNudgeOwner,
  onOpenReport,
  onExportPdf,
}) => {
  const ticks = Math.max(0, record.consecutiveOnTargetTicks);
  const visibleTicks = Math.min(ticks, 8);
  const isDrifted = record.status === 'drifted';
  const canHandoff = ticks >= SUSTAINMENT_THRESHOLD && !isDrifted;

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
          {isDrifted ? 'Drift detected · last tick failed' : `Sustained · ${ticks} ticks on target`}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Cadence tick history
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: visibleTicks }, (_, i) => (
            <span
              key={i}
              data-testid={`cadence-tick-${i}`}
              className="rounded-sm bg-green-100 px-2 py-0.5 font-mono text-[10px] text-green-800"
            >
              Wk {i + 1} ✓
            </span>
          ))}
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
              Sustainment closure ·{' '}
              {CLOSURE_ITEMS.filter(it => closureInputs[it.key] === true).length} of{' '}
              {CLOSURE_ITEMS.length} items complete
            </div>
          </div>

          <div className="space-y-2">
            {CLOSURE_ITEMS.map(item => {
              const done = closureInputs[item.key] === true;
              return (
                <div
                  key={String(item.key)}
                  className={`rounded-md border p-3 ${done ? 'border-edge bg-white' : 'border-amber-300 bg-amber-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={done ? 'text-green-600' : 'text-amber-600'}>
                      {done ? '✓' : '⏳'}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-content">{item.label}</div>
                      <div className="mt-0.5 text-xs text-content-secondary">
                        {item.description(closureInputs)}
                      </div>
                    </div>
                    {!done && item.key === 'processOwnerAcknowledged' && (
                      <button
                        type="button"
                        onClick={onNudgeOwner}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700"
                        data-testid="sustainment-closure-nudge-owner"
                      >
                        Nudge
                      </button>
                    )}
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
            → Start Handoff
          </button>
        </div>
      </div>
    </div>
  );
};

export default SustainmentOverview;
