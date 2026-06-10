/**
 * Tests for useChartPaintLatch — the svg-paint skeleton-overlay latch.
 *
 * The overlay must stay up until the slot contains a painted <svg> AND loading
 * has cleared; once hidden it must never re-show (mount-scoped latch). Detection
 * is a sync check + MutationObserver + a capped rAF fallback.
 */
import React, { useRef, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useChartPaintLatch } from '../useChartPaintLatch';
import { flushRaf } from '../../../../test-utils/raf';

/**
 * Harness: a slot the latch observes, with buttons to (a) inject an svg into the
 * slot after mount and (b) toggle isLoading — modelling the real stats-resolve
 * and async-svg-paint timeline.
 */
const Harness: React.FC<{ initialLoading?: boolean; initialSvg?: boolean }> = ({
  initialLoading = false,
  initialSvg = false,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [hasSvg, setHasSvg] = useState(initialSvg);
  const showSkeleton = useChartPaintLatch(slotRef, loading);
  return (
    <div>
      <button data-testid="add-svg" onClick={() => setHasSvg(true)}>
        add svg
      </button>
      <button data-testid="load-on" onClick={() => setLoading(true)}>
        load on
      </button>
      <button data-testid="load-off" onClick={() => setLoading(false)}>
        load off
      </button>
      <div ref={slotRef} data-testid="slot">
        {hasSvg && <svg data-testid="slot-svg" />}
      </div>
      {showSkeleton && <div data-testid="overlay">overlay</div>}
    </div>
  );
};

describe('useChartPaintLatch', () => {
  it('shows the overlay at mount when the slot has no svg', () => {
    render(<Harness />);
    expect(screen.getByTestId('overlay')).toBeDefined();
  });

  it('hides the overlay when an svg is already present at mount', async () => {
    render(<Harness initialSvg />);
    await flushRaf();
    expect(screen.queryByTestId('overlay')).toBeNull();
  });

  it('hides the overlay once an svg is injected into the slot (MutationObserver)', async () => {
    render(<Harness />);
    expect(screen.getByTestId('overlay')).toBeDefined();
    fireEvent.click(screen.getByTestId('add-svg'));
    // Let the MutationObserver microtask (+ React commit) settle.
    await act(async () => {
      await Promise.resolve();
    });
    await flushRaf();
    expect(screen.queryByTestId('overlay')).toBeNull();
  });

  it('keeps the overlay while loading is true even with an svg present', async () => {
    render(<Harness initialLoading initialSvg />);
    await flushRaf();
    expect(screen.getByTestId('overlay')).toBeDefined();
  });

  it('releases the overlay when loading flips false after the svg painted', async () => {
    render(<Harness initialLoading initialSvg />);
    await flushRaf();
    expect(screen.getByTestId('overlay')).toBeDefined();
    fireEvent.click(screen.getByTestId('load-off'));
    await flushRaf();
    expect(screen.queryByTestId('overlay')).toBeNull();
  });

  it('latches: re-loading after the overlay hid does NOT bring it back', async () => {
    render(<Harness initialSvg />);
    await flushRaf();
    expect(screen.queryByTestId('overlay')).toBeNull();
    fireEvent.click(screen.getByTestId('load-on'));
    await flushRaf();
    // The mount-scoped latch holds the overlay hidden through a recompute.
    expect(screen.queryByTestId('overlay')).toBeNull();
  });
});
