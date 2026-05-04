import type { JoinKeyCandidate } from '@variscout/core/matchSummary';

export interface JoinKeySuggestionProps {
  candidates: JoinKeyCandidate[];
  onConfirm: (candidate: JoinKeyCandidate) => void;
}

export function JoinKeySuggestion({ candidates, onConfirm }: JoinKeySuggestionProps) {
  if (candidates.length === 0) return null;
  return (
    <div
      className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 my-3"
      data-testid="join-key-suggestion"
    >
      <p className="text-sm font-medium mb-2">Suggested join key</p>
      <ul className="space-y-1">
        {candidates.slice(0, 3).map(c => (
          <li key={`${c.hubColumn}::${c.newColumn}`} className="text-sm">
            <button
              type="button"
              data-testid={`join-key-${c.hubColumn}`}
              onClick={() => onConfirm(c)}
              className="underline hover:text-blue-700"
            >
              {c.hubColumn} ↔ {c.newColumn} ({Math.round(c.totalScore * 100)}% match ·{' '}
              {Math.round(c.valueOverlapPct * 100)}% values overlap)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
