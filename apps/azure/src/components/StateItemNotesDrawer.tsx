import React from 'react';
import { PROCESS_STATE_NOTE_KINDS, type ProcessStateNoteKind } from '@variscout/core';

const KIND_LABELS: Record<ProcessStateNoteKind, string> = {
  question: 'Question',
  gemba: 'Gemba',
  'data-gap': 'Data Gap',
  decision: 'Decision',
};

export interface StateItemNotesDrawerProps {
  open: boolean;
  initialKind: ProcessStateNoteKind;
  initialText: string;
  onSave: (kind: ProcessStateNoteKind, text: string) => void;
  onCancel: () => void;
}

const StateItemNotesDrawer: React.FC<StateItemNotesDrawerProps> = ({
  open,
  initialKind,
  initialText,
  onSave,
  onCancel,
}) => {
  const [kind, setKind] = React.useState<ProcessStateNoteKind>(initialKind);
  const [text, setText] = React.useState<string>(initialText);

  // Reset internal state when drawer is reopened with new initial values
  React.useEffect(() => {
    if (open) {
      setKind(initialKind);
      setText(initialText);
    }
  }, [open, initialKind, initialText]);

  if (!open) return null;

  const trimmed = text.trim();
  const canSave = trimmed.length > 0;

  return (
    <div
      data-testid="state-item-notes-drawer"
      className="mt-3 rounded-md border border-edge bg-surface p-3"
    >
      <div className="flex flex-wrap gap-2">
        {PROCESS_STATE_NOTE_KINDS.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              k === kind
                ? 'rounded-sm border border-blue-500 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400'
                : 'rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary hover:bg-surface-hover'
            }
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a team note…"
        className="mt-2 w-full rounded-md border border-edge bg-surface px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-edge px-3 py-1 text-xs font-medium text-content-secondary hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(kind, trimmed)}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default StateItemNotesDrawer;
