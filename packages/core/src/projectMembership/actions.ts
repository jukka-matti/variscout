import type { ProjectMember } from './types';
import type { ImprovementProject } from '../improvementProject';

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
    };

const FORBIDDEN_PATCH_KEYS = new Set(['id', 'createdAt', 'deletedAt', 'userId', 'invitedAt']);

export function reduceProjectMembers(
  state: ProjectMember[],
  action: MembershipAction
): ProjectMember[] {
  switch (action.kind) {
    case 'PROJECT_MEMBER_ADD':
      return [...state, action.member];
    case 'PROJECT_MEMBER_UPDATE': {
      for (const key of Object.keys(action.patch)) {
        if (FORBIDDEN_PATCH_KEYS.has(key)) {
          throw new Error(
            `PROJECT_MEMBER_UPDATE patch cannot change lifecycle/identity field: ${key}`
          );
        }
      }
      return state.map(m => (m.id === action.memberId ? { ...m, ...action.patch } : m));
    }
    case 'PROJECT_MEMBER_REMOVE':
      return state.filter(m => m.id !== action.memberId);
  }
}
