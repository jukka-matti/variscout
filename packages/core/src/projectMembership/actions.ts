import type { ProjectMember, Invitation } from './types';
import type { ImprovementProject } from '../improvementProject';
import { generateDeterministicId } from '../identity';

/**
 * `id`, `createdAt`, `deletedAt`, `userId`, and `invitedAt` are immutable
 * (excluded from patch typing). Enforcement is type-level via `Omit<>`.
 */
export type ProjectMemberPatch = Partial<
  Omit<ProjectMember, 'id' | 'createdAt' | 'deletedAt' | 'userId' | 'invitedAt'>
>;

export type MembershipAction =
  | {
      kind: 'PROJECT_MEMBER_ADD';
      projectId: ImprovementProject['id'];
      member: ProjectMember;
    }
  | {
      kind: 'PROJECT_MEMBER_UPDATE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
      patch: ProjectMemberPatch;
    }
  | {
      kind: 'PROJECT_MEMBER_REMOVE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
    }
  | {
      kind: 'INVITATION_ACCEPT';
      projectId: ImprovementProject['id'];
      invitation: Invitation;
      acceptedAt: number;
    }
  | {
      kind: 'INVITATION_REVOKE';
      projectId: ImprovementProject['id'];
      invitationId: Invitation['id'];
      revokedAt: number;
    };

export function reduceProjectMembers(
  state: ProjectMember[],
  action: MembershipAction
): ProjectMember[] {
  switch (action.kind) {
    case 'PROJECT_MEMBER_ADD':
      return [...state, action.member];
    case 'PROJECT_MEMBER_UPDATE':
      return state.map(m => (m.id === action.memberId ? { ...m, ...action.patch } : m));
    case 'PROJECT_MEMBER_REMOVE':
      return state.filter(m => m.id !== action.memberId);
    case 'INVITATION_ACCEPT': {
      const synthesizedMember: ProjectMember = {
        id: generateDeterministicId(),
        createdAt: action.acceptedAt,
        deletedAt: null,
        userId: action.invitation.userId,
        displayName: action.invitation.displayName,
        role: action.invitation.role,
        invitedAt: action.invitation.invitedAt,
        acceptedAt: action.acceptedAt,
      };
      return [...state, synthesizedMember];
    }
    case 'INVITATION_REVOKE':
      return state;
  }
}
