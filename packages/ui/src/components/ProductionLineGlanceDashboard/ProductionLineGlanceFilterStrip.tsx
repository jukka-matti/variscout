/**
 * ProductionLineGlanceFilterStrip — context-value chip selector.
 *
 * Hub-level chips render in a top row; tributary-attached chips render
 * below grouped under their tributary label. Pure controlled component;
 * Plan C owns the data fetching that produces `contextValueOptions`.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 * section "Filter strip".
 */
import React from 'react';
import type { SpecLookupContext } from '@variscout/core/types';

export interface ProductionLineGlanceFilterStripProps {
  availableContext: {
    hubColumns: string[];
    tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  /** column name → list of available values for that column */
  contextValueOptions: Record<string, string[]>;
  value: SpecLookupContext;
  onChange: (next: SpecLookupContext) => void;
}

function toggleValue(current: SpecLookupContext, column: string, value: string): SpecLookupContext {
  const isActive = current[column] === value;
  const next = { ...current };
  if (isActive) {
    delete next[column];
  } else {
    next[column] = value;
  }
  return next;
}

interface ColumnChipsProps {
  column: string;
  options: string[];
  selectedValue: string | null | undefined;
  onSelect: (value: string) => void;
}

const ColumnChips: React.FC<ColumnChipsProps> = ({ column, options, selectedValue, onSelect }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs font-medium text-content-secondary">{column}</span>
    {options.map(opt => {
      const isActive = selectedValue === opt;
      return (
        <button
          key={opt}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(opt)}
          className={
            isActive
              ? 'rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white'
              : 'rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-content-secondary hover:bg-surface-tertiary'
          }
        >
          {opt}
        </button>
      );
    })}
  </div>
);

export const ProductionLineGlanceFilterStrip: React.FC<ProductionLineGlanceFilterStripProps> = ({
  availableContext,
  contextValueOptions,
  value,
  onChange,
}) => {
  const { hubColumns, tributaryGroups = [] } = availableContext;
  const hubHasContent = hubColumns.length > 0;
  const tribHasContent = tributaryGroups.some(g => g.columns.length > 0);

  if (!hubHasContent && !tribHasContent) {
    return <div data-testid="filter-strip-empty" className="h-0" />;
  }

  const handleSelect = (column: string, opt: string) => {
    onChange(toggleValue(value, column, opt));
  };

  return (
    <div className="flex flex-col gap-3 border-b border-edge px-4 py-3">
      {hubHasContent ? (
        <div className="flex flex-wrap gap-4">
          {hubColumns.map(col => (
            <ColumnChips
              key={col}
              column={col}
              options={contextValueOptions[col] ?? []}
              selectedValue={value[col] ?? null}
              onSelect={opt => handleSelect(col, opt)}
            />
          ))}
        </div>
      ) : null}

      {tributaryGroups.map(group =>
        group.columns.length > 0 ? (
          <div key={group.tributaryLabel} className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              {group.tributaryLabel}
            </span>
            <div className="flex flex-wrap gap-4 pl-3">
              {group.columns.map(col => (
                <ColumnChips
                  key={col}
                  column={col}
                  options={contextValueOptions[col] ?? []}
                  selectedValue={value[col] ?? null}
                  onSelect={opt => handleSelect(col, opt)}
                />
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default ProductionLineGlanceFilterStrip;
