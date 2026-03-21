import type { StatsResult, SpecLimits } from '../types';

/** Input for a stats computation request */
export interface StatsComputeRequest {
  /** Numeric values extracted from the outcome column */
  values: number[];
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

/** The API exposed by the stats Worker via Comlink */
export interface StatsWorkerAPI {
  computeStats(request: StatsComputeRequest): StatsComputeResult;
}
