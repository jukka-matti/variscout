/**
 * UpgradePrompt - Reusable component for feature-gated upgrade messaging
 *
 * Shows a prominent prompt to upgrade when users hit tier limits.
 * Configurable for different contexts (inline, modal, banner).
 */

import React from 'react';
import { AlertTriangle, ArrowRight, Lock, Sparkles } from 'lucide-react';
import type { LicenseTier } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

export interface UpgradePromptProps {
  /** Current license tier */
  tier: LicenseTier;
  /** Feature that triggered the prompt */
  feature?: string;
  /** Current usage count (e.g., channels selected) */
  currentCount?: number;
  /** Maximum allowed for current tier */
  maxAllowed?: number;
  /** URL to upgrade */
  upgradeUrl: string;
  /** Display variant */
  variant?: 'inline' | 'banner' | 'card';
  /** Custom title override */
  title?: string;
  /** Custom message override */
  message?: string;
  /** Callback when upgrade button clicked (for tracking) */
  onUpgradeClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  tier,
  feature = 'this feature',
  currentCount,
  maxAllowed,
  upgradeUrl,
  variant = 'inline',
  title,
  message,
  onUpgradeClick,
  className = '',
}) => {
  const { t } = useTranslation();
  const isFree = tier === 'free';

  // Default messages based on context
  const defaultTitle = isFree ? t('upgrade.title') : t('upgrade.limitReached');

  const defaultMessage =
    currentCount !== undefined && maxAllowed !== undefined
      ? isFree
        ? `The free tier allows up to ${maxAllowed} channels. You've selected ${currentCount}. Upgrade to analyze up to 1,500 channels.`
        : `You've selected ${currentCount} channels, which exceeds the ${maxAllowed} channel limit.`
      : isFree
        ? `Upgrade to unlock ${feature} and more advanced analysis capabilities.`
        : `You've reached the limit for ${feature}.`;

  const displayTitle = title ?? defaultTitle;
  const displayMessage = message ?? defaultMessage;

  const handleUpgradeClick = () => {
    onUpgradeClick?.();
  };

  // Banner variant (horizontal)
  if (variant === 'banner') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg bg-amber-600/10 border border-amber-600/30 ${className}`}
      >
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-300">{displayTitle}</p>
          <p className="text-xs text-slate-400 mt-0.5">{displayMessage}</p>
        </div>
        <a
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleUpgradeClick}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors flex-shrink-0"
        >
          {t('upgrade.upgrade')}
          <ArrowRight size={12} />
        </a>
      </div>
    );
  }

  // Card variant (larger, more prominent)
  if (variant === 'card') {
    return (
      <div
        className={`p-6 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-amber-600/20">
            <Lock size={24} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{displayTitle}</h3>
            <p className="text-sm text-slate-400">
              {tier === 'free' ? 'Free tier limitation' : 'Tier limit'}
            </p>
          </div>
        </div>

        <p className="text-slate-300 mb-6">{displayMessage}</p>

        <div className="flex items-center gap-4">
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors"
          >
            <Sparkles size={16} />
            {t('upgrade.viewOptions')}
            <ArrowRight size={14} />
          </a>
          <span className="text-xs text-slate-500">€150/month with Azure App</span>
        </div>
      </div>
    );
  }

  // Inline variant (compact, for form integration)
  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="text-amber-300">{displayTitle}: </span>
        <span className="text-slate-400">{displayMessage}</span>
        {isFree && (
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleUpgradeClick}
            className="ml-1 text-blue-400 hover:text-blue-300 underline"
          >
            {t('upgrade.upgrade')}
          </a>
        )}
      </div>
    </div>
  );
};

export default UpgradePrompt;
