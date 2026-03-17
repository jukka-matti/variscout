import { useMemo } from 'react';
import type { OverallImpactResult } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import type { WhatIfSimulatorColorScheme } from './WhatIfSimulator';
import { whatIfSimulatorDefaultColorScheme } from './WhatIfSimulator';

interface OverallImpactSummaryProps {
  impact: OverallImpactResult;
  hasAdjustment: boolean;
  cpkTarget?: number;
  colorScheme?: WhatIfSimulatorColorScheme;
}

export default function OverallImpactSummary({
  impact,
  hasAdjustment,
  cpkTarget = 1.33,
  colorScheme = whatIfSimulatorDefaultColorScheme,
}: OverallImpactSummaryProps) {
  const { formatStat: fmt } = useTranslation();
  const c = colorScheme;

  const getCpkColor = useMemo(() => {
    return (cpk: number): string => {
      if (cpk >= cpkTarget) return c.cpkGood;
      if (cpk >= cpkTarget * 0.75) return c.cpkOk;
      return c.cpkBad;
    };
  }, [c.cpkGood, c.cpkOk, c.cpkBad, cpkTarget]);

  if (!hasAdjustment) return null;

  const { currentOverall, projectedOverall, subsetFraction, improvements } = impact;
  const pctLabel = `${Math.round(subsetFraction * 100)}% of data`;

  const hasCpk = currentOverall.cpk !== undefined && projectedOverall.cpk !== undefined;
  const hasYield = currentOverall.yield !== undefined && projectedOverall.yield !== undefined;

  if (!hasCpk && !hasYield) return null;

  return (
    <div
      className={`p-3 rounded-lg ${c.projectionBg} border ${c.projectionBorder}`}
      data-testid="overall-impact-summary"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${c.secondaryText}`}>Overall Impact</span>
        <span className={`text-[10px] ${c.mutedText}`}>{pctLabel}</span>
      </div>

      <div className="space-y-1.5 text-xs font-mono">
        {hasCpk && (
          <div className="flex items-center justify-between">
            <span className={c.secondaryText}>Cpk:</span>
            <div className="flex items-center gap-2">
              <span className={getCpkColor(currentOverall.cpk!)}>{fmt(currentOverall.cpk!)}</span>
              <span className={c.mutedText}>&rarr;</span>
              <span className={getCpkColor(projectedOverall.cpk!)}>
                {fmt(projectedOverall.cpk!)}
              </span>
              {improvements.cpkChange !== undefined &&
                Math.abs(improvements.cpkChange) >= 0.005 && (
                  <span
                    className={
                      improvements.cpkChange >= 0 ? c.improvementPositive : c.improvementNegative
                    }
                  >
                    ({improvements.cpkChange >= 0 ? '+' : ''}
                    {fmt(improvements.cpkChange)})
                  </span>
                )}
            </div>
          </div>
        )}

        {hasYield && (
          <div className="flex items-center justify-between">
            <span className={c.secondaryText}>Yield:</span>
            <div className="flex items-center gap-2">
              <span className={c.mutedText}>{fmt(currentOverall.yield!, 1)}%</span>
              <span className={c.mutedText}>&rarr;</span>
              <span className={c.contentText}>{fmt(projectedOverall.yield!, 1)}%</span>
              {improvements.yieldChange !== undefined &&
                Math.abs(improvements.yieldChange) >= 0.05 && (
                  <span
                    className={
                      improvements.yieldChange >= 0 ? c.improvementPositive : c.improvementNegative
                    }
                  >
                    ({improvements.yieldChange >= 0 ? '+' : ''}
                    {fmt(improvements.yieldChange, 1)}%)
                  </span>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
