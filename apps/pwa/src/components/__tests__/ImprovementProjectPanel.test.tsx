import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { Hypothesis } from '@variscout/core/findings';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { UseImprovementProjectPanelModelReturn } from '@variscout/hooks';
import { useImprovementProjectPanelModel } from '@variscout/hooks';
import ImprovementProjectPanel from '../ImprovementProjectPanel';
import { pwaHubRepository } from '../../persistence';

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    ImprovementProjectForm: (props: {
      metadataProps?: {
        title?: string;
        onTitleChange?: (title: string) => void;
      };
      goalProps?: { outcomeOptions?: { id: string }[] };
      backgroundProps?: { onManualNarrativeChange?: (value: string) => void };
      lineageProps?: {
        hypotheses?: { id: string; name: string }[];
        onNavigate?: (target: { kind: 'hypothesis'; id: string }) => void;
      };
    }) =>
      React.createElement(
        'section',
        { 'data-testid': 'improvement-project-form' },
        React.createElement('h3', null, props.metadataProps?.title ?? 'Untitled'),
        React.createElement('p', null, `Outcomes ${props.goalProps?.outcomeOptions?.length ?? 0}`),
        React.createElement(
          'button',
          { type: 'button', onClick: () => props.metadataProps?.onTitleChange?.('Updated') },
          'Rename'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => props.backgroundProps?.onManualNarrativeChange?.('Updated narrative'),
          },
          'Update background'
        ),
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

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useImprovementProjectPanelModel: vi.fn(),
  };
});

vi.mock('../../persistence', () => ({
  pwaHubRepository: {
    dispatch: vi.fn(),
  },
}));

const mockUseImprovementProjectPanelModel = vi.mocked(useImprovementProjectPanelModel);

function makeHub(): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1_714_000_000_000,
    deletedAt: null,
  };
}

function makeOutcome(): OutcomeSpec {
  return {
    id: 'outcome-1',
    hubId: 'hub-1',
    columnName: 'First pass yield',
    characteristicType: 'largerIsBetter',
    target: 98,
    createdAt: 1_714_000_000_000,
    deletedAt: null,
  };
}

function makeProject(): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'draft',
    metadata: { title: 'Reduce rework' },
    goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
  };
}

function makeHypothesis(): Hypothesis {
  return {
    id: 'h-1',
    name: 'Nozzle wear',
    status: 'evidenced',
    synthesis: '',
    findingIds: [],
    investigationId: 'inv-1',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  };
}

function makeModel(
  overrides: Partial<UseImprovementProjectPanelModelReturn> = {}
): UseImprovementProjectPanelModelReturn {
  return {
    projects: [],
    selectedProject: null,
    outcomes: [],
    hypotheses: [],
    findings: [],
    error: null,
    heading: 'Paint line',
    selectProject: vi.fn(),
    updateSelectedProject: vi.fn(),
    handleLineageNavigate: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseImprovementProjectPanelModel.mockReturnValue(makeModel());
});

describe('ImprovementProjectPanel (PWA)', () => {
  it('passes the app repository and open-wall callback into the shared model hook', () => {
    const activeHub = makeHub();
    const onOpenWall = vi.fn();

    render(
      <ImprovementProjectPanel activeHub={activeHub} onBack={vi.fn()} onOpenWall={onOpenWall} />
    );

    expect(mockUseImprovementProjectPanelModel).toHaveBeenCalledWith({
      activeHub,
      repository: pwaHubRepository,
      onOpenWall,
    });
    expect(screen.getByText('Paint line')).toBeInTheDocument();
  });

  it('renders model state and forwards representative form callbacks', () => {
    const updateSelectedProject = vi.fn();
    const handleLineageNavigate = vi.fn();
    mockUseImprovementProjectPanelModel.mockReturnValue(
      makeModel({
        projects: [makeProject()],
        selectedProject: makeProject(),
        outcomes: [makeOutcome()],
        hypotheses: [makeHypothesis()],
        updateSelectedProject,
        handleLineageNavigate,
      })
    );

    render(<ImprovementProjectPanel activeHub={makeHub()} onBack={vi.fn()} />);

    expect(screen.getByTestId('improvement-project-form')).toHaveTextContent('Reduce rework');
    expect(screen.getByTestId('improvement-project-form')).toHaveTextContent('Outcomes 1');

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update background' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nozzle wear' }));

    expect(updateSelectedProject).toHaveBeenCalledWith({ metadata: { title: 'Updated' } });
    expect(updateSelectedProject).toHaveBeenCalledWith({
      sections: { background: { manualNarrative: 'Updated narrative' } },
    });
    expect(handleLineageNavigate).toHaveBeenCalledWith({ kind: 'hypothesis', id: 'h-1' });
  });
});
