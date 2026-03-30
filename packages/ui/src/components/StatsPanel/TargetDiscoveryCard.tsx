import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { StatsResult, SpecLimits, ComplementInsight } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';

// Re-export for backward compatibility
export type { ComplementInsight } from '@variscout/core';

export interface TargetDiscoveryCardProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  isDrilling: boolean;
  /** Complement insight (available when drilling) */
  complement?: ComplementInsight | null;
  /** Best subset projection against target (when specs exist + drilling) */
  activeProjection?: ProcessProjection | null;
  /** Centering opportunity (when specs exist, not drilling) */
  centeringOpportunity?: CenteringOpportunity | null;
  /** Cpk target for comparison */
  cpkTarget?: number;
  /** Called when user accepts suggested specs */
  onAcceptSpecs?: (lsl: number, usl: number) => void;
  /** Called to open spec editor for customization */
  onCustomize?: () => void;
  /** Called to open What-If tab */
  onOpenWhatIf?: () => void;
  /** Total sample count */
  sampleCount?: number;
}

/**
 * TargetDiscoveryCard — adaptive card showing process intelligence.
 *
 * 4 states:
 * 1. No specs, not drilling → prompt to drill or set specs
 * 2. No specs, drilling → complement reveals achievable capability
 * 3. Specs exist, not drilling → centering opportunity
 * 4. Specs exist, drilling → best subset comparison against target
 */
const TargetDiscoveryCard: React.FC<TargetDiscoveryCardProps> = ({
  stats,
  specs,
  isDrilling,
  complement,
  activeProjection,
  centeringOpportunity,
  cpkTarget = 1.33,
  onAcceptSpecs,
  onCustomize,
  onOpenWhatIf,
  sampleCount,
}) => {
  const { formatStat } = useTranslation();
  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  if (!stats) return null;

  // State 1: No specs, not drilling
  if (!hasSpecs && !isDrilling) {
    return (
      <div
        className="bg-surface/50 border border-edge/50 rounded-lg p-3"
        data-testid="target-discovery-prompt"
      >
        <div className="text-xs text-content-secondary leading-relaxed">
          Your process runs at{' '}
          <span className="font-mono text-content">
            {formatStat(stats.mean, 2)} &plusmn; {formatStat(stats.stdDev, 2)}
          </span>{' '}
          (n={sampleCount ?? '—'}).
        </div>
        <div className="text-xs text-content-muted mt-2">
          Drill into factors to discover what&rsquo;s achievable, or{' '}
          {onCustomize ? (
            <button
              onClick={onCustomize}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              set specifications manually
            </button>
          ) : (
            'set specifications manually'
          )}
          .
        </div>
      </div>
    );
  }

  // State 2: No specs, drilling (the key discovery moment)
  if (!hasSpecs && isDrilling && complement && complement.count >= 2) {
    const suggestedLsl = complement.suggestedLsl ?? complement.mean - 3 * complement.stdDev;
    const suggestedUsl = complement.suggestedUsl ?? complement.mean + 3 * complement.stdDev;

    return (
      <div
        className="bg-gradient-to-br from-green-500/5 to-blue-500/5 border border-green-500/20 rounded-lg p-3"
        data-testid="target-discovery-complement"
      >
        <div className="text-[0.625rem] uppercase tracking-wider text-green-500 font-medium mb-2">
          Achievable capability
        </div>
        <div className="text-xs text-content-secondary mb-2">
          {complement.label ? (
            <>Without the selected subset, your process ({complement.label}) achieves:</>
          ) : (
            <>Your remaining process achieves:</>
          )}
        </div>
        <div className="flex gap-2 mb-2">
          <div className="bg-green-500/10 rounded-md px-2 py-1.5 text-center flex-1">
            <div className="text-[0.5625rem] text-green-500">Mean</div>
            <div className="text-sm font-semibold font-mono text-green-400">
              {formatStat(complement.mean, 2)}
            </div>
          </div>
          <div className="bg-green-500/10 rounded-md px-2 py-1.5 text-center flex-1">
            <div className="text-[0.5625rem] text-green-500">&sigma;</div>
            <div className="text-sm font-semibold font-mono text-green-400">
              {formatStat(complement.stdDev, 2)}
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-md px-2 py-1.5 text-center flex-1">
            <div className="text-[0.5625rem] text-blue-400">Range</div>
            <div className="text-xs font-semibold font-mono text-blue-400">
              {formatStat(suggestedLsl, 1)}&ndash;{formatStat(suggestedUsl, 1)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onAcceptSpecs && (
            <button
              onClick={() => onAcceptSpecs(suggestedLsl, suggestedUsl)}
              className="flex-1 bg-green-500 text-green-950 rounded-md py-1.5 text-xs font-semibold hover:bg-green-400 transition-colors"
              data-testid="target-accept-specs"
            >
              Set as specifications
            </button>
          )}
          {onCustomize && (
            <button
              onClick={onCustomize}
              className="flex-1 bg-surface border border-edge rounded-md py-1.5 text-xs text-content-secondary hover:text-content transition-colors"
              data-testid="target-customize"
            >
              Customize...
            </button>
          )}
        </div>
      </div>
    );
  }

  // State 3: Specs exist, not drilling — centering opportunity
  if (hasSpecs && !isDrilling && centeringOpportunity) {
    return (
      <div
        className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3"
        data-testid="target-discovery-centering"
      >
        <div className="text-[0.625rem] uppercase tracking-wider text-amber-500 font-medium mb-1">
          Centering opportunity
        </div>
        <div className="text-xs text-content-secondary leading-relaxed">
          The process spread (Cp{' '}
          <span className="font-mono text-amber-500">{formatStat(centeringOpportunity.cp, 2)}</span>
          ) is better than the actual capability (Cpk{' '}
          <span className="font-mono text-red-400">
            {formatStat(centeringOpportunity.currentCpk, 2)}
          </span>
          ). The process is off-center by{' '}
          <span className="font-mono">{formatStat(centeringOpportunity.gap, 2)}</span>.
          <span className="text-content-muted block mt-1">
            Drill into factors to find what&rsquo;s causing the shift.
          </span>
        </div>
      </div>
    );
  }

  // State 4: Specs exist, drilling — headroom check
  if (hasSpecs && isDrilling && activeProjection) {
    const meetsTarget = activeProjection.projectedCpk >= cpkTarget;

    return (
      <div
        className={`${meetsTarget ? 'bg-green-500/5 border-green-500/15' : 'bg-amber-500/5 border-amber-500/15'} border rounded-lg p-3`}
        data-testid="target-discovery-headroom"
      >
        <div
          className={`text-[0.625rem] uppercase tracking-wider font-medium mb-1 ${meetsTarget ? 'text-green-500' : 'text-amber-500'}`}
        >
          {meetsTarget ? 'Target achievable' : 'Gap to target'}
        </div>
        <div className="text-xs text-content-secondary leading-relaxed">
          {meetsTarget ? (
            <>
              Fixing this subset achieves Cpk{' '}
              <span className="font-mono text-green-400">
                {formatStat(activeProjection.projectedCpk, 2)}
              </span>{' '}
              (target: {formatStat(cpkTarget, 2)}) &mdash; sufficient.
            </>
          ) : (
            <>
              Fixing this subset reaches Cpk{' '}
              <span className="font-mono text-amber-500">
                {formatStat(activeProjection.projectedCpk, 2)}
              </span>{' '}
              (target: {formatStat(cpkTarget, 2)}) &mdash; additional changes needed.
              {onOpenWhatIf && (
                <button
                  onClick={onOpenWhatIf}
                  className="text-blue-400 hover:text-blue-300 transition-colors ml-1"
                >
                  Open What-If &rarr;
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default TargetDiscoveryCard;
