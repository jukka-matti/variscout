import React, { useCallback, useRef } from 'react';
import { WallCanvas, useWallIsMobile } from '@variscout/charts';
import {
  useHasInvestigationContent,
  useSharedWallProps,
  type CanvasOverlayId,
  type CanvasToolId,
} from '@variscout/hooks';
import { useWallLayoutStore } from '@variscout/stores';
import type { Finding, ProcessMap } from '@variscout/core';

export interface CanvasWallOverlayProps {
  activeOverlays: CanvasOverlayId[];
  activeCanvasTool: CanvasToolId;
  findings: Finding[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
  onOpenWall?: () => void;
}

const PAN_IGNORED_TARGET = 'button,a,input,select,textarea,[role="button"],[data-no-overlay-pan]';

export function CanvasWallOverlay({
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
  const setPan = useWallLayoutStore(s => s.setPan);
  const panDragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const hasContent = useHasInvestigationContent({ findingsCount: findings.length });
  const wallProps = useSharedWallProps({
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
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDrawingHypothesis || event.button !== 0) {
        return;
      }

      if (event.target instanceof Element && event.target.closest(PAN_IGNORED_TARGET) !== null) {
        return;
      }

      panDragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [isDrawingHypothesis]
  );
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = panDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || isDrawingHypothesis) {
        return;
      }

      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (dx === 0 && dy === 0) {
        return;
      }

      const pan = useWallLayoutStore.getState().pan;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      panDragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    },
    [isDrawingHypothesis, setPan]
  );
  const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (panDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  if (!activeOverlays.includes('wall') || isMobile || !hasContent) {
    return null;
  }

  return (
    <div
      data-testid="canvas-wall-overlay"
      className={[
        'absolute inset-0 z-[15] h-full w-full overflow-hidden',
        isDrawingHypothesis ? 'pointer-events-none' : 'pointer-events-auto',
      ].join(' ')}
      aria-hidden={isDrawingHypothesis ? true : undefined}
      inert={isDrawingHypothesis ? true : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
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
