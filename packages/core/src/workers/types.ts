import type { StatsResult, SpecLimits, AnovaResult, DataRow } from '../types';

/** Input for a stats computation request */
export interface StatsComputeRequest {
  /** Numeric values — regular array or Float64Array for zero-copy transfer */
  values: number[] | Float64Array;
  /** Spec limits for capability calculation */
  specs: SpecLimits;
  /** Whether to compute KDE (for violin plots) — expensive, O(n * numPoints) */
  computeKDE?: boolean;
}

/** Result from a stats computation */
export interface StatsComputeResult {
  stats: StatsResult;
  /** KDE density points (if computeKDE was true) */
  kde?: { value: number; count: number }[] | null;
}

/** Input for an ANOVA computation request (pre-extracted column arrays) */
export interface AnovaComputeRequest {
  /** Factor column values (categorical) */
  factorValues: string[];
  /** Outcome column values (numeric) — regular array or Float64Array for zero-copy transfer */
  outcomeValues: number[] | Float64Array;
  /** Outcome column name (for "lower is better" heuristic in insight text) */
  outcomeName?: string;
}

/** Input for a best subsets computation request */
export interface BestSubsetsComputeRequest {
  /** Data rows */
  data: DataRow[];
  /** Outcome column name */
  outcome: string;
  /** Factor column names */
  factors: string[];
}

/**
 * Serialization-safe best subsets result.
 *
 * The core BestSubsetsResult uses Map objects (levelEffects, cellMeans, factorTypes)
 * which are not structured-clone transferable. This serialized form replaces Maps
 * with Records for cross-thread transfer via Comlink.
 *
 * Use `deserializeBestSubsetsResult` to convert back to the full BestSubsetsResult.
 */
export interface SerializedBestSubsetsResult {
  subsets: Array<{
    factors: string[];
    factorCount: number;
    rSquared: number;
    rSquaredAdj: number;
    fStatistic: number;
    pValue: number;
    isSignificant: boolean;
    dfModel: number;
    /** factor → (level → effect) — serialized from Map<string, Map<string, number>> */
    levelEffects: Record<string, Record<string, number>>;
    /** compound key → { mean, n } — serialized from Map */
    cellMeans: Record<string, { mean: number; n: number }>;
    predictors?: import('../types').PredictorInfo[];
    intercept?: number;
    modelType?: 'anova' | 'ols' | 'glm';
    factorTypes?: Record<string, 'continuous' | 'categorical'>;
    hasQuadraticTerms?: boolean;
    rmse?: number;
    warnings?: string[];
  }>;
  n: number;
  totalFactors: number;
  factorNames: string[];
  grandMean: number;
  ssTotal: number;
  factorTypes?: Record<string, 'continuous' | 'categorical'>;
  usedOLS?: boolean;
}

/** The API exposed by the stats Worker via Comlink */
export interface StatsWorkerAPI {
  computeStats(request: StatsComputeRequest): StatsComputeResult;
  computeAnova(request: AnovaComputeRequest): AnovaResult | null;
  /** Worker-side best subsets: returns serialized (Map-free) result for structured-clone transfer */
  computeBestSubsetsWorker(request: BestSubsetsComputeRequest): SerializedBestSubsetsResult | null;
}
