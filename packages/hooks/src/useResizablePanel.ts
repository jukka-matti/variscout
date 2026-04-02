import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface UseResizablePanelReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Manages a horizontally resizable panel with localStorage persistence.
 *
 * @param storageKey - localStorage key to persist width
 * @param min - Minimum width in px
 * @param max - Maximum width in px
 * @param defaultWidth - Default width if no stored value
 * @param side - Which side of the viewport the panel is on ('right' default, 'left')
 */
export function useResizablePanel(
  storageKey: string,
  min: number,
  max: number,
  defaultWidth: number,
  side: 'left' | 'right' = 'right'
): UseResizablePanelReturn {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Math.min(Math.max(parseInt(saved, 10), min), max) : defaultWidth;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerOffsetRef = useRef(0);

  // Persist width to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [storageKey, width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
      if (side === 'left') {
        containerOffsetRef.current = parentRect?.left ?? 0;
      } else {
        containerOffsetRef.current = parentRect ? window.innerWidth - parentRect.right : 0;
      }
      setIsDragging(true);
    },
    [side]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth =
        side === 'left'
          ? e.clientX - containerOffsetRef.current
          : window.innerWidth - e.clientX - containerOffsetRef.current;
      setWidth(Math.min(Math.max(newWidth, min), max));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, side]);

  return { width, isDragging, handleMouseDown };
}
