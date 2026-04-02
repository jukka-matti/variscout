import React, { useState, useCallback } from 'react';
import type { FindingAssignee } from '@variscout/core';

interface AssigneeInputProps {
  selected: FindingAssignee | null;
  onSelect: (assignee: FindingAssignee) => void;
  onClear: () => void;
  placeholder?: string;
}

/**
 * Simple text-based assignee input.
 * Replaces the Graph API-powered PeoplePicker (removed per ADR-059).
 */
export const AssigneeInput: React.FC<AssigneeInputProps> = ({
  selected,
  onSelect,
  onClear,
  placeholder = 'Enter name...',
}) => {
  const [name, setName] = useState(selected?.displayName ?? '');

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onSelect({ upn: trimmed, displayName: trimmed });
    }
  }, [name, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClear();
      }
    },
    [handleSubmit, onClear]
  );

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-edge bg-surface px-2 py-1 text-sm text-content placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-blue-500"
        data-testid="assignee-input"
        autoFocus
      />
      <button
        onClick={onClear}
        className="text-xs text-content-muted hover:text-content"
        aria-label="Cancel"
      >
        ✕
      </button>
    </div>
  );
};
