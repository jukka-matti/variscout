// packages/ui/src/components/GoalBanner/GoalBanner.tsx
import { useState } from 'react';

export interface GoalBannerProps {
  goal?: string;
  onChange?: (next: string) => void;
}

export function GoalBanner({ goal = '', onChange }: GoalBannerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);

  if (!goal && !editing) return null;

  const enterEdit = () => {
    if (!onChange) return;
    setDraft(goal);
    setEditing(true);
  };

  const save = () => {
    if (draft.trim() === '') return; // non-empty guard: stay in edit mode
    onChange?.(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(goal);
    setEditing(false);
  };

  return (
    <div
      className="goal-banner"
      data-testid="goal-banner"
      onClick={!editing ? enterEdit : undefined}
    >
      {editing ? (
        <>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3} />
          <button type="button" onClick={save}>
            Save
          </button>
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <strong>Goal:</strong> {goal}
        </>
      )}
    </div>
  );
}
