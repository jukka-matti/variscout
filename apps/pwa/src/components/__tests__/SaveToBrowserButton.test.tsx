// apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx
//
// F3 P5 — rebuilt against the new persistence module.
//
// Coverage:
//   - "Save to this browser" → setOptInFlag(true) + dispatch HUB_PERSIST_SNAPSHOT
//   - "Forget" → setOptInFlag(false) + IDB cleared
//   - opt-in mount toggles the button label appropriately
//
// fake-indexeddb/auto must be the first import statement so Dexie sees the
// IndexedDB polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';
import { SaveToBrowserButton } from '../SaveToBrowserButton';
import { getOptInFlag, setOptInFlag, pwaHubRepository } from '../../persistence';
import { db } from '../../db/schema';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Reset persistence between tests by clearing every touched table on the
  // existing db instance. Avoid setOptInFlag(false) here — it calls
  // db.delete() which closes the IDB, racing with the SaveToBrowserButton
  // effect's getOptInFlag() read in the previous test's pending Promise tail
  // and surfacing as DatabaseClosedError unhandled rejections.
  if (!db.isOpen()) await db.open();
  await Promise.all([
    db.meta.clear(),
    db.hubs.clear(),
    db.outcomes.clear(),
    db.canvasState.clear(),
  ]);
});

afterEach(async () => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SaveToBrowserButton', () => {
  it('shows "Save to this browser" when not opted in', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save to this browser/i })).toBeInTheDocument()
    );
  });

  it('clicking save opts in and persists the hub via dispatch', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));

    // Opt-in flag flipped.
    await waitFor(async () => expect(await getOptInFlag()).toBe(true));

    // Hub is now persisted — read back via the repository to confirm round-trip.
    const hubs = await pwaHubRepository.hubs.list();
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({ processGoal: 'Test goal.' });
  });

  it('after opt-in, button label is "Saved · Forget"', async () => {
    await setOptInFlag(true);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    render(<SaveToBrowserButton currentHub={hub} />);

    expect(await screen.findByRole('button', { name: /saved.*forget/i })).toBeInTheDocument();
  });

  it('clicking Forget clears persistence after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await setOptInFlag(true);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /saved.*forget/i }));

    // After confirmation, the button flips back to "Save to this browser" —
    // visible proof that opt-out succeeded and the component's local state
    // reflects optedIn=false. Asserting on the rendered DOM avoids racing the
    // db.delete()/auto-reopen window that the underlying flag read sees.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save to this browser/i })).toBeInTheDocument()
    );

    // After db.delete() the instance is closed; the next read must explicitly
    // re-open it. (In live use, App.tsx mounts under a fresh tick so Dexie's
    // auto-reopen catches up; the synchronous test path needs the manual nudge.)
    if (!db.isOpen()) await db.open();

    expect(await getOptInFlag()).toBe(false);
    expect(await pwaHubRepository.hubs.list()).toEqual([]);
  });

  it('clicking save routes through pwaHubRepository.dispatch with HUB_PERSIST_SNAPSHOT', async () => {
    const dispatchSpy = vi.spyOn(pwaHubRepository, 'dispatch');

    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled());
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'HUB_PERSIST_SNAPSHOT',
        hub: expect.objectContaining({ processGoal: 'Test goal.' }),
      })
    );

    dispatchSpy.mockRestore();
  });
});
