/**
 * Canvas is the canonical FRAME canvas surface for process-map, outcome, and
 * operations-band rendering.
 */
import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { useChipDragAndDrop } from '@variscout/hooks';
import type { ProcessMap, Gap } from '@variscout/core/frame';
import type { SpecLimits } from '@variscout/core';
import {
  ProductionLineGlanceDashboard,
  type ProductionLineGlanceFilterStripProps,
  ProductionLineGlanceFilterStrip,
} from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../ProductionLineGlanceDashboard/types';
import { ProcessMapBase } from './internal/ProcessMapBase';
import { ChipRail, type ChipRailEntry } from '../ChipRail';
import { AutoStepCreatePrompt } from '../AutoStepCreatePrompt';

/**
 * Canonical FRAME canvas surface.
 *
 * Canvas renders the controlled process-map, outcome, and operations bands. It
 * owns no app store, persistence, or session state: callers pass the full
 * current canvas state in props and receive all edits through callbacks. That
 * keeps the surface ready for later CRDT-backed ownership because every map and
 * spec mutation remains explicit at the boundary.
 *
 * `CanvasWorkspace` owns b0/b1 routing and app-session filter composition. This
 * component stays focused on the rendered canvas bands.
 */
export type ProductionLineGlanceOpsMode = 'spatial' | 'full';

/**
 * Controlled inputs for the canonical Canvas implementation.
 *
 * `map`, specs, dashboard data, filter state, and operations mode are supplied
 * by the caller. `onChange`, `onSpecsChange`, `onStepSpecsChange`, and
 * `onOpsModeChange` are the only mutation channels; Canvas must not write stores
 * or persistence directly.
 */
export interface CanvasProps {
  map: ProcessMap;
  availableColumns: string[];
  onChange: (next: ProcessMap) => void;
  gaps?: Gap[];
  disabled?: boolean;
  target?: number;
  usl?: number;
  lsl?: number;
  cpkTarget?: number;
  onSpecsChange?: (next: {
    target?: number;
    usl?: number;
    lsl?: number;
    cpkTarget?: number;
  }) => void;
  stepSpecs?: Record<string, SpecLimits>;
  onStepSpecsChange?: (column: string, next: SpecLimits) => void;
  canvasFilterChips?: React.ReactNode;
  showGaps?: boolean;
  data: Pick<
    ProductionLineGlanceDashboardProps,
    'cpkTrend' | 'cpkGapTrend' | 'capabilityNodes' | 'errorSteps'
  >;
  filter: ProductionLineGlanceFilterStripProps;
  mode?: 'author' | 'read';
  chips?: ChipRailEntry[];
  onPlaceChip?: (chipId: string, stepId: string) => void;
  onCreateStepFromChip?: (chipId: string) => void;
  opsMode: ProductionLineGlanceOpsMode;
  onOpsModeChange: (next: ProductionLineGlanceOpsMode) => void;
  onStepClick?: (nodeId: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  map,
  availableColumns,
  onChange,
  gaps,
  disabled,
  target,
  usl,
  lsl,
  cpkTarget,
  onSpecsChange,
  stepSpecs,
  onStepSpecsChange,
  canvasFilterChips,
  showGaps = true,
  data,
  filter,
  mode: authoringMode = 'author',
  chips = [],
  onPlaceChip,
  onCreateStepFromChip,
  opsMode,
  onOpsModeChange,
  onStepClick,
}) => {
  const isAuthorMode = authoringMode === 'author';
  const canPlaceChips = isAuthorMode && !disabled && chips.length > 0;
  const showChipRail = canPlaceChips;
  const [pendingStepChipId, setPendingStepChipId] = React.useState<string | null>(null);
  const pendingStepChip = pendingStepChipId
    ? chips.find(chip => chip.chipId === pendingStepChipId)
    : undefined;
  const activePendingStepChip = canPlaceChips ? pendingStepChip : undefined;

  const handleCreateStepRequest = React.useCallback(
    (chipId: string) => {
      if (!canPlaceChips || !onCreateStepFromChip) return;
      setPendingStepChipId(chipId);
    },
    [canPlaceChips, onCreateStepFromChip]
  );

  const handleConfirmCreateStep = React.useCallback(() => {
    if (!canPlaceChips || !pendingStepChipId || !onCreateStepFromChip) return;
    onCreateStepFromChip(pendingStepChipId);
    setPendingStepChipId(null);
  }, [canPlaceChips, onCreateStepFromChip, pendingStepChipId]);

  const handleCancelCreateStep = React.useCallback(() => {
    setPendingStepChipId(null);
  }, []);

  const { handleDragEnd } = useChipDragAndDrop({
    onPlace: (chipId, stepId) => {
      if (!canPlaceChips) return;
      onPlaceChip?.(chipId, stepId);
    },
    onCreateStep: handleCreateStepRequest,
  });

  const hasOutcomeData =
    target !== undefined || usl !== undefined || lsl !== undefined || cpkTarget !== undefined;
  const isFull = opsMode === 'full';
  const affordanceLabel = isFull ? 'Hide temporal trends' : 'Show temporal trends';
  const affordanceArrow = isFull ? '↓' : '↑';

  const tributariesContent =
    map.tributaries.length > 0 ? (
      <ul className="mt-2 flex flex-wrap gap-2">
        {map.tributaries.map(trib => {
          const parentStep = map.nodes.find(n => n.id === trib.stepId);
          const stepLabel = parentStep?.name ?? 'Unmapped';
          return (
            <li
              key={trib.id}
              data-testid={`factor-chip-${trib.id}`}
              className="rounded-md border border-edge bg-surface px-2 py-1 text-xs"
            >
              <span className="font-medium text-content">{trib.column}</span>
              <span className="ml-1 text-content-secondary">at {stepLabel}</span>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="mt-2 text-sm text-content-secondary italic">No factors mapped yet</p>
    );

  const canvasContent = (
    <div data-testid="layered-process-view" className="flex flex-col">
      {canvasFilterChips ? (
        <div data-testid="layered-canvas-filter-chips">{canvasFilterChips}</div>
      ) : null}
      <div data-testid="layered-filter-strip">
        <ProductionLineGlanceFilterStrip {...filter} />
      </div>

      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
        <h3 className="text-sm font-semibold text-content">Outcome</h3>
        {hasOutcomeData ? (
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-secondary">
            {target !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">Target:</dt>
                <dd>{target}</dd>
              </div>
            )}
            {usl !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">USL:</dt>
                <dd>{usl}</dd>
              </div>
            )}
            {lsl !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">LSL:</dt>
                <dd>{lsl}</dd>
              </div>
            )}
            {cpkTarget !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">Cpk target:</dt>
                <dd>{cpkTarget}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-content-secondary italic">No outcome target set</p>
        )}

        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
            Mapped factors
          </h4>
          {tributariesContent}
        </div>
      </section>

      <section data-testid="band-process-flow" className="border-b border-edge px-4 py-3">
        <h3 className="text-sm font-semibold text-content">Process Flow</h3>
        <div className="mt-2">
          <ProcessMapBase
            map={map}
            availableColumns={availableColumns}
            onChange={onChange}
            gaps={gaps}
            disabled={disabled}
            target={target}
            usl={usl}
            lsl={lsl}
            cpkTarget={cpkTarget}
            onSpecsChange={onSpecsChange}
            stepSpecs={stepSpecs}
            onStepSpecsChange={onStepSpecsChange}
            showGaps={showGaps}
            chipDropTargets={canPlaceChips}
          />
        </div>
      </section>

      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
        <div className="mt-2">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpsModeChange(isFull ? 'spatial' : 'full')}
              className="self-start rounded text-xs font-medium text-content-secondary transition-colors hover:text-content"
            >
              {affordanceLabel} {affordanceArrow}
            </button>
            <div data-testid="ops-band-dashboard">
              <ProductionLineGlanceDashboard {...data} mode={opsMode} onStepClick={onStepClick} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative flex" data-testid="canvas-dnd-surface">
        {showChipRail ? <ChipRail chips={chips} className="w-64 shrink-0" /> : null}
        <div className="min-w-0 flex-1">{canvasContent}</div>
        {activePendingStepChip ? (
          <AutoStepCreatePrompt
            chipLabel={activePendingStepChip.label}
            position={{ x: 16, y: 16 }}
            onConfirm={handleConfirmCreateStep}
            onCancel={handleCancelCreateStep}
          />
        ) : null}
      </div>
    </DndContext>
  );
};

export default Canvas;
