import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Resilient drop-in replacement for visx's deprecated `withParentSize` HOC.
 *
 * Why this exists
 * ---------------
 * visx's `withParentSize` (`@visx/responsive`, marked `@deprecated`) renders
 * NO child until its ResizeObserver delivers a measurement, debounced through
 * lodash. Consumers never pass `initialWidth` / `initialHeight`, so the first
 * paint is blank by design. Worse: on REMOUNT (the apps mount views through a
 * conditional ternary chain, so every tab switch unmounts + remounts the view),
 * the ResizeObserver can capture a transient 0×0 contentRect and latch onto it,
 * sticking the chart at width 0 — a blank chart that only a full page reload
 * recovers. The bug is intermittent (a layout race) and reload-recoverable.
 *
 * The fix
 * -------
 * 1. Seed sensible initial dimensions so the BaseComponent renders immediately
 *    (never blank). `initialWidth` / `initialHeight` props override the defaults.
 * 2. Ignore degenerate measurements: any contentRect with width < 1 OR
 *    height < 1 is dropped — the last good (or initial) size is kept. A
 *    transient 0 can therefore never blank the chart.
 * 3. Measure on mount via ResizeObserver + a post-observe rAF to catch the
 *    settled layout size.
 * 4. Clean up the observer and any pending rAF on unmount.
 *
 * The injected-prop contract is identical to `withParentSize`: the wrapped
 * BaseComponent receives `parentWidth: number` and `parentHeight: number`, plus
 * any extra props forwarded through. Consumers swap the import + wrap line only.
 */

const DEFAULT_INITIAL_WIDTH = 640;
const DEFAULT_INITIAL_HEIGHT = 400;

const CONTAINER_STYLES: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

/** Dimensions injected into the wrapped base component. */
export interface WithResponsiveSizeProvidedProps {
  parentWidth: number;
  parentHeight: number;
}

/** Config props consumed by the wrapper itself (not forwarded as sizing). */
export interface WithResponsiveSizeConfigProps {
  /** Seed width used for the first paint and as the floor when no real size yet. */
  initialWidth?: number;
  /** Seed height used for the first paint and as the floor when no real size yet. */
  initialHeight?: number;
}

type WrapperProps<P extends WithResponsiveSizeProvidedProps> = Omit<
  P,
  keyof WithResponsiveSizeProvidedProps
> &
  WithResponsiveSizeConfigProps;

export function withResponsiveSize<P extends WithResponsiveSizeProvidedProps>(
  BaseComponent: React.ComponentType<P>
): React.FC<WrapperProps<P>> {
  const ResponsiveSized: React.FC<WrapperProps<P>> = props => {
    const { initialWidth = DEFAULT_INITIAL_WIDTH, initialHeight = DEFAULT_INITIAL_HEIGHT } = props;

    const [size, setSize] = useState<{ width: number; height: number }>({
      width: initialWidth,
      height: initialHeight,
    });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const rafIdRef = useRef<number | null>(null);

    // Ignore degenerate (<1px) measurements; keep the last good size otherwise.
    const applyMeasurement = useCallback((width: number, height: number) => {
      if (width < 1 || height < 1) return;
      setSize(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    }, []);

    useEffect(() => {
      const node = containerRef.current;
      if (!node || typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          applyMeasurement(width, height);
        }
      });
      observer.observe(node);

      // Catch the settled post-layout size on mount (handles the remount race
      // where the observer's first callback can fire with a transient 0×0).
      rafIdRef.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        applyMeasurement(rect.width, rect.height);
      });

      return () => {
        observer.disconnect();
        if (rafIdRef.current != null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }, [applyMeasurement]);

    // Strip wrapper-only config props before forwarding to the base component.
    const { initialWidth: _iw, initialHeight: _ih, ...rest } = props;

    const baseProps = {
      ...rest,
      parentWidth: size.width,
      parentHeight: size.height,
    } as unknown as P;

    return (
      <div style={CONTAINER_STYLES} ref={containerRef}>
        <BaseComponent {...baseProps} />
      </div>
    );
  };

  ResponsiveSized.displayName = `withResponsiveSize(${
    BaseComponent.displayName ?? BaseComponent.name ?? 'Component'
  })`;

  return ResponsiveSized;
}

export default withResponsiveSize;
