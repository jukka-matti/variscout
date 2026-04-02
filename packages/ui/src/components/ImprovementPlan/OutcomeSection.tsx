import React from 'react';

export type OutcomeValue = 'effective' | 'partial' | 'not-effective';

export interface OutcomeSectionProps {
  /** Whether verification data exists (controls dimmed state) */
  hasVerification: boolean;
  /** Current selected outcome */
  selectedOutcome?: OutcomeValue;
  /** Outcome notes */
  notes?: string;
  /** Callback when outcome is selected */
  onOutcomeChange?: (outcome: OutcomeValue) => void;
  /** Callback when notes change */
  onNotesChange?: (notes: string) => void;
}

interface OutcomeOption {
  value: OutcomeValue;
  label: string;
  icon: string;
  title: string;
  baseClass: string;
  selectedClass: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    value: 'effective',
    label: 'Effective',
    icon: '✓',
    title: 'Target met. Findings transition to resolved.',
    baseClass: 'bg-green-500/15 text-green-400 border-green-500/30',
    selectedClass: 'bg-green-500/40 text-green-300 border-green-500/60 ring-2 ring-green-500/40',
  },
  {
    value: 'partial',
    label: 'Partial',
    icon: '~',
    title: 'Improved but below target. Suggests iteration.',
    baseClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    selectedClass: 'bg-amber-500/40 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/40',
  },
  {
    value: 'not-effective',
    label: 'Not effective',
    icon: '✕',
    title: 'No improvement. Suggests re-investigation.',
    baseClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    selectedClass: 'bg-red-500/40 text-red-300 border-red-500/60 ring-2 ring-red-500/40',
  },
];

export const OutcomeSection: React.FC<OutcomeSectionProps> = ({
  hasVerification,
  selectedOutcome,
  notes = '',
  onOutcomeChange,
  onNotesChange,
}) => {
  return (
    <div
      data-testid="outcome-section"
      className={`bg-surface-secondary rounded-xl border border-edge p-4 flex flex-col gap-3 ${
        !hasVerification ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted">Outcome</h3>

      {!hasVerification ? (
        <p data-testid="outcome-dimmed-message" className="text-sm text-content-muted italic">
          Available after verification data is uploaded
        </p>
      ) : (
        <>
          <p className="text-sm text-content">Was the improvement effective?</p>

          <div data-testid="outcome-buttons" className="flex gap-2">
            {OUTCOME_OPTIONS.map(option => {
              const isSelected = selectedOutcome === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-testid={`outcome-button-${option.value}`}
                  aria-pressed={isSelected}
                  aria-label={option.title}
                  title={option.title}
                  onClick={() => onOutcomeChange?.(option.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    isSelected ? option.selectedClass : option.baseClass
                  }`}
                >
                  <span aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            data-testid="outcome-notes"
            value={notes}
            onChange={e => onNotesChange?.(e.target.value)}
            placeholder="Add notes about the outcome..."
            rows={3}
            className="w-full resize-y bg-surface text-content border border-edge rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-edge"
          />
        </>
      )}
    </div>
  );
};
