import type { EntityBase } from '../identity';

export type ProjectRole = 'lead' | 'member' | 'sponsor';

export interface ProjectMember extends EntityBase {
  userId: string;
  displayName: string;
  role: ProjectRole;
  invitedAt: number;
  acceptedAt?: number;
}

export interface Invitation extends EntityBase {
  projectId: string;
  userId: string;
  displayName: string;
  role: ProjectRole;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: number;
  revokedAt?: number;
}
