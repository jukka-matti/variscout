import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  getImprovementProjectInitialState,
  getAnalyzeInitialState,
  useImprovementProjectStore,
  useAnalyzeStore,
} from '@variscout/stores';
import { RETURN_NAVIGATION_STORAGE_KEY } from '@variscout/hooks';
import ImprovementProjectPanel from '../ImprovementProjectPanel';
import { pwaHubRepository } from '../../persistence';

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    ImprovementProjectForm: (props: {
      metadataProps?: { title?: string };
      lineageProps?: {
        hypotheses?: { id: string; name: string }[];
        onNavigate?: (target: { kind: 'hypothesis'; id: string }) => void;
      };
    }) =>
      React.createElement(
        'section',
        { 'data-testid': 'improvement-project-form' },
        props.metadataProps?.title ?? 'Untitled',
        props.lineageProps?.hypotheses?.[0]
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () =>
                  props.lineageProps?.onNavigate?.({
                    kind: 'hypothesis',
                    id: props.lineageProps.hypotheses?.[0]?.id ?? '',
                  }),
              },
              props.lineageProps.hypotheses[0].name
            )
          : null
      ),
  };
});

vi.mock('../../persistence', () => ({
  pwaHubRepository: {
    dispatch: vi.fn().mockResolvedValue(undefined),
  },
}));

function makeProject(
  id: string,
  hubId: string,
  title: string,
  deletedAt: number | null = null
): ImprovementProject {
  return {
    id,
    hubId,
    status: 'draft',
    metadata: { title },
    goal: {
      outcomeGoals: [
        {
          outcomeSpecId: 'outcome-1',
          target: 1.33,
        },
      ],
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt,
  };
}

function makeHub(project?: ImprovementProject): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1714000000000,
    deletedAt: null,
    outcomes: [
      {
        id: 'outcome-1',
        hubId: 'hub-1',
        columnName: 'First pass yield',
        characteristicType: 'largerIsBetter',
        target: 98,
        createdAt: 1714000000000,
        deletedAt: null,
      },
    ],
    ...(project ? { improvementProject: project } : {}),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
});

describe('ImprovementProjectPanel (PWA)', () => {
  it('auto-creates a draft improvement project and renders the form when the active hub has no live projects', async () => {
    render(<ImprovementProjectPanel activeHub={makeHub()} onBack={vi.fn()} />);

    await waitFor(() => expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1));
    expect(pwaHubRepository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'IMPROVEMENT_PROJECT_CREATE',
        hubId: 'hub-1',
        project: expect.objectContaining({
          hubId: 'hub-1',
          status: 'draft',
          metadata: expect.objectContaining({ title: 'Improve First pass yield' }),
          goal: expect.objectContaining({
            outcomeGoals: expect.arrayContaining([
              expect.objectContaining({ outcomeSpecId: 'outcome-1', target: 98 }),
            ]),
          }),
        }),
      })
    );

    expect(await screen.findByTestId('improvement-project-form')).toHaveTextContent(
      'Improve First pass yield'
    );
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')).toBeDefined();
    expect(screen.getByRole('button', { name: /back to frame/i })).toBeInTheDocument();
  });

  it('renders the form directly when the hub has an existing live project (1:1 — no picker)', async () => {
    const project = makeProject('ip-1', 'hub-1', 'Reduce rework');

    render(<ImprovementProjectPanel activeHub={makeHub(project)} onBack={vi.fn()} />);

    expect(pwaHubRepository.dispatch).not.toHaveBeenCalled();
    expect(await screen.findByTestId('improvement-project-form')).toHaveTextContent(
      'Reduce rework'
    );
  });

  it('opens Wall from linked lineage and stores the Improvement Project return target', async () => {
    const onOpenWall = vi.fn();
    const project = makeProject('ip-1', 'hub-1', 'Reduce rework');
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      hypotheses: [
        {
          id: 'h-1',
          name: 'Nozzle wear',
          status: 'evidenced',
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
          synthesis: '',
          // IM-1 (ADR-085): `questionIds` was removed from Hypothesis. findingIds is the link.
          findingIds: [],
          investigationId: 'inv-1',
        },
      ],
    });

    render(
      <ImprovementProjectPanel
        activeHub={makeHub(project)}
        onBack={vi.fn()}
        onOpenWall={onOpenWall}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Nozzle wear' }));

    expect(onOpenWall).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY) ?? '')).toEqual(
      expect.objectContaining({
        sourceSurface: 'improvement-project',
        params: { projectId: 'ip-1', targetKind: 'hypothesis', targetId: 'h-1' },
        uiState: { section: 'lineage' },
      })
    );
  });
});
