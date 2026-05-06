// apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts
//
// Stubbed for F3 (P1-P4 atomic schema cutover). The previous tests targeted
// the F2 hub-of-one blob façade and mocked the deleted
// `apps/pwa/src/db/hubRepository.ts` module; F3 swapped that out for
// transactional Dexie writes against the normalized schema.
//
// Full integration tests with `fake-indexeddb` are deferred to P5 (next
// dispatch in the F3 plan). Until then this file is intentionally empty so
// the build/typecheck stays green.

import { describe, it } from 'vitest';

describe('PwaHubRepository (F3)', () => {
  it.todo('P5 dispatch: rewrite tests against fake-indexeddb + new schema');
});
