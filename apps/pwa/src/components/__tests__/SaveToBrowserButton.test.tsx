// apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx
//
// F3 P5 — rebuilt against the new persistence module.
//
// Coverage:
//   - "Save to this browser" → setOptInFlag(true) + full DocumentSnapshot persistence
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
import {
  getOptInFlag,
  loadSavedDocumentSnapshot,
  saveCurrentDocumentSnapshot,
  setOptInFlag,
} from '../../persistence';
import { db } from '../../db/schema';
import { getProjectInitialState, useProjectStore } from '@variscout/stores';

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
    db.documentSnapshots.clear(),
  ]);
  useProjectStore.setState(getProjectInitialState());
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

  it('clicking save opts in and persists a full document snapshot', async () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ x: 1 }],
      outcome: 'x',
    });
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));

    // Opt-in flag flipped.
    await waitFor(async () => expect(await getOptInFlag()).toBe(true));

    const snapshot = await loadSavedDocumentSnapshot();
    expect(snapshot).toMatchObject({
      hub: { id: hub.id, processGoal: 'Test goal.' },
      project: { rawData: [{ x: 1 }], outcome: 'x' },
    });
  });

  it('after opt-in, button label is "Saved · Forget"', async () => {
    await setOptInFlag(true);
    await saveCurrentDocumentSnapshot(hub);

    render(<SaveToBrowserButton currentHub={hub} />);

    expect(await screen.findByRole('button', { name: /saved.*forget/i })).toBeInTheDocument();
  });

  it('clicking Forget clears persistence after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await setOptInFlag(true);
    await saveCurrentDocumentSnapshot(hub);

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
    expect(await loadSavedDocumentSnapshot()).toBeNull();
  });

  it('auto-save after opt-in refreshes the saved document snapshot when stores change', async () => {
    await setOptInFlag(true);

    render(<SaveToBrowserButton currentHub={hub} />);
    await screen.findByRole('button', { name: /saved.*forget/i });

    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ x: 2 }],
      outcome: 'x',
    });
    render(<SaveToBrowserButton currentHub={{ ...hub, processGoal: 'Updated goal.' }} />);

    await waitFor(async () =>
      expect(await loadSavedDocumentSnapshot()).toMatchObject({
        hub: { processGoal: 'Updated goal.' },
        project: { rawData: [{ x: 2 }] },
      })
    );
  });
});
