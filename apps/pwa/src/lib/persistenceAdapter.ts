/**
 * PWA Persistence Adapter (no-op)
 *
 * The PWA is a free training tool — save/load is not available.
 * This no-op adapter satisfies the PersistenceAdapter interface
 * required by useDataState without any IndexedDB dependency.
 */

import type { PersistenceAdapter } from '@variscout/hooks';

export const pwaPersistenceAdapter: PersistenceAdapter = {
  saveProject: async () => {
    throw new Error('Save is not available in the free PWA');
  },
  loadProject: async () => undefined,
  listProjects: async () => [],
  deleteProject: async () => {},
  renameProject: async () => {},
  exportToFile: () => {},
  importFromFile: async () => {
    throw new Error('Import is not available in the free PWA');
  },
};
