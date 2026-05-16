import type { ProjectMember, ProjectRole } from './types';

export type ProjectAction =
  | 'edit-charter'
  | 'edit-approach'
  | 'edit-improve'
  | 'edit-sustainment'
  | 'manage-membership'
  | 'view-report';

const ROLE_PERMISSIONS: Record<ProjectRole, ReadonlyArray<ProjectAction>> = {
  lead: [
    'edit-charter',
    'edit-approach',
    'edit-improve',
    'edit-sustainment',
    'manage-membership',
    'view-report',
  ],
  member: ['edit-charter', 'edit-approach', 'edit-improve', 'edit-sustainment', 'view-report'],
  sponsor: ['view-report'],
};

export function canAccess(
  userId: string,
  members: ReadonlyArray<ProjectMember>,
  action: ProjectAction
): boolean {
  const member = members.find(m => m.userId === userId);
  if (!member) return false;
  return ROLE_PERMISSIONS[member.role].includes(action);
}
