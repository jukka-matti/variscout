/**
 * AI integration types for VariScout
 */

/** Factor role for AI context grounding */
export type FactorRole =
  | 'equipment'
  | 'temporal'
  | 'operator'
  | 'material'
  | 'location'
  | 'unknown';

/** Process context provided by the user for AI grounding */
export interface ProcessContext {
  /** Free-text description of the process (max 500 chars) */
  description?: string;
  /** Product or part being measured */
  product?: string;
  /** Measurement being analyzed */
  measurement?: string;
}

/** Structured AI context assembled from current analysis state */
export interface AIContext {
  /** Process context from user */
  process: ProcessContext;
  /** Current statistics snapshot */
  stats?: {
    mean: number;
    stdDev: number;
    samples: number;
    cpk?: number;
    cp?: number;
    passRate?: number;
  };
  /** Active filters and their roles */
  filters: Array<{
    factor: string;
    values: (string | number)[];
    role?: FactorRole;
  }>;
  /** Control/spec violations */
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
  };
  /** Summary of findings */
  findings?: {
    total: number;
    byStatus: Record<string, number>;
    keyDrivers: string[];
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
