/**
 * Canvas is the canonical FRAME canvas surface for process-map, outcome, and
 * operations-band rendering.
 */
import React from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  coerceCanvasLens,
  coerceCanvasOverlays,
  useCanvasKeyboard,
  useChipDragAndDrop,
  type CanvasInvestigationFocus,
  type CanvasInvestigationOverlayModel,
  type CanvasLensId,
  type CanvasOverlayId,
  type CanvasStepCardModel,
} from '@variscout/hooks';
import type { ProcessMap, Gap } from '@variscout/core/frame';
import type { SpecLimits } from '@variscout/core';
import {
  type ProductionLineGlanceFilterStripProps,
  ProductionLineGlanceFilterStrip,
} from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../ProductionLineGlanceDashboard/types';
import { ProcessMapBase } from './internal/ProcessMapBase';
import { ChipRail, type ChipRailEntry } from '../ChipRail';
import { AutoStepCreatePrompt } from '../AutoStepCreatePrompt';
import { CanvasModeToggle } from '../CanvasModeToggle';
import { StructuralToolbar } from '../StructuralToolbar';
import { CanvasLensPicker } from './internal/CanvasLensPicker';
import { CanvasOverlayPicker } from './internal/CanvasOverlayPicker';
import { CanvasStepCard } from './internal/CanvasStepCard';
import { CanvasStepOverlay, type CanvasOverlayAnchorRect } from './internal/CanvasStepOverlay';

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
export type CanvasAuthoringMode = 'author' | 'read';

type ArrowSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function areArrowSegmentsEqual(left: ArrowSegment[], right: ArrowSegment[]) {
  if (left.length !== right.length) return false;
  return left.every((segment, index) => {
    const next = right[index];
    return (
      segment.id === next.id &&
      segment.x1 === next.x1 &&
      segment.y1 === next.y1 &&
      segment.x2 === next.x2 &&
      segment.y2 === next.y2
    );
  });
}

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
  mode?: CanvasAuthoringMode;
  onModeChange?: (next: CanvasAuthoringMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddStep?: () => void;
  onRenameStep?: (stepId: string, newName: string) => void;
  onRemoveStep?: (stepId: string) => void;
  onConnectSteps?: (fromStepId: string, toStepId: string) => void;
  onDisconnectSteps?: (fromStepId: string, toStepId: string) => void;
  onGroupIntoSubStep?: (stepIds: string[], parentStepId: string) => void;
  onUngroupSubStep?: (stepId: string) => void;
  chips?: ChipRailEntry[];
  onPlaceChip?: (chipId: string, stepId: string) => void;
  onCreateStepFromChip?: (chipId: string) => void;
  opsMode?: ProductionLineGlanceOpsMode;
  onOpsModeChange?: (next: ProductionLineGlanceOpsMode) => void;
  onStepClick?: (nodeId: string) => void;
  stepCards?: CanvasStepCardModel[];
  activeLens?: CanvasLensId;
  onLensChange?: (next: CanvasLensId) => void;
  activeOverlays?: CanvasOverlayId[];
  onOverlayToggle?: (overlay: CanvasOverlayId) => void;
  investigationOverlays?: CanvasInvestigationOverlayModel;
  onStepSpecsRequest?: (column: string, stepId: string) => void;
  onQuickAction?: (stepId: string) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onOpenInvestigationFocus?: (focus: CanvasInvestigationFocus) => void;
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
  filter,
  mode: authoringMode = 'author',
  onModeChange,
  onUndo,
  onRedo,
  onAddStep,
  onRenameStep,
  onRemoveStep,
  onConnectSteps,
  onDisconnectSteps,
  onGroupIntoSubStep,
  chips = [],
  onPlaceChip,
  onCreateStepFromChip,
  stepCards = [],
  activeLens = 'default',
  onLensChange,
  activeOverlays = [],
  onOverlayToggle,
  investigationOverlays,
  onStepSpecsRequest,
  onQuickAction,
  onFocusedInvestigation,
  onOpenInvestigationFocus,
}) => {
  const isAuthorMode = authoringMode === 'author';
  const resolvedLens = coerceCanvasLens(activeLens);
  const resolvedOverlays = React.useMemo(
    () => coerceCanvasOverlays(activeOverlays),
    [activeOverlays]
  );
  const canPlaceChips = isAuthorMode && !disabled && chips.length > 0;
  const showChipRail = canPlaceChips;
  const [pendingStepChipId, setPendingStepChipId] = React.useState<string | null>(null);
  const [keyboardChipId, setKeyboardChipId] = React.useState<string | null>(null);
  const [selectedStepIds, setSelectedStepIds] = React.useState<string[]>([]);
  const [activeStepCardId, setActiveStepCardId] = React.useState<string | null>(null);
  const [stepOverlayAnchor, setStepOverlayAnchor] = React.useState<CanvasOverlayAnchorRect | null>(
    null
  );
  const cardElements = React.useRef(new Map<string, HTMLElement>());
  const [arrowSegments, setArrowSegments] = React.useState<ArrowSegment[]>([]);
  const pendingStepChip = pendingStepChipId
    ? chips.find(chip => chip.chipId === pendingStepChipId)
    : undefined;
  const activePendingStepChip = canPlaceChips ? pendingStepChip : undefined;
  const keyboardChip = keyboardChipId
    ? chips.find(chip => chip.chipId === keyboardChipId)
    : undefined;

  const toggleMode = React.useCallback(() => {
    onModeChange?.(authoringMode === 'author' ? 'read' : 'author');
  }, [authoringMode, onModeChange]);

  useCanvasKeyboard({
    onUndo: () => onUndo?.(),
    onRedo: () => onRedo?.(),
    onToggleMode: toggleMode,
    onExitAuthorMode: () => onModeChange?.('read'),
  });

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

  const handleKeyboardChipDrop = React.useCallback(
    (stepId: string) => {
      if (!canPlaceChips || !keyboardChipId) return;
      onPlaceChip?.(keyboardChipId, stepId);
      setKeyboardChipId(null);
    },
    [canPlaceChips, keyboardChipId, onPlaceChip]
  );

  const groupSelection = React.useCallback(() => {
    if (selectedStepIds.length < 2) return;
    const [parentStepId, ...childStepIds] = selectedStepIds;
    onGroupIntoSubStep?.(childStepIds, parentStepId);
  }, [onGroupIntoSubStep, selectedStepIds]);

  const branchSelection = React.useCallback(() => {
    if (selectedStepIds.length < 2) return;
    const [fromStepId, ...toStepIds] = selectedStepIds;
    for (const toStepId of toStepIds) onConnectSteps?.(fromStepId, toStepId);
  }, [onConnectSteps, selectedStepIds]);

  const joinSelection = React.useCallback(() => {
    if (selectedStepIds.length < 2) return;
    const toStepId = selectedStepIds[selectedStepIds.length - 1];
    for (const fromStepId of selectedStepIds.slice(0, -1)) onConnectSteps?.(fromStepId, toStepId);
  }, [onConnectSteps, selectedStepIds]);

  const { handleDragEnd } = useChipDragAndDrop({
    onPlace: (chipId, stepId) => {
      if (!canPlaceChips) return;
      onPlaceChip?.(chipId, stepId);
    },
    onCreateStep: handleCreateStepRequest,
  });
  const activeStepCard = stepCards.find(card => card.stepId === activeStepCardId);
  const activeStepInvestigationOverlay = activeStepCardId
    ? investigationOverlays?.byStep[activeStepCardId]
    : undefined;
  const cardSurfaceRef = React.useRef<HTMLDivElement | null>(null);

  const registerCardElement = React.useCallback((stepId: string, element: HTMLElement | null) => {
    if (element) cardElements.current.set(stepId, element);
    else cardElements.current.delete(stepId);
  }, []);

  React.useLayoutEffect(() => {
    if (
      !resolvedOverlays.includes('hypotheses') ||
      !investigationOverlays ||
      !cardSurfaceRef.current
    ) {
      setArrowSegments(current => (current.length === 0 ? current : []));
      return;
    }
    const surfaceRect = cardSurfaceRef.current.getBoundingClientRect();
    const next = investigationOverlays.arrows.flatMap(arrow => {
      const from = cardElements.current.get(arrow.fromStepId);
      const to = cardElements.current.get(arrow.toStepId);
      if (!from || !to) return [];
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      return [
        {
          id: arrow.id,
          x1: fromRect.left + fromRect.width / 2 - surfaceRect.left,
          y1: fromRect.top + fromRect.height / 2 - surfaceRect.top,
          x2: toRect.left + toRect.width / 2 - surfaceRect.left,
          y2: toRect.top + toRect.height / 2 - surfaceRect.top,
        },
      ];
    });
    setArrowSegments(current => (areArrowSegmentsEqual(current, next) ? current : next));
  }, [investigationOverlays, resolvedOverlays, stepCards]);

  const handleOpenStepCard = React.useCallback((stepId: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setActiveStepCardId(stepId);
    setStepOverlayAnchor({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const handleCloseStepOverlay = React.useCallback(() => {
    setActiveStepCardId(null);
    setStepOverlayAnchor(null);
  }, []);

  const canvasContent = (
    <div data-testid="layered-process-view" className="flex flex-col bg-surface-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {isAuthorMode ? (
            <StructuralToolbar
              selectedStepCount={selectedStepIds.length}
              onAddStep={() => onAddStep?.()}
              onGroupSelection={groupSelection}
              onBranchSelection={branchSelection}
              onJoinSelection={joinSelection}
              onUndo={() => onUndo?.()}
              onRedo={() => onRedo?.()}
              disabled={disabled}
            />
          ) : null}
          <CanvasLensPicker activeLens={resolvedLens} onChange={onLensChange} />
          <CanvasOverlayPicker activeOverlays={resolvedOverlays} onToggle={onOverlayToggle} />
        </div>
        <div className="flex items-center gap-2">
          {onModeChange ? (
            <CanvasModeToggle mode={authoringMode} onChange={onModeChange} disabled={disabled} />
          ) : null}
        </div>
      </div>

      {canvasFilterChips ? (
        <div data-testid="layered-canvas-filter-chips">{canvasFilterChips}</div>
      ) : null}
      <div data-testid="layered-filter-strip">
        <ProductionLineGlanceFilterStrip {...filter} />
      </div>

      <section
        ref={cardSurfaceRef}
        className="relative px-4 py-4"
        data-testid="canvas-card-surface"
      >
        {resolvedOverlays.includes('hypotheses') && arrowSegments.length > 0 ? (
          <svg
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            data-testid="canvas-hypothesis-arrows"
            aria-hidden="true"
          >
            {arrowSegments.map(segment => (
              <line
                key={segment.id}
                data-testid={`canvas-hypothesis-arrow-${segment.id}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="currentColor"
                strokeDasharray="5 5"
                strokeWidth="2"
                className="text-amber-500/60"
              />
            ))}
          </svg>
        ) : null}
        {stepCards.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stepCards.map(card => (
              <CanvasStepCard
                key={card.stepId}
                card={card}
                activeLens={resolvedLens}
                activeOverlays={resolvedOverlays}
                investigationOverlay={investigationOverlays?.byStep[card.stepId]}
                onOpen={handleOpenStepCard}
                onStepSpecsRequest={onStepSpecsRequest}
                registerCardElement={registerCardElement}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-edge bg-surface-primary p-4 text-sm text-content-secondary">
            Add process steps to create live canvas cards.
          </div>
        )}
      </section>

      <section className="border-t border-edge px-4 py-3" data-testid="canvas-authoring-map">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content">Map structure</h3>
          <span className="text-xs text-content-muted">Authoring model</span>
        </div>
        <div>
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
            selectedStepIds={selectedStepIds}
            onSelectionChange={setSelectedStepIds}
            onAddStep={onAddStep ? () => onAddStep() : undefined}
            onRenameStep={onRenameStep}
            onRemoveStep={onRemoveStep}
            onConnectSteps={onConnectSteps}
            onDisconnectSteps={onDisconnectSteps}
            onKeyboardChipDrop={handleKeyboardChipDrop}
            keyboardChipLabel={keyboardChip?.label ?? null}
          />
        </div>
      </section>
      {activeStepCard ? (
        <CanvasStepOverlay
          card={activeStepCard}
          anchorRect={stepOverlayAnchor}
          onClose={handleCloseStepOverlay}
          onQuickAction={onQuickAction}
          onFocusedInvestigation={onFocusedInvestigation}
          investigationOverlay={activeStepInvestigationOverlay}
          onOpenInvestigationFocus={onOpenInvestigationFocus}
        />
      ) : null}
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative flex" data-testid="canvas-dnd-surface">
        {showChipRail ? (
          <ChipRail chips={chips} className="w-64 shrink-0" onKeyboardPickUp={setKeyboardChipId} />
        ) : null}
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
