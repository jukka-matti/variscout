// packages/ui/src/components/Explore/ScopeChrome/PersistentScopeChip.tsx
//
// PR-CS-3a — Persistent shared-scope chip in app chrome (spec §3.3 rule 4).
//
// An always-visible, compact indicator of the analyst's *live* analysis scope
// (`useAnalysisScopeStore`), mounted in each app's AppHeader so the scope stays
// visible across tab switches (Process / Improve / Report) — not just inside the
// Explore tab body where `ScopeChrome` lives and unmounts on tab change.
//
// This is the indicator + clear + jump-to-edit. Editing the scope still lives in
// Explore's `ScopeChrome`. Highlight/dim coordination is a later PR (CS-3b).
import React from 'react';
import { Crosshair, X } from 'lucide-react';
import { useAnalysisScopeStore } from '@variscout/stores';

export interface PersistentScopeChipProps {
  /** Friendly column labels keyed by raw column name; falls back to the raw name. */
  readonly columnAliases?: Record<string, string>;
  /**
   * When provided, the summary area becomes a button invoking this (apps wire it
   * to navigate to the Explore tab for full editing). When omitted, the summary
   * is non-interactive text.
   */
  readonly onOpen?: () => void;
  /**
   * ER-4: the coherent clear. When provided, the × invokes THIS (apps wire it to
   * the one handler that clears projectStore.filters + filterStack + the scope
   * store together) instead of the scope-store-only `clearScope`. Fixes the
   * pre-existing one-sided clear (the chip used to clear only the scope store,
   * leaving the categorical filters / breadcrumbs behind). When omitted, falls
   * back to `clearScope()` (scope store only — the legacy behaviour).
   */
  readonly onClear?: () => void;
}

const chipStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(99,102,241,0.06)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: '999px',
  color: '#4f46e5',
};

/** Compact, scope-aware chip for the app header. Self-hides when no scope is set. */
export function PersistentScopeChip({ columnAliases, onOpen, onClear }: PersistentScopeChipProps) {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const clearScope = useAnalysisScopeStore(s => s.clearScope);
  // ER-4: prefer the injected coherent clear; fall back to scope-store-only.
  const handleClear = onClear ?? clearScope;

  const hasScope =
    Boolean(yColumn) || Boolean(boxplotFactor) || Boolean(stepId) || categoricalFilters.length > 0;

  if (!hasScope) return null;

  const label = (column: string): string => columnAliases?.[column] ?? column;

  // Lead with the outcome (Y); append condensed segments for the rest.
  const segments: string[] = [];
  if (yColumn) segments.push(label(yColumn));
  if (boxplotFactor) segments.push(label(boxplotFactor));
  const filterCount = categoricalFilters.length;
  if (filterCount > 0) segments.push(`${filterCount} filter${filterCount === 1 ? '' : 's'}`);
  const summary = segments.join(' · ');

  const summaryClass = 'min-w-0 max-w-[180px] truncate font-semibold leading-tight';

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 text-xs font-medium leading-tight"
      style={chipStyle}
      data-testid="persistent-scope-chip"
      title={summary}
    >
      <Crosshair size={12} className="shrink-0" aria-hidden="true" />
      {onOpen ? (
        <button
          type="button"
          data-testid="persistent-scope-chip-open"
          onClick={onOpen}
          className={`${summaryClass} underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary`}
          aria-label={`Edit analysis scope: ${summary}`}
        >
          {summary}
        </button>
      ) : (
        <span className={summaryClass}>{summary}</span>
      )}
      <button
        type="button"
        data-testid="persistent-scope-chip-clear"
        onClick={() => handleClear()}
        className="shrink-0 rounded p-0.5 hover:bg-[rgba(99,102,241,0.12)] focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Clear analysis scope"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}
