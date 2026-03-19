import React from 'react';
import { shouldShowBranding, getSignatureText } from '@variscout/core';

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
      fontSize={16}
      opacity={0.4}
      fontFamily="'Caveat', cursive"
      fontWeight={500}
      style={{ userSelect: 'none' }}
    >
      {signatureText}
    </text>
  );
};

export default ChartSignature;
