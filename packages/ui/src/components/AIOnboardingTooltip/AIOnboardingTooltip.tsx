import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTooltipPosition } from '@variscout/hooks';

const STORAGE_KEY = 'variscout_ai_onboarding_seen';

export interface AIOnboardingTooltipProps {
  /** Whether AI features are available */
  isAIAvailable: boolean;
  /** Ref to the anchor element (e.g. NarrativeBar "Ask" button) */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Alternative: CSS selector to find the anchor element in the DOM */
  anchorSelector?: string;
}

/**
 * First-time onboarding tooltip pointing to the NarrativeBar "Ask" button.
 * Shows once per browser, dismissed on any click.
 */
/** Arrow classes for each direction */
function getArrowClass(dir: 'top' | 'bottom' | 'left' | 'right'): string {
  const base = 'absolute w-3 h-3 bg-blue-600 rotate-45';
  switch (dir) {
    case 'top':
      return `${base} left-1/2 -translate-x-1/2 -bottom-1.5`;
    case 'bottom':
      return `${base} left-1/2 -translate-x-1/2 -top-1.5`;
    case 'left':
      return `${base} top-1/2 -translate-y-1/2 -right-1.5`;
    case 'right':
      return `${base} top-1/2 -translate-y-1/2 -left-1.5`;
  }
}

const AIOnboardingTooltip: React.FC<AIOnboardingTooltipProps> = ({
  isAIAvailable,
  anchorRef,
  anchorSelector,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Resolve anchor element into a stable ref for the hook
  const resolvedAnchorRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (anchorRef?.current) {
      resolvedAnchorRef.current = anchorRef.current;
    } else if (anchorSelector) {
      resolvedAnchorRef.current = document.querySelector<HTMLElement>(anchorSelector);
    }
  }, [anchorRef, anchorSelector, visible]);

  const { position, style } = useTooltipPosition(resolvedAnchorRef, tooltipRef, {
    preferred: 'top',
    enabled: visible,
  });

  // Check if already seen
  useEffect(() => {
    if (!isAIAvailable) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Delay to allow anchor to render
        const timer = setTimeout(() => setVisible(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — skip
    }
  }, [isAIAvailable]);

  // Dismiss on any click
  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // localStorage unavailable — tooltip won't persist
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = () => dismiss();
    // Delay listener to avoid immediate dismiss from the click that triggers render
    const timer = setTimeout(() => {
      document.addEventListener('click', handler, { once: true });
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      data-testid="ai-onboarding-tooltip"
      className="z-50 max-w-[280px] px-3 py-2 rounded-lg bg-blue-600 text-white text-xs shadow-lg transition-opacity duration-300"
      style={style}
    >
      <p>
        Tap &ldquo;Ask &rarr;&rdquo; to explore your data with AI assistance. You can control this
        in Settings.
      </p>
      {/* Arrow */}
      <div className={getArrowClass(position)} aria-hidden="true" />
    </div>
  );
};

export { AIOnboardingTooltip };
