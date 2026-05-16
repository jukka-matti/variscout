import React, { useState } from 'react';
import type { ProjectRole } from '@variscout/core/projectMembership';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; role: ProjectRole }) => void;
}

export function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({ email, role });
    setEmail('');
    setRole('member');
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Invite teammate">
      <form onSubmit={submit}>
        <label htmlFor="invite-email" className="block text-sm font-medium text-content-muted mb-1">
          Email
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          aria-label="Email"
          className="w-full px-3 py-2 rounded bg-surface-secondary border border-edge text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <label
          htmlFor="invite-role"
          className="block text-sm font-medium text-content-muted mt-3 mb-1"
        >
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={e => setRole(e.target.value as ProjectRole)}
          aria-label="Role"
          className="w-full px-3 py-2 rounded bg-surface-secondary border border-edge text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="lead">Lead</option>
          <option value="member">Member</option>
          <option value="sponsor">Sponsor</option>
        </select>
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Invite
          </button>
        </div>
      </form>
    </div>
  );
}
