import { useState, useCallback, useEffect, useRef } from 'react';
import type { IdeaDirection } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';

interface BrainstormSessionState {
  sessionId: string | null;
  ideas: BrainstormIdea[];
  phase: 'brainstorm' | 'vote';
  participantCount: number;
  isConnected: boolean;
}

export interface UseBrainstormSessionReturn {
  /** Current session state */
  state: BrainstormSessionState;
  /** Create a new session for a cause */
  createSession: (
    projectId: string,
    questionId: string,
    causeName: string
  ) => Promise<string | null>;
  /** Join an existing session by ID */
  joinSession: (sessionId: string) => void;
  /** Add a new idea to the session */
  addIdea: (text: string, direction: IdeaDirection, aiGenerated?: boolean) => Promise<void>;
  /** Edit an existing idea */
  editIdea: (ideaId: string, text: string, direction: IdeaDirection) => Promise<void>;
  /** Disconnect and close the session */
  disconnect: () => void;
}

const INITIAL_STATE: BrainstormSessionState = {
  sessionId: null,
  ideas: [],
  phase: 'brainstorm',
  participantCount: 0,
  isConnected: false,
};

export function useBrainstormSession(): UseBrainstormSessionReturn {
  const [state, setState] = useState<BrainstormSessionState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);
  // Keep a ref to the current sessionId so addIdea/editIdea don't use stale closures
  const sessionIdRef = useRef<string | null>(null);

  const connectSSE = useCallback((sessionId: string) => {
    // Close existing connection if any
    eventSourceRef.current?.close();

    sessionIdRef.current = sessionId;
    const es = new EventSource(`/api/brainstorm/stream?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.onmessage = event => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          session?: {
            ideas?: BrainstormIdea[];
            phase?: 'brainstorm' | 'vote';
            participants?: string[];
          };
          idea?: BrainstormIdea;
        };
        if (data.type === 'init') {
          setState({
            sessionId,
            ideas: data.session?.ideas ?? [],
            phase: data.session?.phase ?? 'brainstorm',
            participantCount: data.session?.participants?.length ?? 1,
            isConnected: true,
          });
        } else if (data.type === 'idea' && data.idea) {
          const incoming = data.idea;
          setState(prev => {
            const existing = prev.ideas.findIndex(i => i.id === incoming.id);
            const ideas = [...prev.ideas];
            if (existing >= 0) {
              ideas[existing] = incoming;
            } else {
              ideas.push(incoming);
            }
            return { ...prev, ideas };
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };
  }, []);

  const createSession = useCallback(
    async (projectId: string, questionId: string, causeName: string): Promise<string | null> => {
      try {
        const res = await fetch('/api/brainstorm/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, questionId, causeName }),
        });
        if (!res.ok) return null;
        const { sessionId } = (await res.json()) as { sessionId: string };
        connectSSE(sessionId);
        return sessionId;
      } catch {
        return null;
      }
    },
    [connectSSE]
  );

  const joinSession = useCallback(
    (sessionId: string) => {
      connectSSE(sessionId);
    },
    [connectSSE]
  );

  const addIdea = useCallback(
    async (text: string, direction: IdeaDirection, aiGenerated = false): Promise<void> => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      await fetch('/api/brainstorm/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text,
          direction,
          aiGenerated,
        }),
      });
    },
    []
  );

  const editIdea = useCallback(
    async (ideaId: string, text: string, direction: IdeaDirection): Promise<void> => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      await fetch('/api/brainstorm/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          id: ideaId,
          text,
          direction,
        }),
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    sessionIdRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return { state, createSession, joinSession, addIdea, editIdea, disconnect };
}
