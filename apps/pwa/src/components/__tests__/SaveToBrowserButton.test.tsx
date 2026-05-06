// apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx
//
// Stubbed for F3 (P1-P4 atomic schema cutover). The original tests called the
// deleted `apps/pwa/src/db/hubRepository.ts` facade (saveHub / loadHub /
// clearAll) which no longer exists. P5 (next dispatch) rewrites this file
// against `getOptInFlag` / `setOptInFlag` from `../../persistence/optIn` plus
// `pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', ... })` and
// reads via `pwaHubRepository.hubs.list()`.

import { describe, it } from 'vitest';

describe('SaveToBrowserButton (F3)', () => {
  it.todo('P5 dispatch: rewrite tests against new persistence module + Dexie schema');
});
