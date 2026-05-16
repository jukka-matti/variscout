/**
 * useProjectMembershipStore — pending invitation queue for project membership.
 *
 * Layer: Annotation (per-user axis). Persists to localStorage via Zustand
 * `persist` middleware under the 'variscout:projectMembership' key.
 *
 * Consumer pattern (selectors required — never bare useStore()):
 *   const pendingInvites = useProjectMembershipStore(s => s.pendingInvites);
 *
 * See packages/stores/CLAUDE.md for layer boundary rules.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invitation } from '@variscout/core/projectMembership';
import { reduceProjectMembers, type MembershipAction } from '@variscout/core/projectMembership';
import { useImprovementProjectStore } from './improvementProjectStore';

export const STORE_LAYER = 'annotation-per-user' as const;

export interface ProjectMembershipState {
  pendingInvites: Invitation[];
}

export interface ProjectMembershipActions {
  addPendingInvite: (inv: Invitation) => void;
  acceptInvite: (id: string) => void;
  revokeInvite: (id: string) => void;
}

export type ProjectMembershipStore = ProjectMembershipState & ProjectMembershipActions;

export function getProjectMembershipInitialState(): ProjectMembershipState {
  return { pendingInvites: [] };
}

export const useProjectMembershipStore = create<ProjectMembershipStore>()(
  persist(
    set => ({
      ...getProjectMembershipInitialState(),

      addPendingInvite: inv => set(s => ({ pendingInvites: [...s.pendingInvites, inv] })),

      acceptInvite: id =>
        set(s => {
          const invitation = s.pendingInvites.find(i => i.id === id);
          if (!invitation) return s;

          // Find the target project across all hub buckets
          const allProjects = Object.values(
            useImprovementProjectStore.getState().projectsByHub
          ).flat();
          const target = allProjects.find(p => p.id === invitation.projectId);

          if (target) {
            const action: MembershipAction = {
              kind: 'INVITATION_ACCEPT',
              projectId: invitation.projectId,
              invitation,
              acceptedAt: Date.now(),
            };
            const currentMembers = target.metadata.members ?? [];
            const nextMembers = reduceProjectMembers(currentMembers, action);
            useImprovementProjectStore.getState().upsertProject({
              ...target,
              metadata: { ...target.metadata, members: nextMembers },
            });
          }

          return { pendingInvites: s.pendingInvites.filter(i => i.id !== id) };
        }),

      revokeInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
    }),
    { name: 'variscout:projectMembership' }
  )
);

// Expose getInitialState on the store instance for the canonical test reset pattern:
// `useProjectMembershipStore.setState(useProjectMembershipStore.getInitialState())`
// — mirrors preferencesStore / canvasStore / viewStore / projectStore precedent.
(
  useProjectMembershipStore as unknown as {
    getInitialState: () => ProjectMembershipState;
  }
).getInitialState = getProjectMembershipInitialState;
