import type { CanvasViewportSnapshot } from '@variscout/stores';

export interface Point {
  x: number;
  y: number;
}

export function clientToWorld(p: Point, viewport: CanvasViewportSnapshot): Point {
  return {
    x: (p.x - viewport.pan.x) / viewport.zoom,
    y: (p.y - viewport.pan.y) / viewport.zoom,
  };
}

export function worldToCanvasDom(p: Point, viewport: CanvasViewportSnapshot): Point {
  return {
    x: p.x * viewport.zoom + viewport.pan.x,
    y: p.y * viewport.zoom + viewport.pan.y,
  };
}

export function worldToWallSvg(p: Point, _viewport: CanvasViewportSnapshot): Point {
  return p;
}
