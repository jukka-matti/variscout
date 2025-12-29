import React from 'react';
import { Group } from '@visx/group';
import { shouldShowBranding, getBrandingText, isITCEdition } from '../../lib/edition';

interface ChartSourceBarProps {
  width: number;
  top: number;
  n?: number;
  left?: number;
}

const BAR_HEIGHT = 18;
const ACCENT_WIDTH = 3;

/**
 * Chart source bar component - shows branding and sample size
 * Only visible in Community edition (or ITC with ITC branding)
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
  const accentColor = isITC ? '#007FBD' : '#3b82f6';

  return (
    <Group left={left} top={top}>
      {/* Background */}
      <rect x={0} y={0} width={width} height={BAR_HEIGHT} fill="#334155" opacity={0.6} rx={2} />

      {/* Accent bar on left */}
      <rect x={0} y={0} width={ACCENT_WIDTH} height={BAR_HEIGHT} fill={accentColor} rx={1} />

      {/* Branding text */}
      <text
        x={ACCENT_WIDTH + 8}
        y={BAR_HEIGHT / 2}
        fill="#94a3b8"
        fontSize={10}
        fontWeight={500}
        dominantBaseline="central"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {brandingText}
      </text>

      {/* Sample size on right */}
      {n !== undefined && (
        <text
          x={width - 8}
          y={BAR_HEIGHT / 2}
          fill="#64748b"
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
export function getSourceBarHeight(): number {
  const showBranding = shouldShowBranding();
  const isITC = isITCEdition();

  if (!showBranding && !isITC) {
    return 0;
  }

  return BAR_HEIGHT + 4; // Bar height + small gap
}
