import React from 'react';
import {
  ChartSourceBar as ChartSourceBarBase,
  getSourceBarHeight as getSourceBarHeightBase,
} from '@variscout/charts';
import { EDITION_COLORS } from '@variscout/core';
import { shouldShowBranding, getBrandingText, isITCEdition } from '../../lib/edition';

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
  const isITC = isITCEdition();
  const brandingText = getBrandingText();

  // Don't render if Pro edition (no branding)
  if (!showBranding && !isITC) {
    return null;
  }

  // Accent color: ITC blue for ITC, VariScout blue for community
  const accentColor = isITC ? EDITION_COLORS.itc : EDITION_COLORS.variscout;

  return (
    <ChartSourceBarBase
      width={width}
      top={top}
      left={left}
      n={n}
      brandingText={brandingText}
      accentColor={accentColor}
      forceShow={isITC}
    />
  );
};

export default ChartSourceBar;

/**
 * Get the height of the source bar (for margin calculations)
 */
export function getSourceBarHeight(): number {
  const showBranding = shouldShowBranding();
  const isITC = isITCEdition();

  return getSourceBarHeightBase(showBranding || isITC);
}
