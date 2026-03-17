import { useCallback } from 'react';
import { buildReportSharePayload } from '../services/shareContent';
import { useTeamsShare } from './useTeamsShare';

interface UseShareReportOptions {
  projectName: string;
  processName: string;
  baseUrl: string;
  keyCpk?: number;
}

export function useShareReport({
  projectName,
  processName,
  baseUrl,
  keyCpk,
}: UseShareReportOptions) {
  const { share, isTeams } = useTeamsShare();

  const shareReport = useCallback(async (): Promise<boolean> => {
    const payload = buildReportSharePayload(processName, projectName, baseUrl, keyCpk);
    return share(payload);
  }, [processName, projectName, baseUrl, keyCpk, share]);

  return { shareReport, canShare: isTeams };
}
