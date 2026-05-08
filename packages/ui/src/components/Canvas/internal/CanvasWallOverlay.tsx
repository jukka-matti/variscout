import React, { useCallback } from 'react';
import { WallCanvas, useWallIsMobile } from '@variscout/charts';
import {
  useHasInvestigationContent,
  useSharedWallProps,
  type CanvasOverlayId,
  type CanvasToolId,
} from '@variscout/hooks';
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

  if (!activeOverlays.includes('wall') || isMobile || !hasContent) {
    return null;
  }

  const isDrawingHypothesis = activeCanvasTool === 'draw-hypothesis';

  return (
    <div
      data-testid="canvas-wall-overlay"
      className={[
        'absolute inset-0 z-30 h-full w-full overflow-hidden',
        isDrawingHypothesis ? 'pointer-events-none' : 'pointer-events-auto',
      ].join(' ')}
      aria-hidden={isDrawingHypothesis ? true : undefined}
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
