import { useState, useRef } from 'react';
import type React from 'react';

export interface UseIChartBrushArgs {
  valuesLength: number;
  width: number;
  onCommit?: (range: { startIdx: number; endIdx: number }) => void;
}

export interface UseIChartBrushReturn {
  /** Spread onto the <svg> root (or a transparent overlay rect over it). */
  handlers: {
    onPointerDown: (e: React.PointerEvent<SVGElement>) => void;
    onPointerMove: (e: React.PointerEvent<SVGElement>) => void;
    onPointerUp: (e: React.PointerEvent<SVGElement>) => void;
    onPointerCancel: (e: React.PointerEvent<SVGElement>) => void;
  };
  /** In-flight brush range while pointer is down; null otherwise. */
  currentBrush: { startIdx: number; endIdx: number } | null;
}

function pixelToIdx(pixelX: number, width: number, valuesLength: number): number {
  if (valuesLength <= 1) return 0;
  const raw = Math.round((pixelX / width) * (valuesLength - 1));
  return Math.max(0, Math.min(valuesLength - 1, raw));
}

export function useIChartBrush(args: UseIChartBrushArgs): UseIChartBrushReturn {
  const { valuesLength, width, onCommit } = args;
  const [currentBrush, setCurrentBrush] = useState<{ startIdx: number; endIdx: number } | null>(
    null
  );
  const startIdxRef = useRef<number | null>(null);

  const handlers: UseIChartBrushReturn['handlers'] = {
    onPointerDown(e) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      const pixelX = e.clientX - rect.left;
      const idx = pixelToIdx(pixelX, width, valuesLength);
      startIdxRef.current = idx;
      setCurrentBrush({ startIdx: idx, endIdx: idx });
    },
    onPointerMove(e) {
      if (startIdxRef.current === null) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pixelX = e.clientX - rect.left;
      const idx = pixelToIdx(pixelX, width, valuesLength);
      const start = startIdxRef.current;
      setCurrentBrush({
        startIdx: Math.min(start, idx),
        endIdx: Math.max(start, idx),
      });
    },
    onPointerUp(e) {
      if (startIdxRef.current === null) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pixelX = e.clientX - rect.left;
      const idx = pixelToIdx(pixelX, width, valuesLength);
      const start = startIdxRef.current;
      const startIdx = Math.min(start, idx);
      const endIdx = Math.max(start, idx);
      startIdxRef.current = null;
      setCurrentBrush(null);
      // Drop zero-width drags (click, not a meaningful range)
      if (startIdx !== endIdx) {
        onCommit?.({ startIdx, endIdx });
      }
    },
    onPointerCancel() {
      startIdxRef.current = null;
      setCurrentBrush(null);
    },
  };

  return { handlers, currentBrush };
}
