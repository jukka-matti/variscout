import {
  buildIdeaImpacts,
  createAnalyzeFeatureStore,
  type AnalyzeFeatureStore,
  type ProjectionTarget,
} from '@variscout/stores/feature-factories';

export { buildIdeaImpacts };
export type { ProjectionTarget };
export type AnalyzeStore = AnalyzeFeatureStore;

export const useAnalyzeFeatureStore = createAnalyzeFeatureStore();
