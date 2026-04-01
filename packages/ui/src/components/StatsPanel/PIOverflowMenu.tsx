import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import type { PIOverflowView } from './types';

export interface PIOverflowMenuProps {
  activeOverflow: PIOverflowView;
  onSelect: (view: PIOverflowView) => void;
}

const LABEL: Record<NonNullable<PIOverflowView>, string> = {
  data: 'Data Table',
  whatif: 'What-If',
};

const PIOverflowMenu: React.FC<PIOverflowMenuProps> = ({ activeOverflow, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // When an overflow is active, show the active label with a close (×) button
  if (activeOverflow !== null) {
    return (
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-surface-tertiary text-content border border-edge/60 hover:bg-surface hover:text-content-secondary transition-colors"
        aria-label={`Close ${LABEL[activeOverflow]}`}
      >
        <span>{LABEL[activeOverflow]}</span>
        <X size={10} />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative ml-auto flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-surface border border-edge rounded-lg shadow-lg py-1"
        >
          <button
            role="menuitem"
            type="button"
            className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors"
            onClick={() => {
              onSelect('data');
              setOpen(false);
            }}
          >
            {LABEL['data']}
          </button>
          <button
            role="menuitem"
            type="button"
            className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors"
            onClick={() => {
              onSelect('whatif');
              setOpen(false);
            }}
          >
            {LABEL['whatif']}
          </button>
        </div>
      )}
    </div>
  );
};

export default PIOverflowMenu;
