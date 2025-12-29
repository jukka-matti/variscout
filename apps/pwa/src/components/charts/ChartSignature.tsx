import React from 'react';
import { shouldShowBranding, getSignatureText, isITCEdition } from '../../lib/edition';

interface ChartSignatureProps {
  x: number; // Right edge position
  y: number; // Bottom position (above source bar)
}

/**
 * Painter-style signature mark for charts
 * Renders a handwritten-style "VariScout" (or "ITC") signature
 * Only visible in Community/ITC editions, hidden for Pro
 */
const ChartSignature: React.FC<ChartSignatureProps> = ({ x, y }) => {
  const showBranding = shouldShowBranding();
  const isITC = isITCEdition();
  const signatureText = getSignatureText();

  // Don't render if Pro edition (no signature)
  if (!showBranding && !isITC) {
    return null;
  }

  // Don't render if no text
  if (!signatureText) {
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
