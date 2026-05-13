import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import type { ProcessMap } from '@variscout/core/frame';
import { encodeStepDropId } from '@variscout/hooks';
import { ChipRail, type ChipRailEntry } from '../../ChipRail';
import { useWallLocale } from '../../InvestigationWall/hooks/useWallLocale';

export interface AuthorL3ViewProps {
  hubId: string;
  focalStepId: string;
  map: ProcessMap;
  chips: ChipRailEntry[];
  disabled?: boolean;
  onPlaceChip?: (chipId: string, stepId: string) => void;
  onKeyboardChipPickUp?: (chipId: string) => void;
  onKeyboardChipDrop?: (stepId: string) => void;
}

function focalStepColumns(map: ProcessMap, focalStepId: string) {
  const assigned = Object.entries(map.assignments ?? {})
    .filter(([, stepId]) => stepId === focalStepId)
    .map(([column]) => column);
  const assignedSet = new Set(assigned);
  const step = map.nodes.find(node => node.id === focalStepId);
  // stepName fallback is resolved to locale-aware string at render time; 'Selected step' sentinel used here
  const ctqColumn = step?.ctqColumn && !assignedSet.has(step.ctqColumn) ? step.ctqColumn : null;
  const tributaryColumns = map.tributaries
    .filter(tributary => tributary.stepId === focalStepId && !assignedSet.has(tributary.column))
    .map(tributary => tributary.column);

  return {
    assigned,
    stepName: step?.name ?? null,
    ctqColumn,
    tributaryColumns,
  };
}

function ColumnPill({ column }: { column: string }) {
  return (
    <li className="rounded-md border border-edge bg-surface-primary px-3 py-2 text-sm font-medium text-content">
      {column}
    </li>
  );
}

export function AuthorL3View({
  hubId,
  focalStepId,
  map,
  chips,
  disabled = false,
  onPlaceChip,
  onKeyboardChipPickUp,
  onKeyboardChipDrop,
}: AuthorL3ViewProps) {
  const locale = useWallLocale();
  const [keyboardChipId, setKeyboardChipId] = React.useState<string | null>(null);
  const droppableId = encodeStepDropId(focalStepId);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled,
  });
  const {
    assigned,
    stepName: rawStepName,
    ctqColumn,
    tributaryColumns,
  } = React.useMemo(() => focalStepColumns(map, focalStepId), [focalStepId, map]);
  const stepName = rawStepName ?? getMessage(locale, 'canvas.authorL3.selectedStep');
  const keyboardChipLabel = keyboardChipId
    ? chips.find(chip => chip.chipId === keyboardChipId)?.label
    : null;

  const handleKeyboardPickUp = React.useCallback(
    (chipId: string) => {
      if (disabled) return;
      setKeyboardChipId(chipId);
      onKeyboardChipPickUp?.(chipId);
    },
    [disabled, onKeyboardChipPickUp]
  );

  const handleDropTargetKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || !keyboardChipId) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      if (onKeyboardChipDrop) {
        onKeyboardChipDrop(focalStepId);
      } else {
        onPlaceChip?.(keyboardChipId, focalStepId);
      }
      setKeyboardChipId(null);
    },
    [disabled, focalStepId, keyboardChipId, onKeyboardChipDrop, onPlaceChip]
  );

  return (
    <div
      className="grid min-h-[24rem] gap-4 bg-surface-background p-4 text-content lg:grid-cols-[18rem_minmax(0,1fr)]"
      data-testid="author-l3-view"
      data-hub-id={hubId}
    >
      <section
        data-testid="unassigned-columns"
        aria-label={getMessage(locale, 'canvas.authorL3.unassignedColumns')}
      >
        <ChipRail
          chips={chips}
          className="h-full w-full rounded-md border border-edge"
          disabled={disabled}
          onKeyboardPickUp={handleKeyboardPickUp}
        />
      </section>

      <section
        className="flex min-w-0 flex-col gap-4"
        data-testid="assigned-columns"
        aria-labelledby="author-l3-step-heading"
      >
        <div
          ref={setNodeRef}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label={
            keyboardChipLabel
              ? formatMessage(locale, 'canvas.authorL3.dropTargetAriaWithChip', {
                  stepName,
                  chipLabel: keyboardChipLabel,
                })
              : formatMessage(locale, 'canvas.authorL3.dropTargetAria', { stepName })
          }
          onKeyDown={handleDropTargetKeyDown}
          className={[
            'rounded-md border border-dashed border-edge bg-surface-secondary p-4 focus:outline-none focus:ring-2 focus:ring-status-info/50',
            isOver ? 'ring-2 ring-status-info/50' : '',
            disabled ? 'opacity-70' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-testid="author-l3-step-drop-target"
          data-droppable-id={droppableId}
        >
          <div className="flex flex-col gap-1">
            <h2 id="author-l3-step-heading" className="text-base font-semibold text-content">
              {stepName}
            </h2>
            <p className="text-sm text-content-secondary">
              {getMessage(locale, 'canvas.authorL3.dropHint')}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-content">
            {getMessage(locale, 'canvas.authorL3.assignedColumns')}
          </h3>
          {assigned.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2" data-testid="author-l3-assigned-list">
              {assigned.map(column => (
                <ColumnPill key={column} column={column} />
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-md border border-edge bg-surface-primary px-3 py-2 text-sm text-content-secondary">
              {getMessage(locale, 'canvas.authorL3.noAssignedColumns')}
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-content">
              {getMessage(locale, 'canvas.authorL3.ctqHeading')}
            </h3>
            {ctqColumn ? (
              <ul className="mt-2 flex flex-wrap gap-2" data-testid="author-l3-ctq-context">
                <ColumnPill column={ctqColumn} />
              </ul>
            ) : (
              <p className="mt-2 text-sm text-content-secondary">
                {getMessage(locale, 'canvas.authorL3.noCtqContext')}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-content">
              {getMessage(locale, 'canvas.authorL3.tributaryColumns')}
            </h3>
            {tributaryColumns.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2" data-testid="author-l3-tributary-context">
                {tributaryColumns.map(column => (
                  <ColumnPill key={column} column={column} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-content-secondary">
                {getMessage(locale, 'canvas.authorL3.noTributaryContext')}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
