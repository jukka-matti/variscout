import { createNewIP } from '@variscout/core/improvementProject';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessHub } from '@variscout/core/processHub';
import { PWA_USER_ID } from './pwaUser';

/**
 * The Untitled-project guarantee (first-session spec §3): every data entry
 * yields a session hub carrying a live ImprovementProject, auto-named for
 * the entry (sample name / .vrs envelope name / 'Untitled project').
 * Pure: returns the input hub unchanged (same reference) when a live IP
 * already exists — .vrs imports reconstruct, never re-wrap (spec §1).
 * Session-only per R6d: nothing here persists.
 */
export function ensureSessionProject(
  hub: ProcessHub | null,
  title: string,
  now: () => number = Date.now
): ProcessHub & { improvementProject: ImprovementProject } {
  const existingIP = hub?.improvementProject;
  if (existingIP && existingIP.deletedAt === null) {
    return hub as ProcessHub & { improvementProject: ImprovementProject };
  }
  const base: Pick<ProcessHub, 'id' | 'name' | 'createdAt' | 'deletedAt'> = hub ?? {
    id: crypto.randomUUID(),
    name: '',
    createdAt: now(),
    deletedAt: null,
  };
  const ip = createNewIP({
    hubId: base.id,
    title,
    currentUserId: PWA_USER_ID,
    now,
  });
  return { ...base, improvementProject: ip, updatedAt: now() };
}
