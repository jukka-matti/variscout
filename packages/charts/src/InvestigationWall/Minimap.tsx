/**
 * Minimap — floating bird's-eye view of the Investigation Wall.
 *
 * Renders hub/question dots in a 160×100 SVG at the bottom-right of the Wall
 * and draws a translucent rectangle showing where the current viewport sits
 * inside the full canvas. Clicking the minimap calls `onPanTo(x, y)` with
 * canvas-space coordinates so consumers can re-center the viewport.
 *
 * Coordinate math: the minimap treats itself as a direct linear scale of
 * CANVAS_W × CANVAS_H → MINIMAP_W × MINIMAP_H. A click at (mx, my) within
 * the minimap bounds maps to (mx / MINIMAP_W * CANVAS_W, my / MINIMAP_H *
 * CANVAS_H) in canvas space. Callers decide whether that value centers the
 * viewport or translates it directly.
 */

import React from 'react';
import type { SuspectedCause, Question } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { chartColors } from '../colors';
import { CANVAS_W, CANVAS_H } from './WallCanvas';
import { getDocumentLocale } from './hooks/useWallLocale';

/** Minimap SVG dimensions in pixels (also the CSS size). */
const MINIMAP_W = 160;
const MINIMAP_H = 100;

/** Match the layout constants inside WallCanvas so dot positions align. */
const HUB_Y = 400;
const QUESTION_Y = 900;

export interface MinimapProps {
  hubs: SuspectedCause[];
  questions: Question[];
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
}

export const Minimap: React.FC<MinimapProps> = ({ hubs, questions, zoom, pan, onPanTo }) => {
  const locale = getDocumentLocale();

  // Positions mirror WallCanvas hub/question placement math (hubs on row 400,
  // questions on row 900). Done here rather than threading positions through
  // props because the Minimap only needs dots, not the full card layout.
  const hubSpacing = CANVAS_W / (hubs.length + 1);
  const hubDots = hubs.map((hub, idx) => ({
    id: hub.id,
    kind: 'hub' as const,
    cx: ((hubSpacing * (idx + 1)) / CANVAS_W) * MINIMAP_W,
    cy: (HUB_Y / CANVAS_H) * MINIMAP_H,
  }));
  const questionDots = questions.map((q, idx) => ({
    id: q.id,
    kind: 'question' as const,
    cx: ((200 + idx * 240) / CANVAS_W) * MINIMAP_W,
    cy: (QUESTION_Y / CANVAS_H) * MINIMAP_H,
  }));

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

      {/* Hub + question dots. */}
      {[...hubDots, ...questionDots].map(d => (
        <circle
          key={`${d.kind}:${d.id}`}
          data-minimap-node={d.kind}
          cx={d.cx}
          cy={d.cy}
          r={d.kind === 'hub' ? 3 : 2}
          fill={d.kind === 'hub' ? chartColors.mean : chartColors.control}
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
