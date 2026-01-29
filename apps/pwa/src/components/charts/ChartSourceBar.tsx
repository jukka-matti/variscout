import React from 'react';
import {
  ChartSourceBar as ChartSourceBarBase,
  getSourceBarHeight as getSourceBarHeightBase,
} from '@variscout/charts';
import { EDITION_COLORS } from '@variscout/core';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';

interface ChartSourceBarProps {
  width: number;
  top: number;
  n?: number;
  left?: number;
}

/**
 * Chart source bar component - shows branding and sample size
 * PWA wrapper that handles edition detection and passes props to shared component
 */
const ChartSourceBar: React.FC<ChartSourceBarProps> = ({ width, top, n, left = 0 }) => {
  const showBranding = shouldShowBranding();
  const brandingText = getBrandingText();

  // Don't render if licensed edition (no branding)
  if (!showBranding) {
    return null;
  }

  return (
    <ChartSourceBarBase
      width={width}
      top={top}
      left={left}
      n={n}
      brandingText={brandingText}
      accentColor={EDITION_COLORS.variscout}
    />
  );
};

export default ChartSourceBar;

/**
 * Get the height of the source bar (for margin calculations)
 */
export function getSourceBarHeight(): number {
  const showBranding = shouldShowBranding();
  return getSourceBarHeightBase(showBranding);
}
