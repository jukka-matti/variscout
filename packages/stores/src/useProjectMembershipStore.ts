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

      acceptInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),

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
