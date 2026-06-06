import { create } from 'zustand';
import type { ProcessHub } from '@variscout/core/processHub';

/**
 * Word-style hub durability (first-session spec §3, FSJ-3a): hubs created in
 * this session live here — in-memory only — until the first explicit save
 * flushes them to the catalog (saveProcessHub). "Unsaved" means "current
 * state not persisted": a pre-existing persisted hub that gains its Untitled
 * ImprovementProject in-session also parks here until flush (the flush is
 * then an update, not a create). Editor and Dashboard resolve their hub
 * lists as catalog ∪ unsaved, preferring the unsaved copy on id collision.
 */
interface UnsavedHubsState {
  hubs: ProcessHub[];
  upsertHub: (hub: ProcessHub) => void;
  removeHub: (hubId: string) => void;
  isUnsaved: (hubId: string) => boolean;
}

export const useUnsavedHubsStore = create<UnsavedHubsState>((set, get) => ({
  hubs: [],
  upsertHub: hub =>
    set(state => ({
      hubs: [...state.hubs.filter(h => h.id !== hub.id), hub],
    })),
  removeHub: hubId => set(state => ({ hubs: state.hubs.filter(h => h.id !== hubId) })),
  isUnsaved: hubId => get().hubs.some(h => h.id === hubId),
}));
