import React from 'react';
import { shouldShowBranding, getSignatureText } from '@variscout/core';
import { useChartTheme } from './useChartTheme';

export interface ChartSignatureProps {
  /** Right edge position */
  x: number;
  /** Bottom position (above source bar) */
  y: number;
}

/**
 * Painter-style signature mark for charts
 * Renders a handwritten-style "VariScout" signature
 * Only visible for free tier (branding required), hidden for paid tiers
 */
const ChartSignature: React.FC<ChartSignatureProps> = ({ x, y }) => {
  const { mode } = useChartTheme();
  const isExecutive = mode === 'executive';
  const showBranding = shouldShowBranding();
  const signatureText = getSignatureText();

  if (!showBranding || !signatureText) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fill="#64748b"
      fontSize={isExecutive ? 12 : 16}
      opacity={isExecutive ? 0.3 : 0.4}
      fontFamily={isExecutive ? 'Inter, sans-serif' : "'Caveat', cursive"}
      fontWeight={500}
      style={{ userSelect: 'none', letterSpacing: isExecutive ? '0.05em' : undefined }}
    >
      {isExecutive ? 'VARISCOUT' : signatureText}
    </text>
  );
};

export default ChartSignature;
