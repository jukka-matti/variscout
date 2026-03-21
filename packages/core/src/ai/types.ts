/**
 * AI integration types for VariScout
 */

import type { InsightChartType } from './chartInsights';
import type { Locale } from '../i18n/types';
import type { AnalysisMode } from '../types';

/** AI model tier — maps to ARM deployment names ('fast' or 'reasoning') */
export type AITier = 'fast' | 'reasoning';

/** Target metric type for improvement tracking */
export type TargetMetric = 'mean' | 'sigma' | 'cpk' | 'yield' | 'passRate';

/** What prompted the analyst to start this analysis */
export type EntryScenario = 'problem' | 'hypothesis' | 'routine';

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
  /** Problem statement: why this analysis is being done (max 500 chars) */
  problemStatement?: string;
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
  variationContributions?: Array<{ factor: string; etaSquared: number; category?: string }>;
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
  };
  /** Investigation context (for investigation page CoScout) */
  investigation?: {
    problemStatement?: string;
    targetMetric?: TargetMetric;
    targetValue?: number;
    currentValue?: number;
    progressPercent?: number;
    selectedFinding?: {
      text: string;
      status?: string;
      hypothesis?: string;
      projection?: { meanDelta: number; sigmaDelta: number };
      actions?: Array<{ text: string; status: string; overdue?: boolean }>;
      actionProgress?: {
        total: number;
        done: number;
        overdueCount: number;
      };
    };
    allHypotheses?: Array<{
      id: string;
      text: string;
      status: string;
      contribution?: number;
      ideas?: Array<{
        text: string;
        selected?: boolean;
        projection?: { meanDelta: number; sigmaDelta: number };
        direction?: 'prevent' | 'detect' | 'simplify' | 'eliminate';
      }>;
    }>;
    /** Hypothesis tree structure for investigation phase detection */
    hypothesisTree?: Array<{
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
    /** Investigation categories for completeness prompting */
    categories?: Array<{ name: string; factorNames: string[] }>;
    /** Suspected root cause (primary + contributing hypotheses with causeRole) */
    suspectedCause?: {
      primary?: { text: string; factor?: string; status: string };
      contributing: Array<{ text: string; factor?: string; status: string }>;
    };
  };
  /** Focus context from "Ask CoScout about this" actions */
  focusContext?: {
    chartType?: InsightChartType;
    category?: { name: string; mean?: number; contributionPct?: number };
    finding?: {
      text: string;
      status: string;
      hypothesis?: string;
      ideas?: Array<{ text: string; selected?: boolean }>;
    };
  };
  /** Team contributor awareness (Teams plan only) */
  teamContributors?: {
    count: number;
    hypothesisAreas: string[];
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
    method: 'column' | 'fixed-size' | 'time-interval';
    column?: string;
    subgroupSize?: number;
    granularity?: string;
    subgroupCount: number;
    meanCpk: number;
    minCpk: number;
    maxCpk: number;
    cpkInControl: number;
    cpkOutOfControl: number;
    meanCp?: number;
    centeringLoss?: number;
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
}

/** AI error classification */
export type AIErrorType =
  | 'auth'
  | 'rate-limit'
  | 'network'
  | 'server'
  | 'content-filter'
  | 'unknown';

/** CoScout conversation message */
export interface CoScoutMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: CoScoutError;
}

/** Error attached to a CoScout message */
export interface CoScoutError {
  type: AIErrorType;
  message: string;
  retryable: boolean;
}
