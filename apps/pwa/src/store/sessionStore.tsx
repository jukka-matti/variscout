// apps/pwa/src/store/sessionStore.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';

interface SessionState {
  hub: ProcessHub | null;
  rawData: Array<Record<string, unknown>> | null;
  /**
   * Mode B Stage 1 sentinel for the goal-narrative gate:
   *   - `null`  → user has not been asked yet (HubGoalForm should render)
   *   - `''`    → user explicitly skipped framing (advanced)
   *   - string  → user-provided narrative
   */
  goalNarrative: string | null;
}

interface SessionStore extends SessionState {
  setHub: (hub: ProcessHub | null) => void;
  setRawData: (data: Array<Record<string, unknown>> | null) => void;
  setGoalNarrative: (narrative: string | null) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [hub, setHub] = useState<ProcessHub | null>(null);
  const [rawData, setRawData] = useState<Array<Record<string, unknown>> | null>(null);
  const [goalNarrative, setGoalNarrative] = useState<string | null>(null);
  return (
    <SessionContext.Provider
      value={{ hub, rawData, goalNarrative, setHub, setRawData, setGoalNarrative }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
