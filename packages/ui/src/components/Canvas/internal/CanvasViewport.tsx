import type { ReactNode } from 'react';

export interface CanvasViewportProps {
  zoom: number;
  pan: { x: number; y: number };
  children: ReactNode;
}

export function CanvasViewport({ zoom, pan, children }: CanvasViewportProps) {
  return (
    <div
      data-canvas-viewport-wrapper
      style={{
        touchAction: 'none',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        data-canvas-viewport-inner
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
