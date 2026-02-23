import React, { useState, useEffect, useRef } from 'react';
import { Download, ImageDown, FileDown } from 'lucide-react';
import type { ChartDownloadMenuColorScheme, ChartDownloadMenuProps } from './types';

export const chartDownloadMenuDefaultColorScheme: ChartDownloadMenuColorScheme = {
  trigger: 'text-content-muted hover:text-white hover:bg-surface-tertiary',
  triggerActive: 'bg-green-500/20 text-green-400',
  popoverContainer:
    'fixed w-44 bg-surface-secondary border border-edge rounded-lg shadow-2xl z-50 animate-fade-in',
  menuItem:
    'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-content-secondary hover:text-content hover:bg-surface-tertiary/50 transition-colors',
  menuItemIcon: 'shrink-0',
  menuItemLabel: '',
};

export const chartDownloadMenuAzureColorScheme: ChartDownloadMenuColorScheme = {
  trigger: 'text-slate-500 hover:text-white hover:bg-slate-700',
  triggerActive: 'bg-green-500/20 text-green-400',
  popoverContainer:
    'fixed w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 animate-fade-in',
  menuItem:
    'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors',
  menuItemIcon: 'shrink-0',
  menuItemLabel: '',
};

const ChartDownloadMenu: React.FC<ChartDownloadMenuProps> = ({
  containerId,
  chartName,
  onDownloadPng,
  onDownloadSvg,
  colorScheme = chartDownloadMenuDefaultColorScheme,
}) => {
  const cs = colorScheme;
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        popoverRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Calculate position based on button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 176; // w-44
      const padding = 8;
      const maxLeft = window.innerWidth - popoverWidth - padding;
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, maxLeft),
      });
    }
  }, [isOpen]);

  const handleAction = (action: () => void | Promise<void>) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" data-export-hide>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded transition-all ${cs.trigger}`}
        title="Download chart"
        aria-label="Download chart"
        aria-expanded={isOpen}
      >
        <Download size={14} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cs.popoverContainer}
          style={{ top: position.top, left: position.left }}
          role="menu"
          aria-label="Chart download options"
        >
          <div className="py-1">
            <button
              className={cs.menuItem}
              role="menuitem"
              onClick={() => handleAction(() => onDownloadPng(containerId, chartName))}
            >
              <ImageDown size={14} className={cs.menuItemIcon} />
              <span className={cs.menuItemLabel}>Download PNG</span>
            </button>
            <button
              className={cs.menuItem}
              role="menuitem"
              onClick={() => handleAction(() => onDownloadSvg(containerId, chartName))}
            >
              <FileDown size={14} className={cs.menuItemIcon} />
              <span className={cs.menuItemLabel}>Download SVG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartDownloadMenu;
