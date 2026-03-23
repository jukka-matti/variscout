import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEasyAuthUser } from '../auth/easyAuth';
import { updateLastViewedAt, type CloudProject, type StorageLocation } from '../services/storage';

interface UseProjectOverviewOptions {
  listProjects: () => Promise<CloudProject[]>;
  currentProjectName?: string;
  currentProjectLocation?: StorageLocation;
}

interface UseProjectOverviewReturn {
  overviewUserId: string;
  overviewProjects: CloudProject[];
  lastViewedAt: number;
  handleUpdateLastViewed: () => void;
}

/**
 * Fetches current user ID and project list for the ProjectDashboard overview.
 * Computes lastViewedAt for the WhatsNewSection.
 */
export function useProjectOverview({
  listProjects,
  currentProjectName,
  currentProjectLocation,
}: UseProjectOverviewOptions): UseProjectOverviewReturn {
  const [overviewUserId, setOverviewUserId] = useState<string>('local');
  const [overviewProjects, setOverviewProjects] = useState<CloudProject[]>([]);

  useEffect(() => {
    getEasyAuthUser()
      .then(u => {
        if (u?.userId) setOverviewUserId(u.userId);
        else if (u?.email) setOverviewUserId(u.email);
      })
      .catch(() => {});
    listProjects()
      .then(setOverviewProjects)
      .catch(() => {});
  }, [listProjects]);

  const lastViewedAt = useMemo(() => {
    const project = overviewProjects.find(
      p => p.name === currentProjectName || p.id === currentProjectName
    );
    return project?.metadata?.lastViewedAt?.[overviewUserId] ?? 0;
  }, [overviewProjects, currentProjectName, overviewUserId]);

  const handleUpdateLastViewed = useCallback(() => {
    if (!currentProjectName || !currentProjectLocation) return;
    updateLastViewedAt(currentProjectName, currentProjectLocation, overviewUserId);
  }, [currentProjectName, currentProjectLocation, overviewUserId]);

  return { overviewUserId, overviewProjects, lastViewedAt, handleUpdateLastViewed };
}
