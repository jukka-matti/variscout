import React, { useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

type TeamMember = NonNullable<ImprovementProject['metadata']['team']>[number];
type TeamRole = TeamMember['role'];
type RaciAssignment = 'R' | 'A' | 'C' | 'I';

interface IPDetailInviteModalProps {
  onClose: () => void;
  onSubmit: (member: TeamMember) => void;
}

const ROLE_OPTIONS: Array<{ value: TeamRole; label: string; defaultRaci: RaciAssignment }> = [
  { value: 'champion', label: 'Champion', defaultRaci: 'A' },
  { value: 'sponsor', label: 'Sponsor', defaultRaci: 'A' },
  { value: 'projectLead', label: 'Project lead', defaultRaci: 'R' },
  { value: 'teamMember', label: 'Team member', defaultRaci: 'C' },
  { value: 'processOwner', label: 'Process owner', defaultRaci: 'A' },
];

const RACI_OPTIONS: Array<{ value: RaciAssignment; label: string }> = [
  { value: 'R', label: 'R - Responsible' },
  { value: 'A', label: 'A - Accountable' },
  { value: 'C', label: 'C - Consulted' },
  { value: 'I', label: 'I - Informed' },
];

const IPDetailInviteModal: React.FC<IPDetailInviteModalProps> = ({ onClose, onSubmit }) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('teamMember');
  const [raci, setRaci] = useState<RaciAssignment>('C');
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (nextRole: TeamRole) => {
    setRole(nextRole);
    setRaci(ROLE_OPTIONS.find(option => option.value === nextRole)?.defaultRaci ?? 'C');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    const trimmedEmail = email.trim();
    onSubmit({
      role,
      raci,
      person: trimmedEmail
        ? { displayName: trimmedName, upn: trimmedEmail }
        : { displayName: trimmedName },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <FocusTrap
        focusTrapOptions={{
          initialFocus: () => nameInputRef.current ?? undefined,
          fallbackFocus: '[role="dialog"]',
          escapeDeactivates: false,
          clickOutsideDeactivates: false,
        }}
      >
        <form
          className="w-full max-w-sm rounded-lg border border-edge bg-surface p-4 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Invite team member"
          onSubmit={handleSubmit}
          onKeyDown={event => {
            if (event.key === 'Escape') onClose();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-content">Invite team member</h2>
              <p className="mt-1 text-xs text-content-secondary">
                Add the person to this improvement project roster.
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-content-secondary hover:text-content"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-content">
              Name
              <input
                ref={nameInputRef}
                className="mt-1 w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
                value={displayName}
                onChange={event => {
                  setDisplayName(event.target.value);
                  if (error) setError(null);
                }}
              />
            </label>
            {error ? <div className="text-xs text-red-600">{error}</div> : null}

            <label className="block text-xs font-medium text-content">
              Email
              <input
                className="mt-1 w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </label>

            <label className="block text-xs font-medium text-content">
              Role
              <select
                className="mt-1 w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
                value={role}
                onChange={event => handleRoleChange(event.target.value as TeamRole)}
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-content">
              RACI assignment
              <select
                className="mt-1 w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
                value={raci}
                onChange={event => setRaci(event.target.value as RaciAssignment)}
              >
                {RACI_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-content-secondary">
              <span>Preview</span>
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-2 font-semibold text-content-secondary"
                data-testid="invite-raci-preview"
              >
                {raci}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-edge px-3 py-1.5 text-xs text-content-secondary hover:text-content"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--vs-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--vs-accent-hover)]"
            >
              Save invite
            </button>
          </div>
        </form>
      </FocusTrap>
    </div>
  );
};

export default IPDetailInviteModal;
