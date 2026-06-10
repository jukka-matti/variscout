import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * useChartPaintLatch — keep a skeleton overlay up until the chart has *actually
 * painted*, not merely until stats resolve.
 *
 * The blank-card defect this fixes: `isLoading` clears the instant stats resolve
 * (a fast worker round-trip), but the chart paints LATER — visx `withParentSize`
 * renders an empty div until ResizeObserver fires, then commits the SVG render.
 * Gating on `!isLoading` alone leaves the dominant blank phase (stats done, SVG
 * not yet painted) uncovered — on a large dataset that phase is a multi-second
 * synchronous render.
 *
 * Contract: the overlay is visible from mount until the slot contains an `<svg>`
 * descendant AND `!isLoading`. Once hidden it stays hidden for the life of the
 * mount (mount-scoped latch) — recomputes after the first paint are covered by
 * the dim `isComputing` overlays elsewhere, never by re-showing the skeleton.
 *
 * Detection: an initial synchronous check + a `MutationObserver` (childList +
 * subtree) on the slot ref, disconnected once the svg appears. A capped rAF
 * polling fallback (~5s) covers any environment where the observer doesn't fire.
 *
 * @param slotRef ref to the element whose subtree the chart renders into
 * @param isLoading data/stats still pending (held closed regardless of paint)
 * @returns whether the skeleton overlay should be shown
 */
export function useChartPaintLatch(
  slotRef: RefObject<HTMLElement | null>,
  isLoading: boolean
): boolean {
  // Has the slot ever contained a painted <svg>? Mount-scoped latch: once true,
  // never flips back to false.
  const [svgPainted, setSvgPainted] = useState(false);
  const latchedRef = useRef(false);

  // Output latch: once the overlay has been allowed to hide (svg painted AND
  // loading cleared) it stays hidden for the life of the mount. A later
  // recompute (isLoading → true again) must NOT re-show the skeleton — the dim
  // isComputing overlays cover recomputes. This is React's sanctioned
  // "adjust state during render" pattern (converges immediately, no extra
  // commit / effect cascade): https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [hidden, setHidden] = useState(false);
  if (!hidden && svgPainted && !isLoading) setHidden(true);

  useEffect(() => {
    if (latchedRef.current) return;
    const slot = slotRef.current;
    if (!slot) return;

    const latch = () => {
      if (latchedRef.current) return;
      latchedRef.current = true;
      setSvgPainted(true);
    };

    // Initial synchronous check — the chart may already have painted by the
    // time this effect runs.
    if (slot.querySelector('svg')) {
      latch();
      return;
    }

    // MutationObserver fires outside React; the setState is safe (React batches).
    const observer = new MutationObserver(() => {
      if (slot.querySelector('svg')) {
        observer.disconnect();
        latch();
      }
    });
    observer.observe(slot, { childList: true, subtree: true });

    // Capped rAF polling fallback (~5s) in case the observer never fires
    // (defensive — MutationObserver exists in happy-dom + all target browsers).
    let rafId = 0;
    const start = Date.now();
    const poll = () => {
      if (latchedRef.current) return;
      if (slot.querySelector('svg')) {
        latch();
        return;
      }
      if (Date.now() - start < 5000) {
        rafId = requestAnimationFrame(poll);
      }
    };
    rafId = requestAnimationFrame(poll);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
    // slotRef is stable; we deliberately run this once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Overlay shows until the latch flips it hidden (svg painted AND !isLoading).
  return !hidden;
}
