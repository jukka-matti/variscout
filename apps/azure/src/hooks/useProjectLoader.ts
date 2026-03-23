import { useState, useEffect } from 'react';
import { classifySyncError } from '../services/storage';

type LoadErrorCode = 'not-found' | 'forbidden' | 'plan-mismatch' | 'offline' | 'auth' | 'unknown';

export interface LoadError {
  code: LoadErrorCode;
  message: string;
  action?: { label: string; onClick: () => void };
}

const ERROR_MESSAGES: Record<LoadErrorCode, string> = {
  'not-found':
    'Project not found. It may have been deleted or moved. Ask the person who shared this link.',
  forbidden:
    "This project is in a Teams channel you don't have access to. Ask a channel member to add you.",
  'plan-mismatch': 'This project requires a Team plan to access. Contact your admin.',
  offline:
    "You're offline and this project isn't cached locally. Connect to the internet to load it.",
  auth: 'Your session has expired.',
  unknown: 'Failed to load project. Please try again.',
};

interface UseProjectLoaderOptions {
  projectId: string | null;
  hasData: boolean;
  isLoadingProject: boolean;
  startProjectLoad: () => void;
  projectLoaded: () => void;
  loadProject: (id: string) => Promise<void>;
  onBack: () => void;
}

/**
 * Handles project loading lifecycle: triggers load on mount,
 * classifies errors, and provides error state for the UI.
 */
export function useProjectLoader({
  projectId,
  hasData,
  isLoadingProject,
  startProjectLoad,
  projectLoaded,
  loadProject,
  onBack,
}: UseProjectLoaderOptions): LoadError | null {
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  useEffect(() => {
    if (projectId && !hasData && !isLoadingProject) {
      startProjectLoad();
      setLoadError(null);
      loadProject(projectId)
        .catch(error => {
          const classified = classifySyncError(error);
          const code: LoadErrorCode =
            classified.category === 'not_found'
              ? 'not-found'
              : classified.category === 'forbidden'
                ? 'forbidden'
                : classified.category === 'auth'
                  ? 'auth'
                  : !navigator.onLine
                    ? 'offline'
                    : 'unknown';

          setLoadError({
            code,
            message: ERROR_MESSAGES[code],
            action:
              code === 'auth'
                ? {
                    label: 'Sign in',
                    onClick: () => {
                      window.location.href = '/.auth/login/aad';
                    },
                  }
                : code !== 'unknown'
                  ? { label: 'Go to Dashboard', onClick: onBack }
                  : undefined,
          });
        })
        .finally(() => projectLoaded());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return loadError;
}
