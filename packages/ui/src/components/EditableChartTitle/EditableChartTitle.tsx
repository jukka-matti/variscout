import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface EditableChartTitleProps {
  /** Auto-generated default title (shown when custom is empty) */
  defaultTitle: string;
  /** Current custom title (empty uses default) */
  value?: string;
  /** Called when user saves a new title */
  onChange: (newTitle: string) => void;
  /** Optional className for the container */
  className?: string;
}

/**
 * Click-to-edit chart title component.
 *
 * UX Pattern:
 * - Shows subtle dashed underline on hover
 * - Click enters edit mode with text pre-selected
 * - Enter saves, Escape cancels
 * - Empty input reverts to auto-generated default
 */
const EditableChartTitle = ({
  defaultTitle,
  value = '',
  onChange,
  className = '',
}: EditableChartTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || defaultTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display value: custom title or fall back to default
  const displayValue = value || defaultTitle;

  // When entering edit mode, select all text
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || defaultTitle);
    }
  }, [value, defaultTitle, isEditing]);

  const handleClick = useCallback(() => {
    setEditValue(value || defaultTitle);
    setIsEditing(true);
  }, [value, defaultTitle]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    // Empty or same as default = clear custom title
    if (trimmed === '' || trimmed === defaultTitle) {
      onChange('');
    } else {
      onChange(trimmed);
    }
    setIsEditing(false);
  }, [editValue, defaultTitle, onChange]);

  const handleCancel = useCallback(() => {
    setEditValue(value || defaultTitle);
    setIsEditing(false);
  }, [value, defaultTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  if (isEditing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="bg-surface border border-blue-500 rounded px-2 py-1 text-white outline-none min-w-[200px] text-sm font-semibold"
          autoFocus
        />
        <span className="text-xs text-content-muted">Enter to save • Esc to cancel</span>
      </div>
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`
        cursor-text
        border-b border-dashed border-transparent
        hover:border-content-muted
        transition-colors duration-150
        ${className}
      `}
      title="Click to edit title"
    >
      {displayValue}
    </span>
  );
};

export default EditableChartTitle;
