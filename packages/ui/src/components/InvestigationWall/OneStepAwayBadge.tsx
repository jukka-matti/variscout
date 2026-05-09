/**
 * OneStepAwayBadge — inline badge rendered on a HypothesisCard to signal that
 * a single disconfirmation test would promote the hypothesis from evidenced to
 * confirmed.
 *
 * Rendered inside an SVG `foreignObject` so it can use HTML/Tailwind classes.
 * The message string is resolved by the caller (i18n + locale), keeping this
 * component purely presentational and reusable.
 */

import React from 'react';

export interface OneStepAwayBadgeProps {
  /** Resolved, localised message string. */
  message: string;
  /** SVG x position of the foreignObject (pixels). */
  x: number;
  /** SVG y position of the foreignObject (pixels). */
  y: number;
  /** Width of the foreignObject (pixels). */
  width: number;
  /** Height of the foreignObject (pixels). */
  height: number;
}

export function OneStepAwayBadge({
  message,
  x,
  y,
  width,
  height,
}: OneStepAwayBadgeProps): React.ReactElement {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className="flex h-full items-center overflow-hidden rounded border border-amber-600 bg-amber-50 px-1.5 text-[10px] text-amber-900">
        {message}
      </div>
    </foreignObject>
  );
}
