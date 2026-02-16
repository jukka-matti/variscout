/**
 * CapabilityHistogram - Shared wrapper for CapabilityHistogramBase
 *
 * Adds tier-aware branding to the shared chart component.
 * Both PWA and Azure apps use this via withParentSize in their thin wrappers.
 */
import React from 'react';
import { CapabilityHistogramBase } from '@variscout/charts';
import { shouldShowBranding, getBrandingText } from '@variscout/core';

export interface CapabilityHistogramProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  specs: { usl?: number; lsl?: number; target?: number };
  mean: number;
}

export const CapabilityHistogram = ({
  parentWidth,
  parentHeight,
  data,
  specs,
  mean,
}: CapabilityHistogramProps) => {
  const showBranding = shouldShowBranding();

  return (
    <CapabilityHistogramBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={data}
      specs={specs}
      mean={mean}
      showBranding={showBranding}
      brandingText={showBranding ? getBrandingText() : undefined}
    />
  );
};
