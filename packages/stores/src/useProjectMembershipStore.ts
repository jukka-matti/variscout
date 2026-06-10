/**
 * useProjectMembershipStore — pending invitation queue for project membership.
 *
 * Layer: Annotation (per-user axis). Persists to localStorage under the key
 * `variscout:projectMembership:{userId}` — one partition per authenticated user,
 * matching the annotation-per-user localStorage pattern.
 *
 * Consumer pattern (selectors required — never bare useStore()):
 *   const invites = useProjectMembershipStore(s => s.getPendingInvites(userId));
 *
 * See packages/stores/CLAUDE.md for layer boundary rules.
 */
import { create } from 'zustand';
import type { Invitation } from '@variscout/core/projectMembership';
import { reduceProjectMembers, type MembershipAction } from '@variscout/core/projectMembership';
import { useImprovementProjectStore } from './improvementProjectStore';

export const STORE_LAYER = 'annotation-per-user' as const;

/** In-memory state: per-user arrays keyed by the encoded localStorage key. */
export interface ProjectMembershipState {
  invitesByUser: Record<string, Invitation[]>;
}

export interface ProjectMembershipActions {
  getPendingInvites: (userId: string) => Invitation[];
  addPendingInvite: (userId: string, inv: Invitation) => void;
  acceptInvite: (userId: string, id: string) => void;
  revokeInvite: (userId: string, id: string) => void;
  rehydrateInvites: (userId: string) => void;
}

export type ProjectMembershipStore = ProjectMembershipState & ProjectMembershipActions;

export function getProjectMembershipInitialState(): ProjectMembershipState {
  return { invitesByUser: {} };
}

/** Builds the per-user localStorage key. Components/services supply the userId. */
export function projectMembershipStorageKey(userId: string): string {
  return `variscout:projectMembership:${encodeURIComponent(userId)}`;
}

// ---------------------------------------------------------------------------
// Storage helpers — defensive localStorage access.
// ---------------------------------------------------------------------------

function getLocalStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorageItem(key: string): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, invites: Invitation[]): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(invites));
  } catch {
    // In-memory state still represents the user's current view for this tab.
  }
}

function removeStorageItem(key: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Best effort only.
  }
}

function isInvitationArray(value: unknown): value is Invitation[] {
  return Array.isArray(value);
}

// Stable reference for empty-invite fallback. Returning a fresh `[]` from
// `getPendingInvites` causes React infinite-render loops when consumed as a
// Zustand selector (`useProjectMembershipStore(s => s.getPendingInvites(uid))`):
// every render produces a new array reference, fails the snapshot equality
// check, and triggers a re-render. Keep a null-fallback shape for corrupt entries.
const EMPTY_INVITES: readonly Invitation[] = Object.freeze([]);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProjectMembershipStore = create<ProjectMembershipStore>()((set, get) => ({
  ...getProjectMembershipInitialState(),

  getPendingInvites: userId => {
    const key = projectMembershipStorageKey(userId);
    return get().invitesByUser[key] ?? (EMPTY_INVITES as Invitation[]);
  },

  addPendingInvite: (userId, inv) => {
    const key = projectMembershipStorageKey(userId);
    const current = get().invitesByUser[key] ?? [];
    const next = [...current, inv];
    writeStorageItem(key, next);
    set(state => ({ invitesByUser: { ...state.invitesByUser, [key]: next } }));
  },

  acceptInvite: (userId, id) => {
    const key = projectMembershipStorageKey(userId);
    const current = get().invitesByUser[key] ?? [];
    const invitation = current.find(i => i.id === id);
    if (!invitation) return;

    // Find the target project across all projects (keyed by project id)
    const allProjects = Object.values(useImprovementProjectStore.getState().projectsById);
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

    const next = current.filter(i => i.id !== id);
    writeStorageItem(key, next);
    set(state => ({ invitesByUser: { ...state.invitesByUser, [key]: next } }));
  },

  revokeInvite: (userId, id) => {
    const key = projectMembershipStorageKey(userId);
    const current = get().invitesByUser[key] ?? [];
    const next = current.filter(i => i.id !== id);
    writeStorageItem(key, next);
    set(state => ({ invitesByUser: { ...state.invitesByUser, [key]: next } }));
  },

  rehydrateInvites: userId => {
    const key = projectMembershipStorageKey(userId);
    const raw = readStorageItem(key);
    if (raw === null) {
      set(state => {
        const { [key]: _removed, ...invitesByUser } = state.invitesByUser;
        return { invitesByUser };
      });
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isInvitationArray(parsed)) {
        removeStorageItem(key);
        set(state => {
          const { [key]: _removed, ...invitesByUser } = state.invitesByUser;
          return { invitesByUser };
        });
        return;
      }
      set(state => ({ invitesByUser: { ...state.invitesByUser, [key]: parsed } }));
    } catch {
      removeStorageItem(key);
      set(state => {
        const { [key]: _removed, ...invitesByUser } = state.invitesByUser;
        return { invitesByUser };
      });
    }
  },
}));

// Expose getInitialState on the store instance for the canonical test reset pattern:
// `useProjectMembershipStore.setState(useProjectMembershipStore.getInitialState())`
// — mirrors preferencesStore / canvasStore / viewStore / projectStore precedent.
(
  useProjectMembershipStore as unknown as {
    getInitialState: () => ProjectMembershipState;
  }
).getInitialState = getProjectMembershipInitialState;
