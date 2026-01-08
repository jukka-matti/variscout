import React from 'react';
import { shouldShowBranding, getSignatureText, isITCEdition } from '../../lib/edition';

interface ChartSignatureProps {
  x: number; // Right edge position
  y: number; // Bottom position (above source bar)
}

/**
 * Painter-style signature mark for charts
 * Note: Azure deployments are always licensed, so no signature is shown
 */
const ChartSignature: React.FC<ChartSignatureProps> = ({ x, y }) => {
  const showBranding = shouldShowBranding();
  const isITC = isITCEdition();
  const signatureText = getSignatureText();

  // Azure deployments are licensed, so no signature is shown
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
