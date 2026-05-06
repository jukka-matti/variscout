// apps/pwa/src/persistence/__tests__/applyAction.test.ts
//
// Stubbed for F3 (P1-P4 atomic schema cutover). The previous tests targeted
// the F2 pure Immer signature `applyAction(hub, action) → next hub`; F3
// rewrote applyAction as `applyAction(db, action): Promise<void>` performing
// transactional Dexie writes against the new normalized schema.
//
// Full integration tests with `fake-indexeddb` are deferred to P5 (next
// dispatch in the F3 plan). Until then this file is intentionally empty so
// the build/typecheck stays green.

import { describe, it } from 'vitest';

describe('applyAction (F3)', () => {
  it.todo('P5 dispatch: rewrite tests against fake-indexeddb + new schema');
});
