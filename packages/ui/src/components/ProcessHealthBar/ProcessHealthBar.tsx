import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Layers, ChevronDown, X, Download, Pin, Clock } from 'lucide-react';
import type { ProcessHealthBarProps } from './types';
import { ScopeCoverageBar } from './ScopeCoverageBar';
import { FilterChipDropdown } from '../FilterChipDropdown';
import { gradeCpk, sourceLabelFor } from '@variscout/core/capability';
import { assertNever } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { usePreferencesStore } from '@variscout/stores';
import type { TimeLens } from '@variscout/core/stats';

/**
 * Format selected values for chip display.
 * Shows up to 2 values, then "+N" for overflow.
 */
function formatChipValues(values: (string | number)[]): string {
  if (values.length === 0) return '';
  const displayed = values.slice(0, 2).map(String);
  const overflow = values.length > 2 ? ` +${values.length - 2}` : '';
  return displayed.join(', ') + overflow;
}

/**
 * Produce a short display label for the current TimeLens.
 * Format matches spec: "Cumulative", "Rolling 100", "Fixed @50 +30", "From 50"
 */
function timeLensLabel(lens: TimeLens): string {
  switch (lens.mode) {
    case 'cumulative':
      return 'Cumulative';
    case 'rolling':
      return `Rolling ${lens.windowSize}`;
    case 'fixed':
      return `Fixed @${lens.anchor} +${lens.windowSize}`;
    case 'openEnded':
      return `From ${lens.anchor}`;
  }
}

/**
 * Returns Tailwind color class for a Cpk value relative to the target.
 */
function cpkColor(cpk: number, target: number): string {
  const grade = gradeCpk(cpk, target);
  if (grade === 'green') return 'text-green-500';
  if (grade === 'red') return 'text-red-400';
  return 'text-amber-500';
}

/**
 * ProcessHealthBar — the Explore **context line** (ER-1). One compact ~34px row
 * under the header.
 *
 * Layout (wireframe `explore-redesign-mockup-2026-06-10.html`):
 *   LEFT:  N calls · date range · x̄ <v> σ <v> Cpk <v> · Filters: <none | chips>
 *   RIGHT: Subgroup · Time · Stages · Export · measure chip ▾
 *
 * The grid/scroll layout toggle was retired in ER-1 Task 4 (scroll is the only
 * layout). The Factors(N) and Present buttons were removed in Task 2.
 */
const ProcessHealthBar: React.FC<ProcessHealthBarProps> = ({
  stats,
  specs,
  cpkTarget = 1.33,
  cpkTargetSource,
  onCpkTargetCommit,
  columnLabel,
  sampleCount,
  dateRange,
  filterChipData,
  columnAliases = {},
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAll,
  onPinFinding,
  onExportCSV,
  onExportVrs,
  onSetSpecs,
  onCpkClick,
  subgroupSlot,
  availableStageColumns = [],
  stageColumn,
  setStageColumn,
  stageOrderMode = 'auto',
  onStageOrderModeChange,
  measureLabel,
  onEditFraming,
  centeringOpportunity,
  specSuggestion,
  activeProjection,
  onAcceptSpecSuggestion,
  scopeCoverage,
  scopeWhatIfCpk,
  scopeCurrentCpk,
  isCapabilityMode = false,
  capabilityStats,
}) => {
  const { t, formatStat } = useTranslation();

  // Time lens state from session store
  const timeLens = usePreferencesStore(s => s.timeLens);
  const setTimeLens = usePreferencesStore(s => s.setTimeLens);

  // Time lens popover state
  const [timeLensOpen, setTimeLensOpen] = useState(false);
  const [timeLensPosition, setTimeLensPosition] = useState({ top: 0, left: 0 });
  const timeLensButtonRef = useRef<HTMLButtonElement>(null);
  const timeLensPopoverRef = useRef<HTMLDivElement>(null);

  // Local editable fields for the popover — initialised from current lens
  const [lensMode, setLensMode] = useState<TimeLens['mode']>(timeLens.mode);
  const [rollingWindow, setRollingWindow] = useState<number>(
    timeLens.mode === 'rolling' ? timeLens.windowSize : 100
  );
  const [fixedAnchor, setFixedAnchor] = useState<number>(
    timeLens.mode === 'fixed' || timeLens.mode === 'openEnded' ? timeLens.anchor : 0
  );
  const [fixedWindow, setFixedWindow] = useState<number>(
    timeLens.mode === 'fixed' ? timeLens.windowSize : 100
  );

  // Sync local form state when popover opens
  useEffect(() => {
    if (timeLensOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting form when popover opens
      setLensMode(timeLens.mode);
      if (timeLens.mode === 'rolling') {
        setRollingWindow(timeLens.windowSize);
      }
      if (timeLens.mode === 'fixed') {
        setFixedAnchor(timeLens.anchor);
        setFixedWindow(timeLens.windowSize);
      }
      if (timeLens.mode === 'openEnded') {
        setFixedAnchor(timeLens.anchor);
      }
    }
  }, [timeLensOpen, timeLens]);

  // Close popover on outside click
  useEffect(() => {
    if (!timeLensOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        timeLensPopoverRef.current &&
        target &&
        !timeLensPopoverRef.current.contains(target) &&
        !timeLensButtonRef.current?.contains(target)
      ) {
        setTimeLensOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [timeLensOpen]);

  // Close popover on Escape
  useEffect(() => {
    if (!timeLensOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTimeLensOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [timeLensOpen]);

  const handleTimeLensButtonClick = useCallback(() => {
    if (!timeLensOpen && timeLensButtonRef.current) {
      const rect = timeLensButtonRef.current.getBoundingClientRect();
      const popoverWidth = 200;
      const padding = 8;
      const maxLeft = window.innerWidth - popoverWidth - padding;
      setTimeLensPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, maxLeft),
      });
    }
    setTimeLensOpen(prev => !prev);
  }, [timeLensOpen]);

  /** Build and dispatch the lens when mode changes. */
  const applyMode = useCallback(
    (newMode: TimeLens['mode']) => {
      setLensMode(newMode);
      switch (newMode) {
        case 'cumulative':
          setTimeLens({ mode: 'cumulative' });
          break;
        case 'rolling':
          setTimeLens({ mode: 'rolling', windowSize: rollingWindow });
          break;
        case 'fixed':
          setTimeLens({ mode: 'fixed', anchor: fixedAnchor, windowSize: fixedWindow });
          break;
        case 'openEnded':
          setTimeLens({ mode: 'openEnded', anchor: fixedAnchor });
          break;
        default:
          return assertNever(newMode);
      }
    },
    [setTimeLens, rollingWindow, fixedAnchor, fixedWindow]
  );

  const hasSpecs = !!(specs.usl !== undefined || specs.lsl !== undefined);
  const chips = filterChipData ?? [];
  const isDrilling = chips.length > 0;

  // Filter chip dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleChipClick = useCallback(
    (factor: string, event: React.MouseEvent<HTMLButtonElement>) => {
      if (openDropdown === factor) {
        setOpenDropdown(null);
        setDropdownAnchorRect(null);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownAnchorRect(rect);
        setOpenDropdown(factor);
      }
    },
    [openDropdown]
  );

  const handleDropdownClose = useCallback(() => {
    setOpenDropdown(null);
    setDropdownAnchorRect(null);
  }, []);

  const handleValuesChange = useCallback(
    (factor: string, newValues: (string | number)[]) => {
      onUpdateFilterValues(factor, newValues);
      if (newValues.length === 0) {
        handleDropdownClose();
      }
    },
    [onUpdateFilterValues, handleDropdownClose]
  );

  const handleRemoveChip = useCallback(
    (factor: string, event: React.MouseEvent) => {
      event.stopPropagation();
      onRemoveFilter(factor);
    },
    [onRemoveFilter]
  );

  // Cpk target editing state
  const [editingCpkTarget, setEditingCpkTarget] = useState(false);
  const [cpkTargetInput, setCpkTargetInput] = useState(String(cpkTarget));

  const handleCpkTargetCommit = useCallback(() => {
    const parsed = parseFloat(cpkTargetInput);
    if (!isNaN(parsed) && parsed > 0) {
      onCpkTargetCommit?.(parsed);
    } else {
      setCpkTargetInput(String(cpkTarget));
    }
    setEditingCpkTarget(false);
  }, [cpkTargetInput, cpkTarget, onCpkTargetCommit]);

  // ---- Export menu state ----
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [exportMenuOpen]);

  // ---- Measure/scope chip menu state ----
  const [measureMenuOpen, setMeasureMenuOpen] = useState(false);
  const measureMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!measureMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (measureMenuRef.current && !measureMenuRef.current.contains(e.target as Node)) {
        setMeasureMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMeasureMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [measureMenuOpen]);

  const sep = (
    <span className="text-edge shrink-0 hidden sm:inline" aria-hidden>
      &middot;
    </span>
  );

  // Render the x̄ / σ / Cpk stats segment
  const renderStats = () => {
    if (!stats) return null;

    const meanStr = formatStat(stats.mean, 2);
    const sigmaStr = formatStat(stats.stdDev, 2);
    const n = sampleCount;

    if (!hasSpecs) {
      // No spec → no Cpk. Show x̄/σ/n + the "Set specs →" affordance (the
      // legible story for the absent Cpk — no fake disabled control).
      return (
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <span>
            <span className="text-content-muted">x&#772;</span>
            <span className="ml-1 font-mono">{meanStr}</span>
          </span>
          <span>
            <span className="text-content-muted">&sigma;</span>
            <span className="ml-1 font-mono">{sigmaStr}</span>
          </span>
          <span>
            <span className="text-content-muted">n</span>
            <span className="ml-1 font-mono">{n}</span>
          </span>
          {specSuggestion && onAcceptSpecSuggestion ? (
            <button
              onClick={() =>
                onAcceptSpecSuggestion(specSuggestion.suggestedLsl, specSuggestion.suggestedUsl)
              }
              data-testid="btn-spec-suggestion"
              className="text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              {specSuggestion.label} &rarr; Set specs
            </button>
          ) : onSetSpecs ? (
            <button
              onClick={onSetSpecs}
              data-testid="btn-set-specs"
              className="text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              Set specs &rarr;
            </button>
          ) : null}
        </div>
      );
    }

    // Specs set: show Pass Rate (or subgroup target %), x̄, σ, Cpk/target, n
    const passRate =
      stats.outOfSpecPercentage !== undefined
        ? (Number.isFinite(stats.outOfSpecPercentage)
            ? (100 - stats.outOfSpecPercentage).toFixed(1)
            : '—') + '%'
        : '—';
    const subgroupPct =
      isCapabilityMode && capabilityStats && capabilityStats.totalSubgroups > 0
        ? Math.round(
            (capabilityStats.subgroupsMeetingTarget / capabilityStats.totalSubgroups) * 100
          )
        : null;
    const cpk = stats.cpk;
    const cpkStr = cpk !== undefined ? formatStat(cpk, 2) : '—';
    const colorClass = cpk !== undefined ? cpkColor(cpk, cpkTarget) : 'text-content-muted';

    return (
      <div className="flex items-center gap-2 text-xs text-content-secondary">
        {subgroupPct !== null ? (
          <span data-testid="subgroup-target-pct">
            <span className="text-content-muted">Subgroups</span>
            <span className="ml-1 font-mono text-content">{subgroupPct}%</span>
            <span className="ml-1 text-content-muted">&ge; {cpkTarget}</span>
            {cpkTargetSource && (
              <span
                className="ml-1 text-[0.625rem] text-content-muted"
                data-testid="cpk-target-source-chip"
              >
                ({sourceLabelFor(cpkTargetSource)})
              </span>
            )}
          </span>
        ) : (
          <span>
            <span className="text-content-muted">Pass</span>
            <span className="ml-1 font-mono text-content">{passRate}</span>
          </span>
        )}
        <span>
          <span className="text-content-muted">x&#772;</span>
          <span className="ml-1 font-mono">{meanStr}</span>
        </span>
        <span>
          <span className="text-content-muted">&sigma;</span>
          <span className="ml-1 font-mono">{sigmaStr}</span>
        </span>
        <span>
          <button
            onClick={onCpkClick}
            data-testid="stat-cpk"
            title={onCpkClick ? 'View capability on the I-Chart' : undefined}
            className={`font-mono font-medium ${colorClass} ${onCpkClick ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
          >
            Cpk {cpkStr}
          </button>
          {onCpkTargetCommit ? (
            editingCpkTarget ? (
              <input
                type="number"
                value={cpkTargetInput}
                onChange={e => setCpkTargetInput(e.target.value)}
                onBlur={handleCpkTargetCommit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCpkTargetCommit();
                  if (e.key === 'Escape') {
                    setCpkTargetInput(String(cpkTarget));
                    setEditingCpkTarget(false);
                  }
                }}
                data-testid="cpk-target-input"
                className="ml-1 w-12 bg-surface-secondary border border-edge rounded px-1 text-xs font-mono text-content"
                step="0.01"
                min="0"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingCpkTarget(true)}
                data-testid="cpk-target-btn"
                className="ml-1 text-content-muted hover:text-content transition-colors"
              >
                /{cpkTarget}
              </button>
            )
          ) : (
            <span className="ml-1 text-content-muted">/{cpkTarget}</span>
          )}
          {cpkTargetSource && (
            <span
              className="ml-1 text-[0.625rem] text-content-muted"
              data-testid="cpk-target-source-chip"
            >
              ({sourceLabelFor(cpkTargetSource)})
            </span>
          )}
          {columnLabel && (
            <span
              className="ml-1 text-[0.625rem] text-content-muted"
              data-testid="cpk-target-column-chip"
            >
              for {columnLabel}
            </span>
          )}
          {/* Projection: "→ Y if fixed" or centering opportunity */}
          {activeProjection && (
            <span className="ml-1.5 text-green-500 font-mono" data-testid="projection-display">
              &rarr; {formatStat(activeProjection.projectedCpk, 2)}
              <span className="ml-1 font-sans text-content-secondary">
                {activeProjection.label}
              </span>
            </span>
          )}
          {!activeProjection && centeringOpportunity && (
            <span className="ml-1.5 text-amber-500 font-mono" data-testid="centering-display">
              &rarr; Cp {formatStat(centeringOpportunity.cp, 2)}
              <span className="ml-1 font-sans text-content-secondary">by centering</span>
            </span>
          )}
        </span>
        <span>
          <span className="text-content-muted">
            {isCapabilityMode && capabilityStats ? 'k' : 'n'}
          </span>
          <span className="ml-1 font-mono">
            {isCapabilityMode && capabilityStats ? capabilityStats.totalSubgroups : n}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div
      className="flex items-center gap-3 px-4 bg-surface-secondary border-b border-edge h-[34px] text-xs text-content-secondary overflow-x-auto"
      data-testid="process-health-bar"
    >
      {/* ── LEFT: N · date · stats · Filters ── */}
      {/* N calls */}
      <span className="shrink-0 whitespace-nowrap" data-testid="context-n-calls">
        <span className="font-medium text-content font-mono">{sampleCount}</span>
        <span className="ml-1 text-content-muted">{t('healthBar.rows')}</span>
      </span>

      {/* Date range (computed; hidden when null) */}
      {dateRange && (
        <>
          {sep}
          <span
            className="shrink-0 whitespace-nowrap font-mono text-content-secondary hidden sm:inline"
            data-testid="context-date-range"
          >
            {dateRange}
          </span>
        </>
      )}

      {sep}

      {/* x̄ / σ / Cpk stats */}
      <div className="shrink-0">{renderStats()}</div>

      {/* IM-5 scope coverage bar (eda §3.3) — coverage % banded + What-If Cpk text */}
      {scopeCoverage != null && (
        <>
          {sep}
          <div className="shrink-0">
            <ScopeCoverageBar
              coverage={scopeCoverage}
              currentCpk={scopeCurrentCpk}
              whatIfCpk={scopeWhatIfCpk}
            />
          </div>
        </>
      )}

      {sep}

      {/* Filters segment — "Filters: none" muted when empty; chips when drilling */}
      <div className="flex items-center gap-1 shrink-0" data-testid="context-filters">
        <span className="text-content-muted whitespace-nowrap">Filters:</span>
        {!isDrilling && <span className="text-content-muted">none</span>}
        {isDrilling && (
          <div className="flex items-center gap-1 flex-wrap">
            {chips.map(chipData => {
              const factorLabel = columnAliases[chipData.factor] ?? chipData.factor;
              const isOpen = openDropdown === chipData.factor;
              return (
                <div key={chipData.factor} className="flex items-center gap-0">
                  <button
                    ref={el => {
                      if (el) chipRefs.current.set(chipData.factor, el);
                      else chipRefs.current.delete(chipData.factor);
                    }}
                    onClick={e => handleChipClick(chipData.factor, e)}
                    data-testid={`filter-chip-${chipData.factor}`}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-l-full text-xs transition-colors ${
                      isOpen
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-surface-tertiary/50 text-content-secondary hover:bg-surface-tertiary/70'
                    }`}
                  >
                    <span className="font-medium">{factorLabel}:</span>
                    <span className="max-w-[100px] truncate">
                      {formatChipValues(chipData.values)}
                    </span>
                    <ChevronDown
                      size={10}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                    {(() => {
                      const totalCount = chipData.availableValues
                        .filter(v => chipData.values.map(String).includes(String(v.value)))
                        .reduce((sum, v) => sum + v.count, 0);
                      return (
                        <span className="px-1 rounded text-[0.625rem] font-medium bg-blue-500/20 text-blue-400">
                          n={totalCount}
                        </span>
                      );
                    })()}
                  </button>
                  <button
                    onClick={e => handleRemoveChip(chipData.factor, e)}
                    data-testid={`filter-chip-remove-${chipData.factor}`}
                    className="px-1.5 py-0.5 rounded-r-full text-content-muted hover:text-red-400 bg-surface-tertiary/50 border-l border-edge/30 transition-colors"
                    aria-label={`Remove ${factorLabel} filter`}
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}

            {/* Clear all */}
            {onClearAll && chips.length > 0 && (
              <button
                onClick={onClearAll}
                data-testid="filter-clear-all"
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-content-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                aria-label="Clear all filters"
              >
                <X size={10} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Pin finding */}
            {onPinFinding && chips.length > 0 && (
              <button
                onClick={() => onPinFinding()}
                data-testid="btn-pin-finding"
                className="p-1 rounded text-content-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="Save current filters as a finding"
                aria-label="Pin as finding"
              >
                <Pin size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT cluster: Subgroup · Time · Stages · Export · measure chip ── */}
      <div className="flex items-center gap-1 ml-auto shrink-0" data-export-hide>
        {/* Subgroup lens (relocated SubgroupConfigPopover) */}
        {subgroupSlot && (
          <div className="hidden sm:flex items-center" data-testid="context-subgroup">
            {subgroupSlot}
          </div>
        )}

        {/* Time lens button */}
        <button
          ref={timeLensButtonRef}
          onClick={handleTimeLensButtonClick}
          data-testid="btn-time-lens"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
          aria-label={t('timeLens.button')}
          aria-expanded={timeLensOpen}
        >
          <Clock size={12} />
          <span>
            {t('timeLens.button')}: {timeLensLabel(timeLens)} &#9662;
          </span>
        </button>

        {/* Stages lens (relocated stage-column + stage-order selects) */}
        {availableStageColumns.length > 0 && (
          <div className="hidden sm:flex items-center gap-1" data-testid="context-stages">
            <Layers size={14} className="text-blue-400" />
            <select
              value={stageColumn || ''}
              onChange={e => setStageColumn?.(e.target.value || null)}
              data-testid="stage-column-select"
              className="bg-surface border border-edge text-xs text-content rounded px-1.5 py-0.5 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
              title="Select a column to divide the chart into stages"
              aria-label="Select stage column"
            >
              <option value="">No stages</option>
              {availableStageColumns.map(col => (
                <option key={col} value={col}>
                  {columnAliases[col] || col}
                </option>
              ))}
            </select>
            {stageColumn && (
              <select
                value={stageOrderMode}
                onChange={e => onStageOrderModeChange?.(e.target.value as 'auto' | 'data-order')}
                data-testid="stage-order-select"
                className="bg-surface border border-edge text-xs text-content-secondary rounded px-1.5 py-0.5 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                aria-label="Stage order mode"
              >
                <option value="auto">Auto order</option>
                <option value="data-order">As in data</option>
              </select>
            )}
          </div>
        )}

        {/* Export menu */}
        {onExportCSV && (
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(prev => !prev)}
              data-testid="btn-export-csv"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
              aria-label="Export"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
            >
              <Download size={12} />
              <span className="hidden sm:inline">Export &#9662;</span>
            </button>
            {exportMenuOpen && (
              <div
                role="menu"
                data-testid="export-menu"
                className="absolute right-0 top-full mt-1 z-50 min-w-[10rem] bg-surface-secondary border border-edge rounded-lg shadow-2xl py-1"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    onExportCSV();
                    setExportMenuOpen(false);
                  }}
                  data-testid="export-menu-csv"
                  className="block w-full text-left px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors"
                >
                  Export CSV
                </button>
                {onExportVrs && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      onExportVrs();
                      setExportMenuOpen(false);
                    }}
                    data-testid="export-menu-vrs"
                    className="block w-full text-left px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors"
                  >
                    Export .vrs
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Measure/scope chip + dropdown menu — only shown when there is a menu action to offer */}
        {measureLabel && onEditFraming && (
          <div className="relative hidden sm:block" ref={measureMenuRef}>
            <button
              onClick={() => setMeasureMenuOpen(prev => !prev)}
              data-testid="measure-chip"
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-edge text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors max-w-[12rem]"
              aria-label={`Measure: ${measureLabel}`}
              aria-haspopup="menu"
              aria-expanded={measureMenuOpen}
            >
              <span className="truncate font-medium text-content">{measureLabel}</span>
              <ChevronDown size={10} />
            </button>
            {measureMenuOpen && (
              <div
                role="menu"
                data-testid="measure-menu"
                className="absolute right-0 top-full mt-1 z-50 min-w-[10rem] bg-surface-secondary border border-edge rounded-lg shadow-2xl py-1"
              >
                {onEditFraming && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      onEditFraming();
                      setMeasureMenuOpen(false);
                    }}
                    data-testid="measure-menu-edit-framing"
                    className="block w-full text-left px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors"
                  >
                    Edit framing
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter chip dropdown portal */}
      {openDropdown && dropdownAnchorRect && (
        <FilterChipDropdown
          chipData={chips.find(c => c.factor === openDropdown)!}
          factorLabel={columnAliases[openDropdown] ?? openDropdown}
          onValuesChange={handleValuesChange}
          onClose={handleDropdownClose}
          anchorRect={dropdownAnchorRect}
        />
      )}

      {/* Time lens popover */}
      {timeLensOpen && (
        <div
          ref={timeLensPopoverRef}
          role="dialog"
          aria-label={t('timeLens.popover.title')}
          data-testid="time-lens-popover"
          className="fixed z-50 w-52 bg-surface-secondary border border-edge rounded-lg shadow-2xl"
          style={{ top: timeLensPosition.top, left: timeLensPosition.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-edge">
            <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              {t('timeLens.popover.title')}
            </h4>
            <button
              onClick={() => setTimeLensOpen(false)}
              className="p-1 text-content-muted hover:text-content rounded transition-colors"
              aria-label={t('action.close')}
            >
              <X size={14} />
            </button>
          </div>

          {/* Mode selector */}
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ['cumulative', t('timeLens.mode.cumulative')],
                  ['rolling', t('timeLens.mode.rolling')],
                  ['fixed', t('timeLens.mode.fixed')],
                  ['openEnded', t('timeLens.mode.openEnded')],
                ] as [TimeLens['mode'], string][]
              ).map(([modeKey, modeLabel]) => (
                <button
                  key={modeKey}
                  onClick={() => applyMode(modeKey)}
                  data-testid={`time-lens-mode-${modeKey}`}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    lensMode === modeKey
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-surface border-edge text-content-secondary hover:border-edge-secondary'
                  }`}
                  aria-pressed={lensMode === modeKey}
                >
                  {modeLabel}
                </button>
              ))}
            </div>

            {/* Conditional inputs */}
            {lensMode === 'rolling' && (
              <div>
                <label
                  htmlFor="time-lens-rolling-window"
                  className="block text-[0.625rem] text-content-muted uppercase mb-1"
                >
                  {t('timeLens.input.windowSize')}
                </label>
                <input
                  id="time-lens-rolling-window"
                  name="time-lens-rolling-window"
                  type="number"
                  min={1}
                  value={rollingWindow}
                  data-testid="time-lens-rolling-window"
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setRollingWindow(val);
                    setTimeLens({ mode: 'rolling', windowSize: val });
                  }}
                  className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-content text-right outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            {lensMode === 'fixed' && (
              <>
                <div>
                  <label
                    htmlFor="time-lens-fixed-anchor"
                    className="block text-[0.625rem] text-content-muted uppercase mb-1"
                  >
                    {t('timeLens.input.anchor')}
                  </label>
                  <input
                    id="time-lens-fixed-anchor"
                    name="time-lens-fixed-anchor"
                    type="number"
                    min={0}
                    value={fixedAnchor}
                    data-testid="time-lens-fixed-anchor"
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setFixedAnchor(val);
                      setTimeLens({ mode: 'fixed', anchor: val, windowSize: fixedWindow });
                    }}
                    className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-content text-right outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time-lens-fixed-window"
                    className="block text-[0.625rem] text-content-muted uppercase mb-1"
                  >
                    {t('timeLens.input.windowSize')}
                  </label>
                  <input
                    id="time-lens-fixed-window"
                    name="time-lens-fixed-window"
                    type="number"
                    min={1}
                    value={fixedWindow}
                    data-testid="time-lens-fixed-window"
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setFixedWindow(val);
                      setTimeLens({ mode: 'fixed', anchor: fixedAnchor, windowSize: val });
                    }}
                    className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-content text-right outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </>
            )}

            {lensMode === 'openEnded' && (
              <div>
                <label
                  htmlFor="time-lens-open-anchor"
                  className="block text-[0.625rem] text-content-muted uppercase mb-1"
                >
                  {t('timeLens.input.anchor')}
                </label>
                <input
                  id="time-lens-open-anchor"
                  name="time-lens-open-anchor"
                  type="number"
                  min={0}
                  value={fixedAnchor}
                  data-testid="time-lens-open-anchor"
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    setFixedAnchor(val);
                    setTimeLens({ mode: 'openEnded', anchor: val });
                  }}
                  className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-content text-right outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessHealthBar;
