import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataRow, Question } from '@variscout/core';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { ResolvedMode } from '@variscout/core/strategy';
import {
  computeBestSubsets,
  computeMainEffects,
  computeInteractionEffects,
  generateQuestionsFromRanking,
  generateFollowUpQuestions,
} from '@variscout/core/stats';
import type { GeneratedQuestion } from '@variscout/core/stats';
import type { UseQuestionsReturn } from './useQuestions';

export interface UseQuestionGenerationOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome (Y) column name */
  outcome: string | null | undefined;
  /** Factor column names */
  factors: string[];
  /** Questions state (for generateInitialQuestions + question click) */
  questionsState: Pick<
    UseQuestionsReturn,
    'questions' | 'generateInitialQuestions' | 'setFocusedQuestion'
  >;
  /** Current analysis mode for question wording */
  mode?: ResolvedMode;
  /** Whether question generation is enabled (e.g., false during FRAME) */
  enabled?: boolean;
}

export interface UseQuestionGenerationReturn {
  /** Computed best subsets result (null if not enough factors) */
  bestSubsets: BestSubsetsResult | null;
  /** Questions generated from Factor Intelligence (Question objects with questionSource) */
  questions: Question[];
  /** Whether Factor Intelligence is available (≥2 factors + outcome + data) */
  hasFactorIntelligence: boolean;
  /** Request a factor switch on the dashboard (from question click) */
  handleQuestionClick: (question: Question) => void;
  /** Current factor request (pass to Dashboard's requestedFactor prop) */
  factorRequest: { factor: string; seq: number } | null;
}

/**
 * Computes Factor Intelligence (best subsets) and auto-generates investigation
 * questions from the ranking. Questions are generated once per unique factor set
 * and persisted as Question objects via generateInitialQuestions().
 *
 * Used by both Azure and PWA apps to wire the question-driven EDA pipeline.
 */
export function useQuestionGeneration({
  filteredData,
  outcome,
  factors,
  questionsState,
  mode,
  enabled = true,
}: UseQuestionGenerationOptions): UseQuestionGenerationReturn {
  const hasFactorIntelligence =
    enabled && factors.length >= 2 && !!outcome && filteredData.length > 0;

  // Extract stable references from questionsState to avoid object-identity deps
  const { questions: allQuestions, generateInitialQuestions } = questionsState;

  // Compute best subsets (independent computation — Azure's PIPanel avoids
  // double work via precomputedBestSubsets prop; PWA may compute twice but
  // the cost is negligible with ≤3 factors)
  const bestSubsets = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeBestSubsets(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  // Track which factor fingerprint we've already generated questions for
  // to avoid re-generating on every render
  const generatedForRef = useRef<string | null>(null);

  // Generate questions when bestSubsets first becomes available (or factors change)
  useEffect(() => {
    if (!bestSubsets || !hasFactorIntelligence) return;

    // Create a stable fingerprint of the current factor set + data size
    const fingerprint = `${factors.slice().sort().join(',')}:${filteredData.length}:${outcome}`;

    // Already generated for this exact configuration
    if (generatedForRef.current === fingerprint) return;

    // Check if questions already exist from a previous session (persistence)
    const existingQuestions = allQuestions.filter(q => q.questionSource === 'factor-intel');
    if (existingQuestions.length > 0) {
      // Questions already loaded from persistence — don't regenerate
      generatedForRef.current = fingerprint;
      return;
    }

    // Generate questions from best subsets ranking
    const generated = generateQuestionsFromRanking(bestSubsets, { mode });
    if (generated.length > 0) {
      generateInitialQuestions(generated);
    }

    generatedForRef.current = fingerprint;
  }, [
    bestSubsets,
    hasFactorIntelligence,
    factors,
    filteredData.length,
    outcome,
    mode,
    allQuestions,
    generateInitialQuestions,
  ]);

  // --- Layer 2-3 follow-up question spawning ---
  // Compute main effects and interactions for follow-up questions
  const mainEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeMainEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  const interactionEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeInteractionEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  // Track which supported questions already spawned follow-ups
  const spawnedFollowUpsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hasFactorIntelligence || !mainEffects) return;

    // Find supported Layer 1 questions that haven't spawned follow-ups yet.
    // Layer 1 questions are single-factor or combination — they don't have
    // main-effect or interaction types. We identify L1 by checking that the
    // question text doesn't match the known L2-3 patterns (generated by
    // generateFollowUpQuestions, which always includes "specifically" for L2
    // and "interact" for L3).
    const supportedL1 = allQuestions.filter(
      q =>
        q.questionSource === 'factor-intel' &&
        q.status === 'answered' &&
        !spawnedFollowUpsRef.current.has(q.id)
    );

    if (supportedL1.length === 0) return;

    // Generate follow-up questions from main effects and interactions
    const followUps = generateFollowUpQuestions(mainEffects, interactionEffects);
    if (followUps.length === 0) return;

    // Deduplicate: check if a follow-up with the same factor(s) and type already exists
    const newFollowUps = followUps.filter(q => !isFollowUpAlreadyPresent(q, allQuestions));

    if (newFollowUps.length > 0) {
      generateInitialQuestions(newFollowUps);
    }

    // Mark these questions as having spawned follow-ups
    for (const q of supportedL1) {
      spawnedFollowUpsRef.current.add(q.id);
    }
  }, [
    allQuestions,
    hasFactorIntelligence,
    mainEffects,
    interactionEffects,
    generateInitialQuestions,
  ]);

  // --- Question click → dashboard factor switch ---
  const factorSeqRef = useRef(0);
  const [factorRequest, setFactorRequest] = useState<{ factor: string; seq: number } | null>(null);

  const handleQuestionClick = useCallback(
    (question: Question) => {
      if (question.factor) {
        factorSeqRef.current += 1;
        setFactorRequest({ factor: question.factor, seq: factorSeqRef.current });
      }
      questionsState.setFocusedQuestion(question.id);
    },
    [questionsState]
  );

  // Derive the current questions from allQuestions (factor-intel sourced)
  const questions = useMemo(
    () => allQuestions.filter(q => q.questionSource === 'factor-intel'),
    [allQuestions]
  );

  return {
    bestSubsets,
    questions,
    hasFactorIntelligence,
    handleQuestionClick,
    factorRequest,
  };
}

/**
 * Check if a follow-up question already exists in the questions list.
 * Uses factor name(s) and question type for deduplication rather than text matching.
 */
function isFollowUpAlreadyPresent(q: GeneratedQuestion, questions: Question[]): boolean {
  const factorIntel = questions.filter(qi => qi.questionSource === 'factor-intel');

  if (q.type === 'main-effect') {
    // A main-effect follow-up targets a single factor's worst level.
    // Check if we already have a question for the same factor with a level.
    return factorIntel.some(qi => qi.factor === q.factors[0] && qi.level != null);
  }

  if (q.type === 'interaction') {
    // An interaction follow-up targets a pair of factors.
    // Check if we already have a question that references both factors.
    return factorIntel.some(
      qi => qi.factor === q.factors[0] && qi.evidence?.etaSquared != null // Interaction questions use deltaR² stored as etaSquared
    );
  }

  return false;
}
