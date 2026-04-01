/**
 * SubgroupConfig - Popover for configuring subgroup formation method.
 *
 * Radio: "By column" / "Fixed size"
 * "By column" → dropdown of available columns
 * "Fixed size" → number input (default 5, min 2, max 100)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@variscout/hooks';
import type { SubgroupConfig as SubgroupConfigType } from '@variscout/core';

export interface SubgroupConfigProps {
  /** Current subgroup configuration */
  config: SubgroupConfigType;
  /** Callback when configuration changes */
  onConfigChange: (config: SubgroupConfigType) => void;
  /** Available factor columns for "By column" mode */
  availableColumns: string[];
  /** Column display aliases */
  columnAliases?: Record<string, string>;
}

export const SubgroupConfigPopover: React.FC<SubgroupConfigProps> = ({
  config,
  onConfigChange,
  availableColumns,
  columnAliases,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-surface-secondary text-content-secondary hover:text-content transition-colors"
        title="Subgroup configuration"
        aria-label="Configure subgroups"
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface-primary border border-edge rounded-lg shadow-lg p-3 w-56">
          <div className="text-xs font-medium text-content mb-2">{t('subgroup.method')}</div>

          {/* Fixed-size radio */}
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="radio"
              name="sg-method"
              checked={config.method === 'fixed-size'}
              onChange={() => onConfigChange({ method: 'fixed-size', size: config.size ?? 5 })}
              className="w-4 h-4 border-edge-secondary bg-surface-secondary text-blue-500 accent-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
            />
            <span className="text-xs text-content">{t('subgroup.fixedSize')}</span>
          </label>

          {config.method === 'fixed-size' && (
            <div className="ml-6 mt-1 mb-2">
              <label className="text-xs text-content-secondary">
                n ={' '}
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={config.size ?? 5}
                  onChange={e => {
                    const n = Math.max(2, Math.min(100, parseInt(e.target.value) || 5));
                    onConfigChange({ method: 'fixed-size', size: n });
                  }}
                  className="w-14 ml-1 px-1 py-0.5 text-xs bg-surface-secondary border border-edge rounded text-content"
                />
              </label>
            </div>
          )}

          {/* Column-based radio */}
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="radio"
              name="sg-method"
              checked={config.method === 'column'}
              onChange={() =>
                onConfigChange({
                  method: 'column',
                  column: config.column ?? availableColumns[0],
                })
              }
              disabled={availableColumns.length === 0}
              className="w-4 h-4 border-edge-secondary bg-surface-secondary text-blue-500 accent-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
            />
            <span
              className={`text-xs ${availableColumns.length === 0 ? 'text-content-secondary opacity-50' : 'text-content'}`}
            >
              {t('subgroup.byColumn')}
            </span>
          </label>

          {config.method === 'column' && availableColumns.length > 0 && (
            <div className="ml-6 mt-1">
              <select
                value={config.column ?? availableColumns[0]}
                onChange={e => onConfigChange({ method: 'column', column: e.target.value })}
                className="w-full px-1 py-0.5 text-xs bg-surface-secondary border border-edge rounded text-content"
              >
                {availableColumns.map(col => (
                  <option key={col} value={col}>
                    {columnAliases?.[col] ?? col}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
