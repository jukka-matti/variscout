import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { BoxplotDisplayToggleColorScheme, BoxplotDisplayToggleProps } from './types';

export const boxplotDisplayToggleDefaultColorScheme: BoxplotDisplayToggleColorScheme = {
  trigger: 'text-content-secondary hover:text-content hover:bg-surface-tertiary/50',
  popoverContainer:
    'fixed w-56 bg-surface-secondary border border-edge rounded-lg shadow-2xl z-50 animate-fade-in',
  checkbox:
    'w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary',
  checkboxLabel: 'text-sm text-content',
  description: 'text-xs text-content-muted',
};

export const boxplotDisplayToggleAzureColorScheme: BoxplotDisplayToggleColorScheme = {
  trigger: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
  popoverContainer: 'fixed w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50',
  checkbox:
    'w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900',
  checkboxLabel: 'text-sm text-slate-300',
  description: 'text-xs text-slate-500',
};

const BoxplotDisplayToggle: React.FC<BoxplotDisplayToggleProps> = ({
  showViolin,
  showContributionLabels,
  onToggleViolin,
  onToggleContributionLabels,
  colorScheme = boxplotDisplayToggleDefaultColorScheme,
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
      const popoverWidth = 224; // w-56
      const padding = 8;
      const maxLeft = window.innerWidth - popoverWidth - padding;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, maxLeft),
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded transition-colors ${cs.trigger}`}
        title="Boxplot display options"
        aria-label="Boxplot display options"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal size={14} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cs.popoverContainer}
          style={{ top: position.top, left: position.left }}
          role="dialog"
          aria-label="Boxplot display options"
        >
          <div className="p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showViolin}
                onChange={e => onToggleViolin(e.target.checked)}
                className={`mt-0.5 ${cs.checkbox}`}
              />
              <div>
                <span className={cs.checkboxLabel}>Distribution shape</span>
                <span className={`block ${cs.description}`}>Density curves on boxplots</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showContributionLabels}
                onChange={e => onToggleContributionLabels(e.target.checked)}
                className={`mt-0.5 ${cs.checkbox}`}
              />
              <div>
                <span className={cs.checkboxLabel}>Contribution labels</span>
                <span className={`block ${cs.description}`}>Impact % below categories</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxplotDisplayToggle;
