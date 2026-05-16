import type { ImprovementProject } from './types';
import { migrateTeamToMembers } from './migration';

/**
 * Idempotent migration applied at hydration time. Folds PR-WV1-2 changes
 * over the wedge V1 metadata shape:
 *   1. legacy `team[]` → wedge `members[]` (via migrateTeamToMembers)
 *
 * Legacy `team[]` is preserved on the output for now; PR-WV1-5 (tier-gating
 * retirement + nav reorder) drops it.
 */
export function migrateImprovementProjectMetadata(
  ip: ImprovementProject,
  now: number
): ImprovementProject {
  const hasMembers = ip.metadata.members !== undefined;
  const hasLegacyTeam = ip.metadata.team !== undefined && ip.metadata.team.length > 0;

  if (hasMembers || !hasLegacyTeam) {
    return ip;
  }

  const members = migrateTeamToMembers(ip.metadata.team, now);

  return {
    ...ip,
    metadata: {
      ...ip.metadata,
      members,
    },
  };
}
