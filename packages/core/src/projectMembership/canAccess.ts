import type { ProjectMember, ProjectRole } from './types';

/**
 * 2-tier project ACL — Lead + Everyone-else.
 *
 * Lead has structural-write authority (`edit`) plus contribution + membership +
 * report access. Member and Sponsor are functionally identical at the ACL layer
 * (both `edit-contributions` + `view-report`); the Sponsor distinction is an
 * identity / notification-routing label, not an ACL boundary.
 *
 * `'approve-*'` actions are intentionally absent — signoff at Charter approval
 * and Sustainment closure is **out-of-band** in V1 per wedge spec line 288.
 * Lead records the signoff result as a note in the relevant stage's metadata;
 * no in-product approval CTA exists.
 *
 * Action semantics:
 * - `'edit'`               — structural writes (Charter authoring, hypothesis
 *                           create/close, stage advance, Report compile). Lead-only.
 * - `'edit-contributions'` — Findings, evidence, action items, ideas, comments,
 *                           measurement plans. Lead + Member + Sponsor.
 * - `'manage-membership'`  — invite / remove members. Lead-only.
 * - `'view-report'`        — read access to the Report tab. All members.
 */
export type ProjectAction = 'edit' | 'edit-contributions' | 'manage-membership' | 'view-report';

const ROLE_PERMISSIONS: Record<ProjectRole, ReadonlyArray<ProjectAction>> = {
  lead: ['edit', 'edit-contributions', 'manage-membership', 'view-report'],
  member: ['edit-contributions', 'view-report'],
  sponsor: ['edit-contributions', 'view-report'],
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
