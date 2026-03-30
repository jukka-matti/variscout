import React, { useState, useCallback } from 'react';

export interface ProcessDescriptionFieldProps {
  /** Current value */
  value: string;
  /** Callback on blur (auto-save) */
  onChange: (value: string) => void;
  /** Maximum character count (default: 500) */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Textarea for entering process description (AI context grounding).
 * Auto-saves on blur with character counter.
 */
const ProcessDescriptionField: React.FC<ProcessDescriptionFieldProps> = ({
  value,
  onChange,
  maxLength = 500,
  placeholder = 'Describe your process (e.g., "Fill weight measurement on high-speed packaging line, 12 fill heads, targeting 500g \u00b1 5g")',
}) => {
  const [draft, setDraft] = useState(value);

  const handleBlur = useCallback(() => {
    if (draft !== value) {
      onChange(draft);
    }
  }, [draft, value, onChange]);

  return (
    <div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value.slice(0, maxLength))}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={4}
        className="w-full text-xs bg-surface-tertiary/50 border border-edge rounded-lg px-3 py-2 text-content placeholder:text-content-muted resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
        data-testid="process-description"
      />
      <div className="flex justify-end mt-1">
        <span
          className={`text-[0.625rem] ${draft.length >= maxLength ? 'text-amber-400' : 'text-content-muted'}`}
        >
          {draft.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default ProcessDescriptionField;
