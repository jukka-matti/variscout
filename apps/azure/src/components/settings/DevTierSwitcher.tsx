/**
 * DevTierSwitcher - Development-only tier switching UI
 *
 * Provides a fixed-position panel to quickly switch between tiers during development.
 * Only renders in development mode (import.meta.env.DEV === true).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Settings, X, Building2, Sparkles, Users, User } from 'lucide-react';
import type { LicenseTier, MarketplacePlan } from '@variscout/core';
import {
  getTier,
  setDevTierOverride,
  getDevTierOverrideValue,
  getPlan,
  setDevPlanOverride,
  getDevPlanOverrideValue,
  isDevelopmentMode,
} from '../../lib/edition';

interface TierOption {
  tier: LicenseTier;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TIER_OPTIONS: TierOption[] = [
  {
    tier: 'free',
    label: 'Free',
    icon: <Sparkles size={14} />,
    color: 'bg-slate-600 hover:bg-slate-500',
  },
  {
    tier: 'enterprise',
    label: 'Enterprise',
    icon: <Building2 size={14} />,
    color: 'bg-amber-600 hover:bg-amber-500',
  },
];

interface PlanOption {
  plan: MarketplacePlan;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    plan: 'standard',
    label: 'Standard',
    icon: <User size={14} />,
    color: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    plan: 'team',
    label: 'Team',
    icon: <Users size={14} />,
    color: 'bg-violet-600 hover:bg-violet-500',
  },
  {
    plan: 'team-ai',
    label: 'Team AI',
    icon: <Sparkles size={14} />,
    color: 'bg-emerald-600 hover:bg-emerald-500',
  },
];

/**
 * DevTierSwitcher component
 * Only renders in development mode
 */
export const DevTierSwitcher: React.FC = () => {
  // Only render in development mode
  if (!isDevelopmentMode()) {
    return null;
  }

  return <DevTierSwitcherContent />;
};

/**
 * Inner component that handles the UI
 */
const DevTierSwitcherContent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<LicenseTier>(getTier());
  const [currentPlan, setCurrentPlan] = useState<MarketplacePlan>(getPlan());
  const [hasOverride, setHasOverride] = useState(
    getDevTierOverrideValue() !== null || getDevPlanOverrideValue() !== null
  );

  // Update state when tier/plan changes (e.g., from localStorage on mount)
  useEffect(() => {
    setCurrentTier(getTier());
    setCurrentPlan(getPlan());
    setHasOverride(getDevTierOverrideValue() !== null || getDevPlanOverrideValue() !== null);
  }, []);

  const handleTierChange = useCallback((tier: LicenseTier) => {
    setDevTierOverride(tier);
    setCurrentTier(tier);
    setHasOverride(true);
    // Force a page reload to reinitialize all tier-dependent state
    window.location.reload();
  }, []);

  const handlePlanChange = useCallback((plan: MarketplacePlan) => {
    setDevPlanOverride(plan);
    setCurrentPlan(plan);
    setHasOverride(true);
    window.location.reload();
  }, []);

  const handleClearOverride = useCallback(() => {
    setDevTierOverride(null);
    setDevPlanOverride(null);
    setCurrentTier(getTier());
    setCurrentPlan(getPlan());
    setHasOverride(false);
    window.location.reload();
  }, []);

  const currentOption = TIER_OPTIONS.find(o => o.tier === currentTier) || TIER_OPTIONS[0];
  const currentPlanOption = PLAN_OPTIONS.find(o => o.plan === currentPlan) || PLAN_OPTIONS[0];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border border-edge-secondary ${currentOption.color} text-white text-sm font-medium transition-colors`}
          title="Dev: Switch License Tier"
        >
          <Settings size={16} className="animate-spin-slow" />
          <span className="hidden sm:inline">
            {hasOverride
              ? `[DEV] ${currentOption.label} / ${currentPlanOption.label}`
              : `${currentOption.label} / ${currentPlanOption.label}`}
          </span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="bg-surface-secondary border border-edge rounded-xl shadow-2xl p-4 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-content-secondary" />
              <span className="text-sm font-semibold text-content">Dev Tier Switcher</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-content-secondary hover:text-content transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-content-muted mb-3">
            Switch tiers to test feature gating. Changes persist in localStorage.
          </p>

          {/* Tier buttons */}
          <p className="text-xs text-content-secondary font-medium mb-1">License Tier</p>
          <div className="space-y-2">
            {TIER_OPTIONS.map(option => (
              <button
                key={option.tier}
                onClick={() => handleTierChange(option.tier)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTier === option.tier
                    ? `${option.color} text-white ring-2 ring-white/30`
                    : 'bg-surface-tertiary text-content hover:bg-surface-tertiary/80'
                }`}
              >
                {option.icon}
                <span className="flex-1 text-left">{option.label}</span>
                {currentTier === option.tier && <span className="text-xs opacity-75">Active</span>}
              </button>
            ))}
          </div>

          {/* Plan buttons */}
          <p className="text-xs text-content-secondary font-medium mt-3 mb-1">Marketplace Plan</p>
          <div className="space-y-2">
            {PLAN_OPTIONS.map(option => (
              <button
                key={option.plan}
                onClick={() => handlePlanChange(option.plan)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPlan === option.plan
                    ? `${option.color} text-white ring-2 ring-white/30`
                    : 'bg-surface-tertiary text-content hover:bg-surface-tertiary/80'
                }`}
              >
                {option.icon}
                <span className="flex-1 text-left">{option.label}</span>
                {currentPlan === option.plan && <span className="text-xs opacity-75">Active</span>}
              </button>
            ))}
          </div>

          {/* Clear override button */}
          {hasOverride && (
            <button
              onClick={handleClearOverride}
              className="w-full mt-3 px-3 py-2 text-xs text-content-secondary hover:text-content border border-edge-secondary hover:border-edge-secondary rounded-lg transition-colors"
            >
              Clear Override (use env default)
            </button>
          )}

          {/* Current state info */}
          <div className="mt-3 pt-3 border-t border-edge text-xs text-content-muted">
            <div className="flex justify-between">
              <span>Tier:</span>
              <span className="text-content">{currentTier}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Plan:</span>
              <span className="text-content">{currentPlan}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Override:</span>
              <span className={hasOverride ? 'text-amber-400' : 'text-content-muted'}>
                {hasOverride ? 'Active' : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom animation style */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DevTierSwitcher;
