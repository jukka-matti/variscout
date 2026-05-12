/**
 * Survey module — two coexisting API surfaces per methodology.md §256.
 *
 * Surface 1 — Data-affordance evaluator (FRAME dance):
 *   `evaluateSurvey()` → `SurveyEvaluation`
 *   Assesses possibility / power / trust and emits `SurveyRecommendation[]`
 *   based on the current dataset shape and column configuration.
 *
 * Surface 2 — Cross-phase rule registry (RPS V1):
 *   Domain rule modules (wall.ts, improvementProject.ts, sustainment.ts,
 *   handoff.ts, inbox.ts) each export a `SurveyRule` that accepts a
 *   `SurveyContext` and emits `SurveyHint[]`. Rules are pure functions;
 *   the registry is assembled by the Survey Inbox orchestrator at runtime.
 *
 * Both surfaces implement Survey as defined in methodology.md §256.
 */

// --- Surface 1: data-affordance evaluator ---
export { evaluateSurvey } from './evaluator';
export type {
  SurveyDiagnostics,
  SurveyEvaluation,
  SurveyEvaluationInput,
  SurveyPossibilityItem,
  SurveyPowerItem,
  SurveyRecommendation,
  SurveyRecommendationKind,
  SurveyRecommendationSource,
  SurveyRecommendationTarget,
  SurveySection,
  SurveyStatus,
  SurveyTrustItem,
} from './types';
export { SURVEY_RECOMMENDATION_KIND_LABELS, SURVEY_STATUS_LABELS } from './types';

// --- Surface 2: cross-phase rule registry ---
export { surveyWallRules, deriveHypothesisStatus } from './wall';
export { surveySustainmentRules } from './sustainment';
export { surveyInboxRules } from './inbox';
export type { SurveyInboxPrompt } from './inbox';
export type { SurveyHint, SurveyRule, SurveyContext, SurveyHintKind } from './types';
