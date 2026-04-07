import React from 'react';
import BasicEstimator from './BasicEstimator';
import ModelInformedEstimator from './ModelInformedEstimator';
import ActivityReducer from './ActivityReducer';
import ChannelAdjuster from './ChannelAdjuster';
import type { WhatIfExplorerProps, ModelScope } from './types';

// ============================================================================
// Helpers
// ============================================================================

/** Returns trust dots based on R²adj thresholds. */
function getTrustDots(rSquaredAdj: number): { dots: string; colorClass: string; label: string } {
  if (rSquaredAdj > 0.7) {
    return { dots: '●●●○', colorClass: 'text-green-400', label: 'Strong' };
  }
  if (rSquaredAdj > 0.4) {
    return { dots: '●●○○', colorClass: 'text-amber-400', label: 'Moderate' };
  }
  return { dots: '●○○○', colorClass: 'text-red-400', label: 'Weak' };
}

/** Returns a mode badge label. */
function getModeBadgeLabel(mode: string): string {
  switch (mode) {
    case 'yamazumi':
      return 'Lean / Time Study';
    case 'performance':
      return 'Multi-Channel';
    case 'capability':
      return 'Capability';
    default:
      return 'Standard';
  }
}

// ============================================================================
// Scope Selector
// ============================================================================

interface ScopeSelectorProps {
  scopes: ModelScope[];
  activeScope?: ModelScope;
  onScopeChange?: (scope: ModelScope) => void;
}

function ScopeSelector({ scopes, activeScope, onScopeChange }: ScopeSelectorProps) {
  if (scopes.length <= 1) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="radiogroup"
      aria-label="Model scope"
      data-testid="scope-selector"
    >
      {scopes.map(scope => {
        const isActive = activeScope?.id === scope.id;
        const trust = getTrustDots(scope.rSquaredAdj);
        return (
          <button
            key={scope.id}
            role="radio"
            aria-checked={isActive}
            onClick={() => onScopeChange?.(scope)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors
              ${
                isActive
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-edge bg-surface text-content-secondary hover:bg-surface-secondary hover:text-content'
              }`}
            data-testid={`scope-option-${scope.id}`}
          >
            <span>{scope.label}</span>
            <span className="text-content-muted font-mono">n={scope.n}</span>
            <span className={`font-mono text-[0.65rem] ${trust.colorClass}`} title={trust.label}>
              R²
              {Number.isFinite(scope.rSquaredAdj)
                ? String(Math.round(scope.rSquaredAdj * 100))
                : '—'}
              %
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// WhatIfExplorer
// ============================================================================

/**
 * Unified What-If explorer shell. Dispatches to the appropriate renderer
 * based on analysis mode and available data:
 *
 * - yamazumi + activities → ActivityReducer
 * - performance + channels → ChannelAdjuster
 * - model provided → ModelInformedEstimator
 * - else → BasicEstimator (fallback)
 *
 * Provides a common header (mode badge, model quality indicator)
 * and a scope selector when multiple model scopes are available.
 */
export function WhatIfExplorer({
  mode,
  currentStats,
  specs,
  onProjectionChange,
  onSaveProjection,
  projectionContext,
  model,
  availableScopes,
  onScopeChange,
  references,
  activities,
  taktTime,
  bestReference,
  channels,
  selectedChannel,
  presets,
  complementStats,
  className,
}: WhatIfExplorerProps) {
  // Determine the active scope for scope selector highlighting
  const activeScope = availableScopes?.find(s => s.model === model) ?? availableScopes?.[0];

  // Determine which renderer to use
  const useYamazumi = mode === 'yamazumi' && activities != null && activities.length > 0;
  const usePerformance = mode === 'performance' && channels != null && channels.length > 0;
  const useModelInformed = !useYamazumi && !usePerformance && model != null;

  // Build trust indicator from model R²adj
  const trustInfo =
    model != null && Number.isFinite(model.rSquaredAdj) ? getTrustDots(model.rSquaredAdj) : null;

  return (
    <div className={`space-y-3 ${className ?? ''}`} data-testid="whatif-explorer">
      {/* Header: mode badge + model quality */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium bg-surface-secondary text-content-secondary border border-edge">
          {getModeBadgeLabel(mode)}
        </span>
        {trustInfo && (
          <span
            className={`text-[0.65rem] font-mono ${trustInfo.colorClass}`}
            title={`Model confidence: ${trustInfo.label} (R²adj ${Number.isFinite(model!.rSquaredAdj) ? String(Math.round(model!.rSquaredAdj * 100)) : '—'}%)`}
            data-testid="model-quality-indicator"
          >
            {trustInfo.dots}
          </span>
        )}
      </div>

      {/* Scope selector (only when multiple scopes exist) */}
      {availableScopes != null && availableScopes.length > 1 && (
        <ScopeSelector
          scopes={availableScopes}
          activeScope={activeScope}
          onScopeChange={onScopeChange}
        />
      )}

      {/* Renderer dispatch */}
      {useYamazumi && (
        <ActivityReducer
          activities={activities!}
          taktTime={taktTime}
          bestReference={bestReference}
          projectionContext={projectionContext}
          onProjectionChange={onProjectionChange}
          onSaveProjection={onSaveProjection}
        />
      )}

      {usePerformance && !useYamazumi && (
        <ChannelAdjuster
          currentStats={currentStats}
          specs={specs}
          channels={channels!}
          selectedChannel={selectedChannel}
          projectionContext={projectionContext}
          references={references}
          onProjectionChange={onProjectionChange}
          onSaveProjection={onSaveProjection}
        />
      )}

      {useModelInformed && (
        <ModelInformedEstimator
          currentStats={currentStats}
          specs={specs}
          model={model!}
          projectionContext={projectionContext}
          references={references}
          onProjectionChange={onProjectionChange}
          onSaveProjection={onSaveProjection}
        />
      )}

      {!useYamazumi && !usePerformance && !useModelInformed && (
        <BasicEstimator
          currentStats={currentStats}
          specs={specs}
          presets={presets}
          complementStats={complementStats}
          projectionContext={projectionContext}
          references={references}
          onProjectionChange={onProjectionChange}
          onSaveProjection={onSaveProjection}
        />
      )}
    </div>
  );
}
