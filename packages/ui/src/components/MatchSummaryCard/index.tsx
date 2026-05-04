import type { JoinKeyCandidate, MatchSummaryClassification } from '@variscout/core/matchSummary';
import { TimelinePreview } from './TimelinePreview';
import { ColumnShapeSubSummary, type ColumnShape } from './ColumnShapeSubSummary';
import { JoinKeySuggestion } from './JoinKeySuggestion';

export type { ColumnShape };

export type MatchSummaryActionChoice =
  | { kind: 'append' }
  | { kind: 'backfill' }
  | { kind: 'replace' }
  | { kind: 'no-timestamp' }
  | { kind: 'overlap-replace' }
  | { kind: 'overlap-keep-both' }
  | { kind: 'overlap-cancel' }
  | { kind: 'different-grain-cancel' }
  | { kind: 'different-grain-separate-hub' }
  | { kind: 'different-source-no-key-new-hub' }
  | { kind: 'multi-source-join'; candidate: JoinKeyCandidate };

export interface MatchSummaryCardProps {
  classification: MatchSummaryClassification;
  columnShape: ColumnShape;
  onChoose: (choice: MatchSummaryActionChoice) => void;
  onCancel: () => void;
  /**
   * Step-anchor picker props — forwarded to ColumnShapeSubSummary.
   * Provide these in the Mode A.2-paste flow when the incoming columns
   * contain plausible step-of-origin candidates (e.g. `step_rejected_at`).
   * Filter `columnShape.added` via `suggestStepRejectedAtColumn` from
   * `@variscout/core/defect` before passing here.
   *
   * Consumer integration (applying the picked column to the Hub's
   * `defectMapping`) is out of scope for this component — this card only
   * surfaces and propagates the user's selection via `onStepRejectedAtChange`.
   */
  stepCandidates?: string[];
  /** Currently-selected step column (undefined = "None / not set"). */
  stepRejectedAtColumn?: string;
  /** Called when the user picks or clears the step column. */
  onStepRejectedAtChange?: (column: string | undefined) => void;
}

const TEMPORAL_LABEL: Record<MatchSummaryClassification['temporal'], string> = {
  append: 'Append (new range > existing)',
  backfill: 'Backfill (new range < existing)',
  overlap: 'Overlap (ranges intersect — choose how to handle)',
  replace: 'Replace (same range, mostly duplicates)',
  'no-timestamp': 'No timestamp (treat as anonymous batch)',
  'different-grain': 'Different grain (e.g., hourly vs daily) — choose how to handle',
};

export function MatchSummaryCard({
  classification,
  columnShape,
  onChoose,
  onCancel,
  stepCandidates,
  stepRejectedAtColumn,
  onStepRejectedAtChange,
}: MatchSummaryCardProps) {
  const renderActions = () => {
    if (classification.temporal === 'overlap') {
      return (
        <>
          <button
            type="button"
            onClick={() => onChoose({ kind: 'overlap-cancel' })}
            data-testid="overlap-cancel"
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancel and check
          </button>
          <button
            type="button"
            onClick={() => onChoose({ kind: 'overlap-keep-both' })}
            data-testid="overlap-keep-both"
            className="px-3 py-1 border rounded"
          >
            Keep both
          </button>
          <button
            type="button"
            onClick={() => onChoose({ kind: 'overlap-replace' })}
            data-testid="overlap-replace"
            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Replace overlap
          </button>
        </>
      );
    }

    if (classification.temporal === 'different-grain') {
      return (
        <>
          <button
            type="button"
            onClick={() => onChoose({ kind: 'different-grain-cancel' })}
            data-testid="grain-cancel"
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onChoose({ kind: 'different-grain-separate-hub' })}
            data-testid="grain-separate-hub"
            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Create separate Hub
          </button>
        </>
      );
    }

    if (classification.source === 'different-source-joinable') {
      // The JoinKeySuggestion sub-card is the primary action for this case.
      // The action row shows only a Cancel escape hatch.
      return (
        <button
          type="button"
          onClick={onCancel}
          data-testid="match-summary-cancel"
          className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
      );
    }

    if (classification.source === 'different-source-no-key') {
      return (
        <button
          type="button"
          onClick={() => onChoose({ kind: 'different-source-no-key-new-hub' })}
          data-testid="new-hub-suggest"
          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded"
        >
          Create new Hub
        </button>
      );
    }

    // Default (append, backfill, replace, no-timestamp) — Cancel + Confirm.
    return (
      <>
        <button
          type="button"
          onClick={onCancel}
          data-testid="match-summary-cancel"
          className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onChoose({
              kind: classification.temporal as Extract<
                MatchSummaryActionChoice['kind'],
                'append' | 'backfill' | 'replace' | 'no-timestamp'
              >,
            })
          }
          data-testid="match-summary-confirm"
          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded"
        >
          Confirm — {classification.temporal}
        </button>
      </>
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg shadow p-5 max-w-2xl"
      data-testid="match-summary-card"
    >
      <h3 className="text-lg font-semibold mb-2">Match summary</h3>
      <p className="text-sm text-gray-600 mb-3">{TEMPORAL_LABEL[classification.temporal]}</p>

      <TimelinePreview
        existing={classification.existingRange}
        incoming={classification.newRange}
        overlap={classification.overlapRange}
      />

      <ColumnShapeSubSummary
        shape={columnShape}
        stepCandidates={stepCandidates}
        stepRejectedAtColumn={stepRejectedAtColumn}
        onStepRejectedAtChange={onStepRejectedAtChange}
      />

      {classification.source === 'different-source-joinable' && classification.candidates && (
        <JoinKeySuggestion
          candidates={classification.candidates}
          onConfirm={c => onChoose({ kind: 'multi-source-join', candidate: c })}
        />
      )}

      <div className="flex gap-2 justify-end mt-4">{renderActions()}</div>
    </div>
  );
}
