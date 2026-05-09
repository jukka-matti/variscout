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
  useCanvasKeyboard,
  useHasInvestigationContent,
  useChipDragAndDrop,
  useHypothesisDrawTool,
  type ArrowEndpoint,
  type CanvasInvestigationFocus,
  type CanvasInvestigationOverlayModel,
  type CanvasLensId,
  type CanvasOverlayId,
  type CanvasStepCardModel,
  type CanvasToolId,
} from '@variscout/hooks';
import type { ProcessMap, Gap } from '@variscout/core/frame';
import type { Finding, SpecLimits, WorkflowReadinessSignals } from '@variscout/core';
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
import { HypothesisDrawToolButton } from './internal/HypothesisDrawToolButton';
import {
  HypothesisDraftPopover,
  type HypothesisDraftPayload,
} from './internal/HypothesisDraftPopover';
import { CanvasStepCard } from './internal/CanvasStepCard';
import { CanvasStepOverlay, type CanvasOverlayAnchorRect } from './internal/CanvasStepOverlay';
import { CanvasWallOverlay } from './internal/CanvasWallOverlay';
import { WallShortcutButton } from './internal/WallShortcutButton';
import { useWallIsMobile } from '../InvestigationWall';

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

type CanvasQuestionOption = { id: string; text: string };

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
  activeCanvasTool?: CanvasToolId;
  onCanvasToolChange?: (next: CanvasToolId) => void;
  questions?: ReadonlyArray<CanvasQuestionOption>;
  onAddCausalLink?: (
    fromFactor: string,
    toFactor: string,
    whyStatement: string,
    options?: { questionIds?: string[] }
  ) => void;
  investigationOverlays?: CanvasInvestigationOverlayModel;
  signals: WorkflowReadinessSignals;
  onStepSpecsRequest?: (column: string, stepId: string) => void;
  onQuickAction?: (stepId: string) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
  onOpenInvestigationFocus?: (focus: CanvasInvestigationFocus) => void;
  onRemoveCausalLink?: (linkId: string) => void;
  findings?: ReadonlyArray<Finding>;
  problemCpk?: number;
  eventsPerWeek?: number;
  activeColumns?: ReadonlyArray<string>;
  onOpenWall?: () => void;
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
  onUngroupSubStep,
  chips = [],
  onPlaceChip,
  onCreateStepFromChip,
  stepCards = [],
  activeLens = 'default',
  onLensChange,
  activeOverlays = [],
  onOverlayToggle,
  activeCanvasTool = 'select',
  onCanvasToolChange,
  questions = [],
  onAddCausalLink,
  investigationOverlays,
  signals,
  onStepSpecsRequest,
  onQuickAction,
  onFocusedInvestigation,
  onCharter,
  onSustainment,
  onHandoff,
  onOpenInvestigationFocus,
  onRemoveCausalLink,
  findings = [],
  problemCpk,
  eventsPerWeek,
  activeColumns,
  onOpenWall,
}) => {
  const isAuthorMode = authoringMode === 'author';
  const resolvedLens = coerceCanvasLens(activeLens);
  const resolvedOverlays = React.useMemo(
    () => coerceCanvasOverlays(activeOverlays),
    [activeOverlays]
  );
  const wallFindings = React.useMemo(() => [...findings], [findings]);
  const hasInvestigationContent = useHasInvestigationContent({ findingsCount: findings.length });
  const wallIsMobile = useWallIsMobile();
  const availableOverlays = React.useMemo<CanvasOverlayId[]>(() => {
    const base: CanvasOverlayId[] = [
      'investigations',
      'hypotheses',
      'suspected-causes',
      'findings',
    ];
    return hasInvestigationContent ? [...base, 'wall'] : base;
  }, [hasInvestigationContent]);
  const pickerAvailableOverlays = React.useMemo(
    () =>
      wallIsMobile ? availableOverlays.filter(overlay => overlay !== 'wall') : availableOverlays,
    [availableOverlays, wallIsMobile]
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
  const [arrowMeasureVersion, setArrowMeasureVersion] = React.useState(0);
  const drawTool = useHypothesisDrawTool({
    active: activeCanvasTool === 'draw-hypothesis' && !disabled,
  });
  const resetDrawTool = drawTool.reset;
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

  const stepMetricColumns = React.useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const card of stepCards) out[card.stepId] = card.metricColumn;
    return out;
  }, [stepCards]);

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
      return;
    }

    const refresh = () => setArrowMeasureVersion(version => version + 1);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh);
    resizeObserver?.observe(cardSurfaceRef.current);
    for (const element of cardElements.current.values()) resizeObserver?.observe(element);
    window.addEventListener('resize', refresh);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', refresh);
    };
  }, [investigationOverlays, resolvedLens, resolvedOverlays, stepCards]);

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
  }, [arrowMeasureVersion, investigationOverlays, resolvedLens, resolvedOverlays, stepCards]);

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

  const surfacePoint = React.useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = cardSurfaceRef.current?.getBoundingClientRect();
      return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: clientX, y: clientY };
    },
    []
  );

  const endpointElementFromTarget = React.useCallback(
    (target: EventTarget | null): Element | null => {
      return target instanceof Element ? target.closest('[data-arrow-endpoint]') : null;
    },
    []
  );

  const parseEndpointElement = React.useCallback(
    (element: Element | null): ArrowEndpoint | null => {
      let node: Element | null = element;
      while (node) {
        const attr = node.getAttribute('data-arrow-endpoint');
        if (attr) {
          const separator = attr.indexOf(':');
          if (separator < 0) return null;
          const kind = attr.slice(0, separator);
          const id = attr.slice(separator + 1);
          if (kind === 'step') return { kind: 'step', id };
          if (kind === 'column') {
            const directHostStepId = node.getAttribute('data-arrow-host-step-id');
            if (directHostStepId) return { kind: 'column', name: id, hostStepId: directHostStepId };
            let stepNode = node.parentElement;
            while (stepNode) {
              const hostStepId = stepNode.getAttribute('data-arrow-host-step-id');
              if (hostStepId) return { kind: 'column', name: id, hostStepId };
              const stepAttr = stepNode.getAttribute('data-arrow-endpoint');
              if (stepAttr?.startsWith('step:')) {
                return { kind: 'column', name: id, hostStepId: stepAttr.slice(5) };
              }
              stepNode = stepNode.parentElement;
            }
          }
        }
        node = node.parentElement;
      }
      return null;
    },
    []
  );

  const endpointFromPointerEvent = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): ArrowEndpoint | null => {
      const targetElement = endpointElementFromTarget(event.target);
      const fallbackElement =
        typeof document === 'undefined' || typeof document.elementFromPoint !== 'function'
          ? null
          : document.elementFromPoint(event.clientX, event.clientY);
      return parseEndpointElement(targetElement) ?? parseEndpointElement(fallbackElement);
    },
    [endpointElementFromTarget, parseEndpointElement]
  );

  const endpointFromKeyboardEvent = React.useCallback(
    (
      event: React.KeyboardEvent<HTMLElement>
    ): { endpoint: ArrowEndpoint; at: { x: number; y: number } } | null => {
      const element = endpointElementFromTarget(event.target);
      const endpoint = parseEndpointElement(element);
      if (!endpoint) return null;
      const elementRect = element?.getBoundingClientRect();
      const surfaceRect = cardSurfaceRef.current?.getBoundingClientRect();
      if (elementRect && surfaceRect) {
        return {
          endpoint,
          at: {
            x: elementRect.left + elementRect.width / 2 - surfaceRect.left,
            y: elementRect.top + elementRect.height / 2 - surfaceRect.top,
          },
        };
      }
      return { endpoint, at: { x: 0, y: 0 } };
    },
    [endpointElementFromTarget, parseEndpointElement]
  );

  const handleDrawPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
      const endpoint = endpointFromPointerEvent(event);
      if (!endpoint) return;
      const sourceElement = endpointElementFromTarget(event.target);
      const sourceRect = sourceElement?.getBoundingClientRect();
      const surfaceRect = cardSurfaceRef.current?.getBoundingClientRect();
      const anchor =
        sourceRect && surfaceRect
          ? {
              x: sourceRect.left + sourceRect.width / 2 - surfaceRect.left,
              y: sourceRect.top + sourceRect.height / 2 - surfaceRect.top,
            }
          : surfacePoint(event.clientX, event.clientY);
      event.preventDefault();
      drawTool.onPointerDown(endpoint, anchor);
    },
    [
      activeCanvasTool,
      disabled,
      drawTool,
      endpointElementFromTarget,
      endpointFromPointerEvent,
      surfacePoint,
    ]
  );

  const handleDrawPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (drawTool.state.phase !== 'drawing') return;
      drawTool.onPointerMove(
        surfacePoint(event.clientX, event.clientY),
        endpointFromPointerEvent(event)
      );
    },
    [drawTool, endpointFromPointerEvent, surfacePoint]
  );

  const handleDrawPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (drawTool.state.phase !== 'drawing') return;
      drawTool.onPointerUp(
        endpointFromPointerEvent(event),
        surfacePoint(event.clientX, event.clientY)
      );
    },
    [drawTool, endpointFromPointerEvent, surfacePoint]
  );

  const handleDrawKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>): void => {
      if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
      if (event.key === 'Escape') {
        drawTool.cancel();
        onCanvasToolChange?.('select');
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const resolved = endpointFromKeyboardEvent(event);
      if (!resolved) return;
      event.preventDefault();
      if (drawTool.state.phase === 'drawing') {
        drawTool.onPointerUp(resolved.endpoint, resolved.at);
      } else {
        drawTool.onPointerDown(resolved.endpoint, resolved.at);
      }
    },
    [activeCanvasTool, disabled, drawTool, endpointFromKeyboardEvent, onCanvasToolChange]
  );

  const endpointLabel = React.useCallback(
    (endpoint: ArrowEndpoint): string =>
      endpoint.kind === 'column' ? endpoint.name : (stepMetricColumns[endpoint.id] ?? endpoint.id),
    [stepMetricColumns]
  );

  const handleHypothesisSave = React.useCallback(
    (payload: HypothesisDraftPayload): void => {
      if (drawTool.state.phase !== 'awaitingForm') return;
      const fromFactor = resolveEndpointToFactor(drawTool.state.source, stepMetricColumns);
      const toFactor = resolveEndpointToFactor(drawTool.state.target, stepMetricColumns);
      drawTool.reset();
      if (!fromFactor || !toFactor) return;
      onAddCausalLink?.(fromFactor, toFactor, payload.whyStatement, {
        questionIds: payload.questionId ? [payload.questionId] : [],
      });
      onCanvasToolChange?.('select');
    },
    [drawTool, onAddCausalLink, onCanvasToolChange, stepMetricColumns]
  );

  React.useEffect(() => {
    if (activeCanvasTool !== 'draw-hypothesis') resetDrawTool();
  }, [activeCanvasTool, resetDrawTool]);

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
          <CanvasOverlayPicker
            activeOverlays={resolvedOverlays}
            availableOverlays={pickerAvailableOverlays}
            onToggle={onOverlayToggle}
          />
          {wallIsMobile && hasInvestigationContent && onOpenWall ? (
            <WallShortcutButton onClick={onOpenWall} disabled={disabled} />
          ) : null}
          <HypothesisDrawToolButton
            activeTool={activeCanvasTool}
            onChange={next => onCanvasToolChange?.(next)}
            disabled={disabled}
          />
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
        className={[
          'relative px-4 py-4',
          activeCanvasTool === 'draw-hypothesis' && !disabled ? 'cursor-crosshair' : '',
        ].join(' ')}
        data-testid="canvas-card-surface"
        onPointerDown={handleDrawPointerDown}
        onPointerMove={handleDrawPointerMove}
        onPointerUp={handleDrawPointerUp}
        onPointerCancel={() => drawTool.onPointerCancel()}
        onKeyDown={handleDrawKeyDown}
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
        {stepCards.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stepCards.map(card => (
              <CanvasStepCard
                key={card.stepId}
                card={card}
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
        )}
        <CanvasWallOverlay
          activeOverlays={resolvedOverlays}
          activeCanvasTool={activeCanvasTool}
          findings={wallFindings}
          processMap={map}
          problemCpk={problemCpk ?? 0}
          eventsPerWeek={eventsPerWeek ?? 0}
          activeColumns={activeColumns ?? availableColumns}
          onOpenWall={onOpenWall}
        />
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
            onUngroupSubStep={onUngroupSubStep}
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
          signals={signals}
          onQuickAction={onQuickAction}
          onFocusedInvestigation={onFocusedInvestigation}
          onCharter={onCharter}
          onSustainment={onSustainment}
          onHandoff={onHandoff}
          investigationOverlay={activeStepInvestigationOverlay}
          onOpenInvestigationFocus={onOpenInvestigationFocus}
          onRemoveCausalLink={onRemoveCausalLink}
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
