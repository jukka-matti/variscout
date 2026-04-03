import { useState, useEffect, useCallback, useRef } from 'react';

interface ActiveSession {
  sessionId: string;
  causeName: string;
  participantCount: number;
  phase: 'brainstorm' | 'vote';
}

export interface UseBrainstormDetectReturn {
  /** Currently active session (null if none) */
  activeSession: ActiveSession | null;
  /** Dismiss the detection (hides toast until next poll finds a new session) */
  dismiss: () => void;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function useBrainstormDetect(
  projectId: string | null,
  enabled = true
): UseBrainstormDetectReturn {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const dismissedSessionRef = useRef<string | null>(null);

  const poll = useCallback(async () => {
    if (!projectId || !enabled) return;
    try {
      const res = await fetch(`/api/brainstorm/active?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as ActiveSession | null;
      if (data && data.sessionId !== dismissedSessionRef.current) {
        setActiveSession(data);
      } else if (!data) {
        setActiveSession(null);
        dismissedSessionRef.current = null;
      }
    } catch {
      // ignore network errors
    }
  }, [projectId, enabled]);

  useEffect(() => {
    if (!projectId || !enabled) return;
    // Initial poll (async — setState happens in the resolved callback, not synchronously)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState is called async inside poll(), not synchronously
    void poll();
    // Set up interval
    const interval = setInterval(() => void poll(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll, projectId, enabled]);

  // Reset active session when polling is disabled or projectId cleared
  useEffect(() => {
    if (!projectId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting session when polling becomes disabled (external config change)
      setActiveSession(null);
    }
  }, [projectId, enabled]);

  const dismiss = useCallback(() => {
    if (activeSession) {
      dismissedSessionRef.current = activeSession.sessionId;
    }
    setActiveSession(null);
  }, [activeSession]);

  return { activeSession, dismiss };
}
