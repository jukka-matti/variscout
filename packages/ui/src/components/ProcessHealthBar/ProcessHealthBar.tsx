import React, { useState, useRef, useCallback } from 'react';
import {
  LayoutGrid,
  List,
  Settings2,
  ChevronDown,
  X,
  Download,
  Presentation,
  Pin,
} from 'lucide-react';
import type { ProcessHealthBarProps } from './types';
import { FilterChipDropdown } from '../FilterChipDropdown';
import { gradeCpk } from '@variscout/core/capability';
import { useTranslation } from '@variscout/hooks';

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
 * Returns Tailwind color class for a Cpk value relative to the target.
 */
function cpkColor(cpk: number, target: number): string {
  const grade = gradeCpk(cpk, target);
  if (grade === 'green') return 'text-green-500';
  if (grade === 'red') return 'text-red-400';
  return 'text-amber-500';
}

/**
 * ProcessHealthBar — unified toolbar row that displays process health stats,
 * filter chips, variation bar, and controls in a single compact line.
 *
 * Layout (left → right):
 *   [Layout toggle] [Factors(n)] | [Stats] | [Filter chips (n=X)] | [Cpk target] [Export] [Present]
 */
const ProcessHealthBar: React.FC<ProcessHealthBarProps> = ({
  stats,
  specs,
  cpkTarget = 1.33,
  onCpkTargetCommit,
  columnLabel,
  sampleCount,
  filterChipData,
  columnAliases = {},
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAll,
  onPinFinding,
  layout,
  onLayoutChange,
  factorCount,
  onManageFactors,
  onExportCSV,
  onEnterPresentationMode,
  onSetSpecs,
  onCpkClick,
  centeringOpportunity,
  specSuggestion,
  activeProjection,
  onAcceptSpecSuggestion,
  isCapabilityMode = false,
  capabilityStats,
  mode,
  leanStats,
  leanProjection,
}) => {
  const { formatStat } = useTranslation();

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

  // Render stats section
  const renderStats = () => {
    // Yamazumi lean mode: show CT, VA%, takt instead of Cpk stats
    if (mode === 'yamazumi' && leanStats) {
      const ctStr = formatStat(leanStats.cycleTime, 1);
      const vaStr = Number.isFinite(leanStats.vaRatio) ? (leanStats.vaRatio * 100).toFixed(0) : '—';
      const taktCompliance =
        leanStats.taktTime != null ? leanStats.cycleTime <= leanStats.taktTime : undefined;

      return (
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <span>
            <span className="text-content-muted">CT</span>
            <span className="ml-1 font-mono text-content" data-testid="stat-ct">
              {ctStr}s
            </span>
          </span>
          <span className="text-content-muted">|</span>
          <span>
            <span className="text-content-muted">VA</span>
            <span className="ml-1 font-mono text-content" data-testid="stat-va-ratio">
              {vaStr}%
            </span>
          </span>
          {leanStats.taktTime != null && (
            <>
              <span className="text-content-muted">|</span>
              <span data-testid="stat-takt">
                <span className="text-content-muted">Takt</span>
                <span
                  className={`ml-1 font-mono ${taktCompliance ? 'text-green-500' : 'text-red-400'}`}
                >
                  {taktCompliance ? '\u2713' : '\u2717'}
                </span>
              </span>
            </>
          )}
          <span className="text-content-muted">|</span>
          <span>
            <span className="text-content-muted">n</span>
            <span className="ml-1 font-mono">{sampleCount}</span>
          </span>
          {/* Lean projection: "CT 45s → 35.9s" */}
          {leanProjection && (
            <span className="ml-1.5 text-green-500 font-mono" data-testid="lean-projection-display">
              CT {formatStat(leanProjection.currentCT, 1)}s &rarr;{' '}
              {formatStat(leanProjection.projectedCT, 1)}s
              <span className="ml-1 font-sans text-content-secondary">{leanProjection.label}</span>
            </span>
          )}
          {/* Active projection with lean fields (from useProcessProjection) */}
          {!leanProjection && activeProjection?.currentCT != null && (
            <span className="ml-1.5 text-green-500 font-mono" data-testid="lean-projection-display">
              CT {formatStat(activeProjection.currentCT, 1)}s &rarr;{' '}
              {formatStat(activeProjection.projectedCT!, 1)}s
              <span className="ml-1 font-sans text-content-secondary">
                {activeProjection.label}
              </span>
            </span>
          )}
        </div>
      );
    }

    if (!stats) return null;

    const meanStr = formatStat(stats.mean, 2);
    const sigmaStr = formatStat(stats.stdDev, 2);
    const n = sampleCount;

    if (!hasSpecs) {
      return (
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <span>
            <span className="text-content-muted">x&#772;</span>
            <span className="ml-1 font-mono">{meanStr}</span>
          </span>
          <span className="text-content-muted">|</span>
          <span>
            <span className="text-content-muted">&sigma;</span>
            <span className="ml-1 font-mono">{sigmaStr}</span>
          </span>
          <span className="text-content-muted">|</span>
          <span>
            <span className="text-content-muted">n</span>
            <span className="ml-1 font-mono">{n}</span>
          </span>
          {specSuggestion && onAcceptSpecSuggestion ? (
            <>
              <span className="text-content-muted">|</span>
              <button
                onClick={() =>
                  onAcceptSpecSuggestion(specSuggestion.suggestedLsl, specSuggestion.suggestedUsl)
                }
                data-testid="btn-spec-suggestion"
                className="text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
              >
                {specSuggestion.label} &rarr; Set specs
              </button>
            </>
          ) : onSetSpecs ? (
            <>
              <span className="text-content-muted">|</span>
              <button
                onClick={onSetSpecs}
                data-testid="btn-set-specs"
                className="text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
              >
                Set specs &rarr;
              </button>
            </>
          ) : null}
        </div>
      );
    }

    // Specs set: show Pass Rate (or subgroup target %), Cpk/target, Mean, σ, n
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
          </span>
        ) : (
          <span>
            <span className="text-content-muted">Pass</span>
            <span className="ml-1 font-mono text-content">{passRate}</span>
          </span>
        )}
        <span className="text-content-muted">|</span>
        <span>
          <button
            onClick={onCpkClick}
            data-testid="stat-cpk"
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
        <span className="text-content-muted">|</span>
        <span>
          <span className="text-content-muted">x&#772;</span>
          <span className="ml-1 font-mono">{meanStr}</span>
        </span>
        <span className="text-content-muted">|</span>
        <span>
          <span className="text-content-muted">&sigma;</span>
          <span className="ml-1 font-mono">{sigmaStr}</span>
        </span>
        <span className="text-content-muted">|</span>
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
      className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border-b border-edge min-h-[36px] flex-wrap"
      data-testid="process-health-bar"
    >
      {/* Left: Layout toggle + Factors button */}
      <div className="flex items-center gap-1 shrink-0" data-export-hide>
        {/* Layout toggle — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={() => onLayoutChange('grid')}
            data-testid="layout-grid-btn"
            className={`p-1 rounded transition-colors ${
              layout === 'grid'
                ? 'bg-surface-tertiary text-content'
                : 'text-content-muted hover:text-content'
            }`}
            aria-label="Grid layout"
            aria-pressed={layout === 'grid'}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => onLayoutChange('scroll')}
            data-testid="layout-scroll-btn"
            className={`p-1 rounded transition-colors ${
              layout === 'scroll'
                ? 'bg-surface-tertiary text-content'
                : 'text-content-muted hover:text-content'
            }`}
            aria-label="Scroll layout"
            aria-pressed={layout === 'scroll'}
          >
            <List size={14} />
          </button>
        </div>

        {/* Factors button */}
        <button
          onClick={onManageFactors}
          data-testid="btn-manage-factors"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
          aria-label={`Factors (${factorCount})`}
        >
          <Settings2 size={12} />
          <span>Factors({factorCount})</span>
        </button>
      </div>

      {/* Divider */}
      <span className="text-edge shrink-0 hidden sm:inline" aria-hidden>
        |
      </span>

      {/* Stats section */}
      <div className="shrink-0">{renderStats()}</div>

      {/* Filter chips — shown when drilling */}
      {isDrilling && (
        <>
          <span className="text-edge shrink-0" aria-hidden>
            |
          </span>
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
                onClick={onPinFinding}
                data-testid="btn-pin-finding"
                className="p-1 rounded text-content-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="Save current filters as a finding"
                aria-label="Pin as finding"
              >
                <Pin size={12} />
              </button>
            )}
          </div>
        </>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0" data-export-hide>
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            data-testid="btn-export-csv"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
            aria-label="Export CSV"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
        {onEnterPresentationMode && (
          <button
            onClick={onEnterPresentationMode}
            data-testid="btn-present"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
            aria-label="Presentation mode"
          >
            <Presentation size={12} />
            <span className="hidden sm:inline">Present</span>
          </button>
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
    </div>
  );
};

export default ProcessHealthBar;
