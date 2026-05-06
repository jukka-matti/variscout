// apps/pwa/src/persistence/index.ts
//
// Barrel for the PWA persistence module.
// Composition root + dispatch boundary documented in apps/pwa/CLAUDE.md.

export { PwaHubRepository, pwaHubRepository } from './PwaHubRepository';
export { applyAction } from './applyAction';
export { getOptInFlag, setOptInFlag } from './optIn';
