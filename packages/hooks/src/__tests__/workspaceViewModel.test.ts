import { describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core/processHub';
import { createNewIP } from '@variscout/core/improvementProject';
import { deriveWorkspaceViewModel } from '../workspaceViewModel';

const NOW = 1_755_000_000_000;

function makeHub(title = 'Loaded sample data'): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Sample Workspace',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    improvementProject: createNewIP({
      hubId: 'hub-1',
      title,
      currentUserId: 'analyst@local',
      now: () => NOW,
    }),
  };
}

describe('deriveWorkspaceViewModel', () => {
  it('derives an informal Workspace for an auto-titled solo project without formalizedAt', () => {
    const workspace = deriveWorkspaceViewModel({
      hub: makeHub('Loaded sample data'),
      analysisScope: { yColumn: undefined, categoricalFilters: [] },
    });

    expect(workspace).toMatchObject({
      workspaceId: 'hub-1',
      title: 'Loaded sample data',
      isFormalized: false,
      project: {
        id: expect.any(String),
        title: 'Loaded sample data',
        memberCount: 1,
      },
      analysisScope: { yColumn: undefined, categoricalFilters: [] },
      capabilities: {
        canFormalize: true,
        canReport: true,
      },
    });
  });

  it('uses the explicit formalizedAt marker from the project predicate', () => {
    const hub = makeHub('Cpk lift');
    hub.improvementProject = {
      ...hub.improvementProject!,
      metadata: { ...hub.improvementProject!.metadata, formalizedAt: NOW },
    };

    const workspace = deriveWorkspaceViewModel({
      hub,
      analysisScope: { yColumn: 'Yield', categoricalFilters: [] },
    });

    expect(workspace?.isFormalized).toBe(true);
    expect(workspace?.capabilities.canFormalize).toBe(false);
  });

  it('returns null when the Workspace has no live project', () => {
    const hub = makeHub();
    hub.improvementProject = { ...hub.improvementProject!, deletedAt: NOW };

    expect(
      deriveWorkspaceViewModel({
        hub,
        analysisScope: { yColumn: 'Yield', categoricalFilters: [] },
      })
    ).toBeNull();
  });
});
