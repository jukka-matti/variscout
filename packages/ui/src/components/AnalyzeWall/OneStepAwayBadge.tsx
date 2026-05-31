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
  /**
   * FE-2b — when provided, the badge becomes a clickable affordance that opens
   * the hub's test plan pre-staged with "Try to break it" (the existing Survey
   * one-hint-per-hypothesis stays the only ambient nudge). The label is the
   * accessible name. When omitted, the badge stays a passive label.
   */
  onClick?: () => void;
  /** FE-2b — accessible name for the clickable affordance. */
  actionLabel?: string;
}

export function OneStepAwayBadge({
  message,
  x,
  y,
  width,
  height,
  onClick,
  actionLabel,
}: OneStepAwayBadgeProps): React.ReactElement {
  const className =
    'flex h-full w-full items-center overflow-hidden rounded border border-amber-600 bg-amber-50 px-1.5 text-[10px] text-amber-900';
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      {onClick ? (
        <button
          type="button"
          data-testid="one-step-away-action"
          aria-label={actionLabel ?? message}
          className={`${className} text-left hover:bg-amber-100`}
          onClick={e => {
            // The card wrapper captures clicks to focus the hub; stop propagation
            // so this affordance owns its own action.
            e.stopPropagation();
            onClick();
          }}
        >
          {message}
        </button>
      ) : (
        <div className={className}>{message}</div>
      )}
    </foreignObject>
  );
}
