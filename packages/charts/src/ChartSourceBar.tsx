import React from 'react';
import { Group } from '@visx/group';
import type { ChartSourceBarProps } from './types';
import { chromeColors } from './colors';

const BAR_HEIGHT = 20;
const BADGE_WIDTH = 140; // Estimated width for "VariScout Lite | n=..."

/**
 * Chart source bar component - shows branding and sample size
 * Props-based version for sharing across platforms
 *
 * Option 2: Floating Badge Design
 */
const ChartSourceBar: React.FC<ChartSourceBarProps> = ({
  width,
  top,
  left = 0,
  n,
  brandingText = 'VariScout Lite',
  accentColor = '#3b82f6',
  forceShow = false,
  fontSize = 10,
}) => {
  // If no branding text and not forced, don't render
  if (!brandingText && !forceShow) {
    return null;
  }

  // Position: Bottom-Right of the chart/footer area
  // We align it to the right side
  const badgeX = width - BADGE_WIDTH;
  const badgeY = 0;

  return (
    <Group left={left} top={top}>
      {/* Badge container group */}
      <Group left={badgeX} top={badgeY}>
        {/* Pill-shaped Background */}
        <rect
          x={0}
          y={0}
          width={BADGE_WIDTH}
          height={BAR_HEIGHT}
          fill={chromeColors.barBackground}
          opacity={0.8}
          rx={BAR_HEIGHT / 2}
          stroke={chromeColors.tooltipBorder}
          strokeWidth={1}
        />

        {/* Brand dot on left */}
        <circle cx={10} cy={BAR_HEIGHT / 2} r={3} fill={accentColor} />

        {/* Branding text */}
        {brandingText && (
          <text
            x={18}
            y={BAR_HEIGHT / 2}
            fill={chromeColors.labelPrimary}
            fontSize={fontSize}
            fontWeight={600}
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {brandingText}
          </text>
        )}

        {/* Sample size on right */}
        {n !== undefined && (
          <text
            x={BADGE_WIDTH - 12}
            y={BAR_HEIGHT / 2}
            fill={chromeColors.labelMuted}
            fontSize={fontSize}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            n={n}
          </text>
        )}
      </Group>
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
  return BAR_HEIGHT + 8; // Bar height + padding
}
