// packages/ui/src/components/GoalBanner/GoalBanner.tsx
import { useState } from 'react';

export interface GoalBannerProps {
  goal?: string;
  onChange?: (next: string) => void;
  /**
   * FSJ-2 (first-session spec §3): opt-in ceremony entry. When set and no goal
   * exists, renders a quiet start affordance instead of returning null —
   * the goal narrative's post-paste-gate home. Azure callers omit it (unchanged).
   */
  startPrompt?: string;
}

export function GoalBanner({ goal = '', onChange, startPrompt }: GoalBannerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);

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

  if (!goal && !editing) {
    if (!startPrompt || !onChange) return null;
    return (
      <div className="goal-banner" data-testid="goal-banner">
        <button type="button" onClick={enterEdit} data-testid="goal-banner-start">
          ＋ {startPrompt}
        </button>
      </div>
    );
  }

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
