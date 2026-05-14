import React from 'react';

export interface HandoffChecklistInputs {
  controlPlanDocumented: boolean;
  trainingDelivered: boolean;
  cadenceAssigned: boolean;
  processOwnerAcknowledged: boolean;
  controlPlanRef?: string;
  trainingRef?: string;
  cadenceOwner?: string;
  acknowledgmentReminder?: string;
}

interface HandoffOverviewProps {
  inputs: HandoffChecklistInputs;
  onOpenReport: () => void;
  onExportPdf: () => void;
  onNudgeOwner: () => void;
}

interface ChecklistItem {
  key: keyof Pick<
    HandoffChecklistInputs,
    'controlPlanDocumented' | 'trainingDelivered' | 'cadenceAssigned' | 'processOwnerAcknowledged'
  >;
  label: string;
  description: (i: HandoffChecklistInputs) => string;
}

const ITEMS: ChecklistItem[] = [
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

const HandoffOverview: React.FC<HandoffOverviewProps> = ({
  inputs,
  onOpenReport,
  onExportPdf,
  onNudgeOwner,
}) => {
  const completed = ITEMS.filter(it => inputs[it.key] === true).length;

  return (
    <div className="space-y-5">
      <div className="rounded-r-md border-l-4 border-[var(--vs-accent)] bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
          Handoff readiness · {completed} of {ITEMS.length} items complete
        </div>
      </div>

      <div className="space-y-2">
        {ITEMS.map(item => {
          const done = inputs[item.key] === true;
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
                    {item.description(inputs)}
                  </div>
                </div>
                {!done && item.key === 'processOwnerAcknowledged' && (
                  <button
                    type="button"
                    onClick={onNudgeOwner}
                    className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700"
                    data-testid="handoff-nudge-owner"
                  >
                    Nudge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Report · final summary
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Export PDF for audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoffOverview;
