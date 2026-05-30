/**
 * Minimap — floating bird's-eye view of the Investigation Wall.
 *
 * Renders hub dots in a 160×100 SVG at the bottom-right of the Wall and draws
 * a translucent rectangle showing where the current viewport sits inside the
 * full canvas. Clicking the minimap calls `onPanTo(x, y)` with canvas-space
 * coordinates so consumers can re-center the viewport.
 *
 * Coordinate math: the minimap treats itself as a direct linear scale of
 * CANVAS_W × CANVAS_H → MINIMAP_W × MINIMAP_H. A click at (mx, my) within
 * the minimap bounds maps to (mx / MINIMAP_W * CANVAS_W, my / MINIMAP_H *
 * CANVAS_H) in canvas space. Callers decide whether that value centers the
 * viewport or translates it directly.
 */

import React, { useMemo } from 'react';
import type { Hypothesis, ProcessMap } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { chartColors } from '@variscout/charts';
import { CANVAS_W, CANVAS_H } from './WallCanvas';
import { computeWallLayout, buildWallLayoutArgs } from './wallLayout';
import { useWallLocale } from './hooks/useWallLocale';

/** Minimap SVG dimensions in pixels (also the CSS size). */
const MINIMAP_W = 160;
const MINIMAP_H = 100;

export interface MinimapProps {
  hubs: Hypothesis[];
  /** Current viewport zoom. */
  zoom: number;
  /**
   * Current viewport pan offset in screen-space pixels. Matches the transform
   * applied by WallCanvas: `translate(pan.x, pan.y) scale(zoom)` — the translate
   * happens in the parent's coordinate system before the scale, so to convert
   * back to canvas space divide by `zoom` (see vpX/vpY math below).
   */
  pan: { x: number; y: number };
  /**
   * Invoked on minimap click with x/y coordinates in canvas space. Consumers
   * typically map these to `setPan({ x: CANVAS_W/2 - x, y: CANVAS_H/2 - y })`
   * to center the viewport on the clicked point.
   */
  onPanTo: (x: number, y: number) => void;
  /**
   * IM-4c — process map + tributary toggle. When `groupByTributary` is on AND a
   * processMap is supplied, the Minimap dots follow the SAME tributary bands
   * WallCanvas draws (via the shared `computeWallLayout` authority) instead of
   * the old linear-row duplicate. Omit for the default linear layout.
   */
  processMap?: ProcessMap;
  groupByTributary?: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({
  hubs,
  zoom,
  pan,
  onPanTo,
  processMap,
  groupByTributary,
}) => {
  const locale = useWallLocale();

  // Dot positions come from the SAME position authority WallCanvas renders from
  // (computeWallLayout) — no recomputation, so the minimap can never drift from
  // the cards, including under tributary grouping.
  const hubDots = useMemo(() => {
    const layout = computeWallLayout(
      buildWallLayoutArgs({
        hubs,
        processMap,
        groupByTributary,
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
      })
    );
    return hubs
      .map(hub => {
        const pos = layout.hubPositions.get(hub.id);
        if (!pos) return null;
        return {
          id: hub.id,
          kind: 'hub' as const,
          cx: (pos.x / CANVAS_W) * MINIMAP_W,
          cy: (pos.y / CANVAS_H) * MINIMAP_H,
        };
      })
      .filter((d): d is { id: string; kind: 'hub'; cx: number; cy: number } => d !== null);
  }, [hubs, processMap, groupByTributary]);

  // Viewport rectangle. The main canvas is CANVAS_W × CANVAS_H. With a zoom
  // factor z, the visible window in canvas-space is (CANVAS_W/z × CANVAS_H/z)
  // starting at (-pan.x/z, -pan.y/z). Scale that to minimap units.
  const vpW = MINIMAP_W / zoom;
  const vpH = MINIMAP_H / zoom;
  const vpX = (-pan.x / zoom / CANVAS_W) * MINIMAP_W;
  const vpY = (-pan.y / zoom / CANVAS_H) * MINIMAP_H;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Convert minimap-space → canvas-space via linear scale.
    const x = (mx / MINIMAP_W) * CANVAS_W;
    const y = (my / MINIMAP_H) * CANVAS_H;
    onPanTo(x, y);
  };

  return (
    <svg
      data-testid="wall-minimap"
      width={MINIMAP_W}
      height={MINIMAP_H}
      viewBox={`0 0 ${MINIMAP_W} ${MINIMAP_H}`}
      role="img"
      aria-label={getMessage(locale, 'wall.minimap.ariaLabel')}
      className="absolute bottom-4 right-4 bg-surface border border-edge rounded shadow-sm cursor-pointer"
      onClick={handleClick}
    >
      {/* Background — distinct fill so dots show up against the surface. */}
      <rect x={0} y={0} width={MINIMAP_W} height={MINIMAP_H} className="fill-surface-secondary" />

      {/* Hub dots. */}
      {hubDots.map(d => (
        <circle
          key={`${d.kind}:${d.id}`}
          data-minimap-node={d.kind}
          data-minimap-node-id={d.id}
          cx={d.cx}
          cy={d.cy}
          r={3}
          fill={chartColors.mean}
          opacity={0.7}
        />
      ))}

      {/* Viewport rectangle — translucent, shows what's currently visible. */}
      <rect
        data-minimap-viewport
        x={vpX}
        y={vpY}
        width={vpW}
        height={vpH}
        fill="transparent"
        stroke={chartColors.warning}
        strokeWidth={1.5}
        pointerEvents="none"
      />
    </svg>
  );
};
