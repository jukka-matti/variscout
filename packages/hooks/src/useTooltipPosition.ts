import { useLayoutEffect, useState, type RefObject, type CSSProperties } from 'react';

export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';

export interface UseTooltipPositionOptions {
  /** Preferred direction (default: 'top') */
  preferred?: TooltipDirection;
  /** Gap between trigger and tooltip in pixels (default: 10) */
  gap?: number;
  /** Only measure when true — set to tooltip visibility state (default: true) */
  enabled?: boolean;
}

export interface TooltipPositionResult {
  /** Resolved direction after viewport bounds check */
  position: TooltipDirection;
  /** Inline styles to apply to the tooltip element (position: fixed) */
  style: CSSProperties;
}

const FALLBACK_ORDER: Record<TooltipDirection, TooltipDirection[]> = {
  top: ['top', 'bottom', 'right', 'left'],
  bottom: ['bottom', 'top', 'right', 'left'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

/**
 * Check if a tooltip fits in a given direction without viewport clipping.
 * Returns the { top, left } position if it fits, or null if clipped.
 */
function tryDirection(
  dir: TooltipDirection,
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  gap: number
): { top: number; left: number } | null {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top: number;
  let left: number;

  switch (dir) {
    case 'top':
      top = triggerRect.top - tooltipHeight - gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      break;
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      left = triggerRect.left - tooltipWidth - gap;
      break;
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      left = triggerRect.right + gap;
      break;
  }

  // Clamp horizontal to viewport
  left = Math.max(4, Math.min(left, vw - tooltipWidth - 4));

  // Check if vertical position fits
  if (top < 4 || top + tooltipHeight > vh - 4) return null;

  return { top, left };
}

/**
 * Viewport-aware tooltip positioning hook.
 *
 * Measures trigger and tooltip elements, then picks the best direction
 * (preferred → opposite → perpendicular) that fits within the viewport.
 * Returns a `position` string (for arrow direction) and `style` object
 * to apply to the tooltip element.
 *
 * @example
 * ```tsx
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const tooltipRef = useRef<HTMLDivElement>(null);
 * const { position, style } = useTooltipPosition(triggerRef, tooltipRef, {
 *   preferred: 'top',
 *   enabled: isVisible,
 * });
 *
 * <div ref={tooltipRef} style={style}>
 *   ...tooltip content...
 *   <Arrow direction={position} />
 * </div>
 * ```
 */
export function useTooltipPosition(
  triggerRef: RefObject<HTMLElement | null>,
  tooltipRef: RefObject<HTMLElement | null>,
  options: UseTooltipPositionOptions = {}
): TooltipPositionResult {
  const { preferred = 'top', gap = 10, enabled = true } = options;

  const [result, setResult] = useState<TooltipPositionResult>({
    position: preferred,
    style: { position: 'fixed', visibility: 'hidden', top: 0, left: 0 },
  });

  useLayoutEffect(() => {
    if (!enabled) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Try each direction in fallback order
    const order = FALLBACK_ORDER[preferred];
    for (const dir of order) {
      const pos = tryDirection(dir, triggerRect, tooltipWidth, tooltipHeight, gap);
      if (pos) {
        setResult({
          position: dir,
          style: {
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            visibility: 'visible',
          },
        });
        return;
      }
    }

    // All directions clipped — use preferred with clamping
    const fallbackTop = Math.max(
      4,
      Math.min(
        window.innerHeight - tooltipHeight - 4,
        preferred === 'top' ? triggerRect.top - tooltipHeight - gap : triggerRect.bottom + gap
      )
    );
    const fallbackLeft = Math.max(
      4,
      Math.min(
        window.innerWidth - tooltipWidth - 4,
        triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
      )
    );

    setResult({
      position: preferred,
      style: {
        position: 'fixed',
        top: fallbackTop,
        left: fallbackLeft,
        visibility: 'visible',
      },
    });
  }, [enabled, preferred, gap, triggerRef, tooltipRef]);

  return result;
}
