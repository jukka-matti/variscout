// packages/ui/src/components/OutcomePin/OutcomePin.tsx
import type { OutcomeSpec } from '@variscout/core/processHub';
import { formatStatistic } from '@variscout/core/i18n';

export interface OutcomePinProps {
  outcome: OutcomeSpec;
  stats: { mean: number; sigma: number; n: number };
  onAddSpecs: (columnName: string) => void;
}

const TRUST_PENDING_N = 10;

export function OutcomePin({ outcome, stats, onAddSpecs }: OutcomePinProps) {
  const hasSpecs =
    outcome.target !== undefined && (outcome.usl !== undefined || outcome.lsl !== undefined);

  if (hasSpecs && stats.n < TRUST_PENDING_N) {
    return (
      <div className="outcome-pin trust-pending" data-testid="outcome-pin">
        <div className="outcome-name">{outcome.columnName}</div>
        <div className="badge">Trust pending — n&lt;{TRUST_PENDING_N}</div>
      </div>
    );
  }

  if (hasSpecs) {
    // Compute Cpk via existing helper / inline simple form (full computation in core).
    return (
      <div className="outcome-pin with-specs" data-testid="outcome-pin">
        <div className="outcome-name">{outcome.columnName}</div>
        <div className="cpk-badge">
          Cpk · target {outcome.target} · ≥ {outcome.cpkTarget ?? 1.33}
        </div>
        <div className="trust">n={stats.n}</div>
      </div>
    );
  }

  return (
    <div className="outcome-pin fallback" data-testid="outcome-pin">
      <div className="outcome-name">{outcome.columnName}</div>
      <div className="fallback-stats">
        {formatStatistic(stats.mean, 'en', 2)} ± {formatStatistic(stats.sigma, 'en', 2)} · n=
        {stats.n}
      </div>
      <button type="button" onClick={() => onAddSpecs(outcome.columnName)}>
        + Add specs
      </button>
    </div>
  );
}
