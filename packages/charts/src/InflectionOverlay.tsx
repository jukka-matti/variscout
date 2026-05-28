import React from 'react';
import { chartColors } from './colors';

export interface InflectionOverlayProps {
  /** Cut positions in source-column value space (sorted ascending). */
  cuts: number[];
  /** Visx X-scale from the parent ProbabilityPlot. */
  xScale: (v: number) => number;
  /** SVG-pixel y bounds: [y_top, y_bottom]. */
  yRange: [number, number];
  /** 'ghost' = proposal (semi-transparent); 'solid' = committed binding. */
  variant: 'ghost' | 'solid';
}

/**
 * Renders dashed vertical cyan guide lines at cut positions on a probability plot.
 *
 * Two variants:
 * - 'ghost': semi-transparent (strokeOpacity 0.5) — for proposal / preview state
 * - 'solid': fully opaque (strokeOpacity 1) — for committed bin boundaries
 *
 * Uses `chartColors.control` (cyan-500) per the V1 color discipline.
 * The group is aria-hidden so screen readers do not announce decorative overlays.
 */
export function InflectionOverlay({
  cuts,
  xScale,
  yRange,
  variant,
}: InflectionOverlayProps): React.ReactElement | null {
  if (cuts.length === 0) return null;

  const strokeOpacity = variant === 'ghost' ? 0.5 : 1;
  const [yTop, yBottom] = yRange;

  return (
    <g aria-hidden="true" data-testid="inflection-overlay">
      {cuts.map((cut, index) => {
        const x = xScale(cut);
        return (
          <line
            key={index}
            data-testid={`inflection-cut-${index}`}
            x1={x}
            y1={yTop}
            x2={x}
            y2={yBottom}
            stroke={chartColors.control}
            strokeWidth={1.5}
            strokeDasharray="4,4"
            strokeOpacity={strokeOpacity}
            className="transition-opacity duration-300 ease-out"
          />
        );
      })}
    </g>
  );
}
