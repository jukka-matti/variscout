import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { DataRow, BestSubsetResult } from '@variscout/core';
import { computeBestSubsets } from '@variscout/core/stats';

/** A regression model computed on a specific data scope (global or filtered subset) */
export interface ModelScope {
  /** Unique identifier: 'global' or a hash of the active filters */
  id: string;
  /** Human-readable label: 'All data' or 'Machine=B' */
  label: string;
  /** Filters that define this scope */
  filters: Record<string, (string | number)[]>;
  /** Sample size in this scope */
  n: number;
  /** Best subsets regression result for this scope */
  model: BestSubsetResult;
  /** Significant factors in this scope's model */
  factors: string[];
  /** R² adjusted of this scope's model */
  rSquaredAdj: number;
}

/**
 * Minimum sample size gate for scoped models.
 * If filtered n < max(MIN_ABSOLUTE, MIN_PER_FACTOR × factorCount), fall back to global.
 */
const MIN_ABSOLUTE = 20;
const MIN_PER_FACTOR = 3;

/** Compute a stable cache key from active filters */
function filterKey(filters: Record<string, (string | number)[]>): string {
  const sorted = Object.keys(filters)
    .sort()
    .map(k => `${k}=${[...filters[k]].sort().join(',')}`)
    .join('|');
  return sorted || 'global';
}

/** Filter data rows by active filters */
function applyFilters(data: DataRow[], filters: Record<string, (string | number)[]>): DataRow[] {
  const entries = Object.entries(filters);
  if (entries.length === 0) return data;
  return data.filter(row =>
    entries.every(([col, values]) => values.includes(row[col] as string | number))
  );
}

/** Build a human-readable label from filters */
function buildScopeLabel(filters: Record<string, (string | number)[]>): string {
  return Object.entries(filters)
    .map(([col, values]) => `${col}=${values.join(',')}`)
    .join(', ');
}

/** Extract the best model from a BestSubsetsResult */
function extractBestModel(
  data: DataRow[],
  outcome: string,
  factors: string[]
): BestSubsetResult | null {
  const result = computeBestSubsets(data, outcome, factors);
  if (!result || result.subsets.length === 0) return null;
  return result.subsets[0];
}

/** Build a ModelScope from data and filters */
function buildScope(
  id: string,
  label: string,
  filters: Record<string, (string | number)[]>,
  data: DataRow[],
  outcome: string,
  factors: string[]
): ModelScope | null {
  const model = extractBestModel(data, outcome, factors);
  if (!model) return null;
  return {
    id,
    label,
    filters,
    n: data.length,
    model,
    factors: model.factors,
    rSquaredAdj: model.rSquaredAdj,
  };
}

export interface UseScopedModelsReturn {
  /** Global scope (full dataset) — always available */
  globalScope: ModelScope | null;
  /** Filtered scope (current active filters) — null if no filters or n too small */
  filteredScope: ModelScope | null;
  /** All available scopes (global + filtered if valid) */
  availableScopes: ModelScope[];
  /** Currently active scope */
  activeScope: ModelScope | null;
  /** Switch active scope by ID */
  setActiveScope: (id: string) => void;
  /** Whether the filtered subset was too small for a reliable model */
  filteredTooSmall: boolean;
}

/**
 * Manages scoped regression models for the What-If Explorer.
 *
 * - Global scope always computed from full dataset
 * - Filtered scope auto-computed when activeFilters change
 * - Minimum-n gate prevents unreliable models on small subsets
 * - Cached by filter key for instant scope switching
 */
export function useScopedModels(
  data: DataRow[],
  outcome: string,
  factors: string[],
  activeFilters: Record<string, (string | number)[]>
): UseScopedModelsReturn {
  const [activeScopeId, setActiveScopeId] = useState<string>('global');
  const cacheRef = useRef<Map<string, ModelScope>>(new Map());

  // Global scope — computed from full dataset
  const globalScope = useMemo<ModelScope | null>(() => {
    if (!data.length || !outcome || !factors.length) return null;

    const cached = cacheRef.current.get('global');
    if (cached && cached.n === data.length) return cached;

    const scope = buildScope('global', 'All data', {}, data, outcome, factors);
    if (scope) cacheRef.current.set('global', scope);
    return scope;
  }, [data, outcome, factors]);

  // Filtered data + minimum-n check
  const filterEntries = Object.entries(activeFilters).filter(([, v]) => v.length > 0);
  const hasFilters = filterEntries.length > 0;

  const filteredResult = useMemo<{
    scope: ModelScope | null;
    tooSmall: boolean;
  }>(() => {
    if (!hasFilters || !data.length || !outcome || !factors.length) {
      return { scope: null, tooSmall: false };
    }

    const key = filterKey(activeFilters);
    const cached = cacheRef.current.get(key);
    if (cached) return { scope: cached, tooSmall: false };

    const filteredData = applyFilters(data, activeFilters);
    const minN = Math.max(MIN_ABSOLUTE, MIN_PER_FACTOR * factors.length);

    if (filteredData.length < minN) {
      return { scope: null, tooSmall: true };
    }

    // For scoped models, exclude the filter factor from the analysis
    // (it's constant within the scope)
    const scopeFactors = factors.filter(f => !activeFilters[f] || activeFilters[f].length !== 1);

    if (scopeFactors.length === 0) {
      return { scope: null, tooSmall: false };
    }

    const label = buildScopeLabel(activeFilters);
    const scope = buildScope(key, label, activeFilters, filteredData, outcome, scopeFactors);
    if (scope) cacheRef.current.set(key, scope);
    return { scope, tooSmall: false };
  }, [data, outcome, factors, activeFilters, hasFilters]);

  const filteredScope = filteredResult.scope;
  const filteredTooSmall = filteredResult.tooSmall;

  // Available scopes
  const availableScopes = useMemo<ModelScope[]>(() => {
    const scopes: ModelScope[] = [];
    if (globalScope) scopes.push(globalScope);
    if (filteredScope) scopes.push(filteredScope);
    return scopes;
  }, [globalScope, filteredScope]);

  // Reset stale scope ID when filtered scope disappears or changes
  useEffect(() => {
    if (activeScopeId !== 'global' && (!filteredScope || filteredScope.id !== activeScopeId)) {
      setActiveScopeId('global');
    }
  }, [filteredScope, activeScopeId]);

  // Active scope — default to global, switch to filtered if available
  const activeScope = useMemo<ModelScope | null>(() => {
    if (activeScopeId !== 'global' && filteredScope?.id === activeScopeId) {
      return filteredScope;
    }
    return globalScope;
  }, [activeScopeId, globalScope, filteredScope]);

  const setActiveScope = useCallback((id: string) => {
    setActiveScopeId(id);
  }, []);

  return {
    globalScope,
    filteredScope,
    availableScopes,
    activeScope,
    setActiveScope,
    filteredTooSmall,
  };
}
