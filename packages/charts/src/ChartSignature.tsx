import React from 'react';
import { chromeColors } from './colors';

export interface ChartSignatureProps {
  /** Right edge position */
  x: number;
  /** Bottom position (above source bar) */
  y: number;
  /** Signature text to render. Pass an empty string (or omit) to hide the signature. */
  text?: string;
}

/**
 * Painter-style signature mark for charts.
 * Renders a handwritten-style watermark text (e.g. "VariScout").
 * Consumers decide whether to render the signature based on their context
 * (e.g. the free PWA shows it; paid Azure does not).
 */
const ChartSignature: React.FC<ChartSignatureProps> = ({ x, y, text }) => {
  if (!text) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fill={chromeColors.labelMuted}
      fontSize={16}
      opacity={0.4}
      fontFamily="'Caveat', cursive"
      fontWeight={500}
      style={{ userSelect: 'none' }}
    >
      {text}
    </text>
  );
};

export default ChartSignature;
