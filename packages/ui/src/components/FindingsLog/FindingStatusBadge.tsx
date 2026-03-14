import React, { useState, useRef, useEffect } from 'react';
import { FINDING_STATUSES, FINDING_STATUS_LABELS, type FindingStatus } from '@variscout/core';

export interface FindingStatusBadgeProps {
  status: FindingStatus;
  /** If provided, badge is clickable with dropdown to change status */
  onStatusChange?: (status: FindingStatus) => void;
  /** Maximum number of statuses to show in the dropdown. Default: show all. */
  maxStatuses?: number;
}

const STATUS_STYLES: Record<FindingStatus, string> = {
  observed: 'bg-amber-500/20 text-amber-400',
  investigating: 'bg-blue-500/20 text-blue-400',
  analyzed: 'bg-purple-500/20 text-purple-400',
  improving: 'bg-cyan-500/20 text-cyan-400',
  resolved: 'bg-green-500/20 text-green-400',
};

const STATUS_DOT_COLORS: Record<FindingStatus, string> = {
  observed: 'bg-amber-400',
  investigating: 'bg-blue-400',
  analyzed: 'bg-purple-400',
  improving: 'bg-cyan-400',
  resolved: 'bg-green-400',
};

/**
 * Colored status pill with optional dropdown to change status.
 * Uses same popover pattern as BoxplotDisplayToggle.
 */
const FindingStatusBadge: React.FC<FindingStatusBadgeProps> = ({
  status,
  onStatusChange,
  maxStatuses,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      setIsOpen(prev => !prev);
    }
  };

  const handleSelect = (newStatus: FindingStatus) => {
    onStatusChange?.(newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${STATUS_STYLES[status]} ${
          onStatusChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
        title={onStatusChange ? 'Change status' : FINDING_STATUS_LABELS[status]}
        aria-label={`Status: ${FINDING_STATUS_LABELS[status]}`}
      >
        {FINDING_STATUS_LABELS[status]}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[140px]">
          {(maxStatuses ? FINDING_STATUSES.slice(0, maxStatuses) : FINDING_STATUSES).map(s => (
            <button
              key={s}
              onClick={e => {
                e.stopPropagation();
                handleSelect(s);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                s === status
                  ? 'bg-surface-tertiary text-content font-medium'
                  : 'text-content-secondary hover:bg-surface-tertiary hover:text-content'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`} />
              {FINDING_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { STATUS_STYLES, STATUS_DOT_COLORS };
export default FindingStatusBadge;
