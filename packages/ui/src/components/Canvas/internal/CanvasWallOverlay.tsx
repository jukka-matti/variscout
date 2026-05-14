import React, { useCallback, useRef } from 'react';
import {
  useHasInvestigationContent,
  useCanvasViewportInput,
  useSharedWallProps,
  type CanvasOverlayId,
  type CanvasToolId,
} from '@variscout/hooks';
import type { Finding, ProcessMap, ProcessHubId } from '@variscout/core';
import { WallCanvas, useWallIsMobile } from '../../InvestigationWall';

export interface CanvasWallOverlayProps {
  hubId: ProcessHubId;
  activeOverlays: CanvasOverlayId[];
  activeCanvasTool: CanvasToolId;
  findings: Finding[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
  onOpenWall?: () => void;
}

const WALL_PAN_IGNORED_TARGET =
  'button,a,input,select,textarea,[role="button"],[data-no-overlay-pan],[data-no-wall-pan]';

function shouldHandleWallPanInput(event: Event): boolean {
  return !(event.target instanceof Element && event.target.closest(WALL_PAN_IGNORED_TARGET));
}

export function CanvasWallOverlay({
  hubId,
  activeOverlays,
  activeCanvasTool,
  findings,
  processMap,
  problemCpk,
  eventsPerWeek,
  activeColumns,
  onOpenWall,
}: CanvasWallOverlayProps) {
  const isMobile = useWallIsMobile();
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasContent = useHasInvestigationContent({ findingsCount: findings.length });
  const wallProps = useSharedWallProps({
    hubId,
    findings,
    processMap,
    problemCpk,
    eventsPerWeek,
    activeColumns,
  });
  const handleOpenWall = useCallback(() => {
    onOpenWall?.();
  }, [onOpenWall]);
  const isDrawingHypothesis = activeCanvasTool === 'draw-hypothesis';
  const shouldRender = activeOverlays.includes('wall') && !isMobile && hasContent;
  useCanvasViewportInput({
    hubId,
    ref: overlayRef,
    disabled: !shouldRender || isDrawingHypothesis,
    filter: shouldHandleWallPanInput,
  });

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      data-testid="canvas-wall-overlay"
      data-canvas-wall-overlay=""
      className={[
        'absolute inset-0 z-[15] h-full w-full overflow-hidden',
        isDrawingHypothesis ? 'pointer-events-none' : 'pointer-events-auto',
      ].join(' ')}
      aria-hidden={isDrawingHypothesis ? true : undefined}
      inert={isDrawingHypothesis ? true : undefined}
    >
      <WallCanvas
        {...wallProps}
        mode="overlay"
        onSelectHub={handleOpenWall}
        onPromoteQuestion={handleOpenWall}
        onWriteHypothesis={handleOpenWall}
        onPromoteFromQuestion={handleOpenWall}
        onSeedFromFactorIntel={handleOpenWall}
        onFocusHubFromGap={handleOpenWall}
      />
    </div>
  );
}
