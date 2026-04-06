import React from 'react';
import { Star, ArrowRight, ExternalLink } from 'lucide-react';

export interface SweetSpotCardProps {
  /** Factor name */
  factorName: string;
  /** Optimal value */
  optimumValue: number;
  /** Predicted outcome at optimum */
  predictedAtOptimum: number;
  /** Operating window (range within ~1% of optimum) */
  operatingWindow?: { min: number; max: number };
  /** Current process mean */
  currentMean?: number;
  /** Predicted outcome at current */
  predictedAtCurrent?: number;
  /** Sensitivity: change in outcome per unit change at optimum */
  sensitivity?: number;
  /** Unit label (e.g., "°C") */
  unitLabel?: string;
  /** Outcome label */
  outcomeLabel?: string;
  /** Callback to create improvement action */
  onCreateAction?: () => void;
  className?: string;
}

/**
 * Displays a detected quadratic optimum ("sweet spot") for a continuous factor.
 * Shows optimal value, operating window, current vs optimal comparison, and
 * sensitivity information. Offers a direct path to create an improvement action.
 */
const SweetSpotCard: React.FC<SweetSpotCardProps> = ({
  factorName,
  optimumValue,
  predictedAtOptimum,
  operatingWindow,
  currentMean,
  predictedAtCurrent,
  sensitivity,
  unitLabel = '',
  outcomeLabel = 'outcome',
  onCreateAction,
  className = '',
}) => {
  const formatVal = (v: number) => {
    if (!Number.isFinite(v)) return '—';
    return v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
  };

  const improvement = predictedAtCurrent != null ? predictedAtOptimum - predictedAtCurrent : null;

  const improvementSign = improvement != null && improvement > 0 ? '+' : '';
  const improvementColor =
    improvement == null
      ? ''
      : improvement > 0
        ? 'text-green-400'
        : improvement < 0
          ? 'text-red-400'
          : 'text-content-muted';

  return (
    <div
      className={[
        'rounded-lg border border-purple-500/20',
        'bg-gradient-to-br from-purple-500/5 to-indigo-500/5',
        'p-3 space-y-3',
        className,
      ].join(' ')}
      data-testid="sweet-spot-card"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Star size={14} className="text-purple-400 shrink-0" fill="currentColor" />
        <span className="text-sm font-semibold text-content">Sweet Spot Detected</span>
      </div>

      {/* Primary result */}
      <div className="space-y-0.5">
        <p className="text-xs text-content-secondary">
          <span className="font-medium text-content">{factorName}</span> optimum:{' '}
          <span className="font-mono text-purple-300">
            {formatVal(optimumValue)}
            {unitLabel}
          </span>
        </p>
        <p className="text-xs text-content-secondary">
          Predicted {outcomeLabel}:{' '}
          <span className="font-mono text-content">{formatVal(predictedAtOptimum)}</span>
        </p>
      </div>

      {/* Operating window */}
      {operatingWindow && (
        <div className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5">
          <p className="text-[0.625rem] text-purple-300 font-medium mb-0.5">Operating window</p>
          <p className="text-xs font-mono text-content">
            {formatVal(operatingWindow.min)}
            {unitLabel} – {formatVal(operatingWindow.max)}
            {unitLabel}
          </p>
          <p className="text-[0.625rem] text-content-muted mt-0.5">less than 1% loss</p>
        </div>
      )}

      {/* Current → Optimal comparison */}
      {currentMean != null && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="font-mono">
              {formatVal(currentMean)}
              {unitLabel}
            </span>
            <ArrowRight size={10} className="text-green-400 shrink-0" />
            <span className="font-mono text-content">
              {formatVal(optimumValue)}
              {unitLabel}
            </span>
          </div>
          {improvement != null && (
            <p className="text-[0.625rem] text-content-muted">
              Expected improvement:{' '}
              <span className={`font-mono ${improvementColor}`}>
                {improvementSign}
                {formatVal(improvement)}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Sensitivity */}
      {sensitivity != null && (
        <p className="text-[0.625rem] text-content-muted leading-relaxed">
          Sensitivity: &plusmn;1{unitLabel} changes{' '}
          <span className="font-medium text-content-secondary">{outcomeLabel}</span> by{' '}
          <span className="font-mono text-content">{formatVal(Math.abs(sensitivity))}</span>
        </p>
      )}

      {/* CTA */}
      {onCreateAction && (
        <button
          onClick={onCreateAction}
          className={[
            'flex items-center gap-1.5 w-full justify-center',
            'text-xs text-purple-300 hover:text-purple-200',
            'border border-purple-500/30 hover:border-purple-400/50',
            'rounded-md px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/15',
            'transition-colors',
          ].join(' ')}
        >
          Create improvement action
          <ExternalLink size={11} />
        </button>
      )}
    </div>
  );
};

export default SweetSpotCard;
