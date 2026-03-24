import React, { useState, useEffect, useCallback } from 'react';

export interface SessionClosePromptItem {
  id: string;
  text: string;
  preChecked: boolean;
}

export interface SessionClosePromptProps {
  isOpen: boolean;
  /** Items to potentially save (from pending proposals + bookmarks) */
  items: Array<SessionClosePromptItem>;
  /** Called with IDs of selected items to save as findings */
  onSave: (selectedIds: string[]) => void;
  /** Called when user dismisses without saving */
  onDismiss: () => void;
}

const MAX_TEXT_LENGTH = 80;

function truncateText(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) + '...' : text;
}

const SessionClosePrompt: React.FC<SessionClosePromptProps> = ({
  isOpen,
  items,
  onSave,
  onDismiss,
}) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Initialise checked state whenever items or isOpen changes
  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      initial[item.id] = item.preChecked;
    }
    setChecked(initial);
  }, [isOpen, items]);

  // Escape key dismisses
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  const handleToggle = useCallback((id: string): void => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSave = useCallback((): void => {
    const selectedIds = Object.entries(checked)
      .filter(([, isChecked]) => isChecked)
      .map(([id]) => id);
    onSave(selectedIds);
  }, [checked, onSave]);

  if (!isOpen) return null;

  const anyChecked = Object.values(checked).some(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Save insights before closing"
    >
      <div
        className="bg-surface-secondary border border-edge rounded-xl shadow-2xl w-full max-w-md mx-4 p-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-content mb-3">Save insights before closing?</h3>

        {items.length > 0 && (
          <ul className="space-y-2 mb-4">
            {items.map(item => (
              <li key={item.id}>
                <label className="flex items-start gap-2 text-xs text-content cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked[item.id] ?? false}
                    onChange={() => handleToggle(item.id)}
                    className="mt-0.5 accent-blue-500 shrink-0"
                  />
                  <span className="break-words">{truncateText(item.text)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between gap-2 mt-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            Close without saving
          </button>
          <button
            onClick={handleSave}
            disabled={!anyChecked}
            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Save selected
          </button>
        </div>
      </div>
    </div>
  );
};

export { SessionClosePrompt };
