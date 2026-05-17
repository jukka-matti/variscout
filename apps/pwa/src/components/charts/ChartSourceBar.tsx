import React from 'react';
import {
  ChartSourceBar as ChartSourceBarBase,
  getSourceBarHeight as getSourceBarHeightBase,
} from '@variscout/charts';

interface ChartSourceBarProps {
  width: number;
  top: number;
  n?: number;
  left?: number;
}

/**
 * Chart source bar component - shows branding and sample size
 * PWA wrapper — branding is always shown (free PWA per ADR-082 wedge).
 */
const ChartSourceBar: React.FC<ChartSourceBarProps> = ({ width, top, n, left = 0 }) => {
  return (
    <ChartSourceBarBase width={width} top={top} left={left} n={n} brandingText="VariScout Lite" />
  );
};

export default ChartSourceBar;

/**
 * Get the height of the source bar (for margin calculations)
 */
export function getSourceBarHeight(): number {
  return getSourceBarHeightBase(true);
}
