// apps/pwa/src/__tests__/outcomePinMulti.test.tsx
//
// Stubbed for F3 (P1-P4 atomic schema cutover). The original tests called the
// deleted `apps/pwa/src/db/hubRepository.ts` facade (clearAll / saveHub /
// setOptInFlag) which no longer exists. P5 (next dispatch) rewrites this file
// against the new persistence module:
//   - `setOptInFlag(true)` from `../persistence/optIn`
//   - `pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub })`
//   - `pwaHubRepository.hubs.list()` for assertions
// to seed multi-outcome hub fixtures and verify per-outcome OutcomePin rendering.

import { describe, it } from 'vitest';

describe('PWA framing toolbar — OutcomePin per outcome (F3)', () => {
  it.todo('P5 dispatch: rewrite tests against new persistence module + Dexie schema');
});
