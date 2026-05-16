import type { ProjectMember, ProjectRole } from '../projectMembership/types';
import type { ProcessParticipantRef } from '../processHub';

type LegacyTeamEntry = {
  role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
  raci?: 'R' | 'A' | 'C' | 'I';
  person: ProcessParticipantRef;
};

const ROLE_MAP: Record<LegacyTeamEntry['role'], ProjectRole> = {
  champion: 'sponsor',
  sponsor: 'sponsor',
  projectLead: 'lead',
  teamMember: 'member',
  processOwner: 'member',
};

export function migrateTeamToMembers(
  legacyTeam: ReadonlyArray<LegacyTeamEntry> | undefined,
  migrationTimestamp: number
): ProjectMember[] {
  if (!legacyTeam || legacyTeam.length === 0) return [];
  return legacyTeam.map((entry, idx) => ({
    id: `pm-migrated-${entry.person.userId ?? entry.person.upn ?? 'unknown'}-${idx}`,
    createdAt: migrationTimestamp,
    deletedAt: null,
    userId: entry.person.userId ?? entry.person.upn ?? entry.person.displayName,
    displayName: entry.person.displayName,
    role: ROLE_MAP[entry.role],
    invitedAt: migrationTimestamp,
    acceptedAt: migrationTimestamp,
  }));
}
