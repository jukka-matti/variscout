import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ColumnParsingProfile, ParsingStatus } from '@variscout/core/parser';
import { encodeColumnDragId } from './encodeColumnDragId';

const SPARK_WIDTH = 60;
const SPARK_HEIGHT = 24;
const SPARK_BARS = 24;

function binValues(values: number[], binCount: number): number[] {
  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [finite.length];
  const counts = new Array(binCount).fill(0);
  const range = max - min;
  for (const v of finite) {
    const idx = Math.min(binCount - 1, Math.floor(((v - min) / range) * binCount));
    counts[idx] += 1;
  }
  return counts;
}

const NumericSparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const bins = binValues(values, SPARK_BARS);
  if (bins.length === 0) {
    return (
      <span
        data-testid="column-chip-sparkline-placeholder"
        className="text-[10px] text-content-tertiary"
      >
        no data
      </span>
    );
  }
  const peak = Math.max(...bins);
  const barWidth = SPARK_WIDTH / bins.length;
  return (
    <svg
      data-testid="column-chip-sparkline"
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      role="presentation"
      className="text-content-tertiary"
    >
      {bins.map((count, i) => {
        const h = peak === 0 ? 0 : (count / peak) * SPARK_HEIGHT;
        return (
          <rect
            key={i}
            x={i * barWidth}
            y={SPARK_HEIGHT - h}
            width={Math.max(0, barWidth - 1)}
            height={h}
            fill="currentColor"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
};

export interface ColumnChipProps {
  profile: ColumnParsingProfile;
  /** Optional raw numeric values for the sparkline (numeric kind only). Plumbed by Palette. */
  numericValues?: number[];
  /** Visual state: chip has been dropped into a zone or step (faded). */
  dropped?: boolean;
  /** Visual state: system is suggesting a role for this chip. */
  ghostSuggested?: 'factor' | 'outcome' | 'process';
  /** Called when the ▾ button is clicked. Popover UI lands in B2.3. */
  onOverrideOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
  /** Called when the ⋮ button is clicked. Context-menu UI lands in B2.3. */
  onContextMenuOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
}

const BADGE_BY_STATUS: Record<ParsingStatus, { icon: string; classes: string }> = {
  ok: { icon: '✓', classes: 'text-green-700 bg-green-50' },
  warning: { icon: '⚠', classes: 'text-amber-700 bg-amber-50' },
  error: { icon: '✗', classes: 'text-red-700 bg-red-50' },
};

export const ColumnChip: React.FC<ColumnChipProps> = ({
  profile,
  numericValues,
  dropped,
  ghostSuggested,
  onOverrideOpen,
  onContextMenuOpen,
}) => {
  const draggableId = encodeColumnDragId(profile.columnName);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: draggableId });
  const badge = BADGE_BY_STATUS[profile.status];
  const interpretationLabel = profile.primary?.label ?? 'parse failed';

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const chipClasses = [
    'flex items-center gap-2 rounded-md bg-surface-primary px-2 py-1.5',
    dropped ? 'opacity-50 bg-surface-secondary border border-edge' : '',
    ghostSuggested ? 'border-2 border-dashed border-cyan-400' : 'border border-edge',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="column-chip"
      data-draggable-id={draggableId}
      className={chipClasses}
    >
      <button
        type="button"
        data-testid="column-chip-drag-handle"
        className="cursor-grab text-xs text-content-tertiary"
        aria-label={`Drag ${profile.columnName}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span
        data-testid="column-chip-badge"
        className={`inline-flex h-4 w-4 items-center justify-center rounded text-xs ${badge.classes}`}
        aria-label={`Parsing status: ${profile.status}`}
      >
        {badge.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-content">{profile.columnName}</span>
        <span className="truncate text-[10px] text-content-tertiary">{interpretationLabel}</span>
      </div>
      {profile.primary?.kind === 'numeric' &&
        (numericValues && numericValues.length > 0 ? (
          <NumericSparkline values={numericValues} />
        ) : (
          <span
            data-testid="column-chip-sparkline-placeholder"
            className="text-[10px] text-content-tertiary"
          >
            no data
          </span>
        ))}
      {ghostSuggested && (
        <span
          data-testid="column-chip-hint-pill"
          className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] text-cyan-700"
        >
          {ghostSuggested}?
        </span>
      )}
      <button
        type="button"
        data-testid="column-chip-override-button"
        className="text-xs text-content-tertiary hover:text-content"
        aria-label={`Override parsing for ${profile.columnName}`}
        onClick={e => {
          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
          onOverrideOpen?.(profile.columnName, { x: rect.left, y: rect.bottom });
        }}
      >
        ▾
      </button>
      <button
        type="button"
        data-testid="column-chip-context-button"
        className="text-xs text-content-tertiary hover:text-content"
        aria-label={`Open context menu for ${profile.columnName}`}
        onClick={e => {
          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
          onContextMenuOpen?.(profile.columnName, { x: rect.left, y: rect.bottom });
        }}
      >
        ⋮
      </button>
    </div>
  );
};

export default ColumnChip;
