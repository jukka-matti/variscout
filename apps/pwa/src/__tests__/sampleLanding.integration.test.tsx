/**
 * sampleLanding integration tests (Tasks 3 + 4 — FSJ-1 spec §1, §3).
 *
 * Test seam choice: we integration-test `landOnProcess` and `landVrsOnProcess`
 * directly rather than mounting the full App. Rationale: App.tsx requires 20+
 * vi.mocks for workers, Dexie, chart libraries, and lazy components (see
 * App.test.tsx). The handler body is the load-bearing behavior; App.tsx is a
 * thin 3-liner wrapper. Testing the extracted functions with REAL panelsStore +
 * REAL ensureSessionProject gives honest coverage
 * without the App harness cost.
 *
 * Writing-tests invariant: vi.mock() BEFORE any non-vitest imports.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestIP } from '../../../../packages/ui/src/test-utils/improvementProject';
import { createTestStepTiming } from '../../../../packages/ui/src/test-utils/stepTiming';

// ── Test doubles ──────────────────────────────────────────────────────────────

const loadSampleMock = vi.fn();

// ── Imports ───────────────────────────────────────────────────────────────────

import type { SampleDataset } from '@variscout/data';
import type { ProcessHub } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { DocumentSnapshot, DocumentSnapshotVrsFile } from '@variscout/stores';
import { resetDocumentStores } from '@variscout/stores';
import { usePanelsStore, initialPanelsState } from '../features/panels/panelsStore';
import {
  landOnProcess,
  landVrsOnProcess,
  landManualOnProcess,
  landPasteOnProcess,
  provisionPasteProject,
} from '../lib/landing';
import { ensureSessionProject } from '../lib/ensureSessionProject';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const NOW = 1714000000000;

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

const TIMED_SAMPLE_DATASET: SampleDataset = {
  ...SAMPLE_DATASET,
  name: 'Timed bottleneck sample',
  config: {
    ...SAMPLE_DATASET.config,
    stepTimings: [
      createTestStepTiming({
        stepId: 'step-2',
        startColumn: 'Step_2_Start',
        endColumn: 'Step_2_End',
      }),
    ],
  },
};

const SEEDED_SAMPLE_DATASET: SampleDataset = {
  ...SAMPLE_DATASET,
  name: 'Seeded demo sample',
  config: {
    ...SAMPLE_DATASET.config,
    improvementProject: {
      issueStatement: 'Demo issue statement',
      metadata: {
        businessCase: 'Demo business case',
      },
      sections: {
        background: {
          snapshotText: 'Demo baseline snapshot',
        },
        approach: {
          narrative: 'Demo response plan',
        },
      },
      actions: [
        {
          id: 'action-seeded-1',
          text: 'Verify demo action appears in Improve',
          status: 'open',
          assignedTo: { displayName: 'Demo owner' },
          dueAt: '2026-06-12',
          doneAt: null,
          doneBy: null,
          createdBy: { displayName: 'VariScout demo' },
          createdAt: NOW,
        },
      ],
    },
  },
};

// ── .vrs fixture builders ─────────────────────────────────────────────────────

/** Minimal ImprovementProject satisfying the type (no store interaction). */
function makeTestIP(id: string, hubId: string): ImprovementProject {
  return {
    id,
    hubId,
    status: 'active',
    metadata: { title: `Project ${id}` },
    goal: { outcomeGoals: [] },
    sections: { background: {}, approach: {}, outcomeReference: {} },
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  } satisfies ImprovementProject;
}

/**
 * Minimal DocumentSnapshot that satisfies validateDocumentSnapshot's shallow
 * shape check. Only the fields checked by hasDocumentSnapshotShape need to be
 * present; extra fields are optional.
 */
function makeMinimalSnapshot(
  hubId: string,
  hubName: string,
  improvementProject: ImprovementProject | null,
  projectName?: string
): DocumentSnapshot {
  return {
    schemaVersion: 1,
    hubId,
    hub: {
      id: hubId,
      name: hubName,
      createdAt: NOW,
      deletedAt: null,
    },
    project: {
      projectId: 'proj-1',
      projectName: projectName ?? hubName,
      rawData: [],
      outcome: '',
      factors: [],
      specs: {},
      analysisMode: 'measurement',
      filters: {},
      filterStack: [],
      axisSettings: {},
      displayOptions: {},
      chartTitles: {},
    },
    analyze: {
      findings: [],
      categories: [],
      hypotheses: [],
      causalLinks: [],
      scopes: [],
    },
    canvas: {
      canonicalMap: { nodes: [], edges: [] },
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: 'v1',
    },
    improvementProject,
  } as unknown as DocumentSnapshot;
}

function makeVrsFile(snapshot: DocumentSnapshot): DocumentSnapshotVrsFile {
  return {
    kind: 'variscout.document',
    version: 1,
    exportedAt: new Date(NOW).toISOString(),
    documentSnapshot: snapshot,
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset panelsStore to default (activeView 'explore')
  usePanelsStore.setState(initialPanelsState);
  // Reset document stores (project/analyze/canvas/improvementProject)
  resetDocumentStores();
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

  it('creates an Untitled project named after the sample', () => {
    let capturedHub: ProcessHub | undefined;
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

    // Active-IP store activation is retired; the Workspace Project is attached to the hub.
    expect(hub.improvementProject!.hubId).toBe(hub.id);
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

  it('CS-P5: preserves timed sample bindings when replacing a deleted session project', () => {
    const deletedIP = {
      ...createTestIP({
        id: 'ip-deleted',
        hubId: 'hub-with-deleted-ip',
        title: 'Deleted project',
      }),
      deletedAt: NOW,
    };
    const sessionHub: ProcessHub = {
      id: 'hub-with-deleted-ip',
      name: 'Existing training hub',
      createdAt: NOW,
      deletedAt: null,
      improvementProject: deletedIP,
    };
    let capturedHub: ProcessHub | null = null;

    landOnProcess(TIMED_SAMPLE_DATASET, {
      loadSample: loadSampleMock,
      sessionHub,
      setSessionHub: hub => {
        capturedHub = hub;
      },
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    expect(capturedHub).toBeDefined();
    const hub = capturedHub!;
    expect(hub.improvementProject?.id).not.toBe(deletedIP.id);
    expect(hub.improvementProject?.stepTimings).toEqual(TIMED_SAMPLE_DATASET.config.stepTimings);
  });

  it('applies sample-seeded Improvement Project context and scopes actions to the runtime project', () => {
    let capturedHub: ProcessHub | undefined;

    landOnProcess(SEEDED_SAMPLE_DATASET, {
      loadSample: loadSampleMock,
      sessionHub: null,
      setSessionHub: hub => {
        capturedHub = hub;
      },
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    const project = capturedHub!.improvementProject!;
    expect(project.issueStatement).toBe('Demo issue statement');
    expect(project.metadata.businessCase).toBe('Demo business case');
    expect(project.sections.background.snapshotText).toBe('Demo baseline snapshot');
    expect(project.sections.approach.narrative).toBe('Demo response plan');
    expect(project.metadata.actions).toHaveLength(1);
    expect(project.metadata.actions![0]).toMatchObject({
      id: 'action-seeded-1',
      text: 'Verify demo action appears in Improve',
      parentImprovementProjectId: project.id,
      deletedAt: null,
    });
  });
});

describe('landVrsOnProcess — .vrs reconstruct-not-create (spec §1)', () => {
  it('(a) snapshot with live IP: same project id + title preserved, activeView frame', () => {
    const IP_ID = 'ip-fixture-1';
    const HUB_ID = 'hub-fixture-1';
    const ip = makeTestIP(IP_ID, HUB_ID);
    const vrsFile = makeVrsFile(makeMinimalSnapshot(HUB_ID, 'Fixture Hub', ip));

    let capturedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((hub: ProcessHub) => {
      capturedHub = hub;
    });

    landVrsOnProcess(vrsFile, {
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    // Routed to Process tab
    expect(usePanelsStore.getState().activeView).toBe('frame');

    // Hub was set
    expect(setSessionHub).toHaveBeenCalledOnce();
    expect(capturedHub).not.toBeNull();
    const hub = capturedHub!;

    // Reconstruct-not-create: the envelope's own project is preserved (same id)
    expect(hub.improvementProject).not.toBeNull();
    expect(hub.improvementProject!.id).toBe(IP_ID);
    expect(hub.improvementProject!.metadata.title).toBe(`Project ${IP_ID}`);

    expect(hub.improvementProject!.hubId).toBe(HUB_ID);
  });

  it('(b) project-less snapshot: Untitled project created with envelope-name fallback, activeView frame', () => {
    const HUB_ID = 'hub-fixture-2';
    const HUB_NAME = 'Training Scenario';
    // No improvementProject in snapshot; set projectName differently to prove fallback order
    const vrsFile = makeVrsFile(makeMinimalSnapshot(HUB_ID, HUB_NAME, null, 'Other Name'));

    let capturedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((hub: ProcessHub) => {
      capturedHub = hub;
    });

    landVrsOnProcess(vrsFile, {
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    // Routed to Process tab
    expect(usePanelsStore.getState().activeView).toBe('frame');

    // Hub was set
    expect(setSessionHub).toHaveBeenCalledOnce();
    expect(capturedHub).not.toBeNull();
    const hub = capturedHub!;
    expect(hub.id).toBe(HUB_ID);

    // A fresh IP was created using the envelope name fallback
    expect(hub.improvementProject).not.toBeNull();
    expect(hub.improvementProject!.deletedAt).toBeNull();
    // Title fallback: hub.name (= 'Training Scenario' from snapshot.hub.name)
    expect(hub.improvementProject!.metadata.title).toBe(HUB_NAME);

    expect(hub.improvementProject!.hubId).toBe(HUB_ID);
  });
});

describe('landManualOnProcess — manual entry lands on Process tab (spec §1, §3)', () => {
  it('invokes manualAnalyze, routes to Process tab, and creates an Untitled project', () => {
    const manualAnalyzeMock = vi.fn();
    let capturedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((hub: ProcessHub) => {
      capturedHub = hub;
    });

    const DATA = [{ weight: 5.1 }];
    const CONFIG = { outcome: 'weight', factors: ['batch'], specs: { usl: 6.0 } };

    landManualOnProcess(DATA, CONFIG, {
      manualAnalyze: manualAnalyzeMock,
      sessionHub: null,
      setSessionHub,
      showFrame: usePanelsStore.getState().showFrame,
      isEmbedMode: false,
    });

    // manualAnalyze was called with the raw args (data write delegated to injected fn)
    expect(manualAnalyzeMock).toHaveBeenCalledOnce();
    expect(manualAnalyzeMock).toHaveBeenCalledWith(DATA, CONFIG);

    // Routed to Process tab
    expect(usePanelsStore.getState().activeView).toBe('frame');

    // Hub created and set
    expect(setSessionHub).toHaveBeenCalledOnce();
    expect(capturedHub).not.toBeNull();
    const hub = capturedHub!;

    // Project titled 'Untitled project' (manual entries have no name source)
    expect(hub.improvementProject).not.toBeNull();
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.title).toBe('Untitled project');

    expect(hub.improvementProject!.hubId).toBe(hub.id);
  });
});

describe('landPasteOnProcess (FSJ-2, spec §1/§3)', () => {
  it('creates an Untitled project and routes to the Process tab', () => {
    const showFrame = vi.fn();
    let hub: ProcessHub | null = null;
    landPasteOnProcess({
      sessionHub: null,
      setSessionHub: h => {
        hub = h;
      },
      showFrame,
      isEmbedMode: false,
    });
    expect(hub!.improvementProject!.metadata.title).toBe('Untitled project');
    expect(showFrame).toHaveBeenCalledTimes(1);
    expect(hub!.improvementProject!.hubId).toBe(hub!.id);
  });

  it('embed mode creates state but never routes (negative control, spec §1)', () => {
    const showFrame = vi.fn();
    landPasteOnProcess({
      sessionHub: null,
      setSessionHub: vi.fn(),
      showFrame,
      isEmbedMode: true,
    });
    expect(showFrame).not.toHaveBeenCalled();
  });

  it('reuses a live session hub + IP (referential no-op, spec §3)', () => {
    // Build a hub with an existing live IP via the shared helper
    const existingHub = ensureSessionProject(null, 'Existing');

    let receivedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((h: ProcessHub) => {
      receivedHub = h;
    });

    landPasteOnProcess({
      sessionHub: existingHub,
      setSessionHub,
      showFrame: vi.fn(),
      isEmbedMode: false,
    });

    // setSessionHub was called exactly once
    expect(setSessionHub).toHaveBeenCalledOnce();

    // Referential identity: ensureSessionProject must return the SAME object —
    // not a copy — when a live IP already exists (spec §3 reconstruct-not-create).
    expect(receivedHub).toBe(existingHub);

    // Title preserved — no re-wrap with 'Untitled project'
    expect(receivedHub!.improvementProject!.metadata.title).toBe('Existing');
  });
});

describe('provisionPasteProject (FSJ-2 addendum T6b, spec §3) — wizard-path Untitled guarantee', () => {
  it('creates an Untitled project WITHOUT routing (no showFrame)', () => {
    let hub: ProcessHub | null = null;

    provisionPasteProject({
      sessionHub: null,
      setSessionHub: h => {
        hub = h;
      },
    });

    // The Untitled project was created.
    expect(hub).not.toBeNull();
    expect(hub!.improvementProject).not.toBeNull();
    expect(hub!.improvementProject!.metadata.title).toBe('Untitled project');
    expect(hub!.improvementProject!.hubId).toBe(hub!.id);

    // Crucially: NO routing. The wizard path keeps today's landing until P2 —
    // provisionPasteProject does not call showFrame, so activeView is unchanged
    // (still the fresh-store default 'explore').
    expect(usePanelsStore.getState().activeView).toBe(initialPanelsState.activeView);
    expect(usePanelsStore.getState().activeView).not.toBe('frame');
  });

  it('reuses a live session hub + IP (referential no-op, spec §3)', () => {
    const existingHub = ensureSessionProject(null, 'Existing');

    let receivedHub: ProcessHub | null = null;
    const setSessionHub = vi.fn((h: ProcessHub) => {
      receivedHub = h;
    });

    provisionPasteProject({ sessionHub: existingHub, setSessionHub });

    expect(setSessionHub).toHaveBeenCalledOnce();
    // Same object reference — no re-wrap when a live IP already exists (spec §3).
    expect(receivedHub).toBe(existingHub);
    expect(receivedHub!.improvementProject!.metadata.title).toBe('Existing');
  });
});
