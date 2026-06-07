// packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx
import { useState } from 'react';
import type { ColumnAnalysis } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

export interface OutcomeNoMatchBannerProps {
  columns?: readonly ColumnAnalysis[];
  onRename: (oldName: string, newName: string) => void;
  onExpectedChange: (expected: string) => void;
  onApplyExpectedOutcome?: (columnName: string) => void;
  onSkip: () => void;
}

type Feedback = { kind: 'no-match' | 'non-numeric'; message: string } | null;

export function OutcomeNoMatchBanner({
  columns = [],
  onExpectedChange,
  onApplyExpectedOutcome,
  onSkip,
}: OutcomeNoMatchBannerProps) {
  const { t, tf } = useTranslation();
  const [expected, setExpected] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const numericColumns = columns.filter(column => column.type === 'numeric');

  const handleExpectedChange = (next: string) => {
    setExpected(next);
    onExpectedChange(next);

    const trimmed = next.trim();
    if (!trimmed || columns.length === 0) {
      setFeedback(null);
      return;
    }

    const matchingColumn = columns.find(column => column.name === trimmed);
    if (!matchingColumn) {
      const availableColumns =
        numericColumns.map(column => column.name).join(', ') ||
        t('outcomeNoMatch.noNumericColumns');
      setFeedback({
        kind: 'no-match',
        message: tf('outcomeNoMatch.noColumn', {
          name: trimmed,
          columns: availableColumns,
        }),
      });
      return;
    }

    if (matchingColumn.type !== 'numeric') {
      setFeedback({
        kind: 'non-numeric',
        message: tf('outcomeNoMatch.nonNumeric', { name: trimmed }),
      });
      return;
    }

    setFeedback(null);
    onApplyExpectedOutcome?.(matchingColumn.name);
  };

  return (
    <div className="outcome-no-match-banner" role="alert">
      <strong>⚠ No clear outcome match.</strong>
      <p>
        Either rename a column to match your outcome (best for the long term) or pick manually
        below. VariScout learns from your pick — future paste of a column with this name will rank
        higher next time.
      </p>
      <label>
        I expected the outcome to be:
        <input
          type="text"
          value={expected}
          onChange={e => {
            handleExpectedChange(e.target.value);
          }}
          placeholder="e.g. reject_rate"
        />
      </label>
      {feedback && (
        <p role="status" className="text-sm text-warning">
          {feedback.message}
        </p>
      )}
      <button type="button" onClick={onSkip}>
        Skip outcome — paint canvas with all columns unclassified
      </button>
    </div>
  );
}
