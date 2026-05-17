/**
 * CapabilityHistogram - Shared wrapper for CapabilityHistogramBase
 *
 * Apps choose whether to render the VariScout source-bar branding via
 * the `showBranding` prop (default off).
 * Both PWA and Azure apps use this via withParentSize in their thin wrappers.
 */
import React from 'react';
import { CapabilityHistogramBase } from '@variscout/charts';
import type { SpecLimits } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

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
  /** Render the VariScout source-bar branding when true. Defaults to false. */
  showBranding?: boolean;
  /** Branding text (only used when showBranding=true). Defaults to "VariScout Lite". */
  brandingText?: string;
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
  showBranding: showBrandingProp,
  brandingText: brandingTextProp,
}: CapabilityHistogramProps) => {
  const { formatStat } = useTranslation();
  const showBranding = showBrandingProp ?? false;
  const brandingText = brandingTextProp ?? 'VariScout Lite';
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
            Before Cpk: {formatStat(cpkBefore!)}
          </span>
          <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
          <span className="text-slate-400 dark:text-slate-500">
            After Cpk: {formatStat(cpkAfter!)}
          </span>
          <span className={`font-medium ${getCpkDeltaColor(delta)}`}>
            ({delta > 0 ? '+' : ''}
            {formatStat(delta)})
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
        brandingText={showBranding ? brandingText : undefined}
      />
    </div>
  );
};
