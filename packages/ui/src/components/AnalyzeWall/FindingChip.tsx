/**
 * FindingChip — Tethered chip for a Finding anchored on the Investigation Wall canvas.
 *
 * Positioned by its center-top point (x, y). Displays source label (chart name or
 * "observation") and finding text. Right-click detaches from the anchor.
 *
 * IM-4c: orphan findings (linked to no hub) render a "Propose hypothesis"
 * affordance when `onProposeHypothesis` is provided — the descoped
 * finding→hypothesis-on-Wall (createHubFromFinding) seam, now wired.
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 */

import React from 'react';
import type { Finding } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

export interface FindingChipProps {
  finding: Finding;
  x: number;
  y: number;
  onSelect?: (id: string) => void;
  onDetach?: (id: string) => void;
  /**
   * IM-4c — "propose suspected mechanism from this finding". When provided, the
   * chip renders a small propose-hypothesis button. Firing it calls back with the
   * findingId; the app spawns a hypothesis card on the Wall (createHubFromFinding
   * through the rendered-hubs path). Omit to hide the affordance (the default for
   * hub-linked chips — only orphan chips wire it).
   */
  onProposeHypothesis?: (findingId: string) => void;
}

const CHIP_W = 220;
const CHIP_H = 44;

export const FindingChip: React.FC<FindingChipProps> = ({
  finding,
  x,
  y,
  onSelect,
  onDetach,
  onProposeHypothesis,
}) => {
  const locale = useWallLocale();
  const sourceLabel = finding.source?.chart ? `${finding.source.chart}` : 'observation';
  const label = `Finding: ${finding.text || sourceLabel}`;
  const proposeLabel = getMessage(locale, 'wall.cta.proposeHypothesis');
  return (
    <g data-validation={finding.validationStatus ?? 'none'}>
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
      >
        <rect width={CHIP_W} height={CHIP_H} rx={6} className="fill-surface stroke-edge" />
        <text x={12} y={18} className="fill-content-subtle text-[9px] uppercase font-mono">
          {sourceLabel}
        </text>
        <text x={12} y={34} className="fill-content text-xs">
          {finding.text || '(no note)'}
        </text>
      </g>
      {onProposeHypothesis && (
        <g
          role="button"
          tabIndex={0}
          aria-label={proposeLabel}
          data-no-wall-pan
          transform={`translate(${x - CHIP_W / 2}, ${y + CHIP_H + 4})`}
          onClick={e => {
            e.stopPropagation();
            onProposeHypothesis(finding.id);
          }}
          className="cursor-pointer"
        >
          <rect width={CHIP_W} height={22} rx={4} className="fill-surface-secondary stroke-edge" />
          <text
            x={CHIP_W / 2}
            y={15}
            textAnchor="middle"
            className="fill-content-muted text-[10px]"
          >
            {proposeLabel}
          </text>
        </g>
      )}
    </g>
  );
};
