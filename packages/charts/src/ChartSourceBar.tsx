import React from 'react';
import { Group } from '@visx/group';
import type { ChartSourceBarProps } from './types';
import { chromeColors } from './colors';

const BAR_HEIGHT = 18;
const ACCENT_WIDTH = 3;

/**
 * Chart source bar component - shows branding and sample size
 * Props-based version for sharing across platforms
 */
const ChartSourceBar: React.FC<ChartSourceBarProps> = ({
  width,
  top,
  left = 0,
  n,
  brandingText = 'VariScout Lite',
  accentColor = '#3b82f6',
  forceShow = false,
}) => {
  // If no branding text and not forced, don't render
  if (!brandingText && !forceShow) {
    return null;
  }

  return (
    <Group left={left} top={top}>
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={BAR_HEIGHT}
        fill={chromeColors.barBackground}
        opacity={0.6}
        rx={2}
      />

      {/* Accent bar on left */}
      <rect x={0} y={0} width={ACCENT_WIDTH} height={BAR_HEIGHT} fill={accentColor} rx={1} />

      {/* Branding text */}
      {brandingText && (
        <text
          x={ACCENT_WIDTH + 8}
          y={BAR_HEIGHT / 2}
          fill={chromeColors.labelSecondary}
          fontSize={10}
          fontWeight={500}
          dominantBaseline="central"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {brandingText}
        </text>
      )}

      {/* Sample size on right */}
      {n !== undefined && (
        <text
          x={width - 8}
          y={BAR_HEIGHT / 2}
          fill={chromeColors.labelMuted}
          fontSize={10}
          textAnchor="end"
          dominantBaseline="central"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          n={n}
        </text>
      )}
    </Group>
  );
};

export default ChartSourceBar;

/**
 * Get the height of the source bar (for margin calculations)
 */
export function getSourceBarHeight(showBranding: boolean = true): number {
  if (!showBranding) {
    return 0;
  }
  return BAR_HEIGHT + 4; // Bar height + small gap
}
