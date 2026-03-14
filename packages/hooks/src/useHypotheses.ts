import { useState, useCallback, useMemo } from 'react';
import {
  createHypothesis,
  type AnovaResult,
  type Finding,
  type Hypothesis,
  type HypothesisStatus,
} from '@variscout/core';

export interface UseHypothesesOptions {
  /** Initial hypotheses (for restoring persisted state) */
  initialHypotheses?: Hypothesis[];
  /** Callback when hypotheses change (for external persistence) */
  onHypothesesChange?: (hypotheses: Hypothesis[]) => void;
  /** Current findings (for linked finding cleanup) */
  findings?: Finding[];
  /** Current ANOVA results by factor (for auto-validation) */
  anovaByFactor?: Record<string, AnovaResult>;
}

export interface UseHypothesesReturn {
  /** Current hypotheses list */
  hypotheses: Hypothesis[];
  /** Add a new hypothesis */
  addHypothesis: (text: string, factor?: string, level?: string) => Hypothesis;
  /** Edit a hypothesis */
  editHypothesis: (
    id: string,
    updates: Partial<Pick<Hypothesis, 'text' | 'factor' | 'level'>>
  ) => void;
  /** Delete a hypothesis and clear links from findings */
  deleteHypothesis: (id: string) => string[]; // Returns finding IDs that were unlinked
  /** Link a finding to a hypothesis */
  linkFinding: (hypothesisId: string, findingId: string) => void;
  /** Unlink a finding from a hypothesis */
  unlinkFinding: (hypothesisId: string, findingId: string) => void;
  /** Get a hypothesis by ID */
  getHypothesis: (id: string) => Hypothesis | undefined;
  /** Get hypotheses linked to a specific factor */
  getByFactor: (factor: string) => Hypothesis[];
}

/** Eta-squared thresholds for auto-validation */
const ETA_SUPPORTED = 0.15;
const ETA_CONTRADICTED = 0.05;

/**
 * Compute hypothesis status from ANOVA eta-squared for the linked factor.
 */
function computeStatus(
  hypothesis: Hypothesis,
  anovaByFactor?: Record<string, AnovaResult>
): HypothesisStatus {
  if (!hypothesis.factor || !anovaByFactor) return 'untested';
  const anova = anovaByFactor[hypothesis.factor];
  if (!anova) return 'untested';

  const eta = anova.etaSquared;
  if (eta >= ETA_SUPPORTED) return 'supported';
  if (eta < ETA_CONTRADICTED) return 'contradicted';
  return 'partial';
}

/**
 * Manages causal hypotheses — shared theories that findings can reference.
 *
 * Hypotheses are auto-validated when linked to a factor with ANOVA results:
 * - eta² >= 15% → supported
 * - eta² < 5% → contradicted
 * - 5-15% → partial
 * - No factor linked → untested
 */
export function useHypotheses(options: UseHypothesesOptions = {}): UseHypothesesReturn {
  const { initialHypotheses, onHypothesesChange, anovaByFactor } = options;

  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(initialHypotheses ?? []);

  // Auto-validate statuses when ANOVA changes
  const validatedHypotheses = useMemo(() => {
    return hypotheses.map(h => {
      const computed = computeStatus(h, anovaByFactor);
      return computed !== h.status
        ? { ...h, status: computed, updatedAt: new Date().toISOString() }
        : h;
    });
  }, [hypotheses, anovaByFactor]);

  // Sync validated statuses back if changed
  useMemo(() => {
    if (validatedHypotheses !== hypotheses) {
      const changed = validatedHypotheses.some((vh, i) => vh.status !== hypotheses[i]?.status);
      if (changed) {
        // Note: we don't call setHypotheses here to avoid loops.
        // The validated hypotheses are returned directly.
        // Status auto-updates are reflected in the returned value.
      }
    }
  }, [validatedHypotheses, hypotheses]);

  const update = useCallback(
    (updater: (prev: Hypothesis[]) => Hypothesis[]) => {
      setHypotheses(prev => {
        const next = updater(prev);
        onHypothesesChange?.(next);
        return next;
      });
    },
    [onHypothesesChange]
  );

  const addHypothesis = useCallback(
    (text: string, factor?: string, level?: string): Hypothesis => {
      const hypothesis = createHypothesis(text, factor, level);
      update(prev => [...prev, hypothesis]);
      return hypothesis;
    },
    [update]
  );

  const editHypothesis = useCallback(
    (id: string, updates: Partial<Pick<Hypothesis, 'text' | 'factor' | 'level'>>) => {
      update(prev =>
        prev.map(h => (h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h))
      );
    },
    [update]
  );

  const deleteHypothesis = useCallback(
    (id: string): string[] => {
      const hypothesis = hypotheses.find(h => h.id === id);
      const unlinkedFindingIds = hypothesis?.linkedFindingIds ?? [];
      update(prev => prev.filter(h => h.id !== id));
      return unlinkedFindingIds;
    },
    [hypotheses, update]
  );

  const linkFinding = useCallback(
    (hypothesisId: string, findingId: string) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId && !h.linkedFindingIds.includes(findingId)
            ? {
                ...h,
                linkedFindingIds: [...h.linkedFindingIds, findingId],
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const unlinkFinding = useCallback(
    (hypothesisId: string, findingId: string) => {
      update(prev =>
        prev.map(h =>
          h.id === hypothesisId
            ? {
                ...h,
                linkedFindingIds: h.linkedFindingIds.filter(id => id !== findingId),
                updatedAt: new Date().toISOString(),
              }
            : h
        )
      );
    },
    [update]
  );

  const getHypothesis = useCallback(
    (id: string): Hypothesis | undefined => {
      return validatedHypotheses.find(h => h.id === id);
    },
    [validatedHypotheses]
  );

  const getByFactor = useCallback(
    (factor: string): Hypothesis[] => {
      return validatedHypotheses.filter(h => h.factor === factor);
    },
    [validatedHypotheses]
  );

  return {
    hypotheses: validatedHypotheses,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    linkFinding,
    unlinkFinding,
    getHypothesis,
    getByFactor,
  };
}
