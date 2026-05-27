import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ColumnParsingProfile, ParsingStatus } from '@variscout/core/parser';
import { encodeColumnDragId } from './encodeColumnDragId';

export interface ColumnChipProps {
  profile: ColumnParsingProfile;
  /** Optional raw numeric values for the sparkline (numeric kind only). Plumbed by Palette. */
  numericValues?: number[];
  /** Visual state: chip has been dropped into a zone or step (faded). */
  dropped?: boolean;
  /** Visual state: system is suggesting a role for this chip. */
  ghostSuggested?: 'factor' | 'outcome' | 'process';
  /** Called when the ▾ button is clicked. Popover UI lands in B2.3. */
  onOverrideOpen?: (columnName: string) => void;
  /** Called when the ⋮ button is clicked. Context-menu UI lands in B2.3. */
  onContextMenuOpen?: (columnName: string) => void;
}

const BADGE_BY_STATUS: Record<ParsingStatus, { icon: string; classes: string }> = {
  ok: { icon: '✓', classes: 'text-green-700 bg-green-50' },
  warning: { icon: '⚠', classes: 'text-amber-700 bg-amber-50' },
  error: { icon: '✗', classes: 'text-red-700 bg-red-50' },
};

export const ColumnChip: React.FC<ColumnChipProps> = ({ profile }) => {
  const draggableId = encodeColumnDragId(profile.columnName);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: draggableId });
  const badge = BADGE_BY_STATUS[profile.status];
  const interpretationLabel = profile.primary?.label ?? 'parse failed';

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="column-chip"
      data-draggable-id={draggableId}
      className="flex items-center gap-2 rounded-md border border-edge bg-surface-primary px-2 py-1.5"
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
    </div>
  );
};

export default ColumnChip;
