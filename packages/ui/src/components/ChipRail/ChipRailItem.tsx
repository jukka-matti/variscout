import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { encodeChipDragId } from '@variscout/hooks';

export type ChipRailItemRole = 'factor' | 'metadata';

export interface ChipRailItemProps {
  chipId: string;
  label: string;
  role: ChipRailItemRole;
  onKeyboardPickUp?: (chipId: string) => void;
}

export function ChipRailItem({ chipId, label, role, onKeyboardPickUp }: ChipRailItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: encodeChipDragId(chipId),
  });

  const style: CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`chip-rail-item-${chipId}`}
      data-dragging={isDragging ? 'true' : 'false'}
      aria-label={`${label} ${role} column`}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-edge bg-surface-primary px-3 py-2 text-left text-sm text-content shadow-sm transition-colors hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 data-[dragging=true]:opacity-60"
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={event => {
        if (!onKeyboardPickUp) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onKeyboardPickUp(chipId);
      }}
    >
      <span className="min-w-0 truncate font-medium">{label}</span>
      <span className="shrink-0 rounded border border-edge bg-surface-secondary px-1.5 py-0.5 text-xs font-medium text-content-secondary">
        {role}
      </span>
    </button>
  );
}
