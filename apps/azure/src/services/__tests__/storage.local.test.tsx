import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import type { DocumentSnapshot } from '@variscout/stores';
import { db } from '../../db/schema';
import { StorageProvider, useStorage } from '../storage';

vi.mock('../../auth/easyAuth', () => ({
  getEasyAuthUser: vi.fn(async () => ({ userId: 'local-user', email: 'local@example.com' })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <StorageProvider>{children}</StorageProvider>;
}

function snapshot(): DocumentSnapshot {
  return {
    schemaVersion: 1,
    hubId: DEFAULT_PROCESS_HUB_ID,
    hub: {
      id: DEFAULT_PROCESS_HUB_ID,
      name: 'Workspace',
      createdAt: 1,
      deletedAt: null,
    },
    project: {
      projectId: 'project-1',
      projectName: 'Line 4',
      rawData: [{ y: 1 }],
      outcome: 'y',
      factors: [],
      timeColumn: null,
      specs: {},
      columnAliases: {},
      measureColumns: [],
      measureLabel: null,
      subgroupConfig: null,
      cpkTarget: null,
      measureSpecs: {},
      defectMapping: null,
      processContext: null,
      dataQualityReport: null,
      analysisMode: 'automatic',
      filters: {},
      displayOptions: {},
      viewState: {},
    },
    analyze: {
      findings: [],
      questions: [],
      scopes: [],
      hypotheses: [],
      actionItems: [],
      ideas: [],
    },
    improvementProject: null,
  } as unknown as DocumentSnapshot;
}

describe('StorageProvider local-first persistence', () => {
  beforeEach(async () => {
    await db.open();
    await db.projects.clear();
  });

  afterEach(async () => {
    await db.projects.clear();
    db.close();
  });

  it('saves and lists a local document without cloud identity', async () => {
    const { result } = renderHook(() => useStorage(), { wrapper });

    await act(async () => {
      await result.current.saveProject(snapshot(), 'Line 4', 'personal');
    });

    const projects = await result.current.listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      id: 'Line 4',
      name: 'Line 4',
      location: 'personal',
      modifiedBy: 'Local',
    });
    expect(result.current.syncStatus).toMatchObject({
      status: 'saved',
      message: 'Saved locally',
    });
  });
});
