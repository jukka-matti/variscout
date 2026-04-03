/**
 * MobileCategorySheet - Bottom action sheet for mobile boxplot/pareto category interactions
 *
 * Replaces desktop right-click context menu on phone (<640px).
 * Triggered by tapping a boxplot box or Pareto bar.
 * Shows category stats, drill-down, highlight, and "pin as finding" actions.
 *
 * Dismiss: tap backdrop, swipe sheet down >60px, or X button.
 */
import React, { useState, useCallback, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, ChevronRight, MessageCircle } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { HighlightColor } from '../ChartAnnotationLayer/types';

export interface MobileCategorySheetData {
  categoryKey: string;
  chartType: 'boxplot' | 'pareto';
  // Boxplot stats (from BoxplotGroupData)
  sampleN?: number;
  mean?: number;
  median?: number;
  iqr?: number;
  stdDev?: number;
  // Pareto stats
  count?: number;
  cumulativePct?: number;
}

export interface MobileCategorySheetProps {
  /** null = closed */
  data: MobileCategorySheetData | null;
  factor: string;
  currentHighlight?: HighlightColor;
  onDrillDown: () => void;
  onSetHighlight: (color: HighlightColor | undefined) => void;
  onPinFinding?: (noteText: string) => void;
  onClose: () => void;
  /** Render extra content after the pin-as-finding section (e.g. post-pin assign flow) */
  renderExtra?: () => React.ReactNode;
  /** Callback to ask CoScout about this category. When provided, shows "Ask CoScout" action row. */
  onAskCoScout?: (focusContext: {
    chartType: 'boxplot' | 'pareto';
    category: { name: string; mean?: number };
  }) => void;
}

const highlightOptions: { color: HighlightColor; label: string; hex: string }[] = [
  { color: 'red', label: 'Red', hex: '#ef4444' },
  { color: 'amber', label: 'Amber', hex: '#f59e0b' },
  { color: 'green', label: 'Green', hex: '#22c55e' },
];

// formatNum is now locale-aware inside the component via useTranslation()

export const MobileCategorySheet: React.FC<MobileCategorySheetProps> = ({
  data,
  factor: _factor,
  currentHighlight,
  onDrillDown,
  onSetHighlight,
  onPinFinding,
  onClose,
  renderExtra,
  onAskCoScout,
}) => {
  const { t, tf, formatStat } = useTranslation();
  const formatNum = (v: number | undefined): string => {
    if (v === undefined || v === null) return '-';
    return Number.isInteger(v) ? String(v) : formatStat(v);
  };
  const [noteText, setNoteText] = useState('');
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset note text when sheet opens with new data
  const prevKeyRef = useRef<string | null>(null);
  if (data?.categoryKey !== prevKeyRef.current) {
    prevKeyRef.current = data?.categoryKey ?? null;
    if (data) setNoteText('');
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      touchStartY.current = null;
      if (deltaY > 60) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDrillDown = useCallback(() => {
    onDrillDown();
    onClose();
  }, [onDrillDown, onClose]);

  const handleHighlight = useCallback(
    (color: HighlightColor) => {
      // Toggle: same color clears it
      onSetHighlight(currentHighlight === color ? undefined : color);
    },
    [currentHighlight, onSetHighlight]
  );

  const handleClearHighlight = useCallback(() => {
    onSetHighlight(undefined);
  }, [onSetHighlight]);

  const handlePinFinding = useCallback(() => {
    onPinFinding?.(noteText);
    setNoteText('');
    onClose();
  }, [onPinFinding, noteText, onClose]);

  if (!data) return null;

  const isBoxplot = data.chartType === 'boxplot';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="category-sheet-backdrop"
      />

      {/* Bottom sheet */}
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          onDeactivate: onClose,
          fallbackFocus: '[data-testid="mobile-category-sheet"]',
        }}
      >
        <div
          ref={sheetRef}
          className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 animate-slide-up border-t border-edge"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="mobile-category-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={`Actions for ${data.categoryKey}`}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-surface-elevated rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <span
              className="text-base font-semibold text-content truncate"
              data-testid="category-sheet-title"
            >
              {data.categoryKey}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-content-secondary hover:text-content rounded-lg transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={t('action.close')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Stats */}
          <div className="px-4 py-3" data-testid="category-sheet-stats">
            {isBoxplot ? (
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-content-secondary">{t('chart.label.n')} </span>
                  <span className="text-content font-medium">{formatNum(data.sampleN)}</span>
                </div>
                <div>
                  <span className="text-content-secondary">{t('chart.label.mean')} </span>
                  <span className="text-content font-medium">{formatNum(data.mean)}</span>
                </div>
                <div>
                  <span className="text-content-secondary">{t('chart.median')}: </span>
                  <span className="text-content font-medium">{formatNum(data.median)}</span>
                </div>
                <div>
                  <span className="text-content-secondary">IQR: </span>
                  <span className="text-content font-medium">{formatNum(data.iqr)}</span>
                </div>
                <div>
                  <span className="text-content-secondary">SD: </span>
                  <span className="text-content font-medium">{formatNum(data.stdDev)}</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-content-secondary">{t('chart.label.n')} </span>
                  <span className="text-content font-medium">{formatNum(data.count)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Drill down button */}
          <div className="px-4 py-3">
            <button
              onClick={handleDrillDown}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors touch-feedback"
              style={{ minHeight: 48 }}
              data-testid="category-sheet-drill-down"
            >
              {tf('chart.drillDown', { category: data.categoryKey })}
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-edge" />

          {/* Highlight row */}
          <div className="px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-content-secondary">{t('chart.highlight')}</span>
            <div className="flex items-center gap-2">
              {highlightOptions.map(({ color, hex }) => (
                <button
                  key={color}
                  onClick={() => handleHighlight(color)}
                  className="p-1 rounded-full transition-transform active:scale-90"
                  style={{
                    minWidth: 36,
                    minHeight: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`${color} highlight${currentHighlight === color ? ' (active)' : ''}`}
                  data-testid={`highlight-${color}`}
                >
                  <span
                    className="inline-block w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: hex,
                      border:
                        currentHighlight === color ? '3px solid white' : '2px solid transparent',
                      boxShadow: currentHighlight === color ? `0 0 0 1px ${hex}` : 'none',
                    }}
                  />
                </button>
              ))}
              {/* Clear option */}
              <button
                onClick={handleClearHighlight}
                className="p-1 rounded-full transition-transform active:scale-90"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={t('chart.clearHighlight')}
                data-testid="highlight-clear"
              >
                <span
                  className="inline-block w-6 h-6 rounded-full border-2 border-content-muted"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Pin as Finding section */}
          {onPinFinding && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-surface-secondary text-content border border-edge rounded-lg resize-none focus:outline-none focus:border-blue-500 placeholder:text-content-muted"
                  data-testid="category-sheet-note"
                />
                <button
                  onClick={handlePinFinding}
                  className="mt-2 w-full px-4 py-2.5 text-sm font-medium text-content bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-xl transition-colors touch-feedback"
                  style={{ minHeight: 44 }}
                  data-testid="category-sheet-pin-finding"
                >
                  {t('investigation.pinAsFinding')}
                </button>
              </div>
            </>
          )}

          {/* Ask CoScout action */}
          {onAskCoScout && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3">
                <button
                  onClick={() => {
                    onAskCoScout({
                      chartType: data.chartType,
                      category: {
                        name: data.categoryKey,
                        mean: data.mean,
                      },
                    });
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-colors touch-feedback"
                  style={{ minHeight: 44 }}
                  data-testid="category-sheet-ask-coscout"
                >
                  <MessageCircle size={16} />
                  {t('ai.askCoScout')}
                </button>
              </div>
            </>
          )}

          {/* Extra content slot (e.g. post-pin assign flow) */}
          {renderExtra?.()}

          {/* Safe area bottom */}
          <div className="safe-area-bottom" />
        </div>
      </FocusTrap>
    </>
  );
};

export default MobileCategorySheet;
