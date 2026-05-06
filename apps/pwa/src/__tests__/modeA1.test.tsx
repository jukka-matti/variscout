// apps/pwa/src/__tests__/modeA1.test.tsx
//
// Stubbed for F3 (P1-P4 atomic schema cutover). The original tests called the
// deleted `apps/pwa/src/db/hubRepository.ts` facade (clearAll / saveHub /
// setOptInFlag) which no longer exists. P5 (next dispatch) rewrites this file
// against `setOptInFlag` from `../persistence/optIn` plus
// `pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', ... })` for
// seeding fixtures, and `getOptInFlag` for assertions.

import { describe, it } from 'vitest';

describe('Mode A.1 — PWA reopen with persistence (F3)', () => {
  it.todo('P5 dispatch: rewrite tests against new persistence module + Dexie schema');
});
