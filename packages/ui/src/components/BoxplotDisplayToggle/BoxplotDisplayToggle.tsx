import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SlidersHorizontal, ArrowUpNarrowWide, ArrowDownWideNarrow, Search, X } from 'lucide-react';
import type { BoxplotSortBy } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import type { BoxplotDisplayToggleColorScheme, BoxplotDisplayToggleProps } from './types';

export const boxplotDisplayToggleDefaultColorScheme: BoxplotDisplayToggleColorScheme = {
  trigger: 'text-content-secondary hover:text-content hover:bg-surface-tertiary/50',
  popoverContainer:
    'fixed w-56 bg-surface-secondary border border-edge rounded-lg shadow-2xl z-50 animate-fade-in',
  checkbox:
    'w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary',
  checkboxLabel: 'text-sm text-content',
  description: 'text-xs text-content-muted',
  radioActive: 'bg-blue-500/20 border-blue-500 text-blue-400',
  radioInactive: 'bg-surface border-edge-secondary text-content-secondary hover:border-edge',
  directionButton: 'text-content-secondary hover:text-content hover:bg-surface-tertiary/50',
  sectionLabel: 'text-xs font-medium text-content-muted uppercase tracking-wider',
};

const SORT_OPTIONS: { value: BoxplotSortBy; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'mean', label: 'Mean' },
  { value: 'spread', label: 'Spread' },
];

const BoxplotDisplayToggle: React.FC<BoxplotDisplayToggleProps> = ({
  showViolin,
  showContributionLabels,
  onToggleViolin,
  onToggleContributionLabels,
  sortBy = 'name',
  sortDirection = 'asc',
  onSortChange,
  colorScheme = boxplotDisplayToggleDefaultColorScheme,
  totalCategories,
  visibleCount,
  isAutoMode = true,
  priorityCriterion,
  onAutoModeToggle,
  categoryItems,
  onManualSelectionChange,
  formatStat: formatStatProp,
}) => {
  const { t } = useTranslation();
  const cs = colorScheme;
  const showCategories =
    totalCategories !== undefined && totalCategories > 0 && categoryItems !== undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        popoverRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Calculate position based on button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 224; // w-56
      const padding = 8;
      const maxLeft = window.innerWidth - popoverWidth - padding;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, maxLeft),
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded transition-colors ${cs.trigger}`}
        title="Boxplot display options"
        aria-label="Boxplot display options"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal size={14} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cs.popoverContainer}
          style={{ top: position.top, left: position.left }}
          role="dialog"
          aria-label="Boxplot display options"
        >
          <div className="p-3 space-y-3">
            <label htmlFor="boxplot-violin" className="flex items-start gap-3 cursor-pointer">
              <input
                id="boxplot-violin"
                name="boxplot-violin"
                type="checkbox"
                checked={showViolin}
                onChange={e => onToggleViolin(e.target.checked)}
                className={`mt-0.5 ${cs.checkbox}`}
              />
              <div>
                <span className={cs.checkboxLabel}>{t('display.violin')}</span>
                <span className={`block ${cs.description}`}>{t('display.violinDesc')}</span>
              </div>
            </label>
            <label htmlFor="boxplot-contribution" className="flex items-start gap-3 cursor-pointer">
              <input
                id="boxplot-contribution"
                name="boxplot-contribution"
                type="checkbox"
                checked={showContributionLabels}
                onChange={e => onToggleContributionLabels(e.target.checked)}
                className={`mt-0.5 ${cs.checkbox}`}
              />
              <div>
                <span className={cs.checkboxLabel}>{t('display.contribution')}</span>
                <span className={`block ${cs.description}`}>{t('display.contributionDesc')}</span>
              </div>
            </label>

            {onSortChange && (
              <>
                <div className={`pt-1 border-t border-edge ${cs.sectionLabel ?? ''}`}>
                  {t('display.sort')}
                </div>
                <div className="flex items-center gap-1.5">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onSortChange(opt.value, sortDirection)}
                      className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                        sortBy === opt.value ? (cs.radioActive ?? '') : (cs.radioInactive ?? '')
                      }`}
                      aria-pressed={sortBy === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')}
                    className={`p-1 rounded transition-colors ${cs.directionButton ?? ''}`}
                    title={
                      sortDirection === 'asc' ? t('display.ascending') : t('display.descending')
                    }
                    aria-label={
                      sortDirection === 'asc' ? t('display.ascending') : t('display.descending')
                    }
                  >
                    {sortDirection === 'asc' ? (
                      <ArrowUpNarrowWide size={14} />
                    ) : (
                      <ArrowDownWideNarrow size={14} />
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Categories section (adaptive limits) */}
            {showCategories && (
              <CategorySection
                totalCategories={totalCategories!}
                visibleCount={visibleCount ?? 0}
                isAutoMode={isAutoMode}
                priorityCriterion={priorityCriterion}
                onAutoModeToggle={onAutoModeToggle}
                categoryItems={categoryItems!}
                onManualSelectionChange={onManualSelectionChange}
                formatStat={formatStatProp}
                sectionLabelClass={cs.sectionLabel ?? ''}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Categories section within the display toggle popover */
const CategorySection: React.FC<{
  totalCategories: number;
  visibleCount: number;
  isAutoMode: boolean;
  priorityCriterion?: string;
  onAutoModeToggle?: (isAuto: boolean) => void;
  categoryItems: { key: string; mean: number; isVisible: boolean }[];
  onManualSelectionChange?: (keys: string[]) => void;
  formatStat?: (value: number, decimals?: number) => string;
  sectionLabelClass: string;
}> = ({
  totalCategories,
  visibleCount,
  isAutoMode,
  priorityCriterion,
  onAutoModeToggle,
  categoryItems,
  onManualSelectionChange,
  formatStat,
  sectionLabelClass,
}) => {
  const [manualOpen, setManualOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const criterionLabel =
    priorityCriterion === 'distance'
      ? 'distance from target'
      : priorityCriterion === 'spread'
        ? 'variation'
        : (priorityCriterion ?? 'auto');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return categoryItems;
    const term = searchTerm.toLowerCase();
    return categoryItems.filter(c => c.key.toLowerCase().includes(term));
  }, [categoryItems, searchTerm]);

  const handleToggle = useCallback(
    (key: string) => {
      if (!onManualSelectionChange) return;
      const current = categoryItems.filter(c => c.isVisible).map(c => c.key);
      const idx = current.indexOf(key);
      if (idx >= 0) {
        onManualSelectionChange(current.filter(k => k !== key));
      } else {
        onManualSelectionChange([...current, key]);
      }
    },
    [categoryItems, onManualSelectionChange]
  );

  const selectAll = useCallback(() => {
    onManualSelectionChange?.(categoryItems.map(c => c.key));
  }, [categoryItems, onManualSelectionChange]);

  const selectNone = useCallback(() => {
    onManualSelectionChange?.([]);
  }, [onManualSelectionChange]);

  const selectTop10 = useCallback(() => {
    onManualSelectionChange?.(categoryItems.slice(0, 10).map(c => c.key));
  }, [categoryItems, onManualSelectionChange]);

  const fmtVal = (v: number) => (formatStat ? formatStat(v, 0) : String(Math.round(v)));

  return (
    <>
      <div className={`pt-1 border-t border-edge flex items-center justify-between`}>
        <span className={sectionLabelClass}>Categories</span>
        <span className="text-xs text-purple-400">
          {visibleCount} of {totalCategories}
        </span>
      </div>

      {/* Auto mode toggle */}
      <button
        onClick={() => onAutoModeToggle?.(!isAutoMode)}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md border text-left transition-colors ${
          isAutoMode ? 'bg-purple-500/10 border-purple-500/30' : 'bg-surface border-edge-secondary'
        }`}
      >
        <div>
          <div className={`text-xs ${isAutoMode ? 'text-purple-300' : 'text-content-muted'}`}>
            {isAutoMode ? `Auto: top by ${criterionLabel}` : 'Auto selection'}
          </div>
          {isAutoMode && (
            <div className="text-[0.625rem] text-content-muted">
              Fits {visibleCount} at this width
            </div>
          )}
        </div>
        <div
          className={`w-8 h-4 rounded-full transition-colors relative ${
            isAutoMode ? 'bg-purple-500' : 'bg-surface-tertiary'
          }`}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
              isAutoMode ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>

      {/* Manual mode list */}
      {!isAutoMode && (
        <>
          <button
            onClick={() => setManualOpen(!manualOpen)}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span style={{ fontSize: 8 }}>{manualOpen ? '▼' : '▶'}</span>
            {manualOpen ? 'Close list' : 'Pick specific categories...'}
          </button>

          {manualOpen && (
            <div className="space-y-1.5">
              {/* Search */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-content-muted"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter..."
                  className="w-full pl-6 pr-6 py-1 text-xs bg-surface border border-edge-secondary rounded text-content placeholder:text-content-muted focus:outline-none focus:border-purple-500/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Category list */}
              <div className="max-h-40 overflow-y-auto space-y-px">
                {filteredItems.map(item => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                      item.isVisible ? 'bg-purple-500/10' : 'hover:bg-surface-tertiary/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.isVisible}
                      onChange={() => handleToggle(item.key)}
                      className="w-3 h-3 rounded border-edge-secondary text-purple-500 focus:ring-purple-500/30"
                    />
                    <span
                      className={`flex-1 text-xs truncate ${item.isVisible ? 'text-content' : 'text-content-muted'}`}
                    >
                      {item.key}
                    </span>
                    <span className="text-[0.625rem] text-content-muted tabular-nums">
                      μ={fmtVal(item.mean)}
                    </span>
                  </label>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 text-[0.625rem] pt-1">
                <button onClick={selectAll} className="text-purple-400 hover:text-purple-300">
                  All
                </button>
                <button onClick={selectNone} className="text-content-muted hover:text-content">
                  None
                </button>
                <button onClick={selectTop10} className="text-content-muted hover:text-content">
                  Top 10
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default BoxplotDisplayToggle;
