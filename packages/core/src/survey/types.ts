import type { DetectedColumns } from '../parser';
import type { DefectDetection, DefectMapping } from '../defect';
import type { ProcessContext } from '../ai';
import type { Finding, Question, Hypothesis } from '../findings';
import type { DataRow, SpecLimits, WideFormatDetection } from '../types';
import type { YamazumiColumnMapping, YamazumiDetection } from '../yamazumi';
import type { Gap, InferredMode, ModeInferenceResult, ProcessMap } from '../frame';
import type {
  MeasurementStudyStatus,
  SignalPowerStatus,
  SignalSourceArchetype,
  SignalTrustGrade,
} from '../signalCards';

export type SurveyStatus = 'can-do-now' | 'can-do-with-caution' | 'cannot-do-yet' | 'ask-for-next';

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  'can-do-now': 'Can do now',
  'can-do-with-caution': 'Can do with caution',
  'cannot-do-yet': 'Cannot do yet',
  'ask-for-next': 'Ask for next',
};

export type SurveyRecommendationKind =
  | 'collect-data'
  | 'set-specs'
  | 'add-time-batch-axis'
  | 'complete-mapping'
  | 'add-counter-check'
  | 'define-signal';

export const SURVEY_RECOMMENDATION_KIND_LABELS: Record<SurveyRecommendationKind, string> = {
  'collect-data': 'Collect data',
  'set-specs': 'Set specs',
  'add-time-batch-axis': 'Add time/batch axis',
  'complete-mapping': 'Complete mapping',
  'add-counter-check': 'Add counter-check',
  'define-signal': 'Define signal',
};

export type SurveyRecommendationSource =
  | 'data-affordance'
  | 'process-map-gap'
  | 'mechanism-branch'
  | 'signal-definition';

export interface SurveyRecommendationTarget {
  type: 'dataset' | 'column' | 'process-step' | 'branch' | 'map-gap' | 'signal';
  id?: string;
  label?: string;
}

export interface SurveyRecommendation {
  id: string;
  kind: SurveyRecommendationKind;
  title: string;
  detail: string;
  actionText: string;
  status: SurveyStatus;
  priority: number;
  source: SurveyRecommendationSource;
  target?: SurveyRecommendationTarget;
}

export interface SurveyPossibilityItem {
  id: string;
  instrument: string;
  status: SurveyStatus;
  requiredColumns: string[];
  nextUnlock: string;
  detail: string;
  mode?: InferredMode;
}

export interface SurveyPowerItem {
  id: string;
  check: string;
  status: SurveyStatus;
  currentPowerState: string;
  blindSpot: string;
  nextLever: string;
}

export interface SurveyTrustItem {
  id: string;
  signal: string;
  status: SurveyStatus;
  archetype: SignalSourceArchetype | string;
  trustLabel: string;
  weakLink: string;
  operationalDefinition: string;
  signalCardId?: string;
  trustGrade?: SignalTrustGrade;
  powerStatus?: SignalPowerStatus;
  studyStatus?: MeasurementStudyStatus;
}

export interface SurveySection<TItem> {
  overallStatus: SurveyStatus;
  items: TItem[];
}

export interface SurveyDiagnostics {
  rowCount: number;
  columns: string[];
  selected: {
    outcomeColumn?: string;
    factorColumns: string[];
    timeColumn?: string;
  };
  detectedColumns: DetectedColumns;
  wideFormat: WideFormatDetection;
  yamazumi: YamazumiDetection;
  defect: DefectDetection;
  inferredMode: ModeInferenceResult;
  gaps: Gap[];
}

export interface SurveyEvaluation {
  possibility: SurveySection<SurveyPossibilityItem>;
  power: SurveySection<SurveyPowerItem>;
  trust: SurveySection<SurveyTrustItem>;
  recommendations: SurveyRecommendation[];
  diagnostics: SurveyDiagnostics;
}

export interface SurveyEvaluationInput {
  data?: DataRow[];
  outcomeColumn?: string | null;
  factorColumns?: string[];
  timeColumn?: string | null;
  specs?: SpecLimits;
  yamazumiMapping?: YamazumiColumnMapping | null;
  defectMapping?: DefectMapping | null;
  processMap?: ProcessMap;
  processContext?: Pick<
    ProcessContext,
    'processMap' | 'description' | 'measurement' | 'signalCards'
  >;
  questions?: Question[];
  findings?: Finding[];
  branches?: Hypothesis[];
}

// ============================================================================
// Survey rule layer (RPS V1 — cross-phase methodology rules per §256)
//
// This is the SECOND API surface in this module. The first (above) is the
// data-affordance evaluator: `evaluateSurvey()` returns `SurveyEvaluation`
// with possibility/power/trust/recommendations — used in the FRAME dance.
//
// The rule layer (below) is for cross-phase methodology rules. Domain rule
// modules (wall.ts, improvementProject.ts, sustainment.ts, handoff.ts,
// inbox.ts) each export a `SurveyRule` that accepts a `SurveyContext` and
// emits `SurveyHint[]`. Both implement Survey per methodology.md §256.
// ============================================================================

/**
 * Category tag for a Survey hint — maps to one of the 6 V1 Survey rule
 * categories in spec §5.
 */
export type SurveyHintKind =
  | 'status-derivation'
  | 'data-collection'
  | 'triangulation-readiness'
  | 'power-warning'
  | 'drift-detection'
  | 'lifecycle-gap';

/**
 * A single methodology nudge emitted by a Survey rule.
 * Rendered inline on the relevant surface and/or in the Survey Inbox.
 */
export interface SurveyHint {
  kind: SurveyHintKind;
  surface: 'wall' | 'improvementProject' | 'sustainment' | 'handoff' | 'inbox';
  /** ID of the entity this hint targets (hypothesisId, ipId, etc.) */
  targetEntityId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  /** Optional concrete action affordance */
  action?: { label: string; opensSurface?: string; opensId?: string };
}

/**
 * Runtime context passed to every Survey rule. Fields are optional to allow
 * rules that only need a subset of context to be called without providing
 * irrelevant data.
 *
 * Note: `improvementProjects` is intentionally absent from V1 — the
 * `ImprovementProject` type is added in PR-RPS-5. The Wall rule (Task 8)
 * does not consume it. PR-RPS-5 will extend this interface when it adds
 * the IP types.
 */
export interface SurveyContext {
  hub: import('../processHub').ProcessHub;
  hypotheses?: Hypothesis[];
  findings?: Finding[];
}

/**
 * A Survey rule: pure function from context to hints.
 * Rules must be deterministic and free of side effects.
 */
export type SurveyRule = (ctx: SurveyContext) => SurveyHint[];
