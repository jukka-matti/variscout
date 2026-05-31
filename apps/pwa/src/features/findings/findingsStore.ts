import {
  createFindingsFeatureStore,
  groupFindingsByChart,
  type ChartFindings,
  type FindingsFeatureStore,
} from '@variscout/stores/feature-factories';

export { groupFindingsByChart };
export type { ChartFindings };
export type FindingsStore = FindingsFeatureStore;

export const useFindingsStore = createFindingsFeatureStore();
