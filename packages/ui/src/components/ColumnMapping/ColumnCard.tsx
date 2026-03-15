/**
 * ColumnCard — Data-rich card for column selection in ColumnMapping.
 *
 * Shows type badge (Numeric/Categorical/Date), sample values, unique count,
 * missing indicator, and optional inline rename.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Pencil, AlertTriangle, CheckSquare } from 'lucide-react';
import type { ColumnAnalysis } from '@variscout/core';
import { CategoryBadge } from './CategoryBadge';

export interface ColumnCardProps {
  column: ColumnAnalysis;
  role: 'outcome' | 'factor';
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  alias?: string;
  onSelect: () => void;
  onRename?: (originalName: string, alias: string) => void;
  /** Inferred category badge for factor columns */
  roleBadge?: {
    categoryName: string;
    categoryColor?: string;
    matchedKeyword: string;
    onDismiss: () => void;
  };
}

const TYPE_BADGE: Record<ColumnAnalysis['type'], { label: string; bg: string; text: string }> = {
  numeric: { label: 'Numeric', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  categorical: { label: 'Categorical', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  date: { label: 'Date', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  text: { label: 'Text', bg: 'bg-slate-500/20', text: 'text-slate-400' },
};

export const ColumnCard: React.FC<ColumnCardProps> = ({
  column,
  role,
  selected,
  disabled = false,
  disabledReason,
  alias,
  onSelect,
  onRename,
  roleBadge,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(alias || column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const badge = TYPE_BADGE[column.type];
  const displayName = alias || column.name;

  const handleStartRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onRename) return;
      setRenameValue(alias || column.name);
      setIsRenaming(true);
      // Focus will happen via useEffect-like behavior on next render
      setTimeout(() => inputRef.current?.select(), 0);
    },
    [onRename, alias, column.name]
  );

  const handleFinishRename = useCallback(() => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    if (onRename && trimmed && trimmed !== column.name) {
      onRename(column.name, trimmed);
    } else if (onRename && (!trimmed || trimmed === column.name)) {
      // Reset alias if empty or matches original
      onRename(column.name, '');
    }
  }, [renameValue, column.name, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleFinishRename();
      if (e.key === 'Escape') {
        setIsRenaming(false);
        setRenameValue(alias || column.name);
      }
    },
    [handleFinishRename, alias, column.name]
  );

  // Summary line
  const summaryParts: string[] = [];
  if (column.type === 'categorical' && column.uniqueCount <= 10) {
    summaryParts.push(`${column.uniqueCount} categories`);
  } else {
    summaryParts.push(`${column.uniqueCount} unique`);
  }
  if (column.missingCount > 0) {
    summaryParts.push(`${column.missingCount} missing`);
  }

  // Sample values display
  const sampleDisplay =
    column.type === 'categorical' && column.uniqueCount <= 6
      ? column.sampleValues.join(', ')
      : column.sampleValues.slice(0, 4).join(', ');

  // Selection styling
  const isOutcome = role === 'outcome';
  const selectedColor = isOutcome ? 'blue' : 'emerald';
  const borderClass = selected
    ? `border-${selectedColor}-500 bg-${selectedColor}-600/20 shadow-[0_0_10px_rgba(${isOutcome ? '37,99,235' : '16,185,129'},0.2)]`
    : disabled
      ? 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
      : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-700/50';

  const Wrapper = isOutcome ? 'label' : 'div';

  return (
    <Wrapper
      className={`flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all text-left ${borderClass}`}
      onClick={disabled ? undefined : isOutcome ? undefined : onSelect}
      onKeyDown={
        !isOutcome && !disabled
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={isOutcome ? undefined : 'button'}
      tabIndex={isOutcome ? undefined : 0}
      title={disabled ? disabledReason : undefined}
      aria-label={
        isOutcome ? `Select ${displayName} as outcome column` : `Toggle ${displayName} as factor`
      }
    >
      {/* Top row: selector + name + badge */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Radio or checkbox indicator */}
        {isOutcome ? (
          <>
            <input
              id={`col-outcome-${column.name}`}
              type="radio"
              name="outcome"
              className="hidden"
              checked={selected}
              onChange={onSelect}
              aria-label={`Select ${displayName} as outcome column`}
            />
            <div
              className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                selected ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
              }`}
            >
              {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
          </>
        ) : (
          <div
            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
              selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
            }`}
          >
            {selected && <CheckSquare size={12} className="text-white" />}
          </div>
        )}

        {/* Column name (or rename input) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isRenaming ? (
            <input
              id={`col-rename-${column.name}`}
              name={`rename-${column.name}`}
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-edge rounded px-1.5 py-0.5 text-sm text-white font-medium focus:border-blue-500 focus:outline-none min-w-0 flex-1"
              aria-label={`Rename ${column.name}`}
            />
          ) : (
            <span
              className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-slate-300'}`}
            >
              {displayName}
            </span>
          )}
          {alias && !isRenaming && (
            <span className="text-[10px] text-slate-500 truncate">({column.name})</span>
          )}
          {onRename && !isRenaming && (
            <button
              onClick={handleStartRename}
              className="text-slate-500 hover:text-slate-300 flex-shrink-0 p-0.5"
              aria-label={`Rename ${column.name}`}
              type="button"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>

        {/* Type badge */}
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}
          data-testid={`type-badge-${column.name}`}
        >
          {badge.label}
        </span>

        {/* Missing warning */}
        {column.missingCount > 0 && (
          <span
            className="flex-shrink-0"
            title={`${column.missingCount} missing values`}
            data-testid={`missing-warning-${column.name}`}
          >
            <AlertTriangle size={13} className="text-amber-400" />
          </span>
        )}
      </div>

      {/* Sample values + role badge + summary */}
      <div className="pl-6 flex flex-col gap-0.5">
        <span className="text-xs text-slate-500 truncate" title={sampleDisplay}>
          {sampleDisplay}
        </span>
        {role === 'factor' && roleBadge && (
          <CategoryBadge
            categoryName={roleBadge.categoryName}
            categoryColor={roleBadge.categoryColor}
            matchedKeyword={roleBadge.matchedKeyword}
            onDismiss={roleBadge.onDismiss}
          />
        )}
        <span className="text-[10px] text-slate-600">{summaryParts.join(' \u00b7 ')}</span>
      </div>
    </Wrapper>
  );
};

export default ColumnCard;
