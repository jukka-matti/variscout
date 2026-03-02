import React, { useEffect, useRef } from 'react';
import type { HighlightColor } from '../ChartAnnotationLayer/types';

export interface AnnotationContextMenuProps {
  /** Category key that was right-clicked */
  categoryKey: string;
  /** Current highlight color (or undefined if none) */
  currentHighlight?: HighlightColor;
  /** Whether a finding already exists for this category */
  hasFinding: boolean;
  /** Screen position for the menu */
  position: { x: number; y: number };
  /** Callbacks */
  onSetHighlight: (color: HighlightColor | undefined) => void;
  onAddObservation: () => void;
  onClose: () => void;
}

const highlightOptions: { color: HighlightColor; label: string; dot: string }[] = [
  { color: 'red', label: 'Red highlight', dot: '#ef4444' },
  { color: 'amber', label: 'Amber highlight', dot: '#f59e0b' },
  { color: 'green', label: 'Green highlight', dot: '#22c55e' },
];

/**
 * AnnotationContextMenu - Right-click context menu for chart annotations
 *
 * Appears at click position. Options: set highlight color, clear highlight, add observation.
 * Closes on click-outside or Escape.
 */
export const AnnotationContextMenu: React.FC<AnnotationContextMenuProps> = ({
  currentHighlight,
  hasFinding,
  position,
  onSetHighlight,
  onAddObservation,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid closing on the same click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      data-testid="annotation-context-menu"
      role="menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
      }}
      className="min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl shadow-black/40 py-1 text-sm"
    >
      {/* Highlight color options */}
      {highlightOptions.map(({ color, label, dot }) => (
        <button
          key={color}
          role="menuitem"
          onClick={() => {
            onSetHighlight(color);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: dot,
              border: currentHighlight === color ? '2px solid white' : 'none',
            }}
          />
          {label}
          {currentHighlight === color && (
            <span className="ml-auto text-xs text-slate-400">active</span>
          )}
        </button>
      ))}

      {/* Clear highlight */}
      <button
        role="menuitem"
        onClick={() => {
          onSetHighlight(undefined);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-slate-700 transition-colors"
      >
        <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-slate-500" />
        Clear highlight
      </button>

      {/* Divider */}
      <div className="my-1 border-t border-slate-700" />

      {/* Add observation */}
      {!hasFinding && (
        <button
          role="menuitem"
          onClick={() => {
            onAddObservation();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <span className="text-slate-400">+</span>
          Add observation
        </button>
      )}
    </div>
  );
};

export default AnnotationContextMenu;
