/**
 * CapabilityHistogram - Shared wrapper for CapabilityHistogramBase
 *
 * Adds tier-aware branding to the shared chart component.
 * Both PWA and Azure apps use this via withParentSize in their thin wrappers.
 */
import React from 'react';
import { CapabilityHistogramBase } from '@variscout/charts';
import { shouldShowBranding, getBrandingText, type SpecLimits } from '@variscout/core';

export interface CapabilityHistogramProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  specs: SpecLimits;
  mean: number;
  /** Before-stage Cpk value (for staged comparison badge) */
  cpkBefore?: number;
  /** After-stage Cpk value (for staged comparison badge) */
  cpkAfter?: number;
}

/** Get color class for Cpk delta */
function getCpkDeltaColor(delta: number): string {
  if (delta > 0.05) return 'text-green-500';
  if (delta < -0.05) return 'text-red-400';
  return 'text-amber-500';
}

export const CapabilityHistogram = ({
  parentWidth,
  parentHeight,
  data,
  specs,
  mean,
  cpkBefore,
  cpkAfter,
}: CapabilityHistogramProps) => {
  const showBranding = shouldShowBranding();
  const showComparisonBadge = cpkBefore !== undefined && cpkAfter !== undefined;
  const delta = showComparisonBadge ? cpkAfter! - cpkBefore! : 0;

  return (
    <div>
      {showComparisonBadge && (
        <div
          className="flex items-center justify-center gap-2 text-xs py-1"
          data-testid="cpk-comparison-badge"
        >
          <span className="text-slate-400 dark:text-slate-500">
            Before Cpk: {cpkBefore!.toFixed(2)}
          </span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="text-slate-400 dark:text-slate-500">
            After Cpk: {cpkAfter!.toFixed(2)}
          </span>
          <span className={`font-medium ${getCpkDeltaColor(delta)}`}>
            ({delta > 0 ? '+' : ''}
            {delta.toFixed(2)})
          </span>
        </div>
      )}
      <CapabilityHistogramBase
        parentWidth={parentWidth}
        parentHeight={showComparisonBadge ? parentHeight - 24 : parentHeight}
        data={data}
        specs={specs}
        mean={mean}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
      />
    </div>
  );
};
