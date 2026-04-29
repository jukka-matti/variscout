import type { TimeGranularity } from '../time';

export interface OutputRateBucket {
  bucketStartISO: string;
  bucketEndISO: string;
  count: number;
  ratePerHour: number;
}

export interface OutputRateResult {
  nodeId: string;
  granularity: TimeGranularity;
  buckets: OutputRateBucket[];
  totalCount: number;
  averageRatePerHour: number;
}

export interface BottleneckResult {
  nodeId: string;
  averageRatePerHour: number;
  rank: number;
  isBottleneck: boolean; // lowest rate among the analysed steps
}
