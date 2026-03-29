import React, { useState, useRef, useEffect } from 'react';
import { FINDING_TAGS, FINDING_TAG_LABELS, type FindingTag } from '@variscout/core';

export interface FindingTagBadgeProps {
  tag: FindingTag | undefined;
  /** If provided, badge is clickable with dropdown to set/change tag */
  onTagChange?: (tag: FindingTag | null) => void;
}

const TAG_STYLES: Record<FindingTag, string> = {
  'key-driver': 'bg-green-500/20 text-green-400',
  'low-impact': 'bg-slate-500/20 text-slate-400',
};

const TAG_DOT_COLORS: Record<FindingTag, string> = {
  'key-driver': 'bg-green-400',
  'low-impact': 'bg-slate-400',
};

/**
 * Small pill showing a finding's classification tag (Key Driver / Low Impact).
 * Clickable to set or change the tag via dropdown.
 */
const FindingTagBadge: React.FC<FindingTagBadgeProps> = ({ tag, onTagChange }) => {
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
    if (onTagChange) {
      setIsOpen(prev => !prev);
    }
  };

  const handleSelect = (newTag: FindingTag | null) => {
    onTagChange?.(newTag);
    setIsOpen(false);
  };

  if (!tag && !onTagChange) return null;

  const baseStyle = tag ? TAG_STYLES[tag] : 'bg-purple-500/10 text-purple-300';
  const label = tag ? FINDING_TAG_LABELS[tag] : 'Classify';

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-medium transition-colors ${baseStyle} ${
          onTagChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
        title={onTagChange ? 'Set classification' : label}
        aria-label={`Tag: ${label}`}
      >
        {label}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[140px]">
          {FINDING_TAGS.map(t => (
            <button
              key={t}
              onClick={e => {
                e.stopPropagation();
                handleSelect(t === tag ? null : t);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                t === tag
                  ? 'bg-surface-tertiary text-content font-medium'
                  : 'text-content-secondary hover:bg-surface-tertiary hover:text-content'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${TAG_DOT_COLORS[t]}`} />
              {FINDING_TAG_LABELS[t]}
              {t === tag && (
                <span className="ml-auto text-[0.625rem] text-content-muted">(clear)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { TAG_STYLES, TAG_DOT_COLORS };
export default FindingTagBadge;
