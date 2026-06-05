/**
 * ImprovementProject factories — pure builders that produce default-shaped
 * IP entities for the Create Project flow (PR-CCJ-E1 T4).
 *
 * The Home CTA's "New project" path calls `createNewIP()` to produce the IP
 * that subsequently lands in `useImprovementProjectStore` via `upsertProject`.
 * Persistence (IDB write + cloud sync) is handled by the consuming app; this
 * factory owns shape only.
 */

import type { ImprovementProject, ImprovementProjectStatus } from './types';
import type { ProcessHub } from '../processHub';
import type { ProjectMember } from '../projectMembership/types';
import { generateDeterministicId } from '../identity';

export interface CreateNewIPInput {
  hubId: ProcessHub['id'];
  /** Project title. Caller is responsible for trim discipline — the factory
   *  passes the string through verbatim. */
  title: string;
  /** Optional free-text "what's happening?" description. Omitted from the
   *  produced IP root when undefined; the caller (modal) is responsible for
   *  trimming + treating whitespace-only as undefined. */
  issueStatement?: string;
  /** User id of the current user — populated as the project's Lead member. */
  currentUserId: string;
  /** Optional display name for the Lead member. Falls back to `currentUserId`
   *  so the member roster always has a renderable label. */
  currentUserDisplayName?: string;
  /** Optional status override; defaults to `'active'` per the E1 wedge V1
   *  lifecycle decision (no draft → active gating in V1). */
  status?: ImprovementProjectStatus;
  /** Optional clock for tests; defaults to `Date.now()`. */
  now?: () => number;
  /** Optional id override for tests; defaults to `generateDeterministicId()`
   *  (UUID v4 via the platform `crypto.randomUUID`). */
  id?: string;
}

/**
 * Build a default-shaped `ImprovementProject` ready for `upsertProject`.
 *
 * Defaults:
 * - `status` → `'active'` (E1 lifecycle decision: no draft gating in V1).
 * - `metadata.members` → `[{ role: 'lead', userId: currentUserId }]`.
 * - `goal.outcomeGoals` → `[]` (Charter authoring populates).
 * - `sections.*` → `{}` empty narrative containers.
 * - `createdAt` === `updatedAt` (single clock read).
 * - `deletedAt` → `null` (live).
 *
 * The factory does NOT mutate or validate `title` / `issueStatement` — the
 * Create Project modal owns trim + whitespace-only-is-empty discipline.
 */
export function createNewIP(input: CreateNewIPInput): ImprovementProject {
  const now = input.now ? input.now() : Date.now();
  const id = input.id ?? generateDeterministicId();
  const memberId = input.id ? `${input.id}-lead` : generateDeterministicId();

  const leadMember: ProjectMember = {
    id: memberId,
    createdAt: now,
    deletedAt: null,
    userId: input.currentUserId,
    displayName: input.currentUserDisplayName ?? input.currentUserId,
    role: 'lead',
    invitedAt: now,
    acceptedAt: now,
  };

  return {
    id,
    hubId: input.hubId,
    status: input.status ?? 'active',
    metadata: {
      title: input.title,
      members: [leadMember],
    },
    goal: {
      outcomeGoals: [],
    },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    issueStatement: input.issueStatement,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
