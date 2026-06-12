/**
 * Canvas is the canonical FRAME canvas surface for process-map, outcome, and
 * operations-band rendering.
 */
import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { chartColors } from '@variscout/charts';
import {
  coerceCanvasLens,
  coerceCanvasOverlays,
  resolveEndpointToFactor,
  useCanvasViewportInput,
  useCanvasViewportShortcuts,
  useCanvasKeyboard,
  useChipDragAndDrop,
  useHypothesisDrawTool,
  useCanvasHypothesisDrawing,
  useCanvasHypothesisArrows,
  type CanvasAnalyzeFocus,
  type CanvasAnalyzeOverlayModel,
  type CanvasLensId,
  type CanvasOverlayId,
  type CanvasStepCardModel,
  type CanvasToolId,
} from '@variscout/hooks';
import type { ProcessMap as CoreProcessMap, Gap } from '@variscout/core/frame';
import {
  DEFAULT_PROCESS_HUB_ID,
  detectColumns,
  type DataRow,
  type Finding,
  type Hypothesis,
  type SpecLimits,
  type StepTimingBinding,
} from '@variscout/core';
import type { SpecRule } from '@variscout/core/types';
import type { ActionItem, ColumnTypeMap } from '@variscout/core/findings';
import type { CanvasLevel } from '@variscout/core/canvas';
import {
  useCanvasViewportStore,
  type CanvasViewportFit,
  type CanvasViewportSnapshot,
} from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import {
  type ProductionLineGlanceFilterStripProps,
  ProductionLineGlanceFilterStrip,
} from '../ProductionLineGlanceDashboard';
import type { ProductionLineGlanceDashboardProps } from '../ProductionLineGlanceDashboard/types';
import { ProcessMap } from './internal/ProcessMap';
import { CanvasViewport } from './internal/CanvasViewport';
import { CanvasLevelRouter, type CanvasL3Archetype } from './internal/CanvasLevelRouter';
import { ChipRail, type ChipRailEntry } from '../ChipRail';
import { AutoStepCreatePrompt } from '../AutoStepCreatePrompt';
import { StructuralToolbar } from '../StructuralToolbar';
import { CanvasLensPicker } from './internal/CanvasLensPicker';
import { useWallLocale } from '../AnalyzeWall/hooks/useWallLocale';
import { CanvasOverlayPicker } from './internal/CanvasOverlayPicker';
import { HypothesisDrawToolButton } from './internal/HypothesisDrawToolButton';
import {
  HypothesisDraftPopover,
  type HypothesisDraftPayload,
} from './internal/HypothesisDraftPopover';
import { CanvasStepCard } from './internal/CanvasStepCard';
import { CanvasStepOverlay, type CanvasOverlayAnchorRect } from './internal/CanvasStepOverlay';
import { sortedProcessSteps } from './internal/NoFocalStepPrompt';
import type { ContextLinkGroup, ContextLinkItem } from '../CrossSurface';
import type { LogActionPayload } from '../QuickAction';
import {
  ConnectedStepCapabilityView,
  type ConnectedStepValueRole,
} from '../ConnectedStepCapability';

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
// Re-exported from CanvasLevelRouter to avoid circular imports
export type { CanvasL3Archetype } from './internal/CanvasLevelRouter';

type CanvasQuestionOption = { id: string; text: string };

const EMPTY_CHIPS: ChipRailEntry[] = [];
const EMPTY_STEP_CARDS: CanvasStepCardModel[] = [];
const EMPTY_OVERLAYS: CanvasOverlayId[] = [];
const EMPTY_QUESTIONS: CanvasQuestionOption[] = [];
const EMPTY_ACTION_ITEMS: ActionItem[] = [];
const EMPTY_FINDINGS: Finding[] = [];
const AVAILABLE_OVERLAYS: CanvasOverlayId[] = [
  'investigations',
  'hypotheses',
  'hypothesis-hubs',
  'findings',
];
const DEFAULT_CANVAS_VIEWPORT: CanvasViewportSnapshot = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  currentLevel: 'l2',
  nodePositions: {},
  groupByTributary: false,
};
const CANVAS_FIT_REQUEST_EVENT = 'variscout:canvas-fit-request';
const FIT_TO_CONTENT_MARGIN = 0.95;

interface CanvasFitRequestDetail {
  hubId: ProcessHubId;
  level?: CanvasLevel;
}

function measureCanvasFit(
  wrapper: HTMLElement | null,
  level: CanvasLevel
): CanvasViewportFit | undefined {
  const contentElement = wrapper?.querySelector<HTMLElement>(`[data-canvas-level="${level}"]`);
  if (!wrapper || !contentElement) return undefined;

  const viewportBounds = wrapper.getBoundingClientRect();
  const contentBounds = contentElement.getBoundingClientRect();
  if (
    viewportBounds.width <= 0 ||
    viewportBounds.height <= 0 ||
    contentBounds.width <= 0 ||
    contentBounds.height <= 0
  ) {
    return undefined;
  }

  const zoom =
    Math.min(
      viewportBounds.width / contentBounds.width,
      viewportBounds.height / contentBounds.height
    ) * FIT_TO_CONTENT_MARGIN;
  return {
    zoom,
    pan: {
      x: viewportBounds.width / 2 - (contentBounds.width / 2) * zoom,
      y: viewportBounds.height / 2 - (contentBounds.height / 2) * zoom,
    },
  };
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
  hubId?: ProcessHubId;
  map: CoreProcessMap;
  availableColumns: string[];
  onChange: (next: CoreProcessMap) => void;
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
  capabilityContext?: {
    availableContext: {
      hubColumns: string[];
      tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
    };
    contextValueOptions: Record<string, string[]>;
  };
  onCapabilityScopeChange?: (stepId: string, specRules: SpecRule[]) => void;
  canvasFilterChips?: React.ReactNode;
  showGaps?: boolean;
  data: Pick<
    ProductionLineGlanceDashboardProps,
    'cpkTrend' | 'cpkGapTrend' | 'capabilityNodes' | 'errorSteps'
  >;
  rows?: readonly DataRow[];
  filter: ProductionLineGlanceFilterStripProps;
  l3Archetype?: CanvasL3Archetype;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddStep?: () => void;
  onRenameStep?: (stepId: string, newName: string) => void;
  onRemoveStep?: (stepId: string) => void;
  onConnectSteps?: (fromStepId: string, toStepId: string) => void;
  onDisconnectSteps?: (fromStepId: string, toStepId: string) => void;
  onGroupIntoSubStep?: (stepIds: string[], parentStepId: string) => void;
  onUngroupSubStep?: (stepId: string) => void;
  // IM-0b-2 (ADR-087 §5): rich-map authoring dispatch props, forwarded to
  // ProcessMap so ctqColumn / tributary / subgroupAxis / hunch edits flow
  // through canvasStore instead of the legacy onChange -> setProcessContext path.
  onSetStepCtq?: (stepId: string, ctqColumn: string | undefined) => void;
  onAddTributary?: (stepId: string, column: string) => void;
  onRemoveTributary?: (tributaryId: string) => void;
  onToggleSubgroupAxis?: (tributaryId: string) => void;
  onAddHunch?: (text: string, pin: { stepId?: string; tributaryId?: string }) => void;
  onRemoveHunch?: (hunchId: string) => void;
  chips?: ChipRailEntry[];
  onPlaceChip?: (chipId: string, stepId: string) => void;
  onCreateStepFromChip?: (chipId: string) => void;
  opsMode?: ProductionLineGlanceOpsMode;
  onOpsModeChange?: (next: ProductionLineGlanceOpsMode) => void;
  onStepClick?: (nodeId: string) => void;
  stepCards?: CanvasStepCardModel[];
  valueRolesByStepId?: Readonly<Record<string, ConnectedStepValueRole>>;
  stepTimings?: readonly StepTimingBinding[];
  activeLens?: CanvasLensId;
  onLensChange?: (next: CanvasLensId) => void;
  activeOverlays?: CanvasOverlayId[];
  onOverlayToggle?: (overlay: CanvasOverlayId) => void;
  activeCanvasTool?: CanvasToolId;
  onCanvasToolChange?: (next: CanvasToolId) => void;
  questions?: ReadonlyArray<CanvasQuestionOption>;
  hypotheses?: ReadonlyArray<Hypothesis>;
  onAddCausalLink?: (
    fromFactor: string,
    toFactor: string,
    whyStatement: string,
    // IM-1: questionId plumbing retained for the IM-4 unified-Wall draw-tool; not wired to a Question entity
    options?: { questionIds?: string[] }
  ) => void;
  investigationOverlays?: CanvasAnalyzeOverlayModel;
  onStepSpecsRequest?: (column: string, stepId: string) => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  onOpenInvestigationFocus?: (focus: CanvasAnalyzeFocus) => void;
  onRemoveCausalLink?: (linkId: string) => void;
  contextLinkGroups?: readonly ContextLinkGroup[];
  onNavigateContextLink?: (item: ContextLinkItem) => void;
  /** PR-CS-5 Part 2: capture-from-step affordance forwarded to CanvasStepOverlay. */
  onCaptureFindingFromStep?: (card: CanvasStepCardModel) => void;
  actionItems?: ActionItem[];
  findings?: ReadonlyArray<Finding>;
  onOpenScout?: (hubId: ProcessHubId) => void;
  onOpenWall?: () => void;
  onOpenColumnDetail?: (column: string, stepId: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  hubId = DEFAULT_PROCESS_HUB_ID,
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
  capabilityContext,
  onCapabilityScopeChange,
  canvasFilterChips,
  showGaps = true,
  filter,
  l3Archetype,
  onUndo,
  onRedo,
  onAddStep,
  onRenameStep,
  onRemoveStep,
  onConnectSteps,
  onDisconnectSteps,
  onGroupIntoSubStep,
  onUngroupSubStep,
  onSetStepCtq,
  onAddTributary,
  onRemoveTributary,
  onToggleSubgroupAxis,
  onAddHunch,
  onRemoveHunch,
  chips = EMPTY_CHIPS,
  data,
  onPlaceChip,
  onCreateStepFromChip,
  stepCards = EMPTY_STEP_CARDS,
  valueRolesByStepId,
  activeLens = 'default',
  onLensChange,
  activeOverlays = EMPTY_OVERLAYS,
  onOverlayToggle,
  activeCanvasTool = 'select',
  onCanvasToolChange,
  questions = EMPTY_QUESTIONS,
  hypotheses = [],
  onAddCausalLink,
  investigationOverlays,
  onStepSpecsRequest,
  onLogQuickAction,
  onOpenInvestigationFocus,
  onRemoveCausalLink,
  onCaptureFindingFromStep,
  contextLinkGroups,
  onNavigateContextLink,
  actionItems = EMPTY_ACTION_ITEMS,
  findings = EMPTY_FINDINGS,
  onOpenScout,
  onOpenColumnDetail,
  rows,
  stepTimings = [],
}) => {
  const locale = useWallLocale();
  const viewport = useCanvasViewportStore(s =>
    s.viewports[hubId] ? s.getViewport(hubId) : DEFAULT_CANVAS_VIEWPORT
  );
  const rawLens = activeLens;
  const resolvedLens = coerceCanvasLens(activeLens);
  const resolvedOverlays = React.useMemo(
    () => coerceCanvasOverlays(activeOverlays),
    [activeOverlays]
  );
  const sortedSteps = React.useMemo(() => sortedProcessSteps(map), [map]);
  const firstStepId = sortedSteps[0]?.id;
  const columnTypes = React.useMemo<ColumnTypeMap>(() => {
    if (!rows || rows.length === 0) return {};
    return Object.fromEntries(
      detectColumns([...rows]).columnAnalysis.map(column => [column.name, column.type])
    );
  }, [rows]);
  // PR-LV1-C: chip placement is always enabled when chips exist and the
  // surface isn't `disabled`. The State/Edit binary that previously gated
  // chip placement on author-mode is retired; canvas is always editable
  // subject to the caller-supplied `disabled` (and CanvasWorkspace's
  // `canEditCanvas`-derived `l3Archetype`).
  const canPlaceChips = !disabled && chips.length > 0;
  const resolvedL3Archetype: CanvasL3Archetype = l3Archetype ?? 'b1';
  const showChipRail = canPlaceChips && viewport.currentLevel === 'l2';
  const [pendingStepChipId, setPendingStepChipId] = React.useState<string | null>(null);
  const [keyboardChipId, setKeyboardChipId] = React.useState<string | null>(null);
  const [selectedStepIds, setSelectedStepIds] = React.useState<string[]>([]);
  const [activeStepCardId, setActiveStepCardId] = React.useState<string | null>(null);
  const [stepOverlayAnchor, setStepOverlayAnchor] = React.useState<CanvasOverlayAnchorRect | null>(
    null
  );
  const drawTool = useHypothesisDrawTool({
    active: activeCanvasTool === 'draw-hypothesis' && !disabled,
  });
  const stepMetricColumns = React.useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const card of stepCards) out[card.stepId] = card.metricColumn;
    return out;
  }, [stepCards]);
  const pendingStepChip = pendingStepChipId
    ? chips.find(chip => chip.chipId === pendingStepChipId)
    : undefined;
  const activePendingStepChip = canPlaceChips ? pendingStepChip : undefined;
  const keyboardChip = keyboardChipId
    ? chips.find(chip => chip.chipId === keyboardChipId)
    : undefined;

  useCanvasKeyboard({
    onUndo: () => onUndo?.(),
    onRedo: () => onRedo?.(),
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
  const visibleActiveStepCardId = viewport.currentLevel === 'l2' ? activeStepCardId : null;
  const activeStepCard = stepCards.find(card => card.stepId === visibleActiveStepCardId);
  const activeStepInvestigationOverlay = visibleActiveStepCardId
    ? investigationOverlays?.byStep[visibleActiveStepCardId]
    : undefined;
  const cardSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const lodInputSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const fitToContentMeasured = React.useCallback(
    (targetLevel?: CanvasLevel) => {
      const level = targetLevel ?? viewport.currentLevel;
      const fit = measureCanvasFit(lodInputSurfaceRef.current, level);
      useCanvasViewportStore.getState().fitToContent(hubId, level, fit);
    },
    [hubId, viewport.currentLevel]
  );
  useCanvasViewportInput({
    hubId,
    ref: lodInputSurfaceRef,
    disabled: disabled || activeCanvasTool === 'draw-hypothesis',
  });
  useCanvasViewportShortcuts({
    hubId,
    disabled,
    fitToContent: (_hubId, targetLevel) => fitToContentMeasured(targetLevel),
  });

  React.useEffect(() => {
    const handleFitRequest = (event: Event) => {
      const detail = (event as CustomEvent<CanvasFitRequestDetail>).detail;
      if (detail?.hubId !== hubId) return;
      fitToContentMeasured(detail.level);
    };
    window.addEventListener(CANVAS_FIT_REQUEST_EVENT, handleFitRequest);
    return () => window.removeEventListener(CANVAS_FIT_REQUEST_EVENT, handleFitRequest);
  }, [fitToContentMeasured, hubId]);

  React.useEffect(() => {
    if (viewport.currentLevel !== 'l3' || viewport.focalStepId || !firstStepId) return;
    useCanvasViewportStore.getState().setLevel(hubId, 'l3', firstStepId);
  }, [firstStepId, hubId, viewport.currentLevel, viewport.focalStepId]);

  const { arrowSegments, registerCardElement } = useCanvasHypothesisArrows({
    resolvedOverlays,
    investigationOverlays,
    cardSurfaceRef,
    resolvedLens,
    stepCards,
    viewportPanX: viewport.pan.x,
    viewportPanY: viewport.pan.y,
    viewportZoom: viewport.zoom,
  });

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

  React.useEffect(() => {
    if (viewport.currentLevel === 'l2') return undefined;
    const frame = requestAnimationFrame(handleCloseStepOverlay);
    return () => cancelAnimationFrame(frame);
  }, [handleCloseStepOverlay, viewport.currentLevel]);

  const { handlers: drawHandlers, endpointLabel } = useCanvasHypothesisDrawing({
    activeCanvasTool,
    disabled,
    drawTool,
    cardSurfaceRef,
    onCanvasToolChange,
    stepMetricColumns,
  });

  const handleHypothesisSave = React.useCallback(
    (payload: HypothesisDraftPayload): void => {
      if (drawTool.state.phase !== 'awaitingForm') return;
      const fromFactor = resolveEndpointToFactor(drawTool.state.source, stepMetricColumns);
      const toFactor = resolveEndpointToFactor(drawTool.state.target, stepMetricColumns);
      drawTool.reset();
      if (!fromFactor || !toFactor) return;
      onAddCausalLink?.(fromFactor, toFactor, payload.whyStatement, {
        // IM-1: questionId plumbing retained for the IM-4 unified-Wall draw-tool; not wired to a Question entity
        questionIds: payload.questionId ? [payload.questionId] : [],
      });
      onCanvasToolChange?.('select');
    },
    [drawTool, onAddCausalLink, onCanvasToolChange, stepMetricColumns]
  );

  const stepCardGrid =
    stepCards.length > 0 ? (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stepCards.map(card => (
          <CanvasStepCard
            key={card.stepId}
            card={card}
            zoom={viewport.zoom}
            activeLens={resolvedLens}
            activeOverlays={resolvedOverlays}
            investigationOverlay={investigationOverlays?.byStep[card.stepId]}
            activeCanvasTool={activeCanvasTool}
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
    );

  const canvasContent = (
    <div
      data-testid="layered-process-view"
      data-canvas-level="l2"
      className="flex flex-col bg-surface-background"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-2">
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
        <CanvasLensPicker activeLens={resolvedLens} onChange={onLensChange} />
        <CanvasOverlayPicker
          activeOverlays={resolvedOverlays}
          availableOverlays={AVAILABLE_OVERLAYS}
          onToggle={onOverlayToggle}
        />
        <HypothesisDrawToolButton
          activeTool={activeCanvasTool}
          onChange={next => onCanvasToolChange?.(next)}
          disabled={disabled}
        />
      </div>

      {canvasFilterChips ? (
        <div data-testid="layered-canvas-filter-chips">{canvasFilterChips}</div>
      ) : null}
      <div data-testid="layered-filter-strip">
        <ProductionLineGlanceFilterStrip {...filter} />
      </div>

      <ConnectedStepCapabilityView
        map={map}
        stepCards={stepCards}
        capabilityNodes={data.capabilityNodes}
        errorSteps={data.errorSteps}
        valueRolesByStepId={valueRolesByStepId}
        rows={rows}
        stepTimings={stepTimings}
      />

      <section
        ref={cardSurfaceRef}
        className={[
          'relative px-4 py-4',
          activeCanvasTool === 'draw-hypothesis' && !disabled ? 'cursor-crosshair' : '',
        ].join(' ')}
        data-testid="canvas-card-surface"
        onPointerDown={drawHandlers.onPointerDown}
        onPointerMove={drawHandlers.onPointerMove}
        onPointerUp={drawHandlers.onPointerUp}
        onPointerCancel={() => drawTool.onPointerCancel()}
        onKeyDown={drawHandlers.onKeyDown}
        style={{ touchAction: activeCanvasTool === 'draw-hypothesis' ? 'none' : undefined }}
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
                opacity={0.6}
                style={{ color: chartColors.warning }}
              />
            ))}
          </svg>
        ) : null}
        {drawTool.state.phase === 'drawing' ? (
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
            data-testid="canvas-rubber-band"
            aria-hidden="true"
          >
            <line
              x1={drawTool.state.anchorAt.x}
              y1={drawTool.state.anchorAt.y}
              x2={drawTool.state.cursorAt.x}
              y2={drawTool.state.cursorAt.y}
              stroke="currentColor"
              strokeDasharray="4 3"
              strokeWidth="2"
              opacity={0.7}
              style={{ color: chartColors.warning }}
            />
          </svg>
        ) : null}
        <CanvasViewport zoom={viewport.zoom} pan={viewport.pan}>
          {stepCardGrid}
        </CanvasViewport>
        {drawTool.state.phase === 'awaitingForm' ? (
          <HypothesisDraftPopover
            sourceLabel={endpointLabel(drawTool.state.source)}
            targetLabel={endpointLabel(drawTool.state.target)}
            releaseAt={drawTool.state.releaseAt}
            questions={questions}
            onSave={handleHypothesisSave}
            onCancel={drawTool.reset}
          />
        ) : null}
      </section>

      <section className="border-t border-edge px-4 py-3" data-testid="canvas-authoring-map">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content">Map structure</h3>
          <span className="text-xs text-content-muted">Authoring model</span>
        </div>
        <div>
          <ProcessMap
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
            capabilityContext={capabilityContext}
            onCapabilityScopeChange={onCapabilityScopeChange}
            showGaps={showGaps}
            chipDropTargets={canPlaceChips}
            selectedStepIds={selectedStepIds}
            onSelectionChange={setSelectedStepIds}
            onAddStep={onAddStep ? () => onAddStep() : undefined}
            onRenameStep={onRenameStep}
            onRemoveStep={onRemoveStep}
            onConnectSteps={onConnectSteps}
            onDisconnectSteps={onDisconnectSteps}
            onUngroupSubStep={onUngroupSubStep}
            onSetStepCtq={onSetStepCtq}
            onAddTributary={onAddTributary}
            onRemoveTributary={onRemoveTributary}
            onToggleSubgroupAxis={onToggleSubgroupAxis}
            onAddHunch={onAddHunch}
            onRemoveHunch={onRemoveHunch}
            onKeyboardChipDrop={handleKeyboardChipDrop}
            keyboardChipLabel={keyboardChip?.label ?? null}
          />
        </div>
      </section>
    </div>
  );

  const levelContent = (
    <CanvasLevelRouter
      hubId={hubId}
      map={map}
      currentLevel={viewport.currentLevel}
      focalStepId={viewport.focalStepId}
      rawLens={rawLens}
      resolvedLens={resolvedLens}
      locale={locale}
      l2Content={canvasContent}
      rows={rows ?? []}
      stepCards={stepCards}
      hypotheses={hypotheses}
      findings={findings}
      usl={usl}
      lsl={lsl}
      target={target}
      cpkTarget={cpkTarget}
      onOpenScout={onOpenScout}
      chips={chips}
      canPlaceChips={canPlaceChips}
      onPlaceChip={onPlaceChip}
      onKeyboardChipPickUp={setKeyboardChipId}
      onKeyboardChipDrop={handleKeyboardChipDrop}
      columnTypes={columnTypes}
      onOpenColumnDetail={onOpenColumnDetail}
      onLogQuickAction={onLogQuickAction}
      resolvedL3Archetype={resolvedL3Archetype}
    />
  );
  const desktopLevelContent = (
    <div
      ref={lodInputSurfaceRef}
      data-testid="canvas-lod-input-surface"
      data-canvas-viewport-wrapper
      className="min-h-0"
    >
      {levelContent}
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative flex" data-testid="canvas-dnd-surface">
        {showChipRail ? (
          <ChipRail chips={chips} className="w-64 shrink-0" onKeyboardPickUp={setKeyboardChipId} />
        ) : null}
        <div className="min-w-0 flex-1">{desktopLevelContent}</div>
        {activePendingStepChip ? (
          <AutoStepCreatePrompt
            chipLabel={activePendingStepChip.label}
            position={{ x: 16, y: 16 }}
            onConfirm={handleConfirmCreateStep}
            onCancel={handleCancelCreateStep}
          />
        ) : null}
        {activeStepCard ? (
          <CanvasStepOverlay
            card={activeStepCard}
            anchorRect={stepOverlayAnchor}
            onClose={handleCloseStepOverlay}
            investigationOverlay={activeStepInvestigationOverlay}
            onOpenInvestigationFocus={onOpenInvestigationFocus}
            onRemoveCausalLink={onRemoveCausalLink}
            contextLinkGroups={contextLinkGroups}
            onNavigateContextLink={onNavigateContextLink}
            onCaptureFindingFromStep={onCaptureFindingFromStep}
            actionItems={actionItems}
          />
        ) : null}
      </div>
    </DndContext>
  );
};

export default Canvas;

export { navigateToExploreForChip } from './EditMode/handlers/navigateToExploreForChip';
export type { ChipNavigationTarget } from './EditMode/handlers/navigateToExploreForChip';
export { ExploreJumpButton } from './EditMode/ExploreJumpButton';
