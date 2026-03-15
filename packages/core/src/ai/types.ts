/**
 * AI integration types for VariScout
 */

import type { InsightChartType } from './chartInsights';

/** Target metric type for improvement tracking */
export type TargetMetric = 'mean' | 'sigma' | 'cpk' | 'yield' | 'passRate';

/** Investigation phase for CoScout context (deterministic detection) */
export type InvestigationPhase = 'initial' | 'diverging' | 'validating' | 'converging' | 'acting';

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
      hypothesis?: string;
      projection?: { meanDelta: number; sigmaDelta: number };
      actions?: Array<{ text: string; status: string }>;
    };
    allHypotheses?: Array<{
      text: string;
      status: string;
      contribution?: number;
      ideas?: Array<{
        text: string;
        selected?: boolean;
        projection?: { meanDelta: number; sigmaDelta: number };
      }>;
    }>;
    /** Hypothesis tree structure for investigation phase detection */
    hypothesisTree?: Array<{
      text: string;
      status: string;
      factor?: string;
      /** Dynamic category name (from InvestigationCategory) */
      category?: string;
      validationType?: string;
      children?: Array<{ text: string; status: string; validationType?: string }>;
    }>;
    /** Current investigation phase (deterministic) */
    phase?: 'initial' | 'diverging' | 'validating' | 'converging' | 'acting';
    /** Investigation categories for completeness prompting */
    categories?: Array<{ name: string; factorNames: string[] }>;
  };
  /** Focus context from "Ask CoScout about this" actions */
  focusContext?: {
    chartType?: InsightChartType;
    category?: { name: string; mean?: number; contributionPct?: number };
    finding?: { text: string; status: string; hypothesis?: string };
  };
  /** Team contributor awareness (Teams plan only) */
  teamContributors?: {
    count: number;
    hypothesisAreas: string[];
  };
  /** Glossary terms for grounding */
  glossaryFragment?: string;
}

/** Request to generate a narration */
export interface NarrationRequest {
  context: AIContext;
  /** Type of narration to generate */
  type: 'summary' | 'chart-insight' | 'finding-suggestion';
}

/** Response from narration generation */
export interface NarrationResponse {
  text: string;
  /** Whether this came from cache */
  cached: boolean;
  /** Timestamp of generation */
  generatedAt: number;
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
