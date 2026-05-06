// apps/azure/src/persistence/index.ts
// Barrel: re-exports the class, singleton, cascade helper, and per-action dispatcher.

export { AzureHubRepository, azureHubRepository } from './AzureHubRepository';
export { cascadeArchiveDescendants } from './cascadeArchive';
/** @internal — use `AzureHubRepository.dispatch()`; direct calls bypass the HUB_PERSIST_SNAPSHOT short-circuit. */
export { applyAction } from './applyAction';
