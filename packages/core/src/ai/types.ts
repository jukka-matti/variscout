/**
 * AI integration types for VariScout
 */

import type { InsightChartType } from './chartInsights';
import type { Locale } from '../i18n/types';
import type { AnalysisMode } from '../types';
import type { ProcessMap } from '../frame/types';

/** AI model tier — maps to ARM deployment names ('fast' or 'reasoning') */
export type AITier = 'fast' | 'reasoning';

/** Target metric type for improvement tracking */
export type TargetMetric = 'mean' | 'sigma' | 'cpk' | 'yield' | 'passRate';

/** What prompted the analyst to start this analysis */
export type EntryScenario = 'problem' | 'exploration' | 'routine';

/** Investigation phase for CoScout context (deterministic detection) */
export type InvestigationPhase =
  | 'initial'
  | 'diverging'
  | 'validating'
  | 'converging'
  | 'improving';

/** High-level analysis journey phase (doc-canonical, code-detected) */
export type JourneyPhase = 'frame' | 'scout' | 'investigate' | 'improve';

/** Process context provided by the user for AI grounding */
export interface ProcessContext {
  /** Free-text description of the process (max 500 chars) */
  description?: string;
  /** Product or part being measured */
  product?: string;
  /** Measurement being analyzed */
  measurement?: string;
  /** Issue statement: the initial concern being investigated (max 500 chars) */
  issueStatement?: string;
  /** Problem statement: precise output answering Watson's 3 questions (measure, direction, scope) */
  problemStatement?: string;
  /** Suspected causes from question-driven investigation, ranked by evidence */
  suspectedCauses?: Array<{
    factor: string;
    level?: string;
    evidence: number;
    role: 'suspected-cause' | 'contributing' | 'ruled-out';
  }>;
  /** Target metric for improvement tracking */
  targetMetric?: TargetMetric;
  /** Target value for the chosen metric */
  targetValue?: number;
  /** Direction of improvement relative to target */
  targetDirection?: 'minimize' | 'maximize' | 'target';
  /** Factor role classifications derived from investigation categories */
  factorRoles?: Record<string, string>;
  /** Convergence synthesis — suspected cause narrative (max 500 chars) */
  synthesis?: string;
  /**
   * User-built visual Process Map (FRAME workspace).
   *
   * Captures process structure (SIPOC spine), CTS (ocean), CTQs per step,
   * tributaries/xs, rational-subgroup axes, and pre-data hunches. Drives
   * deterministic mode inference + gap detection (see `frame/modeInference.ts`
   * and `frame/gapDetector.ts`). Null for mapless projects. ADR-070.
   */
  processMap?: ProcessMap;
}

/** Structured AI context assembled from current analysis state */
export interface AIContext {
  /** Process context from user */
  process: ProcessContext;
  /** Currently active/focused chart */
  activeChart?: InsightChartType;
  /** Current statistics snapshot */
  stats?: {
    mean: number;
    stdDev: number;
    samples: number;
    cpk?: number;
    cp?: number;
    passRate?: number;
  };
  /** Active filters and their categories */
  filters: Array<{
    factor: string;
    values: (string | number)[];
    /** Dynamic category name (from InvestigationCategory) */
    category?: string;
  }>;
  /** Control/spec violations */
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
    nelsonRule2Count?: number;
    nelsonRule3Count?: number;
  };
  /** Variation contributions per factor (η²) */
  variationContributions?: Array<{
    factor: string;
    etaSquared: number;
    category?: string;
    /** Factor measurement type classification */
    factorType?: 'categorical' | 'continuous';
    /** Detected relationship shape for continuous factors */
    relationship?: 'linear' | 'quadratic';
    /** Estimated optimum value for quadratic factors (vertex x-coordinate) */
    optimum?: number;
  }>;
  /** Drill path: ordered factor names from filter stack */
  drillPath?: string[];
  /** Enriched drill path with scope fractions (when available from useDrillPath) */
  drillPathEnriched?: Array<{ factor: string; values: string[]; scopeFraction: number }>;
  /** Cumulative scope fraction (0-1) from drill path */
  cumulativeScope?: number;
  /** Summary of findings */
  findings?: {
    total: number;
    byStatus: Record<string, number>;
    keyDrivers: string[];
    /** Insights previously saved from CoScout conversations (source.chart === 'coscout') */
    coscoutInsights?: Array<{ text: string; status: string }>;
    /** Top findings with full detail for CoScout context */
    topFindings?: Array<{
      id: string;
      text: string;
      status: string;
      commentCount: number;
      outcome?: { effective: 'yes' | 'no' | 'partial'; cpkDelta?: number };
    }>;
    /** Actions that are past their due date */
    overdueActions?: Array<{
      text: string;
      assignee?: string;
      daysOverdue: number;
      findingId: string;
    }>;
  };
  /** Investigation context (for investigation page CoScout) */
  investigation?: {
    issueStatement?: string;
    targetMetric?: TargetMetric;
    targetValue?: number;
    currentValue?: number;
    progressPercent?: number;
    selectedFinding?: {
      text: string;
      status?: string;
      question?: string;
      projection?: { meanDelta: number; sigmaDelta: number };
      actions?: Array<{ text: string; status: string; overdue?: boolean }>;
      actionProgress?: {
        total: number;
        done: number;
        overdueCount: number;
      };
    };
    allQuestions?: Array<{
      id: string;
      text: string;
      status: string;
      contribution?: number;
      /** Source of this question */
      questionSource?: 'factor-intel' | 'heuristic' | 'coscout' | 'analyst';
      /** Cause role from question-driven investigation */
      causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
      /** Free-text note added by the analyst */
      manualNote?: string;
      /** IDs of findings linked to this question */
      linkedFindingIds?: string[];
      ideas?: Array<{
        text: string;
        selected?: boolean;
        projection?: { meanDelta: number; sigmaDelta: number };
        direction?: 'prevent' | 'detect' | 'simplify' | 'eliminate';
        /** Implementation timeframe category */
        timeframe?: string;
        /** Risk level category */
        riskLevel?: string;
      }>;
    }>;
    /** Question tree structure for investigation phase detection */
    questionTree?: Array<{
      id: string;
      text: string;
      status: string;
      factor?: string;
      /** Dynamic category name (from InvestigationCategory) */
      category?: string;
      validationType?: string;
      children?: Array<{
        text: string;
        status: string;
        validationType?: string;
        factor?: string;
        level?: string;
        ideas?: Array<{ text: string; selected?: boolean }>;
        validationTask?: string;
        taskCompleted?: boolean;
      }>;
    }>;
    /** Current investigation phase (deterministic) */
    phase?: 'initial' | 'diverging' | 'validating' | 'converging' | 'improving';
    /** Previous investigation phase — when set and different from phase, triggers a transition announcement */
    previousPhase?: 'initial' | 'diverging' | 'validating' | 'converging' | 'improving';
    /** Human-readable reason for the phase transition (shown in CoScout context block) */
    transitionReason?: string;
    /** Investigation categories for completeness prompting */
    categories?: Array<{ name: string; factorNames: string[] }>;
    /** Suspected causes from questions with causeRole (supports multiple) */
    suspectedCauses?: Array<{
      id: string;
      text: string;
      causeRole: 'suspected-cause' | 'contributing' | 'ruled-out';
      factor?: string;
      status: string;
      evidence?: { rSquaredAdj?: number; etaSquared?: number };
    }>;
    /** Structured problem statement synthesized from Watson's 3 questions */
    problemStatement?: {
      measure?: string;
      direction?: string;
      scope?: string;
      fullText?: string;
    };
    /** ID of the question currently in focus in the PI panel */
    focusedQuestionId?: string;
    /** Text of the question currently in focus in the PI panel */
    focusedQuestionText?: string;
    /** Suspected cause hubs (Phase 6 — distinct from legacy causeRole-based suspectedCauses) */
    suspectedCauseHubs?: Array<{
      id: string;
      name: string;
      synthesis: string;
      status: string;
      questionCount: number;
      findingCount: number;
      evidence?: {
        value: number;
        label: string;
        description: string;
      };
      selectedForImprovement?: boolean;
    }>;
    /** Existing causal links between factors (prevents duplicate suggestions) */
    causalLinks?: Array<{
      id: string;
      fromFactor: string;
      toFactor: string;
      direction: 'drives' | 'modulates' | 'confounds';
      evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
    }>;
    /** Significant interaction effects for map-aware suggestions */
    interactionEffects?: Array<{
      factors: [string, string];
      pattern: 'ordinal' | 'disordinal';
      deltaRSquaredAdj: number;
      pValue: number;
      plainLanguage: string;
    }>;
    /** Evidence Map topology for graph-aware CoScout reasoning */
    evidenceMapTopology?: {
      factorNodes: Array<{
        factor: string;
        rSquaredAdj: number;
        explored: boolean;
        questionCount: number;
        findingCount: number;
        /** Factor measurement type: categorical (group comparison) or continuous (regression) */
        type?: 'categorical' | 'continuous';
        /** Value range [min, max] for continuous factors */
        range?: [number, number];
        /** Detected relationship shape for continuous factors */
        relationship?: 'linear' | 'quadratic';
        /** Estimated optimum value (quadratic vertex) for continuous factors with sweet spot */
        optimum?: number;
      }>;
      relationships: Array<{
        factorA: string;
        factorB: string;
        type: string;
        strength: number;
      }>;
      convergencePoints: Array<{
        factor: string;
        incomingCount: number;
        hubName?: string;
        hubStatus?: string;
      }>;
    };
    /** R²adj-weighted coverage percentage (0-100) */
    coveragePercent?: number;
    /** Number of questions checked (answered or ruled-out) */
    questionsChecked?: number;
    /** Total number of questions */
    questionsTotal?: number;
    /** Problem statement maturity stage */
    problemStatementStage?: 'partial' | 'actionable' | 'with-causes';
    /** Live problem statement text (auto-synthesized) */
    liveStatement?: string;
  };
  /** Focus context from "Ask CoScout about this" actions */
  focusContext?: {
    chartType?: InsightChartType;
    category?: { name: string; mean?: number; etaSquaredPct?: number };
    finding?: {
      text: string;
      status: string;
      question?: string;
      ideas?: Array<{ text: string; selected?: boolean }>;
    };
  };
  /** Team contributor awareness (Teams plan only) */
  teamContributors?: {
    count: number;
    questionAreas: string[];
  };
  /** Glossary terms for grounding */
  glossaryFragment?: string;
  /** Staged comparison metrics (when staged data detected) */
  stagedComparison?: {
    stageNames: string[];
    deltas: {
      meanShift: number;
      variationRatio: number;
      cpkDelta: number | null;
      passRateDelta: number | null;
      outOfSpecReduction: number;
    };
    colorCoding: Record<string, 'green' | 'red' | 'amber'>;
    cpkBefore?: number;
    cpkAfter?: number;
  };
  /** Related findings from Knowledge Base (AI Search) */
  knowledgeResults?: Array<{
    projectName: string;
    factor: string;
    status: string;
    etaSquared: number | null;
    cpkBefore: number | null;
    cpkAfter: number | null;
    suspectedCause: string;
    actionsText: string;
    outcomeEffective: boolean | null;
  }>;
  /** What prompted the analyst to start this analysis (for tool routing) */
  entryScenario?: EntryScenario;
  /** Active locale for AI response language */
  locale?: Locale;
  /** Current analysis mode */
  analysisMode?: AnalysisMode;
  /** Subgroup capability summary (when in capability mode) */
  capabilityStability?: {
    method: 'column' | 'fixed-size';
    column?: string;
    subgroupSize?: number;
    subgroupCount: number;
    meanCpk: number;
    minCpk: number;
    maxCpk: number;
    cpkInControl: number;
    cpkOutOfControl: number;
    meanCp?: number;
    centeringLoss?: number;
    cpkTarget?: number;
    subgroupsMeetingTarget?: number;
  };
  /** Yamazumi summary for time study context */
  yamazumi?: {
    vaRatio: number;
    processEfficiency: number;
    totalLeadTime: number;
    wasteTime: number;
    waitTime: number;
    taktTime?: number;
    stepsOverTakt: string[];
  };
  /** Documents from Knowledge Base agentic retrieval (SharePoint, SOPs) */
  knowledgeDocuments?: Array<{
    title: string;
    snippet: string;
    source: string;
    url?: string;
  }>;
  /** Best model equation summary from best subsets analysis */
  bestModelEquation?: {
    factors: string[];
    rSquaredAdj: number;
    levelEffects: Record<string, Record<string, number>>;
    worstCase: { levels: Record<string, string>; predicted: number };
    bestCase: { levels: Record<string, string>; predicted: number };
  };
}

/** AI error classification */
export type AIErrorType =
  | 'auth'
  | 'rate-limit'
  | 'network'
  | 'server'
  | 'content-filter'
  | 'unknown';

/** Image attachment on a CoScout message (session-scoped) */
export interface ImageAttachment {
  /** Unique ID for this image */
  id: string;
  /** Base64 data URL (session-scoped, not persisted) */
  dataUrl: string;
  /** MIME type */
  mimeType: 'image/jpeg' | 'image/png';
  /** Original filename if available */
  filename?: string;
  /** File size in bytes */
  sizeBytes: number;
}

/** CoScout conversation message */
export interface CoScoutMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: CoScoutError;
  /** Image attachments (session-scoped, not persisted) */
  images?: ImageAttachment[];
}

/** Error attached to a CoScout message */
export interface CoScoutError {
  type: AIErrorType;
  message: string;
  retryable: boolean;
}
