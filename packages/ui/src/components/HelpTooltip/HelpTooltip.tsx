import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Info } from 'lucide-react';
import type { GlossaryTerm } from '@variscout/core';
import './HelpTooltip.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface HelpTooltipProps {
  /** The term ID to look up in the glossary */
  termId?: string;
  /** Direct term object (takes precedence over termId lookup) */
  term?: GlossaryTerm;
  /** Icon size in pixels */
  iconSize?: number;
  /** Base URL for the website (e.g., 'https://variscout.com') */
  websiteUrl?: string;
  /** Callback when "Learn more" is clicked */
  onLearnMoreClick?: (path: string) => void;
  /** Tooltip position relative to the icon */
  position?: TooltipPosition;
  /** Additional CSS class name */
  className?: string;
  /** Custom content to wrap (if not provided, shows info icon) */
  children?: React.ReactNode;
  /** Whether to show the "Learn more" link */
  showLearnMore?: boolean;
}

/**
 * HelpTooltip - A unified tooltip component for showing glossary definitions
 *
 * Features:
 * - Renders ⓘ icon (or wraps children)
 * - Shows tooltip on hover with definition
 * - "Learn more →" link opens website in new tab
 * - Uses CSS custom properties for theming
 * - Accessible: role="tooltip", keyboard focusable
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  termId,
  term,
  iconSize = 14,
  websiteUrl = 'https://variscout.com',
  onLearnMoreClick,
  position = 'top',
  className = '',
  children,
  showLearnMore = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = `help-tooltip-${termId || 'custom'}`;

  // Handle click on learn more link
  const handleLearnMoreClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const path = term?.learnMorePath;
      if (!path) return;

      if (onLearnMoreClick) {
        onLearnMoreClick(path);
      } else {
        // Open in new tab
        window.open(`${websiteUrl}${path}`, '_blank', 'noopener,noreferrer');
      }
    },
    [term?.learnMorePath, onLearnMoreClick, websiteUrl]
  );

  // Close tooltip on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isVisible || isFocused)) {
        setIsVisible(false);
        setIsFocused(false);
        triggerRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isFocused]);

  // No term data - render nothing or just children
  if (!term) {
    return children ? <>{children}</> : null;
  }

  const showTooltip = isVisible || isFocused;

  return (
    <span
      ref={triggerRef}
      className={`help-tooltip-wrapper ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      role="button"
      aria-describedby={showTooltip ? tooltipId : undefined}
      aria-label={`Help: ${term.label}`}
    >
      {children || <Info size={iconSize} className="help-tooltip-icon" aria-hidden="true" />}

      <div
        ref={tooltipRef}
        id={tooltipId}
        className={`help-tooltip help-tooltip--${position} ${showTooltip ? 'help-tooltip--visible' : ''}`}
        role="tooltip"
        aria-hidden={!showTooltip}
      >
        <div className="help-tooltip__content">
          <span className="help-tooltip__label">{term.label}</span>
          <p className="help-tooltip__definition">{term.definition}</p>

          {showLearnMore && term.learnMorePath && (
            <a
              href={`${websiteUrl}${term.learnMorePath}`}
              className="help-tooltip__link"
              onClick={handleLearnMoreClick}
              tabIndex={showTooltip ? 0 : -1}
            >
              Learn more →
            </a>
          )}
        </div>
        <span className="help-tooltip__arrow" aria-hidden="true" />
      </div>
    </span>
  );
};

export default HelpTooltip;
