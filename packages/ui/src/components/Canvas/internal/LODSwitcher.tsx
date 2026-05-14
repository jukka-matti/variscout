import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CanvasLevel } from '@variscout/core/canvas';

export interface LODSwitcherProps {
  currentLevel: CanvasLevel;
  l1: ReactNode;
  l2: ReactNode;
  l3: ReactNode;
}

const CROSS_FADE_DURATION_MS = 150;

function getNode(level: CanvasLevel, l1: ReactNode, l2: ReactNode, l3: ReactNode): ReactNode {
  if (level === 'l1') return l1;
  if (level === 'l3') return l3;
  return l2;
}

interface TransitionState {
  incoming: CanvasLevel;
  outgoing: CanvasLevel | null;
}

/**
 * LODSwitcher — renders the active LOD level with a 150ms cross-fade when the
 * level changes. During the transition both outgoing and incoming renderers are
 * mounted in stacked absolute-positioned divs so neither snaps jarringly.
 * After the transition completes the outgoing renderer is unmounted.
 */
export function LODSwitcher({ currentLevel, l1, l2, l3 }: LODSwitcherProps) {
  const [transition, setTransition] = useState<TransitionState>({
    incoming: currentLevel,
    outgoing: null,
  });

  // Track the previous level to detect changes without triggering cross-fade on first render.
  const prevLevelRef = useRef<CanvasLevel>(currentLevel);

  useEffect(() => {
    const prev = prevLevelRef.current;
    if (prev === currentLevel) return;

    prevLevelRef.current = currentLevel;

    // Start cross-fade: both outgoing and incoming are rendered.
    setTransition({ incoming: currentLevel, outgoing: prev });

    const timer = setTimeout(() => {
      // After duration: unmount the outgoing renderer.
      setTransition({ incoming: currentLevel, outgoing: null });
    }, CROSS_FADE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentLevel]);

  const incomingNode = getNode(transition.incoming, l1, l2, l3);

  if (transition.outgoing === null) {
    // Stable state: single renderer, no overlay.
    return (
      <div
        data-lod-wrapper
        style={{
          opacity: 1,
          transitionProperty: 'opacity',
          transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
          transitionTimingFunction: 'ease-in-out',
        }}
      >
        {incomingNode}
      </div>
    );
  }

  // Transition in progress: outgoing fades out, incoming fades in.
  const outgoingNode = getNode(transition.outgoing, l1, l2, l3);

  return (
    <div data-lod-wrapper style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* outgoing: fades from 1 → 0 */}
      <div
        data-lod-outgoing
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transitionProperty: 'opacity',
          transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
          transitionTimingFunction: 'ease-in-out',
        }}
      >
        {outgoingNode}
      </div>
      {/* incoming: fades from 0 → 1 */}
      <div
        data-lod-incoming
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1,
          transitionProperty: 'opacity',
          transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
          transitionTimingFunction: 'ease-in-out',
        }}
      >
        {incomingNode}
      </div>
    </div>
  );
}
