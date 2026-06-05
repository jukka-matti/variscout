// PO-8b same-user multi-tab safety (spec §9.4): the wholesale Dexie write +
// blob PUT critical section serializes under a per-document exclusive Web
// Lock. Greenfield — no other navigator.locks usage exists in the repo.
//
// Two-phase contract (lock⟷dialog deadlock, adversarially verified):
// navigator.locks.request holds the lock for the LIFETIME of the callback, so
// the reload-or-branch dialog must NEVER be awaited inside the callback —
// conflicts are returned as state, the lock releases, the dialog runs
// lock-free, and resolutions re-acquire the lock for their writes.
//
// Feature-detect: jsdom and older Safari have no LockManager — run unlocked
// rather than throw (single-tab behavior is then identical to today).

export const DOCUMENT_SAVE_LOCK_PREFIX = 'variscout-project-save:';

export async function withDocumentSaveLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks?.request) {
    return fn();
  }
  return locks.request(`${DOCUMENT_SAVE_LOCK_PREFIX}${name}`, { mode: 'exclusive' }, () =>
    fn()
  ) as Promise<T>;
}
