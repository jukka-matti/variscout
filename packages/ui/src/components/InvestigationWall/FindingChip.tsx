/**
 * FindingChip — Tethered chip for a Finding anchored on the Investigation Wall canvas.
 *
 * Positioned by its center-top point (x, y). Displays source label (chart name or
 * "observation") and finding text. Right-click detaches from the anchor.
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 */

import React from 'react';
import type { Finding } from '@variscout/core';

export interface FindingChipProps {
  finding: Finding;
  x: number;
  y: number;
  onSelect?: (id: string) => void;
  onDetach?: (id: string) => void;
}

const CHIP_W = 220;
const CHIP_H = 44;

export const FindingChip: React.FC<FindingChipProps> = ({ finding, x, y, onSelect, onDetach }) => {
  const sourceLabel = finding.source?.chart ? `${finding.source.chart}` : 'observation';
  const label = `Finding: ${finding.text || sourceLabel}`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CHIP_W / 2}, ${y})`}
      onClick={() => onSelect?.(finding.id)}
      onContextMenu={e => {
        e.preventDefault();
        onDetach?.(finding.id);
      }}
      className="cursor-pointer"
      data-validation={finding.validationStatus ?? 'none'}
    >
      <rect width={CHIP_W} height={CHIP_H} rx={6} className="fill-surface stroke-edge" />
      <text x={12} y={18} className="fill-content-subtle text-[9px] uppercase font-mono">
        {sourceLabel}
      </text>
      <text x={12} y={34} className="fill-content text-xs">
        {finding.text || '(no note)'}
      </text>
    </g>
  );
};
