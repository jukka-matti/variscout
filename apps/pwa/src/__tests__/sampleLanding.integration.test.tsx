/**
 * sampleLanding integration tests (Task 3 — FSJ-1 spec §1, §3).
 *
 * Test seam choice: we integration-test `landOnProcess` directly rather than
 * mounting the full App. Rationale: App.tsx requires 20+ vi.mocks for workers,
 * Dexie, chart libraries, and lazy components (see App.test.tsx). The handler
 * body is the load-bearing behavior; App.tsx is a thin 3-liner wrapper. Testing
 * the extracted function with REAL panelsStore + REAL ensureSessionProject +
 * REAL useActiveIPStore gives honest coverage without the App harness cost.
 *
 * Writing-tests invariant: vi.mock() BEFORE any non-vitest imports.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Test doubles ──────────────────────────────────────────────────────────────

const loadSampleMock = vi.fn();

// ── Imports ───────────────────────────────────────────────────────────────────

import type { SampleDataset } from '@variscout/data';
import type { ProcessHub } from '@variscout/core/processHub';
import { useActiveIPStore, getActiveIPInitialState } from '@variscout/stores';
import { DEFAULT_ACTIVE_IP_USER_ID } from '@variscout/hooks';
import { usePanelsStore, initialPanelsState } from '../features/panels/panelsStore';
import { landOnProcess } from '../lib/landOnProcess';
import { PWA_USER_ID } from '../lib/pwaUser';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const SAMPLE_DATASET: SampleDataset = {
  name: 'Cookie Weight',
  description: 'Cookie weight case study',
  icon: 'cookie',
  urlKey: 'cookie-weight',
  category: 'featured',
  featured: true,
  data: [{ weight: 5.1 }],
  config: {
    outcome: 'weight',
    factors: [],
    specs: {},
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset panelsStore to default (activeView 'explore')
  usePanelsStore.setState(initialPanelsState);
  // Reset activeIPStore
  useActiveIPStore.setState(getActiveIPInitialState());
  // Clear mocks
  loadSampleMock.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('landOnProcess — sample landing (spec §1, §3)', () => {
  it('routes to Process tab (activeView === "frame") when not in embed mode', () => {
    const setSessionHub = vi.fn();

    landOnProcess(SAMPLE_DATASET, {
      loadSample: loadSampleMock,
      sessionHub: null,
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    expect(usePanelsStore.getState().activeView).toBe('frame');
  });

  it('creates an Untitled project named after the sample + activates it (E1 T6 gate passes)', () => {
    let capturedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((hub: ProcessHub) => {
      capturedHub = hub;
    });

    landOnProcess(SAMPLE_DATASET, {
      loadSample: loadSampleMock,
      sessionHub: null,
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    // setSessionHub was called with the new hub
    expect(setSessionHub).toHaveBeenCalledOnce();
    expect(capturedHub).not.toBeNull();
    const hub = capturedHub!;

    // The hub carries a live ImprovementProject named after the sample
    expect(hub.improvementProject).not.toBeNull();
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.title).toBe(SAMPLE_DATASET.name);

    // The IP is active under the PRODUCTION scope key (what useActiveIPContext reads
    // with its default userId). This is the E1 T6 gate — FrameView renders Canvas
    // chrome instead of NoActiveProjectGuidance when this passes.
    const productionScope = { hubId: hub.id, userId: DEFAULT_ACTIVE_IP_USER_ID };
    const activeState = useActiveIPStore.getState().getActiveIP(productionScope);
    expect(activeState).not.toBeNull();
    expect(activeState!.ipId).toBe(hub.improvementProject!.id);

    // Negative control: the OLD wrong key (PWA_USER_ID = 'analyst@local') must
    // NOT have an active IP. If this passes it proves the seam is correct —
    // a write to the wrong key would break this assertion.
    const wrongScope = { hubId: hub.id, userId: PWA_USER_ID };
    const wrongActiveState = useActiveIPStore.getState().getActiveIP(wrongScope);
    expect(wrongActiveState).toBeNull();
  });

  it('does NOT route to Process tab in embed mode (negative control for §1 exemption)', () => {
    const setSessionHub = vi.fn();

    landOnProcess(SAMPLE_DATASET, {
      loadSample: loadSampleMock,
      sessionHub: null,
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: true,
    });

    // Active view must NOT be 'frame' — embed mode stays on whatever view was
    // showing (default 'explore' in a fresh store)
    expect(usePanelsStore.getState().activeView).not.toBe('frame');

    // Data loading + hub creation still happen (state is consistent)
    expect(loadSampleMock).toHaveBeenCalledOnce();
    expect(setSessionHub).toHaveBeenCalledOnce();
  });
});
