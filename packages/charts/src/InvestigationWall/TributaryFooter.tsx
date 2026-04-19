/**
 * TributaryFooter — horizontal chip row below the Investigation Wall canvas.
 *
 * Shows all tributaries from the Process Map. Chips for tributaries that are
 * referenced by at least one SuspectedCause hub are fully opaque; orphan
 * tributaries (no hub reference) are dimmed to signal measurement gaps.
 */

import React from 'react';
import type { ProcessMapTributary, SuspectedCause } from '@variscout/core';

export interface TributaryFooterProps {
  tributaries: ProcessMapTributary[];
  hubs: SuspectedCause[];
  y: number;
  canvasWidth: number;
}

const CHIP_W = 140;
const CHIP_H = 36;
const CHIP_GAP = 24;

export const TributaryFooter: React.FC<TributaryFooterProps> = ({
  tributaries,
  hubs,
  y,
  canvasWidth,
}) => {
  if (tributaries.length === 0) return null;

  const referenced = new Set(hubs.flatMap(h => h.tributaryIds ?? []));
  const totalWidth = tributaries.length * CHIP_W + (tributaries.length - 1) * CHIP_GAP;
  const startX = (canvasWidth - totalWidth) / 2;

  return (
    <g aria-label="Tributaries from Process Map" transform={`translate(0, ${y})`}>
      <text
        x={canvasWidth / 2}
        y={-12}
        textAnchor="middle"
        className="fill-content-subtle text-[10px] uppercase font-mono"
      >
        Tributaries · live from Process Map
      </text>
      {tributaries.map((t, i) => {
        const x = startX + i * (CHIP_W + CHIP_GAP);
        const isOrphan = !referenced.has(t.id);
        return (
          <g
            key={t.id}
            transform={`translate(${x}, 0)`}
            className={isOrphan ? 'opacity-50' : ''}
            data-orphan={isOrphan}
            data-testid={`tributary-chip-${t.id}`}
          >
            <rect
              width={CHIP_W}
              height={CHIP_H}
              rx={CHIP_H / 2}
              className="fill-surface stroke-edge"
            />
            <text
              x={CHIP_W / 2}
              y={CHIP_H / 2 + 4}
              textAnchor="middle"
              className="fill-content text-xs font-mono"
            >
              {t.column}
            </text>
          </g>
        );
      })}
    </g>
  );
};
