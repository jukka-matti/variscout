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
import type { YamazumiBarData } from '@variscout/core/yamazumi';
import { generateYamazumiQuestions } from '@variscout/core/yamazumi';
import type { ChannelInput } from '@variscout/core/stats';
import { generateChannelRankingQuestions } from '@variscout/core/stats';
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
  /** Yamazumi bar data — when mode is 'yamazumi' and this is provided, routes to yamazumi generator */
  yamazumiData?: YamazumiBarData[];
  /** Optional takt time for takt compliance questions (yamazumi mode only) */
  taktTime?: number;
  /** Channel capability data — when mode is 'performance' and this is provided, routes to channel ranking generator */
  channelData?: ChannelInput[];
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
  yamazumiData,
  taktTime,
  channelData,
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

    // Route question generation based on analysis mode
    const generated = generateForMode(mode, bestSubsets, channelData, yamazumiData, taktTime);
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
    yamazumiData,
    taktTime,
    channelData,
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
    // Only questions with meaningful evidence (eta-squared >= 5%) qualify —
    // this prevents noisy follow-ups for weak effects.
    const ETA_THRESHOLD = 0.05;
    const supportedL1 = allQuestions.filter(
      q =>
        q.questionSource === 'factor-intel' &&
        q.status === 'answered' &&
        (q.evidence?.etaSquared ?? 0) >= ETA_THRESHOLD &&
        !spawnedFollowUpsRef.current.has(q.id)
    );

    if (supportedL1.length === 0) return;

    // L2 main-effect follow-ups: spawn when any qualifying L1 is answered
    const l2FollowUps = generateFollowUpQuestions(mainEffects, null);

    // L3 interaction follow-ups: only when >= 2 L1 questions are answered
    // with sufficient evidence (the analyst has explored multiple factors)
    const allAnsweredL1WithEvidence = allQuestions.filter(
      q =>
        q.questionSource === 'factor-intel' &&
        q.status === 'answered' &&
        (q.evidence?.etaSquared ?? 0) >= ETA_THRESHOLD
    );
    const l3FollowUps =
      allAnsweredL1WithEvidence.length >= 2
        ? generateFollowUpQuestions(null, interactionEffects, {
            screenResults: bestSubsets?.subsets[0]?.interactionScreenResults,
          })
        : [];

    const followUps = [...l2FollowUps, ...l3FollowUps];
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
 * Select and invoke the appropriate question generator for the given analysis mode.
 *
 * Mode-specific generators are gated on data availability — if the required data
 * is absent (e.g., channelData not yet loaded for 'performance' mode), the function
 * falls back to the statistical Best Subsets ranking generator. This mirrors the
 * declarative dispatch pattern in analysisStrategy.ts (ADR-047).
 */
function generateForMode(
  mode: ResolvedMode | undefined,
  bestSubsets: BestSubsetsResult | null,
  channelData: ChannelInput[] | undefined,
  yamazumiData: YamazumiBarData[] | undefined,
  taktTime: number | undefined
): GeneratedQuestion[] {
  if (mode === 'performance' && channelData?.length) {
    return generateChannelRankingQuestions(channelData);
  }
  if (mode === 'yamazumi' && yamazumiData?.length) {
    return generateYamazumiQuestions(yamazumiData, taktTime);
  }
  // Default: Best Subsets ranking (standard, capability, or fallback when mode data unavailable).
  // bestSubsets is guaranteed non-null by the useEffect guard in the calling hook.
  if (!bestSubsets) return [];
  const base = generateQuestionsFromRanking(bestSubsets, { mode });
  const continuous = generateContinuousFactorQuestions(bestSubsets);
  return [...base, ...continuous];
}

/**
 * Generate curve-shape and optimal-value questions for continuous factors in the
 * best model. These questions complement the standard single-factor/combination
 * questions and are only generated when the best model uses OLS with continuous
 * predictors.
 *
 * - 'curve-shape': generated for continuous factors when a quadratic term was
 *   detected (p < 0.10 for the quadratic predictor). Auto-answered 'ruled-out'
 *   when the quadratic p-value exceeds 0.10 (relationship is linear).
 * - 'optimal-value': generated for continuous factors when a sweet spot was
 *   detected (quadratic term present and significant).
 *
 * Does not break existing categorical-only question generation: if no continuous
 * factors exist, returns an empty array.
 */
function generateContinuousFactorQuestions(result: BestSubsetsResult): GeneratedQuestion[] {
  if (!result.usedOLS || !result.subsets.length) return [];

  const bestSubset = result.subsets[0];
  if (!bestSubset.predictors || !bestSubset.factorTypes) return [];

  const questions: GeneratedQuestion[] = [];

  // Collect continuous factors from the best model
  for (const [factorName, factorType] of bestSubset.factorTypes.entries()) {
    if (factorType !== 'continuous') continue;

    // Find linear and quadratic predictors for this factor
    const linearPredictor = bestSubset.predictors.find(
      p => p.factorName === factorName && p.type === 'continuous'
    );
    const quadraticPredictor = bestSubset.predictors.find(
      p => p.factorName === factorName && p.type === 'quadratic'
    );

    // Quadratic p-value threshold for "curve detected"
    const QUADRATIC_P_THRESHOLD = 0.1;
    const hasQuadratic = quadraticPredictor !== undefined;
    const quadraticSignificant = hasQuadratic && quadraticPredictor!.pValue < QUADRATIC_P_THRESHOLD;

    // R²adj from the single-factor subset (for evidence ranking)
    const singleFactorSubset = result.subsets.find(
      s => s.factorCount === 1 && s.factors[0] === factorName
    );
    const rSquaredAdj = singleFactorSubset?.rSquaredAdj ?? bestSubset.rSquaredAdj;

    // 'curve-shape' question: generated for all continuous factors in the best model.
    // Auto-answered as 'ruled-out' (linear) when quadratic p > 0.10.
    const isLinear = hasQuadratic && !quadraticSignificant;
    questions.push({
      text: `Is ${factorName} relationship linear or curved?`,
      factors: [factorName],
      rSquaredAdj,
      autoAnswered: isLinear,
      ...(isLinear ? { autoStatus: 'ruled-out' as const } : {}),
      source: 'factor-intel',
      type: 'curve-shape',
    });

    // 'optimal-value' question: only when a quadratic term is present and significant
    // (indicates a sweet spot / optimal operating point exists).
    if (quadraticSignificant && linearPredictor !== undefined) {
      questions.push({
        text: `What's the optimal ${factorName}?`,
        factors: [factorName],
        rSquaredAdj,
        autoAnswered: false,
        source: 'factor-intel',
        type: 'optimal-value',
      });
    }
  }

  return questions;
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
