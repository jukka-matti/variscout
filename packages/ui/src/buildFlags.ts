declare const __WORKSPACE_ARTIFACTS__: boolean;

export const artifactExportsEnabled =
  typeof __WORKSPACE_ARTIFACTS__ === 'undefined' || __WORKSPACE_ARTIFACTS__;
