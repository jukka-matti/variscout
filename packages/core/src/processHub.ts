import type { JourneyPhase } from './ai/types';

export const DEFAULT_PROCESS_HUB_ID = 'general-unassigned';
export const DEFAULT_PROCESS_HUB_NAME = 'General / Unassigned';

export type InvestigationDepth = 'quick' | 'focused' | 'chartered';

export type InvestigationStatus =
  | 'issue-captured'
  | 'framing'
  | 'scouting'
  | 'investigating'
  | 'ready-to-improve'
  | 'improving'
  | 'verifying'
  | 'resolved'
  | 'controlled';

export interface ProcessParticipantRef {
  userId?: string;
  upn?: string;
  displayName: string;
}

export interface ProcessHub {
  id: string;
  name: string;
  description?: string;
  processOwner?: ProcessParticipantRef;
  createdAt: string;
  updatedAt?: string;
}

export const DEFAULT_PROCESS_HUB: ProcessHub = {
  id: DEFAULT_PROCESS_HUB_ID,
  name: DEFAULT_PROCESS_HUB_NAME,
  createdAt: '1970-01-01T00:00:00.000Z',
};

export interface ProcessHubInvestigationMetadata {
  processHubId?: string;
  investigationDepth?: InvestigationDepth;
  investigationStatus?: InvestigationStatus;
  actionCounts?: { total: number; completed: number; overdue: number };
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
}

export interface ProcessHubInvestigation {
  id: string;
  name: string;
  modified: string;
  metadata?: ProcessHubInvestigationMetadata;
}

export interface ProcessHubRollup<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  hub: ProcessHub;
  investigations: TInvestigation[];
  activeInvestigationCount: number;
  statusCounts: Partial<Record<InvestigationStatus, number>>;
  depthCounts: Partial<Record<InvestigationDepth, number>>;
  overdueActionCount: number;
  latestActivity: string | null;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
}

const ACTIVE_STATUSES = new Set<InvestigationStatus>([
  'issue-captured',
  'framing',
  'scouting',
  'investigating',
  'ready-to-improve',
  'improving',
  'verifying',
]);

export function normalizeProcessHubId(processHubId?: string | null): string {
  const trimmed = processHubId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_PROCESS_HUB_ID;
}

export function investigationStatusFromJourneyPhase(phase: JourneyPhase): InvestigationStatus {
  switch (phase) {
    case 'frame':
      return 'framing';
    case 'scout':
      return 'scouting';
    case 'investigate':
      return 'investigating';
    case 'improve':
      return 'improving';
  }
}

function newestInvestigation<TInvestigation extends ProcessHubInvestigation>(
  investigations: TInvestigation[]
): TInvestigation | undefined {
  return [...investigations].sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
  )[0];
}

export function buildProcessHubRollups<TInvestigation extends ProcessHubInvestigation>(
  hubs: ProcessHub[],
  investigations: TInvestigation[]
): ProcessHubRollup<TInvestigation>[] {
  const hubMap = new Map<string, ProcessHub>();
  hubMap.set(DEFAULT_PROCESS_HUB_ID, DEFAULT_PROCESS_HUB);
  for (const hub of hubs) {
    hubMap.set(normalizeProcessHubId(hub.id), hub);
  }

  for (const investigation of investigations) {
    const hubId = normalizeProcessHubId(investigation.metadata?.processHubId);
    if (!hubMap.has(hubId)) {
      hubMap.set(hubId, { id: hubId, name: hubId, createdAt: '1970-01-01T00:00:00.000Z' });
    }
  }

  const grouped = new Map<string, TInvestigation[]>();
  for (const investigation of investigations) {
    const hubId = normalizeProcessHubId(investigation.metadata?.processHubId);
    grouped.set(hubId, [...(grouped.get(hubId) ?? []), investigation]);
  }

  return Array.from(hubMap.values())
    .map(hub => {
      const hubInvestigations = [...(grouped.get(hub.id) ?? [])].sort(
        (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
      const statusCounts: Partial<Record<InvestigationStatus, number>> = {};
      const depthCounts: Partial<Record<InvestigationDepth, number>> = {};
      let overdueActionCount = 0;
      let activeInvestigationCount = 0;

      for (const investigation of hubInvestigations) {
        const status = investigation.metadata?.investigationStatus ?? 'scouting';
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
        if (ACTIVE_STATUSES.has(status)) activeInvestigationCount++;

        const depth = investigation.metadata?.investigationDepth;
        if (depth) depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;

        overdueActionCount += investigation.metadata?.actionCounts?.overdue ?? 0;
      }

      const latest = newestInvestigation(hubInvestigations);
      const summarySource = hubInvestigations.find(
        investigation =>
          investigation.metadata?.currentUnderstandingSummary ||
          investigation.metadata?.problemConditionSummary ||
          investigation.metadata?.nextMove
      );

      return {
        hub,
        investigations: hubInvestigations,
        activeInvestigationCount,
        statusCounts,
        depthCounts,
        overdueActionCount,
        latestActivity: latest?.modified ?? null,
        currentUnderstandingSummary: summarySource?.metadata?.currentUnderstandingSummary,
        problemConditionSummary: summarySource?.metadata?.problemConditionSummary,
        nextMove: summarySource?.metadata?.nextMove,
      };
    })
    .filter(rollup => rollup.investigations.length > 0 || rollup.hub.id !== DEFAULT_PROCESS_HUB_ID)
    .sort((a, b) => {
      const aTime = a.latestActivity ? new Date(a.latestActivity).getTime() : 0;
      const bTime = b.latestActivity ? new Date(b.latestActivity).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.hub.name.localeCompare(b.hub.name);
    });
}
