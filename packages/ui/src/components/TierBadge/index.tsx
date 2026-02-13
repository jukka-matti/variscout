/**
 * TierBadge - Display current license tier with color coding
 *
 * Shows the current tier as a compact badge with optional upgrade link.
 * Color-coded by tier level for quick visual identification.
 */

import React from 'react';
import { Sparkles, Building2, ExternalLink } from 'lucide-react';
import type { LicenseTier } from '@variscout/core';

export interface TierBadgeProps {
  /** Current license tier */
  tier: LicenseTier;
  /** Human-readable tier description (optional override) */
  description?: string;
  /** URL for upgrade (shows link if provided) */
  upgradeUrl?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get tier-specific styling
 */
function getTierStyles(tier: LicenseTier): {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
} {
  switch (tier) {
    case 'free':
      return {
        bg: 'bg-slate-600/20',
        text: 'text-slate-300',
        border: 'border-slate-600/50',
        icon: <Sparkles size={12} className="text-slate-400" />,
      };
    case 'enterprise':
      return {
        bg: 'bg-amber-600/20',
        text: 'text-amber-300',
        border: 'border-amber-600/50',
        icon: <Building2 size={12} className="text-amber-400" />,
      };
    default:
      return {
        bg: 'bg-slate-600/20',
        text: 'text-slate-300',
        border: 'border-slate-600/50',
        icon: null,
      };
  }
}

/**
 * Get default description for tier
 */
function getDefaultDescription(tier: LicenseTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  description,
  upgradeUrl,
  size = 'sm',
  className = '',
}) => {
  const styles = getTierStyles(tier);
  const displayText = description ?? getDefaultDescription(tier);

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${styles.border} ${styles.text} ${sizeClasses} ${className}`}
    >
      {styles.icon}
      <span className="font-medium">{displayText}</span>
    </span>
  );

  // If upgrade URL provided and on free tier, wrap in link
  if (upgradeUrl && tier === 'free') {
    return (
      <a
        href={upgradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity group"
        title="Upgrade to unlock more features"
      >
        {badge}
        <ExternalLink
          size={10}
          className="text-slate-500 group-hover:text-slate-400 transition-colors"
        />
      </a>
    );
  }

  return badge;
};

export default TierBadge;
