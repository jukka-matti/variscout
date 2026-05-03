// packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx
import { useState } from 'react';

export interface OutcomeNoMatchBannerProps {
  onRename: (oldName: string, newName: string) => void;
  onExpectedChange: (expected: string) => void;
  onSkip: () => void;
}

export function OutcomeNoMatchBanner({ onExpectedChange, onSkip }: OutcomeNoMatchBannerProps) {
  const [expected, setExpected] = useState('');
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
            setExpected(e.target.value);
            onExpectedChange(e.target.value);
          }}
          placeholder="e.g. reject_rate"
        />
      </label>
      <button type="button" onClick={onSkip}>
        Skip outcome — paint canvas with all columns unclassified
      </button>
    </div>
  );
}
