import React from 'react';
import type { ProjectMember } from '@variscout/core/projectMembership';

interface MemberListProps {
  members: ProjectMember[];
  currentUserId: string;
  onRemove: (memberId: string) => void;
}

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  member: 'Member',
  sponsor: 'Sponsor',
};

export function MemberList({ members, currentUserId, onRemove }: MemberListProps) {
  const currentUserRole = members.find(m => m.userId === currentUserId)?.role;
  const canManage = currentUserRole === 'lead';

  return (
    <ul className="divide-y divide-edge">
      {members.map(m => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm text-content">{m.displayName}</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-secondary text-content-muted border border-edge">
            {ROLE_LABEL[m.role] ?? m.role}
          </span>
          {canManage && m.userId !== currentUserId && (
            <button
              type="button"
              onClick={() => onRemove(m.id)}
              className="px-3 py-1 rounded text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
