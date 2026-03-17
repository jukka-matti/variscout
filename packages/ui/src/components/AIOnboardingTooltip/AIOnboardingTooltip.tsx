import React, { useEffect, useState, useCallback, useRef } from 'react';

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
const AIOnboardingTooltip: React.FC<AIOnboardingTooltipProps> = ({
  isAIAvailable,
  anchorRef,
  anchorSelector,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getAnchorElement = useCallback((): HTMLElement | null => {
    if (anchorRef?.current) return anchorRef.current;
    if (anchorSelector) return document.querySelector<HTMLElement>(anchorSelector);
    return null;
  }, [anchorRef, anchorSelector]);

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

  // Position above anchor
  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const el = getAnchorElement();
      if (el) {
        const rect = el.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [visible, getAnchorElement]);

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

  if (!visible || !position) return null;

  return (
    <div
      ref={tooltipRef}
      data-testid="ai-onboarding-tooltip"
      className="fixed z-50 max-w-[280px] px-3 py-2 rounded-lg bg-blue-600 text-white text-xs shadow-lg transition-opacity duration-300"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <p>
        Tap &ldquo;Ask &rarr;&rdquo; to explore your data with AI assistance. You can control this
        in Settings.
      </p>
      {/* Arrow pointing down */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-blue-600 rotate-45"
        aria-hidden="true"
      />
    </div>
  );
};

export { AIOnboardingTooltip };
