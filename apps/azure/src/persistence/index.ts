// apps/azure/src/persistence/index.ts
// Barrel: re-exports the class, singleton, cascade helper, and per-action dispatcher.

export { AzureHubRepository, azureHubRepository } from './AzureHubRepository';
export { cascadeArchiveDescendants } from './cascadeArchive';
export { applyAction } from './applyAction';
