import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Finding } from '@variscout/core';
import FindingEditor from './FindingEditor';

export interface FindingCardProps {
  finding: Finding;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  columnAliases?: Record<string, string>;
  /** Whether this finding matches the current active filters */
  isActive?: boolean;
}

/**
 * Individual finding card showing filter chips, stats, and analyst note.
 * Click the card body to restore its filter state.
 */
const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onEdit,
  onDelete,
  onRestore,
  columnAliases = {},
  isActive = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { context } = finding;

  const filterEntries = Object.entries(context.activeFilters);

  const handleSave = (text: string) => {
    onEdit(finding.id, text);
    setIsEditing(false);
  };

  return (
    <div
      className={`group rounded-lg border transition-colors ${
        isActive
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-edge hover:border-edge-hover bg-surface-secondary'
      }`}
    >
      {/* Clickable header — restores filters */}
      <button
        onClick={() => onRestore(finding.id)}
        className="w-full text-left px-3 pt-2.5 pb-1.5"
        title="Click to restore these filters"
        aria-label={`Restore finding: ${finding.text}`}
      >
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {filterEntries.map(([factor, values]) => {
            const label = columnAliases[factor] || factor;
            const valStr =
              values.length <= 2
                ? values.map(String).join(', ')
                : `${values[0]} +${values.length - 1}`;
            return (
              <span
                key={factor}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface-tertiary/50 text-[10px] text-content-secondary rounded"
              >
                <span className="font-medium">{label}</span>
                <span className="text-content-muted">=</span>
                <span>{valStr}</span>
              </span>
            );
          })}
          {filterEntries.length === 0 && (
            <span className="text-[10px] text-content-muted italic">No filters</span>
          )}
        </div>

        {/* Stats line */}
        <div className="flex items-center gap-2 text-[10px] text-content-muted">
          {context.stats?.cpk !== undefined && (
            <span>
              Cpk{' '}
              <span className={context.stats.cpk < 1 ? 'text-red-400' : 'text-green-400'}>
                {context.stats.cpk.toFixed(1)}
              </span>
            </span>
          )}
          {context.stats?.samples !== undefined && <span>n={context.stats.samples}</span>}
          {context.cumulativeScope !== null && context.cumulativeScope !== undefined && (
            <span>{Math.round(context.cumulativeScope)}% isolated</span>
          )}
        </div>
      </button>

      {/* Note + actions */}
      <div className="px-3 pb-2.5">
        {isEditing ? (
          <FindingEditor
            initialText={finding.text}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="flex items-start gap-1">
            <p className="flex-1 text-xs text-content italic leading-relaxed mt-0.5">
              &ldquo;{finding.text}&rdquo;
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
                title="Edit note"
                aria-label="Edit finding note"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(finding.id);
                }}
                className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete finding"
                aria-label="Delete finding"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingCard;
