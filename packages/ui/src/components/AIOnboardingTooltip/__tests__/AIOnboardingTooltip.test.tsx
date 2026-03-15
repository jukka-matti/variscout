import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AIOnboardingTooltip } from '../AIOnboardingTooltip';

describe('AIOnboardingTooltip', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const createAnchorRef = () => {
    const el = document.createElement('button');
    el.getBoundingClientRect = () => ({
      top: 100,
      left: 200,
      width: 60,
      height: 30,
      bottom: 130,
      right: 260,
      x: 200,
      y: 100,
      toJSON: () => {},
    });
    return { current: el };
  };

  it('renders tooltip when AI is available and not previously seen', () => {
    const ref = createAnchorRef();
    render(<AIOnboardingTooltip isAIAvailable={true} anchorRef={ref} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId('ai-onboarding-tooltip')).toBeTruthy();
    expect(screen.getByText(/Tap/)).toBeTruthy();
  });

  it('does not render when AI is not available', () => {
    const ref = createAnchorRef();
    render(<AIOnboardingTooltip isAIAvailable={false} anchorRef={ref} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByTestId('ai-onboarding-tooltip')).toBeNull();
  });

  it('does not render when already seen', () => {
    getItemSpy.mockReturnValue('1');
    const ref = createAnchorRef();
    render(<AIOnboardingTooltip isAIAvailable={true} anchorRef={ref} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByTestId('ai-onboarding-tooltip')).toBeNull();
  });

  it('dismisses on click and persists to localStorage', () => {
    const ref = createAnchorRef();
    render(<AIOnboardingTooltip isAIAvailable={true} anchorRef={ref} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId('ai-onboarding-tooltip')).toBeTruthy();

    // Advance past the 100ms listener delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(screen.queryByTestId('ai-onboarding-tooltip')).toBeNull();
    expect(setItemSpy).toHaveBeenCalledWith('variscout_ai_onboarding_seen', '1');
  });
});
