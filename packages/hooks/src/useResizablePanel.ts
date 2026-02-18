import { useState, useCallback, useEffect } from 'react';

export interface UseResizablePanelReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Manages a horizontally resizable panel with localStorage persistence.
 *
 * The panel width is computed as `window.innerWidth - e.clientX` (right-side panel).
 *
 * @param storageKey - localStorage key to persist width
 * @param min - Minimum width in px
 * @param max - Maximum width in px
 * @param defaultWidth - Default width if no stored value
 */
export function useResizablePanel(
  storageKey: string,
  min: number,
  max: number,
  defaultWidth: number
): UseResizablePanelReturn {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Math.min(Math.max(parseInt(saved, 10), min), max) : defaultWidth;
  });
  const [isDragging, setIsDragging] = useState(false);

  // Persist width to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [storageKey, width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
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
  }, [isDragging, min, max]);

  return { width, isDragging, handleMouseDown };
}
