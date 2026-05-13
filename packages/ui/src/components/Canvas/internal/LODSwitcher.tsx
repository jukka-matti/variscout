import type { ReactNode } from 'react';
import type { CanvasLevel } from '@variscout/core/canvas';

export interface LODSwitcherProps {
  currentLevel: CanvasLevel;
  l1: ReactNode;
  l2: ReactNode;
  l3: ReactNode;
}

export function LODSwitcher({ currentLevel, l1, l2, l3 }: LODSwitcherProps) {
  const activeView = currentLevel === 'l1' ? l1 : currentLevel === 'l3' ? l3 : l2;

  return (
    <div
      data-lod-wrapper
      style={{
        opacity: 1,
        transitionProperty: 'opacity',
        transitionDuration: '150ms',
        transitionTimingFunction: 'ease-in-out',
      }}
    >
      {activeView}
    </div>
  );
}
