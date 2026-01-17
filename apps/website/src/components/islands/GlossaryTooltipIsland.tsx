/**
 * GlossaryTooltipIsland.tsx - React island for interactive glossary tooltips
 *
 * Use this when you need:
 * - Keyboard navigation support
 * - Interactive hover/focus handling
 * - Programmatic term lookup from termId
 *
 * For simple static tooltips in Astro pages, use GlossaryTooltip.astro instead.
 */

import React from 'react';
import { HelpTooltip } from '@variscout/ui';
import { getTerm } from '@variscout/core';

interface GlossaryTooltipIslandProps {
  /** The term ID to look up in the glossary */
  termId: string;
  /** Current language for learn more links */
  lang?: string;
  /** Children to wrap (if not provided, shows info icon) */
  children?: React.ReactNode;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Icon size in pixels */
  iconSize?: number;
  /** Whether to show the "Learn more" link */
  showLearnMore?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * GlossaryTooltipIsland - Interactive glossary tooltip as a React island
 *
 * Usage in Astro:
 * ```astro
 * <GlossaryTooltipIsland client:visible termId="cpk" lang="en">
 *   <span>Cpk</span>
 * </GlossaryTooltipIsland>
 * ```
 */
export default function GlossaryTooltipIsland({
  termId,
  lang = 'en',
  children,
  position = 'top',
  iconSize = 14,
  showLearnMore = true,
  className = '',
}: GlossaryTooltipIslandProps) {
  const term = getTerm(termId);

  if (!term) {
    // If term not found, just render children without tooltip
    return <>{children}</>;
  }

  // Override the learnMorePath to use localized glossary page
  const localizedTerm = {
    ...term,
    learnMorePath: `/${lang}/glossary/${termId}`,
  };

  // Website base URL for learn more links
  const websiteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://variscout.com';

  return (
    <HelpTooltip
      term={localizedTerm}
      position={position}
      iconSize={iconSize}
      showLearnMore={showLearnMore}
      className={className}
      websiteUrl={websiteUrl}
    >
      {children}
    </HelpTooltip>
  );
}
